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
const USDT_BSC_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";

async function main() {
    console.log("🥞 PancakeSwap HP/USDT Liquidity Addition Script");
    console.log("================================================");
    
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
    
    // USDT contract
    const usdtContract = new ethers.Contract(
        USDT_BSC_ADDRESS,
        [
            "function balanceOf(address) view returns (uint256)",
            "function approve(address spender, uint256 amount) returns (bool)",
            "function allowance(address owner, address spender) view returns (uint256)"
        ],
        wallet
    );
    
    // PancakeSwap Router contract
    const routerABI = [
        "function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB, uint liquidity)",
        "function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)",
        "function factory() external pure returns (address)"
    ];
    
    const router = new ethers.Contract(PANCAKESWAP_ROUTER, routerABI, wallet);
    
    console.log("📍 HP Token Address:", contractAddress);
    console.log("📍 USDT Address:", USDT_BSC_ADDRESS);
    console.log("👤 Adding liquidity as:", wallet.address);
    
    try {
        // Check current balances
        const hpBalance = await hpContract.balanceOf(wallet.address);
        const usdtBalance = await usdtContract.balanceOf(wallet.address);
        
        console.log("\\n📊 Current Balances:");
        console.log("- Your HP Balance:", ethers.formatEther(hpBalance), "HP");
        console.log("- Your USDT Balance:", ethers.formatUnits(usdtBalance, 6), "USDT");
        
        // Set liquidity amounts - Creating proper 1:11 ratio (1 HP = 11 USDT)
        const hpToAdd = "1.0";  // 1 HP token
        const usdtToAdd = "11.0"; // 11 USDT (maintaining the peg ratio)
        
        const hpAmount = ethers.parseEther(hpToAdd);
        const usdtAmount = ethers.parseUnits(usdtToAdd, 6);
        
        console.log("\\n💰 Liquidity Addition Details:");
        console.log("- HP Tokens to add:", hpToAdd, "HP");
        console.log("- USDT to add:", usdtToAdd, "USDT");
        console.log("- Ratio: 1 HP = 11 USDT (maintaining your peg!)");
        
        // Check if user has enough tokens
        if (hpBalance < hpAmount) {
            console.error("❌ Insufficient HP balance!");
            console.log("- You have:", ethers.formatEther(hpBalance), "HP");
            console.log("- You need:", hpToAdd, "HP");
            console.log("\\n💡 Mint more HP tokens first:");
            console.log("npx hardhat run scripts/mint-hp-tokens.ts --network bscMainnet");
            return;
        }
        
        if (usdtBalance < usdtAmount) {
            console.error("❌ Insufficient USDT balance!");
            console.log("- You have:", ethers.formatUnits(usdtBalance, 6), "USDT");
            console.log("- You need:", usdtToAdd, "USDT");
            return;
        }
        
        // Approve HP tokens for router
        console.log("\\n📝 Approving HP tokens for PancakeSwap...");
        const hpApproveTx = await hpContract.approve(PANCAKESWAP_ROUTER, hpAmount);
        console.log("⏳ Waiting for HP approval transaction...");
        await hpApproveTx.wait();
        console.log("✅ HP tokens approved");
        
        // Approve USDT tokens for router
        console.log("\\n📝 Approving USDT tokens for PancakeSwap...");
        const usdtApproveTx = await usdtContract.approve(PANCAKESWAP_ROUTER, usdtAmount);
        console.log("⏳ Waiting for USDT approval transaction...");
        await usdtApproveTx.wait();
        console.log("✅ USDT tokens approved");
        
        // Add liquidity
        console.log("\\n🏊 Adding HP/USDT liquidity to PancakeSwap...");
        const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from now
        
        const addLiquidityTx = await router.addLiquidity(
            contractAddress,    // tokenA (HP)
            USDT_BSC_ADDRESS,  // tokenB (USDT)
            hpAmount,          // amountADesired
            usdtAmount,        // amountBDesired
            0,                 // amountAMin (set to 0 for simplicity, not recommended for mainnet)
            0,                 // amountBMin (set to 0 for simplicity, not recommended for mainnet)
            wallet.address,    // to
            deadline           // deadline
        );
        
        console.log("⏳ Waiting for liquidity addition transaction...");
        const receipt = await addLiquidityTx.wait();
        
        console.log("✅ HP/USDT Liquidity added successfully!");
        console.log("📍 Transaction Hash:", receipt.hash);
        console.log("🔗 View on BSCScan:", `https://bscscan.com/tx/${receipt.hash}`);
        
        console.log("\\n🎉 Your HP/USDT pair is now swappable!");
        console.log("\\n🥞 PancakeSwap Links:");
        console.log("- Trade HP/USDT:", `https://pancakeswap.finance/swap?inputCurrency=${USDT_BSC_ADDRESS}&outputCurrency=${contractAddress}`);
        console.log("- Add HP/USDT Liquidity:", `https://pancakeswap.finance/add/${USDT_BSC_ADDRESS}/${contractAddress}`);
        console.log("- Pool Info:", `https://pancakeswap.finance/info/pools`);
        
        console.log("\\n💡 Perfect Setup!");
        console.log("- 1 HP = 11 USDT on DEX (matches your peg!)");
        console.log("- Mint: 12.1 USDT → 1 HP (includes 10% reserve)");
        console.log("- Burn: 1 HP → 11 USDT");
        console.log("- DEX: 1 HP ↔ 11 USDT (perfect arbitrage setup)");
        
        console.log("\\n🎯 Arbitrage Opportunities:");
        console.log("- If DEX price > 11 USDT: Users mint cheap, sell expensive");
        console.log("- If DEX price < 11 USDT: Users buy cheap, burn for 11 USDT");
        console.log("- This keeps your token stable around 11 USDT!");
        
    } catch (error) {
        console.error("❌ Error:", error);
        
        // Common error handling
        if (error.message.includes("INSUFFICIENT_A_AMOUNT")) {
            console.log("💡 Try adjusting the HP token amount");
        } else if (error.message.includes("INSUFFICIENT_B_AMOUNT")) {
            console.log("💡 Try adjusting the USDT amount");
        } else if (error.message.includes("IDENTICAL_ADDRESSES")) {
            console.log("💡 Token addresses cannot be identical");
        }
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});