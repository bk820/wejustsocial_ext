module.exports = class Incrementer {
	/**
	 * @constructor
	 * @param {string} name - Increment name
	 * @param {object} db - Supported database
	 * @param {number} ttl - TTL
	 */
	constructor(name, db, ttl = 0) {
		this._name = name
		this._db = db
		this._ttl = ttl
	}

	/**
	 * Increase increment and return incremented value
	 * @param {number} value - Step value
	 * @return {number} - Incremented value
	 */
	async incr(value = 1) {
		if (this._ttl) {
			return this._db.incr(this._name, value, this._ttl)
		}
		return this._db.incr(this._name, value)
	}

	/**
	 * Return remaining TTL
	 * @return {number} - TTL
	 */
	async getTTL() {
		return this._db.getIncrTTL(this._name)
	}

	/**
	 * Return increment value
	 * @return {number} - Increment value
	 */
	async getValue() {
		return this._db.getIncr(this._name)
	}
}
