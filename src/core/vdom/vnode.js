import { isObject } from 'core/util/index'

export default class VNode {
  constructor (
    tag, // 标签名
    data, // data = { attrs: 属性key-val }
    children, // 子节点 [VNode, VNode, ...]
    text, // 文本节点
    elm // 对应的真实dom对象
  ) {
    this.tag = tag
    this.data = data
    this.children = children
    this.text = text
    this.elm = elm
  }
}

export function createElementVNode (tag, data, children) {
  if (!tag) {
    return createEmptyVNode()
  }

  let vnode = new VNode(tag, data, simpleNormalizeChildren(children), undefined, undefined)
  return vnode
}

export const createEmptyVNode = () => {
  const node = new VNode()
  node.text = ''
  return node
}

export function createTextVNode (val) {
  return new VNode(undefined, undefined, undefined, String(val))
}

// v-for="(item, index) in list"
// alias = item, iterator1 = index

// v-for="(value, key, index) in object"
// alias = value, iterator1 = key, iterator2 = index

// val = list
// render = function (alias, iterator1, iterator2) { return VNode }
export function renderList (val, render) {
  let ret, i, l, keys, key
  if (Array.isArray(val) || typeof val === 'string') {
    ret = new Array(val.length)
    for (i = 0, l = val.length; i < l; i++) {
      ret[i] = render(val[i], i)
    }
  } else if (typeof val === 'number') {
    // 支持 v-for = "n in 10"
    ret = new Array(val)
    for (i = 0; i < val; i++) {
      ret[i] = render(val[i], i)
    }
  } else if (isObject(val)) {
    keys = Object.keys(val)
    ret = new Array(keys.length)
    for (i = 0, l = keys.length; i < l; i++) {
      key = keys[i]
      ret[i] = render(val[key], key, i)
    }
  }
  return ret
}

// 将children 里边的嵌套数组展开
// 对v-for的复杂的情况做处理 _c('ul', undefined, [_c('div'), _l(xxx), _c('div')])
// _l(xxx) 返回是一个 [VNode, VNode] 数组
function simpleNormalizeChildren (children) {
  for (let i = 0; i < children.length; i++) {
    const element = children[i]
    if (Array.isArray(element)) {
      // 为毛这样就可以展开?
      return Array.prototype.concat.apply([], children)
    }
  }
  return children
}

// 复杂情况: 
// <ul>
// <li>first li</li>
// <li v-for="(item, index) in items">{{ item }}</li>
// <li>last li</li>
// </ul> 
// 会生成如下 _c('ul', {}, [ _c('li'), _l(xxx), _c('li')])
// 其中_l()会返回一个 VNode列表, 则这里 _c(tag, data, children)中的children为一个嵌套VNode数组的VNode 数组, 故需要做一些处理把嵌套数组展开
