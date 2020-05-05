module.exports = {
	name: 'instance',
	namespace: 'instances',
	cache: true,
	global: true,
	protected: {
		read: true,
	},
	private: {
		create: true,
		update: true,
		delete: true,
	},
	fields: {
		instance: {
			type: 'string',
			description: 'External instance ID',
			required: true,
			unique: true,
		},
		platform: {
			type: 'string',
			description: 'Instance platform name',
			required: true,
		},
		max: {
			type: 'number',
			description: 'Instance maximum Instagram profiles',
		},
		slots: {
			type: 'number',
			description: 'Number of slots available on the instance',
		},
	},
}
