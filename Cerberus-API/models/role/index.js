module.exports = {
	name: 'role',
	namespace: 'roles',
	cache: true,
	protected: true,
	global: true,
	fields: {
		name: {
			type: 'string',
			description: 'Role name',
			required: true,
		},
		skipOwnership: {
			type: 'boolean',
			description: 'Whether to skip ownership of entries',
		},
		skipRestrictions: {
			type: 'boolean',
			description: 'Whether to ignore restriction flag in fields of entries',
		},
		default: {
			type: 'boolean',
			description: 'Default role',
			required: true,
		},
		permissions: {
			type: 'object',
			description: 'Role permissions',
			required: true,
		},
	},
}
