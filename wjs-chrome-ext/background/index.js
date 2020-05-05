/*
	global
	Bot
	Storage
	ChromeBus
	Cerberus
*/
const bot = new Bot()
const storage = new Storage(chrome)
const chromeBus = new ChromeBus(chrome)

let cerberus = null

const profilesMap = {}

async function initCerberus() {
	if (cerberus) { return }
	const jwt = await storage.get('jwt')
	cerberus = new Cerberus(jwt || null)
}

function getProfileID(username) {
	return profilesMap[username]
}

async function getProfile(username) {
	if (getProfileID(username)) {
		return cerberus.request(`profiles/${profilesMap[username]}`)
	}
	const profiles = await cerberus.request('profiles?limit=1000')
	if (!profiles || !profiles.length) { return null }
	return profiles.find((profile) => {
		profilesMap[username] = profile._id
		return profile.username === username
	})

	/* @todo - When the deed is done
	if (!cerberus) { return null }
	const profiles = await cerberus.request(`profiles?username=${username}&limit=1`)
	if (!profiles || !profiles.length) { return null}
	return profiles[0]
	*/
}

async function getOptions(id) {
	return cerberus.request(`profiles/${id}/options`)
}

async function sendAction(username, action, target) {
	const id = getProfileID(username)
	if (['like', 'follow', 'unfollow'].indexOf(action) === -1
		|| !id
	) {
		return
	}

	await cerberus.request(`profiles/${id}/${action}`, {
		method: 'post',
		body: {
			target,
		},
	})
}

/**
 * On init message, fetch profile data and send initialisation data
 */
chromeBus.on('init', async ({ username }, tab) => {
	await initCerberus()
	const isAuthenticated = cerberus.isAuthenticated()
	const profile = await getProfile(username)

	bot.check(tab)

	chromeBus.sendTab(tab.id, 'init', {
		running: bot.isRunning(),
		processing: bot.isProcessing(tab),
		isAuthenticated,
		hasProfile: !!profile,
		step: bot.getStep(),
	})
})

/**
 * On start message, start the bot
 */
chromeBus.on('start', async ({ username }, tab) => {
	const profile = await getProfile(username)
	const options = profile ? await getOptions(profile._id) : null
	if (!profile || !options) { return }
	bot.start(tab, profile, options)
})

/**
 * On login message, log in to WJS API
 */
chromeBus.on('login', async ({ email, password, username }, tab) => {
	const jwt = await cerberus.login(email, password)
	let profile = null

	if (jwt) {
		await storage.set('jwt', jwt)
		profile = username ? await getProfile(username) : null
	}

	chromeBus.sendTab(tab.id, 'login', {
		isAuthenticated: cerberus.isAuthenticated(),
		hasProfile: !!profile,
	})
})

/**
 * On stop message, stop bot
 */
chromeBus.on('stop', () => {
	bot.end()
})

/**
 * On client bot end message, process bot next step
 */
chromeBus.on('end', () => {
	bot.process()
})

chromeBus.on('action', ({ username, action, target }) => {
	sendAction(username, action, target)
})

/**
 * On bot process, update URL
 */
bot.on('process', (tab, url) => {
	chrome.tabs.update(tab.id, { url })
})

/**
 * On bot end, end client bot
 */
bot.on('end', (tab) => {
	chromeBus.sendTab(tab.id, 'end')
})
