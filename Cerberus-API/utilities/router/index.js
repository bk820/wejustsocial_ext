const express = require('express')
const passport = require('passport')
const roles = require('../../middlewares/roles')

const UtilityInterface = require('../interface')

// @TODO - Use helper instead (since router is used for everything)
module.exports = class RouterUtility extends UtilityInterface {
	/**
	 * Instanciate a new Express router
	 * @return {object} - Express Router
	 */
	static instanciateRouter() {
		return express.Router()
	}

	/**
	 * Return true if method is valid
	 * @param {string} method - Route method
	 * @return {boolean} - Whether method is valid or not
	 */
	static isValidMethod(method) {
		return ['get', 'post', 'put', 'delete'].indexOf(method) !== -1
	}

	/**
	 * Protect specified route
	 * @param {object} router - Express router
	 * @param {string} method - Route method
	 * @param {string} path - Route path
	 * @param {string} permission - Route permission (optional)
	 */
	static protectRoute(router, method, path, permission) {
		if (!this.isValidMethod(method)) {
			throw new Error(`Bad method ${method} when protecting route`)
		}

		router[method](path, passport.authenticate(process.env.AUTH_STRATEGY, { session: false }))

		if (permission) {
			router[method](path, roles.can(permission))
		}
	}

	/**
	 * Register new route in router
	 * @param {object} router - Express router
	 * @param {string} method - Route method
	 * @param {string} path - Route path
	 * @param {function} handler - Route handler
	 */
	static registerRoute(router, method, path, handler) {
		if (!this.isValidMethod(method)) {
			throw new Error(`Bad method ${method} when registering new route`)
		}

		router[method](path, handler)
	}
}
