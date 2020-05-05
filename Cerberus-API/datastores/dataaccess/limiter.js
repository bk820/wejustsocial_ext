const Incrementer = require('./incrementer')

module.exports = class Limiter extends Incrementer {
	/**
	 * @constructor
	 * @param {string} name - Increment name
	 * @param {number} max - Limit value
	 * @param {object} db - Supported database
	 * @param {number} ttl - TTL
	 */
	constructor(name, max, db, ttl = 0) {
		super(name, db, ttl)
		this._max = max
	}

	/**
	 * Increase limit increment and return limit status
	 * @param {number} value - Step value
	 * @return {boolean} - Whether limit has been reached
	 */
	async incr(value = 1) {
		const existing = await this.getValue()
		if (existing && existing > this._max) {
			return false
		}

		const limit = await this._db.incr(this._name, value, existing ? null : this._ttl)
		return limit <= this._max
	}

	/**
	 * Get remaining value
	 * @return {number} - Remaining value
	 */
	async getRemaining() {
		const value = await this.getValue()
		const remaining = this._max - (value || 0)
		return remaining < 0 ? 0 : remaining
	}
}
