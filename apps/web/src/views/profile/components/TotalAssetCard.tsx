"use client";

import React from "react";

export interface TotalAssetCardProps {
  totalBalance?: string;
}

export function TotalAssetCard({ totalBalance = "9,28,5410.50" }: TotalAssetCardProps) {
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

      {/* 中间资产数字展示 */}
      <div style={{ marginTop: "14px", zIndex: 1 }}>
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
