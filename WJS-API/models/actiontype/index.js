module.exports = {
	name: 'actiontype',
	namespace: 'actiontypes',
	cache: true,
	global: true,
	protected: true,
	fields: {
		name: {
			type: 'string',
			description: 'Action name',
			required: true,
		},
		// The use of shortcode is to prevent fetching action types in different environments
		// for the Python scripts and the NodeJS handling scripts
		shortcode: {
			type: 'string',
			description: 'Action code to be used in plans and profiles',
			required: true,
			unique: true,
		},
		description: {
			type: 'string',
			description: 'Action description',
		},
		parameters: {
			type: 'array',
			description: 'Action parameters',
		},
	},
}
