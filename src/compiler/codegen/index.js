// import parse from 'compiler/parser/index'
// import VNode from 'core/vdom/vnode'

export function generate (ast) {
  const code = ast ? genElement(ast) : '_c("div")'
  return {
    render: ('with(this){return ' + code + '}')
  }
}

function genElement (el) {
  let code
  const children = genChildren(el)
  code = `_c('${el.tag}'${children ? `,${children}` : ''})`
  return code
}

function genChildren (el) {
  const children = el.children
  if (children.length) {
    return `[${children.map(genNode).join(',')}]`
  }
}

function genNode (node) {
  if (node.type === 1) {
    return genElement(node)
  } else {
    return getText(node)
  }
}

function getText (text) {
  return `_v(${text.type === 2
    ? text.expression // no need for () because already wrapped in _s()
    : JSON.stringify(text.text)
  })`
}
