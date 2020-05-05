module.exports = class ExpressError extends Error {
	/**
	 * @constructor
	 * @param {string} message - Error message
	 * @param {number} code - Error code
	 * @param {object} details - Error details
	 */
	constructor(message, code, details = null) {
		super(message)
		this.code = code
		this.details = details
	}
}
