'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import NProgress from 'nprogress'

NProgress.configure({ showSpinner: false, trickleSpeed: 200, minimum: 0.08 })

export function NProgressBar() {
  const pathname  = usePathname()
  const prevRef   = useRef(pathname)
  const startedRef = useRef(false)

  // Complete bar on pathname change
  useEffect(() => {
    if (pathname !== prevRef.current) {
      NProgress.done()
      startedRef.current = false
      prevRef.current    = pathname
    }
  }, [pathname])

  // Intercept anchor clicks to start bar
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link   = target.closest('a')

      if (
        link?.href &&
        !link.target &&
        !link.download &&
        !link.href.startsWith('#') &&
        link.href.startsWith(window.location.origin) &&
        link.href !== window.location.href
      ) {
        NProgress.start()
        startedRef.current = true
      }
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  return null
}
