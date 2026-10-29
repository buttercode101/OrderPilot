import { useEffect } from 'react'
import { useRouter } from '@tanstack/react-router'

export function useSessionTimeout() {
  const router = useRouter()
  
  useEffect(() => {
    const timeout = setTimeout(() => {
      router.location.replace('/sign-in')
    }, 30 * 60 * 1000) // 30 minutes
    
    return () => clearTimeout(timeout)
  }, [router])
}
