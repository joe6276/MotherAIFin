const {Router}= require("express")
const { seoAgent, seoArticles, seoWebsites } = require("../controller/seoController")


const seoRouter= Router()


seoRouter.post("/", seoAgent)
seoRouter.post("/articles", seoArticles)
seoRouter.post("/website", seoWebsites)

module.exports={seoRouter}