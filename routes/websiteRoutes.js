const {Router}= require("express")
const { websiteAgent, saveContent, updateComponentCode } = require("../controller/websiteController")

const websiteRouter= Router()

websiteRouter.post("/", websiteAgent)
websiteRouter.post('/save', saveContent)
websiteRouter.post("/update", updateComponentCode)

module.exports={websiteRouter}