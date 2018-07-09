// import parse from 'compiler/parser/index'
// import VNode from 'core/vdom/vnode'

export function generate (ast) {
  const code = ast ? genElement(ast) : '_c("div")'
  return {
    render: ('with(this){return ' + code + '}')
  }
}

function genElement (el) {
  if (el.for && !el.forProcessed) {
    // 为了 v-for 和 v-if 的优先级
    // <ul v-for="(item, index) in list" v-if = "index === 0">
    // v-if 的语句能引用 v-for 里面声明的变量
    return genFor(el)
  } else if (el.if && !el.ifProcessed) {
    return genIf(el)
  } else {
    let code
    // 避免传入 underfine 的children
    const children = genChildren(el) || '[]'
    const data = genData(el)
    code = `_c('${el.tag}'${
      `,${data}`
    }${children ? `,${children}` : ''
    })`
    return code
  }
}

function genFor (el) {
  const exp = el.for
  const alias = el.alias
  const iteraotr1 = el.iteraotr1 ? `,${el.iteraotr1}` : ''
  const iteraotr2 = el.iteraotr2 ? `,${el.iteraotr2}` : ''

  el.forProcessed = true
  // <ul v-for="(item, index) in list" />
  // _l((list), function (item, index) {
  //    return _c('ul', {}, ..)  
  // })
  return `_l((${exp}),` +
    `function(${alias}${iteraotr1}${iteraotr2}){` +
      `return ${genElement(el)}` +
    `})`
}

function genIf (el) {
  // 标记已经处理过的当前if, 避免递归死循环
  // 为什么会死循环呀, 不是一直往下递归吗
  // 因为在生成第一个 v-if 的 el时, 会调用两次 genElement, 第一次是用来 genIf, 第二次是用来生成 节点信息的, 注释掉下列代码 运行一下就知道了
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
