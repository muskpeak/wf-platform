"use client";

import { useEffect, useState } from "react";
import { useWallets, usePrivy } from "@privy-io/react-auth";
import { createPublicClient, http, createWalletClient, custom, Chain } from "viem";
import { polygon } from "viem/chains";
// @ts-ignore
import { signerToEcdsaValidator } from "@zerodev/ecdsa-validator";
// @ts-ignore
import { createKernelAccount, createKernelAccountClient, createZeroDevPaymasterClient } from "@zerodev/sdk";
// @ts-ignore
import { KERNEL_V3_1, getEntryPoint } from "@zerodev/sdk/constants";
import { useWeb3Config } from "../providers/Web3Provider";

const entryPoint = getEntryPoint("0.7");

export function useZeroDev(zeroDevProjectId?: string, targetChain: Chain = polygon) {
  const web3Config = useWeb3Config();
  const effectiveProjectId = zeroDevProjectId || web3Config?.zeroDevProjectId || "";

  const { wallets } = useWallets();
  const { authenticated, ready, login } = usePrivy();
  const [kernelClient, setKernelClient] = useState<any>(null);
  const [sudoValidator, setSudoValidator] = useState<any>(null);
  const [aaAddress, setAaAddress] = useState<string | null>(null);
  const [eoaClient, setEoaClient] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    const initZeroDev = async () => {
      // 必须在 Privy 已初始化并且用户处于登录认证状态时，才派生与加载智能账户
      if (!ready || !authenticated) {
        setKernelClient(null);
        setSudoValidator(null);
        setAaAddress(null);
        setEoaClient(null);
        setIsInitializing(false);
        return;
      }

      let embeddedWallet = wallets.find((w) => w.walletClientType === "privy");
      if (!embeddedWallet && wallets.length > 0) {
        embeddedWallet = wallets[0];
      }

      if (!embeddedWallet) {
        setKernelClient(null);
        setSudoValidator(null);
        setAaAddress(null);
        setEoaClient(null);
        return;
      }
      
      if (!effectiveProjectId) {
        setKernelClient(null);
        setSudoValidator(null);
        setAaAddress(null);
        setEoaClient(null);
        return;
      }

      setIsInitializing(true);
      try {
        const privyProvider = await embeddedWallet.getEthereumProvider();
        
        const publicClient = createPublicClient({
          chain: targetChain,
          transport: http(),
        });

        const walletClient = createWalletClient({
          chain: targetChain,
          transport: custom(privyProvider),
          account: embeddedWallet.address as `0x${string}`,
        });

        const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
          signer: walletClient as any,
          entryPoint: entryPoint,
          kernelVersion: KERNEL_V3_1,
        });

        const account = await createKernelAccount(publicClient, {
          plugins: {
            sudo: ecdsaValidator,
          },
          entryPoint: entryPoint,
          kernelVersion: KERNEL_V3_1,
        });

        const rpcUrl = `https://rpc.zerodev.app/api/v3/${effectiveProjectId}/chain/${targetChain.id}`;

        const paymasterClient = createZeroDevPaymasterClient({
          chain: targetChain,
          transport: http(rpcUrl),
        });

        const client = createKernelAccountClient({
          account,
          chain: targetChain,
          bundlerTransport: http(rpcUrl),
          paymaster: paymasterClient,
        });
        
        setKernelClient(client);
        setSudoValidator(ecdsaValidator);
        setAaAddress(account.address);
        setEoaClient(walletClient);
      } catch (error) {
        console.error("[ZeroDev] ❌ 初始化失败:", error);
      } finally {
        setIsInitializing(false);
      }
    };

    initZeroDev();
  }, [wallets, effectiveProjectId, targetChain, ready, authenticated]);

  return {
    kernelClient,
    sudoValidator,
    aaAddress,
    eoaClient,
    isInitializing,
    authenticated,
    ready,
    login,
    isConnected: Boolean(ready && authenticated && aaAddress),
  };
}
