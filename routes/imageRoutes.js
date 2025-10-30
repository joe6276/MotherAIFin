const {Router}= require("express")
const multer = require("multer");
const { uploadAnImage } = require("../controller/imageController");
const imageRouter = Router()


const upload = multer(); // file in memory

imageRouter.post("/",upload.single("image"), uploadAnImage)


module.exports={imageRouter}