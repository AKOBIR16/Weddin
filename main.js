const express = require("express");
const mongoose = require("mongoose");
const app = express();
const {PORT} = require("./dotenv")
const {DATABASE_URL} = require("./dotenv")
const userRoute = require("./routes/user")
app.use(express.json())
app.use("/app",userRoute)
mongoose.connect(DATABASE_URL,{useNewUrlParser:true,
    useUnifiedTopology:true},(err) => {
     if(err){
         console.log(err)
     }
     else{
         console.log("Succesful connected to mongodb")
     }
})

app.listen(PORT,() =>{
    console.log(`${PORT} listening..`)
})