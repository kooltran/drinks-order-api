const jwt = require('jsonwebtoken')

module.exports = (req, res, next) => {
  try {
    const accessToken = req.cookies.accessToken
    const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    if (error.message === 'jwt expired') {
      return res.status(401).json({
        error_code: 'TOKEN_EXPIRED',
        message: 'Token was expired',
      })
    }
    return res.status(401).json({
      message: 'Auth failed',
    })
  }
}
