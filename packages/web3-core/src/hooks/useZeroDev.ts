"use client";

import { useEffect, useState } from "react";
import { useWallets } from "@privy-io/react-auth";
import { createPublicClient, http, createWalletClient, custom } from "viem";
import { polygon } from "viem/chains";
import { signerToEcdsaValidator } from "@zerodev/ecdsa-validator";
import { createKernelAccount, createKernelAccountClient, createZeroDevPaymasterClient } from "@zerodev/sdk";
import { KERNEL_V3_1, getEntryPoint } from "@zerodev/sdk/constants";

const entryPoint = getEntryPoint("0.7");

export function useZeroDev(zeroDevProjectId: string) {
  const { wallets } = useWallets();
  const [kernelClient, setKernelClient] = useState<any>(null);
  const [sudoValidator, setSudoValidator] = useState<any>(null);
  const [aaAddress, setAaAddress] = useState<string | null>(null);
  const [eoaClient, setEoaClient] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    const initZeroDev = async () => {
      console.log("[ZeroDev] 开始初始化...");
      console.log("[ZeroDev] 当前传入的 Project ID:", zeroDevProjectId);
      console.log("[ZeroDev] 当前可用的钱包列表:", wallets.map(w => w.walletClientType));
      
      let embeddedWallet = wallets.find((w) => w.walletClientType === "privy");
      if (!embeddedWallet && wallets.length > 0) {
        console.log("[ZeroDev] 未找到 Privy 嵌入式钱包，但找到了外部钱包，将使用外部钱包:", wallets[0].walletClientType);
        embeddedWallet = wallets[0];
      }

      if (!embeddedWallet) {
        console.log("[ZeroDev] ❌ 尚未找到任何已连接的钱包，等待用户登录...");
        setKernelClient(null);
        setAaAddress(null);
        return;
      }
      
      if (!zeroDevProjectId) {
        console.log("[ZeroDev] ❌ 未能获取到 ZeroDev Project ID, 请检查环境变量或 ConfigProvider");
        setKernelClient(null);
        setAaAddress(null);
        return;
      }
      
      console.log("[ZeroDev] 找到了 Privy 钱包，地址:", embeddedWallet.address);

      setIsInitializing(true);
      try {
        console.log("[ZeroDev] 正在获取 Privy Provider...");
        const privyProvider = await embeddedWallet.getEthereumProvider();
        
        console.log("[ZeroDev] 正在创建 Public Client (Polygon 主网)...");
        const publicClient = createPublicClient({
          chain: polygon,
          transport: http(),
        });

        console.log("[ZeroDev] 正在创建 Wallet Client...");
        const walletClient = createWalletClient({
          chain: polygon,
          transport: custom(privyProvider),
          account: embeddedWallet.address as `0x${string}`,
        });

        console.log("[ZeroDev] 正在生成 ECDSA Validator (把 Privy 设为 Owner)...");
        const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
          signer: walletClient as any,
          entryPoint: entryPoint,
          kernelVersion: KERNEL_V3_1,
        });

        console.log("[ZeroDev] 正在创建 Kernel Account...");
        const account = await createKernelAccount(publicClient, {
          plugins: {
            sudo: ecdsaValidator,
          },
          entryPoint: entryPoint,
          kernelVersion: KERNEL_V3_1,
        });

        const rpcUrl = `https://rpc.zerodev.app/api/v3/${zeroDevProjectId}/chain/${polygon.id}`;
        console.log("[ZeroDev] 使用的 ZeroDev RPC URL:", rpcUrl);

        console.log("[ZeroDev] 正在创建 Paymaster Client...");
        const paymasterClient = createZeroDevPaymasterClient({
          chain: polygon,
          transport: http(rpcUrl),
        });

        console.log("[ZeroDev] 正在组装 Kernel Account Client...");
        const client = createKernelAccountClient({
          account,
          chain: polygon,
          bundlerTransport: http(rpcUrl),
          paymaster: paymasterClient,
        });
        
        console.log("[ZeroDev] ✅ 智能钱包 AA 地址推算成功!", account.address);
        setKernelClient(client);
        setSudoValidator(ecdsaValidator);
        setAaAddress(account.address);
        setEoaClient(walletClient);
      } catch (error) {
        console.error("[ZeroDev] ❌ 初始化失败，请检查详细错误信息:", error);
      } finally {
        setIsInitializing(false);
      }
    };

    initZeroDev();
  }, [wallets, zeroDevProjectId]);

  return { kernelClient, sudoValidator, aaAddress, eoaClient, isInitializing };
}
