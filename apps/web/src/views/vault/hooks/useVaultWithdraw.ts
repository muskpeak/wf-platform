"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { formatUnits, isAddress, parseUnits, encodeFunctionData } from "viem";
import { useQuery } from "@tanstack/react-query";
import { useZeroDev } from "@wf-platform/web3-core";
import { toast } from "@wf-platform/uikit";
import type { QuoteData, QuoteStep, VaultChain } from "../services/vault.types";
import {
  findChainById,
  getDestinationTokens,
  getOriginTokens,
  tokenKey,
} from "../utils/vault.utils";
import {
  CHAIN_ID,
  USDC_ADDRESS,
  USDC_DECIMALS,
  USDC_SYMBOL,
} from "../config/vault.config";
import { vaultService } from "../services/vault.service";

const ERC20_ABI = [
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "recipient", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

function isLikelySolanaAddress(addr: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr);
}

function isLikelyTronAddress(addr: string): boolean {
  return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(addr);
}

function isLikelyBitcoinAddress(addr: string): boolean {
  return /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{20,}$/.test(addr);
}

function validateRecipientByChain(
  chain: VaultChain | null,
  recipient: string
): string {
  const trimmed = recipient.trim();
  if (!trimmed) return "";
  const vm = String(chain?.vmType || "").toLowerCase();
  const name = String(chain?.name || "").toLowerCase();

  if (trimmed === "0x0000000000000000000000000000000000000000") {
    return "不能向零地址提现";
  }

  if (vm === "svm" || name.includes("solana")) {
    return isLikelySolanaAddress(trimmed) ? "" : "请输入有效的 Solana 链上地址";
  }
  if (name.includes("tron")) {
    return isLikelyTronAddress(trimmed) ? "" : "请输入有效的波场 (Tron) 链上地址";
  }
  if (name.includes("bitcoin")) {
    return isLikelyBitcoinAddress(trimmed) ? "" : "请输入有效的比特币 (Bitcoin) 地址";
  }

  return isAddress(trimmed) ? "" : "请输入有效的 EVM 钱包地址 (0x...)";
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

export function useVaultWithdraw(
  open: boolean,
  externalBalanceRaw: string = "0"
) {
  const { aaAddress, kernelClient } = useZeroDev();
  const quoteRequestIdRef = useRef<number>(0);

  // 固定资产为 USDC
  const withdrawAsset = USDC_SYMBOL;

  const [destinationChainId, setDestinationChainId] = useState("");
  const [destinationCurrency, setDestinationCurrency] = useState("");
  const [recipient, setRecipient] = useState("");
  const [amountInput, setAmountInput] = useState("");

  const [quoteStatus, setQuoteStatus] = useState({ msg: "", err: false });
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);

  const [executeLoading, setExecuteLoading] = useState(false);
  const [executeStatus, setExecuteStatus] = useState({ msg: "", err: false });
  const [submittedTxHashes, setSubmittedTxHashes] = useState<string[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);

  const { data: configRecord, error: chainsErr } = useQuery({
    queryKey: ["vault", "withdraw", "config"],
    queryFn: () => vaultService.getWithdrawConfig(),
    staleTime: 60000,
    enabled: open,
  });

  const chains = useMemo(() => {
    if (!configRecord) return [];
    return configRecord[withdrawAsset] || configRecord["USDC"] || [];
  }, [configRecord, withdrawAsset]);

  useEffect(() => {
    if (chainsErr) {
      toast.error(String(chainsErr));
    }
  }, [chainsErr]);

  const chainsError = chainsErr ? String(chainsErr) : "";
  const vaultBalanceRaw = externalBalanceRaw;

  // 源网络固定为 Polygon (137)
  const originChainObj = useMemo(() => {
    const found = findChainById(chains, CHAIN_ID);
    if (found) return found;
    return {
      id: CHAIN_ID,
      name: "Polygon",
      displayName: "Polygon",
      iconUrl: "/assets/tokens/polygon.png",
      depositEnabled: true,
      featuredTokens: [],
      solverCurrencies: [],
    } as any;
  }, [chains]);

  const originToken = useMemo(() => {
    const tokens = getOriginTokens(originChainObj);
    if (tokens.length) {
      const foundToken = tokens.find(
        (t) =>
          String(t.address || "").toLowerCase() ===
          String(USDC_ADDRESS).toLowerCase()
      );
      if (foundToken) return foundToken;
    }
    return {
      address: USDC_ADDRESS,
      symbol: USDC_SYMBOL,
      decimals: USDC_DECIMALS,
      logoURI: "/assets/usdc-icon.svg",
    } as any;
  }, [originChainObj]);

  const destinationChains = chains;

  const destChainObj = useMemo(
    () =>
      destinationChainId ? findChainById(chains, destinationChainId.trim()) : null,
    [chains, destinationChainId]
  );

  const destTokens = useMemo(() => {
    return getDestinationTokens(destChainObj);
  }, [destChainObj]);

  // 默认选中第一个目标代币
  useEffect(() => {
    if (destTokens.length > 0 && !destinationCurrency) {
      const defaultToken =
        destTokens.find((t) => t.symbol?.toUpperCase().includes("USDC")) ||
        destTokens[0];
      setDestinationCurrency(defaultToken.address || "");
    }
  }, [destTokens, destinationCurrency]);

  useEffect(() => {
    if (!open) {
      setDestinationChainId("");
      setDestinationCurrency("");
      setRecipient("");
      setAmountInput("");
      setQuoteStatus({ msg: "", err: false });
      setQuoteData(null);
      setExecuteStatus({ msg: "", err: false });
      setSubmittedTxHashes([]);
      setExecuteLoading(false);
      setIsSuccess(false);
    }
  }, [open]);

  const recipientErr = useMemo(
    () => validateRecipientByChain(destChainObj, recipient),
    [destChainObj, recipient]
  );

  // 防抖输入用于自动询价
  const debouncedAmountInput = useDebounce(amountInput, 1000);
  const debouncedRecipient = useDebounce(recipient, 1000);

  const amountWei = useMemo(() => {
    const trimmed = amountInput.trim();
    if (!trimmed) return "";
    const n = Number(trimmed);
    if (!Number.isFinite(n) || n <= 0) return "";
    try {
      return parseUnits(trimmed, USDC_DECIMALS).toString();
    } catch {
      return "";
    }
  }, [amountInput]);

  const debouncedAmountWei = useMemo(() => {
    const trimmed = debouncedAmountInput.trim();
    if (!trimmed) return "";
    const n = Number(trimmed);
    if (!Number.isFinite(n) || n <= 0) return "";
    try {
      return parseUnits(trimmed, USDC_DECIMALS).toString();
    } catch {
      return "";
    }
  }, [debouncedAmountInput]);

  const isInsufficientBalance = useMemo(() => {
    if (!amountWei) return false;
    try {
      const need = BigInt(amountWei);
      const balNum = parseFloat(vaultBalanceRaw || "0");
      const balWei = parseUnits(balNum.toFixed(6), USDC_DECIMALS);
      return need > balWei;
    } catch {
      return false;
    }
  }, [amountWei, vaultBalanceRaw]);

  useEffect(() => {
    if (
      amountInput !== debouncedAmountInput ||
      recipient !== debouncedRecipient ||
      isInsufficientBalance
    ) {
      setQuoteData(null);
      setQuoteStatus({ msg: "", err: false });
    }
  }, [
    amountInput,
    debouncedAmountInput,
    recipient,
    debouncedRecipient,
    isInsufficientBalance,
  ]);

  const selectedDestToken = useMemo(() => {
    if (!destinationCurrency || !destTokens) return null;
    return (
      destTokens.find(
        (t) => tokenKey(t.address) === tokenKey(destinationCurrency)
      ) || null
    );
  }, [destinationCurrency, destTokens]);

  const minAmountErr = useMemo(() => {
    const numAmount = Number(amountInput);
    if (!amountInput.trim() || !Number.isFinite(numAmount) || numAmount <= 0)
      return "";

    if (selectedDestToken?.minAmount) {
      const min = Number(selectedDestToken.minAmount);
      if (min > 0 && numAmount < min) {
        return `最低提现额为 ${min} ${USDC_SYMBOL}`;
      }
    }
    return "";
  }, [amountInput, selectedDestToken]);

  const canQuote = useMemo(() => {
    return Boolean(
      open &&
        aaAddress &&
        originChainObj &&
        originToken &&
        destinationChainId &&
        destinationCurrency &&
        amountWei &&
        !isInsufficientBalance &&
        !minAmountErr &&
        !!recipient.trim() &&
        !recipientErr &&
        !quoteLoading
    );
  }, [
    open,
    aaAddress,
    originChainObj,
    originToken,
    destinationChainId,
    destinationCurrency,
    amountWei,
    isInsufficientBalance,
    minAmountErr,
    recipient,
    recipientErr,
    quoteLoading,
  ]);

  const postQuote = useCallback(
    async (targetAmountWei: string, targetRecipient: string) => {
      setQuoteStatus({ msg: "", err: false });
      if (!aaAddress) {
        setQuoteStatus({ msg: "请先连接钱包", err: true });
        return;
      }
      if (!originChainObj || !originToken) {
        setQuoteStatus({ msg: "源链配置异常", err: true });
        return;
      }
      if (!destinationChainId || !destinationCurrency) {
        setQuoteStatus({ msg: "请选择目标网络及目标代币", err: true });
        return;
      }

      if (!targetAmountWei) {
        setQuoteStatus({ msg: "请输入有效金额", err: true });
        return;
      }
      if (recipientErr) {
        setQuoteStatus({ msg: recipientErr, err: true });
        return;
      }

      // 如果目标网络同为当前链 (Polygon 137) 且提现 USDC，则走本地转账
      const isTargetChain = Number(destinationChainId) === CHAIN_ID;
      const destTokenLower = destinationCurrency.toLowerCase();
      const isUSDC =
        destTokenLower === "usdc" ||
        destTokenLower === USDC_ADDRESS.toLowerCase();

      if (isTargetChain && isUSDC) {
        const mockDetails = {
          currencyIn: {
            amountFormatted: debouncedAmountInput,
            currency: {
              symbol: USDC_SYMBOL,
              name: USDC_SYMBOL,
              logoURI: "/assets/usdc-icon.svg",
            },
          },
          currencyOut: {
            amountFormatted: debouncedAmountInput,
            currency: {
              symbol: USDC_SYMBOL,
              name: USDC_SYMBOL,
              logoURI: "/assets/usdc-icon.svg",
            },
          },
          rate: "1",
        };

        setQuoteData({
          steps: [
            {
              kind: "transaction",
              id: "local-withdraw",
              items: [],
            },
          ],
          fees: [],
          details: mockDetails,
        } as unknown as QuoteData);
        setQuoteStatus({ msg: "就绪", err: false });
        return;
      }

      setQuoteLoading(true);
      setQuoteData(null);
      const body: Record<string, unknown> = {
        user: aaAddress,
        originChainId: Number(originChainObj.id),
        originCurrency: originToken.address,
        destinationChainId: Number(destinationChainId),
        destinationCurrency: destinationCurrency.trim(),
        tradeType: "EXACT_INPUT",
        recipient: targetRecipient.trim(),
        amount: targetAmountWei,
        usePermit: false,
        useExternalLiquidity: true,
        useDepositAddress: false,
        referrer: "",
      };

      const currentRequestId = ++quoteRequestIdRef.current;
      try {
        const data = await vaultService.getQuote(body);
        if (currentRequestId !== quoteRequestIdRef.current) return;
        setQuoteData(data as QuoteData);
        setQuoteStatus({ msg: "询价成功", err: false });
      } catch (e: any) {
        if (currentRequestId !== quoteRequestIdRef.current) return;
        const errMsg = e?.message || "询价失败，请稍后再试";
        toast.error(errMsg);
        setQuoteStatus({ msg: errMsg, err: true });
        setQuoteData(null);
      } finally {
        if (currentRequestId === quoteRequestIdRef.current) {
          setQuoteLoading(false);
        }
      }
    },
    [
      aaAddress,
      originChainObj,
      originToken,
      destinationChainId,
      destinationCurrency,
      recipientErr,
      debouncedAmountInput,
    ]
  );

  // 自动询价 Effect
  useEffect(() => {
    if (
      !open ||
      !aaAddress ||
      !originChainObj ||
      !originToken ||
      !destinationChainId ||
      !destinationCurrency ||
      !debouncedAmountWei ||
      !debouncedRecipient.trim() ||
      recipientErr ||
      isInsufficientBalance ||
      amountInput !== debouncedAmountInput ||
      recipient !== debouncedRecipient
    ) {
      return;
    }

    void postQuote(debouncedAmountWei, debouncedRecipient);
  }, [
    open,
    aaAddress,
    originChainObj,
    originToken,
    destinationChainId,
    destinationCurrency,
    debouncedAmountWei,
    debouncedRecipient,
    recipientErr,
    isInsufficientBalance,
    amountInput,
    debouncedAmountInput,
    recipient,
    postQuote,
  ]);

  const backToQuoteForm = useCallback(() => {
    setAmountInput("");
    setQuoteData(null);
    setQuoteStatus({ msg: "", err: false });
    setExecuteStatus({ msg: "", err: false });
    setSubmittedTxHashes([]);
    setExecuteLoading(false);
    setIsSuccess(false);
  }, []);

  const executeQuote = useCallback(async () => {
    setExecuteStatus({ msg: "", err: false });
    if (!aaAddress || !quoteData?.steps?.length || !amountWei) {
      setExecuteStatus({ msg: "数据状态错误", err: true });
      return;
    }

    setExecuteLoading(true);
    setSubmittedTxHashes([]);

    try {
      const need = BigInt(amountWei);

      if (!kernelClient) {
        throw new Error("智能钱包客户端未完成初始化，请稍后");
      }

      // 本地转账流程
      const isTargetChain = Number(destinationChainId) === CHAIN_ID;
      const destTokenLower = destinationCurrency.toLowerCase();
      const isUSDC =
        destTokenLower === "usdc" ||
        destTokenLower === USDC_ADDRESS.toLowerCase();

      if (isTargetChain && isUSDC) {
        const transferData = encodeFunctionData({
          abi: ERC20_ABI,
          functionName: "transfer",
          args: [recipient.trim() as `0x${string}`, need],
        });

        const userOpHash = await kernelClient.sendUserOperation({
          calls: [
            {
              to: USDC_ADDRESS as `0x${string}`,
              data: transferData,
              value: BigInt(0),
            },
          ],
        });

        const receipt = await kernelClient.waitForUserOperationReceipt({
          hash: userOpHash,
        });
        const txHash = receipt.receipt.transactionHash;

        setSubmittedTxHashes([txHash]);
        setIsSuccess(true);
        setExecuteStatus({ msg: "提现成功！", err: false });
        toast.success("提现成功！");
        return;
      }

      // 跨链中继 Relay 流程
      const steps = quoteData.steps as QuoteStep[];
      const allCalls: { to: `0x${string}`; data: `0x${string}`; value: bigint }[] =
        [];
      let checkPath: string | undefined;

      for (const step of steps) {
        const items = step.items ?? [];
        for (const item of items) {
          const raw = item.data;
          if (!raw || typeof raw !== "object") continue;

          allCalls.push({
            to: raw.to as `0x${string}`,
            data: raw.data as `0x${string}`,
            value: raw.value ? BigInt(raw.value) : BigInt(0),
          });

          if (item.check?.endpoint) {
            checkPath = item.check.endpoint;
          }
        }
      }

      if (allCalls.length === 0) {
        throw new Error("未能解析出可执行的交易数据");
      }

      // 统一通过 Kernel Client 打包执行 UserOperation
      const userOpHash = await kernelClient.sendUserOperation({
        calls: allCalls,
      });

      const receipt = await kernelClient.waitForUserOperationReceipt({
        hash: userOpHash,
      });
      const txHash = receipt.receipt.transactionHash;

      setSubmittedTxHashes([txHash]);

      // 轮询中继器至终态
      if (checkPath) {
        await vaultService.pollIntentUntilDone(String(checkPath), "");
      }

      setIsSuccess(true);
      setExecuteStatus({ msg: "跨链提现已成功提交！", err: false });
      toast.success("跨链提现请求已提交并成功处理！");
    } catch (e: any) {
      console.error("[useVaultWithdraw] Execution error:", e);
      const errMsg = e?.message || "提现交易执行失败";
      toast.error(errMsg);
      setExecuteStatus({ msg: errMsg, err: true });
    } finally {
      setExecuteLoading(false);
    }
  }, [
    aaAddress,
    quoteData,
    amountWei,
    kernelClient,
    destinationChainId,
    destinationCurrency,
    recipient,
  ]);

  return {
    chainsError,
    vaultBalanceRaw,
    originChainObj,
    originToken,
    withdrawAsset,
    destinationChains,
    destChainObj,
    destinationChainId,
    setDestinationChainId,
    destTokens,
    destinationCurrency,
    setDestinationCurrency,
    recipient,
    setRecipient,
    recipientErr,
    amountInput,
    setAmountInput,
    amountWei,
    quoteStatus,
    quoteLoading,
    quoteData,
    canQuote,
    postQuote,
    backToQuoteForm,
    executeQuote,
    executeLoading,
    executeStatus,
    submittedTxHashes,
    isSuccess,
    setIsSuccess,
    embeddedAddress: aaAddress,
    isInsufficientBalance,
    minAmountErr,
  };
}
