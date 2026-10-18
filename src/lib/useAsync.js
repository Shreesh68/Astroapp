import { useCallback, useEffect, useState } from 'react'

/** Run `fn` whenever `key` changes; returns { data, error, loading, retry }. */
export function useAsync(fn, key) {
  const [state, setState] = useState({ data: null, error: null, loading: true })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let alive = true
    setState({ data: null, error: null, loading: true })
    Promise.resolve()
      .then(fn)
      .then(data => alive && setState({ data, error: null, loading: false }))
      .catch(error => alive && setState({ data: null, error, loading: false }))
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt])

  const retry = useCallback(() => setAttempt(a => a + 1), [])
  return { ...state, retry }
}
