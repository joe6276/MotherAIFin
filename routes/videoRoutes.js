const {Router}= require("express")
const {  genVideo, genSingleVideo, getScenes } = require("../controller/videoController")

const videoRouter = Router()


videoRouter.post("/", genSingleVideo)
videoRouter.post("/scenes", getScenes )
videoRouter.post("/all", genVideo)


module.exports={videoRouter}