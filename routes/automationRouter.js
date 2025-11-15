const { Router}= require("express")
const { chooseAgent, automationCombiner, autoAutomatter } = require("../controller/automationController")

const automationRouter = Router()


automationRouter.post("/", chooseAgent)
automationRouter.post("/all", automationCombiner)
automationRouter.post("/auto", autoAutomatter)
module.exports={automationRouter}