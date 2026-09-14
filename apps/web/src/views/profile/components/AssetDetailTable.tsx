"use client";

import React from "react";
import { toast } from "@wf-platform/uikit";

export function AssetDetailTable() {
  const rows = [
    {
      type: "可用余额",
      amount: "1,280.50",
      source: "充值、派奖已到账",
      action: "充值/提现/购买",
      isAction: true,
    },
    {
      type: "待开奖冻结",
      amount: "49.00",
      source: "第2031期投注未开奖",
      action: "查看投注",
      isAction: true,
    },
    {
      type: "待领取奖金",
      amount: "13.22",
      source: "第2030期中奖",
      action: "领取",
      isAction: true,
      highlight: true,
    },
    {
      type: "待退款",
      amount: "0.00",
      source: "暂无异常订单",
      action: "查看退款",
      isAction: false,
    },
  ];

  return (
    <div
      className="hidden lg:block bg-white shadow-xs"
      style={{
        borderRadius: "24px",
        padding: "24px",
        border: "1px solid #eef1f6",
      }}
    >
      {/* 头部标题与描述 */}
      <div style={{ marginBottom: "20px" }}>
        <h3
          style={{
            fontSize: "18px",
            fontWeight: "bold",
            color: "#1C1F23",
            margin: 0,
          }}
        >
          资产构成
        </h3>
        <p
          style={{
            fontSize: "12px",
            color: "#707070",
            margin: "4px 0 0 0",
          }}
        >
          每一笔资产状态都能解释为什么可用或不可用。
        </p>
      </div>

      {/* 表格容器 */}
      <div
        style={{
          backgroundColor: "#edf2f7",
          borderRadius: "20px",
          padding: "16px",
        }}
      >
        {/* 表头 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "0 16px 12px 16px",
            fontSize: "12px",
            fontWeight: 500,
            color: "#707070",
          }}
        >
          <div style={{ flex: 1 }}>资产类型</div>
          <div style={{ flex: 1 }}>金额</div>
          <div style={{ flex: 1 }}>来源/原因</div>
          <div style={{ flex: 1 }}>用户可选</div>
        </div>

        {/* 表格数据行 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {rows.map((row, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: "#ffffff",
                borderRadius: "14px",
                padding: "14px 16px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                fontSize: "13px",
              }}
            >
              <div style={{ flex: 1, fontWeight: 600, color: "#1C1F23" }}>
                {row.type}
              </div>
              <div
                style={{
                  flex: 1,
                  fontWeight: "bold",
                  fontFamily: "Inter, monospace",
                  color: "#1C1F23",
                }}
              >
                {row.amount}
              </div>
              <div style={{ flex: 1, fontSize: "12px", color: "#707070" }}>
                {row.source}
              </div>
              <div style={{ flex: 1 }}>
                <button
                  type="button"
                  onClick={() => toast.info(`操作: ${row.action}`)}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: row.highlight ? 600 : 500,
                    color: row.highlight ? "#0066FF" : "#4B525D",
                    textDecoration: "underline",
                  }}
                >
                  {row.action}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 分页控制栏 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: "16px",
          marginTop: "16px",
          fontSize: "12px",
          color: "#707070",
        }}
      >
        <span>共 1996 条，第 1 / 200 页</span>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            style={{
              padding: "4px 12px",
              backgroundColor: "#f0f3f8",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "12px",
              color: "#4B525D",
            }}
          >
            上一页
          </button>
          <button
            type="button"
            style={{
              padding: "4px 12px",
              backgroundColor: "#f0f3f8",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "12px",
              color: "#4B525D",
            }}
          >
            下一页
          </button>
        </div>
      </div>
    </div>
  );
}
