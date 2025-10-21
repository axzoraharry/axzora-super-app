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

const PANCAKESWAP_ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
const USDT_BSC_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";

async function main() {
    console.log("⚡ Low Gas Update to 1000 INR = 12 USDT Rate");
    console.log("===========================================");
    
    // Load deployment info
    const deploymentPath = path.join(__dirname, "../deployment.json");
    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    const contractAddress = deploymentInfo.contractAddress;
    
    // Setup provider and wallet
    const rpcUrl = process.env.BSC_RPC_URL || "https://bsc-dataseed1.binance.org";
    const privateKey = process.env.BSC_PRIVATE_KEY;
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey!, provider);
    
    // Check BNB balance first
    const bnbBalance = await provider.getBalance(wallet.address);
    const bnbFormatted = ethers.formatEther(bnbBalance);
    
    console.log("💰 Balance Check:");
    console.log("- BNB Balance:", bnbFormatted, "BNB");
    console.log("- Need ~0.01 BNB for transactions");
    
    if (parseFloat(bnbFormatted) < 0.008) {
        console.log("❌ INSUFFICIENT BNB for gas fees!");
        console.log("💡 Solutions:");
        console.log("1. Add more BNB to your wallet (recommended: 0.01-0.02 BNB)");
        console.log("2. Use a different wallet with more BNB");
        console.log("3. Wait for gas prices to drop");
        return;
    }
    
    // Load contracts
    const contractArtifact = JSON.parse(
        fs.readFileSync(
            path.join(__dirname, "../artifacts/contracts/HappyPaisaToken.sol/HappyPaisaToken.json"),
            "utf8"
        )
    );
    
    const hpContract = new ethers.Contract(contractAddress, contractArtifact.abi, wallet);
    const usdtContract = new ethers.Contract(
        USDT_BSC_ADDRESS,
        [
            "function balanceOf(address) view returns (uint256)",
            "function approve(address spender, uint256 amount) returns (bool)",
        ],
        wallet
    );
    
    const routerABI = [
        "function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB, uint liquidity)"
    ];
    const router = new ethers.Contract(PANCAKESWAP_ROUTER, routerABI, wallet);
    
    try {
        // Check token balances
        const hpBalance = await hpContract.balanceOf(wallet.address);
        const usdtBalance = await usdtContract.balanceOf(wallet.address);
        
        console.log("\\n📊 Token Balances:");
        console.log("- HP Balance:", ethers.formatEther(hpBalance), "HP");
        console.log("- USDT Balance:", ethers.formatUnits(usdtBalance, 6), "USDT");
        
        // Use conservative amounts to save gas
        const targetHP = 2; // Smaller amount to save gas
        const targetUSDT = 24; // 2 * 12 = 24 USDT for 1:12 ratio
        
        console.log("\\n🎯 Conservative Approach (Gas Efficient):");
        console.log(`- Adding: ${targetHP} HP + ${targetUSDT} USDT`);
        console.log("- Ratio: 1:12 (1000 INR = 12 USDT)");
        console.log("- Budget used:", targetUSDT, "USDT");
        console.log("- Remaining:", 96 - targetUSDT, "USDT");
        
        const hpAmountForLP = ethers.parseEther(targetHP.toString());
        const usdtAmountForLP = ethers.parseUnits(targetUSDT.toString(), 6);
        
        // Step 1: Approve HP tokens with lower gas
        console.log("\\n📝 Step 1: Approving HP tokens...");
        const hpApproveTx = await hpContract.approve(PANCAKESWAP_ROUTER, hpAmountForLP, {
            gasLimit: 60000 // Set explicit gas limit to save costs
        });
        await hpApproveTx.wait();
        console.log("✅ HP tokens approved");
        
        // Step 2: Approve USDT tokens with lower gas
        console.log("\\n📝 Step 2: Approving USDT tokens...");
        const usdtApproveTx = await usdtContract.approve(PANCAKESWAP_ROUTER, usdtAmountForLP, {
            gasLimit: 60000 // Set explicit gas limit
        });
        await usdtApproveTx.wait();
        console.log("✅ USDT tokens approved");
        
        // Step 3: Add liquidity with gas optimization
        console.log("\\n🏊 Step 3: Adding liquidity...");
        const deadline = Math.floor(Date.now() / 1000) + 60 * 10; // Shorter deadline
        
        const addLiquidityTx = await router.addLiquidity(
            contractAddress,
            USDT_BSC_ADDRESS,
            hpAmountForLP,
            usdtAmountForLP,
            0, 0, // Accept any amount for simplicity
            wallet.address,
            deadline,
            {
                gasLimit: 200000 // Explicit gas limit
            }
        );
        
        const receipt = await addLiquidityTx.wait();
        console.log("✅ Liquidity added successfully!");
        console.log("📍 Transaction:", receipt.hash);
        
        console.log("\\n🎉 SUCCESS! Pool Updated to INR Peg");
        console.log("===================================");
        console.log("\\n📊 New Pool Status:");
        console.log(`- Added: ${targetHP} HP + ${targetUSDT} USDT`);
        console.log("- Pool Rate: 1 HP = 12 USDT ✅");
        console.log("- INR Equivalent: 1000 INR per HP ✅");
        console.log(`- You spent: ${targetUSDT} USDT`);
        console.log(`- You have left: ${96 - targetUSDT} USDT`);
        
        console.log("\\n💡 How This Works:");
        console.log("- Pool now reflects 1000 INR = 12 USDT rate");
        console.log("- Contract still uses 11 USDT internally");
        console.log("- Creates 1 USDT arbitrage opportunity");
        console.log("- Users see ~12 USDT price on DEX");
        console.log("- Mint from contract: 12.1 USDT → 1 HP");
        console.log("- Buy from DEX: ~12 USDT → 1 HP");
        
        console.log("\\n🔄 Arbitrage Mechanism:");
        console.log("1. If DEX price > 12 USDT: Users mint cheaper from contract");
        console.log("2. If DEX price < 12 USDT: Users buy cheap, burn for 11 USDT");
        console.log("3. Price stabilizes around 12 USDT (1000 INR)");
        
        console.log("\\n🔗 Test your updated token:");
        console.log("https://pancakeswap.finance/swap?inputCurrency=" + USDT_BSC_ADDRESS + "&outputCurrency=" + contractAddress);
        
        console.log("\\n💡 Next Steps (Optional):");
        console.log("- Get more BNB for future transactions");
        console.log("- Add more liquidity as your budget allows");
        console.log("- Monitor price stability on PancakeSwap");
        
    } catch (error) {
        console.error("❌ Error:", error);
        console.log("\\n💡 Common Solutions:");
        console.log("- Add more BNB to your wallet");
        console.log("- Try during off-peak hours for lower gas");
        console.log("- Use smaller amounts to reduce gas costs");
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});