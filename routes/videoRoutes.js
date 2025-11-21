const {Router}= require("express")
const {  genVideo, genSingleVideo, getScenes, addAudio } = require("../controller/videoController")

const videoRouter = Router()


videoRouter.post("/", genSingleVideo)
videoRouter.post("/scenes", getScenes )
videoRouter.post("/all", genVideo)
videoRouter.post("/addAudio", addAudio)

module.exports={videoRouter}