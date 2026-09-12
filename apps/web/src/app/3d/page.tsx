"use client";

import { Lottery3DView } from "@wf-platform/lottery";
import { useConfig } from "../../providers/ConfigProvider";
import type { Hex } from "viem";

export default function ThreeDPage() {
  const { PARTNER_CODE } = useConfig();

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#f3f4f8] flex flex-col">
      <Lottery3DView partnerCode={PARTNER_CODE as Hex} />
    </div>
  );
}
