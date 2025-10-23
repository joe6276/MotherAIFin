const {json}= require("express")
const express = require("express")
const {router}= require ("./routes/index")
const { websiteRouter } = require("./routes/websiteRoutes")
const dotenv=require("dotenv")
const { orchestrationRouter } = require("./routes/orchestartionRoutes")
const { copyWritingRouter } = require("./routes/copywritingRoutes")
const { seoRouter } = require("./routes/seoRouter")
dotenv.config()


const app= express()


app.use(json())
app.use("/users", router)
app.use("/website", websiteRouter)
app.use("/orchestration", orchestrationRouter)
app.use("/copywriting", copyWritingRouter)
app.use("/seo", seoRouter)

app.get("/test", (req,res)=>{
    res.status(200).send("<h1> Hello There !! </h1>")
})

app.listen(process.env.PORT, ()=>{
    console.log("Server is running...")
})
