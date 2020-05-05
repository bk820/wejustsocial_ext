const AWS = require('aws-sdk')

const API_VERSION = '2016-11-15'
const REGION = 'ca-central-1'
const ASSOCIATION_WAIT = 30000

module.exports = class EC2Service {
	/**
	 * @constructor
	 */
	constructor({ region } = {}) {
		AWS.config.update({ region: region || REGION })
		this._ec2 = new AWS.EC2({ apiVersion: API_VERSION })
	}

	/**
	 * Create new AWS EC2 instance
	 * @param {string} imageId - Image ID
	 * @param {string} type - Instance type (t1.micro)
	 * @param {string} keyName - Instance key pair name
	 * @return {string} - Instance ID
	 */
	async createInstance(imageId, type, keyName, {
		securityGroups,
		name,
	} = {}) {
		const instance = {
			ImageId: imageId,
			InstanceType: type,
			KeyName: keyName,
			MinCount: 1,
			MaxCount: 1,
		}

		if (securityGroups) {
			instance.SecurityGroupIds = Array.isArray(securityGroups) ? securityGroups : [securityGroups]
		}
		if (name) {
			instance.TagSpecifications = [
				{
					ResourceType: 'instance',
					Tags: [{
						Key: 'Name',
						Value: name,
					}],
				},
			]
		}
		const result = await this._ec2.runInstances(instance).promise()

		if (!result || !result.Instances.length) {
			throw new Error('[EC2Service] EC2 instance isn\'t defined, an error has been found in the creation process')
		}
		const instanceId = result.Instances[0].InstanceId
		const allocatedAddress = await this.allocateAddress()

		this.associateAddress(allocatedAddress.AllocationId, instanceId, true)

		return instanceId
	}

	/**
	 * Allocate a new EC2 Elastic IP address
	 * @param {string} domain - Address domain
	 * @return {object} - Allocation status response
	 */
	async allocateAddress(domain = 'vpc') {
		return this._ec2.allocateAddress({ Domain: domain }).promise()
	}

	/**
	 * Associate EC2 instance with EC2 Elastic IP address
	 * @param {string} allocationId - Elastic IP allocation ID
	 * @param {string} instanceId - Instance ID
	 * @param {boolean} wait - Wait preferred time before trying to associate EC2
	 * @return {object} - Association status response
	 */
	async associateAddress(allocationId, instanceId, wait = false) {
		if (wait) {
			await new Promise((resolve) => {
				setTimeout(() => { resolve() }, ASSOCIATION_WAIT)
			})
		}
		return this._ec2.associateAddress({
			AllocationId: allocationId,
			InstanceId: instanceId,
		}).promise()
	}
}
