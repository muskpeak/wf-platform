"use client";

import React from "react";
import { useDeposit } from "../../../hooks/useDeposit";

interface DepositModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function DepositModal({ open, onClose, onSuccess }: DepositModalProps) {
  const {
    chains,
    originChainId,
    originCurrency,
    updateOriginChain,
    setOriginCurrency,
    selectedOriginTok,
    quoteLoading,
    quoteStatus,
    quoteData,
    depositAddress,
    qrDataUrl,
    ackRisk,
    setAckRisk,
    postQuote,
    copyAddress,
    clearQuote,
    canQuote,
  } = useDeposit(open, onSuccess);

  if (!open) return null;

  const hasResult = !!quoteData && depositAddress !== "—";

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.sheet} onClick={(e) => e.stopPropagation()}>
        {/* 顶部标题 */}
        <div style={styles.header}>
          {hasResult && (
            <button style={styles.backBtn} onClick={clearQuote}>
              ← 返回
            </button>
          )}
          <span style={styles.title}>充值 Deposit</span>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {!hasResult ? (
          /* ─── 表单视图 ─── */
          <div style={styles.body}>
            <p style={styles.label}>来源链</p>
            <select
              style={styles.select}
              value={originChainId}
              onChange={(e) => updateOriginChain(e.target.value)}
            >
              <option value="">请选择来源链</option>
              {chains.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.displayName || c.name || c.id}
                </option>
              ))}
            </select>

            <p style={styles.label}>代币</p>
            <select
              style={styles.select}
              value={originCurrency}
              onChange={(e) => setOriginCurrency(e.target.value)}
              disabled={!originChainId}
            >
              <option value="">请选择代币</option>
              {(
                chains.find((c) => String(c.id) === originChainId)
                  ?.featuredTokens || []
              ).map((t) => (
                <option key={t.address} value={t.address || ""}>
                  {t.symbol}
                </option>
              ))}
            </select>

            {/* 风险提示 */}
            <div style={styles.riskBox}>
              <p style={styles.riskText}>
                ⚠️ 请务必向生成的充值地址转入正确的代币和链，否则资产可能丢失。最小充值额：
                {selectedOriginTok?.minAmount
                  ? ` ${selectedOriginTok.minAmount} ${selectedOriginTok.symbol}`
                  : " 请参考页面提示"}
              </p>
              <label style={styles.riskLabel}>
                <input
                  type="checkbox"
                  checked={ackRisk}
                  onChange={(e) => setAckRisk(e.target.checked)}
                  style={{ marginRight: 8 }}
                />
                我已了解风险，确认继续
              </label>
            </div>

            {quoteStatus.err && (
              <p style={styles.errText}>{quoteStatus.msg}</p>
            )}

            <button
              style={{
                ...styles.primaryBtn,
                opacity: canQuote ? 1 : 0.5,
                cursor: canQuote ? "pointer" : "not-allowed",
              }}
              disabled={!canQuote}
              onClick={postQuote}
            >
              {quoteLoading ? "生成中..." : "获取充值地址"}
            </button>
          </div>
        ) : (
          /* ─── 结果视图：二维码 + 地址 ─── */
          <div style={styles.body}>
            <p style={styles.resultHint}>
              请向以下地址转入{" "}
              <strong>{selectedOriginTok?.symbol || "代币"}</strong>（
              {chains.find((c) => String(c.id) === originChainId)?.displayName}
              ）
            </p>

            {qrDataUrl && (
              <div style={styles.qrWrap}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrDataUrl} alt="充值地址二维码" style={styles.qr} />
              </div>
            )}

            <div style={styles.addrBox}>
              <span style={styles.addrText}>{depositAddress}</span>
            </div>

            <button style={styles.copyBtn} onClick={copyAddress}>
              📋 复制地址
            </button>

            <div style={styles.riskBox}>
              <p style={styles.riskText}>
                ⚠️ 充值到账后将自动通知。若长时间未到账，请联系客服并提供交易哈希。
              </p>
            </div>

            {quoteStatus.msg && !quoteStatus.err && (
              <p style={styles.successText}>{quoteStatus.msg}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 内联样式 ─────────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    zIndex: 1000,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
  },
  sheet: {
    background: "#fff",
    borderRadius: "20px 20px 0 0",
    width: "100%",
    maxWidth: 480,
    maxHeight: "90vh",
    overflowY: "auto",
    padding: "0 0 32px",
    boxShadow: "0 -4px 32px rgba(0,0,0,0.12)",
    animation: "slideUp 0.25s ease",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px 20px 12px",
    borderBottom: "1px solid #f0f0f0",
  },
  title: {
    fontSize: 17,
    fontWeight: 700,
    color: "#1a1a1a",
    flex: 1,
    textAlign: "center",
  },
  backBtn: {
    background: "none",
    border: "none",
    fontSize: 14,
    color: "#666",
    cursor: "pointer",
    padding: 0,
    minWidth: 48,
  },
  closeBtn: {
    background: "none",
    border: "none",
    fontSize: 18,
    color: "#999",
    cursor: "pointer",
    minWidth: 32,
    textAlign: "right",
  },
  body: {
    padding: "20px 20px 0",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  label: {
    fontSize: 13,
    color: "#666",
    margin: 0,
    fontWeight: 600,
  },
  select: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1.5px solid #e8e8e8",
    fontSize: 15,
    background: "#fafafa",
    outline: "none",
    color: "#222",
  },
  riskBox: {
    background: "#fff8ed",
    border: "1px solid #ffe5b0",
    borderRadius: 12,
    padding: "12px 14px",
  },
  riskText: {
    fontSize: 12,
    color: "#a07000",
    margin: "0 0 8px",
    lineHeight: 1.5,
  },
  riskLabel: {
    fontSize: 13,
    color: "#555",
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
  },
  errText: {
    fontSize: 13,
    color: "#e53e3e",
    margin: 0,
  },
  successText: {
    fontSize: 13,
    color: "#38a169",
    margin: 0,
  },
  primaryBtn: {
    width: "100%",
    padding: "14px",
    borderRadius: 14,
    border: "none",
    background: "linear-gradient(135deg,#6c63ff,#a855f7)",
    color: "#fff",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    transition: "transform 0.15s",
  },
  resultHint: {
    fontSize: 14,
    color: "#444",
    margin: 0,
    textAlign: "center",
  },
  qrWrap: {
    display: "flex",
    justifyContent: "center",
    padding: "8px 0",
  },
  qr: {
    width: 200,
    height: 200,
    borderRadius: 12,
    border: "2px solid #e8e8e8",
  },
  addrBox: {
    background: "#f5f5f5",
    borderRadius: 12,
    padding: "12px 14px",
    wordBreak: "break-all",
  },
  addrText: {
    fontSize: 13,
    color: "#222",
    fontFamily: "monospace",
  },
  copyBtn: {
    width: "100%",
    padding: "13px",
    borderRadius: 12,
    border: "1.5px solid #6c63ff",
    background: "#fff",
    color: "#6c63ff",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
  },
};
