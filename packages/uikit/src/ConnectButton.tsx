'use client'

import React from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useAuthStore } from '@wf-platform/auth'
// @ts-ignore
import { useZeroDev } from '@wf-platform/web3-core'
import { Loader2 } from 'lucide-react'
import { useAccount, useDisconnect } from 'wagmi'
import { UserMenuContent, UserMenuModal } from './components/Modal'

export interface ConnectButtonProps {
  zeroDevProjectId: string
  balance?: string | number
  onNavigate?: (path: string) => void
  onAction?: (actionId: string) => void
}

export function ConnectButton({ zeroDevProjectId, balance = 0, onNavigate, onAction }: ConnectButtonProps) {
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [isClient, setIsClient] = React.useState(false)

  // Track previous external address to detect active disconnects / account switches
  const prevAddressRef = React.useRef<string | undefined>(undefined)

  // 等待客户端挂载
  React.useEffect(() => {
    setIsClient(true)
  }, [])

  const {
    ready,
    authenticated,
    user,
    login: privyLogin,
    logout: privyLogout,
    getAccessToken,
  } = usePrivy()
  const { wallets } = useWallets()
  const { isConnected, address: wagmiAddress } = useAccount()
  const { token, profile, logout: globalLogout, login: globalLogin } = useAuthStore()
  const { disconnect } = useDisconnect()

  // Hook into ZeroDev for smart account AA address derivation
  const { aaAddress, isInitializing: isZeroDevInitializing } = useZeroDev(zeroDevProjectId)

  // Real Logout Handler
  const handleLogout = React.useCallback(async () => {
    prevAddressRef.current = undefined
    setMenuOpen(false)

    // 1. 尝试调用 Privy 登出（若 session 已在服务端失效，捕获 400 异常不阻断登出）
    try {
      if (authenticated) {
        await privyLogout()
      }
    } catch (e) {
      console.warn('[ConnectButton] Privy session logout caught:', e)
    }

    // 2. 断开 Wagmi 外部连接
    try {
      disconnect()
    } catch (e) {
      console.warn('[ConnectButton] Wagmi disconnect error:', e)
    }

    // 3. 断开所有已连接的外部钱包
    try {
      for (const w of wallets) {
        if (typeof w.disconnect === 'function') {
          try {
            await (w.disconnect() as unknown as Promise<unknown>)
          } catch {
            // ignore
          }
        }
      }
    } catch (e) {
      console.warn('[ConnectButton] Wallets disconnect error:', e)
    }

    // 4. 清空全局 Web2 鉴权 Store
    globalLogout()

    // 5. 强制清除所有本地缓存（解决 Privy 400 导致失效 session 残留在 Storage 的死锁）
    if (typeof window !== 'undefined') {
      try {
        Object.keys(localStorage).forEach((key) => {
          if (
            key.startsWith('privy:') ||
            key.startsWith('privy_') ||
            key.toLowerCase().includes('privy')
          ) {
            localStorage.removeItem(key)
          }
        })
        Object.keys(sessionStorage).forEach((key) => {
          if (
            key.startsWith('privy:') ||
            key.startsWith('privy_') ||
            key.toLowerCase().includes('privy')
          ) {
            sessionStorage.removeItem(key)
          }
        })

        localStorage.removeItem('wf-auth-storage')
        localStorage.removeItem('wagmi.store')
        localStorage.removeItem('wagmi.wallet')
        localStorage.removeItem('wagmi.connected')
        localStorage.removeItem('wagmi.recentConnectorId')

        document.cookie.split(';').forEach((c) => {
          const name = c.split('=')[0].trim()
          if (name.toLowerCase().includes('privy')) {
            document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`
          }
        })
      } catch (e) {
        console.warn('[ConnectButton] Clear storage error:', e)
      }

      // 6. 刷新页面彻底重置所有 React Context 与状态缓存
      window.location.reload()
    }
  }, [authenticated, disconnect, wallets, privyLogout, globalLogout])

  // 1. Active Wallet Disconnect Listener
  React.useEffect(() => {
    if (!ready || !isClient) return

    const currentExternalWallet = wallets.find((w) => w.walletClientType !== 'privy')
    const currentAddress = currentExternalWallet?.address || wagmiAddress

    if (prevAddressRef.current && !currentAddress && !isConnected) {
      handleLogout()
    }

    if (authenticated && token && profile?.source === 'privy_zerodev') {
      const isEmbeddedOnly =
        wallets.length > 0 && wallets.every((w) => w.walletClientType === 'privy')
      if (!isEmbeddedOnly && wallets.length === 0 && !isConnected) {
        handleLogout()
      }
    }

    prevAddressRef.current = currentAddress
  }, [
    ready,
    isClient,
    authenticated,
    token,
    profile,
    wallets,
    isConnected,
    wagmiAddress,
    handleLogout,
  ])

  // 2. Watch for Privy auth & ZeroDev AA address to log into global AuthStore
  React.useEffect(() => {
    if (!isClient) return

    const handleAuthExchange = async () => {
      if (authenticated && aaAddress) {
        try {
          const privyToken = await getAccessToken()
          globalLogin(privyToken || `dat_token_${Date.now()}`, {
            address: aaAddress,
            email: user?.email?.address || user?.id,
            source: 'privy_zerodev',
          })
        } catch (error) {
          console.warn('Failed to complete auth exchange:', error)
        }
      }
    }
    handleAuthExchange()
  }, [isClient, authenticated, aaAddress, user, getAccessToken, globalLogin])

  // 客户端未挂载时显示加载
  // 必须等待 Privy ready，以防止“已登录用户”在页面刚刷新时看到闪烁的登录按钮
  if (!isClient || !ready || (wallets.length > 0 && !aaAddress && isZeroDevInitializing)) {
    return (
      <button
        disabled
        className="h-9 px-6 bg-gray-200 dark:bg-gray-800 text-gray-500 rounded-full flex items-center justify-center text-sm font-bold shadow-sm cursor-not-allowed"
      >
        <Loader2 size={16} className="animate-spin" />
      </button>
    )
  }

  // 必须是已认证且具备 AA 地址（或全局存在 token 且有 AA 地址）才视为登录成功
  const isLoggedIn = Boolean(aaAddress && (authenticated || token))

  if (isLoggedIn) {
    const displayAddress = (profile?.address || aaAddress) ?? undefined

    return (
      <>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-[#EEF2F6] dark:bg-gray-800 rounded-full h-9">
            <span className="text-[12px] text-[#475767] font-medium leading-[14px]">余额</span>
            <span className="text-[14px] font-bold text-gray-900 dark:text-white">${balance}</span>
          </div>

          <div className="relative group">
            <button
              onClick={() => setMenuOpen(true)}
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 overflow-hidden transition-transform active:scale-95 hover:opacity-90 shadow-sm"
              title="个人中心"
            >
              <img src="/avatar.svg" alt="User Avatar" className="w-full h-full object-cover" />
            </button>

            <div className="hidden lg:block absolute right-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 origin-top-right">
              <div className="w-[230px] bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[16px] p-4 shadow-xl">
                <UserMenuContent
                  address={displayAddress}
                  onLogout={handleLogout}
                  onClose={() => setMenuOpen(false)}
                  onNavigate={onNavigate}
                  onAction={onAction}
                />
              </div>
            </div>
          </div>
        </div>

        <UserMenuModal
          open={menuOpen}
          onOpenChange={setMenuOpen}
          address={displayAddress}
          onLogout={handleLogout}
          onNavigate={onNavigate}
          onAction={onAction}
        />
      </>
    )
  }

  // 正在初始化智能账户 (Privy 已认证但 ZeroDev 还在计算 AA 地址)
  if (authenticated && (isZeroDevInitializing || (!aaAddress && wallets.length > 0))) {
    return (
      <button
        disabled
        className="h-9 px-4 bg-blue-500/10 text-blue-600 rounded-full flex items-center justify-center gap-2 text-xs font-bold shadow-sm"
      >
        <Loader2 size={14} className="animate-spin" />
        <span>登录中...</span>
      </button>
    )
  }

  // 未认证 - 显示登录按钮
  return (
    <button
      onClick={privyLogin}
      className="h-9 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-sm transition-all active:scale-95"
    >
      <span>登录</span>
    </button>
  )
}
