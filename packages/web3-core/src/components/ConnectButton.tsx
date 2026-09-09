"use client";

import React from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useAuthStore } from "../store/useAuthStore";
import { LogIn, LogOut, Wallet, Loader2, AlertCircle } from "lucide-react";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useAccount, useSignMessage, useDisconnect } from "wagmi";

export interface ConnectButtonProps {
  zeroDevProjectId: string;
}

export function ConnectButton({ zeroDevProjectId }: ConnectButtonProps) {
  const { ready, authenticated, login: privyLogin, logout: privyLogout, getAccessToken } = usePrivy();
  const { token, profile, logout: globalLogout, login: globalLogin } = useAuthStore();
  
  const { openConnectModal } = useConnectModal();
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();
  
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoggingInPrivy, setIsLoggingInPrivy] = React.useState(false);
  const [isSigningWallet, setIsSigningWallet] = React.useState(false);
  const [authError, setAuthError] = React.useState<string | null>(null);

  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const prevConnectedRef = React.useRef(isConnected);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // -- 1. Privy (Web2) 登录逻辑 --
  const handlePrivyLogin = async () => {
    try {
      setIsOpen(false);
      setAuthError(null);
      setIsLoggingInPrivy(true);
      privyLogin(); 
    } catch (error: any) {
      console.error("Privy login error:", error);
      setIsLoggingInPrivy(false);
      setAuthError("Privy 登录失败");
    }
  };

  // 监听 Privy 认证状态
  React.useEffect(() => {
    const fetchPrivyToken = async () => {
      if (authenticated && !token && isLoggingInPrivy) {
        try {
          const privyToken = await getAccessToken();
          // REAL API CALL PLACEHOLDER:
          // const res = await apiClient.post('/api/auth/privy', { token: privyToken });
          // globalLogin(res.data.dat_token, res.data.profile);

          // Dev fallback
          globalLogin(`fake_dat_token_privy_${Date.now()}`, { 
            address: "0xPrivy...123", 
            email: "user@privy.com", 
            source: "privy" 
          });
        } catch (error: any) {
          console.warn("Privy token exchange failed:", error);
          setAuthError("无法获取平台 Token");
        } finally {
          setIsLoggingInPrivy(false);
        }
      }
    };
    fetchPrivyToken();
  }, [authenticated, token, isLoggingInPrivy, getAccessToken, globalLogin]);

  // -- 2. Web3 Wallet 登录与签名逻辑 --
  const executeWalletSignature = React.useCallback(async (userAddress: string) => {
    try {
      setIsSigningWallet(true);
      setAuthError(null);

      // 步骤 1: 构造签名 Challenge 消息 (实际生产环境从后端 API /api/auth/challenge 获取 nonce)
      const timestamp = new Date().toLocaleString();
      const messageToSign = `Welcome to DAT Platform!\n\nPlease sign this message to verify wallet ownership.\n\nAddress: ${userAddress}\nTime: ${timestamp}`;

      // 步骤 2: 唤起钱包签名 (必须用户手动在钱包中确认)
      const signature = await signMessageAsync({ message: messageToSign });

      if (!signature) {
        throw new Error("Signature was not produced");
      }

      // 步骤 3: 签名成功后，向后端换取 DAT Token (实际生产环境 API /api/auth/wallet)
      // REAL API CALL PLACEHOLDER:
      // const res = await apiClient.post('/api/auth/wallet', { address: userAddress, signature, message: messageToSign });
      // globalLogin(res.data.dat_token, res.data.profile);

      // Dev fallback: 签名验证通过，颁发 DAT Token 登入平台
      const fakeDatToken = `fake_dat_token_wallet_${userAddress.slice(0, 6)}_${Date.now()}`;
      globalLogin(fakeDatToken, { 
        address: userAddress, 
        source: "wallet" 
      });

    } catch (error: any) {
      console.warn("Wallet signing rejected or failed:", error);
      const isRejected = error?.message?.includes("rejected") || error?.cause?.message?.includes("rejected");
      setAuthError(isRejected ? "签名已被取消" : "钱包签名失败，请重试");
      
      // 关键：若取消签名或签名失败，立刻断开 Web3 链接，绝不允许算作登录成功！
      disconnect();
    } finally {
      setIsSigningWallet(false);
    }
  }, [signMessageAsync, globalLogin, disconnect]);

  // 点击 Web3 Wallet 按钮
  const handleWalletLogin = async () => {
    setIsOpen(false);
    setAuthError(null);

    if (isConnected && address) {
      // 如果钱包本身已经链接（但平台尚未签名登录），直接发起签名流程
      await executeWalletSignature(address);
    } else if (openConnectModal) {
      // 否则唤起 RainbowKit 链接弹窗
      openConnectModal();
    } else {
      console.error("RainbowKit connect modal is not available");
    }
  };

  // 监听 RainbowKit 钱包链接动作：当完成链接 (isConnected 变为 true) 且尚未登录时，自动触发签名
  React.useEffect(() => {
    const justConnected = !prevConnectedRef.current && isConnected;
    prevConnectedRef.current = isConnected;

    if (justConnected && address && !token && !isSigningWallet) {
      executeWalletSignature(address);
    }
  }, [isConnected, address, token, isSigningWallet, executeWalletSignature]);

  // -- 3. Logout 逻辑 (严格区分 Web2 与 Web3) --
  const handleLogout = () => {
    setAuthError(null);
    if (profile?.source === 'wallet') {
      // Web3 登出：只断开 Wagmi 钱包链接，绝对不调用 Privy 接口
      disconnect();
    } else if (profile?.source === 'privy') {
      // Web2 登出：调用 Privy 登出接口
      privyLogout();
    } else {
      // 兜底
      if (isConnected) disconnect();
      if (authenticated) privyLogout();
    }

    // 清理全局 DAT Token 和 Store 状态
    globalLogout();
  };

  // 加载中/初始化状态
  if (!ready) {
    return (
      <button disabled className="px-5 py-2 bg-gray-200 dark:bg-gray-800 text-gray-500 rounded-xl flex items-center gap-2 cursor-not-allowed font-medium shadow-sm">
        <Loader2 size={16} className="animate-spin" />
        Loading Auth...
      </button>
    );
  }

  // 签名等待中 UI
  if (isSigningWallet) {
    return (
      <button disabled className="px-5 py-2 bg-amber-500 text-white rounded-xl flex items-center gap-2 font-medium shadow-md animate-pulse">
        <Loader2 size={16} className="animate-spin" />
        请在钱包中确认签名...
      </button>
    );
  }

  // Privy 登录中 UI
  if (isLoggingInPrivy) {
    return (
      <button disabled className="px-5 py-2 bg-blue-500 text-white rounded-xl flex items-center gap-2 font-medium shadow-md">
        <Loader2 size={16} className="animate-spin" />
        Social Login...
      </button>
    );
  }

  // -- 登录成功状态 (拥有平台 DAT Token) --
  if (token) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-xl shadow-sm border border-emerald-200 dark:border-emerald-800">
          <Wallet size={16} className="text-emerald-500" />
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              {profile?.source === 'wallet' ? 'Web3 钱包已登录' : 'Social 已登录'}
            </span>
            <span className="text-xs font-mono font-medium">
              {profile?.address ? `${profile.address.slice(0, 6)}...${profile.address.slice(-4)}` : profile?.email}
            </span>
          </div>
          <button 
            onClick={handleLogout}
            className="ml-2 p-1.5 hover:bg-emerald-200 dark:hover:bg-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-lg transition-colors"
            title="退出登录"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    );
  }

  // -- 未登录状态：展示链接/签名入口 --
  return (
    <div className="relative flex flex-col items-end" ref={dropdownRef}>
      {authError && (
        <div className="mb-1 text-xs text-red-500 flex items-center gap-1 bg-red-50 dark:bg-red-950/30 px-2.5 py-1 rounded-lg border border-red-200 dark:border-red-800">
          <AlertCircle size={12} />
          {authError}
        </div>
      )}

      {/* 如果钱包已经连接，但尚未签名登录 */}
      {isConnected && address ? (
        <button 
          onClick={() => executeWalletSignature(address)}
          className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl flex items-center gap-2 font-medium shadow-md shadow-emerald-500/20 transition-all active:scale-95 animate-pulse"
        >
          <Wallet size={16} />
          签名以完成登录
        </button>
      ) : (
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl flex items-center gap-2 font-medium shadow-md shadow-blue-500/20 transition-all active:scale-95"
        >
          <Wallet size={16} />
          Connect Wallet
        </button>
      )}

      {isOpen && (
        <div className="absolute right-0 mt-12 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700/50 py-2 z-50 overflow-hidden transform origin-top-right transition-all">
          <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Select Login Method
          </div>
          
          <button 
            onClick={handlePrivyLogin}
            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
              <LogIn size={16} />
            </div>
            Social & Email
          </button>
          
          <button 
            onClick={handleWalletLogin}
            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
              <Wallet size={16} />
            </div>
            Web3 Wallet
          </button>
        </div>
      )}
    </div>
  );
}

