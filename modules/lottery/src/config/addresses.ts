import { polygon } from 'viem/chains';



/**
 * 第三方彩票 World Lotto 专用合约地址 (UMA版, Polygon Mock)
 */
export const WORLD_LOTTO_ADDRESSES = {
  [polygon.id]: {
    rounds: "0x9276F34f332d83e87Ee1810dd54237c732759420" as `0x${string}`,
    settlement: "0xBCf4CeBD48e59335B8bbB58e8721506a3D63b8B8" as `0x${string}`,
  },
};

/**
 * 第三方彩票 Lotto 3D 专用合约地址 (VRF版, Polygon Mock)
 */
export const LOTTO_3D_ADDRESSES = {
  [polygon.id]: {
    game: "0x18595d711ED9f58991ddb8cEA8B10032a56f600d" as `0x${string}`,
    treasury: "0xa23370702EA2386ac7eCC814F5030A23AD4F26CA" as `0x${string}`,
    vrfAdapter: "0x54C5F9933d5E98C9cD5A428B5c64C7854C32b0D4" as `0x${string}`,
  },
};

/**
 * 第三方彩票出入金合约地址 (来自 THIRD_PARTY_FUNDING_INTEGRATION_GUIDE.md)
 */
export const FUNDING_ADDRESSES = {
  [polygon.id]: {
    mUSDC: "0xc65577f875eBA302e4Ba5cDF429351b0Ce00A8bF" as `0x${string}`,
    unifiedLedger: "0xC93f8062932bAFA24832B427d29A505395bc759D" as `0x${string}`,
    stablecoinReserve: "0x68B6bf1EE6c464562A7296687a98cE40e334072C" as `0x${string}`,
  },
  // 可以预留其他链，比如 BSC
};

