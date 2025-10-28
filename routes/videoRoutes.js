const {Router}= require("express")
const { generateVideo } = require("../controller/videoController")

const videoRouter = Router()


videoRouter.post("/", generateVideo)


module.exports={videoRouter}