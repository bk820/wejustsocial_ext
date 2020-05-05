const ProfileModel = require('../profile')

module.exports = {
	name: 'follow',
	namespace: 'follows',
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
			description: 'Follow date',
			required: true,
		},
		profile: {
			type: 'string',
			description: 'Instagram profile',
			$ref: ProfileModel,
			required: true,
		},
		target: {
			type: 'string',
			description: 'Instagram target profile',
			required: true,
		},
	},
	indexes: [{
		fields: ['profile', 'date'],
	}],
}
