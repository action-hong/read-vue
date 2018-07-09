import { def } from '../util/index'

const arrayProto = Array.prototype
export const arrayMethods = Object.create(arrayProto)

;[
  'push',
  'pop',
  'shift',
  'unshift',
  'sort',
  'reverse'
].forEach(function (method) {
  const original = arrayProto[method]
  def(arrayMethods, method, function mutator () {
    let i = arguments.length
    const args = new Array(i)
    while (i--) {
      args[i] = arguments[i]
    }
    const result = original.apply(this, args) // 调用原方法
    const ob = this.__ob__
    let inserted
    switch (method) {
      case 'push':
        inserted = args
        break
      case 'unshift':
        inserted = args
        break
      case 'splice':
        inserted = args.slice(2)
        break
    }
    if (inserted) ob.observeArray(inserted)
    // notify change
    // set 操作要 notify
    ob.dep.notify()
    return result
  })
})
