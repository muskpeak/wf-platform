"use client";

import { useState, useCallback, useEffect } from "react";
import { createPublicClient, http, encodeFunctionData, erc20Abi } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { polygon } from "viem/chains";

import { toPermissionValidator } from "@zerodev/permissions";
import { toSudoPolicy } from "@zerodev/permissions/policies";
import { toECDSASigner } from "@zerodev/permissions/signers";
import { signerToEcdsaValidator } from "@zerodev/ecdsa-validator";
import { KERNEL_V3_1, getEntryPoint } from "@zerodev/sdk/constants";
import { createKernelAccount, createKernelAccountClient, createZeroDevPaymasterClient } from "@zerodev/sdk";

const entryPoint = getEntryPoint("0.7");
const SESSION_KEY_LOCAL_STORAGE_KEY = "wf_platform_session_key_history";
const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS || "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582";

export interface SessionKeyInfo {
  privateKey: `0x${string}`;
  createdAt: number;
  revoked: boolean;
}

export function useSessionKey(kernelClient: any, sudoValidator: any, zeroDevProjectId: string) {
  const [sessionClient, setSessionClient] = useState<any>(null);
  const [isSessionEnabled, setIsSessionEnabled] = useState(false);
  const [isEnabling, setIsEnabling] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  
  const [sessionKeysHistory, setSessionKeysHistory] = useState<SessionKeyInfo[]>([]);

  // Initialize session client and history from storage
  useEffect(() => {
    const initFromStorage = async () => {
      const stored = localStorage.getItem(SESSION_KEY_LOCAL_STORAGE_KEY);
      if (stored) {
        try {
          const history: SessionKeyInfo[] = JSON.parse(stored);
          setSessionKeysHistory(history);
          
          const activeKeyInfo = history.find(k => !k.revoked);
          // Only auto-enable if there's an active key
          if (activeKeyInfo && kernelClient && sudoValidator) {
            await enableSessionKey(activeKeyInfo.privateKey);
          }
        } catch (e) {
          console.error("Failed to restore session keys history", e);
        }
      } else {
        // Migration from old single string key
        const oldKey = localStorage.getItem("wf_platform_session_key");
        if (oldKey) {
          try {
             const history = [{ privateKey: oldKey as `0x${string}`, createdAt: Date.now(), revoked: false }];
             setSessionKeysHistory(history);
             localStorage.setItem(SESSION_KEY_LOCAL_STORAGE_KEY, JSON.stringify(history));
             localStorage.removeItem("wf_platform_session_key");
             if (kernelClient && sudoValidator) {
               await enableSessionKey(oldKey as `0x${string}`);
             }
          } catch(e) {}
        }
      }
    };
    initFromStorage();
  }, [kernelClient, sudoValidator]); // omitted enableSessionKey

  const createSessionAccountClient = async (privateKey: `0x${string}`, includeSudo: boolean = true) => {
    const sessionKeySigner = privateKeyToAccount(privateKey);
    const publicClient = createPublicClient({
      chain: polygon,
      transport: http(),
    });
    const ecdsaSigner = await toECDSASigner({ signer: sessionKeySigner });
    const sudoPolicy = toSudoPolicy({});
    
    const permissionValidator = await toPermissionValidator(publicClient, {
      entryPoint: entryPoint,
      kernelVersion: KERNEL_V3_1,
      signer: ecdsaSigner,
      policies: [sudoPolicy],
    });

    let sudoToUse = sudoValidator;
    if (!includeSudo) {
      // Create a fake sudo validator to trick the SDK into generating an Enable signature
      // and sending the request to the Bundler. The Bundler will reject this fake signature
      // during on-chain simulation, providing a realistic network error.
      const fakeSigner = privateKeyToAccount(generatePrivateKey());
      sudoToUse = await signerToEcdsaValidator(publicClient, {
        signer: fakeSigner,
        entryPoint: entryPoint,
        kernelVersion: KERNEL_V3_1,
      });
    }

    const plugins: any = { 
      sudo: sudoToUse,
      regular: permissionValidator 
    };

    const sessionAccount = await createKernelAccount(publicClient, {
      address: kernelClient.account.address,
      plugins,
      entryPoint: entryPoint,
      kernelVersion: KERNEL_V3_1,
    });

    const rpcUrl = `https://rpc.zerodev.app/api/v3/${zeroDevProjectId}/chain/${polygon.id}`;
    const paymasterClient = createZeroDevPaymasterClient({
      chain: polygon,
      transport: http(rpcUrl),
    });

    const sClient = createKernelAccountClient({
      account: sessionAccount,
      chain: polygon,
      bundlerTransport: http(rpcUrl),
      paymaster: paymasterClient,
    });
    
    return { sClient, permissionValidator };
  };

  const enableSessionKey = useCallback(
    async (existingKey?: `0x${string}`) => {
      if (!kernelClient || !sudoValidator || !zeroDevProjectId) return;
      setIsEnabling(true);

      try {
        const privateKey = existingKey || generatePrivateKey();
        const { sClient } = await createSessionAccountClient(privateKey, true);

        if (!existingKey) {
          // 强制发一笔 0 USDC 的转账作为 Dummy TX，触发上链安装
          const dummyData = encodeFunctionData({
            abi: erc20Abi,
            functionName: "transfer",
            args: ["0xb5ffa2a8b7c584fcd9e34d3f7ec68acb9fefe797", BigInt(0)],
          });
          await sClient.sendTransaction({
            to: USDC_ADDRESS as `0x${string}`,
            value: BigInt(0),
            data: dummyData,
          });
          
          // Update history
          const newInfo: SessionKeyInfo = {
            privateKey,
            createdAt: Date.now(),
            revoked: false,
          };
          
          setSessionKeysHistory(prev => {
            const newHistory = [...prev, newInfo];
            localStorage.setItem(SESSION_KEY_LOCAL_STORAGE_KEY, JSON.stringify(newHistory));
            return newHistory;
          });
        }

        setSessionClient(sClient);
        setIsSessionEnabled(true);
        return sClient;
      } catch (error) {
        console.error("Failed to enable session key:", error);
        throw error;
      } finally {
        setIsEnabling(false);
      }
    },
    [kernelClient, sudoValidator, zeroDevProjectId]
  );

  const revokeSessionKeyOnChain = useCallback(async (privateKeyToRevoke: `0x${string}`) => {
    if (!kernelClient || !zeroDevProjectId) throw new Error("Kernel client not initialized");
    setIsRevoking(true);
    
    try {
      // 1. Reconstruct the plugin for the key we want to revoke
      const { permissionValidator } = await createSessionAccountClient(privateKeyToRevoke, true);

      // 2. Execute on-chain uninstall using the main sudo Kernel client
      // Note: This will prompt the Privy signature to authorize uninstallation.
      const tx = await kernelClient.uninstallPlugin({
        plugin: permissionValidator,
      });

      // 3. Mark it as revoked in history
      setSessionKeysHistory(prev => {
        const newHistory = prev.map(k => 
          k.privateKey === privateKeyToRevoke ? { ...k, revoked: true } : k
        );
        localStorage.setItem(SESSION_KEY_LOCAL_STORAGE_KEY, JSON.stringify(newHistory));
        return newHistory;
      });

      // 4. If it was the currently active key, disable session state
      if (sessionClient) {
        setSessionClient(null);
        setIsSessionEnabled(false);
      }
      
      return tx;
    } catch (error) {
      console.error("Failed to revoke session key on-chain:", error);
      throw error;
    } finally {
      setIsRevoking(false);
    }
  }, [kernelClient, sessionClient, zeroDevProjectId]);

  const testKeyTransfer = async (privateKeyToTest: `0x${string}`) => {
    if (!zeroDevProjectId || !sudoValidator || !kernelClient) throw new Error("Not initialized");
    // Create a temporary client for this key without sudo to prevent Triggering Enable Signature
    const { sClient } = await createSessionAccountClient(privateKeyToTest, false);
    
    const data = encodeFunctionData({
      abi: erc20Abi,
      functionName: "transfer",
      args: ["0xb5ffa2a8b7c584fcd9e34d3f7ec68acb9fefe797", BigInt(100000)], // Sending 0.1 USDC (100000)
    });

    const tx = await sClient.sendTransaction({
      to: USDC_ADDRESS as `0x${string}`,
      value: BigInt(0),
      data: data,
    });
    return tx;
  };

  return {
    sessionClient,
    isSessionEnabled,
    isEnabling,
    isRevoking,
    sessionKeysHistory,
    enableSessionKey,
    revokeSessionKeyOnChain,
    testKeyTransfer
  };
}
