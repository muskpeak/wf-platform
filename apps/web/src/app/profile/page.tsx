"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { ProfileView } from "../../views/profile/ProfileView";

export default function ProfilePage() {
  const router = useRouter();
  const { authenticated, ready, login } = usePrivy();

  useEffect(() => {
    // 没有登录，不能进入个人中心页面；重定向回首页并自动弹出登录框
    if (ready && !authenticated) {
      router.replace("/");
      setTimeout(() => {
        login();
      }, 100);
    }
  }, [ready, authenticated, router, login]);

  // 未登录或认证信息加载中时，严禁渲染个人中心内容
  if (!ready || !authenticated) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-[#F3F4F8] dark:bg-[#0E131F]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#008cff]/20 border-t-[#008cff] rounded-full animate-spin" />
          <p className="text-xs text-gray-500 font-medium">正在验证登录状态...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#F3F4F8] dark:bg-[#0E131F] md:py-8 md:px-8">
      <ProfileView />
    </div>
  );
}
