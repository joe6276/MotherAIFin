const {Router}= require('express')
const { addPayment, validateStripePayment, checkSub } = require('../controller/paymentController')

const paymentRouter = Router()


paymentRouter.post("/add", addPayment)
paymentRouter.post("/validate", validateStripePayment)
paymentRouter.post("/sub", checkSub)

module.exports={paymentRouter}
