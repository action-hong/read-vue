import * as nodeOps from './node-ops'
import VNode from './vnode'
import { updateAttrs } from './attrs'
import { updateDOMProps } from './dom-props'

export const emptyNode = new VNode('', {}, [])

function isUndef (s) {
  return s == null
}

function isDef (s) {
  return s != null
}

function sameVnode (v1, v2) {
  return v1.tag === v2.tag
}

function emptyNodeAt (elm) {
  return new VNode(nodeOps.tagName(elm).toLowerCase(), {}, [], undefined, elm)
}

function removeNode (el) {
  const parent = nodeOps.parentNode(el)
  if (parent) {
    nodeOps.removeChild(parent, el)
  }
}

function createElm (vnode, parentElm, refElm) {
  const children = vnode.children
  const tag = vnode.tag
  if (isDef(tag)) {
    // 生成真实dom
    vnode.elm = nodeOps.createElement(tag)

    // 生成该dom的子节点(不断递归)
    createChildren(vnode, children)

    // 属性
    updateAttrs(emptyNode, vnode)
    updateDOMProps(emptyNode, vnode)

    // 将生成的dom插入到页面去
    insert(parentElm, vnode.elm, refElm)
  } else {
    // 文本节点
    vnode.elm = nodeOps.createTextNode(vnode.text)
    insert(parentElm, vnode.elm, refElm)
  }
}

function insert (parent, elm, ref) {
  if (parent) {
    if (ref) {
      nodeOps.insertBefore(parent, elm, ref)
    } else {
      nodeOps.appendChild(parent, elm)
    }
  }
}

function createChildren (vnode, children) {
  if (Array.isArray(children)) {
    for (let i = 0; i < children.length; i++) {
      createElm(children[i], vnode.elm, null)
    }
  }
}

function addVnodes (parentElm, refElm, vnodes, startIdx, endIdx) {
  for (; startIdx <= endIdx; startIdx++) {
    createElm(vnodes[startIdx], parentElm, refElm)
  }
}

function removeVnodes (parentElm, vnodes, startIdx, endIdx) {
  for (; startIdx <= endIdx; startIdx++) {
    const ch = vnodes[startIdx]
    if (isDef(ch)) {
      // TODO: 为何这里还需要判断是否存在呢?
      // 可能startIdx是越界?
      removeNode(ch.elm)
    }
  }
}

// 比较新旧vnode, 更新视图
function updateChildren (parentElm, oldCh, newCh, removeOnly) {
  let oldStartIdx = 0
  let newStartIdx = 0
  let oldEndIdx = oldCh.length - 1
  let newEndIdx = newCh.length - 1
  let oldStartVnode = oldCh[0]
  let newStartVnode = newCh[0]
  let oldEndVnode = oldCh[oldEndIdx]
  let newEndVnode = newCh[newEndIdx]
  let refElm

  const canMove = !removeOnly

  while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
    if (isUndef(oldStartVnode)) {
      // 为什么这些dom可能是undef?
      // 如果oldCh = [], 就是undef
      oldStartVnode = oldCh[++oldStartIdx]
    } else if (isUndef(oldEndVnode)) {
      oldEndVnode = oldCh[--oldEndIdx]
    } else if (sameVnode(oldStartVnode, newStartVnode)) {
      // 首节点没变
      // 递归首节点去比较
      patchVnode(oldStartVnode, newStartVnode)
      oldStartVnode = oldCh[++oldStartIdx]
      newStartVnode = newCh[++newStartIdx]
    } else if (sameVnode(oldEndVnode, newEndVnode)) {
      // 同首节点相同
      patchVnode(oldEndVnode, newEndVnode)
      oldEndVnode = oldCh[--oldEndIdx]
      newEndVnode = newCh[--newEndIdx]
    } else if (sameVnode(oldStartVnode, newEndVnode)) {
      patchVnode(oldStartVnode, newEndVnode)
      // 原本在头的节点现在在尾部了, 插到尾部
      canMove && nodeOps.insertBefore(parentElm, oldStartVnode.elm, nodeOps.nextSibling(oldEndVnode.elm))
      oldStartVnode = oldCh[++oldStartIdx]
      newEndVnode = newCh[--newEndIdx]
    } else if (sameVnode(oldEndVnode, newStartVnode)) {
      patchVnode(oldEndVnode, newStartVnode)
      // 原来在尾部的节点, 现在在前面了
      canMove && nodeOps.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm)
      oldEndVnode = oldCh[--oldEndIdx]
      newStartVnode = newCh[++newStartIdx]
    } else {
      // 新增的节点, 创建就完事了
      createElm(newStartVnode, parentElm, oldStartVnode.elm)
      newStartVnode = newCh[++newStartIdx]
    }
  }

  // 旧节点已经对完了, 还有一些新节点直接加入
  if (oldStartIdx > oldEndIdx) {
    // TODO: 为何是在 newEndIdx + 1 的这个节点前?
    // 很简单哈, 因为可能 newEndIdx + 1的这个节点已经处理过了, 哈哈
    // 也有可能没处理过, 就是null
    // 在这个节点前把所有为处理的节点都加进来
    refElm = isUndef(newCh[newEndIdx + 1]) ? null : newCh[newEndIdx + 1].elm
    addVnodes(parentElm, refElm, newCh, newStartIdx, newEndIdx)
  } else if (newStartIdx > newEndIdx) {
    // 新的处理完了, 旧的仍没有处理完, 为处理完的说明是需要删除的
    removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx)
  }
}

function patchVnode (oldVnode, vnode, removeOnly) {
  if (oldVnode === vnode) {
    return
  }

  const data = vnode.data
  const hasData = isDef(data)
  const elm = vnode.elm = oldVnode.elm
  const oldCh = oldVnode.children
  const ch = vnode.children

  // 更新属性
  if (hasData) {
    updateAttrs(oldVnode, vnode)
    updateDOMProps(oldVnode, vnode)
  }

  if (isUndef(vnode.text)) {
    // 不是文字节点
    if (isDef(oldCh) && isDef(ch)) {
      if (oldCh !== ch) updateChildren(elm, oldCh, ch, removeOnly)
    } else if (isDef(ch)) {
      // 旧的节点的子节点为null
      // 旧节点是文本节点, 则将其内容置为''
      if (isDef(oldVnode.TEXT)) nodeOps.setTextContent(elm, '')
      // 将新节点的子节点加入
      addVnodes(elm, null, ch, 0, ch.length - 1)
    } else if (isDef(oldCh)) {
      // 新节点没有子节点了
      removeVnodes(elm, oldCh, 0, oldCh.length - 1)
      // 需要考虑新节点的文本节点吗? 不需要, 因为在该分支就是不是文本节点
    } else if (isDef(oldVnode.text)) {
      // TODO: 文本的逻辑貌似有问题了
      nodeOps.setTextContent(elm, '')
    }
  } else if (oldVnode.text !== vnode.text) {
    // 考虑新节点的文本节点变化
    nodeOps.setTextContent(elm, vnode.text)
  }
}

export default function patch (oldVnode, vnode) {
  // let isInitialPatch = false
  // 是真实的dom, 不是vnode
  const isRealElement = isDef(oldVnode.nodeType)
  if (!isRealElement && sameVnode(oldVnode, vnode)) {
    patchVnode(oldVnode, vnode)
  } else {
    if (isRealElement) {
      oldVnode = emptyNodeAt(oldVnode)
    }
    // 说明新旧两个节点的dom的根节点不一样
    // 那直接将新的dom替换旧的dom就行了
    const oldElm = oldVnode.elm
    const parentElm = nodeOps.parentNode(oldElm)
    // 创建新节点, 插入在旧节点后面
    createElm(
      vnode,
      parentElm,
      nodeOps.nextSibling(oldElm)
    )

    if (parentElm !== null) {
      // 删除旧节点
      removeVnodes(parentElm, [oldVnode], 0, 0)
    }
  }

  return vnode.elm
}
