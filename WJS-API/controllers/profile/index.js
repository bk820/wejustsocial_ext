// eslint-disable-next-line import/no-unresolved
const { controllers } = require('cerberus-api')
const { merge, mapValues } = require('lodash')

const Ec2Service = require('../../services/ec2')
const CommentsUtility = require('../../utilities/comments')

const FollowModel = require('../../models/follow')
const InstanceModel = require('../../models/instance')
const MetricModel = require('../../models/metric')
const ActionModel = require('../../models/action')
const StageModel = require('../../models/stage')
const PlanModel = require('../../models/plan')

const LIMIT_TTL = 86400

module.exports = class ProfileController extends controllers.default {
	/**
	 * Generate content for entry if generation parameters are specified in entry
	 * @param {object} entry - Entry
	 */
	_generateContent(entry) {
		if (!entry.generateComments) { return entry }
		const updatedEntry = { ...entry }
		delete updatedEntry.generateComments
		if (updatedEntry.comments) { return updatedEntry }
		return {
			...updatedEntry,
			comments: CommentsUtility.generateComments(10),
		}
	}

	/**
	 * Initialize instance ID and reserve profile slot
	 * @return {object} - Instance ID and remaining slots
	 */
	async _initInstance() {
		let instanceId = null
		let slots = null

		const instances = await this._dataAccess.search(InstanceModel, {
			filters: { slots: { gt: 0 } },
			sort: { slots: 1 },
			limit: 1,
		})
		if (!instances || !instances.length) {
			const ec2 = new Ec2Service()
			const awsInstance = await ec2.createInstance(
				process.env.EC2_AMI,
				process.env.EC2_TYPE,
				process.env.EC2_KEYNAME, {
					securityGroups: process.env.EC2_SECURITYGROUP,
					name: `srv.worker${Date.now()}.wejustsocial.com`,
				},
			)
			const newInstance = await this._dataAccess.insert(InstanceModel, {
				instance: awsInstance,
				platform: 'aws',
				max: parseInt(process.env.WJS_INSTANCES_SLOTS || 4, 10),
				slots: parseInt(process.env.WJS_INSTANCES_SLOTS || 4, 10),
			})
			instanceId = newInstance._id.toString()
			slots = newInstance.slots - 1
		} else {
			instanceId = instances[0]._id.toString()
			slots = instances[0].slots - 1
		}

		return { instanceId, slots }
	}

	/**
	 * Create one entry
	 * @param {object} model - Model using request data
	 * @param {object} entry - Entry to create
	 * @return {object} - Created entry
	 */
	async createOne(model, entry) {
		const lock = await this._dataAccess.lock('profile:creation', 10000, 10)

		try {
			// If password entered, switch to EC2 instance.
			const instanceData = entry.password && entry.password !== ''
				? await this._initInstance()
				: null

			const [plans, stages] = await Promise.all([
				this._dataAccess.search(PlanModel, {
					filters: { default: true },
					limit: 1,
				}), this._dataAccess.search(StageModel, {
					filters: { default: true },
					limit: 1,
				}),
			])
			const plan = plans[0] ? plans[0]._id.toString() : undefined
			const stage = stages[0] ? stages[0]._id.toString() : undefined

			const entryCopy = { ...entry }
			if (entry.password === '') {
				delete entryCopy.password
			}

			const newProfile = await this._dataAccess.insert(
				model,
				{
					...this._generateContent(entryCopy),
					...(instanceData ? { instance: instanceData.instanceId } : {}),
					status: 2,
					plan,
					stage,
				},
			)

			if (instanceData) {
				const { instanceId, slots } = instanceData
				await this._dataAccess.update(InstanceModel, instanceId, { slots })
			}
			await this._dataAccess.unlock(lock)
			return newProfile
		} catch (err) {
			await this._dataAccess.unlock(lock)
			throw err
		}
	}

	/**
	 * Delete one entry
	 * @param {object} model - Model using request data
	 * @param {object} id - Entry ID to delete
	 * @return {object} - Deleted entry
	 */
	async deleteOne(model, id) {
		const profile = await this._dataAccess.get(model, id)
		if (profile.instance) {
			const instance = await this._dataAccess.get(InstanceModel, profile.instance)
			await this._dataAccess.update(InstanceModel, profile.instance, { slots: instance.slots += 1 })
		}
		return this._dataAccess.delete(model, id)
	}

	/**
	 * Get metrics from instance
	 * @param {string} id - profile ID
	 * @return {array} - Found metrics
	 */
	async getMetrics(id, query) {
		return this._dataAccess.search(MetricModel, {
			...query,
			filters: {
				...query.filters,
				profile: id.toString(),
			},
		})
	}

	/**
	 * Get actions from instance
	 * @param {string} id - profile ID
	 * @return {array} - Found actions
	 */
	async getActions(id, query) {
		return this._dataAccess.search(ActionModel, {
			...query,
			filters: {
				...query.filters,
				profile: id.toString(),
			},
		})
	}

	/**
	 * Return limit name
	 * @param {string} id - Profile ID
	 * @param {string} type - Action type
	 * @return {string} - Limit name
	 */
	_getLimitName(id, type) {
		return `limit:${id.toString()}:${type}`
	}

	/**
	 * Get follows from instance
	 * @param {string} id - profile ID
	 * @return {array} - Found followings
	 */
	async getFollows(id, query) {
		return this._dataAccess.search(FollowModel, {
			...query,
			filters: {
				...query.filters,
				profile: id.toString(),
			},
		})
	}

	/**
	 * Get profile limits based on its stage
	 * @param {object} - Profile
	 * @return {object} - Profile limits
	 */
	async _getLimits(profile) {
		const stage = await this._dataAccess.get(StageModel, profile.stage)
		return {
			...stage.limits,
			...(profile.limits || {}),
		}
	}

	/**
	 * Get profile action parameters based on its plan
	 * @param {object} - Profile
	 * @return {object} - Profile action parameters
	 */
	async _getActionParams(profile) {
		const plan = await this._dataAccess.get(PlanModel, profile.plan)
		return merge({}, plan.actions, profile.actions || {})
	}

	/**
	 * Get profile action options from plan and overrides
	 * @param {object} profile - Profile
	 * @return {object} - Action options
	 */
	async getOptions(profile) {
		const [limits, actions] = await Promise.all([
			this._getLimits(profile),
			this._getActionParams(profile),
		])

		const remaining = await Promise.all(Object.keys(limits).map(type => this._dataAccess
			.limiter(this._getLimitName(profile._id, type), limits[type])
			.getRemaining()))

		return {
			limits,
			remaining: mapValues(limits, (limit) => {
				const value = remaining.shift()
				if (value === 0 || value) {
					return value
				}
				return limit
			}),
			actions,
		}
	}

	/**
	 * Post follow
	 * @param {string} id - Profile ID
	 * @param {object} entry - Entry
	 */
	async postFollow(id, entry) {
		return this._dataAccess.insert(FollowModel, {
			target: entry.target,
			profile: id.toString(),
			date: (new Date()).toISOString(),
		})
	}

	/**
	 * Delete follow
	 * @param {string} id - Profile ID
	 * @param {object} entry - Entry
	 */
	async deleteFollow(id, entry) {
		const followings = await this._dataAccess.search(FollowModel, {
			filters: {
				profile: id.toString(),
				target: entry.target,
			},
			limit: 25,
		})

		const ids = followings.map(following => following._id.toString())
		return this._dataAccess.batchDelete(FollowModel, ids)
	}

	/**
	 * Increase action done in the limit timeframe
	 * @todo - Refactor to remove actionlimits shortcodes and use action types shortcode instead
	 * @param {string} profile - Profile
	 * @param {string} type - Action type
	 */
	async updateLimit(profile, type) {
		const limits = await this._getLimits(profile)
		return this._dataAccess
			.limiter(this._getLimitName(profile._id, type), limits[type] || 0, LIMIT_TTL)
			.incr()
	}

	/**
	 * Post action from bot to profile
	 * @param {string} id - Profile ID
	 * @param {string} type - Action type
	 * @param {object} entry - Entry
	 */
	async postAction(id, type, entry) {
		return this._dataAccess.insert(ActionModel, {
			...entry,
			type,
			profile: id.toString(),
			date: (new Date()).toISOString(),
		})
	}

	/**
	 * Register additional Restful routes for model
	 */
	_registerRoutes() {
		super._registerRoutes()

		this._registerRoute('get', '/:id/metrics', async (model, req) => {
			const profile = await this.getOne(model, req.params.id)
			return this.getMetrics(profile._id, req.search)
		})

		this._registerRoute('get', '/:id/actions', async (model, req) => {
			const profile = await this.getOne(model, req.params.id)
			return this.getActions(profile._id, req.search)
		})

		this._registerRoute('get', '/:id/follows', async (model, req) => {
			const profile = await this.getOne(model, req.params.id)
			return this.getFollows(profile._id, req.search)
		})

		this._registerRoute('get', '/:id/options', async (model, req) => {
			const profile = await this.getOne(model, req.params.id)
			return this.getOptions(profile)
		})

		this._registerRoute('post', '/:id/like', async (model, req) => {
			const profile = await this.getOne(model, req.params.id)
			await this.updateLimit(profile, 'likes')
			return this.postAction(profile._id, 'like', req.body)
		})

		this._registerRoute('post', '/:id/follow', async (model, req) => {
			const profile = await this.getOne(model, req.params.id)
			await Promise.all([
				this.postFollow(profile._id, req.body),
				this.updateLimit(profile, 'follows'),
			])
			return this.postAction(profile._id, 'follow', req.body)
		})

		this._registerRoute('post', '/:id/unfollow', async (model, req) => {
			const profile = await this.getOne(model, req.params.id)
			await Promise.all([
				this.deleteFollow(profile._id, req.body),
				this.updateLimit(profile, 'unfollows'),
			])
			return this.postAction(profile._id, 'unfollow', req.body)
		})
	}
}
