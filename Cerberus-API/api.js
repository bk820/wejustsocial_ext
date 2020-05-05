/* @TODO - Refactor this split into plugins or loaders, not really clean like this */
const express = require('express')
const passport = require('passport')
const pluralize = require('pluralize')
const https = require('https')
const fs = require('fs')

const DataAccess = require('./datastores')
const CORE_MODELS = require('./models')
const CORE_CONTROLLERS = require('./controllers')
const CORE_MIDDLEWARES = require('./middlewares')
const CORE_AUTHENTICATIONS = require('./authentications')

module.exports = class CerberusApi {
	/**
	 * @constructor
	 * @param {object} options - Cerberus API options
	 */
	constructor({ port, dataStores } = {}) {
		this._models = CORE_MODELS
		this._controllers = CORE_CONTROLLERS
		this._middlewares = CORE_MIDDLEWARES
		this._authentications = CORE_AUTHENTICATIONS
		this._initialized = false
		this._versions = {}
		this._port = port || process.env.API_PORT

		this._app = express()
		this._server = null
		this._dataAccess = new DataAccess(dataStores)
	}

	/**
	 * Add models to Cerberus Api
	 * @param {array} models - Models to add
	 * @return {object} - this
	 */
	addModels(models) {
		this._models = { ...this._models, ...models }
		return this
	}

	/**
	 * Add controllers to Cerberus Api
	 * @param {object} controllers - Controllers to add
	 * @return {object} - this
	 */
	addControllers(controllers) {
		this._controllers = { ...this._controllers, ...controllers }
		return this
	}

	/**
	 * Add middlewares to Cerberus Api
	 * @param {array} middlewares - Middlewares to add
	 * @return {object} - this
	 */
	addMiddlewares(middlewares) {
		this._middlewares = [...this._middlewares, ...middlewares]
		return this
	}

	/**
	 * Add authentications to Cerberus Api
	 * @param {object} authentications - Authentications
	 * @return {object} - this
	 */
	addAuthentications(authentications) {
		this._authentications = [...this._authentications, ...authentications]
		return this
	}

	/**
	 * Initialize authentication strategies
	 * @return {object} - this
	 */
	_initializeAuthentications() {
		this._authentications.forEach((Authentication) => {
			const authentication = new Authentication(this._dataAccess, this._models)
			passport.use(authentication.getStrategy())

			if (authentication.getName() === process.env.AUTH_LOGIN
				|| authentication.getName() === process.env.AUTH_STRATEGY) {
				this._app.use('/auth', authentication.getRouter())
			} else {
				this._app.use(`/auth/${authentication.getName}`, authentication.getRouter())
			}
		})
		return this
	}

	/**
	 * Initialize middlewares
	 * @return {object} - this
	 */
	_initializeMiddlewares() {
		this._middlewares.forEach((middleware) => {
			this._app.use(middleware)
		})

		return this
	}

	/**
	 * Build API dynamic endpoints
	 */
	_buildDynamicEndpoints() {
		Object.keys(this._models).forEach((modelName) => {
			const model = this._models[modelName]
			if (model.private === true) { return }

			const controller = new (this._controllers[model.name]
				|| this._controllers.default)(model, this._dataAccess)

			const version = `v${model.version || 1}`
			if (!this._versions[version]) { this._versions[version] = [] }

			const plural = pluralize(model.name)
			this._versions[version].push(plural)
			this._app.use(`/${version}/${plural}`, controller.getRouter())
		})

		return this
	}

	/**
	 * Build root and versions endpoints
	 * @return {object} - this
	 */
	_buildRootEndpoints() {
		// Add root route
		this._app.get('/', (req, res) => {
			res.json(Object.keys(this._versions).sort(
				(a, b) => parseInt(a.substr(1), 10) - parseInt(b.substr(1), 10),
			))
		})

		// Add versions routes
		Object.keys(this._versions).forEach((version) => {
			this._app.get(`/${version}`, (req, res) => {
				res.json(this._versions[version].sort(
					(a, b) => a.localeCompare(b),
				))
			})
		})

		return this
	}

	/**
	 * Initialize server
	 */
	_initializeServer() {
		const certOpts = {}
		if (process.env.HTTPS_KEY_PATH && process.env.HTTPS_KEY_PATH !== '') {
			certOpts.key = fs.readFileSync(process.env.HTTPS_KEY_PATH)
		}
		if (process.env.HTTPS_CERT_PATH && process.env.HTTPS_CERT_PATH !== '') {
			certOpts.cert = fs.readFileSync(process.env.HTTPS_CERT_PATH)
		}
		if (process.env.HTTPS_CHAIN_PATH && process.env.HTTPS_CHAIN_PATH !== '') {
			certOpts.ca = fs.readFileSync(process.env.HTTPS_CHAIN_PATH)
		}

		if (Object.keys(certOpts).length === 0) {
			this._server = this._app
		} else {
			this._server = https.createServer(certOpts, this._app)
		}
	}

	/**
	 * Initialize Cerberus API
	 */
	_initialize() {
		if (this._initialized) { return }
		this
			._initializeMiddlewares()
			._initializeAuthentications()
			._buildDynamicEndpoints()
			._buildRootEndpoints()
			._initializeServer()
		this._initialized = true
	}

	/**
	 * Run Cerberus API under express app
	 */
	run() {
		this._initialize()

		this._server.listen(this._port)

		if (process.env.HTTPS_REDIRECT === 'true' && this._port === '443') {
			this._app.listen(80)
		}
	}
}
