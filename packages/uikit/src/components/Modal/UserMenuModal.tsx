"use client";

import React, { useState } from "react";
import { ResponsiveModal } from "./ResponsiveModal";
import { Icon } from "../Icon";
import type { IconNameType } from "../Icon/type";
import { Copy, Check, ChevronRight } from "lucide-react";
import { useLanguage } from "../../providers/LanguageProvider";
import { useMediaQuery } from "../../hooks/useMediaQuery";

export interface UserMenuContentProps {
  address?: string;
  onLogout?: () => void;
  onNavigate?: (path: string) => void;
  onClose?: () => void;
}

export function UserMenuContent({
  address = "0x95Cd...3Cbb",
  onLogout,
  onNavigate,
  onClose,
}: UserMenuContentProps) {
  const [copied, setCopied] = useState(false);
  const [mobileLangExpand, setMobileLangExpand] = useState(false);
  const { currentLanguage, setLanguage, supportedLanguages } = useLanguage();

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const menuItems: { id: string; title: string; icon: IconNameType; path?: string }[] = [
    {
      id: "profile",
      title: "个人中心",
      icon: "profile",
      path: "/profile",
    },
    {
      id: "records",
      title: "资金记录",
      icon: "card_search",
    },
    {
      id: "deposit",
      title: "充值 Deposit",
      icon: "deposit",
    },
    {
      id: "withdraw",
      title: "提现 Withdraw",
      icon: "withdraw",
    },
  ];

  return (
    <div className="flex flex-col gap-3.5 w-full">
      {/* Wallet Address Header Card */}
      <div className="p-2.5 border border-[#DDE5F2]/80 dark:border-gray-800 rounded-[14px] bg-gray-50/50 dark:bg-gray-850">
        <button
          onClick={handleCopy}
          className="w-full bg-[#0088FF] hover:bg-[#0077EE] active:scale-[0.98] transition-all text-white h-[36px] px-3.5 rounded-full flex items-center justify-between text-xs font-mono font-medium shadow-sm"
        >
          <div className="flex items-center gap-1.5 truncate">
            <Icon name="wallet" size={16} className="shrink-0 text-white" />
            <span className="truncate">{address.length > 14 ? `${address.slice(0, 6)}...${address.slice(-4)}` : address}</span>
          </div>
          {copied ? (
            <Check className="w-3.5 h-3.5 text-white/90 shrink-0 ml-1" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-white/90 shrink-0 ml-1" />
          )}
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex flex-col gap-1 py-0.5">
        {menuItems.map((item) => {
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.path && onNavigate) onNavigate(item.path);
                if (onClose) onClose();
              }}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-[#15151F] dark:text-gray-200 transition-colors text-left group/item"
            >
              <Icon name={item.icon} size={20} className="text-gray-700 dark:text-gray-300 shrink-0 group-hover/item:text-blue-600 transition-colors" />
              <span className="text-[14px] font-medium leading-[14px] whitespace-nowrap">
                {item.title}
              </span>
            </button>
          );
        })}

        {/* 语言选项 */}
        <div className="relative group/lang">
          <button
            onClick={() => setMobileLangExpand((prev) => !prev)}
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-[#15151F] dark:text-gray-200 transition-colors text-left group/item"
          >
            <div className="flex items-center gap-2.5 shrink-0">
              <Icon name="global" size={20} className="text-gray-700 dark:text-gray-300 shrink-0 group-hover/item:text-blue-600 transition-colors" />
              <span className="text-[14px] font-medium leading-[14px] whitespace-nowrap">
                语言 TH/EN
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400 shrink-0 ml-2">
              <span className="font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap">{currentLanguage.code.toUpperCase()}</span>
              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${mobileLangExpand ? "rotate-90 md:rotate-0" : ""}`} />
            </div>
          </button>

          {/* PC 端 Hover 展开右侧/左侧 Flyout 悬浮面板 */}
          <div className="hidden md:block absolute right-full top-0 mr-2 pr-1 opacity-0 invisible group-hover/lang:opacity-100 group-hover/lang:visible transition-all duration-200 z-50">
            <div className="w-[140px] bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[14px] p-1.5 shadow-xl flex flex-col gap-1">
              {supportedLanguages.map((lang) => (
                <button
                  key={lang.locale}
                  onClick={() => {
                    setLanguage(lang.locale);
                    if (onClose) onClose();
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                    currentLanguage.locale === lang.locale
                      ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <span className="whitespace-nowrap">{lang.language}</span>
                  {currentLanguage.locale === lang.locale && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* 手机端点击展开内部精简列表 */}
          {mobileLangExpand && (
            <div className="md:hidden flex flex-col gap-1 pl-8 py-1.5 mt-1 border-l-2 border-blue-500/20">
              {supportedLanguages.map((lang) => (
                <button
                  key={lang.locale}
                  onClick={() => {
                    setLanguage(lang.locale);
                    if (onClose) onClose();
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between ${
                    currentLanguage.locale === lang.locale
                      ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 font-bold"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  <span className="whitespace-nowrap">{lang.language}</span>
                  {currentLanguage.locale === lang.locale && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="h-[1px] bg-gray-100 dark:bg-gray-800 my-0.5" />

      {/* Logout Action */}
      <button
        onClick={() => {
          if (onLogout) onLogout();
          if (onClose) onClose();
        }}
        className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 text-[#FF6B6B] transition-colors text-left group/logout"
      >
        <Icon name="logout" size={20} className="shrink-0 text-[#FF6B6B]" />
        <span className="text-[14px] font-medium leading-[14px] whitespace-nowrap">
          退出登录
        </span>
      </button>
    </div>
  );
}

export interface UserMenuModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address?: string;
  onLogout?: () => void;
  onNavigate?: (path: string) => void;
}

export function UserMenuModal({
  open,
  onOpenChange,
  address,
  onLogout,
  onNavigate,
}: UserMenuModalProps) {
  const isMobile = useMediaQuery("(max-width: 1023px)");

  // 在 PC 大屏 (>=1024px) 上不渲染任何 Mobile 模态遮罩
  if (!isMobile) return null;

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      showClose={false}
      className="border-gray-100 dark:border-gray-800"
      contentClassName="p-4"
    >
      <UserMenuContent
        address={address}
        onLogout={onLogout}
        onNavigate={onNavigate}
        onClose={() => onOpenChange(false)}
      />
    </ResponsiveModal>
  );
}
