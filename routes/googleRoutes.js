const {Router}= require("express")
const { getURL,getCallback, getFiles, uploadFile } = require("../google/googleAuth")
const multer = require("multer")

const upload = multer({ 
  dest: 'uploads/',
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});



const googleRouter= Router()


googleRouter.get("/google", getURL)
googleRouter.get("/google/callback", getCallback)
googleRouter.post("/api/files", getFiles)
googleRouter.post("/add", upload.single('file') , uploadFile)
module.exports={googleRouter}