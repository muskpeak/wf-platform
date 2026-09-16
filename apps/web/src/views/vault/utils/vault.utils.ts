import type { VaultChain, VaultToken, VaultFee } from "../services/vault.types";

/**
 * Normalizes a token address to lowercase for consistent comparison.
 */
export function tokenKey(addr: string | undefined): string {
  return String(addr || "").toLowerCase();
}

/**
 * Enriches a token's metadata with high-quality logo URIs from the chain's featured
 * or solver currency lists.
 */
export function enrichTokenMeta(
  t: VaultToken | undefined,
  chain: VaultChain | null,
): VaultToken | undefined {
  if (!t) return t;
  const logo =
    t.metadata?.logoURI ||
    chain?.featuredTokens?.find(
      (x) => tokenKey(x.address) === tokenKey(t.address),
    )?.metadata?.logoURI ||
    chain?.solverCurrencies?.find(
      (x) => tokenKey(x.address) === tokenKey(t.address),
    )?.metadata?.logoURI ||
    null;
  return { ...t, logoURI: logo };
}

/**
 * Filters chains that are suitable for starting a relay operation (deposit/withdraw origin).
 */
export function filterOriginChains(chains: VaultChain[]): VaultChain[] {
  return chains.filter((c) => c.depositEnabled && !c.disabled);
}

/**
 * Filters chains that can be used as a destination for a relay operation.
 */
export function filterDestinationChains(chains: VaultChain[]): VaultChain[] {
  return chains.filter((c) => !c.disabled);
}

/**
 * Extracts and enriches tokens available as origin for a given chain.
 */
export function getOriginTokens(chain: VaultChain | null): VaultToken[] {
  if (!chain?.featuredTokens?.length) return [];
  const solverAddrs = new Set(
    (chain.solverCurrencies || []).map((s) => tokenKey(s.address)),
  );

  return chain.featuredTokens
    .filter((t) => solverAddrs.has(tokenKey(t.address)))
    .map((t) => enrichTokenMeta(t, chain)!);
}

/**
 * Extracts and enriches all unique tokens available on a given chain.
 */
export function getDestinationTokens(chain: VaultChain | null): VaultToken[] {
  if (!chain) return [];
  const map = new Map<string, VaultToken>();
  const add = (t: VaultToken | undefined) => {
    if (!t?.address) return;
    const k = tokenKey(t.address);
    if (map.has(k)) return;
    const enriched = enrichTokenMeta(t, chain);
    if (enriched) map.set(k, enriched);
  };
  if (chain.currency) add(chain.currency);
  (chain.featuredTokens || []).forEach(add);
  (chain.solverCurrencies || []).forEach(add);
  return Array.from(map.values());
}

/**
 * Finds a chain by its ID.
 */
export function findChainById(
  chains: VaultChain[],
  id: string | number,
): VaultChain | null {
  const n = Number(id);
  return chains.find((c) => c.id === n) || null;
}

/**
 * Filters an array of items based on a search term.
 */
export function filterBySearch<T>(
  items: T[],
  term: string,
  getSearchText: (item: T) => string,
): T[] {
  const q = (term || "").trim().toLowerCase();
  if (!q) return items;
  const starts: T[] = [];
  const rest: T[] = [];
  for (const it of items) {
    const s = getSearchText(it).toLowerCase();
    if (s.startsWith(q)) starts.push(it);
    else if (s.includes(q)) rest.push(it);
  }
  return starts.concat(rest);
}

const FEATURED_CHAIN_IDS = new Set([
  137, 8453, 1, 42161, 10, 56, 43114, 324,
]);

/**
 * Sorts chains so that featured ones appear first, then alphabetically by name.
 */
export function sortChainsFeaturedFirst(chains: VaultChain[]): VaultChain[] {
  return chains.slice().sort((a, b) => {
    const fa = FEATURED_CHAIN_IDS.has(a.id) ? 0 : 1;
    const fb = FEATURED_CHAIN_IDS.has(b.id) ? 0 : 1;
    if (fa !== fb) return fa - fb;
    return (a.displayName || a.name || "").localeCompare(
      b.displayName || b.name || "",
    );
  });
}

const FEE_LABELS: Record<string, string> = {
  gas: "Gas 费用",
  relayer: "中继器费用",
  relayerGas: "中继器 Gas",
  relayerService: "中继服务费",
  app: "平台手续费",
  subsidized: "补贴费用",
};

/**
 * Converts a fees object into a displayable list of non-zero fee entries.
 */
export function listNonZeroFees(
  fees: Record<string, VaultFee> | undefined | null,
): { key: string; label: string; text: string }[] {
  if (!fees || typeof fees !== "object") return [];
  return Object.entries(fees)
    .map(([key, fee]) => {
      if (!fee || fee.amount === "0" || fee.amount === 0) return null;
      const sym = fee.currency?.symbol || "";
      const usd =
        fee.amountUsd != null && fee.amountUsd !== ""
          ? ` ≈ $${fee.amountUsd}`
          : "";
      return {
        key,
        label: FEE_LABELS[key] || key,
        text: `${fee.amountFormatted ?? fee.amount} ${sym}${usd}`,
      };
    })
    .filter(Boolean) as { key: string; label: string; text: string }[];
}
