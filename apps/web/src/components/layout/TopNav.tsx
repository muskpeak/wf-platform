'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { Navbar, ConnectButton, motion } from '@wf-platform/uikit'
import { TransferModal } from '../../views/profile/components/TransferModal'
import { useAuthStore } from '@wf-platform/auth'
import { useConfig } from '../../providers/ConfigProvider'
import { Moon, Sun } from 'lucide-react'
import { useEffect, useState, useMemo } from 'react'
import { MAIN_NAV_CONFIG } from '@wf-platform/navigation'

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

  // 获取 Web3 账户及公共客户端
  const { aaAddress, kernelClient } = useZeroDev();
  const publicClient = useMemo(
    () =>
      createPublicClient({
        chain: polygon,
        transport: http(),
      }),
    []
  );

  // 获取真实 USDC 余额
  const { realUsdc, mUsdc } = usePlatformBalances(aaAddress ?? null, {
    usdc: USDC_ADDRESS[polygon.id],
    mUsdc: FUNDING_ADDRESSES[polygon.id].mUSDC,
  });

  // 获取彩票金库 WUSD 余额及充提方法
  const { 
    wusdBalance: lotteryWusdBalance,
    deposit: handleLotteryDeposit,
    withdraw: handleLotteryWithdraw,
    isDepositing: isLotteryDepositing,
    isWithdrawing: isLotteryWithdrawing
  } = useLotteryFunding(aaAddress ?? null, kernelClient, publicClient);

  // 计算总资产
  const realUsdcAmount = parseFloat(realUsdc.formatted || "0");
  const lottoAmount = parseFloat(lotteryWusdBalance.formatted || "0");
  const totalAmount = realUsdcAmount + lottoAmount;
  
  // 如果未登录且未连接钱包，展示 "--"；连接后展示真实余额
  const isConnected = !!aaAddress;
  const displayBalance = isConnected 
    ? totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "--";

  const renderRightControls = () => (
    <>
      {/* 1. Connect Wallet & User Status */}
      <div className="mr-2 sm:mr-4">
        <ConnectButton 
          zeroDevProjectId={config.ZERODEV_PROJECT_ID} 
          balance={displayBalance} 
          onNavigate={(path) => router.push(path)}
          onAction={(actionId) => {
            if (actionId === 'deposit' || actionId === 'withdraw') {
              setIsTransferOpen(true);
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
    </>
  )
}
