const {sqlConfig}= require("../config/index")
const sql = require("mssql")
const bcrypt = require("bcrypt")


async function register(req, res) {
    try {
        const {email, name,password}= req.body
        const hashedPassword = await bcrypt.hash(password, 8)

        const pool = await sql.connect(sqlConfig)
        const result = await pool.request() 
            .input('Email', sql.NVarChar, email)
            .input('Name', sql.NVarChar, name)
            .input('Password', sql.NVarChar, hashedPassword)
            .query('INSERT INTO Users (Email, Name, Password) VALUES (@Email, @Name, @Password)')
            return res.status(200).json({message:"User Registered Successfully"})
    } catch (error) {
      return res.status(500).json({message:error.message})
    }
}


async function login(req, res) {
    try {
        
        const {email, password}= req.body
        // Get Existing User
        const pool = await sql.connect(sqlConfig)
        const existingUSer = await pool.request()
             .input('Email', sql.NVarChar, email)
             .query('SELECT * FROM Users WHERE Email = @Email')

        if(existingUSer){
            const user = existingUSer.recordset[0]
            const isPasswordValid = await bcrypt.compare(password, user.Password)
            if(isPasswordValid){
                const theResult={
                    id: user.Id,
                    email: user.Email,
                    message:"Login Successful"
                }
                return res.status(200).json(theResult)
            }else{
                return res.status(400).json({message:"Invalid Credentials"})
            }
        }else{
            return res.status(404).json({message:"User not found"})
        }
        
        

    } catch (error) {
        return res.status(500).json({message:error.message})
    }
}


module.exports={register,login}