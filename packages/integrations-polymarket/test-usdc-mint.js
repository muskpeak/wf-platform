const { ethers } = require("ethers");
async function check() {
  const provider = new ethers.providers.JsonRpcProvider("https://rpc-amoy.polygon.technology/");
  const address = "0x9c4e1703476e875070ee25b56a58b008cfb8fa78"; // Amoy testnet USDC
  const code = await provider.getCode(address);
  // Just dump the first few bytes to see if it's a contract
  console.log("Code length:", code.length);
}
check();
