const { MongoClient, ObjectID } = require('mongodb')
const { mapValues } = require('lodash')
const ModelUtility = require('../../../utilities/model')

module.exports = class MongoDBStore {
	/**
	 * @constructor
	 * @param {object} options - MongoDB store options
	 */
	constructor(options = {}) {
		this._namespace = options.namespace || process.env.NAMESPACE
		this._port = options.port || process.env.MONGO_PORT
		this._hostName = options.hostname || process.env.MONGO_HOST
		this._database = options.database || process.env.MONGO_DATABASE
		this._client = null
		this._modelIndexes = {}
	}

	/**
	 * Connect to the mongoDB database if not already connected
	 */
	async _connect() {
		if (!this._client) {
			const database = this._database && this._database !== '' ? `/${this._database}` : ''
			const client = await MongoClient.connect(`mongodb://${this._hostName}:${this._port}${database}`, { useNewUrlParser: true })
			this._client = client.db(this._namespace)
		}
	}

	/**
	 * Build collection index
	 * @param {object} collection - MongoDB collection
	 * @param {object} index - Index to create
	 */
	async _buildIndex(collection, index) {
		const fields = index.fields.reduce((acc, field) => ({ ...acc, [field]: 1 }), {})
		try {
			await collection.createIndex(fields, {
				background: true,
				unique: index.unique,
			})
		} catch (err) {
			if (err.code !== 85) {
				throw err
			}
			await collection.dropIndex(fields)
			await collection.createIndex(fields, {
				background: true,
				unique: index.unique,
			})
		}
	}

	/**
	 * Build model indexes @TODO - Refactor when interface is supported
	 * @param {object} model - Model structure
	 */
	async _buildIndexes(model) {
		if (this._modelIndexes[model.namespace]) { return }
		const indexes = ModelUtility.fetchIndexes(model)
		const collection = this._client.collection(model.namespace)
		const promises = []
		indexes.forEach((index) => {
			promises.push(this._buildIndex(collection, index))
		})

		await Promise.all(promises)
		this._modelIndexes[model.namespace] = true
	}

	/**
	 * Convert Cerberus query operators to MongoDB operators
	 * @param {object} query - Query to convert to MongoDB query
	 * @return {object} - Query with converted operators
	 */
	_convertOperators(query) {
		return mapValues(query, (filter) => {
			if (Array.isArray(filter)) {
				return { $in: filter }
			}
			if (typeof filter !== 'object') {
				return filter
			}

			const convertedFilter = {}
			if (typeof filter.gt !== 'undefined') {
				convertedFilter.$gt = filter.gt
			}
			if (typeof filter.gte !== 'undefined') {
				convertedFilter.$gte = filter.gte
			}
			if (typeof filter.lt !== 'undefined') {
				convertedFilter.$lt = filter.lt
			}
			if (typeof filter.lte !== 'undefined') {
				convertedFilter.$lte = filter.lte
			}
			if (typeof filter.ne !== 'undefined') {
				if (Array.isArray(filter.ne)) {
					convertedFilter.$nin = filter.ne
				} else {
					convertedFilter.$ne = filter.ne
				}
			}

			if (!Object.keys(convertedFilter).length) {
				return filter
			}

			return convertedFilter
		})
	}

	/**
	 * Build model query
	 * @param {object} model - Model structure
	 * @param {object} query - Query to convert to MongoDB query
	 * @return {object} - MongoDB query
	 */
	async _buildQuery(model, query) {
		const queryWithRelations = await this._buildDocumentsRelations(model, query)
		const queryWithFilters = this._convertOperators(queryWithRelations)

		return this._addQueryMeta(model, queryWithFilters)
	}

	/**
	 * Add search query meta
	 * @param {object} model - Model structure
	 * @param {object} query - Request query
	*/
	_addQueryMeta(model, query) {
		if (ModelUtility.isSkippingOwnership(model)) {
			return query
		}
		return { ...query, _owner: ObjectID(model.owner) }
	}

	/**
	 * Get all documents related to Cerberus model
	 * @param {object} model - Model structure
	 * @return {array} - Found documents
	 */
	async getAll(model) {
		return this.search(model, {})
	}

	/**
	 * Search documents related to Cerberus model
	 * @param {object} model - Model structure
	 * @param {object} query - Search query
	 * @return {array} - Found documents
	 */
	async search(model, query) {
		await this._connect()
		await this._buildIndexes(model)

		// @TODO - Create a standard query system for Cerberus
		const results = await this._client.collection(model.namespace)
			.find(this._addQueryMeta(model, await this._buildQuery(model, query.filters)))
			.sort(query.sort)
			.limit(query.limit)
			.skip(query.offset)

		return results.toArray()
	}

	/**
	 * Count documents related to Cerberus model
	 * @param {object} model - Model structure
	 * @param {object} query - Search query
	 * @return {number} - Documents count
	 */
	async count(model, query) {
		await this._connect()
		const count = await this._client.collection(model.namespace)
			.count(this._addQueryMeta(model, await this._buildQuery(model, query.filters)))

		return count
	}

	/**
	 * Get one document related to Cerberus model
	 * @param {object} model - Model structure
	 * @param {string} id - Document ID
	 * @return {object} - Found document
	 */
	async get(model, id) {
		await this._connect()
		// @TODO throw 400|404 error instead
		if (!ObjectID.isValid(id)) { return null }
		return this._client.collection(model.namespace)
			.findOne(this._addQueryMeta(model, { _id: ObjectID(id) }))
	}

	/**
	 * Add meta data to documents
	 * @param {object} model - Model structure
	 * @param {object|array} documents - Document(s)
	 * @return {object|array} - Document(s) with meta
	 */
	_addMetaToDocuments(model, documents) {
		const documentsWithMeta = (Array.isArray(documents) ? documents
			: [documents]).map((document) => {
			const documentWithMeta = document
			if (ModelUtility.hasOwnership(model)) {
				documentWithMeta._owner = ObjectID(model.owner)
			}
			if (model.asOwner) {
				documentWithMeta._id = ObjectID()
				documentWithMeta._owner = documentWithMeta._id
			}
			return documentWithMeta
		})
		return Array.isArray(documents) ? documentsWithMeta : documentsWithMeta[0]
	}

	/**
	 * Replace string and array with ObjectId instances
	 * @param {object} model - Model structure
	 * @param {object|array} documents - Document(s)
	 * @return {object|array} - Document(s) with MongoDB relations
	 */
	async _buildDocumentsRelations(model, documents) {
		const fieldsWithRelations = ModelUtility.fetchFieldsFromFlag(model, '$ref')

		const mutations = [{
			fields: [...fieldsWithRelations, '_id'],
			fn: ObjectID,
		}]

		return ModelUtility.getMutatedEntries(documents, mutations)
	}

	/**
	 * Prepare documents for insertion
	 * @param {object} model - Model structure
	 * @param {object|array} documents - Document(s) to prepare
	 * @return {object|array} - Prepared documents
	 */
	async _prepareForInsertion(model, documents) {
		const updatedDocuments = await this._buildDocumentsRelations(model, documents)
		return this._addMetaToDocuments(model, updatedDocuments)
	}

	/**
	 * Insert a new document
	 * @param {object} model - Model structure
	 * @param {object} document - Document to insert
	 * @return {object} - Inserted document
	 */
	async insert(model, document) {
		await this._connect()
		await this._buildIndexes(model)

		const preparedDocument = await this._prepareForInsertion(model, document)
		await this._client.collection(model.namespace)
			.insertOne(preparedDocument)
		return preparedDocument
	}

	/**
	 * Insert new documents
	 * @param {object} model - Model structure
	 * @param {array} documents - Documents to insert
	 * @return {array} - Inserted documents
	 */
	async batchInsert(model, documents) {
		await this._connect()
		await this._buildIndexes(model)

		const preparedDocuments = await this._prepareForInsertion(model, documents)
		await this._client.collection(model.namespace)
			.insertMany(preparedDocuments)
		return preparedDocuments
	}

	/**
	 * Build MongoDB update query based on data to update
	 * @param {object} model - Model structure
	 * @param {object} data - Data to update
	 * @return {object} - MongoDB query
	 */
	async _buildUpdateQuery(model, data) {
		const query = {}
		const updatedData = await this._buildDocumentsRelations(model, data)
		Object.keys(data).forEach((field) => {
			const value = updatedData[field]
			if (field === '_id' || field === 'id') { return }
			if (value === null || value === '') {
				if (!query.$unset) {
					query.$unset = {}
				}
				query.$unset[field] = ''
			} else {
				if (!query.$set) {
					query.$set = {}
				}
				query.$set[field] = value
			}
		})

		return query
	}

	/**
	 * Update a document
	 * @param {object} model - Model structure
	 * @param {string} id - Document ID to update
	 * @param {object} data - Data to update
	 * @return {object} - Updated document
	 */
	async update(model, id, data) {
		await this._connect()
		await this._buildIndexes(model)

		const response = await this._client.collection(model.namespace).findOneAndUpdate(
			this._addQueryMeta(model, { _id: ObjectID(id) }),
			await this._buildUpdateQuery(model, data), { returnOriginal: false },
		)
		return response.value
	}

	/**
	 * Update documents
	 * @param {object} model - Model structure
	 * @param {array} dataArray - Data to update
	 * @return {object} - Updated documents
	 */
	async batchUpdate(model, dataArray) {
		const queries = []
		const _ids = []

		/* eslint-disable no-await-in-loop */
		for (let i = 0; i < dataArray.length; i += 1) {
			const data = dataArray[i]
			const _id = ObjectID(data._id || data.id)
			queries.push({
				updateOne: {
					filter: this._addQueryMeta(model, { _id }),
					update: await this._buildUpdateQuery(model, data),
				},
			})
			_ids.push(_id)
		}
		/* eslint-enable no-await-in-loop */

		await this._connect()
		await this._buildIndexes(model)

		await this._client.collection(model.namespace).bulkWrite(queries)
		const results = await this._client.collection(model.namespace)
			.find(this._addQueryMeta(model, { _id: { $in: _ids } }))
		return results.toArray()
	}

	/**
	 * Delete a document
	 * @param {object} model - Model structure
	 * @param {string} id - ID to delete
	 * @return {null} - NULL
	 */
	async delete(model, id) {
		await this._connect()
		await this._buildIndexes(model)

		await this._client.collection(model.namespace)
			.deleteOne(this._addQueryMeta(model, { _id: ObjectID(id) }))
		return null
	}

	/**
	 * Delete documents
	 * @param {object} model - Model structure
	 * @param {string} ids - IDs to delete
	 * @return {null} - NULL
	 */
	async batchDelete(model, ids) {
		await this._connect()
		await this._buildIndexes(model)

		const _ids = ids.map(id => ObjectID(id))
		await this._client.collection(model.namespace)
			.deleteMany(this._addQueryMeta(model, { _id: { $in: _ids } }))
		return null
	}
}
