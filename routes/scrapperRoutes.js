const { Router} = require('express')
const { getScrapped, getDetailedScrapped, getContacts, scrapByKeyword } = require('../controller/scrapperController')



const scrapperRouter = Router()

scrapperRouter.post("", getScrapped)
scrapperRouter.post("/detailed", getDetailedScrapped)
scrapperRouter.post("/keywords", scrapByKeyword)
scrapperRouter.post("/contacts", getContacts)


module.exports={scrapperRouter}