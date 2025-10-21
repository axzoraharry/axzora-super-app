import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";

// Load environment variables
dotenv.config();

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Contract addresses
const USDT_BSC_MAINNET = "0x55d398326f99059fF775485246999027B3197955";

async function main() {
    console.log("🚀 Happy Paisa Token Deployment and Setup Script");
    console.log("================================================");
    
    // Load environment variables
    const rpcUrl = process.env.BSC_RPC_URL || "https://bsc-dataseed1.binance.org";
    const privateKey = process.env.BSC_PRIVATE_KEY;
    
    if (!privateKey) {
        console.error("❌ Error: BSC_PRIVATE_KEY not found in environment variables");
        console.log("Please copy .env.example to .env and fill in your private key");
        return;
    }
    
    // Setup provider and wallet
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    
    console.log("📝 Deployment Account:", wallet.address);
    
    // Check balance
    const balance = await provider.getBalance(wallet.address);
    const balanceInBNB = ethers.formatEther(balance);
    console.log("💰 Account Balance:", balanceInBNB, "BNB");
    
    if (parseFloat(balanceInBNB) < 0.01) {
        console.error("❌ Insufficient BNB balance. Need at least 0.01 BNB for deployment");
        return;
    }
    
    // Load contract artifacts
    const contractArtifact = JSON.parse(
        fs.readFileSync(
            path.join(__dirname, "../artifacts/contracts/HappyPaisaToken.sol/HappyPaisaToken.json"),
            "utf8"
        )
    );
    
    console.log("\\n📋 Contract Details:");
    console.log("- Token Name: Happy Paisa Token (HP)");
    console.log("- Peg Rate: 1 HP = 11 USDT");
    console.log("- Collateral: USDT on BSC");
    console.log("- Reserve Ratio: 110% (10% over-collateralized)");
    
    try {
        // Deploy contract
        console.log("\\n🚀 Deploying HappyPaisaToken...");
        const contractFactory = new ethers.ContractFactory(
            contractArtifact.abi,
            contractArtifact.bytecode,
            wallet
        );
        
        const contract = await contractFactory.deploy(USDT_BSC_MAINNET);
        
        console.log("⏳ Waiting for deployment transaction...");
        await contract.waitForDeployment();
        
        const contractAddress = await contract.getAddress();
        console.log("✅ Contract deployed successfully!");
        console.log("📍 Contract Address:", contractAddress);
        
        // Save deployment info
        const deploymentInfo = {
            network: "BSC Mainnet",
            contractAddress: contractAddress,
            deployerAddress: wallet.address,
            usdtAddress: USDT_BSC_MAINNET,
            deploymentTime: new Date().toISOString(),
            txHash: contract.deploymentTransaction()?.hash
        };
        
        fs.writeFileSync(
            path.join(__dirname, "../deployment.json"),
            JSON.stringify(deploymentInfo, null, 2)
        );
        
        console.log("\\n💾 Deployment info saved to deployment.json");
        
        // Display initial contract info
        const contractInfo = await contract.getContractInfo();
        console.log("\\n📊 Initial Contract State:");
        console.log("- Total HP Supply:", ethers.formatEther(contractInfo.totalSupplyHP), "HP");
        console.log("- Total USDT Collateral:", ethers.formatUnits(contractInfo.totalCollateralUSDT, 6), "USDT");
        console.log("- Reserve Ratio:", contractInfo.currentReserveRatio.toString(), "%");
        console.log("- Owner:", await contract.owner());
        
        console.log("\\n🎉 Deployment completed successfully!");
        console.log("\\n📋 Next Steps:");
        console.log("1. Verify contract on BSCScan (optional)");
        console.log("2. Transfer 100 USDT to the contract for initial collateral");
        console.log("3. Use depositCollateral() function to add USDT backing");
        console.log("4. Users can then mint HP tokens using mintTokens() function");
        
        // Display useful commands
        console.log("\\n🛠️  Useful Contract Interaction Commands:");
        console.log(`npx hardhat run scripts/interact.ts --network bscMainnet`);
        
    } catch (error) {
        console.error("❌ Deployment failed:", error);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});