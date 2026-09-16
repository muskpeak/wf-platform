"use client";

import React, { useState } from "react";
import { ChevronDown, X } from "lucide-react";

interface FilterChipProps {
  label: string;
  width?: number | string;
  active?: boolean;
  onClick?: () => void;
}

function FilterChip({ label, width = 130, active = false, onClick }: FilterChipProps) {
  return (
    <div
      className="flex items-center justify-between"
      onClick={onClick}
      style={{
        width,
        height: 46,
        borderRadius: 20,
        border: active ? "1px solid #1B254B" : "1px solid #D5DBE7",
        backgroundColor: active ? "#F0F3FA" : "transparent",
        padding: "0 14px",
        boxSizing: "border-box",
        cursor: "pointer",
        fontFamily: "PingFang SC, Noto Sans SC, sans-serif",
        fontSize: 14,
        color: "#141B2B",
        lineHeight: "18px",
      }}
    >
      <span>{label}</span>
      <ChevronDown size={14} color="#141B2B" strokeWidth={2} />
    </div>
  );
}

export function FilterChips() {
  const [filters, setFilters] = useState<{ account: string; type: string; status: string }>({
    account: "全部账户",
    type: "全部类型",
    status: "全部状态",
  });

  const hasAnyFilter =
    filters.account !== "全部账户" ||
    filters.type !== "全部类型" ||
    filters.status !== "全部状态";

  const resetFilters = () => {
    setFilters({ account: "全部账户", type: "全部类型", status: "全部状态" });
  };

  return (
    <div className="flex flex-col" style={{ gap: 16 }}>
      {/* 3 个筛选 chip 横向排列 */}
      <div className="flex items-center" style={{ gap: 9 }}>
        <FilterChip
          label={filters.account}
          width={130}
          active={filters.account !== "全部账户"}
          onClick={() =>
            setFilters((f) => ({
              ...f,
              account: f.account === "全部账户" ? "资金账户" : "全部账户",
            }))
          }
        />
        <FilterChip
          label={filters.type}
          width={130}
          active={filters.type !== "全部类型"}
          onClick={() =>
            setFilters((f) => ({
              ...f,
              type: f.type === "全部类型" ? "充值" : "全部类型",
            }))
          }
        />
        <FilterChip
          label={filters.status}
          width={120}
          active={filters.status !== "全部状态"}
          onClick={() =>
            setFilters((f) => ({
              ...f,
              status: f.status === "全部状态" ? "成功" : "全部状态",
            }))
          }
        />
      </div>

      {/* 清除筛选按钮 */}
      {hasAnyFilter && (
        <div
          className="flex items-center self-center"
          style={{
            padding: "0 19px",
            height: 24,
            borderRadius: 10,
            gap: 10,
            cursor: "pointer",
            backgroundColor: "transparent",
          }}
          onClick={resetFilters}
        >
          <span
            style={{
              fontFamily: "PingFang SC, Noto Sans SC, sans-serif",
              fontWeight: 400,
              fontSize: 16,
              lineHeight: "16px",
              color: "#303A50",
            }}
          >
            清除筛选
          </span>
          <X size={16} color="#303A50" strokeWidth={2} />
        </div>
      )}
    </div>
  );
}
