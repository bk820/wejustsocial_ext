const fs = require('fs')

const UtilityInterface = require('../interface')

module.exports = class FileSystemUtility extends UtilityInterface {
	/**
	 * Load all modules from specified folder and return them
	 * @param {string} - Folder path to read
	 * @param {array} - Files to exclude
	 * @return {object} - Loaded modules
	 */
	static loadAllModulesFromFolder(folder, exclusions = []) {
		const modules = {}
		fs.readdirSync(folder).forEach((filename) => {
			if (filename === 'index.js' || exclusions.indexOf(filename) !== -1) { return }
			/* eslint-disable */
			modules[filename] = require(`${folder}/${filename}`)
			/* eslint-enable */
		})
		return modules
	}
}
