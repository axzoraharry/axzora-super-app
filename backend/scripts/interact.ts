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

async function main() {
    console.log("🔧 Happy Paisa Token Interaction Script");
    console.log("======================================");
    
    // Load deployment info
    const deploymentPath = path.join(__dirname, "../deployment.json");
    if (!fs.existsSync(deploymentPath)) {
        console.error("❌ Deployment file not found. Please deploy the contract first.");
        return;
    }
    
    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    const contractAddress = deploymentInfo.contractAddress;
    
    // Load environment variables
    const rpcUrl = process.env.BSC_RPC_URL || "https://bsc-dataseed1.binance.org";
    const privateKey = process.env.BSC_PRIVATE_KEY;
    
    if (!privateKey) {
        console.error("❌ Error: BSC_PRIVATE_KEY not found in environment variables");
        return;
    }
    
    // Setup provider and wallet
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    
    // Load contract
    const contractArtifact = JSON.parse(
        fs.readFileSync(
            path.join(__dirname, "../artifacts/contracts/HappyPaisaToken.sol/HappyPaisaToken.json"),
            "utf8"
        )
    );
    
    const contract = new ethers.Contract(contractAddress, contractArtifact.abi, wallet);
    const usdtContract = new ethers.Contract(
        deploymentInfo.usdtAddress, 
        [
            "function balanceOf(address) view returns (uint256)",
            "function approve(address spender, uint256 amount) returns (bool)",
            "function allowance(address owner, address spender) view returns (uint256)"
        ], 
        wallet
    );
    
    console.log("📍 Contract Address:", contractAddress);
    console.log("👤 Interacting as:", wallet.address);
    
    try {
        // Display current contract state
        const contractInfo = await contract.getContractInfo();
        const isOwner = (await contract.owner()).toLowerCase() === wallet.address.toLowerCase();
        const usdtBalance = await usdtContract.balanceOf(wallet.address);
        const hpBalance = await contract.balanceOf(wallet.address);
        
        console.log("\\n📊 Current State:");
        console.log("- Total HP Supply:", ethers.formatEther(contractInfo.totalSupplyHP), "HP");
        console.log("- Total USDT Collateral:", ethers.formatUnits(contractInfo.totalCollateralUSDT, 6), "USDT");
        console.log("- Reserve Ratio:", contractInfo.currentReserveRatio.toString(), "%");
        console.log("- Collateralization Ratio:", contractInfo.currentCollateralizationRatio.toString(), "%");
        console.log("- Your USDT Balance:", ethers.formatUnits(usdtBalance, 6), "USDT");
        console.log("- Your HP Balance:", ethers.formatEther(hpBalance), "HP");
        console.log("- Are you owner?", isOwner ? "✅ Yes" : "❌ No");
        
        // Menu for actions
        console.log("\\n🎛️  Available Actions:");
        console.log("1. 📥 Deposit USDT Collateral (Owner only)");
        console.log("2. 🪙 Mint HP Tokens");
        console.log("3. 🔥 Burn HP Tokens");
        console.log("4. 💰 Calculate Required Collateral");
        console.log("5. 📊 View Contract Info");
        console.log("6. 🔍 Check Allowances");
        
        if (isOwner) {
            console.log("\\n👑 Owner Actions:");
            console.log("7. 📤 Withdraw Excess Collateral");
            console.log("8. ⚙️  Update Reserve Ratio");
            console.log("9. ⏸️  Pause/Unpause Contract");
        }
        
        // Example operations (comment out what you don't want to execute)
        
        // Example 1: Deposit 96 USDT as collateral (Owner only)
        if (isOwner) {
            console.log("\\n🔄 Example: Depositing 96 USDT as collateral...");
            const depositAmount = ethers.parseUnits("96", 6); // 96 USDT
            
            // Check if we need to approve
            const allowance = await usdtContract.allowance(wallet.address, contractAddress);
            if (allowance < depositAmount) {
                console.log("📝 Approving USDT spending...");
                const approveTx = await usdtContract.approve(contractAddress, depositAmount);
                await approveTx.wait();
                console.log("✅ USDT approved");
            }
            
            console.log("💰 Depositing collateral...");
            const depositTx = await contract.depositCollateral(depositAmount);
            await depositTx.wait();
            console.log("✅ Collateral deposited successfully!");
        }
        
        // Example 2: Calculate how much USDT needed to mint 1 HP
        console.log("\\n🧮 Calculation Examples:");
        const oneHP = ethers.parseEther("1"); // 1 HP token
        const requiredCollateral = await contract.calculateCollateralNeeded(oneHP);
        console.log("- To mint 1 HP token, you need:", ethers.formatUnits(requiredCollateral, 6), "USDT");
        
        const tenHP = ethers.parseEther("10"); // 10 HP tokens
        const requiredForTen = await contract.calculateCollateralNeeded(tenHP);
        console.log("- To mint 10 HP tokens, you need:", ethers.formatUnits(requiredForTen, 6), "USDT");
        
        // Display rate information
        console.log("\\n💱 Rate Information:");
        console.log("- 1 HP = 11 USDT (base rate)");
        console.log("- Current reserve ratio requires 10% extra collateral");
        console.log("- So to mint 1 HP (worth 11 USDT), you need 12.1 USDT");
        
        console.log("\\n✅ Interaction completed!");
        
    } catch (error) {
        console.error("❌ Error:", error);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});