module.exports = {
	name: 'stage',
	namespace: 'stages',
	cache: true,
	global: true,
	protected: true,
	fields: {
		name: {
			type: 'string',
			description: 'Stage name',
			required: true,
		},
		default: {
			type: 'boolean',
			description: 'Whether is default stage',
		},
		limits: {
			type: 'object',
			description: 'Action limits',
			required: true,
		},
	},
}
