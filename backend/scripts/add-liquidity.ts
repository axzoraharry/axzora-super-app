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

// PancakeSwap V2 Router on BSC Mainnet
const PANCAKESWAP_ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
const WBNB_ADDRESS = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";

async function main() {
    console.log("🥞 PancakeSwap Liquidity Addition Script");
    console.log("=======================================");
    
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
    
    // Load HP token contract
    const contractArtifact = JSON.parse(
        fs.readFileSync(
            path.join(__dirname, "../artifacts/contracts/HappyPaisaToken.sol/HappyPaisaToken.json"),
            "utf8"
        )
    );
    
    const hpContract = new ethers.Contract(contractAddress, contractArtifact.abi, wallet);
    
    // PancakeSwap Router contract
    const routerABI = [
        "function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)",
        "function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)",
        "function factory() external pure returns (address)",
        "function WETH() external pure returns (address)"
    ];
    
    const router = new ethers.Contract(PANCAKESWAP_ROUTER, routerABI, wallet);
    
    console.log("📍 HP Token Address:", contractAddress);
    console.log("👤 Adding liquidity as:", wallet.address);
    
    try {
        // Check current balances
        const hpBalance = await hpContract.balanceOf(wallet.address);
        const bnbBalance = await provider.getBalance(wallet.address);
        
        console.log("\\n📊 Current Balances:");
        console.log("- Your HP Balance:", ethers.formatEther(hpBalance), "HP");
        console.log("- Your BNB Balance:", ethers.formatEther(bnbBalance), "BNB");
        
        // Set liquidity amounts
        const hpToAdd = "1.0"; // 1 HP token for initial liquidity
        const bnbToAdd = "0.002"; // 0.002 BNB for initial liquidity (small amount to fit budget)
        
        const hpAmount = ethers.parseEther(hpToAdd);
        const bnbAmount = ethers.parseEther(bnbToAdd);
        
        console.log("\\n💰 Liquidity Addition Details:");
        console.log("- HP Tokens to add:", hpToAdd, "HP");
        console.log("- BNB to add:", bnbToAdd, "BNB");
        console.log("- Initial Rate: 1 HP =", (parseFloat(bnbToAdd) / parseFloat(hpToAdd)), "BNB");
        
        // Check if user has enough tokens
        if (hpBalance < hpAmount) {
            console.error("❌ Insufficient HP balance!");
            console.log("- You have:", ethers.formatEther(hpBalance), "HP");
            console.log("- You need:", hpToAdd, "HP");
            console.log("\\n💡 Mint more HP tokens first:");
            console.log("npx hardhat run scripts/mint-hp-tokens.ts --network bscMainnet");
            return;
        }
        
        if (bnbBalance < bnbAmount) {
            console.error("❌ Insufficient BNB balance!");
            console.log("- You have:", ethers.formatEther(bnbBalance), "BNB");
            console.log("- You need:", bnbToAdd, "BNB");
            return;
        }
        
        // Approve HP tokens for router
        console.log("\\n📝 Approving HP tokens for PancakeSwap...");
        const approveTx = await hpContract.approve(PANCAKESWAP_ROUTER, hpAmount);
        console.log("⏳ Waiting for approval transaction...");
        await approveTx.wait();
        console.log("✅ HP tokens approved");
        
        // Add liquidity
        console.log("\\n🏊 Adding liquidity to PancakeSwap...");
        const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from now
        
        const addLiquidityTx = await router.addLiquidityETH(
            contractAddress,           // token
            hpAmount,                 // amountTokenDesired
            0,                        // amountTokenMin (set to 0 for simplicity, not recommended for mainnet)
            0,                        // amountETHMin (set to 0 for simplicity, not recommended for mainnet)
            wallet.address,           // to
            deadline,                 // deadline
            { value: bnbAmount }      // BNB amount
        );
        
        console.log("⏳ Waiting for liquidity addition transaction...");
        const receipt = await addLiquidityTx.wait();
        
        console.log("✅ Liquidity added successfully!");
        console.log("📍 Transaction Hash:", receipt.hash);
        console.log("🔗 View on BSCScan:", `https://bscscan.com/tx/${receipt.hash}`);
        
        console.log("\\n🎉 Your HP token is now swappable!");
        console.log("\\n🥞 PancakeSwap Links:");
        console.log("- Trade HP:", `https://pancakeswap.finance/swap?outputCurrency=${contractAddress}`);
        console.log("- Add Liquidity:", `https://pancakeswap.finance/add/${contractAddress}`);
        console.log("- Pool Info:", `https://pancakeswap.finance/info/pools/${contractAddress}`);
        
        console.log("\\n💡 Important Notes:");
        console.log("- Users can now buy/sell HP tokens on PancakeSwap");
        console.log("- Price will be determined by supply/demand");
        console.log("- Original minting/burning still works for arbitrage");
        console.log("- Monitor the pool for price stability");
        
    } catch (error) {
        console.error("❌ Error:", error);
        
        // Common error handling
        if (error.message.includes("INSUFFICIENT_A_AMOUNT")) {
            console.log("💡 Try reducing the token amount or increasing BNB amount");
        } else if (error.message.includes("INSUFFICIENT_B_AMOUNT")) {
            console.log("💡 Try reducing the BNB amount or increasing token amount");
        }
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});