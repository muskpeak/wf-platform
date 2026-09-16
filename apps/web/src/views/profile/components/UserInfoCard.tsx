"use client";

import React, { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useZeroDev } from "@wf-platform/web3-core";
import { useAuthStore } from "@wf-platform/auth";
import { toast } from "@wf-platform/uikit";
import { Settings, Check, Camera } from "lucide-react";

export function UserInfoCard() {
  const { user, authenticated, login } = usePrivy();
  const { aaAddress } = useZeroDev();
  const { profile } = useAuthStore();
  const [copied, setCopied] = useState(false);

  // 严格校验真实邮箱 (排除 did:privy、占位符及非法字符串)
  const isValidEmail = (str?: string | null): boolean => {
    if (!str || typeof str !== "string") return false;
    if (str.startsWith("did:")) return false;
    if (str.includes("@example.com") || str.includes("Jonsomeone")) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str.trim());
  };

  // 仅当用户处于登录状态时才解析有效地址、邮箱与名称
  const isLoggedIn = Boolean(authenticated);

  // 严密获取用户真实有效邮箱 (仅支持 Google OAuth 或有效 Email 登录)
  const realEmail = React.useMemo(() => {
    if (!isLoggedIn) return null;
    if (isValidEmail(user?.google?.email)) return user!.google!.email;
    if (isValidEmail(user?.email?.address)) return user!.email!.address;
    if (isValidEmail(profile?.email)) return profile!.email;

    if (Array.isArray(user?.linkedAccounts)) {
      const googleAcc = user.linkedAccounts.find(
        (a: any) => (a.type === "google_oauth" || a.type === "google") && isValidEmail(a.email)
      ) as any;
      if (googleAcc?.email) return googleAcc.email;

      const emailAcc = user.linkedAccounts.find(
        (a: any) => a.type === "email" && isValidEmail(a.address)
      ) as any;
      if (emailAcc?.address) return emailAcc.address;
    }
    return null;
  }, [isLoggedIn, user, profile]);

  // 外部 EOA 钱包地址 (优先读取 store 里的 profile.address，即已连接的外部 EOA 地址)
  const externalWallet = user?.linkedAccounts?.find(
    (a: any) => a.type === "wallet" && a.walletClientType !== "privy"
  ) as any;
  const externalEoa = isLoggedIn
    ? (profile?.address ||
       externalWallet?.address ||
       user?.wallet?.address ||
       (user?.linkedAccounts?.find((a: any) => a.type === "wallet") as any)?.address)
    : null;

  const activeAddress = isLoggedIn ? (externalEoa || aaAddress) : null;
  const displayAddress = activeAddress
    ? `${activeAddress.slice(0, 6)}...${activeAddress.slice(-4)}`
    : "--";

  // 大字展示名称：
  // 1. 如果未登录，展示“未登录 (点击登录)”
  // 2. 如果有真实的 Google / Email 邮箱，展示真实邮箱
  // 3. 如果是 Web3 钱包登录（无邮箱），展示地址
  const displayName = !isLoggedIn
    ? "未登录 (点击登录)"
    : realEmail
    ? realEmail
    : displayAddress;

  const handleCopyAddress = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeAddress) {
      login();
      return;
    }
    try {
      await navigator.clipboard.writeText(activeAddress);
      setCopied(true);
      toast.success("已复制地址");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("复制失败，请手动复制");
    }
  };

  return (
    <div
      className="w-full max-w-[398px] lg:max-w-none mx-auto transition-all h-full relative"
      style={{
        backgroundColor: "#e7ebf4",
        borderRadius: "30px",
        padding: "20px 16px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      {/* 桌面端右上角：更换头像照相机按钮 */}
      <button
        type="button"
        onClick={() => toast.info("更换头像")}
        className="hidden lg:flex items-center justify-center rounded-full text-gray-500 hover:text-gray-900 transition-colors"
        title="更换头像"
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          width: "32px",
          height: "32px",
          background: "none",
          border: "none",
          cursor: "pointer",
        }}
      >
        <Camera size={18} color="#4A5568" />
      </button>

      <div className="user-card-inner">
        {/* 头像区域 (68x68) */}
        <div
          style={{
            position: "relative",
            width: "68px",
            height: "68px",
            flexShrink: 0,
          }}
        >
          {/* 头像圆框 */}
          <div
            style={{
              width: "68px",
              height: "68px",
              borderRadius: "50%",
              overflow: "hidden",
              backgroundColor: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              src="/avatar.svg"
              alt="User Avatar"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          </div>

          {/* 右下角齿轮设置角标 (24x24，背景 #dfeaff，居中 12px 齿轮) */}
          <div
            title="账户设置"
            style={{
              position: "absolute",
              right: "0px",
              bottom: "0px",
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              backgroundColor: "#dfeaff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <Settings size={12} color="#303030" strokeWidth={2.4} />
          </div>
        </div>

        {/* 用户信息区域 */}
        <div className="user-info-text">
          {/* 邮箱/名称：lineHeight 24px + paddingBottom 2px 彻底杜绝字母 g 被截断 */}
          <div style={{ width: "100%", minWidth: 0, overflow: "visible" }}>
            <h2
              onClick={(!authenticated && !activeAddress) ? () => login() : undefined}
              title={displayName}
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                color: "#303030",
                lineHeight: "24px",
                paddingBottom: "2px",
                margin: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                cursor: (!authenticated && !activeAddress) ? "pointer" : "default",
              }}
            >
              {displayName}
            </h2>
          </div>

          {/* 地址 + 复制 + 状态标签 (横排整齐对齐) */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              whiteSpace: "nowrap",
            }}
          >
            {/* 外部 EOA 地址与复制组合 */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#303030",
                  lineHeight: "14px",
                }}
              >
                {displayAddress}
              </span>

              {/* Vuesax Bulk 风格复制图标 */}
              <button
                type="button"
                onClick={handleCopyAddress}
                title="复制外部 EOA 地址"
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#303030",
                }}
              >
                {copied ? (
                  <Check size={16} color="#00a63e" />
                ) : (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      opacity="0.4"
                      d="M16 12.9V17.1C16 20.6 14.6 22 11.1 22H6.9C3.4 22 2 20.6 2 17.1V12.9C2 9.4 3.4 8 6.9 8H11.1C14.6 8 16 9.4 16 12.9Z"
                      fill="#303030"
                    />
                    <path
                      d="M17.1 2H12.9C9.82 2 8.34 3.1 8.05 5.8C9.07 5.29 10.32 5 11.8 5H15.3C18.8 5 20.2 6.4 20.2 9.9V13.4C20.2 14.88 19.91 16.13 19.4 17.15C22.1 16.86 23.2 15.38 23.2 12.3V8.1C23.2 4.6 21.8 3.2 18.3 3.2L17.1 2Z"
                      fill="#303030"
                    />
                  </svg>
                )}
              </button>
            </div>

            {/* 连接状态标签 */}
            <div
              style={{
                backgroundColor: (isLoggedIn && activeAddress)
                  ? "rgba(34, 197, 94, 0.2)"
                  : "rgba(156, 163, 175, 0.2)",
                borderRadius: "9999px",
                padding: "4px 8px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                cursor: (!isLoggedIn || !activeAddress) ? "pointer" : "default",
              }}
              onClick={(!isLoggedIn || !activeAddress) ? () => login() : undefined}
            >
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 500,
                  color: (isLoggedIn && activeAddress) ? "#00a63e" : "#6B7280",
                  lineHeight: "16px",
                  whiteSpace: "nowrap",
                }}
              >
                {(isLoggedIn && activeAddress) ? "Polygon 已连接" : "未连接"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .user-card-inner {
          display: flex;
          align-items: center;
          gap: 18px;
          width: 100%;
        }
        .user-info-text {
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 12px;
          flex: 1;
          min-width: 0;
        }
        @media (min-width: 1024px) {
          .user-card-inner {
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            gap: 20px;
          }
          .user-info-text {
            align-items: center;
            gap: 14px;
          }
        }
      `}</style>
    </div>
  );
}
