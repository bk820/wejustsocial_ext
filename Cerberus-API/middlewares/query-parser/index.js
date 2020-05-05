const { mapValues, reduce } = require('lodash')
const I18n = require('../../i18n')

const DEFAULT_NAME = 'search'

/**
 * Parse limit string to limit parameter
 * @param {string} limit - Limit string
 * @param {object} - limit parameter
 */
function parseLimit(limit) {
	const parsed = parseInt(limit || process.env.LIMIT, 10)
	if (parsed > process.env.LIMIT) {
		throw new Error(new I18n('ERROR_QUERY_LIMIT_TOOHIGH', {}, process.env.LIMIT, limit))
	}
	if (parsed < 0) {
		throw new Error(new I18n('ERROR_QUERY_LIMIT_TOOLOW', {}, limit))
	}
	return parsed
}

/**
 * Parse sort string to sort parameters
 * @param {string} sort - Sort string
 * @param {object} - Sort parameters
 */
function parseSort(sort) {
	if (!sort) { return {} }
	return sort.split(',').reduce((acc, field) => {
		const direction = field.substr(0, 1) === '-' ? -1 : 1
		acc[direction > 0 ? field : field.substr(1)] = direction
		return acc
	}, {})
}

/**
 * Parse fields string to fields parameters
 * @param {string} fields - Fields string
 * @param {object} - Fields parameters
 */
function parseFields(fields) {
	if (!fields) { return {} }
	return fields.split(',')
}

/**
 * Prepare filter value and convert array string to array
 * @param {string} value - Filter value
 * @param {object} - Prepared filter value
 */
function prepareFilterValue(value) {
	if (value.substr(0, 1) === '[' && value.substr(value.length - 2, value.length - 1) === ']') {
		return value.substr(1, value.length - 1).split(',')
	}
	return value
}

/**
 * Prepare filter parameters for a field
 * @param {string} filter - Filter parameters
 * @param {object} - Prepared filter parameters
 */
function prepareFilter(filter) {
	return reduce(filter, (acc, value, operator) => {
		if (['eq', 'ne', 'gt', 'gte', 'lt', 'lte'].indexOf(operator) === -1) {
			throw new Error(new I18n('ERROR_QUERY_FILTER_BADOPERATOR', {}, operator))
		}

		return { ...acc, [operator]: value }
	}, {})
}

/**
 * Prepare filters parameters
 * @param {string} filters - Filters parameters
 * @param {object} - Prepared filters parameters
 */
function prepareFilters(filters) {
	return mapValues(filters, (value) => {
		if (typeof value !== 'object') {
			return prepareFilterValue(value)
		}

		if (Array.isArray(value)) {
			return value
		}
		return prepareFilter(value)
	})
}

/**
 * Parse query parameters and add sort, fields, limit, offset and filters into a request parameter
 * @param {object} options - Express request
 * @return {function} - Express middleware
 */
module.exports = (options = {}) => {
	const parameterName = options.name || DEFAULT_NAME
	/**
	 * Read query parameters and add sort, fields, limit, offset and filters to request
	 * @param {object} req - Express request
	 * @param {object} res - Express response
	 * @param {function} next - Express next callback
	 */
	return (req, res, next) => {
		const {
			limit,
			offset,
			sort,
			fields,
			...filters
		} = req.query

		try {
			req[parameterName] = {
				limit: parseLimit(limit),
				offset: offset ? parseInt(offset, 10) : 0,
				sort: parseSort(sort),
				fields: parseFields(fields),
				filters: prepareFilters(filters),
			}
			next()
		} catch (err) {
			res.status(400).json({ message: err.message })
		}
	}
}
