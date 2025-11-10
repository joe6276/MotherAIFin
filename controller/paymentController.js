const path = require("path")
const dotenv = require("dotenv")
dotenv.config({ path: path.resolve(__dirname, "../.env") })
const sql = require("mssql");
const { sqlConfig } = require("../config");

async function stripePayment(payment) {
    const options = {
        success_url: payment.successURL,
        cancel_url: payment.cancelURL,
        mode: "payment",
        line_items: []
    };

    const sessionLineItem = {
        price_data: {
            unit_amount: Math.round(payment.amount * 100),
            currency: "usd",
            product_data: {
                name: "Mother AI Subscription"
            }
        },
        quantity: 1
    };

    options.line_items.push(sessionLineItem);

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create(options);

    const pays = {
        amount: payment.amount,
        stripeSessionId: session.id,
        userId: payment.email,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };

    await updateStripeSessionId(session.id, payment.email)

    const paymentResponse = {
        stripeSessionId: session.id,
        url: session.url
    };

    return paymentResponse;
}




async function validatePayment(stripeSessionId) {


    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    // Get the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(stripeSessionId);


    const paymentIntentId = session.payment_intent;

    if (!paymentIntentId) {
        return false;
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === "succeeded") {
        const payId = paymentIntent.id;
        await updatePaymentIntent(stripeSessionId, payId)
        return true;
    }


    return false;
}

async function updateStripeSessionId(stripeSessionId, email) {
    try {


        const pool = await sql.connect(sqlConfig)
        await pool.request()
            .input('Email', sql.NVarChar, email)
            .input('StripeSessionId', sql.NVarChar, stripeSessionId)
            .query(`
    UPDATE Subscriptions
    SET StripeSessionId = @StripeSessionId
    WHERE Email = @Email
  `);



    } catch (error) {


        throw new Error(error.messsage)
    }
}



async function updatePaymentIntent(stripeSessionId, paymentIntentId) {
    try {
        const pool = await sql.connect(sqlConfig)
        await pool.request()
            .input('StripeSessionId', sql.NVarChar, stripeSessionId)
            .input('PaymentIntentId', sql.NVarChar, paymentIntentId)
            .query(`
    UPDATE Subscriptions
    SET PaymentIntentId = @PaymentIntentId
    WHERE StripeSessionId = @StripeSessionId
  `);
    } catch (error) {
        throw new Error(error.messsage)
    }
}





const samplePayment = {
    amount: 29.99,                    // Payment amount in dollars
    successURL: "https://yourdomain.com/payment/success",
    cancelURL: "https://yourdomain.com/payment/cancel",
    email: "jonathan@gmail.com"              // Your user identifier
};


async function addPayment(req, res) {
    try {

        const { amount, successURL, cancelURL, email } = req.body
        const samplePayment = {
            amount,
            successURL,
            cancelURL,
            email
        }
        const response = await stripePayment(samplePayment)
        return res.status(200).json(response)
    } catch (error) {
        return res.status(500).json(error.messsage)
    }
}

async function validateStripePayment(req, res) {
    try {
        const { stripeSessionId } = req.body

        var response = await validatePayment(stripeSessionId)
        return res.status(200).json({ response })
    } catch (error) {
        return res.status(500).json(error.messsage)
    }
}


async function checkSubscription(userId) {
    try {
        const pool = await sql.connect(sqlConfig);

        const result = await pool.request()
            .input('UserID', sql.Int, userId)
            .query(`
        SELECT * FROM Subscriptions
        WHERE UserId = @UserID
    `);

        const user = result.recordset[0];
        const now = new Date();
      
        if(user ==undefined){
            return false
        }
        if(now > user.ExpiryDate){
            return false
            
        }else{
            return true
        }

    } catch (error) {
        console.log(error);
        return false
    }
}





module.exports = { addPayment, validateStripePayment, checkSubscription }