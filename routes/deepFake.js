const  multer =require("multer");
const {Router}= require("express");
const { uploadoneImage, generateLipSync } = require("../controller/deepFake");

const deepFakeRouter= Router()

const upload = multer({ storage: multer.memoryStorage() });


deepFakeRouter.post("/upload-image", upload.single("image"), uploadoneImage)
deepFakeRouter.post("/video", generateLipSync)

module.exports= {deepFakeRouter}