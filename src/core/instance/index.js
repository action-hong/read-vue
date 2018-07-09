import patch from 'core/vdom/patch'
import compile from 'compiler/index'
// import generate from 'compiler/codegen/index'

import { createTextVNode, createElementVNode, createEmptyVNode, renderList } from '../vdom/vnode'

import {
  _toString,
  warn,
  hasOwn,
  isPlainObject
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

  this._initData(options.data)
  const compiled = compile(template)

  // 生成Vnode
  vm._render = () => {
    // compiled.render 是一个函数
    // 调用他, 上下文为 这个vm
    return compiled.render.call(vm)
  }
}

Vue.prototype._initData = function (data) {
  const vm = this
  if (!isPlainObject(data)) {
    data = {}
  }

  for (const key in data) {
    if (hasOwn(data, key)) {
      vm[key] = data[key]
    }
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
