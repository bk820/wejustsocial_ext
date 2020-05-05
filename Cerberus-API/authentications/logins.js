const JwtLogin = require('./jwt/login')

// Login strategies (@TODO - Use better word, not login strategies)
module.exports = {
	jwt: JwtLogin,
}
