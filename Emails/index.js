const path = require('path')
const dotenv = require('dotenv')
dotenv.config({ path: path.resolve(__dirname, "../.env") })
const nodemailer=  require("nodemailer")

let config ={
    host:'smtp.gmail.com',
    service:'gmail',
    port:587,
    auth:{
        user:process.env.EMAIL,
        pass:process.env.PASSWORD
    }
}

function createTransporter(config){
 return nodemailer.createTransport(config)
}

async function sendEmail(messageOptions) {
    let transporter = createTransporter(config)
    await transporter.verify()
    await transporter.sendMail( messageOptions, (err, info)=>{
       
        
    })
}


// async function run() {
//     const message= {
//         from: process.env.EMAIL,
//         to: process.env.EMAIL,
//         subject: "Nodemailer Test",
//         html:`<h1> Hello There </h1>`
//     }

//     await sendEmail(message)
// }

// run()


module.exports={sendEmail}