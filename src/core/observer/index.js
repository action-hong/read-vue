import { isObject } from '../util/index'

export function observe (obj, vm) {
  if (!isObject(obj)) {
    return
  }
  const keys = Object.keys(obj)
  for (let i = 0; i < keys.length; i++) {
    defineReactive(obj, keys[i], obj[keys[i]], vm)
  }
}

export function defineReactive (obj, key, val, vm) {
  // 递归观察
  observe(val)
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter () {
      return val
    },
    set: function reactiveSetter (newVal) {
      const value = val

      if (newVal === value) {
        return
      }

      val = newVal
      // 重新观察该值
      observe(newVal)
      // update, 有变动, 即让vm重新更新
      vm && vm._update()
    }
  })
}
