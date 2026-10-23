import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

/**
 * A one-time success message passed through navigation state:
 * navigate(path, { state: { flash: 'Saved.' } }).
 * It is removed from history straight away so it doesn't reappear on refresh.
 */
export function useFlash() {
  const location = useLocation()
  const navigate = useNavigate()
  const [flash, setFlash] = useState<string>((location.state as { flash?: string } | null)?.flash ?? '')

  useEffect(() => {
    if ((location.state as { flash?: string } | null)?.flash) {
      navigate(location.pathname + location.search, { replace: true, state: null })
    }
  }, [location, navigate])

  return [flash, setFlash] as const
}
