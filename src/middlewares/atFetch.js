const URL = require('url')
const { fromEntries } = require('../util')
const isPlainObject = require('is-plain-object')

const atFetch = (ctx, next) => {
	ctx.directive('fetch', createFetch(ctx))
	return next()
}

const createFetch = ctx => async params => {
	if (typeof ctx.fetch !== 'function') {
		throw new Error(`ctx.fetch is not a function`)
	}

	// handle url
	let url = params.url

	if (isPlainObject(url)) {
		url = URL.format(url)
	}

	if (typeof url !== 'string' || !url) {
		throw new Error(`url is not valid: ${url}`)
	}

	// handle headers
	let options = { ...params.options }
	let headers = options.headers = {
		...ctx.headers,
		...fromEntries(options.headers)
	}

	// drop content-length which may not be correct
	// content-length will be generated by fetch later
	if (headers['content-length']) {
		delete headers['content-length']
	} else if (headers['Content-Length']) {
		delete headers['Content-Length']
	}

	// handle body type
	let bodyType = params.bodyType || 'json'

	if (bodyType === 'json') {
		options.body = JSON.stringify(options.body)
	} else if (bodyType === 'text') {
		options.body = options.body + ''
	}

	// handle response type
	let response = await ctx.fetch(url, options)
	let type = params.responseType || 'json'

	if (typeof response[type] !== 'function') {
		throw new Error(`Unsupported responseType: ${type}`)
	}

	// handle result
	let data = await response[type]()
	ctx.result = data
}

atFetch.createFetch = createFetch
module.exports = atFetch
