const InstanceModel = require('../instance')
const PlanModel = require('../plan')
const StageModel = require('../stage')

module.exports = {
	name: 'profile',
	namespace: 'profiles',
	cache: true,
	protected: true,
	fields: {
		username: {
			type: 'string',
			description: 'Instagram profile username',
			required: true,
			encrypted: true,
			unique: true,
		},
		password: {
			type: 'string',
			description: 'Instagram profile password',
			encrypted: true,
		},
		instance: {
			type: 'string',
			description: 'Instance ID',
			$ref: InstanceModel,
			restricted: true,
		},
		plan: {
			type: 'string',
			description: 'Plan ID',
			$ref: PlanModel,
			required: true,
			restricted: true,
		},
		stage: {
			type: 'string',
			description: 'Stage ID',
			$ref: StageModel,
			required: true,
			restricted: true,
		},
		comments: {
			type: 'array',
			description: 'Instagram comments',
			required: true,
		},
		excludes: {
			type: 'array',
			description: 'Instagram tags exclusions',
			required: true,
		},
		ignores: {
			type: 'array',
			description: 'Instagram tags to ignore',
			required: true,
		},
		tags: {
			type: 'array',
			description: 'Instagram tags',
			required: true,
			validations: {
				max: 5,
			},
		},
		picture: {
			type: 'string',
			description: 'Instagram profile picture',
		},
		status: {
			type: 'number',
			description: '1=Inactive,2=Unverified,4=Wrong password',
		},
		actions: {
			type: 'object',
			description: 'Action parameters',
		},
		extensions: {
			type: 'object',
			description: 'Action-specific options',
		},
		limits: {
			type: 'object',
			description: 'Action limits',
		},
		lastVerified: {
			type: 'date',
			description: 'Last verification',
		},
		verificationCode: {
			type: 'string',
			description: 'Verification code',
			encrypted: true,
		},
	},
}
