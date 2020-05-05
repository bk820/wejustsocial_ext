// eslint-disable-next-line no-unused-vars
class Storage {
	/**
	 * @constructor
	 * @param {object} chrome - Chrome instance
	 */
	constructor(chrome) {
		this._chrome = chrome
	}

	/**
	 * Get local storage value
	 * @param {string} key - Key
	 * @return {any} - Storage value
	 */
	async get(key) {
		return new Promise((resolve) => {
			chrome.storage.local.get([key], (data) => {
				resolve(data[key])
			})
		})
	}

	/**
	 * Set local storage value
	 * @param {string} key - Key
	 * @param {any} value - Value
	 */
	async set(key, value) {
		return new Promise((resolve, reject) => {
			chrome.storage.local.set({ [key]: value }, () => {
				if (chrome.runtime.lastError) {
					return reject(Error(
						`Error setting ${key} to ${JSON.stringify(value)}`
						+ `: ${chrome.runtime.lastError.message}`,
					))
				}

				return resolve(true)
			})
		})
	}
}
