const crypto = require('crypto')
const bcrypt = require('bcrypt')

const UtilityInterface = require('../interface')

const IV_LENGTH = 16
const SALT_ROUNDS = 10
const KEY = process.env.CRYPTO_KEY
const ALG = process.env.CRYPTO_ALG

module.exports = class CryptoUtility extends UtilityInterface {
	/**
	 * Encrypt text and returns the encrypted text
	 * @param {string} text - Text to encrypt
	 * @return {string} - Encrypted text
	 */
	static encrypt(text) {
		const iv = crypto.randomBytes(IV_LENGTH)
		const cipher = crypto.createCipheriv(ALG, Buffer.from(KEY), iv)

		let encrypted = cipher.update(text)
		encrypted = Buffer.concat([encrypted, cipher.final()])

		return `${iv.toString('hex')}:${encrypted.toString('hex')}`
	}

	/**
	 * Decrypt encrypted text and returns the text
	 * @param {string} encrypted - Text to decrypt
	 * @return {string} - Decrypted text
	 */
	static decrypt(encrypted) {
		const parts = encrypted.split(':')
		const iv = Buffer.from(parts.shift(), 'hex')
		const encryptedText = Buffer.from(parts.join(':'), 'hex')
		const decipher = crypto.createDecipheriv(ALG, Buffer.from(KEY), iv)

		let decrypted = decipher.update(encryptedText)
		decrypted = Buffer.concat([decrypted, decipher.final()])

		return decrypted.toString()
	}

	/**
	 * Hash text
	 * @param {string} text - Text to hash
	 * @return {string} - hashed text
	 */
	static async hash(text) {
		return bcrypt.hash(text, SALT_ROUNDS)
	}

	/**
	 * Compare text against hashed text
	 * @param {string} text - Text to compare
	 * @param {string} hash - Hashed text
	 * @return {boolean} - Comparison result
	 */
	static async compareToHash(text, hash) {
		return bcrypt.compare(text, hash)
	}
}
