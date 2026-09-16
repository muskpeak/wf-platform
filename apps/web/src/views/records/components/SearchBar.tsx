"use client";

import React from "react";
import { Search } from "lucide-react";

export function SearchBar() {
  return (
    <div
      className="flex items-center justify-between"
      style={{
        padding: "13px 16px",
        backgroundColor: "#E7EBF4",
        borderRadius: 30,
        height: 48,
        width: "100%",
      }}
    >
      <div className="flex items-center" style={{ gap: "8px" }}>
        <Search size={18} color="#757575" strokeWidth={2} />
        <input
          type="text"
          placeholder="搜索记录号或关联订单号"
          style={{
            fontFamily: "PingFang SC, Noto Sans SC, sans-serif",
            fontSize: 14,
            lineHeight: "14px",
            color: "#141B2B",
            outline: "none",
            border: "none",
            background: "transparent",
            width: "100%",
            minWidth: 0,
          }}
        />
      </div>

      {/* 右侧搜索图标 (Figma 上是一个 search-lg) */}
      <Search size={20} color="#757575" strokeWidth={1.8} />
    </div>
  );
}
