"use client";

import React, { createContext, useContext, ReactNode, useMemo } from "react";
import { ClientConfig } from "../config/env";
import { apiClient } from "@wf-platform/api";

const ConfigContext = createContext<ClientConfig | null>(null);

export function ConfigProvider({
  config,
  children,
}: {
  config: ClientConfig;
  children: ReactNode;
}) {
  useMemo(() => {
    if (config) {
      apiClient.setEndpoints({
        default: config.NEXT_API_BASE_URL || "",
        lottery: config.LOTTERY_API_URL || "",
      });
    }
  }, [config]);

  return (
    <ConfigContext.Provider value={config}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig(): ClientConfig {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error("useConfig must be used within a ConfigProvider");
  }
  return context;
}
