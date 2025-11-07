const { sqlConfig } = require("../config/index")
const sql = require("mssql")
const bcrypt = require("bcrypt")
const crypto = require("crypto")
const { sendEmail } = require("../Emails")

async function register(req, res) {
    try {
        const { email, name, password } = req.body
        const hashedPassword = await bcrypt.hash(password, 8)

        const pool = await sql.connect(sqlConfig)
        const result = await pool.request()
            .input('Email', sql.NVarChar, email)
            .input('Name', sql.NVarChar, name)
            .input('Password', sql.NVarChar, hashedPassword)
            .query('INSERT INTO Users (Email, Name, Password) VALUES (@Email, @Name, @Password)')
        return res.status(200).json({ message: "User Registered Successfully" })
    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}


async function login(req, res) {
    try {

        const { email, password } = req.body
        // Get Existing User
        const pool = await sql.connect(sqlConfig)
        const existingUSer = await pool.request()
            .input('Email', sql.NVarChar, email)
            .query('SELECT * FROM Users WHERE Email = @Email')

        if (existingUSer) {
            const user = existingUSer.recordset[0]
            const isPasswordValid = await bcrypt.compare(password, user.Password)
            if (isPasswordValid) {
                const theResult = {
                    id: user.Id,
                    email: user.Email,
                    message: "Login Successful"
                }
                return res.status(200).json(theResult)
            } else {
                return res.status(400).json({ message: "Invalid Credentials" })
            }
        } else {
            return res.status(404).json({ message: "User not found" })
        }



    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}


async function forgotPassword(req, res) {

    try {
        const { email, url } = req.body
        const pool = await sql.connect(sqlConfig)
        const result = await pool.request()
            .input("Email", sql.NVarChar, email)
            .query("SELECT * FROM Users WHERE Email = @Email");

        const user = result.recordset[0];
        if (!user) {
            return res.status(404).json({ message: "User Not Found" })
        }
        const randomBytes = crypto.randomBytes(24);
        const passwordResetToken = randomBytes.toString("hex");
        const passwordResetExpires = new Date(Date.now() + 3 * 60 * 60 * 1000);

        await pool.request()
            .input("Email", sql.NVarChar, email)
            .input("PasswordResetToken", sql.NVarChar, passwordResetToken)
            .input("PasswordResetExpires", sql.DateTime, passwordResetExpires)
            .query(`
            UPDATE Users
            SET 
            PasswordResetToken = @PasswordResetToken,
            PasswordResetExpires = @PasswordResetExpires
            WHERE Email = @Email
        `);


        const prompt = `
        <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f5f5f5;
            padding: 20px;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .header {
            background-color: #2563eb;
            padding: 30px 40px;
            text-align: center;
        }
        
        .header h1 {
            color: #ffffff;
            font-size: 24px;
            font-weight: 600;
        }
        
        .content {
            padding: 40px;
            color: #333333;
        }
        
        .greeting {
            font-size: 18px;
            margin-bottom: 20px;
            color: #1f2937;
        }
        
        .message {
            font-size: 15px;
            line-height: 1.6;
            color: #4b5563;
            margin-bottom: 30px;
        }
        
        .reset-button {
            display: inline-block;
            background-color: #2563eb;
            color: #ffffff;
            text-decoration: none;
            padding: 14px 32px;
            border-radius: 6px;
            font-size: 16px;
            font-weight: 500;
            margin: 10px 0;
            transition: background-color 0.3s ease;
        }
        
        .reset-button:hover {
            background-color: #1d4ed8;
        }
        
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        
        .expiry-note {
            font-size: 13px;
            color: #6b7280;
            margin-top: 20px;
            font-style: italic;
        }
        
        .ignore-note {
            font-size: 14px;
            color: #6b7280;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
        }
        
        .footer {
            background-color: #f9fafb;
            padding: 30px 40px;
            text-align: center;
            font-size: 13px;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
        }
        
        .footer p {
            margin: 5px 0;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>Password Reset Request</h1>
        </div>
        
        <div class="content">
            <p class="greeting">Hello ${user.Name},</p>
            
            <p class="message">
                We received a request to reset the password for your motherAI account. 
                Click the button below to create a new password.
            </p>
            
            <div class="button-container">
                <a href="${url}${passwordResetToken}" class="reset-button">Reset Password</a>
            </div>
            
            <p class="expiry-note">
                This link expires in three hour for security purposes.
            </p>
            
            <p class="ignore-note">
                If you did not request a password reset, you can safely ignore this email. 
                Your password will remain unchanged.
            </p>
        </div>
        
        <div class="footer">
            <p>This is an automated message, please do not reply to this email.</p>
            <p>&copy; 2025 EMS. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
        `

        const message = {
            from: process.env.EMAIL,
            to: user.Email,
            subject: "MotherAi Forgot Password",
            html: prompt
        }

        await sendEmail(message)

        return res.status(200).json({ message: "Password reset link sent! Please check your email for instructions to reset your password " })


    } catch (error) {
  
        res.status(500).json({ message: error.message })
    }


}

async function resetPassword(req, res) {
    try {
        const { token, password } = req.body
        const pool = await sql.connect(sqlConfig)
        const result = await pool.request()
            .input("Token", sql.NVarChar, token)
            .query("SELECT * FROM Users WHERE PasswordResetToken = @Token");

        const user = result.recordset[0];

        
        if (!user) {
            return res.status(404).json({message:"User Not Found"})
        }

        // 2. Check if token has expired
        const tokenExpiry = new Date(user.PasswordResetExpires);
        const now = new Date();

        

        if (tokenExpiry > now) {
            const hashedPassword = await bcrypt.hash(password, 10);

             await pool.request()
        .input("Email", sql.NVarChar, user.Email)
        .input("Password", sql.NVarChar, hashedPassword)
        .input("PasswordResetToken", sql.NVarChar, "")
        .input("PasswordResetExpires", sql.DateTime, new Date())
        .query(`
          UPDATE Users
          SET 
            Password = @Password,
            PasswordResetToken = @PasswordResetToken,
            PasswordResetExpires = @PasswordResetExpires
          WHERE Email = @Email
        `);


          return res.status(200).json({message:"Password Reset Successfully"})
        }else{
             return res.status(400).json({message:"Token Expired"})
        }
    } catch (error) {
        return res.status(500).json({message: error.message})
    }
}


// async function run() {
//     const res = await forgotPassword('joendambuki16@gmail.com','https://intl-colt.online')



// }

// run()


module.exports = { register, login, forgotPassword, resetPassword }