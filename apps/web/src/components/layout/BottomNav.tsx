'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { BottomNav as UikitBottomNav, BottomNavItem } from '@wf-platform/uikit'
import { BOTTOM_NAV_CONFIG } from '@wf-platform/navigation'
import { usePrivy } from '@privy-io/react-auth'

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { authenticated, ready, login } = usePrivy()
  const [pendingProfileRedirect, setPendingProfileRedirect] = useState(false)

  // 登录成功后，如果用户刚刚点击过个人中心，自动跳转进入个人中心页面
  useEffect(() => {
    if (pendingProfileRedirect && ready && authenticated) {
      setPendingProfileRedirect(false)
      router.push('/profile')
    }
  }, [pendingProfileRedirect, ready, authenticated, router])

  const handleItemClick = (item: BottomNavItem, e: React.MouseEvent) => {
    if (item.path === '/profile' && (!ready || !authenticated)) {
      e.preventDefault()
      window.dispatchEvent(new Event('toploader:cancel'))
      setPendingProfileRedirect(true)
      login()
      return false
    }
  }

  return (
    <UikitBottomNav
      items={BOTTOM_NAV_CONFIG}
      currentPath={pathname}
      LinkComponent={Link}
      onItemClick={handleItemClick}
    />
  )
}
