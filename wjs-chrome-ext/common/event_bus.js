// eslint-disable-next-line no-unused-vars
class EventBus {
	/**
	 * Inject event bus function to specified instance
	 * @param {object} instance - Class instance to extends with event bus function
	 */
	_injectFunctions(instance) {
		if (instance) {
			// Injection, disabling eslint rule there
			/* eslint-disable no-param-reassign */
			instance.on = this.on.bind(this)
			instance.off = this.off.bind(this)
			instance.trigger = this.trigger.bind(this)
			/* eslint-enable no-param-reassign */
		}
	}

	/**
	 * @constructor
	 * @todo - Find a way to make clean multi-extends
	 * @param {object} instance - Class instance to extends with event bus function
	 */
	constructor(instance) {
		this._events = {}

		if (instance) {
			this._injectFunctions(instance)
		}
	}

	/**
	 * Listen to specified event
	 * @param {string} name - Event name
	 * @param {function} cb - Callback
	 * @return {number} - Listener ID
	 */
	on(name, cb) {
		if (!this._events[name]) {
			this._events[name] = []
		}
		this._events[name].push(cb)
		return this._events[name].length - 1
	}

	/**
	 * Remove specified or all listeners from specified event
	 * @param {string} name - Event name
	 * @param {number} id - Event ID
	 */
	off(name, id = null) {
		if (id !== null) {
			this._events.splice(id, 1)
		} else {
			delete this._events[name]
		}
	}

	/**
	 * Trigger event
	 * @param {string} name - Event name
	 * @param {...any} args - Event arguments
	 */
	trigger(name, ...args) {
		if (!this._events[name]) { return }
		this._events[name].forEach((cb) => {
			cb(...args)
		})
	}
}
