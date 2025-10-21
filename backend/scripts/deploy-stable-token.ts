import { parseEther, formatEther, parseUnits } from "viem";
import hre from "hardhat";
import fs from "fs";

async function main() {
  console.log("🚀 Deploying HappyPaisaTokenStable...");
  console.log("=" * 50);

  // Get deployment account
  const [deployer] = await hre.viem.getWalletClients();
  const deployerAddress = deployer.account?.address;
  
  console.log("📋 Deployment Details:");
  console.log(`   Deployer: ${deployerAddress}`);
  console.log(`   Network: ${hre.network.name}`);

  // USDT addresses for different networks
  const usdtAddresses: Record<string, string> = {
    bscMainnet: "0x55d398326f99059fF775485246999027B3197955", // BSC USDT
    sepolia: "0x7169D38820dfd117C3FA1f22a697dBA58d90BA06", // Sepolia USDT (example)
    hardhat: "0x0000000000000000000000000000000000000000", // Mock for local testing
  };

  const usdtAddress = usdtAddresses[hre.network.name];
  if (!usdtAddress) {
    throw new Error(`USDT address not configured for network: ${hre.network.name}`);
  }

  console.log(`   USDT Address: ${usdtAddress}`);
  console.log();

  try {
    // Deploy the contract
    console.log("📦 Deploying contract...");
    const happyPaisaTokenStable = await hre.viem.deployContract(
      "HappyPaisaTokenStable",
      [usdtAddress],
      {
        // Add some extra gas for BSC
        ...(hre.network.name === "bscMainnet" && {
          gasPrice: parseUnits("5", "gwei"), // 5 gwei
        }),
      }
    );

    const contractAddress = happyPaisaTokenStable.address;
    console.log(`✅ Contract deployed to: ${contractAddress}`);

    // Get deployment transaction
    const publicClient = await hre.viem.getPublicClient();
    const deploymentReceipt = await publicClient.getTransactionReceipt({
      hash: happyPaisaTokenStable.deploymentTransaction?.hash!,
    });

    console.log(`   Block: ${deploymentReceipt.blockNumber}`);
    console.log(`   Gas Used: ${deploymentReceipt.gasUsed.toLocaleString()}`);
    console.log(`   Transaction: ${deploymentReceipt.transactionHash}`);
    console.log();

    // Get contract info
    console.log("📊 Contract Information:");
    const contractInfo = await happyPaisaTokenStable.read.getContractStatus();
    console.log(`   Token Name: Happy Paisa Token Stable`);
    console.log(`   Token Symbol: HP`);
    console.log(`   Target Peg: 11 USDT`);
    console.log(`   Base Collateral Ratio: 105%`);
    console.log(`   Mint Fee: 0% (Fee-Free!)`);
    console.log(`   Burn Fee: 0% (Fee-Free!)`);
    console.log();

    // Save deployment information
    const deploymentInfo = {
      network: hre.network.name,
      contractName: "HappyPaisaTokenStable",
      contractAddress: contractAddress,
      deployerAddress: deployerAddress,
      usdtAddress: usdtAddress,
      deploymentTime: new Date().toISOString(),
      txHash: deploymentReceipt.transactionHash,
      blockNumber: deploymentReceipt.blockNumber.toString(),
      gasUsed: deploymentReceipt.gasUsed.toString(),
      features: {
        targetPeg: "11 USDT",
        dynamicPeg: true,
        dynamicCollateralRatio: true,
        stabilityMechanisms: true,
        mintBurnOnly: true,
        noSwapFunctionality: true,
        feeFree: true,
        zeroMintFee: true,
        zeroBurnFee: true,
      },
    };

    const filename = `deployment-stable-${hre.network.name}-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
    console.log(`💾 Deployment info saved to: ${filename}`);

    // Display next steps
    console.log();
    console.log("🎯 Next Steps:");
    console.log("1. Verify the contract on BSC Scan");
    console.log("2. Set up initial stability fund");
    console.log("3. Test mint/burn functionality");
    console.log("4. Monitor peg stability");
    console.log();

    // Example interactions
    console.log("💡 Example Usage:");
    console.log("// Calculate cost to mint 1 HP token");
    console.log(`const mintCost = await contract.read.calculateMintCost([parseEther("1")]);`);
    console.log();
    console.log("// Mint 1 HP token");
    console.log(`await contract.write.mintTokens([parseEther("1")]);`);
    console.log();
    console.log("// Burn 1 HP token");
    console.log(`await contract.write.burnTokens([parseEther("1")]);`);
    console.log();

    // Stability monitoring
    console.log("📈 Stability Monitoring:");
    console.log("Monitor these functions for peg stability:");
    console.log("- getCurrentEffectivePeg()");
    console.log("- getCurrentCollateralRatio()");
    console.log("- getContractStatus()");
    console.log();

    return {
      contractAddress,
      deploymentInfo,
    };

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

// Deploy if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default main;