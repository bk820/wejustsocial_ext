// eslint-disable-next-line import/no-unresolved
const { controllers } = require('cerberus-api')
const ProfileModel = require('../../models/profile')

module.exports = class InstanceController extends controllers.default {
	/**
	 * Get one instance
	 * @param {object} model - Cerberus model
	 * @param {string} id - Instance internal or external ID
	 * @return {object} - Found Instance
	 */
	async getOne(model, id) {
		try {
			const instance = await this._dataAccess.get(model, id)
			return instance
		} catch (err) {
			const instances = await this._dataAccess.search(model, {
				filters: { instance: id },
				limit: 1,
			})
			if (!instances || !instances.length) { throw err }
			return instances[0]
		}
	}

	/**
	 * Get profiles from instance
	 * @param {string} id - Instance ID
	 * @return {array} - Found profiles
	 */
	async getProfiles(id, query) {
		return this._dataAccess.search(ProfileModel, {
			...query,
			filters: {
				...query.filters,
				instance: id.toString(),
			},
		})
	}

	/**
	 * Register additional Restful routes for model
	 */
	_registerRoutes() {
		super._registerRoutes()

		// @TODO - Make that type of route relations automatic
		this._registerRoute('get', '/:id/profiles', async (model, req) => {
			const instance = await this.getOne(model, req.params.id)
			return this.getProfiles(instance._id, req.search)
		})
	}
}
