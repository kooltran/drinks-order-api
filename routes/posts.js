const router = require('express').Router()
const verify = require('./verifyToken')

router.get('/', verify, (req, res) => {
  res.json({
    posts: {
      title: 'My first post',
      description: "rando data you shouldn't access",
    },
  })
})

module.exports = router
