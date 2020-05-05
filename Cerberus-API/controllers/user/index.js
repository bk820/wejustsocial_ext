const DefaultController = require('../default')

module.exports = class UserController extends DefaultController {
	/**
	 * Create one entry
	 * @param {object} model - Model using request data
	 * @param {object} entry - Entry to create
	 * @return {object} - Created entry
	 */
	async createOne(model, entry) {
		const roles = await this._dataAccess.search(model.fields.role.$ref, {
			filters: {
				default: true,
			},
		})
		if (roles && roles.length) {
			const defaultRole = roles[0]
			return super.createOne(model, { ...entry, role: defaultRole._id.toString() })
		}
		return super.createOne(model, entry)
	}
}
