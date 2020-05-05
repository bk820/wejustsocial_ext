const ExpressError = require('../express')

module.exports = class NotFoundError extends ExpressError {
	/**
	 * @constructor
	 * @param {string} message - Error message
	 */
	constructor(message) {
		super(message, 404)
	}
}
