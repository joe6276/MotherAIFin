const {Router}= require("express")
const { getURL,getCallback, getFiles } = require("../google/googleAuth")

const googleRouter= Router()


googleRouter.get("/google", getURL)
googleRouter.get("/google/callback", getCallback)

googleRouter.post("/api/files", getFiles)

module.exports={googleRouter}