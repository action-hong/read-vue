import Dep, { pushTarget, popTarget } from './dep'

import {
  warn,
  remove,
  isObject,
  parsePath,
  _Set as Set
} from '../util/index'

let uid = 0

export default class Watcher {
  constructor (vm, expOrFn, cb, options) {
    this.vm = vm
    vm._watchers.push(this)
    if (options) {
      this.lazy = !!options.lazy
    } else {
      this.lazy = false
    }
    this.cb = cb
    this.id = ++uid
    this.active = true
    this.dirty = this.lazy

    // 收集依赖时, 会使用newDeps来收集
    // 收集结束的会后吧newDeps覆盖到deps里
    // WatcherM.deps = [DepA, DepB]
    this.deps = []
    this.newDeps = []

    // 对应this.dep的所有id set, 避免重复添加同个Dep
    this.depIds = new Set()
    this.newDepIds = new Set()

    if (typeof expOrFn === 'function') {
      this.getter = expOrFn
    } else {
      // vm.$watch("a.b", function(){ blabla; })
      // "a.b" 的上下文是在 vm对象上，所以需要parsePath返回一个getter函数，在调用getter的时候，上下文绑定vm即可： this.gette.call(vm)
      this.getter = parsePath(expOrFn)
      if (!this.getter) {
        this.getter = function () {}
        warn(
          `Failed watching path: "${expOrFn}" ` +
          'Watcher only accepts simple dot-delimited paths. ' +
          'For full control, use a function instead.',
          vm
        )
      }
    }

    this.value = this.lazy
      ? undefined
      : this.get()
  }

  get () {
    // 开始收集依赖
    pushTarget(this)
    let value
    const vm = this.vm
    value = this.getter.call(vm, vm)

    // 结束收集
    popTarget()

    // 收集依赖的时候会使用 newDeps来收集
    // 收集结束的时候会把newDeps覆盖到dep里
    this.clearnupDeps()
    return value
  }

  addDep (dep) {
    const id = dep.id
    if (!this.newDepIds.has(id)) {
      this.newDepIds.add(id)
      this.newDeps.push(dep) // WatcherM.deps.push(DepA) // WatcherM.deps = [DepA, DepB]
      if (!this.depIds.has(id)) {
        dep.addSub(this) // DepA.subs.push(WatcherM) // DepA.subs = [WatcherM, WatcherN, WatcherX]
      }
    }
  }

  clearnupDeps () {
    let i = this.deps.length
    while (i--) {
      const dep = this.deps[i]
      if (!this.newDepIds.has(dep.id)) {
        dep.removeSub(this)
      }
    }

    // 把新依赖 newDeps 更新到 deps
    // newDeps 更新成初始状态，方便下次收集依赖
    let tmp = this.depIds
    this.depIds = this.newDepIds
    this.newDeps = tmp
    this.newDepIds.clear()
    tmp = this.deps
    this.deps = this.newDeps
    this.newDeps = tmp
    this.newDeps.length = 0
  }

  update () {
    if (this.lazy) {
      this.dirty = true
    } else {
      this.run()
    }
  }

  run () {
    if (this.active) {
      const value = this.get()
      if (
        value !== this.value ||
        isObject(value)
      ) {
        // set new value
        const oldValue = this.value
        this.value = value
        this.cb.call(this.vm, value, oldValue)
      }
    }
  }

  evaluate () {
    this.value = this.get()
    this.dirty = false
  }

  depend () {
    let i = this.deps.length
    while (i--) {
      this.dpes[i].depend()
    }
  }

  /**
   * Remove self from all dependencies' subscriber list.
   */
  // 销毁watcher之后，把dep也从目标队列删掉
  teardown () {
    if (this.active) {
      let i = this.deps.length
      while (i--) {
        this.deps[i].removeSub(this)
      }
      this.active = false
    }
  }
}
