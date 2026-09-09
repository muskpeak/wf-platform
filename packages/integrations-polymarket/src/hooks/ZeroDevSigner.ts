import { Signer, providers, BytesLike } from "ethers";

type Provider = providers.Provider;
type TransactionRequest = providers.TransactionRequest;
type Bytes = BytesLike;

export class ZeroDevSigner extends Signer {
  private sessionClient: any;
  private aaAddress: string;

  constructor(sessionClient: any, aaAddress: string, provider?: Provider) {
    super();
    this.sessionClient = sessionClient;
    this.aaAddress = aaAddress;
    if (provider) {
      (this as any).provider = provider;
    }
  }

  getAddress(): Promise<string> {
    return Promise.resolve(this.aaAddress);
  }

  async signMessage(message: string | Bytes): Promise<string> {
    let signature = await this.sessionClient.signMessage({ message });
    console.log("Raw signMessage length:", signature.length, signature);
    
    // Strip Kernel v3 1-byte validation mode if present (0x00 for sudo)
    // Polymarket's backend strictly checks length === 132 (65 bytes hex) and returns 401 if it's 66 bytes.
    if (signature.length === 134 && signature.startsWith("0x00")) {
      signature = "0x" + signature.slice(4);
      console.log("Stripped signMessage to 65 bytes:", signature.length, signature);
    }
    
    return signature;
  }

  signTransaction(transaction: any): Promise<string> {
    throw new Error("ZeroDevSigner cannot sign transactions locally, it must send UserOperations");
  }

  connect(provider: Provider): Signer {
    return new ZeroDevSigner(this.sessionClient, this.aaAddress, provider);
  }

  async _signTypedData(domain: any, types: Record<string, Array<any>>, value: Record<string, any>): Promise<string> {
    // We delegate to viem's signTypedData via the sessionClient
    // We need to omit EIP712Domain from types as viem adds it automatically
    const cleanTypes = { ...types };
    delete cleanTypes.EIP712Domain;

    let signature = await this.sessionClient.signTypedData({
      domain,
      types: cleanTypes,
      primaryType: Object.keys(cleanTypes)[0], // usually the first type, e.g., 'Order'
      message: value,
    });
    
    console.log("Raw Kernel Signature length:", signature.length, signature);
    
    // Kernel v3 prepends a 1-byte validation mode (e.g., 0x00 for sudo).
    // If the signature is 66 bytes (134 hex chars), strip the 1-byte mode prefix
    // to yield a standard 65-byte ECDSA signature (130 hex chars).
    // Polymarket's backend strictly rejects 66-byte signatures with 401 Unauthorized.
    if (signature.length === 134 && signature.startsWith("0x00")) {
      signature = "0x" + signature.slice(4);
      console.log("Stripped signature to 65 bytes:", signature.length, signature);
    }
    
    return signature;
  }
}
