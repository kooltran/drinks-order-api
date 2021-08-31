const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const multer = require('multer')
const verify = require('./verifyToken')

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, new Date().toISOString() + file.originalname)
  },
})

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true)
  } else {
    cb(null, false)
  }
}

const upload = multer({
  storage: storage,
  limits: {
    fieldSize: 1024 * 1024 * 5,
  },
  fileFilter: fileFilter,
})

const Product = require('../model/Product')

router.get('/', async (req, res, next) => {
  try {
    const products = await Product.find()
      .select('name price _id productImage')
      .exec()
    res.status(200).json(products)
  } catch (error) {
    res.status(500).json({ error: error })
  }
})

router.post(
  '/',
  verify,
  upload.single('productImage'),
  async (req, res, next) => {
    const product = new Product({
      _id: new mongoose.Types.ObjectId(),
      name: req.body.name,
      price: req.body.price,
      productImage: req.file.path,
    })

    try {
      const savedProduct = await product.save()

      res.status(201).json({
        message: 'Handling POST requests to /products',
        product: savedProduct,
      })
    } catch (error) {
      res.status(500).json({ error: error })
    }
  }
)

router.get('/:productId', async (req, res, next) => {
  const id = req.params.productId
  try {
    const foundedProduct = await Product.findById(id)
      .select('name price _id productImage')
      .exec()

    if (foundedProduct) {
      res.status(200).json(foundedProduct)
    } else {
      res.status(404).json({ message: 'No valid entry found for provided ID' })
    }
  } catch (error) {
    res.status(500).json({ error: error })
  }
})

router.patch('/:productId', async (req, res, next) => {
  const id = req.params.productId
  const updateOps = {}

  for (const ops of req.body) {
    updateOps[ops.propName] = ops.value
  }

  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      { _id: id },
      { $set: updateOps },
      { new: true }
    ).populate('product')

    res.status(200).json(updatedProduct)
  } catch (error) {
    res.status(500).json({ error: error })
  }
})

router.delete('/:productId', async (req, res, next) => {
  const id = req.params.productId
  try {
    const removedProduct = await Product.findByIdAndDelete({
      _id: id,
    }).populate('product')

    res.status(200).json(removedProduct)
  } catch (error) {
    res.status(500).json({ error: error })
  }
})

module.exports = router
