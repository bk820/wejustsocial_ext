module.exports = {
	name: '[REQUIRED] Template name',
	namespace: '[REQUIRED] Template namespace (data stores namespace)',
	cache: 'Whether caching activated for this model (true|false). Default: false',
	asOwner: 'Whether the model entry is its own owner',
	private: 'Whether the model is reflected as a controller or only for internal use (true|false). Default false.',
	protected: 'Whether model is only accessible via authentication (true|false). Default false.',
	// Variant #1 of protected field, use for more flexibility on specific CRUD operations
	__protected_1: {
		read: 'Whether model needs authentication for read access',
		create: 'Whether model needs authentication for create access',
		update: 'Whether model needs authentication for update access',
		delete: 'Whether model needs authentication for delete access',
	},
	batch: {
		create: 'Maximum number of entries creation for a batch. 0 to deactivate batching',
		update: 'Maximum number of entries modification for a batch. 0 to deactivate batching',
		delete: 'Maximum number of entries deletion for a batch. 0 to deactivate batching',
	},
	fields: {
		email: {
			type: '[RECOMMANDED] Native javascript type. Use array if field can have multiple types',
			__type_options: {
				number: 'Number (Int|Float)',
				object: 'Object',
				array: 'Array',
				string: 'String',
				boolean: 'Boolean',
				date: 'ISO date/time/datetime (String)',
			},
			description: '[REQUIRED] Field description',
			required: 'Whether the field is required or not (true|false). Default: false',
			validations: {
				format: '[Only for string type]. Can specify one format to validate the string against',
				// List of available format values
				__format_values: ['url', 'email'],
				min: 'Minimum number, number of characters in string or number of elements in array',
				max: 'Maximum number, number of characters in string or number of elements in array',
			},
			encrypted: 'Whether the field is encrypted',
			hashed: 'Whether the field is hashed',
			$ref: 'Link to the Cerberus model reference. Automatically set reference field as index',
			index: 'Whether to index the field',
			unique: 'Whether to index the field as a unique field',
		},
		// ...
	},
	indexes: [
		{
			fields: 'Array of fields to index',
			unique: 'Whether the index is unique',
		},
		// ...
	],
}
