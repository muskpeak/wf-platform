"use client";

import React from "react";
import { useWithdraw } from "../../../hooks/useWithdraw";

interface WithdrawModalProps {
  open: boolean;
  onClose: () => void;
}

export function WithdrawModal({ open, onClose }: WithdrawModalProps) {
  const {
    chains,
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
  } = useWithdraw(open);

  if (!open) return null;

  const hasQuote = !!quoteData;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.sheet} onClick={(e) => e.stopPropagation()}>
        {/* 顶部标题 */}
        <div style={styles.header}>
          {hasQuote && !isSuccess && (
            <button style={styles.backBtn} onClick={backToForm}>
              ← 返回
            </button>
          )}
          <span style={styles.title}>提现 Withdraw</span>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {isSuccess ? (
          /* ─── 成功视图 ─── */
          <div style={{ ...styles.body, alignItems: "center", gap: 20 }}>
            <div style={styles.successIcon}>✅</div>
            <p style={styles.successTitle}>提现成功！</p>
            {submittedTxHash && (
              <div style={styles.hashBox}>
                <p style={styles.hashLabel}>交易哈希</p>
                <p style={styles.hashText}>{submittedTxHash}</p>
              </div>
            )}
            <button style={styles.primaryBtn} onClick={() => { backToForm(); onClose(); }}>
              完成
            </button>
          </div>
        ) : !hasQuote ? (
          /* ─── 表单视图 ─── */
          <div style={styles.body}>
            <p style={styles.label}>目标链</p>
            <select
              style={styles.select}
              value={destinationChainId}
              onChange={(e) => {
                setDestinationChainId(e.target.value);
                setDestinationCurrency("");
              }}
            >
              <option value="">请选择目标链</option>
              {chains.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.displayName || c.name || c.id}
                </option>
              ))}
            </select>

            <p style={styles.label}>目标代币</p>
            <select
              style={styles.select}
              value={destinationCurrency}
              onChange={(e) => setDestinationCurrency(e.target.value)}
              disabled={!destinationChainId}
            >
              <option value="">请选择代币</option>
              {destTokens.map((t) => (
                <option key={t.address} value={t.address || ""}>
                  {t.symbol}
                  {t.minAmount ? ` (最小 ${t.minAmount})` : ""}
                </option>
              ))}
            </select>

            <p style={styles.label}>提现金额（USDC）</p>
            <input
              style={styles.input}
              type="number"
              placeholder="请输入金额"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              min="0"
            />
            {minAmountErr && <p style={styles.errText}>{minAmountErr}</p>}

            <p style={styles.label}>目标地址</p>
            <input
              style={styles.input}
              type="text"
              placeholder="请输入收款地址"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
            {recipientErr && <p style={styles.errText}>{recipientErr}</p>}

            {quoteLoading && (
              <p style={styles.hintText}>⏳ 询价中，请稍候...</p>
            )}
            {quoteStatus.err && (
              <p style={styles.errText}>{quoteStatus.msg}</p>
            )}
            {quoteStatus.msg && !quoteStatus.err && !quoteLoading && (
              <p style={styles.successText}>{quoteStatus.msg}</p>
            )}

            <button
              style={{
                ...styles.primaryBtn,
                opacity: canQuote && hasQuote ? 1 : 0.5,
                cursor: canQuote && hasQuote ? "pointer" : "not-allowed",
              }}
              disabled={!canQuote || !hasQuote}
              onClick={executeWithdraw}
            >
              {executeLoading ? "提交中..." : "确认提现"}
            </button>

            <div style={styles.riskBox}>
              <p style={styles.riskText}>
                ⚠️ 提现到账时间因链而异，跨链通常需要 5-15 分钟。请确认地址无误后再提交。
              </p>
            </div>
          </div>
        ) : (
          /* ─── 确认视图 ─── */
          <div style={styles.body}>
            <div style={styles.confirmCard}>
              <Row label="提现金额" value={`${amountInput} USDC`} />
              <Row
                label="目标链"
                value={
                  chains.find((c) => String(c.id) === destinationChainId)
                    ?.displayName || destinationChainId
                }
              />
              <Row label="收款地址" value={recipient} mono />
              {quoteStatus.msg && (
                <Row label="状态" value={quoteStatus.msg} />
              )}
            </div>

            <button
              style={{
                ...styles.primaryBtn,
                opacity: !executeLoading ? 1 : 0.6,
                cursor: !executeLoading ? "pointer" : "not-allowed",
              }}
              disabled={executeLoading}
              onClick={executeWithdraw}
            >
              {executeLoading ? "提交中..." : "确认提现"}
            </button>

            <div style={styles.riskBox}>
              <p style={styles.riskText}>
                ⚠️ 提交后无法撤回，请确认所有信息无误。
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 确认卡片行
function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
      <span style={{ fontSize: 13, color: "#888" }}>{label}</span>
      <span
        style={{
          fontSize: 13,
          color: "#222",
          fontFamily: mono ? "monospace" : undefined,
          maxWidth: "60%",
          textAlign: "right",
          wordBreak: "break-all",
        }}
      >
        {value}
      </span>
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
  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1.5px solid #e8e8e8",
    fontSize: 15,
    background: "#fafafa",
    outline: "none",
    color: "#222",
    boxSizing: "border-box",
  },
  errText: { fontSize: 13, color: "#e53e3e", margin: 0 },
  successText: { fontSize: 13, color: "#38a169", margin: 0 },
  hintText: { fontSize: 13, color: "#888", margin: 0 },
  riskBox: {
    background: "#fff8ed",
    border: "1px solid #ffe5b0",
    borderRadius: 12,
    padding: "12px 14px",
  },
  riskText: {
    fontSize: 12,
    color: "#a07000",
    margin: 0,
    lineHeight: 1.5,
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
  confirmCard: {
    background: "#f8f8f8",
    borderRadius: 14,
    padding: "4px 16px",
  },
  successIcon: {
    fontSize: 56,
    marginTop: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: "#1a1a1a",
    margin: 0,
  },
  hashBox: {
    background: "#f5f5f5",
    borderRadius: 12,
    padding: "12px 14px",
    width: "100%",
    wordBreak: "break-all",
  },
  hashLabel: {
    fontSize: 11,
    color: "#999",
    margin: "0 0 4px",
  },
  hashText: {
    fontSize: 12,
    color: "#333",
    fontFamily: "monospace",
    margin: 0,
  },
};
