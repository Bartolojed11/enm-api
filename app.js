const express = require('express')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')

const helmet = require('helmet')
const mongoSanitize = require('express-mongo-sanitize')
const xss = require('xss-clean')
const hpp = require('hpp')

const AppError = require('./handlers/AppError')
const ErrorHandler = require('./handlers/ErrorHandler')

const app = express()

// Global middlewares

// Set security HTTP headers
app.use(helmet())

// morgan > Will log the endpoint on console or terminal and how long a response is sent back
// NODE_ENV is accessible here because it's on server.js and it only needs to run once
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'))
}

const limiter = rateLimit({
    max: 1000,
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests for this IP, please try again in an hour'
})

app.use('/api', limiter)

// it stands between middle of request and response
// express.json() middle ware, adds body to the request containing the request data
app.use(express.json())

app.use(mongoSanitize())
app.use(xss())
app.use(hpp())

app.use((req, res, next) => {
    req.requestTimeout = new Date().toISOString()
    // requestTimout can be accessed using req on any route after this middleware
    next()
    // next() is used here so that it will process the next middlewares
})

// Homepage
app.get('/', (req, res) => {
    res.status(200).send({
        message: "Hello from the home page",
        app: "API"
    })
})

/**
 * routes => mounting routes
 */
const userRouter = require('./routes/v1/userRoutes')
const productRouter = require('./routes/v1/productRoutes')
const categoryRouter = require('./routes/v1/categoryRoutes')
const orderRouter = require('./routes/v1/orderRoutes')
const cartRouter = require('./routes/v1/cartRouter')

app.use('/api/v1/users', userRouter)
app.use('/api/v1/products', productRouter)
app.use('/api/v1/categories', categoryRouter)
app.use('/api/v1/orders', orderRouter)
app.use('/api/v1/cart', cartRouter)

/**
 * Specify unhandle routes
 * .all() means all http methods
 * * means all http verbs
 */
app.all('*', (req, res, next) => {
    next(new AppError(`Can't find route ${req.url} on the server`, 404));
})

app.use(ErrorHandler)

module.exports = app
