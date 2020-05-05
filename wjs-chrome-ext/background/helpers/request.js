// eslint-disable-next-line no-unused-vars
class Request {
	/**
	 * @constructor
	 */
	constructor() {
		this._url = null
		this._method = 'GET'
		this._headers = {}
		this._queryParameters = {} // @TODO - Not implemented
		this._mode = null
	}

	/**
	 * Add/set header for the request
	 * @param {string!object} name - Header name (or headers object)
	 * @param {string} value - Header value
	 * @return {object} - Instance
	 */
	header(name, value) {
		if (typeof name === 'object') {
			this._headers = name
		} else {
			this._headers[name] = value
		}

		return this
	}

	/**
	 * Set method
	 * @param {string} method - Method
	 * @return {object} - This
	 */
	method(method) {
		this._method = method.toUpperCase()
		return this
	}

	/**
	 * Set URL
	 * @param {string} url - Endpoint URL
	 * @return {object} - This
	 */
	url(url) {
		this._url = url
		return this
	}

	/**
	 * Execute a GET request
	 * @return {object} - Response
	 */
	async get() {
		return this.execute()
	}

	/**
	 * Execute a POST request
	 * @param {object|string} - Body
	 * @return {object} - Response
	 */
	async post(body) {
		return this.method('POST').execute(body)
	}

	/**
	 * Execute a PUT request
	 * @param {object|string} - Body
	 * @return {object} - Response
	 */
	async put(body) {
		return this.method('PUT').execute(body)
	}

	/**
	 * Execute a DELETE request
	 * @return {object} - Response
	 */
	async delete() {
		return this.method('DELETE').execute()
	}

	/**
	 * Format request body
	 * @param {string|object} body - Body to format
	 * @return {string|object} - Formatted body
	 */
	_formatRequest(body) {
		switch (this._mode) {
		case 'json':
			try {
				const json = JSON.stringify(body)
				return json
			} catch (err) {
				console.warn(err)
				return body
			}
		default:
			return body
		}
	}

	/**
	 * Enable JSON mode and automatic formatting
	 * @return {object} - This
	 */
	json() {
		this._mode = 'json'
		return this.header('Content-Type', 'application/json')
	}

	/**
	 * Format response body
	 * @param {string|object} body - Body to format
	 * @return {string|object} - Formatted body
	 */
	_formatResponse(body) {
		switch (this._mode) {
		case 'json':
			try {
				const json = JSON.parse(body)
				return json
			} catch (err) {
				console.warn(err)
				return body
			}
		default:
			return body
		}
	}

	/**
	 * Execute request and return response
	 * @param {object|string} - Body
	 * @return {object} - Response
	 */
	async execute(body) {
		if (!this._url) { return false }

		const xhr = new XMLHttpRequest()
		xhr.open(this._method, this._url, true)

		Object.keys(this._headers).forEach((header) => {
			const value = this._headers[header]
			xhr.setRequestHeader(header, value)
		})

		return new Promise((resolve, reject) => {
			xhr.onload = () => {
				if (xhr.status >= 200 && xhr.status < 300) {
					return resolve({
						status: xhr.status,
						response: this._formatResponse(xhr.response),
					})
				}

				return reject(Error({
					status: xhr.status,
					response: this._formatResponse(xhr.response),
				}))
			}

			xhr.send(this._formatRequest(body))
		})
	}
}
