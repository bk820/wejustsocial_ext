/* eslint-disable no-unused-vars */

/**
 * Async sleep for in ms
 * @param {number} ms - Milliseconds to sleep
 * @return {object} - Promise
 */
async function sleep(ms) {
	return new Promise(resolve => setTimeout(() => {
		resolve()
	}, ms))
}

/**
 * Return a random integer between min and max (inclusive)
 * @param {number} min - Min value
 * @param {number} max - Max value
 */
function randInt(min, max) {
	const iMin = Math.ceil(min)
	const iMax = Math.floor(max)

	return Math.floor((Math.random() * (iMax - iMin + 1)) + iMin)
}

/**
 * Array to shuffle
 * @param {array} arr - Array to shuffle
 * @return {array} - Shuffled array
 */
function shuffle(arr) {
	const copy = [...arr]
	const final = []

	while (copy.length) {
		const max = copy.length - 1
		const i = max ? randInt(0, max) : 0
		final.push(copy[i])
		copy.splice(i, 1)
	}

	return final
}
