const express = require('express')
const router = express.Router()
const moment = require('moment')

const verify = require('./verifyToken')
const Order = require('../model/Order')
const Product = require('../model/Product')

// Handle incoming GET requests to /orders
router.get('/', verify, async (req, res, next) => {
  try {
    const orders = await Order.findOne({ user: req.user._id })
      .select('products date createdAt')
      .populate('products.product user', 'name email')

    res.status(201).json({
      message: 'get order list successfull',
      data: orders || [],
    })
  } catch (err) {
    res.status(500).json({ error: err })
  }
})

router.post('/', verify, async (req, res, next) => {
  const { quantity, products, date } = req.body
  const user = req.user._id
  try {
    const productFiltered = await Promise.all(
      req.body.products.map(item => {
        return Product.findById(item.product)
      })
    )

    //Check products contain in DB
    const isValidProductOrder = productFiltered.every(item => item)

    if (isValidProductOrder) {
      //Find and update order if it has the same user and date
      const data = await Order.findOneAndUpdate(
        { user, createdAt: moment().startOf('day') },
        {
          quantity,
          products,
          date,
        },
        {
          new: true,
          upsert: true,
        }
      ).populate('products.product user', 'name email')

      res.status(201).json({
        message: 'Order stored',
        createdOrder: {
          _id: data._id,
          products: data.products,
          quantity: data.quantity,
          date: data.date,
          user: data.user,
        },
      })
    } else {
      res.status(201).json({
        message: 'Product not found',
      })
    }
  } catch (err) {
    res.status(500).json({ error: err })
  }
})

router.get('/:orderId', async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .select('product quantity _id')
      .populate('product')

    if (order) {
      res.status(200).json({ order })
    } else {
      res.status(200).json({ message: 'Order not found' })
    }
  } catch (err) {
    res.status(500).json({ error: err })
  }
})

router.delete('/:orderId', async (req, res, next) => {
  try {
    const deletedOrder = await Order.findByIdAndDelete({
      _id: req.params.orderId,
    })

    if (deletedOrder) {
      res.status(200).json({ message: 'Order deleted' })
    } else {
      res.status(200).json({ message: 'Order not found' })
    }
  } catch (err) {
    res.status(500).json({ error: err })
  }
})

module.exports = router
