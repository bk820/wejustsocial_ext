/* global EventBus */
// eslint-disable-next-line no-unused-vars
class ChromeBus {
	/**
	 * Add listener
	 */
	_listen() {
		this._chrome.runtime.onMessage.addListener((request, sender) => {
			if (!request.action) { return true }
			if (sender.tab) {
				this.trigger(request.action, request.params, sender.tab)
			} else {
				this.trigger(request.action, request.params)
			}
			return true
		})
	}

	/**
	 * @constructor
	 * @param {object} chrome - Chrome instance
	 */
	constructor(chrome) {
		this._chrome = chrome
		this._eventBus = new EventBus(this)

		this._listen()
	}

	/**
	 * Send message to runtime
	 * @param {string} action - Action name
	 * @param {object} params - Parameters
	 */
	send(action, params = {}) {
		chrome.runtime.sendMessage({ action, params })
	}

	/**
	 * Send message to tab
	 * @param {string} action - Action name
	 * @param {object} params - Parameters
	 */
	sendTab(id, action, params = {}) {
		chrome.tabs.sendMessage(id, { action, params })
	}
}
