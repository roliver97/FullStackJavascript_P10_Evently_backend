const jwt = require('jsonwebtoken')

const generateToken = (user_id) => {
  return jwt.sign({ user_id }, process.env.JWT_SECRET, { expiresIn: '1d' })
}

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET)
}

module.exports = { generateToken, verifyToken }
