const dotenv = require("dotenv")
dotenv.config();
module.exports.PORT = process.env.PORT
module.exports.DATABASE_URL = process.env.DATABASE_URL
module.exports.apiKey = process.env.API_KEY
module.exports.apiSecret = process.env.API_SECRET
module.exports.TOKEN_KEY = process.env.TOKEN_KEY