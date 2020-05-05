module.exports = {
	name: 'plan',
	namespace: 'plans',
	cache: true,
	global: true,
	protected: true,
	fields: {
		name: {
			type: 'string',
			description: 'Name',
			required: true,
		},
		description: {
			type: 'string',
			description: 'Description',
		},
		features: {
			type: 'array',
			description: 'Plan features',
		},
		price: {
			type: 'number',
			description: 'Price',
		},
		default: {
			type: 'boolean',
			description: 'Whether is default plan',
		},
		currency: {
			type: 'string',
			description: 'Price currency code (ISO 4217)',
		},
		actions: {
			type: 'object',
			description: 'Action parameters',
		},
	},
}
