const { Router}= require("express")
const { chooseAgent, automationCombiner } = require("../controller/automationController")

const automationRouter = Router()


automationRouter.post("/", chooseAgent)
automationRouter.post("/all", automationCombiner)

module.exports={automationRouter}