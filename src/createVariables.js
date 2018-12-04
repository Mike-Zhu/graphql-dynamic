const { deferred } = require('./util')

module.exports = (variables, timeout = 3000) => {
	let deferredMap = {}
	return new Proxy(variables || {}, {
		get(target, key) {
			// existed value
			if (key in target) {
				return target[key]
			}

			// async value
			if (!deferredMap.hasOwnProperty(key)) {
				deferredMap[key] = deferred()

				deferredMap[key].tid = setTimeout(() => {
					deferredMap[key].reject(
						new Error(`await for variable $${key} timeout`)
					)
				}, timeout)
			}

			return deferredMap[key].promise
		},
		set(target, key, value) {
			// read-only
			if (key in target) {
				return true
			}

			// dynamic
			if (!deferredMap.hasOwnProperty(key)) {
				target[key] = value
				return true
			}

			// async & dynamic
			deferredMap[key].resolve(value)
			clearTimeout(deferredMap[key].tid)
			return true
		}
	})
}
