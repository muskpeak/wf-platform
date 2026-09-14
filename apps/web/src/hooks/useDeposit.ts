"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import QRCode from "qrcode";
import { parseUnits } from "viem";
import { toast } from "@wf-platform/uikit";
import { useZeroDev } from "@wf-platform/web3-core";
import { vaultService } from "../services/vault/vault.service";
import type { QuoteData, VaultToken } from "../services/vault/vault.types";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const QUOTE_BASE_AMOUNT = "1"; // 询价用固定 1 USDC

export function useDeposit(open: boolean, onSuccess?: () => void) {
  const { aaAddress } = useZeroDev();

  const [originChainId, setOriginChainId] = useState("");
  const [originCurrency, setOriginCurrency] = useState("");
  const [depositAddress, setDepositAddress] = useState("—");
  const [requestId, setRequestId] = useState("—");
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [ackRisk, setAckRisk] = useState(false);
  const [quoteStatus, setQuoteStatus] = useState({ msg: "", err: false });

  // ─── 1. 获取充值配置（链/币种列表）──────────────────────────
  const {
    data: chains = [],
    error: chainsErr,
  } = useQuery({
    queryKey: ["vault", "deposit", "config"],
    queryFn: () => vaultService.getDepositConfig(),
    staleTime: 60_000,
    enabled: open,
  });

  useEffect(() => {
    if (chainsErr) toast.error("获取充值配置失败，请稍后重试");
  }, [chainsErr]);

  // ─── 2. 选择来源链时自动选默认币种 ──────────────────────────
  const updateOriginChain = useCallback(
    (chainId: string) => {
      setOriginChainId(chainId);
      const ch = chains.find((c) => String(c.id) === chainId);
      if (ch) {
        const tokens = vaultService.getOriginTokens(ch);
        const defaultTok = tokens.find((t) => t.recommended) || tokens[0];
        setOriginCurrency(defaultTok?.address || ZERO_ADDRESS);
      }
    },
    [chains]
  );

  // ─── 3. 询价 Mutation ─────────────────────────────────────
  const quoteMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      vaultService.getQuote(body),
    onSuccess: (data) => {
      setQuoteData(data);
      const { depositAddress: dep, requestId: rid } =
        vaultService.extractDepositFromQuote(data);
      setDepositAddress(dep || "（请查看响应 steps）");
      setRequestId(rid || "—");
      setQuoteStatus({
        msg: dep ? "充值地址已生成，请向此地址转账" : "未获取到充值地址",
        err: !dep,
      });
    },
    onError: () => {
      setQuoteStatus({ msg: "询价失败，请重试", err: true });
      setDepositAddress("—");
      setRequestId("—");
      setQuoteData(null);
    },
  });

  const quoteLoading = quoteMutation.isPending;

  // ─── 4. 计算询价所需 Wei ──────────────────────────────────
  const selectedOriginTok = useMemo<VaultToken | undefined>(() => {
    const ch = chains.find((c) => String(c.id) === originChainId);
    return vaultService
      .getOriginTokens(ch)
      .find((t) => (t.address || "").toLowerCase() === originCurrency.toLowerCase());
  }, [chains, originChainId, originCurrency]);

  const quoteAmountWei = useMemo(() => {
    const isNative =
      !originCurrency ||
      originCurrency.toLowerCase() === ZERO_ADDRESS.toLowerCase();
    const decimals = selectedOriginTok?.decimals ?? (isNative ? 18 : 6);
    try {
      return parseUnits(QUOTE_BASE_AMOUNT, decimals).toString();
    } catch {
      return isNative ? "1000000000000000000" : "1000000";
    }
  }, [selectedOriginTok, originCurrency]);

  // ─── 5. 自动初始化：弹窗打开后选第一条链 ─────────────────
  useEffect(() => {
    if (open && chains.length > 0 && !originChainId) {
      updateOriginChain(String(chains[0].id));
    }
  }, [open, chains, originChainId, updateOriginChain]);

  // ─── 6. 弹窗关闭时重置状态 ───────────────────────────────
  useEffect(() => {
    if (!open) {
      setOriginChainId("");
      setOriginCurrency("");
      setDepositAddress("—");
      setRequestId("—");
      setQrDataUrl("");
      setQuoteData(null);
      setQuoteStatus({ msg: "", err: false });
      setAckRisk(false);
    }
  }, [open]);

  // ─── 7. 生成二维码 ───────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const addr = depositAddress.trim();
    if (!addr || addr === "—" || addr.startsWith("（")) {
      setQrDataUrl("");
      return;
    }
    QRCode.toDataURL(addr, {
      width: 240,
      margin: 2,
      color: { dark: "#0c0f14ff", light: "#ffffffff" },
    })
      .then((url) => { if (!cancelled) setQrDataUrl(url); })
      .catch(() => { if (!cancelled) setQrDataUrl(""); });
    return () => { cancelled = true; };
  }, [depositAddress]);

  // ─── 8. 轮询充值到账状态 (10s 间隔) ─────────────────────
  useEffect(() => {
    const dep = depositAddress.trim();
    if (!dep || dep === "—" || dep.startsWith("（") || !aaAddress || !open) return;

    let cancelled = false;
    const check = async () => {
      if (cancelled) return;
      try {
        const res = await vaultService.getDepositStatus(dep, aaAddress);
        if (!res || res.status === "pending") return;
        clearInterval(id);
        if (res.status === "success") {
          toast.success("充值成功！");
          onSuccess?.();
        } else {
          toast.error("充值失败或已退回，请联系客服");
        }
      } catch {
        // 网络波动，继续轮询
      }
    };
    const id = setInterval(check, 10_000);
    return () => { cancelled = true; clearInterval(id); };
  }, [depositAddress, aaAddress, open, onSuccess]);

  // ─── 9. 提交询价 ─────────────────────────────────────────
  const postQuote = useCallback(() => {
    setQuoteStatus({ msg: "", err: false });
    if (!aaAddress) {
      setQuoteStatus({ msg: "请先连接钱包", err: true });
      return;
    }
    if (!originChainId || !originCurrency) {
      setQuoteStatus({ msg: "请选择来源链和代币", err: true });
      return;
    }
    if (!ackRisk) {
      setQuoteStatus({ msg: "请先勾选风险确认", err: true });
      return;
    }
    quoteMutation.mutate({
      user: aaAddress,
      originChainId: Number(originChainId),
      originCurrency,
      destinationChainId: 137, // Polygon
      destinationCurrency: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", // USDC
      tradeType: "EXACT_INPUT",
      recipient: aaAddress,
      amount: quoteAmountWei,
      usePermit: false,
      useExternalLiquidity: true,
      useDepositAddress: true,
      refundTo: selectedOriginTok?.refundTo || aaAddress,
    });
  }, [aaAddress, originChainId, originCurrency, ackRisk, quoteAmountWei, selectedOriginTok, quoteMutation]);

  // ─── 10. 复制充值地址 ────────────────────────────────────
  const copyAddress = useCallback(async () => {
    const addr = depositAddress.trim();
    if (!addr || addr === "—") return;
    try {
      await navigator.clipboard.writeText(addr);
      toast.success("地址已复制");
    } catch {
      toast.error("复制失败，请手动复制");
    }
  }, [depositAddress]);

  const clearQuote = useCallback(() => {
    setQuoteData(null);
    setDepositAddress("—");
    setRequestId("—");
    setQrDataUrl("");
    setQuoteStatus({ msg: "", err: false });
    setAckRisk(false);
  }, []);

  const originChainsList = useMemo(() => chains, [chains]);

  return {
    chains,
    originChainsList,
    originChainId,
    originCurrency,
    setOriginCurrency,
    updateOriginChain,
    selectedOriginTok,
    quoteLoading,
    quoteStatus,
    quoteData,
    depositAddress,
    requestId,
    qrDataUrl,
    ackRisk,
    setAckRisk,
    postQuote,
    copyAddress,
    clearQuote,
    canQuote: ackRisk && !quoteLoading,
  };
}
