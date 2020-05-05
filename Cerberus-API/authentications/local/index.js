const { Strategy } = require('passport-local')
const CryptoUtility = require('../../utilities/crypto')
const AbstractAuthentication = require('../abstract')

module.exports = class LocalAuthentication extends AbstractAuthentication {
	/**
	 * @constructor
	 * @param {object} dataAccess - Cerberus data access instance
	 * @param {object} models - Cerberus models
	 */
	constructor(dataAccess, models) {
		super(dataAccess, models, 'local')
		this._buildLoginRoute()
	}

	/**
	 * Return Passport strategy
	 * @return {object} - Strategy instance
	 */
	getStrategy() {
		return new Strategy({
			usernameField: 'email',
			passwordField: 'password',
		}, (email, password, next) => this._dataAccess.search(this._models.user, {
			filters: { email },
			limit: 1,
		})
			.then((users) => {
				const user = users.length ? users[0] : null
				if (!user) {
					return next(null, false)
				}

				return CryptoUtility.compareToHash(password, user.password).then((isSame) => {
					if (!isSame) {
						return next(null, false)
					}
					return next(null, user)
				})
			}).catch((err) => {
				next(err)
			}))
	}
}
