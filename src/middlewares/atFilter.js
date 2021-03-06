const REMOVE = {}
const shouldRemove = item => item !== REMOVE

module.exports = (ctx, next) => {
  let handleFilter = params => {
    if (typeof ctx.createFunction !== 'function') {
      throw new Error(`ctx.createFunction is not a function in @filter`)
    }

    let result = ctx.result

    if (result == null) return

    // if params.if is boolean, it will work like @include
    if (typeof params.if === 'boolean') {
      if (!params.if) {
        ctx.result = undefined
      }
      return
    }

    if (typeof params.if !== 'string') {
      ctx.error(
        `\`if\` in @filter should be a string of expresstion, instead of ${
          params.if
        }`
      )
      return
    }

    let { if: code, ...rest } = params
    let predicate = ctx.createFunction(code, '$value', '$index')
    let filterItem = (item, index) => {
      if (item == null) return REMOVE
      if (Array.isArray(item)) return item.map(filterItem).filter(shouldRemove)

      let context = {
        ...ctx.rootValue,
        [ctx.fieldName]: item,
        [ctx.info.resultKey]: item,
        ...item,
        ...rest
      }
      return predicate.call(context, item, index) ? item : REMOVE
    }
    let isArray = Array.isArray(result)

    result = isArray ? result : [result]
    result = result.map(filterItem).filter(shouldRemove)
    ctx.result = isArray ? result : result[0]
  }

  ctx.directive('filter', handleFilter)
  return next()
}
