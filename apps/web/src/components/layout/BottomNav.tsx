"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { BottomNav as UikitBottomNav } from "@wf-platform/uikit";
import { BOTTOM_NAV_CONFIG } from "@wf-platform/navigation";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <UikitBottomNav
      items={BOTTOM_NAV_CONFIG}
      currentPath={pathname}
      LinkComponent={Link}
    />
  );
}
