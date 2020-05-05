const ExpressError = require('../express')

module.exports = class AccessDeniedError extends ExpressError {
	/**
	 * @constructor
	 * @param {string} message - Error message
	 */
	constructor(message) {
		super(message, 403)
	}
}
