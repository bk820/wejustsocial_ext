const Redis = require('ioredis')
const Redlock = require('redlock')
const ModelUtility = require('../../../utilities/model')

const LOCK_CLOCKDRIFT = 0.01
const LOCK_RETRY = 10
const LOCK_DELAY = 100
const LOCK_JITTER = 50
const LOCK_DEFAULT_TTL = 1000

module.exports = class RedisStore {
	/**
	 * @constructor
	 * @param {object} options - MongoDB store options
	 */
	constructor(options = {}) {
		this._namespace = options.namespace || process.env.NAMESPACE
		this._port = options.port || process.env.REDIS_PORT
		this._host = options.ip || process.env.REDIS_HOST
		this._ipFamily = options.ipFamily || process.env.REDIS_IPFAMILY
		this._password = options.password || process.env.REDIS_PASSWORD
		this._expiration = options.expiration || process.env.CACHE_EXPIRATION

		this._db = null
		this._redlock = null
	}

	/**
	 * Connect to Redis
	 */
	async _connect() {
		if (!this._db) {
			this._db = new Redis({
				port: this._port,
				host: this._host,
				family: this._ipFamily,
				password: this._password,
				db: 0,
			})
		}
	}

	/**
	 * Initialize redlock
	 */
	async _initRedLock() {
		await this._connect()

		if (!this._redlock) {
			this._redlock = new Redlock([this._db], {
				driftFactor: LOCK_CLOCKDRIFT,
				retryCount: LOCK_RETRY,
				retryDelay: LOCK_DELAY,
				retryJitter: LOCK_JITTER,
			})
		}
	}

	/**
	 * Build and get cache key
	 * @param {object} model - Cerberus Model
	 * @param {string} id - Entry ID
	 */
	_getCacheKey(model, id) {
		return `${this._namespace}:cache:${model.namespace}:${id}`
	}

	/**
	 * Build and get increment key
	 * @param {string} name - Increment name
	 */
	_getIncrementKey(name) {
		return `${this._namespace}:incr:${name}`
	}

	/**
	 * Get key associated to model
	 * @param {object} model - Cerberus Model
	 * @param {string} id - Entry ID
	 * @return {object} - Found entry
	 */
	async get(model, id) {
		await this._connect()
		const rawEntry = await this._db.get(this._getCacheKey(model, id))
		if (!rawEntry) { return null }
		const entry = JSON.parse(rawEntry)
		if (!ModelUtility.isSkippingOwnership(model) && model.owner !== entry._owner) {
			return null
		}
		return entry
	}

	/**
	 * Set entry associated to model
	 * @param {object} model - Cerberus Model
	 * @param {object} entry - Entry
	 * @return {boolean} - True
	 */
	async set(model, entry) {
		await this._connect()
		await this._db.setex(this._getCacheKey(model, entry._id || entry.id), this._expiration,
			JSON.stringify(entry))
		return true
	}

	/**
	 * Set entries associated to model
	 * @param {object} model - Cerberus Model
	 * @param {array} entries - Entries
	 * @return {boolean} - True
	 */
	async setMultiple(model, entries) {
		await this._connect()
		const transaction = this._db.multi()
		entries.forEach((entry) => {
			transaction.setex(this._getCacheKey(model, entry._id || entry.id), this._expiration,
				JSON.stringify(entry))
		})
		await transaction.exec()
		return true
	}

	/**
	 * Delete entry associated to model
	 * @param {object} model - Cerberus Model
	 * @param {string} id - Entry ID
	 * @return {boolean} - True
	 */
	async delete(model, id) {
		await this._connect()
		await this._db.del(this._getCacheKey(model, id))
		return true
	}

	/**
	 * Delete entries associated to model
	 * @param {object} model - Cerberus Model
	 * @param {array} ids - Entry IDs
	 * @return {boolean} - True
	 */
	async deleteMultiple(model, ids) {
		await this._connect()
		const transaction = this._db.multi()
		ids.forEach((id) => {
			transaction.del(this._getCacheKey(model, id))
		})
		transaction.exec()
		return true
	}

	/**
	 * Set lock
	 * @param {string} name - Lock name
	 * @param {number} ttl - Lock TTL
	 * @return {object} - Lock
	 */
	async lock(name, ttl = LOCK_DEFAULT_TTL) {
		await this._initRedLock()
		return this._redlock.lock(`locks:${name}`, ttl)
	}

	/**
	 * Unlock lock
	 * @param {object} lock - Lock
	 * @return {object} - Unlock status
	 */
	async unlock(lock) {
		return lock.unlock()
	}

	/**
	 * Get increment value
	 * @param {string} name - Increment name
	 * @return {number} - Increment value
	 */
	async getIncr(name) {
		await this._connect()

		const key = this._getIncrementKey(name)
		return this._db.get(key)
	}

	/**
	 * Get increment TTL
	 * @param {string} name - Increment name
	 * @return {number} - Increment TTL
	 */
	async getIncrTTL(name) {
		await this._connect()

		const key = this._getIncrementKey(name)
		return this._db.ttl(key)
	}

	/**
	 * Increase increment value
	 * @param {string} name - Increment name
	 * @param {number} value - Value
	 * @param {number} expire - Expiration time in seconds
	 * @return {number} - Incremented value
	 */
	async incr(name, value, expire = null) {
		await this._connect()

		const key = this._getIncrementKey(name)
		const result = await this._db.incrby(key, value)

		if (expire) {
			await this._db.expire(key, expire)
		}

		return result
	}
}
