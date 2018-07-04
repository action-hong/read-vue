const hasConsele = typeof console !== 'undefined'

export function warn (msg, vm) {
  if (hasConsele) {
    console.warn(`[Vue warn]: ${msg}`)
  }
}
