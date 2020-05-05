const jwt = require('jsonwebtoken')

module.exports = function login(data) {
	const token = jwt.sign(data, process.env.JWT_SECRET)
	return { ...data, token }
}
