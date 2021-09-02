const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
    fullName:{
        type:String,
        required:true,
        trim:true
    },
    birth:{
        type:Date,
        required:true,
    },
    isMale:{
        type:Boolean,
        required:true
    },
    region:{
        type:String,
        required:true,
        trim:true
    },
    district:{
        type:String,
        required:true,
        trim:true
    },
    phoneNumber:{
        type:Number,
        required:true
    },
    password:{
        type:String
    },
    token:{
        type:String
    }
})

const userModel = mongoose.model("Foydalanuvchi",userSchema)
module.exports = userModel;