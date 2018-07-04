import { parse } from './parser/index'
import { noop } from 'shared/util'
import { generate } from './codegen/index'

function makeFunction (code, errors) {
  try {
    // eslint-disable-next-line
    return new Function(code)
  } catch (err) {
    errors.push({ err, code })
    return noop
  }
}

export default function compile (template) {
  const ast = parse(template.trim())
  const code = generate(ast)
  return {
    ast,
    render: makeFunction(code.render)
  }
}
