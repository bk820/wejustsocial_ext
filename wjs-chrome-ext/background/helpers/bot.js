/*
	global
	EventBus
	shuffle
*/
// eslint-disable-next-line no-unused-vars
class Bot {
	/**
	 * BASE_URL constant
	 */
	static get BASE_URL() {
		return 'https://www.instagram.com/'
	}

	/**
	 * Reset bot default values
	 */
	_reset() {
		this._running = false
		this._currentTab = null
		this._currentUrl = null
		this._currentStep = null
		this._steps = []
		this._limits = {}
	}

	/**
	 * @constructor
	 */
	constructor() {
		this._reset()
		this._eventBus = new EventBus(this)
	}

	/**
	 * Get tag URL
	 * @param {string} tag - Tag name
	 */
	_getTagUrl(tag) {
		return `${this.constructor.BASE_URL}explore/tags/${tag}/`
	}

	/**
	 * Can execute action in specified step
	 * @param {object} actions - Profile actions
	 * @param {string} action - Action name
	 * @param {string} step - Step name
	 */
	_canExecuteStepAction(actions, action, step) {
		return actions[action]
			&& actions[action].active
			&& actions[action][step]
	}

	/**
	 * Can execute actions in specified step
	 * @param {object} actions - Profile actions
	 * @param {array} allowedActions - Allowed Actions in step
	 * @param {string} step - Step name
	 */
	_canExecuteStepActions(actions, allowedActions, step) {
		return allowedActions.some(action => this._canExecuteStepAction(actions, action, step))
	}

	/**
	 * Build bot run steps based on options
	 * @todo - Automate with configurations
	 * @param {object} profile - Profile
	 * @param {object} options - Profile options
	 */
	_buildRunSteps(profile, { remaining, actions }) {
		const count = {
			like: 0,
			follow: 0,
		}

		// Tags
		if (this._canExecuteStepActions(actions, ['like', 'follow'], 'tags')) {
			const tags = {
				name: 'tags',
				params: shuffle(profile.tags),
				actions: [],
			}

			// Tags like
			if (this._canExecuteStepAction(actions, 'like', 'tags')
				&& remaining.likes) {
				tags.actions.push('like')
				count.like += tags.params.length
			}

			// Tags follow
			if (this._canExecuteStepAction(actions, 'follow', 'tags')
				&& remaining.follows) {
				tags.actions.push('follow')
				count.follow += tags.params.length
			}

			if (tags.actions.length) {
				this._steps.push(tags)
			}
		}

		this._limits = {
			like: Math.ceil(remaining.likes / count.like),
			follow: Math.ceil(remaining.follows / count.follow),
		}
	}

	/**
	 * Start to run bot
	 * @param {object} tab - Active tab
	 * @param {object} profile - Profile
	 * @param {object} options - Profile options
	 */
	start(tab, profile, options) {
		if (this._running) { return }

		this._buildRunSteps(profile, options)
		if (!this._steps.length) {
			this._reset()
			return
		}

		this._running = true
		this._currentTab = tab
		this._currentStep = this._steps.shift()
		this.process()
	}

	/**
	 * Process next bot action
	 */
	process() {
		if (!this._running) { return }

		const param = this._currentStep.params.shift()
		if (!param) {
			this._currentStep = this._steps.shift()
		}
		if (!this._currentStep) {
			this.wait()
			return
		}

		switch (this._currentStep.name) {
		case 'tags':
			this._currentUrl = this._getTagUrl(param)
			this.trigger('process', this._currentTab, this._currentUrl)
			break
		default:
		}
	}

	/**
	 * Return running status
	 * @return {boolean} - Whether the bot is running
	 */
	isRunning() {
		return this._running
	}

	/**
	 * Return if the current tab is processing the bot
	 * @param {object} tab - Chrome tab
	 */
	isProcessing(tab) {
		const sameTab = tab.id === (this._currentTab ? this._currentTab.id : -1)
		return this.isRunning() && sameTab
	}

	/**
	 * Return current step
	 * @return {object} - Current step including limits
	 */
	getStep() {
		if (!this.isRunning()) { return null }
		return {
			...this._currentStep,
			limits: this._limits,
		}
	}

	/**
	 * Check processing tab if tab can still process or bot needs to end
	 * @param {object} tab - Chrome tab
	 */
	check(tab) {
		if (this.isProcessing(tab) && tab.url !== this._currentUrl) {
			this.end()
		}
	}

	/**
	 * @todo - Make something more solid, only temporary
	 * Should wait, but for now only end the bot
	 */
	wait() {
		this.end()
	}

	/**
	 * End bot
	 */
	end() {
		if (!this._running) { return }
		this.trigger('end', this._currentTab)
		this._reset()
	}
}
