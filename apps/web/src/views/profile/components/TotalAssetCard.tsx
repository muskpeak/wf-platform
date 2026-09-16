"use client";

import React from "react";

export interface TotalAssetCardProps {
  totalBalance?: string;
  onOpenDeposit?: () => void;
  onOpenWithdraw?: () => void;
  onOpenTransfer?: () => void;
}

export function TotalAssetCard({
  totalBalance = "--",
  onOpenDeposit,
  onOpenWithdraw,
  onOpenTransfer,
}: TotalAssetCardProps) {
  return (
    <div
      className="w-full max-w-[398px] lg:max-w-none mx-auto relative overflow-hidden transition-all shadow-md"
      style={{
        borderRadius: "30px",
        padding: "24px 24px 20px 24px",
        minHeight: "220px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        position: "relative",
      }}
    >
      {/* 官方 Figma 矢量背景底图 (含高精度世界地图与网格纹理) */}
      <img
        src="/total-asset-bg.svg"
        alt="Asset Card Background"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* 顶部标题栏：钱包图标 + "账户可用资产" */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", zIndex: 1 }}>
        <div style={{ width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M18.04 13.55C17.62 13.96 17.38 14.55 17.44 15.18C17.53 16.26 18.52 17.05 19.6 17.05H21.5V18.24C21.5 20.31 19.82 22 17.75 22H6.25C4.18 22 2.5 20.32 2.5 18.25V8.05C2.5 6.07 4.02 4.44 5.97 4.31C6.06 4.3 6.15 4.3 6.25 4.3H17.75C19.82 4.3 21.5 5.98 21.5 8.05V10.79H19.5C18.91 10.79 18.37 11.08 18.04 11.55V13.55Z"
              fill="#ffffff"
            />
            <path
              d="M22.5 12.79V15.05C22.5 15.6 22.05 16.05 21.5 16.05H19.5C18.95 16.05 18.5 15.6 18.5 15.05V12.79C18.5 12.24 18.95 11.79 19.5 11.79H21.5C22.05 11.79 22.5 12.24 22.5 12.79Z"
              fill="#ffffff"
            />
            <path
              opacity="0.4"
              d="M7 4.25V3.75C7 2.78 7.78 2 8.75 2H15.25C16.22 2 17 2.78 17 3.75V4.25"
              stroke="#ffffff"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <span
          style={{
            fontSize: "14px",
            fontWeight: "bold",
            color: "#ffffff",
            lineHeight: "14px",
          }}
        >
          账户可用资产
        </span>
      </div>

      {/* 中间资产数字展示 与 PC端右侧核心操作按钮 */}
      <div
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
        style={{ marginTop: "14px", zIndex: 1 }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "38px",
                fontWeight: "bold",
                color: "#ffffff",
                lineHeight: "40px",
                letterSpacing: "-0.5px",
              }}
            >
              {totalBalance}
            </span>
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "14px",
                fontWeight: "bold",
                color: "#ffffff",
              }}
            >
              USDC
            </span>
          </div>
          <p
            style={{
              fontSize: "10px",
              color: "rgba(255, 255, 255, 0.8)",
              margin: "8px 0 0 0",
              lineHeight: "10px",
            }}
          >
            总余额 = 资金账户 + 彩票账户
          </p>
        </div>

        {/* 桌面端专属：卡片内高质感操作按钮组 (移动端隐藏，完全不影响 H5) */}
        <div className="hidden lg:flex items-center gap-2.5 flex-wrap">
          {/* 充值 Deposit */}
          <button
            type="button"
            onClick={onOpenDeposit}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold transition-all shadow-sm hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
            style={{
              backgroundColor: "#ffffff",
              color: "#0066ff",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M17 7L7 17M7 17H15M7 17V9"
                stroke="#0066ff"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>充值</span>
          </button>

          {/* 提现 */}
          <button
            type="button"
            onClick={onOpenWithdraw}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold transition-all hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.16)",
              color: "#ffffff",
              border: "1px solid rgba(255, 255, 255, 0.28)",
              backdropFilter: "blur(8px)",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M7 17L17 7M17 7H9M17 7V15"
                stroke="#ffffff"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>提现</span>
          </button>

          {/* 划转 */}
          <button
            type="button"
            onClick={onOpenTransfer}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold transition-all hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.16)",
              color: "#ffffff",
              border: "1px solid rgba(255, 255, 255, 0.28)",
              backdropFilter: "blur(8px)",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M17.5 17.5C19.433 17.5 21 15.933 21 14C21 12.067 19.433 10.5 17.5 10.5C15.567 10.5 14 12.067 14 14C14 15.933 15.567 17.5 17.5 17.5Z"
                stroke="#ffffff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M6.5 13.5C8.433 13.5 10 11.933 10 10C10 8.067 8.433 6.5 6.5 6.5C4.567 6.5 3 8.067 3 10C3 11.933 4.567 13.5 6.5 13.5Z"
                stroke="#ffffff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M14 6.5H19C20.1046 6.5 21 7.39543 21 8.5V9.5"
                stroke="#ffffff"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M16 4.5L14 6.5L16 8.5"
                stroke="#ffffff"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M10 17.5H5C3.89543 17.5 3 16.6046 3 15.5V14.5"
                stroke="#ffffff"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M8 19.5L10 17.5L8 15.5"
                stroke="#ffffff"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>划转</span>
          </button>
        </div>
      </div>

      {/* 底部 WORLD FORECAST 与 Logo (使用网站左上角官方 logo.svg) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: "18px",
          zIndex: 1,
        }}
      >
        <span
          style={{
            fontFamily: "Noto Sans SC, sans-serif",
            fontSize: "18px",
            fontWeight: "bold",
            color: "#0088FF",
            letterSpacing: "0.5px",
            textShadow: "0 0 10px rgba(0, 136, 255, 0.3)",
          }}
        >
          WORLD FORECAST
        </span>

        {/* 官方 Logo 图标 */}
        <div
          style={{
            width: "24px",
            height: "24px",
            borderRadius: "50%",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src="/logo.svg"
            alt="World Forecast Logo"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
          />
        </div>
      </div>
    </div>
  );
}
