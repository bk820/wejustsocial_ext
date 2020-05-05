const ProfileModel = require('../profile')

module.exports = {
	name: 'metric',
	namespace: 'metrics',
	cache: true,
	global: true,
	protected: {
		read: true,
		create: true,
	},
	private: {
		update: true,
		delete: true,
	},
	fields: {
		date: {
			type: 'date',
			description: 'Metrics date',
			required: true,
			index: true,
		},
		profile: {
			type: 'string',
			description: 'Instagram profile',
			$ref: ProfileModel,
			required: true,
		},
		followers: {
			type: 'number',
			description: 'Instagram followers',
		},
		following: {
			type: 'number',
			description: 'Instagram followers',
		},
		posts: {
			type: 'number',
			description: 'Instagram posts',
		},
	},
}
