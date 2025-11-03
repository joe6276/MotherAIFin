const { Router}= require("express")
const { chooseAgent } = require("../controller/automationController")

const automationRouter = Router()


automationRouter.post("/", chooseAgent)


module.exports={automationRouter}