import { z } from "zod";

/**
 * Server-side Environment Variables Schema
 * Defines the strict types and validations for environment variables.
 * These variables are read directly from `process.env` on the server.
 */
const serverEnvSchema = z.object({
  // Base App Config
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  NEXT_API_BASE_URL: z.string().url().default("http://localhost:3000"),

  // Web3 Infrastructure
  CHAIN_ID: z.coerce.number().default(137),
  CHAIN_RPC_URL: z.string().url().default("https://polygon-rpc.com"),
  USDC_ADDRESS: z.string().startsWith("0x", "Must be a valid EVM address").default("0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359"),
  PRIVY_APP_ID: z.string().min(1, "PRIVY_APP_ID is required"),
  ZERODEV_PROJECT_ID: z.string().min(1, "ZERODEV_PROJECT_ID is required"),
  ZERODEV_RPC_HOST: z.string().url().default("https://rpc.zerodev.app/api/v3"),
  ALCHEMY_API_KEY: z.string().optional(),
  WALLETCONNECT_PROJECT_ID: z.string().optional(),

  // Third-Party Services & Partner Config
  LOTTERY_API_URL: z.string().url().default("https://wf.vip/backend/api/v1"),
  // 临时借用 wf pre-prod 后端的充值/提现配置接口，待正式接口上线后替换
  DAT_DAPP_API_BASE: z.string().url().default("https://pre.wfmail.org"),
  // 跨链 Relay API（Relay.link）
  RELAY_API_URL: z.string().url().default("https://api.relay.link"),
  PARTNER_CODE: z
    .string()
    .min(1, "PARTNER_CODE 不能为空")
    .startsWith("0x", "PARTNER_CODE 必须是 0x 开头的十六进制字符串"),

  // Server Secrets (Never exposed to the client)
  SESSION_SECRET: z.string().optional(),
  DATABASE_URL: z.string().url().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

/**
 * Extract and validate server-side environment variables.
 * This function should ONLY be called in Server Components.
 */
export function getServerEnv(): ServerEnv {
  return serverEnvSchema.parse({
    NODE_ENV: process.env.NODE_ENV,
    NEXT_API_BASE_URL: process.env.NEXT_API_BASE_URL,
    LOTTERY_API_URL: process.env.LOTTERY_API_URL,
    DAT_DAPP_API_BASE: process.env.DAT_DAPP_API_BASE,
    RELAY_API_URL: process.env.RELAY_API_URL,
    PARTNER_CODE: process.env.PARTNER_CODE,
    CHAIN_ID: process.env.CHAIN_ID,
    CHAIN_RPC_URL: process.env.CHAIN_RPC_URL,
    USDC_ADDRESS: process.env.USDC_ADDRESS,
    PRIVY_APP_ID: process.env.PRIVY_APP_ID,
    ZERODEV_PROJECT_ID: process.env.ZERODEV_PROJECT_ID,
    ZERODEV_RPC_HOST: process.env.ZERODEV_RPC_HOST,
    ALCHEMY_API_KEY: process.env.ALCHEMY_API_KEY,
    WALLETCONNECT_PROJECT_ID: process.env.WALLETCONNECT_PROJECT_ID,
    SESSION_SECRET: process.env.SESSION_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
  });
}

/**
 * Client Config Schema
 * This explicitly OMITs any server-side secrets. 
 * This object is safe to serialize and pass to the browser.
 */
export type ClientConfig = Omit<ServerEnv, "SESSION_SECRET" | "DATABASE_URL">;

/**
 * Filter the ServerEnv to safely inject into the browser environment.
 */
export function getClientConfig(env: ServerEnv): ClientConfig {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { SESSION_SECRET, DATABASE_URL, ...clientSafeVars } = env;
  return clientSafeVars;
}
