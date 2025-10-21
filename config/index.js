const dotenv = require("dotenv")
const path = require("path")
dotenv.config({path: path.resolve(__dirname,"../.env")})


const sqlConfig = {
  user: process.env.DB_USER, 
  password: process.env.DB_PWD ,
  database: process.env.DB_NAME ,
  server: process.env.SERVER ,
  connectionTimeout: 30000, 
  requestTimeout: 30000,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  options: {
    encrypt: true,
    trustServerCertificate: false 
  }
}


module.exports={sqlConfig}