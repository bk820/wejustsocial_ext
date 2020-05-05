/*
	global
	EventBus
	randInt
	sleep
	LIKE_PERCENTAGE
	FOLLOW_PERCENTAGE
	SLEEP_ACTION
	SLEEP_TIME
*/
// eslint-disable-next-line no-unused-vars
class Bot {
	/**
	 * @constructor
	 */
	constructor() {
		this._settings = {}
		this._running = false
		this._skipping = false
		this._eventBus = new EventBus(this)
	}

	/**
	 * Whether the bot is acting
	 * @param {number} percentage - Percentage of taking action (X out of 100)
	 * @return {boolean} - Whether is allowed to act
	 */
	_isActing(percentage) {
		return randInt(1, 100) <= percentage
	}

	/**
	 * Whether the bot can do specified action or not
	 * @param {string} action - Action name
	 */
	_canDoAction(action) {
		return this._settings[action]
			&& this._settings[action].remaining
			&& !this._skipping
	}

	/**
	 * Confirm action has been executed
	 * @param {string} action - Action name
	 * @param {string} username - IG username
	 */
	_confirmAction(action, username) {
		this._settings[action].remaining -= 1
		this.trigger('action', action, username)
	}

	/**
	 * Get remaining actions
	 * @return {number} - Remaining actions
	 */
	getRemainingActions() {
		return Object.keys(this._settings).reduce((acc, action) => acc
			+ (this._settings[action].remaining || 0), 0)
	}

	/**
	 * Get total actions
	 * @return {number} - Total actions
	 */
	getTotalActions() {
		return Object.keys(this._settings).reduce((acc, action) => acc
			+ (this._settings[action].total || 0), 0)
	}

	/**
	 * Close post popup
	 */
	closePostPopup() {
		const button = document.querySelector('div[role="dialog"] > button')
		if (button) {
			button.click()
		}

		if (this._running) {
			this.stop()
			this.trigger('end')
		}
	}

	/**
	 * Like post in popup
	 * @param {string} username - Username
	 */
	async likePopup(username) {
		if (!this._canDoAction('like')) {
			return
		}

		const like = document.querySelector('div[role="dialog"] [class*="glyphsSpriteHeart__outline"]')
		if (like && this._isActing(LIKE_PERCENTAGE)) {
			await sleep(SLEEP_ACTION)

			like.parentNode.click()
			console.log('Post liked')

			this._confirmAction('like', username)
		}
	}

	/**
	 * Follow user in popup
	 * @param {string} username - Username
	 */
	async followPopup(username) {
		if (!this._canDoAction('follow')) {
			return
		}

		const button = document.querySelector('div[role="dialog"] header button')
		if (button) {
			const buttonStyle = getComputedStyle(button)

			if ((buttonStyle.color === 'rgb(56, 151, 240)'
				|| buttonStyle.color === '#3897f0')
				&& this._isActing(FOLLOW_PERCENTAGE)) {
				await sleep(SLEEP_ACTION)

				button.click()
				console.log('User followed')

				this._confirmAction('follow', username)
			}
		}
	}

	/**
	 * Go to next post within popup
	 * @param {number} i - Post index
	 */
	async nextPopupPost(i) {
		if (!this._running) {
			this.closePostPopup()
			return
		}

		const link = document.querySelector('div[role="dialog"] a.coreSpriteRightPaginationArrow')
		if (link) {
			link.click()
			await sleep(SLEEP_TIME)
			this.triggerPopupActions(i + 1)
		} else {
			this.closePostPopup()
		}
	}

	/**
	 * Trigger actions in a post popup
	 * @param {number} i - Post index
	 */
	async triggerPopupActions(i) {
		// If not running, close popup
		if (!this._running) {
			this.closePostPopup()
			return
		}

		// If username not found, terminate bot (Should not happen)
		const title = document.querySelector('div[role="dialog"] h2 > a.notranslate')
		if (!title) {
			this.closePostPopup()
			return
		}
		const username = title.innerHTML
		console.log(`@${username} - Starting actions`)

		// Process actions
		await this.likePopup(username)
		await this.followPopup(username)
		if (!this._skipping) {
			await sleep(SLEEP_TIME)
		}
		this._skipping = false	// Reset skipping

		console.log(this.getRemainingActions())
		console.log(this.getTotalActions())
		if (this.getRemainingActions()) {
			this.nextPopupPost(i)
		} else {
			this.closePostPopup()
		}
	}

	/**
	 * Click on first post to open popup
	 */
	async clickPost() {
		const post = document.querySelector('a[href*="/p/"]')
		if (post) {
			post.click()
			await sleep(SLEEP_TIME)
			this.triggerPopupActions(1)
		}
	}

	/**
	 * Init bot settings using server settings
	 * @param {array} actions - Actions
	 * @param {object} limits - Action limits
	 * @return {object} - Bot settings
	 */
	_initSettings(actions, limits) {
		return actions.reduce((acc, action) => {
			if (limits[action]) {
				acc[action] = {
					remaining: limits[action],
					total: limits[action],
				}
			}
			return acc
		}, {})
	}

	/**
	 * Get actions from run type
	 * @param {string} type - Run type
	 * @return {array} - Actions
	 */
	static getActionsFromType(type) {
		switch (type) {
		case 'tags':
			return ['like', 'follow']
		case 'unfollow':
			return ['unfollow']
		default:
			return []
		}
	}

	/**
	 * Start run
	 * @param {string} type - Run type
	 */
	startRun(type) {
		switch (type) {
		case 'tags':
			this.clickPost()
			break
		default:
		}
	}

	/**
	 * Return bot running status
	 * @return {boolean} - Whether the bot is running
	 */
	isRunning() {
		return this._running
	}

	/**
	 * Skip next actions
	 */
	skip() {
		if (!this._running) { return }
		this._skipping = true
	}

	/**
	 * Start the bot
	 * @param {object} step - Run step
	 */
	start(step) {
		if (this._running) { return }

		const { name, actions, limits } = step
		if (!actions.length) { return }

		this._settings = this._initSettings(actions, limits)
		this._running = true
		this._skipping = false
		this.startRun(name)
	}

	/**
	 * Stop the bot
	 */
	stop() {
		if (!this._running) { return }

		this._running = false
		this._skipping = false
	}
}
