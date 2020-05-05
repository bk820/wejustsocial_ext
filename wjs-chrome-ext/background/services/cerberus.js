/* global CERBERUS_URL */
// eslint-disable-next-line no-unused-vars
class Cerberus {
	/**
	 * @constructor
	 * @param {string} jwt - JWT token
	 */
	constructor(jwt) {
		this._jwt = jwt || null
	}

	/**
	 * Login to Cerberus
	 * @param {string} email - Email
	 * @param {string} password - Password
	 * @return {string} - JWT token or false if failed
	 */
	async login(email, password) {
		if (this._jwt) { return this._jwt }
		const request = new Request()

		try {
			const response = await request
				.url(`${CERBERUS_URL}/auth`)
				.json()
				.post({ email, password })

			const jwt = response.response && response.response.token
				? response.response.token : null
			this._jwt = jwt

			return jwt || false
		} catch (err) {
			return false
		}
	}

	/**
	 * Logout from Cerberus
	 */
	logout() {
		this._jwt = null
		return true
	}

	/**
	 * Return authentication status
	 * @return {boolean} - whether Cerberus service is authenticated
	 */
	isAuthenticated() {
		return !!this._jwt
	}

	/**
	 * Make request to a Cerberus API and return data
	 * @param {string} endpoint - Endpoint
	 * @return {object} - Response
	 */
	async request(endpoint, {
		method = 'get',
		version = 1,
		body = null,
	} = {}) {
		if (!this._jwt) { return false }

		const request = new Request()
		const response = await request
			.url(`${CERBERUS_URL}/v${version}/${endpoint}`)
			.header('Authorization', `Bearer ${this._jwt}`)
			.json()
			.method(method)
			.execute(body)

		return response.response
	}
}
