const {Router}= require('express')
const { addPayment, validateStripePayment } = require('../controller/paymentController')

const paymentRouter = Router()


paymentRouter.post("/add", addPayment)
paymentRouter.post("/validate", validateStripePayment)

module.exports={paymentRouter}
