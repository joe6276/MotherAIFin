const {Router}= require("express")
const { seoAgent } = require("../controller/seoController")


const seoRouter= Router()


seoRouter.post("/", seoAgent)

module.exports={seoRouter}