const {Router}=require("express")
const { conversationalist } = require("../controller/conversationController")
const multer = require("multer");


const convoRouter = Router()
const upload = multer({ storage: multer.memoryStorage() }); // file in memory


convoRouter.post("/", upload.single("audio"),conversationalist)


module.exports={convoRouter}
