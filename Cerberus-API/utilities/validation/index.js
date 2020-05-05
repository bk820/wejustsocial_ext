const { reduce, forEach } = require('lodash')
const moment = require('moment')
const validator = require('validator')

const UtilityInterface = require('../interface')
const I18n = require('../../i18n')

module.exports = class ValidationUtility extends UtilityInterface {
	/**
	 * Validate model projection
	 * @param {object} model - Cerberus model
	 * @param {array} projection - Projection
	 * @return {boolean} - Result
	 */
	static validateModelProjection(model, projection) {
		return projection.every(value => model.fields[value] && !model.fields[value].restricted)
	}

	/**
	 * Validate model entries
	 * @param {object} model  - Cerberus model
	 * @param {array} entries - Model entries
	 * @return {object} - Validation errors
	 */
	static validateModelEntries(model, entries, { skipRestriction, skipMissingRequirements } = {}) {
		const errors = entries.reduce((acc, entry, i) => {
			const entryErrors = this.validateModelEntry(model, entry, {
				skipRestriction,
				skipMissingRequirements,
			})
			if (entryErrors) {
				acc[i] = entryErrors
			}
			return acc
		}, {})

		return Object.keys(errors).length ? errors : null
	}

	/**
	 * Validate model entry
	 * @param {object} model  - Cerberus model
	 * @param {object} entry - Model entry
	 * @param {object} options - Validation options
	 * @return {object} - Validation errors
	 */
	static validateModelEntry(model, entry, { skipRestriction, skipMissingRequirements } = {}) {
		const processed = {}

		// Validate entry fields
		const errors = reduce(entry, (acc, value, field) => {
			if (field === 'id' || field === '_id') { return acc }

			processed[field] = true
			const fieldErrors = model.fields[field] && (
				skipRestriction || !model.fields[field].restricted
			)
				? this.validateModelField(model.fields[field], value)
				: [{ message: new I18n('VALIDATION_NOT_ALLOWED').toString() }]

			if (fieldErrors.length > 0) {
				acc[field] = fieldErrors
			}
			return acc
		}, {})

		// Validate requirements
		if (!skipMissingRequirements) {
			forEach(model.fields, (value, field) => {
				if (value.required && !processed[field]) {
					errors[field] = [{ message: new I18n('VALIDATION_REQUIRED').toString() }]
				}
			})
		}

		return Object.keys(errors).length ? errors : null
	}

	/**
	 * Validate type
	 * @param {string|array} type -  Type(s) to validate
	 * @param {string} value - Value to validate
	 */
	static validateType(type, value) {
		if (Array.isArray(type)) {
			return type.some(singleType => this.validateType(singleType, value))
		}

		switch (type) {
		case 'array':
			return Array.isArray(value)
		case 'date':
			return moment(value).isValid()
		default:
			return type === typeof value
		}
	}

	/**
	 * Validate string format
	 * @param {string} format - Format name
	 * @param {string} value - Value to validate
	 * @return {boolean} - Validation result
	 */
	static validateStringFormat(format, value) {
		switch (format) {
		case 'email':
			return validator.isEmail(value)
		case 'url':
			return validator.isURL(value)
		case 'date':
			return validator.isISO8601(value)
		default:
			return true
		}
	}

	/**
	 * Validate minimum and maximum boundaries
	 * @param {object} min  - Minimum value (null for no minimum)
	 * @param {object} max - Maximum value (null for no maximum)
	 * @param {object} value - Value to validate
	 * @return {object} - Minimum and maximum validation results
	 */
	static validateBoundaries(min, max, value) {
		switch (typeof value) {
		case 'string':
		case 'object':
			return {
				min: min || min === 0 ? value.length >= min : true,
				max: max || max === 0 ? value.length <= max : true,
			}
		case 'number':
			return {
				min: min || min === 0 ? value >= min : true,
				max: max || max === 0 ? value <= max : true,
			}
		default:
			return { min: true, max: true }
		}
	}

	/**
	 * Validate model field
	 * @param {object} fieldSchema  - Cerberus model field schema
	 * @param {object} value - Entry field value
	 * @return {array} - Validation errors
	 */
	static validateModelField(fieldSchema, value) {
		if (value === null || typeof value === 'undefined' || value === '') {
			if (fieldSchema.required) { return [{ message: new I18n('VALIDATION_REQUIRED').toString() }] }
			return []
		}
		if (fieldSchema.type && !this.validateType(fieldSchema.type, value)) {
			return [{ message: new I18n('VALIDATION_BADTYPE', {}, fieldSchema.type).toString() }]
		}
		if (!fieldSchema.validations) { return [] }

		const errors = []
		// Format validation
		if (typeof value === 'string'
			&& fieldSchema.validations.format
			&& !this.validateStringFormat(fieldSchema.validations.format, value)
		) {
			errors.push({
				message: new I18n(`VALIDATION_FORMAT_${fieldSchema.validations.format.toUpperCase()}`).toString(),
			})
		}

		// Boundaries validation
		if (fieldSchema.validations.min || fieldSchema.validations.max) {
			const boundaryValidation = this.validateBoundaries(
				fieldSchema.validations.min,
				fieldSchema.validations.max,
				value,
			)

			if (!boundaryValidation.min) {
				errors.push({
					message: new I18n(`VALIDATION_BOUNDARY_MIN_${(typeof value).toUpperCase()}`, {}, fieldSchema.validations.min).toString(),
				})
			}
			if (!boundaryValidation.max) {
				errors.push({
					message: new I18n(`VALIDATION_BOUNDARY_MAX_${(typeof value).toUpperCase()}`, {}, fieldSchema.validations.max).toString(),
				})
			}
		}
		return errors
	}
}
