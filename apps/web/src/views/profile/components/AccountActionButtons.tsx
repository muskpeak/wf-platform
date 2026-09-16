"use client";

import React from "react";
import { toast } from "@wf-platform/uikit";

export interface AccountActionButtonsProps {
  onOpenTransfer?: () => void;
  onOpenDeposit?: () => void;
  onOpenWithdraw?: () => void;
}

export function AccountActionButtons({
  onOpenTransfer,
  onOpenDeposit,
  onOpenWithdraw,
}: AccountActionButtonsProps) {
  const handleAction = (actionName: string) => {
    if (actionName === "划转" && onOpenTransfer) {
      onOpenTransfer();
      return;
    }
    if (actionName === "充值" && onOpenDeposit) {
      onOpenDeposit();
      return;
    }
    if (actionName === "提现" && onOpenWithdraw) {
      onOpenWithdraw();
      return;
    }
    toast.info(`${actionName} 功能即将上线`);
  };

  return (
    <div
      className="w-full max-w-[398px] mx-auto py-2"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "46px",
      }}
    >
      {/* 按钮 1: 充值 Deposit */}
      <button
        type="button"
        onClick={() => handleAction("充值")}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "12px",
          width: "80px",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "40.5px",
            backgroundColor: "#e7ebf4",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "transform 0.15s ease",
          }}
          className="hover:scale-105 active:scale-95"
        >
          {/* Arrow Left Down 图标 */}
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M17 7L7 17M7 17H15M7 17V9"
              stroke="#303030"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <span
          style={{
            fontSize: "12px",
            fontWeight: "bold",
            color: "#414141",
            lineHeight: "12px",
            textAlign: "center",
            whiteSpace: "nowrap",
          }}
        >
          充值
        </span>
      </button>

      {/* 按钮 2: 提现 */}
      <button
        type="button"
        onClick={() => handleAction("提现")}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "12px",
          width: "80px",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "40.5px",
            backgroundColor: "#e7ebf4",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "transform 0.15s ease",
          }}
          className="hover:scale-105 active:scale-95"
        >
          {/* Arrow Right Up 图标 */}
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M7 17L17 7M17 7H9M17 7V15"
              stroke="#303030"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <span
          style={{
            fontSize: "12px",
            fontWeight: "bold",
            color: "#414141",
            lineHeight: "12px",
            textAlign: "center",
            whiteSpace: "nowrap",
          }}
        >
          提现
        </span>
      </button>

      {/* 按钮 3: 划转 */}
      <button
        type="button"
        onClick={() => handleAction("划转")}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "12px",
          width: "80px",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "40.5px",
            backgroundColor: "#e7ebf4",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "transform 0.15s ease",
          }}
          className="hover:scale-105 active:scale-95"
        >
          {/* Coins Swap 图标 */}
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M17.5 17.5C19.433 17.5 21 15.933 21 14C21 12.067 19.433 10.5 17.5 10.5C15.567 10.5 14 12.067 14 14C14 15.933 15.567 17.5 17.5 17.5Z"
              stroke="#303030"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M6.5 13.5C8.433 13.5 10 11.933 10 10C10 8.067 8.433 6.5 6.5 6.5C4.567 6.5 3 8.067 3 10C3 11.933 4.567 13.5 6.5 13.5Z"
              stroke="#303030"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M14 6.5H19C20.1046 6.5 21 7.39543 21 8.5V9.5"
              stroke="#303030"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M16 4.5L14 6.5L16 8.5"
              stroke="#303030"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M10 17.5H5C3.89543 17.5 3 16.6046 3 15.5V14.5"
              stroke="#303030"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              />
            <path
              d="M8 19.5L10 17.5L8 15.5"
              stroke="#303030"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <span
          style={{
            fontSize: "12px",
            fontWeight: "bold",
            color: "#414141",
            lineHeight: "12px",
            textAlign: "center",
            whiteSpace: "nowrap",
          }}
        >
          划转
        </span>
      </button>
    </div>
  );
}
