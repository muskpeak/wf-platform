"use client";

import { useState, useCallback } from 'react';
import { parseWeb3Error, ParsedWeb3Error } from '../utils/contractErrors';
import { useTranslation } from 'react-i18next';
import { toast } from '@wf-platform/uikit';
import { useTransactionStore } from '../store/useTransactionStore';

interface UseWeb3ActionOptions {
  /** Optional ABIs for deep Account Abstraction error decoding */
  abis?: any[];
  /** Whether to automatically show a global Toast on error (default: true) */
  showToastOnError?: boolean;
  /** Whether to automatically show a global Toast on success (default: false) */
  showToastOnSuccess?: boolean;
  /** Custom success message (can be a translation key) */
  successMessage?: string;
}

/**
 * A highly reusable wrapper for ANY Web3 transaction or contract call.
 * It automatically catches viem/wallet errors, parses them through the deep Web3 error parser,
 * translates them into user-friendly localized messages, and handles global Toasts.
 */
export function useWeb3Action(options: UseWeb3ActionOptions = {}) {
  const { 
    abis = [], 
    showToastOnError = true, 
    showToastOnSuccess = false,
    successMessage = 'Transaction Successful!' 
  } = options;

  const { t } = useTranslation();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<ParsedWeb3Error | null>(null);

  const execute = useCallback(
    async <T,>(action: () => Promise<T>): Promise<T | null> => {
      setIsPending(true);
      setError(null);
      
      try {
        const result = await action();
        
        // --- 核心逻辑：拦截 Transaction Hash，加入全局队列 ---
        // 判定条件：返回值是字符串，以 0x 开头，且长度通常为 66（以太坊/EVM Tx Hash 长度）
        if (typeof result === 'string' && result.startsWith('0x') && result.length === 66) {
          const txHash = result;
          
          // 1. 存入全局 Zustand Store
          useTransactionStore.getState().addTransaction({
            hash: txHash,
            description: t(successMessage) || 'Smart Contract Interaction',
            status: 'pending',
            timestamp: Date.now()
          });

          // 2. 呼叫 Sonner 弹出持久化的 Loading Toast，并绑定 id 为 txHash
          toast.loading(t('Transaction Pending... (Sending to Blockchain)'), { id: txHash });

          // 3. 【演示用】模拟区块链打包 (3秒后成功)
          // 在正式生产环境中，这里应该替换为: await publicClient.waitForTransactionReceipt({ hash: txHash })
          setTimeout(() => {
            useTransactionStore.getState().updateTransaction(txHash, { status: 'success' });
            
            // 带有区块链浏览器链接的精美 Web3 弹窗
            toast.success(t(successMessage) || 'Transaction Confirmed!', { 
              id: txHash,
              description: (
                <a 
                  href={`https://polygonscan.com/tx/${txHash}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-1 text-blue-500 hover:text-blue-600 transition-colors mt-1 font-medium"
                >
                  View on Polygonscan ↗
                </a>
              )
            });
          }, 3000);

          return result;
        }

        // 普通的非上链操作（比如单纯的 API 或签名）
        if (showToastOnSuccess) {
          toast.success(t(successMessage));
        }

        return result;
      } catch (err) {
        // 1. Pass the raw error to our hardcore parser
        const parsedError = parseWeb3Error(err, abis);
        setError(parsedError);

        // 2. Translate the parsed error message
        // If it's a generic kind, we can have fallback i18n keys
        // If it's a Custom Contract Error (like 'InsufficientLiquidity'), we pass it directly to i18n
        let translatedMessage = parsedError.message;
        const i18nKey = `Web3Error.${parsedError.message}`; // e.g., Web3Error.InsufficientLiquidity
        
        // Check if translation exists, otherwise fallback to the raw english message we provided in parser
        // const tResult = t(i18nKey);
        // if (tResult !== i18nKey) translatedMessage = tResult;

        if (showToastOnError) {
          toast.error(translatedMessage);
        }

        return null;
      } finally {
        setIsPending(false);
      }
    },
    [abis, showToastOnError, showToastOnSuccess, successMessage, t]
  );

  return { execute, isPending, error };
}
