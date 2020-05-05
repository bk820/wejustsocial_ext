const UtilityInterface = require('../interface')

module.exports = class ExpressUtility extends UtilityInterface {
	/**
	 * Return response status based on request method
	 * @param {string} method - Request method
	 */
	static getResponseStatus(method) {
		switch (method) {
		case 'post':
			return 201
		case 'delete':
			return 204
		default:
			return 200
		}
	}

	/**
	 * Return CRUD operation name based on request method
	 * @param {string} method - Request method
	 * @return {string} - CRUD operation name
	 */
	static methodToCRUD(method) {
		switch (method) {
		case 'get':
			return 'read'
		case 'post':
			return 'create'
		case 'put':
		case 'patch':
			return 'update'
		case 'delete':
			return 'delete'
		default:
			return null
		}
	}

	/**
	 * Handle error
	 * @param {object} res - Express response object
	 */
	static handleError(res, err) {
		res.status(err.code || 500)
		const response = { message: err.message }
		if (err.details) {
			response.details = err.details
		}
		res.json(response)
	}
}
