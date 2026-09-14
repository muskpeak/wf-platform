"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { encodeFunctionData, isAddress, parseUnits } from "viem";
import { toast } from "@wf-platform/uikit";
import { useZeroDev } from "@wf-platform/web3-core";
import { vaultService } from "../services/vault/vault.service";
import type { VaultChain } from "../services/vault/vault.types";

// ERC20 transfer ABI (minimal)
const ERC20_ABI = [
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

// Polygon USDC address
const POLYGON_USDC = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";

function validateRecipient(chain: VaultChain | null, addr: string): string {
  const trimmed = addr.trim();
  if (!trimmed) return "";
  const vm = String(chain?.vmType || "").toLowerCase();
  const name = String(chain?.name || "").toLowerCase();
  if (trimmed === "0x0000000000000000000000000000000000000000")
    return "无效的 EVM 地址";
  if (vm === "svm" || name.includes("solana"))
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmed)
      ? ""
      : "无效的 Solana 地址";
  if (name.includes("tron"))
    return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(trimmed)
      ? ""
      : "无效的 Tron 地址";
  return isAddress(trimmed) ? "" : "无效的 EVM 地址";
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function useWithdraw(open: boolean) {
  const { aaAddress, kernelClient } = useZeroDev();
  const quoteReqIdRef = useRef(0);

  const [destinationChainId, setDestinationChainId] = useState("");
  const [destinationCurrency, setDestinationCurrency] = useState("");
  const [recipient, setRecipient] = useState("");
  const [amountInput, setAmountInput] = useState("");

  const [quoteStatus, setQuoteStatus] = useState({ msg: "", err: false });
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteData, setQuoteData] = useState<any>(null);
  const [executeLoading, setExecuteLoading] = useState(false);
  const [submittedTxHash, setSubmittedTxHash] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // ─── 1. 获取提现配置 ─────────────────────────────────────
  const { data: configRecord, error: chainsErr } = useQuery({
    queryKey: ["vault", "withdraw", "config"],
    queryFn: () => vaultService.getWithdrawConfig(),
    staleTime: 60_000,
    enabled: open,
  });

  useEffect(() => {
    if (chainsErr) toast.error("获取提现配置失败，请稍后重试");
  }, [chainsErr]);

  const chains: VaultChain[] = useMemo(
    () => configRecord?.USDC || [],
    [configRecord]
  );

  // ─── 2. 弹窗关闭重置 ─────────────────────────────────────
  useEffect(() => {
    if (!open) {
      setDestinationChainId("");
      setDestinationCurrency("");
      setRecipient("");
      setAmountInput("");
      setQuoteData(null);
      setQuoteStatus({ msg: "", err: false });
      setExecuteLoading(false);
      setSubmittedTxHash("");
      setIsSuccess(false);
    }
  }, [open]);

  // ─── 3. Debounce 输入 ─────────────────────────────────────
  const debouncedAmount = useDebounce(amountInput, 1500);
  const debouncedRecipient = useDebounce(recipient, 1500);

  // ─── 4. 衍生数据 ─────────────────────────────────────────
  const destChainObj = useMemo(
    () =>
      destinationChainId
        ? chains.find((c) => String(c.id) === destinationChainId) ?? null
        : null,
    [chains, destinationChainId]
  );

  const destTokens = useMemo(
    () => vaultService.getOriginTokens(destChainObj),
    [destChainObj]
  );

  const recipientErr = useMemo(
    () => validateRecipient(destChainObj, recipient),
    [destChainObj, recipient]
  );

  const amountWei = useMemo(() => {
    const n = Number(amountInput);
    if (!amountInput.trim() || !Number.isFinite(n) || n <= 0) return "";
    try {
      return parseUnits(amountInput.trim(), 6).toString(); // USDC = 6 decimals
    } catch {
      return "";
    }
  }, [amountInput]);

  const debouncedAmountWei = useMemo(() => {
    const n = Number(debouncedAmount);
    if (!debouncedAmount.trim() || !Number.isFinite(n) || n <= 0) return "";
    try {
      return parseUnits(debouncedAmount.trim(), 6).toString();
    } catch {
      return "";
    }
  }, [debouncedAmount]);

  const selectedDestToken = useMemo(
    () =>
      destTokens.find(
        (t) =>
          (t.address || "").toLowerCase() ===
          destinationCurrency.toLowerCase()
      ) ?? null,
    [destTokens, destinationCurrency]
  );

  const minAmountErr = useMemo(() => {
    const n = Number(amountInput);
    if (!amountInput || !Number.isFinite(n) || n <= 0) return "";
    const min = Number(selectedDestToken?.minAmount);
    if (min > 0 && n < min) return `最小提现金额为 ${min} USDC`;
    return "";
  }, [amountInput, selectedDestToken]);

  const canQuote = useMemo(
    () =>
      Boolean(
        open &&
          aaAddress &&
          destinationChainId &&
          destinationCurrency &&
          amountWei &&
          !minAmountErr &&
          recipient.trim() &&
          !recipientErr &&
          !quoteLoading
      ),
    [
      open, aaAddress, destinationChainId, destinationCurrency,
      amountWei, minAmountErr, recipient, recipientErr, quoteLoading,
    ]
  );

  // ─── 5. 清空 quote（输入变化时）─────────────────────────
  useEffect(() => {
    if (
      amountInput !== debouncedAmount ||
      recipient !== debouncedRecipient
    ) {
      setQuoteData(null);
      setQuoteStatus({ msg: "", err: false });
    }
  }, [amountInput, debouncedAmount, recipient, debouncedRecipient]);

  // ─── 6. 询价 ─────────────────────────────────────────────
  const postQuote = useCallback(
    async (targetAmountWei: string, targetRecipient: string) => {
      if (!aaAddress || !destinationChainId || !destinationCurrency || !targetAmountWei)
        return;

      // 同链直接提现（目标链 = Polygon），跳过 Relay
      const isSameChain = Number(destinationChainId) === 137;
      const isUSDC =
        destinationCurrency.toLowerCase() === "usdc" ||
        destinationCurrency.toLowerCase() === POLYGON_USDC.toLowerCase();

      if (isSameChain && isUSDC) {
        setQuoteData({ steps: [{ kind: "local" }], fees: [], details: {} });
        setQuoteStatus({ msg: "已就绪，确认提现", err: false });
        return;
      }

      setQuoteLoading(true);
      setQuoteData(null);
      const reqId = ++quoteReqIdRef.current;

      try {
        const data = await vaultService.getQuote({
          user: aaAddress,
          originChainId: 137,
          originCurrency: POLYGON_USDC,
          destinationChainId: Number(destinationChainId),
          destinationCurrency,
          tradeType: "EXACT_INPUT",
          recipient: targetRecipient.trim(),
          amount: targetAmountWei,
          usePermit: false,
          useExternalLiquidity: true,
          useDepositAddress: false,
        });
        if (reqId !== quoteReqIdRef.current) return;
        setQuoteData(data);
        setQuoteStatus({ msg: "询价成功，确认提现", err: false });
      } catch {
        if (reqId !== quoteReqIdRef.current) return;
        toast.error("询价失败，请重试");
        setQuoteStatus({ msg: "", err: true });
        setQuoteData(null);
      } finally {
        if (reqId === quoteReqIdRef.current) setQuoteLoading(false);
      }
    },
    [aaAddress, destinationChainId, destinationCurrency]
  );

  // ─── 7. 自动询价（debounce 后触发）─────────────────────
  useEffect(() => {
    if (
      !open || !aaAddress || !destinationChainId || !destinationCurrency ||
      !debouncedAmountWei || !debouncedRecipient.trim() || recipientErr ||
      amountInput !== debouncedAmount || recipient !== debouncedRecipient
    )
      return;
    void postQuote(debouncedAmountWei, debouncedRecipient);
  }, [
    open, aaAddress, destinationChainId, destinationCurrency,
    debouncedAmountWei, debouncedRecipient, recipientErr,
    amountInput, debouncedAmount, recipient, postQuote,
  ]);

  // ─── 8. 执行提现 ─────────────────────────────────────────
  const executeWithdraw = useCallback(async () => {
    if (!aaAddress || !quoteData || !amountWei || !kernelClient) {
      toast.error("请检查钱包连接和提现信息");
      return;
    }
    setExecuteLoading(true);

    try {
      // 同链 USDC 直接 ERC20 transfer
      const isSameChain = Number(destinationChainId) === 137;
      if (isSameChain) {
        const transferData = encodeFunctionData({
          abi: ERC20_ABI,
          functionName: "transfer",
          args: [recipient.trim() as `0x${string}`, BigInt(amountWei)],
        });
        const userOpHash = await kernelClient.sendUserOperation({
          calls: [
            {
              to: POLYGON_USDC as `0x${string}`,
              data: transferData,
              value: BigInt(0),
            },
          ],
        });
        const receipt = await kernelClient.waitForUserOperationReceipt({
          hash: userOpHash,
        });
        setSubmittedTxHash(receipt.receipt.transactionHash);
        setIsSuccess(true);
        toast.success("提现成功！");
        return;
      }

      // 跨链：按 quote steps 批量执行
      const allCalls: { to: `0x${string}`; data: `0x${string}`; value: bigint }[] = [];
      let checkPath: string | undefined;
      for (const step of quoteData.steps ?? []) {
        for (const item of step.items ?? []) {
          const raw = item.data;
          if (!raw) continue;
          allCalls.push({
            to: raw.to as `0x${string}`,
            data: raw.data as `0x${string}`,
            value: raw.value ? BigInt(raw.value) : BigInt(0),
          });
          if (item.check?.endpoint) checkPath = item.check.endpoint;
        }
      }

      if (allCalls.length === 0) throw new Error("无可执行交易数据");

      const userOpHash = await kernelClient.sendUserOperation({ calls: allCalls });
      const receipt = await kernelClient.waitForUserOperationReceipt({
        hash: userOpHash,
      });
      setSubmittedTxHash(receipt.receipt.transactionHash);

      // 跨链轮询直至终态
      if (checkPath) {
        await vaultService.pollIntentUntilDone(
          checkPath,
          "https://api.relay.link"
        );
      }

      setIsSuccess(true);
      toast.success("提现成功！");
    } catch (e: any) {
      toast.error(e?.message || "提现失败，请重试");
    } finally {
      setExecuteLoading(false);
    }
  }, [
    aaAddress, kernelClient, quoteData, amountWei,
    destinationChainId, recipient,
  ]);

  const backToForm = useCallback(() => {
    setAmountInput("");
    setQuoteData(null);
    setQuoteStatus({ msg: "", err: false });
    setSubmittedTxHash("");
    setIsSuccess(false);
    setExecuteLoading(false);
  }, []);

  return {
    chains,
    destinationChainId,
    setDestinationChainId,
    destChainObj,
    destTokens,
    destinationCurrency,
    setDestinationCurrency,
    selectedDestToken,
    recipient,
    setRecipient,
    recipientErr,
    amountInput,
    setAmountInput,
    amountWei,
    minAmountErr,
    quoteStatus,
    quoteLoading,
    quoteData,
    canQuote,
    executeLoading,
    submittedTxHash,
    isSuccess,
    executeWithdraw,
    backToForm,
  };
}
