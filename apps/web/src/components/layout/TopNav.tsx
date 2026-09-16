'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { Navbar, ConnectButton, motion } from '@wf-platform/uikit'
import { TransferModal } from '../../views/profile/components/TransferModal'
import { VaultDepositModal } from '../../views/vault/components/deposit/VaultDepositModal'
import { VaultWithdrawModal } from '../../views/vault/components/withdraw/VaultWithdrawModal'
import { useAuthStore } from '@wf-platform/auth'
import { useConfig } from '../../providers/ConfigProvider'
import { Moon, Sun } from 'lucide-react'
import { useEffect, useState, useMemo } from 'react'
import { MAIN_NAV_CONFIG } from '@wf-platform/navigation'

// 可维护的游戏路由列表，后续如 4d、5d 只需在此添加
export const GAME_ROUTES = ['/lotto', '/lottery', '/3d'] as const

/** 判断当前路径是否属于游戏页面 */
export const isGamePage = (path: string | undefined): boolean =>
  !!path && GAME_ROUTES.some((r) => path.includes(r))

import { useZeroDev, usePlatformBalances } from '@wf-platform/web3-core'
import { useLotteryFunding } from '../../../../../modules/lottery/src/hooks/useLotteryFunding'
import { FUNDING_ADDRESSES } from '../../../../../modules/lottery/src/config/addresses'
import { USDC_ADDRESS } from '@wf-platform/chain-config'
import { createPublicClient, http } from 'viem'
import { polygon } from 'viem/chains'

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

  const router = useRouter()
  const [isTransferOpen, setIsTransferOpen] = useState(false)
  const [isDepositOpen, setIsDepositOpen] = useState(false)
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false)

  // 获取 Web3 账户及公共客户端
  const { aaAddress, kernelClient, login, isConnected } = useZeroDev()
  const publicClient = useMemo(
    () =>
      createPublicClient({
        chain: polygon,
        transport: http(),
      }),
    []
  )

  // 获取真实 USDC 余额
  const { realUsdc, mUsdc } = usePlatformBalances(aaAddress ?? null, {
    usdc: USDC_ADDRESS[polygon.id],
    mUsdc: FUNDING_ADDRESSES[polygon.id].mUSDC,
  })

  // 获取彩票金库 WUSD 余额及充提方法
  const {
    wusdBalance: lotteryWusdBalance,
    deposit: handleLotteryDeposit,
    withdraw: handleLotteryWithdraw,
    isDepositing: isLotteryDepositing,
    isWithdrawing: isLotteryWithdrawing,
  } = useLotteryFunding(aaAddress ?? null, kernelClient, publicClient)

  // 根据路由动态切换余额显示，使用外部的 isGamePage 辅助函数
  const activeBalance = isGamePage(pathname) ? lotteryWusdBalance.formatted : realUsdc.formatted // 默认展示主网 USDC

  const formatBalance = (raw: string | undefined) => {
    const n = parseFloat(raw || '0')
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  // 如果未登录且未连接钱包，展示 "--"；连接后展示对应余额
  const displayBalance = isConnected ? formatBalance(activeBalance) : '--'

  const renderRightControls = () => (
    <>
      {/* 1. Connect Wallet & User Status */}
      <div className="mr-2 sm:mr-4">
        <ConnectButton
          zeroDevProjectId={config.ZERODEV_PROJECT_ID}
          balance={displayBalance}
          onNavigate={(path) => router.push(path)}
          onAction={(actionId) => {
            if (!isConnected) {
              login()
              return
            }
            if (actionId === 'deposit') {
              setIsDepositOpen(true)
            } else if (actionId === 'withdraw') {
              setIsWithdrawOpen(true)
            } else if (actionId === 'transfer') {
              setIsTransferOpen(true)
            }
          }}
        />
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
    <>
      <Navbar
        logoUrl="/logo.svg"
        navItems={MAIN_NAV_CONFIG}
        currentPath={pathname}
        isLoggedIn={!!token}
        LinkComponent={Link}
        rightControlsSlot={renderRightControls()}
        onNavItemClick={(item, e) => {
          if (item.path === '/profile' && !isConnected) {
            e.preventDefault()
            window.dispatchEvent(new Event('toploader:cancel'))
            login()
            return false
          }
        }}
      />

      {/* 资金划转弹窗 */}
      <TransferModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        systemMusdcBalance={mUsdc.formatted}
        wfBalance={realUsdc.formatted}
        lotteryBalance={lotteryWusdBalance.formatted}
        onDeposit={handleLotteryDeposit}
        onWithdraw={handleLotteryWithdraw}
        isDepositing={isLotteryDepositing}
        isWithdrawing={isLotteryWithdrawing}
      />

      {/* 跨链/本地 充值弹窗 */}
      <VaultDepositModal
        open={isDepositOpen}
        onOpenChange={setIsDepositOpen}
        onSuccess={() => setIsDepositOpen(false)}
      />

      {/* 提现弹窗 */}
      <VaultWithdrawModal
        open={isWithdrawOpen}
        onOpenChange={setIsWithdrawOpen}
        balance={realUsdc.formatted}
      />
    </>
  )
}
