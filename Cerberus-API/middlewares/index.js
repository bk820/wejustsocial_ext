const bodyParser = require('body-parser')
const methodOverride = require('method-override')
const pretty = require('express-prettify')
const passport = require('passport')
const cors = require('cors')
const roles = require('./roles')
const queryParser = require('./query-parser')
const https = require('./https')

module.exports = [
	bodyParser.urlencoded({ extended: true }),
	bodyParser.json(),
	methodOverride(),
	pretty({ always: true }),
	passport.initialize(),
	roles.middleware(),
	cors(),
	queryParser(),
	https(),
]
