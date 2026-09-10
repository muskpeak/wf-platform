'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { Navbar, ConnectButton, motion } from '@wf-platform/uikit'
import { useAuthStore } from '@wf-platform/auth'
import { useConfig } from '../../providers/ConfigProvider'
import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { MAIN_NAV_CONFIG } from '@wf-platform/navigation'

export function TopNav() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const config = useConfig()
  const { token } = useAuthStore()

  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark')

  // 模拟从后台或者 Web3 获取余额
  const mockBalance = '99,994.81'

  const renderRightControls = () => (
    <>
      {/* 1. Connect Wallet & User Status */}
      <div className="mr-2 sm:mr-4">
        <ConnectButton zeroDevProjectId={config.ZERODEV_PROJECT_ID} balance={mockBalance} />
      </div>

      {/* 3. Theme Toggle */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        onClick={toggleTheme}
        className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors hidden sm:block"
      >
        {mounted && theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </motion.button>
    </>
  )

  return (
    <Navbar
      logoUrl="/logo.svg"
      navItems={MAIN_NAV_CONFIG}
      currentPath={pathname}
      isLoggedIn={!!token}
      LinkComponent={Link}
      rightControlsSlot={renderRightControls()}
    />
  )
}
