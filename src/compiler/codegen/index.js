// import parse from 'compiler/parser/index'
// import VNode from 'core/vdom/vnode'

export function generate (ast) {
  const code = ast ? genElement(ast) : '_c("div")'
  return {
    render: ('with(this){return ' + code + '}')
  }
}

function genElement (el) {
  if (el.if && !el.ifProcessed) {
    return genIf(el)
  } else {
    let code
    const children = genChildren(el)
    const data = genData(el)
    code = `_c('${el.tag}'${
      `,${data}`
    }${children ? `,${children}` : ''
    })`
    return code
  }
}

function genIf (el) {
  // 标记已经处理过的当前if, 避免递归死循环
  el.ifProcessed = true
  return genIfConditions(el.ifConditions.slice())
}

function genIfConditions (conditions) {
  if (!conditions.length) {
    return `_e()`
  }

  const condition = conditions.shift()
  if (condition.exp) {
    return `(${condition.exp})?${genTernaryExp(condition.block)}:${genIfConditions(conditions)}`
  } else {
    // v-else
    return `${genTernaryExp(condition.block)}`
  }

  function genTernaryExp (el) {
    return genElement(el)
  }
}

function genData (el) {
  let data = '{'

  if (el.attrs) {
    data += `attrs: {${genProps(el.attrs)}},`
  }

  // DOM props
  if (el.props) {
    data += `domProps:{${genProps(el.props)}},`
  }

  data = data.replace(/,$/, '') + '}'

  return data
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

function genProps (props) {
  let res = ''
  for (let i = 0; i < props.length; i++) {
    const prop = props[i]
    res += `"${prop.name}":${prop.value},`
  }
  return res.slice(0, -1) // 去掉尾巴的逗号
}
