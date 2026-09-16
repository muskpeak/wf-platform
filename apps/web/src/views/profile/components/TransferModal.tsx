import React, { useState } from "react";
import { createPortal } from "react-dom";
import { ArrowDownUp, Check, ChevronRight } from "lucide-react";
import { toast, ResponsiveModal, useMediaQuery } from "@wf-platform/uikit";

export interface ThirdPartyPlatform {
  id: "lotto" | "prediction";
  name: string;
  subtitle: string;
  badge?: string;
}

export interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemMusdcBalance?: string; // 系统内临时 mUSDC 余额
  wfBalance?: string;          // 资金账户 (真实 Polygon USDC)
  lotteryBalance?: string;     // 彩票账户 (WUSD 金库)
  onDeposit: (amount: number) => Promise<void>;
  onWithdraw: (amount: number) => Promise<void>;
  isDepositing?: boolean;
  isWithdrawing?: boolean;
}

export function TransferModal({
  isOpen,
  onClose,
  systemMusdcBalance = "0.00",
  wfBalance = "0.00",
  lotteryBalance = "0.00",
  onDeposit,
  onWithdraw,
  isDepositing = false,
  isWithdrawing = false,
}: TransferModalProps) {
  // 方向：TO_LOTTERY (资金账户 -> 业务游戏) 或 FROM_LOTTERY (业务游戏 -> 资金账户)
  const [direction, setDirection] = useState<"TO_LOTTERY" | "FROM_LOTTERY">("TO_LOTTERY");
  const [amount, setAmount] = useState("");

  // 三方业务平台选择状态 (彩票账户 / 预测平台)
  const [selectedPlatformId, setSelectedPlatformId] = useState<"lotto" | "prediction">("lotto");
  const [isPlatformPickerOpen, setIsPlatformPickerOpen] = useState(false);

  const isMobile = useMediaQuery("(max-width: 1200px)");

  // 业务平台列表 (预留并支持预测平台无缝切换)
  const PLATFORMS: ThirdPartyPlatform[] = [
    {
      id: "lotto",
      name: "彩票账户 (金库)",
      subtitle: "World Lotto / 3D Lotto 游戏金库",
      badge: "已接入",
    },
    {
      id: "prediction",
      name: "预测平台 (金库)",
      subtitle: "World Forecast 预测市场金库",
      badge: "接入中",
    },
  ];

  const currentPlatform = PLATFORMS.find((p) => p.id === selectedPlatformId) || PLATFORMS[0];
  const thirdPartyBalance = selectedPlatformId === "lotto" ? lotteryBalance : "0.00";

  // 决定 WF 资金账户应该显示的余额（当前如果选择了彩票，临时使用测试币 mUSDC，否则使用真实 USDC）
  const actualWfBalance = selectedPlatformId === "lotto" ? systemMusdcBalance : wfBalance;

  const isToLottery = direction === "TO_LOTTERY";
  const sourceBalance = isToLottery ? actualWfBalance : thirdPartyBalance;
  const targetBalance = isToLottery ? thirdPartyBalance : actualWfBalance;

  // 切换划转方向：上下两个选择框、对应余额全部联动对调
  const handleSwitchDirection = () => {
    setDirection((prev) => (prev === "TO_LOTTERY" ? "FROM_LOTTERY" : "TO_LOTTERY"));
    setAmount("");
  };

  const handleMax = () => {
    setAmount(sourceBalance);
  };

  const handleSubmit = async () => {
    if (selectedPlatformId === "prediction") {
      toast.info("预测平台金库正在最终联网部署中，敬请期待！");
      return;
    }

    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      toast.error("请输入有效的划转金额");
      return;
    }
    const max = parseFloat(sourceBalance);
    if (num > max) {
      toast.error(`输入金额超出可用余额 (可用: ${sourceBalance})`);
      return;
    }

    try {
      if (isToLottery) {
        await onDeposit(num);
      } else {
        await onWithdraw(num);
      }
      setAmount("");
      onClose();
    } catch {
      // 错误已由底层 hook 捕获提示
    }
  };

  const isLoading = isDepositing || isWithdrawing;

  // 账户卡片渲染辅助函数：
  // 核心原则：
  // 1. WF 资金账户固定作为基础资金池，无论是源还是目标，永远没有下拉、没有箭头，纯净大字！
  // 2. 三方业务账户支持 App 原生抽屉切换（彩票账户 / 预测平台），绝不使用丑陋的原生 select！
  const renderAccountBox = (label: string, isSource: boolean) => {
    const isWf = isSource ? isToLottery : !isToLottery;
    const currentBalance = isSource ? sourceBalance : targetBalance;

    return (
      <div
        style={{
          backgroundColor: "#FAFBFD",
          border: "1.5px solid #E5E8F0",
          borderRadius: "18px",
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span style={{ fontSize: "11px", color: "#6B7280", fontWeight: 500 }}>
            {label}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                fontSize: "15px",
                fontWeight: 700,
                color: "#1C1F23",
                letterSpacing: "-0.2px",
              }}
            >
              {isWf ? "WF 资金账户" : currentPlatform.name}
            </span>

            {/* 仅三方业务端展示精致 App 胶囊切换按钮；WF 资金账户永远无下拉 */}
            {!isWf && (
              <button
                type="button"
                onClick={() => setIsPlatformPickerOpen(true)}
                title="切换业务平台"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "2px",
                  backgroundColor: "#EEF4FF",
                  color: "#0066FF",
                  border: "none",
                  borderRadius: "12px",
                  padding: "2px 8px",
                  fontSize: "11px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                className="hover:bg-blue-100 active:scale-95"
              >
                <span>切换</span>
                <ChevronRight size={12} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: "11px", color: "#6B7280", display: "block" }}>
            余额
          </span>
          <span
            style={{
              fontFamily: "Inter, monospace",
              fontSize: "14px",
              fontWeight: 700,
              color: "#1C1F23",
            }}
          >
            {currentBalance}
          </span>
        </div>
      </div>
    );
  };

  // 平台选择器界面
  const renderPlatformPicker = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", minHeight: "360px" }}>
      {/* 返回按钮 */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
        <button
          type="button"
          onClick={() => setIsPlatformPickerOpen(false)}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            display: "flex",
            alignItems: "center",
            gap: "4px",
            color: "#6B7280",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 500,
          }}
          className="hover:text-gray-900 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 19L8 12L15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          返回划转
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {PLATFORMS.map((platform) => {
          const isSelected = platform.id === selectedPlatformId;
          return (
            <div
              key={platform.id}
              onClick={() => {
                setSelectedPlatformId(platform.id);
                setIsPlatformPickerOpen(false);
                setAmount("");
                toast.success(`已切换至：${platform.name}`);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px",
                borderRadius: "16px",
                border: isSelected ? "2px solid #0066FF" : "1.5px solid #E5E8F0",
                backgroundColor: isSelected ? "#F4F8FF" : "#ffffff",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              className="hover:border-blue-300 active:scale-98"
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "16px", fontWeight: 700, color: "#1C1F23" }}>
                    {platform.name}
                  </span>
                  {platform.badge && (
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 600,
                        padding: "2px 6px",
                        borderRadius: "6px",
                        backgroundColor: platform.id === "lotto" ? "#E0F2FE" : "#F3F4F6",
                        color: platform.id === "lotto" ? "#0284C7" : "#6B7280",
                      }}
                    >
                      {platform.badge}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: "12px", color: "#6B7280" }}>
                  {platform.subtitle}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "11px", color: "#9CA3AF", display: "block" }}>
                    金库余额
                  </span>
                  <span style={{ fontSize: "15px", fontWeight: 700, fontFamily: "Inter, monospace", color: "#1C1F23" }}>
                    {platform.id === "lotto" ? lotteryBalance : "0.00"}
                  </span>
                </div>
                {isSelected ? (
                  <div
                    style={{
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                      backgroundColor: "#0066FF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Check size={14} color="#ffffff" strokeWidth={3} />
                  </div>
                ) : (
                  <div
                    style={{
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                      border: "1.5px solid #D1D5DB",
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // 划转表单界面
  const renderTransferForm = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* 顶部：系统内 mUSDC 余额临时展示 (非外部EOA) */}
      {selectedPlatformId === "lotto" && (
        <div
          style={{
            backgroundColor: "#F3F5F9",
            borderRadius: "16px",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "#0066FF",
                backgroundColor: "#E5EDFF",
                padding: "2px 6px",
                borderRadius: "4px",
              }}
            >
              测试临时
            </span>
            <span style={{ fontSize: "13px", color: "#4B525D", fontWeight: 500 }}>
              系统内 mUSDC 余额
            </span>
          </div>
          <span
            style={{
              fontSize: "15px",
              fontWeight: 700,
              fontFamily: "Inter, monospace",
              color: "#1C1F23",
            }}
          >
            {systemMusdcBalance} <span style={{ fontSize: "11px", fontWeight: 500 }}>mUSDC</span>
          </span>
        </div>
      )}

      {/* 划转方向区域：对称上下两个选择框，中间切换按钮 */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", position: "relative" }}>
        {/* 上方：源账户 (From) */}
        {renderAccountBox("从 (From)", true)}

        {/* 居中切换方向按钮 */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            margin: "-14px 0",
            zIndex: 10,
          }}
        >
          <button
            type="button"
            onClick={handleSwitchDirection}
            title="切换划转方向"
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              backgroundColor: "#0066FF",
              border: "3px solid #ffffff",
              boxShadow: "0 2px 8px rgba(0, 102, 255, 0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "transform 0.2s ease",
            }}
            className="hover:scale-110 active:scale-95"
          >
            <ArrowDownUp size={16} color="#ffffff" />
          </button>
        </div>

        {/* 下方：目标账户 (To) */}
        {renderAccountBox("到 (To)", false)}
      </div>

      {/* 划转金额输入框 */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "6px",
          }}
        >
          <span style={{ fontSize: "12px", fontWeight: 500, color: "#4B525D" }}>划转金额</span>
          <span style={{ fontSize: "11px", color: "#6B7280" }}>
            可用: {sourceBalance}
          </span>
        </div>

        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            border: "1.5px solid #E5E8F0",
            borderRadius: "16px",
            backgroundColor: "#ffffff",
            padding: "0 12px 0 16px",
          }}
        >
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            style={{
              width: "100%",
              height: "48px",
              border: "none",
              outline: "none",
              fontSize: "18px",
              fontWeight: "bold",
              fontFamily: "Inter, monospace",
              color: "#1C1F23",
              backgroundColor: "transparent",
            }}
          />
          <button
            type="button"
            onClick={handleMax}
            style={{
              backgroundColor: "#EEF4FF",
              color: "#0066FF",
              border: "none",
              borderRadius: "8px",
              padding: "4px 10px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              marginRight: "8px",
            }}
          >
            MAX
          </button>
          <span style={{ fontSize: "14px", fontWeight: 600, color: "#4B525D" }}>
            USDC
          </span>
        </div>
      </div>

      {/* 确认操作按钮 */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isLoading || !amount || parseFloat(amount) <= 0}
        style={{
          width: "100%",
          height: "48px",
          borderRadius: "30px",
          backgroundColor: isLoading ? "#9CA3AF" : "#0066FF",
          color: "#ffffff",
          border: "none",
          fontSize: "15px",
          fontWeight: 600,
          cursor: isLoading ? "not-allowed" : "pointer",
          boxShadow: "0 4px 12px rgba(0, 102, 255, 0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          transition: "background-color 0.15s ease, transform 0.1s ease",
          marginTop: "4px",
        }}
        className={!isLoading ? "hover:opacity-95 active:scale-98" : ""}
      >
        {isLoading ? (
          <span>处理中...</span>
        ) : (
          <span>
            {isToLottery
              ? `确认划转 (充值到${currentPlatform.name.split(" ")[0]})`
              : `确认划转 (从${currentPlatform.name.split(" ")[0]}提取到 WF)`}
          </span>
        )}
      </button>
    </div>
  );

  if (!isOpen) return null;

  // 手机端：使用 @wf-platform/uikit 公共封装的 ResponsiveModal 从下往上滑出 (Bottom Sheet)
  if (isMobile) {
    return (
      <ResponsiveModal
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
        title="资金划转"
        showClose={false}
        contentClassName="p-4"
      >
        {isPlatformPickerOpen ? renderPlatformPicker() : renderTransferForm()}
      </ResponsiveModal>
    );
  }

  // PC 端：渲染精致居中浮层
  const modalContent = (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.55)",
        backdropFilter: "blur(4px)",
        zIndex: 99999, // Ensure high z-index
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          backgroundColor: "#ffffff",
          borderRadius: "28px",
          padding: "24px",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "18px",
          }}
        >
          <h3 style={{ fontSize: "18px", fontWeight: "bold", color: "#1C1F23", margin: 0 }}>
            资金划转
          </h3>
        </div>

        {isPlatformPickerOpen ? renderPlatformPicker() : renderTransferForm()}
      </div>
    </div>
  );

  if (typeof document !== "undefined") {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
}
