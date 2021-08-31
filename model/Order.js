const mongoose = require('mongoose')
const moment = require('moment')

const OrderSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  products: [
    {
      _id: false,
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
      quantity: {
        type: Number,
        default: 1,
      },
    },
  ],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: moment().startOf('day'),
  },
  date: {
    type: String,
    required: true,
  },
})

module.exports = mongoose.model('Order', OrderSchema)
