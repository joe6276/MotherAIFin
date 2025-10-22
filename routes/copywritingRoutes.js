const {Router}= require("express")
const { copyWritingAgent } = require("../controller/copywitingController")

const copyWritingRouter= Router()

copyWritingRouter.post("/", copyWritingAgent)


module.exports={copyWritingRouter}