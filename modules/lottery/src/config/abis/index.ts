import { registerGlobalABIs } from "@wf-platform/web3-core";
import { unifiedLedgerV4Abi } from "./unifiedLedgerV4Abi";
import { lotto3dGameAbi } from "./lotto3dGameAbi";
import { lotto7UmaRoundsAbi } from "./lotto7UmaRoundsAbi";
import { lotto7UmaSettlementAbi } from "./lotto7UmaSettlementAbi";
import { UNIFIED_LEDGER_ABI } from "./UNIFIED_LEDGER_ABI";
import { ERC20_ABI } from "./ERC20_ABI";
import { STABLECOIN_RESERVE_ABI } from "./STABLECOIN_RESERVE_ABI";
import { wusdLotto3dGameV4Abi } from "./wusdLotto3dGameV4Abi";

export * from "./unifiedLedgerV4Abi";
export * from "./lotto3dGameAbi";
export * from "./lotto7UmaRoundsAbi";
export * from "./lotto7UmaSettlementAbi";
export * from "./UNIFIED_LEDGER_ABI";
export * from "./ERC20_ABI";
export * from "./STABLECOIN_RESERVE_ABI";
export * from "./wusdLotto3dGameV4Abi";

// 统一向全局错误拦截器注册全套 ABI
registerGlobalABIs([
  unifiedLedgerV4Abi,
  lotto3dGameAbi,
  lotto7UmaRoundsAbi,
  lotto7UmaSettlementAbi,
  UNIFIED_LEDGER_ABI,
  ERC20_ABI,
  STABLECOIN_RESERVE_ABI,
  wusdLotto3dGameV4Abi,
]);

