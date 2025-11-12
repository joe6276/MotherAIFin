const { Router} = require('express')
const { getScrapped, getDetailedScrapped } = require('../controller/scrapperController')


const scrapperRouter = Router()

scrapperRouter.post("", getScrapped)
scrapperRouter.post("/detailed", getDetailedScrapped)

module.exports={scrapperRouter}