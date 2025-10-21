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
    console.log("🪙 Happy Paisa Token Minting Script");
    console.log("===================================");
    
    // Load deployment info
    const deploymentPath = path.join(__dirname, "../deployment.json");
    if (!fs.existsSync(deploymentPath)) {
        console.error("❌ Deployment file not found. Please deploy the contract first.");
        return;
    }
    
    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    const contractAddress = deploymentInfo.contractAddress;
    
    // Setup provider and wallet
    const rpcUrl = process.env.BSC_RPC_URL || "https://bsc-dataseed1.binance.org";
    const privateKey = process.env.BSC_PRIVATE_KEY;
    
    if (!privateKey) {
        console.error("❌ Error: BSC_PRIVATE_KEY not found in environment variables");
        return;
    }
    
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
    console.log("👤 Minting as:", wallet.address);
    
    try {
        // Check current balances
        const usdtBalance = await usdtContract.balanceOf(wallet.address);
        const hpBalance = await contract.balanceOf(wallet.address);
        const contractInfo = await contract.getContractInfo();
        
        console.log("\\n📊 Current Balances:");
        console.log("- Your USDT Balance:", ethers.formatUnits(usdtBalance, 6), "USDT");
        console.log("- Your HP Balance:", ethers.formatEther(hpBalance), "HP");
        console.log("- Contract USDT Collateral:", ethers.formatUnits(contractInfo.totalCollateralUSDT, 6), "USDT");
        console.log("- Total HP Supply:", ethers.formatEther(contractInfo.totalSupplyHP), "HP");
        
        // Ask how many HP tokens to mint
        const hpToMint = "2"; // Mint 2 HP tokens for more liquidity
        const hpAmount = ethers.parseEther(hpToMint);
        
        // Calculate required USDT
        const requiredCollateral = await contract.calculateCollateralNeeded(hpAmount);
        const requiredUSDT = ethers.formatUnits(requiredCollateral, 6);
        
        console.log("\\n💰 Minting Details:");
        console.log("- HP Tokens to mint:", hpToMint, "HP");
        console.log("- USDT required:", requiredUSDT, "USDT");
        console.log("- Rate: 1 HP = 11 USDT + 10% reserve = 12.1 USDT");
        
        // Check if user has enough USDT
        if (usdtBalance < requiredCollateral) {
            console.error("❌ Insufficient USDT balance!");
            console.log("- You have:", ethers.formatUnits(usdtBalance, 6), "USDT");
            console.log("- You need:", requiredUSDT, "USDT");
            return;
        }
        
        // Check allowance
        const allowance = await usdtContract.allowance(wallet.address, contractAddress);
        if (allowance < requiredCollateral) {
            console.log("\\n📝 Approving USDT spending...");
            const approveTx = await usdtContract.approve(contractAddress, requiredCollateral);
            console.log("⏳ Waiting for approval transaction...");
            await approveTx.wait();
            console.log("✅ USDT approved");
        }
        
        // Mint HP tokens
        console.log("\\n🪙 Minting HP tokens...");
        const mintTx = await contract.mintTokens(hpAmount);
        console.log("⏳ Waiting for minting transaction...");
        const receipt = await mintTx.wait();
        
        console.log("✅ HP tokens minted successfully!");
        console.log("📍 Transaction Hash:", receipt.hash);
        console.log("🔗 View on BSCScan:", `https://bscscan.com/tx/${receipt.hash}`);
        
        // Check new balances
        const newUsdtBalance = await usdtContract.balanceOf(wallet.address);
        const newHpBalance = await contract.balanceOf(wallet.address);
        
        console.log("\\n📊 New Balances:");
        console.log("- Your USDT Balance:", ethers.formatUnits(newUsdtBalance, 6), "USDT");
        console.log("- Your HP Balance:", ethers.formatEther(newHpBalance), "HP");
        
        console.log("\\n🎉 Success! You now have HP tokens!");
        console.log("\\n💡 Next steps:");
        console.log("- Add HP token to your wallet:", contractAddress);
        console.log("- Token Symbol: HP");
        console.log("- Decimals: 18");
        
    } catch (error) {
        console.error("❌ Error:", error);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});