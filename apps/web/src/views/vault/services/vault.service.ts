/**
 * Vault Service
 * 充值/提现跨链逻辑，临时使用 dat-dapp 后端配置接口（apiType: "dat"）
 * 跨链执行走 Relay API（apiType: "relay"，由 ConfigProvider 注册）
 */

import { apiClient } from "@wf-platform/api";
import type { QuoteData, VaultChain, VaultToken } from "./vault.types";

const VAULT_INTENT_TERMINAL_FAIL = new Set(["failure"]);
const VAULT_INTENT_TERMINAL_OK = new Set(["success", "refunded"]);

class VaultService {
  // ─── 工具：后端数据 → VaultChain ─────────────────────────────
  private mapBackendToVaultChain(backend: any): VaultChain {
    const tokens: VaultToken[] = (backend.tokens || []).map((t: any) => {
      let normalizedAddress =
        t.token_address || t.tokenAddress || t.address || t.tokenId;
      const lowerId = (t.tokenId || "").toLowerCase();
      if (normalizedAddress && !normalizedAddress.startsWith("0x")) {
        if (lowerId === "eth" || lowerId === "native") {
          normalizedAddress = "0x0000000000000000000000000000000000000000";
        }
      }
      const symbol = t.token_symbol || t.tokenSymbol || t.symbol || "";
      const isStable =
        symbol.toUpperCase().includes("USDC") ||
        symbol.toUpperCase().includes("USDT");
      const rawDec =
        t.decimals !== undefined && t.decimals !== null
          ? Number(t.decimals)
          : undefined;
      const decimals = rawDec && rawDec > 0 ? rawDec : isStable ? 6 : 18;
      return {
        address: normalizedAddress,
        symbol,
        decimals,
        metadata: { logoURI: t.token_logo || t.tokenLogo || t.logo },
        logoURI: t.token_logo || t.tokenLogo || t.logo,
        minAmount: t.min_amount || t.minAmount,
        refundTo: t.refundTo,
        recommended: t.recommended,
      };
    });

    return {
      id: backend.chain_id || backend.chainId,
      name: backend.chain_name || backend.chainName,
      displayName: backend.chain_name || backend.chainName,
      iconUrl: backend.chain_logo || backend.chainLogo,
      depositEnabled: true,
      featuredTokens: tokens,
      solverCurrencies: tokens,
    };
  }

  // ─── 充值配置（临时走 dat apiType）────────────────────────────
  async getDepositConfig(): Promise<VaultChain[]> {
    const data = await apiClient.get<any>("/client/api/v1/deposit/config", {
      apiType: "dat",
    });
    if (!data || !Array.isArray(data)) return [];
    if (data.length > 0 && data[0].asset_code) {
      const usdcConfig = data.find((i: any) => i.asset_code === "USDC");
      const chains = usdcConfig ? usdcConfig.chains : [];
      return chains.map((c: any) => this.mapBackendToVaultChain(c));
    }
    return data.map((c: any) => this.mapBackendToVaultChain(c));
  }

  // ─── 提现配置（临时走 dat apiType）────────────────────────────
  async getWithdrawConfig(): Promise<Record<string, VaultChain[]>> {
    const data = await apiClient.get<any>("/client/api/v1/withdraw/config", {
      apiType: "dat",
    });
    const result: Record<string, VaultChain[]> = { USDC: [], DAT: [] };
    if (!data || !Array.isArray(data)) return result;
    if (data.length > 0 && (data[0].asset_code || data[0].assetCode)) {
      data.forEach((item: any) => {
        const code = (item.asset_code || item.assetCode || "").toUpperCase();
        if (code) {
          result[code] = (item.chains || []).map((c: any) =>
            this.mapBackendToVaultChain(c)
          );
        }
      });
      return result;
    }
    result.USDC = data.map((c: any) => this.mapBackendToVaultChain(c));
    return result;
  }

  // ─── Relay: 询价 ───────────────────────────────────────────────
  async getQuote(
    body: Record<string, unknown>,
    signal?: AbortSignal
  ): Promise<QuoteData> {
    return apiClient.post<QuoteData>("/quote/v2", body, {
      apiType: "relay",
      signal,
    });
  }

  // ─── Relay: 轮询充值状态（Deposit Address 模式）────────────────
  async getDepositStatus(
    depositAddress: string,
    userAddress: string,
    signal?: AbortSignal
  ): Promise<{ status: "success" | "pending" | "failure"; requestId?: string } | null> {
    const data = await apiClient.get<any>("/requests/v2", {
      apiType: "relay",
      params: { user: userAddress, depositAddress },
      signal,
    });
    const requests: any[] = data?.requests || [];
    if (requests.length > 0) {
      const latest = requests[0];
      if (latest.status === "success")
        return { status: "success", requestId: latest.id };
      if (latest.status === "failure" || latest.status === "refunded")
        return { status: "failure", requestId: latest.id };
    }
    return { status: "pending" };
  }

  // ─── Relay: 解析 QuoteData 拿到 depositAddress ────────────────
  extractDepositFromQuote(data: QuoteData): {
    depositAddress: string | null;
    requestId: string | null;
  } {
    for (const s of data?.steps || []) {
      if (s.depositAddress) {
        return {
          depositAddress: s.depositAddress,
          requestId: s.requestId ?? null,
        };
      }
    }
    return { depositAddress: null, requestId: null };
  }

  // ─── Relay: 轮询跨链 Intent 直到终态 ──────────────────────────
  async pollIntentUntilDone(
    checkEndpoint: string,
    baseUrl: string,
    options?: { intervalMs?: number; timeoutMs?: number }
  ): Promise<void> {
    const intervalMs = options?.intervalMs ?? 3000;
    const timeoutMs = options?.timeoutMs ?? 6 * 60_000;
    let url = checkEndpoint.trim();
    if (!url.startsWith("http")) {
      url = `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
    }
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      try {
        const res = await fetch(url);
        const d = await res.json();
        const status = d?.status ? String(d.status) : "";
        if (VAULT_INTENT_TERMINAL_FAIL.has(status))
          throw new Error(`Vault processing failed: ${status}`);
        if (VAULT_INTENT_TERMINAL_OK.has(status)) return;
      } catch (e: any) {
        if (e.message?.includes("Vault processing failed")) throw e;
      }
      await new Promise((r) => setTimeout(r, intervalMs));
    }
    throw new Error("Vault status check timed out.");
  }

  // ─── 工具：获取链的可用代币 ────────────────────────────────────
  getOriginTokens(chain?: VaultChain | null): VaultToken[] {
    if (!chain) return [];
    return chain.featuredTokens || chain.solverCurrencies || [];
  }
}

export const vaultService = new VaultService();
