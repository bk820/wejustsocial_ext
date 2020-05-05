const ExpressError = require('../express')

module.exports = class BadRequestError extends ExpressError {
	/**
	 * @constructor
	 * @param {string} message - Error message
	 * @param {object} details - Error details
	 */
	constructor(message, details = null) {
		super(message, 400, details)
	}
}
