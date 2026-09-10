"use client";

import React from "react";

export default function ProfilePage() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#F3F4F8] dark:bg-gray-950 p-6 md:p-10 flex flex-col items-center justify-center">
      <div className="max-w-xl w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-8 shadow-sm flex flex-col items-center text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center text-2xl font-bold">
          👤
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">个人中心</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
          WF 平台个人中心页面（待后续添加业务模块内容）
        </p>
      </div>
    </div>
  );
}
