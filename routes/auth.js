const router = require('express').Router()
const User = require('../model/User')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const {
  registerValidation,
  loginValidation,
} = require('../validation/validation')

let refreshTokens = []

const generateAccessToken = user => {
  return jwt.sign({ _id: user._id }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: '24h',
  })
}

router.get('/', async (req, res) => {
  try {
    const users = await User.find()
    res.status(200).json(users)
  } catch (err) {
    res.status(500).json({ error: err })
  }
})

//Renew access token
router.post('/token', async (req, res) => {
  const refreshToken = req.cookies.refreshToken
  console.log(refreshToken, 'refreshToken')
  console.log(refreshTokens, 'refreshTokenssssss')
  if (!refreshToken) return res.sendStatus(401)
  if (!refreshTokens.includes(refreshToken))
    return res.status(403).json({ error: 'Token not found' })

  try {
    const verify = await jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET
    )
    req.user = verify
    console.log(req.user, 'user')
    const accessToken = generateAccessToken(req.user)
    console.log(accessToken, 'accessToken')
    res.clearCookie('accessToken').clearCookie('authSession')
    res
      .status(200)
      .cookie('accessToken', accessToken, {
        expires: new Date(new Date().getTime + 24 * 3600),
        sameSite: 'strict',
        httpOnly: true,
      })
      .cookie('authSession', true, {
        expires: new Date(new Date().getTime + 24 * 3600),
      })
  } catch (error) {
    return res.status(403).send(error.message)
  }
})

//LOGOUT
router.get('/logout', (req, res) => {
  refreshTokens = refreshTokens.filter(token => token !== req.body.token)
  res
    .clearCookie('refreshToken')
    .clearCookie('accessToken')
    .clearCookie('authSession')
    .send('User logged out')
})

//REGISTER
router.post('/register', async (req, res) => {
  const { error } = registerValidation(req.body)

  if (error) return res.status(400).send(error.details[0].message)

  //Checking if the user is already in the database
  const emailExist = await User.findOne({ email: req.body.email })

  if (emailExist)
    return res.status(200).send({ error_message: 'Email already exist' })

  //Hash password
  const salt = await bcrypt.genSalt(10)
  const hashPassword = await bcrypt.hash(req.body.password, salt)

  const user = new User({
    name: req.body.name,
    email: req.body.email,
    password: hashPassword,
  })

  try {
    const savedUser = await user.save()

    res.status(200).send({ user: savedUser._id })
  } catch (err) {
    res.status(400).send(err)
  }
})

//LOGIN
router.post('/login', async (req, res) => {
  const { error } = loginValidation(req.body)
  console.log(error, 'error')
  if (error) return res.status(400).send(error.details[0].message)

  //Checking if the email is already in the database
  const user = await User.findOne({ email: req.body.email })

  if (!user)
    return res.status(200).send({ error_message: 'Email is not found' })

  //Password is correct
  const validPwd = await bcrypt.compare(req.body.password, user.password)
  if (!validPwd)
    return res.status(200).send({ error_message: 'Invalid password' })

  //Create and assign a token
  const accessToken = generateAccessToken(user)
  const refreshToken = jwt.sign(
    { _id: user._id },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: '10d',
    }
  )

  refreshTokens.push(refreshToken)

  res
    .status(200)
    .cookie('accessToken', accessToken, {
      expires: new Date(new Date().getTime + 30 * 1000),
      sameSite: 'strict',
      httpOnly: true,
    })
    .cookie('authSession', true, {
      expires: new Date(new Date().getTime + 30 * 1000),
    })
    .cookie('refreshToken', refreshToken, {
      expires: new Date(new Date().getTime + 3600 * 1000),
      sameSite: 'strict',
      httpOnly: true,
    })

  // res.header('auth-token', accessToken).send({
  //   token: { accessToken, refreshToken },
  //   user,
  // })
  res.json({ success: true, message: 'User loggedIn' })
})

module.exports = router
