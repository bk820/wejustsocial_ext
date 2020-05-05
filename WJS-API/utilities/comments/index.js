const fs = require('fs')

const comments = JSON.parse(fs.readFileSync(`${__dirname}/comments.json`))

module.exports = class CommentsUtility {
	/**
	 * @constructor
	 */
	constructor() {
		throw new Error('Can\'t instantiate utility classes')
	}

	/**
	 * Generate comment
	 * @return {string} - Generated comment
	 */
	static generateComment() {
		return comments
			.map(part => part[Math.floor(Math.random() * part.length)])
			.join(' ')
	}

	/**
	 * Generate multiple comments
	 * @param {number} nb - Number of comments to generate
	 */
	static generateComments(nb) {
		const generated = []
		for (let i = 0; i < nb; i += 1) {
			generated.push(this.generateComment())
		}
		return generated
	}
}
