module.exports = {
	name: 'actionlimit',
	namespace: 'actionlimits',
	cache: true,
	global: true,
	protected: true,
	fields: {
		name: {
			type: 'string',
			description: 'Action limit name',
			required: true,
		},
		shortcode: {
			type: 'string',
			description: 'Action limit code to be used in plans and profiles',
			required: true,
			unique: true,
		},
		description: {
			type: 'string',
			description: 'Action limit description',
		},
	},
}
