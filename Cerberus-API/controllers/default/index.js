const AbstractController = require('../abstract')

module.exports = class DefaultController extends AbstractController {
	/**
	 * Get all entries
	 * @param {object} model - Model using request data
	 * @param {object} query - Request query
	 * @return {array} - Found entries
	 */
	async get(model, query) {
		return this._dataAccess.search(model, query)
	}

	/**
	 * Get total entries count
	 * @param {object} model - Model using request data
	 * @param {object} query - Request query
	 * @return {object} - Count entry
	 */
	async count(model, query) {
		return this._dataAccess.count(model, query)
	}

	/**
	 * Get one entry
	 * @param {object} model - Model using request data
	 * @param {string} id - Entry ID
	 * @return {object} - Found entry
	 */
	async getOne(model, id) {
		return this._dataAccess.get(model, id)
	}

	/**
	 * Create multiple entries
	 * @param {object} model - Model using request data
	 * @param {array} entries - Entries to create
	 * @return {array} - Created entries
	 */
	async create(model, entries) {
		return this._dataAccess.batchInsert(model, entries)
	}

	/**
	 * Create one entry
	 * @param {object} model - Model using request data
	 * @param {object} entry - Entry to create
	 * @return {object} - Created entry
	 */
	async createOne(model, entry) {
		return this._dataAccess.insert(model, entry)
	}

	/**
	 * Update multiple entries
	 * @param {object} model - Model using request data
	 * @param {array} updates - Changes to apply
	 * @return {array} - Updated entries
	 */
	async update(model, updates) {
		return this._dataAccess.batchUpdate(model, updates)
	}

	/**
	 * Update one entry
	 * @param {object} model - Model using request data
	 * @param {object} id - Entry ID to update
	 * @param {object} update - Changes to apply
	 * @return {object} - Updated entry
	 */
	async updateOne(model, id, update) {
		return this._dataAccess.update(model, id, update)
	}

	/**
	 * Delete multiple entries
	 * @param {object} model - Model using request data
	 * @param {array} entries - Entry IDs to delete
	 * @return {array} - Deleted entries
	 */
	async delete(model, ids) {
		return this._dataAccess.batchDelete(model, ids)
	}

	/**
	 * Delete one entry
	 * @param {object} model - Model using request data
	 * @param {object} id - Entry ID to delete
	 * @return {object} - Deleted entry
	 */
	async deleteOne(model, id) {
		return this._dataAccess.delete(model, id)
	}

	/**
	 * Register default Restful routes for model
	 * @returns {object} - Express router
	 */
	_registerRoutes() {
		// GET
		this._registerRoute('get', '/', async (model, req) => this.get(model, req.search))
		this._registerRoute('get', '/count', async (model, req) => this.count(model, req.search))
		this._registerRoute('get', '/:id', async (model, req) => this.getOne(model, req.params.id))

		// POST
		this._registerRoute('post', '/', async (model, req) => (
			Array.isArray(req.body)
				? this.create(model, req.body)
				: this.createOne(model, req.body)
		))

		// PUT
		this._registerRoute('put', '/', async (model, req) => this.update(model, req.body))
		this._registerRoute('put', '/:id', async (model, req) => this.updateOne(model, req.params.id, req.body))

		// DELETE
		this._registerRoute('delete', '/', async (model, req) => this.delete(model, req.body))
		this._registerRoute('delete', '/:id', async (model, req) => this.deleteOne(model, req.params.id))
	}
}
