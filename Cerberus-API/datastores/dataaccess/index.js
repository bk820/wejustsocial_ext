const pluralize = require('pluralize')

const Incrementer = require('./incrementer')
const Limiter = require('./limiter')

const BadRequestError = require('../../errors/badrequest')
const NotFoundError = require('../../errors/notfound')
const ModelUtility = require('../../utilities/model')
const I18n = require('../../i18n')

module.exports = class DataAccess {
	/**
	 * @constructor
	 * @param {object} options - Cerberus data access data stores
	 */
	constructor({ persistent, cache, search }) {
		if (!persistent) { throw new Error(new I18n('ERROR_DATAACCESS_NOPERSISTENT')) }
		this._persistent = persistent	// Persistent data store
		this._cache = cache	// Cache data store
		this._search = search // Search engine (@TODO - Not implemented)
	}

	/**
	 * Return true if Cerberus model entries are cached
	 * @param {object} model - Model structure
	 * @return {boolean} - Return true if model entries are cached
	 */
	_hasCache(model) {
		return this._cache && model.cache
	}

	/**
	 * Return true if Cerberus model entries can be searched
	 * @param {object} model - Model structure
	 * @return {boolean} - Return true if model entries can be searched
	 */
	_hasSearch(model) {
		return this._search && model.search
	}

	/**
	 * Get all entries related to Cerberus model
	 * @param {object} model - Model structure
	 * @return {array} - Found entries
	 */
	async getAll(model) {
		const entries = await this._persistent.getAll(model)
		return ModelUtility.mutateForRead(model, entries)
	}

	/**
	 * Search entries related to Cerberus model
	 * @param {object} model - Model structure
	 * @param {object} query - Search query
	 * @return {array} - Found entries
	 */
	async search(model, query) {
		const entries = await this._persistent.search(model, {
			limit: query.limit || parseInt(process.env.LIMIT, 10),
			offset: query.offset || 0,
			sort: query.sort || {},
			filters: query.filters ? await ModelUtility.mutateQueryFilters(model, query.filters) : {},
		})
		return ModelUtility.mutateForRead(model, entries)
	}

	/**
	 * Count the number of entries related to Cerberus model
	 * @param {object} model - Model structure
	 * @param {object} query - Search query
	 * @return {number} - Count
	 */
	async count(model, query) {
		const count = await this._persistent.count(model, {
			filters: query.filters ? await ModelUtility.mutateQueryFilters(model, query.filters) : {},
		})

		return { count }
	}

	/**
	 * Get one entry related to Cerberus model
	 * @param {object} model - Model structure
	 * @param {string} id - Entry ID
	 * @return {object} - Found entry
	 */
	async get(model, id) {
		if (this._hasCache(model)) {
			const entry = await this._cache.get(model, id)
			if (entry) { return ModelUtility.mutateForRead(model, entry) }
		}

		const entry = await this._persistent.get(model, id)
		if (!entry) { throw new NotFoundError(new I18n('ERROR_DATAACCESS_ENTRY_NOTFOUND', {}, model.name, id)) }
		if (this._hasCache(model)) {
			await this._cache.set(model, entry)
		}

		return ModelUtility.mutateForRead(model, entry)
	}

	/**
	 * Insert a new entry
	 * @param {object} model - Model structure
	 * @param {object} entry - Entry to insert
	 * @return {object} - Inserted entry
	 */
	async insert(model, entry) {
		const errors = ModelUtility.validateInsertion(model, entry)
		if (errors) {
			throw new BadRequestError(new I18n('ERROR_DATAACCESS_NEWENTRY_BADREQUEST', {}, model.name), errors)
		}
		const newEntry = await this._persistent.insert(model,
			await ModelUtility.mutateForWrite(model, entry))
		if (this._hasCache(model)) {
			await this._cache.set(model, newEntry)
		}

		return ModelUtility.mutateForRead(model, newEntry)
	}

	/**
	 * Insert new entries
	 * @param {object} model - Model structure
	 * @param {array} entries - Entries to insert
	 * @return {array} - Inserted entries
	 */
	async batchInsert(model, entries) {
		const errors = ModelUtility.validateInsertion(model, entries)
		if (errors) {
			throw new BadRequestError(new I18n('ERROR_DATAACCESS_NEWENTRIES_BADREQUEST', {}, pluralize(model.name)), errors)
		}
		const newEntries = await this._persistent.batchInsert(model,
			await ModelUtility.mutateForWrite(model, entries))
		if (this._hasCache(model)) {
			await this._cache.setMultiple(model, newEntries)
		}

		return ModelUtility.mutateForRead(model, newEntries)
	}

	/**
	 * Update an entry
	 * @param {object} model - Model structure
	 * @param {string} id - Entry ID to update
	 * @param {object} data - Data to update
	 * @return {object} - Updated entry
	 */
	async update(model, id, data) {
		const errors = ModelUtility.validateUpdate(model, data)
		if (errors) {
			throw new BadRequestError(new I18n('ERROR_DATAACCESS_UPDATEENTRY_BADREQUEST', {}, model.name), errors)
		}
		const updatedEntry = await this._persistent.update(model, id,
			await ModelUtility.mutateForWrite(model, data))
		if (!updatedEntry) { throw new NotFoundError(new I18n('ERROR_DATAACCESS_ENTRY_NOTFOUND', {}, model.name, id)) }
		if (this._hasCache(model)) {
			await this._cache.set(model, updatedEntry)
		}

		return ModelUtility.mutateForRead(model, updatedEntry)
	}

	/**
	 * Update entries
	 * @param {object} model - Model structure
	 * @param {array} dataArray - Data to update
	 * @return {object} - Updated entries
	 */
	async batchUpdate(model, dataArray) {
		const errors = ModelUtility.validateUpdate(model, dataArray)
		if (errors) {
			throw new BadRequestError(new I18n('ERROR_DATAACCESS_UPDATEENTRIES_BADREQUEST', {}, pluralize(model.namespace)), errors)
		}
		const updatedEntries = await this._persistent.batchUpdate(model,
			await ModelUtility.mutateForWrite(model, dataArray))
		if (this._hasCache(model)) {
			await this._cache.setMultiple(model, updatedEntries)
		}

		return ModelUtility.mutateForRead(model, updatedEntries)
	}

	/**
	 * Delete an entry
	 * @param {object} model - Model structure
	 * @param {string} id - ID to delete
	 * @return {null} - NULL
	 */
	async delete(model, id) {
		if (this._hasCache(model)) {
			await this._cache.delete(model, id)
		}

		return this._persistent.delete(model, id)
	}

	/**
	 * Delete documents
	 * @param {object} model - Model structure
	 * @param {string} ids - IDs to delete
	 * @return {null} - NULL
	 */
	async batchDelete(model, ids) {
		if (this._hasCache(model)) {
			await this._cache.deleteMultiple(model, ids)
		}

		return this._persistent.batchDelete(model, ids)
	}

	/**
	 * Lock resource
	 * @param {string} name - Lock name
	 * @param {number} ttl - Lock TTL
	 * @param {number} retries - Number of retries for lock
	 * @return {object} - Lock
	 */
	async lock(name, ttl, retries = 0) {
		if (!this._cache) {
			throw new Error(new I18n('ERROR_DATAACCESS_LOCK_NOCACHE_DB'))
		}

		try {
			const lock = await this._cache.lock(name, ttl)
			return lock
		} catch (err) {
			if (retries) {
				return this.lock(name, ttl, retries - 1)
			}
			throw err
		}
	}

	/**
	 * Unlock resource
	 * @param {object} - Lock
	 * @return {object} - Unlock status
	 */
	async unlock(lock) {
		if (!this._cache) {
			throw new Error(new I18n('ERROR_DATAACCESS_LOCK_NOCACHE_DB'))
		}

		return this._cache.unlock(lock)
	}

	/**
	 * Return an incrementer helper
	 * @todo - Use persistent database for persistent increments
	 * @param {string} name - Name
	 * @param {number} ttl - TTL (false for persistent [NI])
	 * @return {object} - Incrementer helper
	 */
	incrementer(name, ttl = 0) {
		if (!this._cache) {
			throw new Error(new I18n('ERROR_DATAACCESS_LOCK_NOCACHE_DB'))
		}

		return new Incrementer(name, this._cache, ttl)
	}

	/**
	 * Return a limiter helper (Limiter is an incrementer, name can conflict with an increment name)
	 * @param {string} name - Name
	 * @param {number} max - Maximum value
	 * @param {number} ttl - TTL
	 * @return {object} - Limiter helper
	 */
	limiter(name, max, ttl = 0) {
		if (!this._cache) {
			throw new Error(new I18n('ERROR_DATAACCESS_LOCK_NOCACHE_DB'))
		}

		return new Limiter(name, max, this._cache, ttl)
	}
}
