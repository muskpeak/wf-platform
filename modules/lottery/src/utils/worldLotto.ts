import {
  encodeAbiParameters,
  encodeFunctionData,
  keccak256,
  stringToHex,
  zeroHash,
  type Address,
  type Hex,
} from "viem";

export type PurchaseRequestV4 = {
  owner: Address;
  game: Address;
  beneficiary: Address;
  amount: bigint;
  purchaseDataHash: Hex;
  wfOrderId: Hex;
  partnerCode: Hex;
  nonce: bigint;
  deadline: number;
};

export type BuildPurchaseRequestV4Parameters = Omit<
  PurchaseRequestV4,
  "purchaseDataHash" | "wfOrderId" | "partnerCode"
> & {
  purchaseData: Hex;
  wfOrderId?: Hex;
  partnerCode?: Hex;
};

export function buildPurchaseRequestV4(
  parameters: BuildPurchaseRequestV4Parameters,
): PurchaseRequestV4 {
  if (parameters.amount <= 0n) throw new Error("Purchase amount must be greater than zero");
  if (parameters.nonce < 0n) throw new Error("Purchase nonce cannot be negative");
  if (!Number.isSafeInteger(parameters.deadline) || parameters.deadline <= 0 || parameters.deadline > 0xffffffffffff) {
    throw new Error("Purchase deadline must fit uint48");
  }
  const wfOrderId = parameters.wfOrderId ?? zeroHash;
  const partnerCode = parameters.partnerCode ?? zeroHash;
  if ((wfOrderId === zeroHash) !== (partnerCode === zeroHash)) {
    throw new Error("wfOrderId and partnerCode must both be zero or both be non-zero");
  }

  return {
    owner: parameters.owner,
    game: parameters.game,
    beneficiary: parameters.beneficiary,
    amount: parameters.amount,
    purchaseDataHash: keccak256(parameters.purchaseData),
    wfOrderId,
    partnerCode,
    nonce: parameters.nonce,
    deadline: parameters.deadline,
  };
}

export function buildPartnerWfOrderId(parameters: {
  chainId: number;
  ledger: Address;
  partnerCode: Hex;
  localOrderId: string;
  owner: Address;
  nonce: bigint;
}): Hex {
  if (!Number.isSafeInteger(parameters.chainId) || parameters.chainId <= 0) throw new Error("chainId must be positive");
  if (parameters.partnerCode === zeroHash) throw new Error("partnerCode cannot be zero");
  if (!parameters.localOrderId.trim()) throw new Error("localOrderId cannot be empty");
  if (parameters.nonce < 0n) throw new Error("nonce cannot be negative");
  return keccak256(encodeAbiParameters(
    [
      { type: "uint256" },
      { type: "address" },
      { type: "bytes32" },
      { type: "bytes32" },
      { type: "address" },
      { type: "uint256" },
    ],
    [
      BigInt(parameters.chainId),
      parameters.ledger,
      parameters.partnerCode,
      keccak256(stringToHex(parameters.localOrderId)),
      parameters.owner,
      parameters.nonce,
    ],
  ));
}

export function generateLocalOrderId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function encodeWorldLottoPurchaseData(roundId: number, numbers: readonly number[], multipliers: readonly number[]): Hex {
  return encodeAbiParameters(
    [
      { type: "uint40" },
      { type: "uint32[]" },
      { type: "uint16[]" }
    ],
    [
      roundId,
      [...numbers],
      [...multipliers]
    ]
  );
}
