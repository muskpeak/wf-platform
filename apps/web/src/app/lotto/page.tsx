"use client";

import { LotteryWorldView } from "@wf-platform/lottery";
import { useConfig } from "../../providers/ConfigProvider";
import type { Hex } from "viem";

export default function LottoPage() {
  const { PARTNER_CODE } = useConfig();

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#f3f4f8] flex flex-col">
      <LotteryWorldView partnerCode={PARTNER_CODE as Hex} />
    </div>
  );
}
