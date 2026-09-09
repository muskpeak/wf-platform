const { RelayClient } = require('@polymarket/builder-relayer-client');
const { ethers } = require('ethers');

async function test() {
  const provider = new ethers.providers.JsonRpcProvider('https://polygon-rpc.com');
  const wallet = ethers.Wallet.createRandom().connect(provider);
  const client = new RelayClient('https://relayer.polymarket.com', 137, wallet);

  try {
    const expected = await client.deriveDepositWalletAddress();
    console.log("Expected Deposit Wallet:", expected);

    const isDeployed = await client.getDeployed(expected, 'wallet');
    console.log("Is Deployed:", isDeployed);

    if (!isDeployed) {
        console.log("Deploying...");
        const tx = await client.deployDepositWallet();
        console.log("Deploy Tx:", tx);
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

test();
