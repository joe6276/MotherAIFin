const {Router}= require("express")
const { uploadAnImage } = require("../controller/imageController");
const imageRouter = Router()



imageRouter.post("/", uploadAnImage)


module.exports={imageRouter}