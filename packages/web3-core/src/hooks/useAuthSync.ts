"use client";

import { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useAccount, useDisconnect } from 'wagmi';
// import { usePrivy } from '@privy-io/react-auth'; // 按需开启

/**
 * 核心鉴权同步引擎 (双轨分流护城河)
 * 
 * 作用：
 * 1. 监听全局的 `api:auth_expired` (401过期) 事件，强行踢出所有登录态。
 * 2. 监听 Wagmi (原生钱包) 的断开事件，同步销毁 Web2 Token。
 * 3. 监听 Privy 的断开事件，同步销毁 Web2 Token。
 * 
 * 使用方法：在根组件 (如 App.tsx 或 RootLayout.tsx) 挂载此 Hook 一次即可。
 */
export function useAuthSync() {
  const { logout, token } = useAuthStore();
  
  // 引擎 B 状态 (Wagmi)
  const { isConnected: isWagmiConnected } = useAccount();
  const { disconnect: wagmiDisconnect } = useDisconnect();

  // 引擎 A 状态 (Privy) - 注释掉防止未安装依赖报错，实际项目按需开启
  // const { authenticated: isPrivyAuthenticated, logout: privyLogout } = usePrivy();

  // ----------------------------------------------------------------------
  // 1. 熔断机制：监听 401 过期事件
  // ----------------------------------------------------------------------
  useEffect(() => {
    const handleAuthExpired = () => {
      console.warn('⚠️ 后端 Token 401 过期，触发双轨熔断登出！');
      
      // 1. 销毁 Web2 状态 (Local Storage 里的 dat_token)
      logout();

      // 2. 销毁 Web3 状态 (逼迫重新走连接流程)
      wagmiDisconnect();
      // privyLogout?.(); 
    };

    window.addEventListener('api:auth_expired', handleAuthExpired);
    return () => window.removeEventListener('api:auth_expired', handleAuthExpired);
  }, [logout, wagmiDisconnect]); // , privyLogout

  // ----------------------------------------------------------------------
  // 2. 断开同步：监听钱包/Privy 的主动断开
  // ----------------------------------------------------------------------
  useEffect(() => {
    // 假设当前存在 Token（也就是 Web2 是已登录状态）
    if (token) {
      // 如果 Wagmi 没连，且 Privy 也没连 (双轨全挂了) -> 判定为用户主动断开钱包或退出了应用
      // 注意：由于未引入 privy，这里暂用 !isWagmiConnected 代替，实际应为: (!isWagmiConnected && !isPrivyAuthenticated)
      if (!isWagmiConnected) { 
        console.warn('⚠️ 检测到 Web3 钱包已断开，同步销毁 Web2 Token！');
        logout();
      }
    }
  }, [isWagmiConnected, token, logout]); // , isPrivyAuthenticated

}
