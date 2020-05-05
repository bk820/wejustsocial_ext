const ProfileModel = require('../profile')

module.exports = {
	name: 'dailymetric',
	namespace: 'dailymetrics',
	cache: true,
	global: true,
	protected: {
		read: true,
		update: true,
	},
	private: {
		delete: true,
	},
	fields: {
		date: {
			type: 'date',
			description: 'Metrics date',
			required: true,
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
	indexes: [
		{
			fields: ['date', 'profile'],
			unique: true,
		},
	],
}
