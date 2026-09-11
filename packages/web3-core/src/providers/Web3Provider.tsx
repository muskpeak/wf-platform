"use client";

import React, { ReactNode, useState, useEffect, useMemo } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import '@rainbow-me/rainbowkit/styles.css';
import { connectorsForWallets, RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import {
  metaMaskWallet,
  okxWallet,
  coinbaseWallet,
  rabbyWallet,
  phantomWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { createConfig, http, WagmiProvider, createStorage, cookieStorage } from 'wagmi';
import { mainnet, polygon, arbitrum, sepolia } from 'wagmi/chains';

const queryClient = new QueryClient();

export interface Web3ContextType {
  zeroDevProjectId: string;
}

const Web3Context = React.createContext<Web3ContextType>({ zeroDevProjectId: "" });

export const useWeb3Config = () => React.useContext(Web3Context);

export interface Web3ProviderProps {
  privyAppId: string;
  zeroDevProjectId: string;
  children: ReactNode;
}

export function Web3Provider({ privyAppId, zeroDevProjectId, children }: Web3ProviderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const wagmiConfig = useMemo(() => {
    if (!mounted) return null;

    const connectors = connectorsForWallets(
      [
        {
          groupName: 'Recommended Wallets',
          wallets: [
            metaMaskWallet,
            okxWallet,
            coinbaseWallet,
            rabbyWallet,
            phantomWallet,
          ],
        },
      ],
      {
        appName: 'WF Platform',
        projectId: 'a4ec291eb8f1b63fb4e9c71a396263fa',
      }
    );

    return createConfig({
      chains: [mainnet, polygon, arbitrum, sepolia],
      connectors,
      ssr: true,
      storage: createStorage({
        storage: cookieStorage,
      }),
      transports: {
        [mainnet.id]: http(),
        [polygon.id]: http(),
        [arbitrum.id]: http(),
        [sepolia.id]: http(),
      },
    });
  }, [mounted]);

  // SSR 阶段：仅渲染基础 Provider 结构，防止服务器阶段触发 Wagmi / RainbowKit 的 WalletConnect 初始化
  if (!mounted || !wagmiConfig) {
    return (
      <Web3Context.Provider value={{ zeroDevProjectId }}>
        <QueryClientProvider client={queryClient}>
          <PrivyProvider
            appId={privyAppId}
            config={{
              loginMethods: ["email", "wallet", "google", "apple", "twitter"],
              appearance: {
                theme: "dark",
                accentColor: "#676FFF",
                logo: "https://auth.privy.io/logos/privy-logo-dark.png",
              },
              embeddedWallets: {
                ethereum: {
                  createOnLogin: "users-without-wallets",
                },
              },
            }}
          >
            {children}
          </PrivyProvider>
        </QueryClientProvider>
      </Web3Context.Provider>
    );
  }

  return (
    <Web3Context.Provider value={{ zeroDevProjectId }}>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider theme={darkTheme({ accentColor: '#7b3fe4' })}>
            <PrivyProvider
              appId={privyAppId}
              config={{
                loginMethods: ["email", "wallet", "google", "apple", "twitter"],
                appearance: {
                  theme: "dark",
                  accentColor: "#676FFF",
                  logo: "https://auth.privy.io/logos/privy-logo-dark.png",
                },
                embeddedWallets: {
                  ethereum: {
                    createOnLogin: "users-without-wallets",
                  },
                },
              }}
            >
              {children}
            </PrivyProvider>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </Web3Context.Provider>
  );
}



