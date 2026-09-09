"use client";

import { useTranslation } from "react-i18next";
import { useWeb3Action } from "@wf-platform/web3-core/src/hooks/useWeb3Action";

import { motion } from "@wf-platform/uikit";

export default function Home() {
  const { t } = useTranslation();
  
  // 初始化一个 Web3 动作，自带成功提示
  const { execute, isPending } = useWeb3Action({
    successMessage: "Buy $100 YES Token",
  });

  const handleTestTx = async () => {
    await execute(async () => {
      // 模拟钱包签名等待 1 秒
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 返回一个伪造的以太坊标准的 Tx Hash (66位字符，以0x开头)
      return "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 text-center">
      <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent mb-6">
        {t("common.welcome.title")}
      </h1>
      <p className="max-w-2xl text-lg text-gray-600 dark:text-gray-400 mb-12">
        {t("common.welcome.description")}
      </p>

      {/* 测试 PancakeSwap 级别的全局交易通知 */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        onClick={handleTestTx}
        disabled={isPending}
        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 flex items-center gap-2"
      >
        {isPending ? (
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Sign in Wallet...
          </span>
        ) : (
          "Test Transaction Hash"
        )}
      </motion.button>
    </div>
  );
}
