const express = require('express')
const dotenv = require('dotenv')
const app = express()
const mongoose = require('mongoose')
const cors = require('cors')
const cookieParser = require('cookie-parser')

// Import Routes
const authRoute = require('./routes/auth')
const postsRoute = require('./routes/posts')
const ordersRoute = require('./routes/orders')
const productsRouter = require('./routes/products')

app.use(
  cors({
    credentials: true,
    origin: 'http://localhost:3000',
  })
)
app.use(cookieParser())

dotenv.config()
// Connect to DB
mongoose
  .connect(process.env.DB_CONNECTION, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(() => console.log('DB connected'))
mongoose.connection.on('error', err => {
  console.log('DB connection error:', err.message)
})

// Middlewares
app.use(express.json())
app.use('/uploads', express.static('uploads'))
// Route Middlewares
app.use('/api/user', authRoute)
app.use('/api/posts', postsRoute)
app.use('/api/orders', ordersRoute)
app.use('/api/product', productsRouter)

//Handling Errors
app.use((req, res, next) => {
  const error = new Error('Not found')
  error.status = 404
  next(error)
})

app.use((error, req, res, next) => {
  res.status(error.status || 500)
  res.json({
    error: {
      message: error.message,
    },
  })
})

app.listen(4000, () => {
  console.log('Server Up and running on port 4000...')
})
