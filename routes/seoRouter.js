const {Router}= require("express")
const { seoAgent, seoArticles, seoWebsites, updateSeoWebsites } = require("../controller/seoController")


const seoRouter= Router()


seoRouter.post("/", seoAgent)
seoRouter.post("/articles", seoArticles)
seoRouter.post("/website", seoWebsites)
seoRouter.put("/", updateSeoWebsites)


module.exports={seoRouter}