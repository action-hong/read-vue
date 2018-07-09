import patch from 'core/vdom/patch'
import compile from 'compiler/index'
// import generate from 'compiler/codegen/index'

import { createTextVNode, createElementVNode, createEmptyVNode, renderList } from '../vdom/vnode'
import { observe } from '../observer/index'

import {
  _toString,
  warn,
  isReserved,
  isPlainObject,
  noop
} from '../util/index'

export default function Vue (options) {
  if (!(this instanceof Vue)) {
    warn('Vue is a constructor and should be called with the "warn keyword')
  }
  this.$options = options
  this._init(options)
}

Vue.prototype._c = createElementVNode
Vue.prototype._v = createTextVNode
Vue.prototype._s = _toString
Vue.prototype._e = createEmptyVNode
Vue.prototype._l = renderList

Vue.prototype._init = function (options) {
  const vm = this
  const template = options.template

  if (options.data) {
    this._initData()
  } else {
    observe(vm._data = {}, vm)
  }

  if (options.computed) initComputed(vm, options.computed)
  const compiled = compile(template)

  // 生成Vnode
  vm._render = () => {
    // compiled.render 是一个函数
    // 调用他, 上下文为 这个vm
    return compiled.render.call(vm)
  }
}

Vue.prototype._initData = function () {
  const vm = this
  let data = vm.$options.data
  data = vm._data = data || {} // 把 data 所有属性代理到 vm._data 上
  if (!isPlainObject(data)) {
    data = {}
  }

  const keys = Object.keys(data)
  let i = keys.length
  while (i--) {
    // vm._xx vm.$xxx 都是vm的内部/外部方法，所以不能代理到data上
    if (!isReserved(keys[i])) {
      // 把vm.abc 代理到 vm._data.abc
      proxy(vm, '_data', keys[i])
    }
    observe(data, this)
  }
}

Vue.prototype._update = function () {
  const vm = this
  const vnode = vm._render()
  const prevVnode = vm._vnode

  vm._vnode = vnode
  patch(prevVnode, vnode)
}

Vue.prototype.setData = function (data) {
  this._initData(data)
  this._update()
}

Vue.prototype.$mount = function (el) {
  const vm = this
  vm._vnode = document.getElementById(el)
  this._update()
}

const sharedPropertyDefinition = {
  enumerable: true,
  configurable: true,
  get: noop,
  set: noop
}

function proxy (target, sourceKey, key) {
  sharedPropertyDefinition.get = function proxyGetter () {
    return this[sourceKey][key]
  }
  sharedPropertyDefinition.set = function proxySetter (val) {
    this[sourceKey][key] = val
  }
  Object.defineProperty(target, key, sharedPropertyDefinition)
}

function initComputed (vm, computed) {
  for (const key in computed) {
    const userDef = computed[key]
    // const getter = typeof userDef === 'function' ? userDef : userDef.get

    if (!(key in vm)) {
      defineComputed(vm, key, userDef)
    }
  }
}

function defineComputed (target, key, userDef) {
  if (typeof userDef === 'function') {
    // computed 传入function, 可不写
    sharedPropertyDefinition.get = function () {
      return userDef.call(target)
    }
    sharedPropertyDefinition.set = noop
  } else {
    sharedPropertyDefinition.get = userDef.get ? userDef.get : noop
    sharedPropertyDefinition.set = userDef.set ? userDef.set : noop
  }
  Object.defineProperty(target, key, sharedPropertyDefinition)
}
