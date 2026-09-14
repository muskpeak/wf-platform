import { formatUnits } from "viem";

/**
 * Pure client-side mirror of the deployed prize-tier math.
 * 1:1 ported from official frontend: /wf-frontend/frontend/lib/prizeMath.ts
 */

export function lotto7Tier(ticket: number, winning: number): number {
  const ticketDigits = String(Math.max(0, ticket)).padStart(7, "0").slice(-7);
  const winningDigits = String(Math.max(0, winning)).padStart(7, "0").slice(-7);

  let leading = 0;
  while (leading < 7 && ticketDigits[leading] === winningDigits[leading]) leading += 1;
  if (leading === 7) return 1;
  if (leading === 6) return 2;
  if (leading === 5) return 3;

  for (const window of [4, 3]) {
    for (let ticketStart = 0; ticketStart <= 7 - window; ticketStart += 1) {
      for (let winningStart = 0; winningStart <= 7 - window; winningStart += 1) {
        if (ticketDigits.slice(ticketStart, ticketStart + window) === winningDigits.slice(winningStart, winningStart + window)) {
          return window === 4 ? 4 : 5;
        }
      }
    }
  }
  return 0;
}

function lotto3dDigits(value: number): [number, number, number] {
  const normalized = Math.max(0, Math.floor(value)) % 1000;
  return [Math.floor(normalized / 100), Math.floor(normalized / 10) % 10, normalized % 10];
}

function comboKey(value: number): string {
  return lotto3dDigits(value).sort((a, b) => a - b).join("");
}

export function lotto3dTier(ticket: number, winning: number): number {
  if (ticket === winning) return 1;
  if (new Set(lotto3dDigits(winning)).size !== 1 && comboKey(ticket) === comboKey(winning)) return 2;

  const ticketDigits = lotto3dDigits(ticket);
  const winningDigits = lotto3dDigits(winning);
  let matches = 0;
  for (let i = 0; i < 3; i += 1) {
    if (ticketDigits[i] === winningDigits[i]) matches += 1;
  }
  return matches >= 2 ? 3 : 0;
}

/** 格式化代币数量（统一为 2 位小数） */
export function formatTokenAmount(value: bigint | undefined, decimals: number = 6, maxFractionDigits = 2): string {
  if (value === undefined) return "—";
  const full = formatUnits(value, decimals);
  const [whole, frac = ""] = full.split(".");
  const groupedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  if (maxFractionDigits === 0 || !frac) return groupedWhole;
  return `${groupedWhole}.${frac.slice(0, maxFractionDigits).padEnd(Math.min(maxFractionDigits, frac.length), "0")}`;
}

export function padNumber(value: number | bigint | string, digits: number): string {
  return String(value).padStart(digits, "0");
}
