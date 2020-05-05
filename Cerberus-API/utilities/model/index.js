const { forEach, reduce, mapValues } = require('lodash')
const moment = require('moment')

const UtilityInterface = require('../interface')
const ValidationUtility = require('../validation')
const CryptoUtility = require('../crypto')

module.exports = class ModelUtility extends UtilityInterface {
	/**
	 * Get default Cerberus model projection
	 * @param {object} model - Cerberus model
	 * @return {array} - Default projection
	 */
	static getDefaultProjection(model) {
		return reduce(model.fields, (acc, data, field) => {
			if (!data.restricted && !data.hidden) {
				acc.push(field)
			}
			return acc
		}, [])
	}

	/**
	 * Validate model entry(ies) for insertion
	 * @param {object} model  - Cerberus model
	 * @param {object|array} entries - Model entry(ies)
	 * @return {object} - Validation errors
	 */
	static validateInsertion(model, entries) {
		if (Array.isArray(entries)) {
			return ValidationUtility.validateModelEntries(model, entries, { skipRestriction: true })
		}

		return ValidationUtility.validateModelEntry(model, entries, { skipRestriction: true })
	}

	/**
	 * Validate model updates
	 * @param {object} model  - Cerberus model
	 * @param {object|array} updates - Model update(s)
	 * @return {object} - Validation errors
	 */
	static validateUpdate(model, updates) {
		if (Array.isArray(updates)) {
			return ValidationUtility.validateModelEntries(model, updates,
				{
					skipMissingRequirements: true,
					skipRestriction: model.skipRestrictions || false,
				})
		}

		return ValidationUtility.validateModelEntry(model, updates,
			{
				skipMissingRequirements: true,
				skipRestriction: model.skipRestrictions || false,
			})
	}

	/**
	 * Return ownership capability status
	 * @param {object} model - Cerberus model
	 * @return {boolean} - Whether the model has ownership capability
	 */
	static hasOwnership(model) {
		return model.owner
	}

	/**
	 * Return skip ownership filtering status
	 * @param {object} model - Cerberus model
	 * @return {boolean} - Whether the model skip ownership filtering
	 */
	static isSkippingOwnership(model) {
		return !this.hasOwnership(model) || model.skipOwnership
	}


	/**
	 * Fetch model fields from flag
	 * @param {object} model - Cerberus model
	 * @param {string} flag - Flag name
	 * @return {array} - Fields with flag
	 */
	static fetchFieldsFromFlag(model, flag) {
		return reduce(model.fields, (acc, data, field) => {
			if (Array.isArray(flag)) {
				let assigned = false
				flag.forEach((singleFlag) => {
					if (assigned) { return }
					if (data[singleFlag]) {
						acc.push(field)
						assigned = true
					}
				})
			} else if (data[flag]) {
				acc.push(field)
			}
			return acc
		}, [])
	}

	/**
	 * Fetch model fields by type
	 * @param {object} model - Cerberus model
	 * @param {string} type - Type
	 * @return {array} - Fields with type
	 */
	static fetchFieldsByType(model, type) {
		return reduce(model.fields, (acc, data, field) => {
			if ((Array.isArray(type) ? type : [type]).indexOf(data.type) !== -1) {
				acc.push(field)
			}
			return acc
		}, [])
	}

	/**
	 * Fetch model indexes
	 * @param {object} model - Cerberus model
	 */
	static fetchIndexes(model) {
		const fieldsToIndex = this.fetchFieldsFromFlag(model, ['$ref', 'index', 'unique'])

		const indexes = fieldsToIndex.reduce((acc, field) => {
			acc.push({
				fields: [field],
				unique: model.fields[field].unique || false,
			})
			return acc
		}, [])

		return [...indexes, ...(model.indexes || [])]
	}

	/**
	 * [async] Get mutated value
	 * @param {any} value - Value to mutate
	 * @param {function} fn - Mutation function
	 * @return {any} - Mutated value
	 */
	static async getAsyncMutatedValue(value, fn) {
		if (Array.isArray(value)) {
			const arrPromises = []
			value.forEach((single) => {
				arrPromises.push(fn(single))
			})
			return Promise.all(arrPromises)
		}
		if (typeof value === 'object') {
			const objPromises = []
			forEach(value, (single) => {
				objPromises.push(this.getAsyncMutatedValue(single, fn))
			})
			const objResults = await Promise.all(objPromises)
			return Promise.resolve(mapValues(value, () => objResults.shift()))
		}

		return fn(value)
	}

	/**
	 * Get mutated value
	 * @param {any} value - Value to mutate
	 * @param {function} fn - Mutation function
	 * @return {any} - Mutated value
	 */
	static getMutationValue(value, fn) {
		if (Array.isArray(value)) {
			return value.reduce((acc, single) => {
				acc.push(fn(single))
				return acc
			}, [])
		}
		if (typeof value === 'object') {
			return mapValues(value, single => this.getMutationValue(single, fn))
		}

		return fn(value)
	}

	/**
	 * Mutate entry
	 * @param {object} entry - Entry to mutate
	 * @param {array} mutations - Mutations
	 * @return {object} - Mutated entry
	 */
	static async getMutatedEntry(entry, mutations) {
		let mutatedEntry = entry
		// Execute mutation in order
		for (let i = 0; i < mutations.length; i += 1) {
			const mutation = mutations[i]
			let mutatedData = {}

			// Execute async mutation
			if (mutation.async) {
				const promises = []
				const fields = []
				mutation.fields.forEach((field) => {
					if (typeof entry[field] !== 'undefined' && entry[field] !== null) {
						promises.push(this.getAsyncMutatedValue(entry[field], mutation.fn))
						fields.push(field)
					}
				})
				// eslint-disable-next-line no-await-in-loop
				const mutatedArray = await Promise.all(promises)
				mutatedData = fields.reduce((acc, field, j) => {
					acc[field] = mutatedArray[j]
					return acc
				}, {})

			// Execute sync mutation
			} else {
				mutatedData = mutation.fields.reduce((acc, field) => {
					if (typeof entry[field] !== 'undefined' && entry[field] !== null) {
						acc[field] = this.getMutationValue(entry[field], mutation.fn)
					}

					return acc
				}, {})
			}

			// Apply mutated data to mutated entry
			mutatedEntry = { ...mutatedEntry, ...mutatedData }
		}

		return mutatedEntry
	}

	/**
	 * Mutate entries
	 * @param {object|array} entries - Entry(ies) to mutate
	 * @param {array} mutations - Mutations
	 * @return {object} - Mutated entry(ies)
	 */
	static async getMutatedEntries(entries, mutations) {
		const promises = []
		const entryOrEntries = (Array.isArray(entries) ? entries : [entries])
		entryOrEntries.forEach((entry) => {
			promises.push(this.getMutatedEntry(entry, mutations))
		})
		const mutatedEntries = await Promise.all(promises)
		return Array.isArray(entries) ? mutatedEntries : mutatedEntries[0]
	}

	/**
	 * Mutate entry(ies) for reading
	 * @param {object} model - Cerberus model
	 * @param {object|array} entries - Entry(ies) to mutate
	 * @return {object|array} - Mutated entries
	 */
	static async mutateForRead(model, entries) {
		const fieldsToDecipher = this.fetchFieldsFromFlag(model, 'encrypted')
		const mutations = [{
			fields: fieldsToDecipher,
			fn: CryptoUtility.decrypt,
		}]

		return this.getMutatedEntries(entries, mutations)
	}

	/**
	 * Convert date string to date object
	 * @param {string} str - Date string
	 * @return {object} - Date object
	 */
	static stringToDate(str) {
		return moment(str).toDate()
	}

	/**
	 * Convert date string to date object
	 * @param {string} str - Date string
	 * @return {object} - Date object
	 */
	static stringToNumber(str) {
		return /\./.test(str) ? parseFloat(str) : parseInt(str, 10)
	}

	/**
	 * Mutate entry(ies) for writing
	 * @param {object} model - Cerberus model
	 * @param {object|array} entries - Entry(ies) to mutate
	 * @return {object|array} - Mutated entries
	 */
	static async mutateForWrite(model, entries) {
		const fieldsToCipher = this.fetchFieldsFromFlag(model, 'encrypted')
		const fieldsToHash = this.fetchFieldsFromFlag(model, 'hashed')
		const fieldsDate = this.fetchFieldsByType(model, 'date')

		const mutations = [{
			fields: fieldsToHash,
			fn: CryptoUtility.hash,
			async: true,
		}, {
			fields: fieldsToCipher,
			fn: CryptoUtility.encrypt,
		}, {
			fields: fieldsDate,
			fn: this.stringToDate,
		}]

		return this.getMutatedEntries(entries, mutations)
	}

	/**
	 * Mutate query filters
	 * @param {object} model - Cerberus model
	 * @param {object} filters - Query filters
	 * @return {object} - Mutated query filters
	 */
	static async mutateQueryFilters(model, filters) {
		const fieldsDate = this.fetchFieldsByType(model, 'date')
		const fieldsNumber = this.fetchFieldsByType(model, 'number')

		const mutations = [{
			fields: fieldsDate,
			fn: this.stringToDate,
		}, {
			fields: fieldsNumber,
			fn: this.stringToNumber,
		}]

		return this.getMutatedEntries(filters, mutations)
	}
}
