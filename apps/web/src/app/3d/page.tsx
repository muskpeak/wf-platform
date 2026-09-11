"use client";

import { Lottery3DView } from "@wf-platform/lottery";

export default function ThreeDPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#f3f4f8] flex flex-col">
      <Lottery3DView />
    </div>
  );
}
