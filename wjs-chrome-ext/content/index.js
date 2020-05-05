/*
	global
	Widget
	Bot
	ChromeBus
*/
const _wjsExtension = () => {
	const widget = new Widget()
	const bot = new Bot() // Bot
	const chromeBus = new ChromeBus(chrome)

	let username = null // Username found

	/**
	 * Init IG username
	 */
	function initUsername() {
		const profileIcon = document.querySelector('[class*="glyphsSpriteUser__outline"]')
		if (!profileIcon) { return }

		const profileLink = profileIcon.parentNode
		if (!profileLink) { return }
		username = profileLink.getAttribute('href').replace(/\/(.*)\//, '$1')
		console.log(username)
	}

	function startAutomation(step) {
		widget.lockWindow()
		widget.setState('working')
		bot.start(step)
	}

	function stopAutomation() {
		bot.stop()
		widget.unlockWindow()
		widget.setState('ready')
	}

	function sendStart() {
		chromeBus.send('start', { username })
	}

	function sendStop() {
		chromeBus.send('stop')
	}

	function sendEnd() {
		chromeBus.send('end')
	}

	/**
	 * Login to WeJustSocial
	 * @param {string} email - Email
	 * @param {string} password - Password
	 */
	function sendLogin(email, password) {
		chromeBus.send('login', { email, password, username })
	}

	/**
	 * On initialization response
	 * @param {object} params - Parameters
	 */
	chromeBus.on('init', (params) => {
		if (params.running) {
			widget.setState('working')
			if (params.processing) {
				startAutomation(params.step)
			}
		} else if (!params.isAuthenticated) {
			widget.setState('login')
		} else if (!params.hasProfile) {
			widget.setState('noaccount')
		} else {
			widget.setState('ready')
		}
	})

	/**
	 * On login response
	 * @param {object} params - Parameters
	 */
	chromeBus.on('login', (params) => {
		if (params.isAuthenticated) {
			if (!params.hasProfile) {
				widget.setState('noaccount')
			} else {
				widget.setState('ready')
			}
		} else {
			widget.setState('login')
			widget.openDialog('login', {
				error: 'Bad credentials',
			})
		}
	})

	/**
	 * On end response
	 */
	chromeBus.on('end', () => {
		stopAutomation()
	})

	/**
	 * On bot action
	 */
	bot.on('action', (action, target) => {
		chromeBus.send('action', { username, action, target })
	})

	/**
	 * On bot end
	 */
	bot.on('end', () => {
		sendEnd()
	})

	/**
	 * Init link to background process
	 */
	function init() {
		initUsername()

		chromeBus.send('init', { username })
	}

	/**
	 * Add DOM listeners
	 */
	window.addEventListener('load', () => {
		widget.inject()

		// Start automating process
		document.querySelector('#wjs-action-start').addEventListener('click', (event) => {
			event.preventDefault()
			widget.setState('working')

			// In case no automation can be done at the moment
			setTimeout(() => {
				widget.setState('ready')
			}, 5000)
			sendStart()
		}, false)

		// Open login dialog box
		document.querySelector('#wjs-action-login').addEventListener('click', (event) => {
			event.preventDefault()
			widget.openDialog('login')
		}, false)

		// Log in to WJS
		document.querySelector('#wjs-form-action-login').addEventListener('click', (event) => {
			event.preventDefault()

			// @todo - Automate this one day
			const email = document.querySelector('#wjs-dialog-login input[name="email"]').value
			const password = document.querySelector('#wjs-dialog-login input[name="password"]').value

			sendLogin(email, password)
			widget.setState('loading')
			widget.closeDialog()
		}, false)

		// Close dialog box
		document.querySelector('#wjs-dialog-close').addEventListener('click', (event) => {
			event.preventDefault()
			widget.closeDialog()
		}, false)

		// Listen to keys
		document.addEventListener('keydown', (event) => {
			if (bot.isRunning()) {
				switch (event.which) {
				// Spacebar
				case 32:
					console.log('Skipping')
					bot.skip()
					break
				// Esc
				case 27:
					console.log('Stopping...')
					bot.stop()
					sendStop()
					break
				default:
				}
			}
		})

		// Initialize
		init()
	})
}

_wjsExtension()
