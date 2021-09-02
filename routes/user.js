const express = require("express")
const mongoose = require("mongoose")
const path = require("path")
const userModel = require("../models/user")
const {check,validationResult} = require("express-validator")
const Nexmo = require("nexmo")
const {apiKey,apiSecret,TOKEN_KEY} = require("../dotenv")
const { Router } = require("express")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt");
const app = express()
const nexmo = new Nexmo({
    apiKey: apiKey,
    apiSecret: apiSecret
  });
app.get("/register",(req,res) =>{
    res.sendFile("view/register.html",{root:__dirname},(err) =>{
        if(err){console.log(err)}
        else{console.log("send register.html")}
    })
})
app.post("/register",[
      check("fullName").notEmpty().withMessage("Ism bo'sh bo'lmasligi kerak"),
      check("birth").notEmpty().withMessage("Tug'ilgan kun bo'sh bo'lmasligi kerak").isDate(),
      check("region").notEmpty().withMessage("viloyat bo'sh bo'lmasligi kerak").isAlpha(),
      check("district").notEmpty().withMessage("tuman bo'sh bo'lmasligi kerak").isAlpha(),
      check("phoneNumber").notEmpty().withMessage("Telefon raqam bo'lishi kerak").isNumeric(),
      check("isMale").notEmpty().withMessage("Shahsni belgilang").isBoolean()
],async (req,res) =>{
      const {fullName,birth,region,isMale,district,phoneNumber} = req.body
      const phone = await userModel.find({phoneNumber:phoneNumber})
     
       if(phone.length != 0){
           res.status(401).json({message:"Bu telefon nomer oldin ruyhatdan olingan"});
       }
      const errors = validationResult(req);
      if(!errors.isEmpty()){
          res.status(401).json({error:errors})
         // res.sendFile("view/register.html",{root:__dirname})
      }else{
          const user = new userModel({
              fullName,
              birth,
              region,
              district,
              phoneNumber,
              isMale
          })
          
         nexmo.verify.request({number:phoneNumber,brand:"Nima"},async (err,result)=>{
               if(err){
                   res.status(500).json({errorMessage:"Server error"})
               }else{
                    const requestId = result.request_id
                    if(result.status == 0){
                        res.status(200).send({requestId:requestId,userId:user._id})
                        await user.save()
                       // res.sendFile("view/verify.html",path.join(__dirname)).json({requestId:requestId,userId:user._id})
                    }else{
                        res.status(401).send(result.error_text)
                    }
               }

          })
      }

})
app.get("/verify",(req,res)=>{
    res.sendFile("view/verify.html",path.join(__dirname),(err) =>{
        if(err){console.log(err)}
        else{console.log("send verify.html")}
    })
})
app.post("/verify",(req,res) => {
    const code = req.body.code;
    const requestId = req.body.requestId;
    const userId = req.body.userId
    nexmo.verify.check({request_id:requestId,code:code},(err,result) =>{
        console.log(err)
        if(err){
            res.status(500).send(err)
        }else{
            console.log(result)
            if(result && result.status == '0'){
                res.sendFile("register.html",{root:__dirname},(err) =>{
                    if(err){console.log(err)}
                    else{console.log("send verify.html")}
                })  //.json({userId:userId,message:"Code verified succesfully"})
            }
            else{res.status(401).send(result.error_text)}
        }
    })
})
app.get("/password",(req,res)=>{
    res.sendFile("view/password.html",path.join(__dirname),(err) =>{
        if(err){console.log(err)}
        else{console.log("send password.html")}
    })   
})
app.post("/password",[
    check("password").isNumeric().withMessage("kod 5 ta sondan iborat bo'lishi kerak").notEmpty().isLength({min:4,max:6}),
    check("confirmPassword").custom(async (confirmPassword, {req}) => {
        const password = req.body.password
        if(password !== confirmPassword){
          throw new Error('kod oldingi kodga mos emas')
        }
      })
]
,async (req,res) =>{
    const {password,confirmPassword,userId} = req.body
    
    
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        console.log(errors.errors)
        res.status(404).send(errors.errors)
       // res.sendFile("view/password.html",path.join(__dirname)).json({eror:errors[0].msg})
    }
    else {
        const users = await userModel.findById(userId);
        if(!users){
        res.status(404).send("Bunaqa foydalanuvchi topilmadi")
         }
        const encryptPassword = bcrypt.hash(password,10)
        const token = jwt.sign({user:users},TOKEN_KEY,{expiresIn:"2h"});
        users.password = encryptPassword.toString();
        users.token = token;
        await  users.save();
        res.status(200).send("now you have token");
        //res.sendFile("view/home.html",path.join(__dirname)).json({user:users});
    }
})
app.get("/login",(req,res) =>{
    res.send("Bironta fayl yuboriladi")
})
app.post("/login",[
    check("phoneNumber").notEmpty().withMessage("Telefon nomer bulishi kerak").isNumeric().withMessage("Telefon nomer tuli yozilishi shart").custom((async(phoneNumber,{req}) =>{
        if(phoneNumber.length != 12){
            throw new Error("Telefon nomer bo'lishi kerak")
        }
    })),
    check("password").notEmpty().withMessage("Kod o'rni bo'sh bo'lmasligi kerak").isNumeric().withMessage("Kod raqamdan iborat bo'lishi kerak")
],async(req,res)=>{
    const {phoneNumber,password} = req.body
   
    const errors =  validationResult(req);
    if(!errors.isEmpty()){
        res.status(404).send(errors.errors[0].msg)
       // res.sendFile("view/password.html",path.join(__dirname)).json({eror:errors[0].msg})
    }else{
    const user = await userModel.findOne({phoneNumber:phoneNumber})
    if(!user){
        res.status(404).send("Bunday foydalanuvchi topilmadi")
    }
    let hash = bcrypt.hash(password,10);
    hash = (await hash).toString()
    const code = await bcrypt.compare(hash,user.password)
    console.log(code)
        if(!code){
            res.send('Kod xato kiritildi')
        }
        else{
            const token = jwt.sign({user:user},TOKEN_KEY,{expiresIn:"2h"})
             user.token = token
             await user.save()
             res.status(200).send("Siz muvaffaqiyatli o'tdingiz")
        }
    }
       
})

module.exports = app