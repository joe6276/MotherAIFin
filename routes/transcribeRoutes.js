
const {Router}= require("express")
const multer = require("multer");
const { transcribeAudio } = require("../controller/transcribeController");


const upload = multer({ storage: multer.memoryStorage() }); // file in memory

const transcribeRouter= Router()

transcribeRouter.post("", upload.single("audio") , transcribeAudio)

module.exports={transcribeRouter}
