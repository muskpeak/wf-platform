"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { ClientConfig } from "../config/env";

const ConfigContext = createContext<ClientConfig | null>(null);

export function ConfigProvider({
  config,
  children,
}: {
  config: ClientConfig;
  children: ReactNode;
}) {
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
