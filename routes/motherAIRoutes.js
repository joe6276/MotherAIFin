const { Router} = require("express")
const { motherAIExample } = require("../controller/motherAiController")

const motherAiRouter= Router()


motherAiRouter.post("", motherAIExample )


module.exports={motherAiRouter}