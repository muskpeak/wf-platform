"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import QRCode from "qrcode";
import { parseUnits } from "viem";
import { useZeroDev } from "@wf-platform/web3-core";
import { toast } from "@wf-platform/uikit";
import {
  filterOriginChains,
  findChainById,
  getDestinationTokens,
  getOriginTokens,
  listNonZeroFees,
  tokenKey,
} from "../utils/vault.utils";
import {
  CHAIN_ID,
  QUOTE_BASE_AMOUNT_READABLE,
  USDC_ADDRESS,
  ZERO_ADDRESS,
} from "../config/vault.config";
import { vaultService } from "../services/vault.service";
import type { QuoteData } from "../services/vault.types";

export function useVaultDeposit(open: boolean, onSuccess?: () => void) {
  const { aaAddress } = useZeroDev();

  const [originChainId, setOriginChainId] = useState("");
  const [originCurrency, setOriginCurrency] = useState("");
  // 目标链固定为 Polygon (137)，目标代币为 USDC
  const destinationChainId = String(CHAIN_ID);
  const destinationCurrency = USDC_ADDRESS;

  // --- TanStack Query: 获取充值网络配置列表（来源于后端） ---
  const { data: chains = [], refetch: loadChains, error: chainsErr } = useQuery({
    queryKey: ["vault", "deposit", "config"],
    queryFn: () => vaultService.getDepositConfig(),
    staleTime: 60000,
    enabled: open,
  });

  const [quoteStatus, setQuoteStatus] = useState({ msg: "", err: false });
  const [depositAddress, setDepositAddress] = useState("—");
  const [requestId, setRequestId] = useState("—");
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [ackRisk, setAckRisk] = useState(false);
  const [priceImpactOpen, setPriceImpactOpen] = useState(false);

  const updateOriginChain = useCallback((v: string) => {
    setOriginChainId(v);
    setQuoteData(null);
    setDepositAddress("—");
    setRequestId("—");
    setQrDataUrl("");
    setQuoteStatus({ msg: "", err: false });
    const ch = chains.find((c) => String(c.id) === v);
    if (ch) {
      const tokens = getOriginTokens(ch);
      // 尝试主动匹配 USDC（如果是 Polygon，优先匹配配置的 USDC_ADDRESS；其他链匹配 symbol 为 USDC 的代币）
      const usdcToken =
        (Number(v) === CHAIN_ID
          ? tokens.find((t) => tokenKey(t.address) === tokenKey(USDC_ADDRESS))
          : null) ||
        tokens.find((t) => t.symbol?.toUpperCase() === "USDC");

      // 找到了就主动选中；找不到就不选中，留空让用户在列表中自己选择，不进行人工补充兜底
      if (usdcToken) {
        setOriginCurrency(usdcToken.address || ZERO_ADDRESS);
      } else {
        setOriginCurrency("");
      }
    } else {
      setOriginCurrency("");
    }
  }, [chains]);

  useEffect(() => {
    if (chainsErr) {
      toast.error(String(chainsErr));
    }
  }, [chainsErr]);

  const chainsError = chainsErr ? String(chainsErr) : "";

  // --- TanStack Query: 发起询价 ---
  const quoteMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => {
      console.log("%c[Vault充值调试] 正在向 Relay 发起 POST /quote 跨链询价:", "color: #e6a23c; font-weight: bold;", body);
      return vaultService.getQuote(body);
    },
    onSuccess: (data) => {
      console.log("%c[Vault充值调试] Relay 询价成功返回:", "color: #00a63e; font-weight: bold;", data);
      setQuoteData(data);
      const { depositAddress: dep, requestId: rid } =
        vaultService.extractDepositFromQuote(data);
      setDepositAddress(dep || "(请查看响应步骤)");
      setRequestId(rid || "—");

      setQuoteStatus({
        msg: dep ? "充值地址生成成功" : "暂无可用的交易步骤",
        err: !dep,
      });
    },
    onError: (e: unknown) => {
      const errMsg = (e as { message?: string })?.message || "询价失败，请稍后再试";
      console.error("[Vault充值调试] ❌ Relay 询价失败:", errMsg, e);
      toast.error(errMsg);
      setQuoteStatus({ msg: errMsg, err: true });
      setDepositAddress("—");
      setRequestId("—");
      setQuoteData(null);
    },
  });

  const quoteLoading = quoteMutation.isPending;
  const recipient = aaAddress ?? "";

  const originChainsList = useMemo(
    () => filterOriginChains(chains),
    [chains]
  );
  const originChainObj = useMemo(
    () => findChainById(chains, originChainId),
    [chains, originChainId]
  );
  const destChainObj = useMemo(
    () => findChainById(chains, destinationChainId),
    [chains, destinationChainId]
  );

  const originTokens = useMemo(() => {
    if (!originChainId) return [];
    return getOriginTokens(originChainObj);
  }, [originChainObj, originChainId]);

  const destTokens = useMemo(
    () => getDestinationTokens(destChainObj),
    [destChainObj]
  );

  const selectedOriginTok = useMemo(
    () =>
      originTokens.find(
        (t) => tokenKey(t.address ?? "") === tokenKey(originCurrency)
      ),
    [originTokens, originCurrency]
  );

  const quoteAmountWei = useMemo(() => {
    const isNativeEth =
      !originCurrency ||
      tokenKey(originCurrency) ===
        tokenKey("0x0000000000000000000000000000000000000000");
    const decimals = selectedOriginTok?.decimals ?? (isNativeEth ? 18 : 6);
    try {
      return parseUnits(QUOTE_BASE_AMOUNT_READABLE, decimals).toString();
    } catch {
      return isNativeEth ? "1000000000000000000" : "1000000";
    }
  }, [selectedOriginTok, originCurrency]);

  // --- 充值状态轮询 ---
  useEffect(() => {
    const dep = depositAddress.trim();
    if (!dep || dep === "—" || dep.startsWith("(") || !aaAddress || !open) return;

    let isCancelled = false;
    const checkStatus = async () => {
      if (isCancelled) return;
      try {
        const res = await vaultService.getDepositStatus(dep, aaAddress);
        if (!res || res.status === "pending") return;

        clearInterval(intervalId);
        if (res.status === "success") {
          toast.success("充值成功入账！");
          onSuccess?.();
        } else if (res.status === "failure") {
          toast.error("充值失败或已被退回，请联系客服处理");
        }
      } catch {
        // 忽略网络波动
      }
    };

    const intervalId = setInterval(checkStatus, 8000);
    return () => {
      isCancelled = true;
      clearInterval(intervalId);
    };
  }, [depositAddress, aaAddress, open, onSuccess]);

  // 自动设置默认链为 Polygon (137)（仅在尚未选择任何网络时初始化）
  useEffect(() => {
    if (originChainsList.length > 0 && !originChainId) {
      const polygonChain =
        originChainsList.find((c) => Number(c.id) === CHAIN_ID) ||
        originChainsList[0];
      if (polygonChain) {
        updateOriginChain(String(polygonChain.id));
      }
    }
  }, [originChainsList, originChainId, updateOriginChain]);

  // 判断是否为同链同币种（Polygon 原生 USDC，免跨链直接充值）
  const isSameChain = useMemo(() => {
    if (!originChainId || !originCurrency) return false;
    const isTargetChain = Number(originChainId) === CHAIN_ID;
    const originTokenLower = originCurrency.toLowerCase();
    const tokenSymbol = selectedOriginTok?.symbol?.toUpperCase();
    const isUSDC =
      tokenSymbol === "USDC" ||
      originTokenLower === "usdc" ||
      originTokenLower === USDC_ADDRESS.toLowerCase();
    return isTargetChain && isUSDC;
  }, [originChainId, originCurrency, selectedOriginTok]);

  useEffect(() => {
    if (!open) return;
    console.log("%c[Vault充值调试] 当前选择的充值网络与代币状态:", "color: #0088ff; font-weight: bold;", {
      来源网络ID_originChainId: originChainId,
      来源代币合约_originCurrency: originCurrency,
      代币Symbol: selectedOriginTok?.symbol,
      是否命中同网络免跨链_isSameChain: isSameChain,
      AA钱包账户_aaAddress: aaAddress,
    });
  }, [open, originChainId, originCurrency, selectedOriginTok, isSameChain, aaAddress]);

  const initialize = useCallback(() => {
    setQuoteData(null);
    setDepositAddress("—");
    setRequestId("—");
    setQrDataUrl("");
    setQuoteStatus({ msg: "", err: false });
    setAckRisk(false);
    setPriceImpactOpen(false);

    if (originChainsList.length > 0) {
      const polygonChain =
        originChainsList.find((c) => Number(c.id) === CHAIN_ID) ||
        originChainsList[0];
      if (polygonChain) {
        updateOriginChain(String(polygonChain.id));
      }
    }
  }, [originChainsList, updateOriginChain]);

  const addrForQr = useMemo(() => {
    const t_val = depositAddress.trim();
    if (!t_val || t_val === "—" || t_val.startsWith("(")) return;
    return t_val;
  }, [depositAddress]);

  useEffect(() => {
    let cancelled = false;
    const generateQr = async () => {
      if (!addrForQr) {
        setQrDataUrl("");
        return;
      }
      try {
        const url = await QRCode.toDataURL(addrForQr, {
          width: 240,
          margin: 2,
          color: { dark: "#0c0f14ff", light: "#ffffffff" },
        });
        if (!cancelled) setQrDataUrl(url);
      } catch (error) {
        console.error("[QR] Generation failed:", error);
        if (!cancelled) setQrDataUrl("");
      }
    };
    generateQr();
    return () => {
      cancelled = true;
    };
  }, [addrForQr]);

  const feeRows = useMemo(
    () =>
      listNonZeroFees(
        quoteData?.fees as Parameters<typeof listNonZeroFees>[0]
      ),
    [quoteData?.fees]
  );

  const postQuote = useCallback(async () => {
    console.group("%c[Vault充值调试] 点击【获取充值地址】(postQuote) 启动", "color: #0088ff; font-weight: bold; font-size: 13px;");
    setQuoteStatus({ msg: "", err: false });
    const recipientTrim = recipient.trim();
    if (!recipientTrim) {
      console.warn("[Vault充值调试] ❌ 未检测到智能钱包账户 recipient");
      setQuoteStatus({ msg: "未检测到智能钱包账户", err: true });
      console.groupEnd();
      return;
    }
    if (
      !originChainId ||
      !originCurrency.trim() ||
      !destinationChainId ||
      !destinationCurrency.trim()
    ) {
      console.warn("[Vault充值调试] ❌ 缺少网络或代币参数:", {
        originChainId,
        originCurrency,
        destinationChainId,
        destinationCurrency,
      });
      setQuoteStatus({ msg: "请先选择来源网络和充值代币", err: true });
      console.groupEnd();
      return;
    }

    // 本地 Polygon 原生 USDC 免跨链直充判定（严格匹配原生 USDC，不放宽 USDC.e）
    const isTargetChain = Number(originChainId) === CHAIN_ID;
    const originTokenLower = originCurrency.toLowerCase();
    const tokenSymbol = selectedOriginTok?.symbol?.toUpperCase();
    const isUSDC =
      tokenSymbol === "USDC" ||
      originTokenLower === "usdc" ||
      originTokenLower === USDC_ADDRESS.toLowerCase();

    console.log("[Vault充值调试] 充值参数分析:", {
      来源网络ID: originChainId,
      目标网络ID: destinationChainId,
      系统主链ID_CHAIN_ID: CHAIN_ID,
      是否为目标链_isTargetChain: isTargetChain,
      来源代币合约_originCurrency: originCurrency,
      选中的代币Symbol: selectedOriginTok?.symbol,
      代币名称: (selectedOriginTok as { name?: string })?.name ?? selectedOriginTok?.symbol,
      配置USDC_ADDRESS: USDC_ADDRESS,
      判定是否为USDC: isUSDC,
      最终判定是否免跨链_isSameChain: isTargetChain && isUSDC,
      用户AA钱包地址_aaAddress: aaAddress,
    });

    if (isTargetChain && isUSDC) {
      console.log(
        "%c[Vault充值调试] ✅ 成功判定为【Polygon 同网络同币种直接充值】！",
        "color: #00a63e; font-weight: bold; font-size: 14px;",
        "\n⚡ 跳过 Relay 跨链协议询价，直接使用 AA 资金账户充值地址:",
        aaAddress
      );
      setDepositAddress(aaAddress || "—");
      setQuoteStatus({ msg: "", err: false });
      setQuoteData({
        steps: [],
        fees: {},
        details: {
          currencyIn: {
            amount: quoteAmountWei,
          },
        },
      } as unknown as QuoteData);
      console.groupEnd();
      return;
    }

    console.log(
      "%c[Vault充值调试] ⚠️ 未命中同链免跨链直充（需跨链或不同币种兑换），准备向 Relay 发起跨链询价...",
      "color: #e6a23c; font-weight: bold;"
    );

    if (!quoteAmountWei) {
      console.warn("[Vault充值调试] ❌ 金额无效 quoteAmountWei 为空");
      setQuoteStatus({ msg: "金额无效", err: true });
      console.groupEnd();
      return;
    }

    if (!ackRisk) {
      console.warn("[Vault充值调试] ❌ 用户未勾选确认充值风险提示");
      setQuoteStatus({ msg: "请先勾选确认充值风险提示", err: true });
      console.groupEnd();
      return;
    }

    const body: Record<string, unknown> = {
      user: aaAddress || ZERO_ADDRESS,
      originChainId: Number(originChainId),
      originCurrency: originCurrency.trim(),
      destinationChainId: Number(destinationChainId),
      destinationCurrency: destinationCurrency.trim(),
      tradeType: "EXACT_INPUT",
      recipient: recipientTrim,
      amount: quoteAmountWei,
      usePermit: false,
      useExternalLiquidity: true,
      referrer: "",
      useDepositAddress: true,
      refundTo: selectedOriginTok?.refundTo || aaAddress,
    };

    console.log("[Vault充值调试] 发送 Relay 询价 Body:", body);
    console.groupEnd();

    quoteMutation.mutate(body);
  }, [
    recipient,
    originChainId,
    originCurrency,
    destinationChainId,
    destinationCurrency,
    quoteAmountWei,
    ackRisk,
    aaAddress,
    selectedOriginTok,
    quoteMutation,
  ]);

  const copyDeposit = useCallback(async () => {
    const t_val = depositAddress.trim();
    if (!t_val || t_val === "—" || t_val.startsWith("(")) return;
    try {
      await navigator.clipboard.writeText(t_val);
      toast.success("充值地址已复制到剪贴板");
      setQuoteStatus({ msg: "复制成功", err: false });
    } catch {
      setQuoteStatus({ msg: "复制失败，请手动复制", err: true });
    }
  }, [depositAddress]);

  const clearQuote = useCallback(() => {
    setQuoteData(null);
    setDepositAddress("—");
    setRequestId("—");
    setPriceImpactOpen(false);
    setQuoteStatus({ msg: "", err: false });
    setAckRisk(false);
  }, []);

  const canQuote = Boolean(originCurrency) && ackRisk && !quoteLoading;

  return {
    chains,
    chainsError,
    loadChains,
    originChainId,
    originCurrency,
    setOriginCurrency,
    destinationChainId,
    destinationCurrency,
    recipient,
    amount: QUOTE_BASE_AMOUNT_READABLE,
    quoteStatus,
    depositAddress,
    requestId,
    quoteData,
    qrDataUrl,
    quoteLoading,
    ackRisk,
    setAckRisk,
    priceImpactOpen,
    setPriceImpactOpen,
    originChainObj,
    destChainObj,
    originChainsList,
    originTokens,
    destTokens,
    selectedOriginTok,
    feeRows,
    details: quoteData?.details,
    postQuote,
    copyDeposit,
    clearQuote,
    canQuote,
    initialize,
    isSameChain,
    updateOriginChain,
  };
}
