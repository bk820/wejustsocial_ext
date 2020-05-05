const { Strategy, ExtractJwt } = require('passport-jwt')
const AbstractAuthentication = require('../abstract')

module.exports = class JwtAuthentication extends AbstractAuthentication {
	/**
	 * @constructor
	 * @param {object} dataAccess - Cerberus data access instance
	 * @param {object} models - Cerberus models
	 */
	constructor(dataAccess, models) {
		super(dataAccess, models, 'jwt')
		this._buildAuthRoute()
	}

	/**
	 * Return Passport strategy
	 * @return {object} - Strategy instance
	 */
	getStrategy() {
		// @TODO - Refactor function to be generic
		return new Strategy({
			secretOrKey: process.env.JWT_SECRET,
			// issuer: DEFAULT_JWT_ISSUER,
			// audience: DEFAULT_JWT_AUDIENCE,
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
		}, (JWTPayload, next) => this._dataAccess.get(this._models.user, JWTPayload.userId)
			.then((user) => {
				if (user) {
					return this._dataAccess.get(this._models.role, user.role).then((role) => {
						if (!role) {
							return next(null, false)
						}

						return next(null, {
							id: user.id || user._id,
							skipOwnership: role.skipOwnership,
							skipRestrictions: role.skipRestrictions,
							permissions: role.permissions,
						})
					})
				}
				return next(null, false)
			}).catch(err => next(err)))
	}
}
