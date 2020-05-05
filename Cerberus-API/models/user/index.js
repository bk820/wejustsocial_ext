const RoleModel = require('../role')

module.exports = {
	name: 'user',
	namespace: 'users',
	cache: true,
	asOwner: true,
	batch: {
		create: 0,
	},
	protected: {
		read: true,
		update: true,
		delete: true,
	},
	fields: {
		email: {
			type: 'string',
			description: 'User email',
			required: true,
			validations: {
				format: 'email',
			},
			unique: true,
		},
		password: {
			type: 'string',
			description: 'User password',
			restricted: true,
			required: true,
			validations: {
				min: 8,
				max: 20,
			},
			hashed: true,
		},
		role: {
			type: 'string',
			description: 'User role',
			$ref: RoleModel,
			required: true,
		},
		firstname: {
			type: 'string',
			description: 'User first name',
		},
		lastname: {
			type: 'string',
			description: 'User last name',
		},
		gender: {
			type: 'string',
			description: 'User gender',
		},
	},
}
