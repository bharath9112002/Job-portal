import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

/**
 * List filters kept in the URL (?q=…&page=…&anything=…) so they survive reloads and the back button.
 * The search box has its own state so fast typing isn't lost; the URL follows after a short pause.
 */
export function useListParams() {
  const [params, setParams] = useSearchParams()
  const get = (key: string) => params.get(key) ?? ''

  const setParam = (key: string, value: string) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value) next.set(key, value)
        else next.delete(key)
        if (key !== 'page') next.delete('page')
        return next
      },
      { replace: key !== 'page' },
    )
  }

  const query = get('q')
  const [search, setSearch] = useState(query)
  useEffect(() => {
    if (search === query) return
    const t = setTimeout(() => setParam('q', search), 250)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])
  // Follow the URL when it changes from outside (back/forward, "Clear filters").
  useEffect(() => setSearch(query), [query])

  const requestedPage = Math.max(1, Number(params.get('page')) || 1)
  const changePage = (p: number) => {
    setParam('page', p === 1 ? '' : String(p))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return {
    get,
    setParam,
    query,
    search,
    setSearch,
    requestedPage,
    changePage,
    clearAll: () => setParams({}),
  }
}
