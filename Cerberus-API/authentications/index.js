// @TODO - Use it like models and controllers instead, should not have default authentication.
// Each extension should explicitly set a default authentication login and recoginition
const LocalAuthentication = require('./local')
const JwtAuthentication = require('./jwt')

module.exports = [
	LocalAuthentication,
	JwtAuthentication,
]
