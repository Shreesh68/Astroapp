// The app reads and writes the phone's storage; give the tests an in-memory one.
const store = new Map()
globalThis.localStorage = {
  getItem: k => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: k => store.delete(k),
  clear: () => store.clear(),
}
const events = new EventTarget()
globalThis.window = {
  dispatchEvent: e => events.dispatchEvent(e),
  addEventListener: (...a) => events.addEventListener(...a),
  removeEventListener: (...a) => events.removeEventListener(...a),
}
