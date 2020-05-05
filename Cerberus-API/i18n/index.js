const FileSystemUtility = require('../utilities/filesystem')

const DICTIONARIES = FileSystemUtility.loadAllModulesFromFolder(`${__dirname}`)

module.exports = class I18n {
	/**
	 * Build and return locale string
	 * @param {array} variables - Variables
	 */
	_buildLocaleMessage(variables) {
		if (!this._dictionary[this._id]) { return this._id }
		const replaces = variables && Array.isArray(variables) ? variables : []
		return this._dictionary[this._id].replace(/\{\{([0-9]+)\}\}/g, (match, i) => (replaces[i] ? replaces[i] : ''))
	}

	/**
	 * @constructor
	 * @param {string} stringId - I18n string ID
	 * @param {object} options - I18n options
	 * @param {array} variables - Variables
	 */
	constructor(id, { locale } = {}, ...variables) {
		this._dictionary = DICTIONARIES[locale || process.env.LOCALE]
			|| DICTIONARIES[process.env.LOCALE]
		if (!this._dictionary) {
			throw new Error('[I18n] Inexisting default locale dictionary')
		}

		this._id = id
		this._message = this._buildLocaleMessage(variables && variables[0]
			&& Array.isArray(variables[0]) ? variables[0] : variables)
	}

	toString() {
		return this._message
	}
}
