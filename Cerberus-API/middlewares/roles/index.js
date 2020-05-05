const ConnectRoles = require('connect-roles')
const I18n = require('../../i18n')

const roles = new ConnectRoles({
	failureHandler: (req, res) => {
		res.status(403).json({ message: new I18n('ERROR_AUTH_ACCESSDENIED').toString() })
	},
})

roles.use((req, action) => {
	const model = action.split('.')[0]
	return (req.user.permissions['*']
		|| req.user.permissions[model]
		|| req.user.permissions[action])
})

module.exports = roles
