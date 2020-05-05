const { redirectToHTTPS } = require('express-http-to-https')

module.exports = () => {
	if (process.env.HTTPS_REDIRECT === 'true') {
		return redirectToHTTPS([], [], 301)
	}

	return (req, res, next) => { next() }
}
