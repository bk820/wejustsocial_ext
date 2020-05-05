const express = require('express')
const passport = require('passport')
const logins = require('./logins')
const I18n = require('../i18n')

module.exports = class AbstractAuthentication {
	/**
	 * @constructor
	 * @param {object} dataAccess - Cerberus data access instance
	 * @param {object} models - Cerberus models
	 * @param {string} name - Strategy name
	 */
	constructor(dataAccess, models, name) {
		this._name = name
		this._dataAccess = dataAccess
		this._models = models
		this._router = express.Router()
	}

	/**
	 * Build authentication login route logic
	 */
	_buildLoginRoute() {
		this._router.post('/', (req, res) => {
			passport.authenticate(this._name, { session: false }, (err, user) => {
				if (err || !user) {
					return res.status(400).json({ message: new I18n('ERROR_AUTH_BADCREDENTIALS').toString() })
				}

				req.login(user, { session: false }, async (loginErr) => {
					if (loginErr) {
						return res.status(500).send(loginErr)
					}

					const data = { userId: user.id || user._id }
					if (!logins[process.env.AUTH_STRATEGY]) {
						return res.status(500).json({
							message: new I18n('ERROR_AUTH_UNRECOGNIZED_LOGINSTRATEGY',
								{},
								process.env.AUTH_STRATEGY),
						})
					}
					return res.status(201).json(logins[process.env.AUTH_STRATEGY](data))
				})

				return res
			})(req, res)
		})
	}

	/**
	 * Build authentication info route logic
	 */
	_buildAuthRoute() {
		this._router.get('/', passport.authenticate(this._name, { session: false }), (req, res) => {
			res.json(req.user)
		})
	}

	/**
	 * Return Passport strategy
	 * @return {object} - Strategy instance
	 */
	getStrategy() {
		throw new Error('method getStrategy must be overriden')
	}

	/**
	 * Return auth router
	 * @return {object} - Express router
	 */
	getRouter() {
		return this._router
	}

	/**
	 * Return authentication name
	 * @return {string} - Authentication name
	 */
	getName() {
		return this._name
	}
}
