"use client";

import { LotteryWorldView } from "@wf-platform/lottery";

export default function LottoPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#f3f4f8] flex flex-col">
      <LotteryWorldView />
    </div>
  );
}
