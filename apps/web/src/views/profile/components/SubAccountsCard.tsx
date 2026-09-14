"use client";

import React from "react";
import { toast } from "@wf-platform/uikit";

export interface SubAccountsCardProps {
  wfBalance?: string;
  lotteryBalance?: string;
  musdcBalance?: string; // 临时测试币，不计入真实资产
  onOpenTransfer?: () => void;
  onViewRecords?: () => void;
}

export function SubAccountsCard({
  wfBalance = "0.00",
  lotteryBalance = "0.00",
  musdcBalance,
  onOpenTransfer,
  onViewRecords,
}: SubAccountsCardProps) {
  const handleViewRecords = () => {
    if (onViewRecords) {
      onViewRecords();
    } else {
      toast.info("打开资金记录");
    }
  };

  const handleTransfer = () => {
    if (onOpenTransfer) {
      onOpenTransfer();
    } else {
      toast.info("打开划转资金窗口");
    }
  };

  return (
    <div
      className="w-full max-w-[398px] lg:max-w-none mx-auto bg-white transition-all shadow-xs"
      style={{
        borderRadius: "26px",
        padding: "16px 20px 20px 20px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        {/* 左侧：资金账户 (真实 Polygon USDC) */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: "14px",
            minWidth: 0,
          }}
        >
          {/* 图标 (34x34) */}
          <div
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "12px",
              backgroundColor: "#e5f3ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M2 8.5H22M6 16.5H8M10.5 16.5H14.5M22 12V8C22 4.5 20.5 3 17 3H7C3.5 3 2 4.5 2 8V16C2 19.5 3.5 21 7 21H17C20.5 21 22 19.5 22 16V12Z"
                stroke="#0088ff"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* 账户信息 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontSize: "10px", fontWeight: 500, color: "#707070", lineHeight: "12px" }}>
              资金账户
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "3px" }}>
              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "18px",
                  fontWeight: 800,
                  color: "#303030",
                  lineHeight: "20px",
                }}
              >
                {wfBalance}
              </span>
              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "10px",
                  fontWeight: 800,
                  color: "#303030",
                }}
              >
                USDC
              </span>
            </div>
            <p
              style={{
                fontSize: "10px",
                color: "#6d7890",
                margin: "2px 0 0 0",
                lineHeight: "13px",
              }}
            >
              用于充值、划转和外部提现。
            </p>
          </div>

          {/* 底部按钮 */}
          <button
            type="button"
            onClick={handleViewRecords}
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #e4e8f0",
              borderRadius: "30px",
              height: "40px",
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "background-color 0.15s ease",
            }}
            className="hover:bg-gray-50 active:bg-gray-100"
          >
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#303a50", whiteSpace: "nowrap" }}>
              查看资金记录
            </span>
          </button>
        </div>

        {/* 中间垂直分割线 */}
        <div
          style={{
            width: "1px",
            backgroundColor: "#dae1e9",
            height: "56px",
            alignSelf: "center",
            flexShrink: 0,
          }}
        />

        {/* 右侧：彩票账户 (彩票金库 WUSD + 右边临时 mUSDC 余额展示) */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: "14px",
            minWidth: 0,
          }}
        >
          {/* 图标 (34x34) 与临时测试币展示 */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "12px",
                backgroundColor: "#e5f3ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M9.01 20.5H14.99C19 20.5 20.5 19 20.5 15V9C20.5 5 19 3.5 14.99 3.5H9.01C5 3.5 3.5 5 3.5 9V15C3.5 19 5 20.5 9.01 20.5Z"
                  stroke="#0088ff"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M17.5 8.5V15.5M6.5 8.5V15.5M12 9.5V14.5"
                  stroke="#0088ff"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="2 2"
                />
              </svg>
            </div>

            {/* 彩票账户右侧临时 mUSDC 显示 (上线后废弃，不计入总资产) */}
            <div
              title="当前系统内临时测试币 mUSDC 余额，仅测试期可用，不计入总资产"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "3px",
                backgroundColor: "#F0F5FF",
                border: "1px solid #D0E1FD",
                borderRadius: "6px",
                padding: "2px 6px",
              }}
            >
              <span style={{ fontSize: "9px", fontWeight: 700, color: "#0066FF" }}>
                mUSDC:
              </span>
              <span
                style={{
                  fontFamily: "Inter, monospace",
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "#1E293B",
                }}
              >
                {musdcBalance || "0.00"}
              </span>
              <span style={{ fontSize: "9px", color: "#64748B", transform: "scale(0.85)" }}>
                (临时)
              </span>
            </div>
          </div>

          {/* 账户信息 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontSize: "10px", fontWeight: 500, color: "#707070", lineHeight: "12px" }}>
              彩票账户
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "3px" }}>
              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "18px",
                  fontWeight: 800,
                  color: "#303030",
                  lineHeight: "20px",
                }}
              >
                {lotteryBalance}
              </span>
              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "10px",
                  fontWeight: 800,
                  color: "#303030",
                }}
              >
                USDC
              </span>
            </div>
            <p
              style={{
                fontSize: "10px",
                color: "#6d7890",
                margin: "2px 0 0 0",
                lineHeight: "13px",
              }}
            >
              余额由彩票平台同步
            </p>
          </div>

          {/* 底部按钮 */}
          <button
            type="button"
            onClick={handleTransfer}
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #e4e8f0",
              borderRadius: "30px",
              height: "40px",
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "background-color 0.15s ease",
            }}
            className="hover:bg-gray-50 active:bg-gray-100"
          >
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#303a50", whiteSpace: "nowrap" }}>
              划转到资金账户
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
