const {Router} = require("express")
const { orchestrationAgent } = require("../controller/orchestrationController")


const orchestrationRouter= Router()

orchestrationRouter.post("/", orchestrationAgent)


module.exports={orchestrationRouter}