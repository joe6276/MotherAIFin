const {Router}= require("express")
const { websiteAgent, saveContent } = require("../controller/websiteController")

const websiteRouter= Router()

websiteRouter.post("/", websiteAgent)
websiteRouter.post('/save', saveContent)

module.exports={websiteRouter}