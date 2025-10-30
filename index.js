const {json}= require("express")
const express = require("express")
const cors= require("cors")

const {router}= require ("./routes/index")
const { websiteRouter } = require("./routes/websiteRoutes")
const dotenv=require("dotenv")
const { orchestrationRouter } = require("./routes/orchestartionRoutes")
const { copyWritingRouter } = require("./routes/copywritingRoutes")
const { seoRouter } = require("./routes/seoRouter")
const { videoRouter } = require("./routes/videoRoutes")
const { transcribeRouter } = require("./routes/transcribeRoutes")
const { motherAiRouter } = require("./routes/motherAIRoutes")
const { imageRouter } = require("./routes/imageRoutes")
const { convoRouter } = require("./routes/conversationRoutes")
dotenv.config()


const app= express()
app.use(json())
app.use(cors())
app.use("/users", router)
app.use("/website", websiteRouter)
app.use("/orchestration", orchestrationRouter)
app.use("/copywriting", copyWritingRouter)
app.use("/seo", seoRouter)
app.use("/video", videoRouter)
app.use("/transcribe", transcribeRouter)
app.use("/motherAI", motherAiRouter)
app.use("/image", imageRouter)
app.use("/convo", convoRouter)


app.get("/test", (req,res)=>{
    res.status(200).send("<h1> Hello There Changes!!!! </h1>")
})

app.listen(process.env.PORT, ()=>{
    console.log("Server is running...")
})
