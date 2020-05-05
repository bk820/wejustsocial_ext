// eslint-disable-next-line no-unused-vars
class Widget {
	/**
	 * Initialize widget HTML
	 * @return {object} - Widget node
	 */
	_initWidget() {
		const widget = document.createElement('div')
		widget.id = 'wjs-widget'
		widget.innerHTML = `
			<a href="#" id="wjs-action-start" class="hidden wjs-button">Start</a>
			<a href="#" id="wjs-action-working" class="hidden wjs-button">Working</a>
			<a href="#" id="wjs-action-login" class="hidden wjs-button">Login</a>
			<a href="#" id="wjs-action-addaccount" class="hidden wjs-button">Add account</a>
			<div id="wjs-state-loading">Loading...</div>
		`

		return widget
	}

	/**
	 * Initialize dialog HTML
	 * @return {object} - Dialog node
	 */
	_initDialog() {
		const dialog = document.createElement('div')

		dialog.id = 'wjs-dialog'
		dialog.innerHTML = `
			<div class="wjs-dialog-content" id="wjs-dialog-login">
				<div class="wjs-dialog-error">This is an error</div>
				<div class="wjs-dialog-row">
					<label>
						<div>Email</div>
						<input type="email" name="email" required placeholder="example@domain.com" />
					</label>
				</div>
				<div class="wjs-dialog-row">
					<label>
						<div>Password</div>
						<input type="password" name="password" required placeholder="Password" />
					</label>
				</div>
				<div class="wjs-dialog-row">
					<a href="#" class="wjs-button" id="wjs-form-action-login">Login</a>
				</div>
			</div>
			<a href="#" id="wjs-dialog-close">+</a>
		`

		return dialog
	}

	/**
	 * Initialize overlay HTML
	 * @return {object} - Overlay node
	 */
	_initOverlay() {
		const overlay = document.createElement('div')
		overlay.id = 'wjs-overlay'

		return overlay
	}

	/**
	 * Initialize lock HTML
	 * @return {object} - Lock node
	 */
	_initLock() {
		const lock = document.createElement('div')
		lock.id = 'wjs-lock'

		return lock
	}

	/**
	 * @constructor
	 */
	constructor() {
		this._widget = this._initWidget()
		this._dialog = this._initDialog()
		this._overlay = this._initOverlay()
		this._lock = this._initLock()

		this._injected = false
	}

	/**
	 * Inject widget to content body
	 */
	inject() {
		if (this._injected) { return }

		const body = document.querySelector('body')
		body.append(this._lock)
		body.append(this._widget)
		body.append(this._overlay)
		body.append(this._dialog)
		this._injected = true
	}

	/**
	 * Set state of the widget
	 * @param {string} state - State name
	 */
	setState(state) {
		const startButton = document.querySelector('#wjs-action-start')
		const addAccountButton = document.querySelector('#wjs-action-addaccount')
		const workingButton = document.querySelector('#wjs-action-working')
		const loginButton = document.querySelector('#wjs-action-login')
		const loading = document.querySelector('#wjs-state-loading')

		startButton.classList.add('hidden')
		workingButton.classList.add('hidden')
		loginButton.classList.add('hidden')
		addAccountButton.classList.add('hidden')
		loading.classList.add('hidden')

		switch (state) {
		case 'ready':
			startButton.classList.remove('hidden')
			break
		case 'working':
			workingButton.classList.remove('hidden')
			break
		case 'login':
			loginButton.classList.remove('hidden')
			break
		case 'noaccount':
			addAccountButton.classList.remove('hidden')
			break
		case 'loading':
			loading.classList.remove('hidden')
			break
		default:
		}
	}

	/**
	 * Set dialog error
	 * @param {string} - Content ID
	 * @param {string} - Error message
	 */
	setDialogError(id, message) {
		const error = document.querySelector(`#wjs-dialog-${id} .wjs-dialog-error`)
		if (message) {
			error.innerHTML = message
			error.classList.add('active')
		} else {
			error.innerHTML = ''
			error.classList.remove('active')
		}
	}

	/**
	 * Open dialog box
	 * @param {string} id - Content ID
	 * @param {object} params - Extra parameters
	 */
	openDialog(id, { errMessage } = {}) {
		const dialog = document.querySelector('#wjs-dialog')
		const content = document.querySelector(`#wjs-dialog-${id}`)
		const overlay = document.querySelector('#wjs-overlay')

		// Can't find dialog box with ID
		if (!content) { return }

		this.setDialogError(errMessage)
		dialog.classList.add('open')
		content.classList.add('active')
		overlay.classList.add('active')
	}

	/**
	 * Close dialog box
	 */
	closeDialog() {
		const dialog = document.querySelector('#wjs-dialog')
		const content = document.querySelector('.wjs-dialog-content.active')
		const overlay = document.querySelector('#wjs-overlay')

		dialog.classList.remove('open')
		content.classList.remove('active')
		overlay.classList.remove('active')
	}

	/**
	 * Lock window
	 */
	lockWindow() {
		const lock = document.querySelector('#wjs-lock')
		lock.classList.add('active')
	}

	/**
	 * Unlock window
	 */
	unlockWindow() {
		const lock = document.querySelector('#wjs-lock')
		lock.classList.remove('active')
	}
}
