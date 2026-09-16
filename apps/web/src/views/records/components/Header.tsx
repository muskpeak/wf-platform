"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export function Header({ balance }: { balance?: string }) {
  const router = useRouter();

  return (
    <div
      className="flex items-center justify-between"
      style={{
        width: "430px",
        maxWidth: "100%",
        margin: "0 auto",
        padding: "14px 12px",
        backgroundColor: "#ffffff",
      }}
    >
      {/* 左侧：返回 + 标题 */}
      <div
        className="flex items-center"
        style={{ gap: "8px", cursor: "pointer" }}
        onClick={() => router.back()}
      >
        <div
          className="flex items-center justify-center"
          style={{
            width: 24,
            height: 24,
            backgroundColor: "transparent",
          }}
        >
          <ChevronLeft size={22} color="#11181C" strokeWidth={2.2} />
        </div>
        <div
          style={{
            fontFamily: "Noto Sans SC, sans-serif",
            fontWeight: 700,
            fontSize: 16,
            lineHeight: "16px",
            color: "#11181C",
          }}
        >
          资金记录
        </div>
      </div>

      {/* 右侧：钱包 chip + 头像 */}
      <div className="flex items-center" style={{ gap: "8px" }}>
        <div
          className="flex items-center"
          style={{
            gap: "8px",
            padding: "7px 12px",
            backgroundColor: "#E4EAF6",
            borderRadius: 18,
            height: 36,
          }}
        >
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 400,
              fontSize: 12,
              lineHeight: "14px",
              color: "#475767",
            }}
          >
            余额
          </span>
          <span
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontWeight: 700,
              fontSize: 14,
              lineHeight: "14px",
              color: "#0C0D10",
            }}
          >
            {balance ?? "$999784"}
          </span>
        </div>

        {/* 头像占位（保持与 Figma 一致的圆形尺寸） */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 999,
            backgroundColor: "#E4EAF6",
            border: "1px solid #E4EAF6",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src="/avatar.svg"
            alt="avatar"
            style={{ width: "100%", height: "100%" }}
          />
        </div>
      </div>
    </div>
  );
}
