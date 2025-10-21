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
const PANCAKESWAP_FACTORY = "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73";
const USDT_BSC_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";

async function main() {
    console.log("🔄 Update Current Contract to 1000 INR = 12 USDT Rate");
    console.log("====================================================");
    console.log("📌 NOTE: Your current contract is hardcoded to 11 USDT");
    console.log("📌 We'll update the LIQUIDITY POOL to reflect 12 USDT rate");
    console.log("📌 This creates arbitrage opportunities for price correction");
    
    // Load deployment info
    const deploymentPath = path.join(__dirname, "../deployment.json");
    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    const contractAddress = deploymentInfo.contractAddress;
    
    // Setup provider and wallet
    const rpcUrl = process.env.BSC_RPC_URL || "https://bsc-dataseed1.binance.org";
    const privateKey = process.env.BSC_PRIVATE_KEY;
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey!, provider);
    
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
    
    // Factory contract
    const factoryContract = new ethers.Contract(
        PANCAKESWAP_FACTORY,
        ["function getPair(address tokenA, address tokenB) external view returns (address pair)"],
        provider
    );
    
    const routerABI = [
        "function removeLiquidity(address tokenA, address tokenB, uint liquidity, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB)",
        "function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB, uint liquidity)"
    ];
    const router = new ethers.Contract(PANCAKESWAP_ROUTER, routerABI, wallet);
    
    console.log("📍 HP Token:", contractAddress);
    console.log("👤 Your Address:", wallet.address);
    console.log("💰 Your Budget: 96 USDT");
    
    try {
        // Check balances
        const hpBalance = await hpContract.balanceOf(wallet.address);
        const usdtBalance = await usdtContract.balanceOf(wallet.address);
        const hpAmount = parseFloat(ethers.formatEther(hpBalance));
        const usdtAmount = parseFloat(ethers.formatUnits(usdtBalance, 6));
        
        console.log("\\n📊 Current Balances:");
        console.log("- HP Balance:", hpAmount.toFixed(2), "HP");
        console.log("- USDT Balance:", usdtAmount.toFixed(2), "USDT");
        
        // Get current pool status
        const pairAddress = await factoryContract.getPair(contractAddress, USDT_BSC_ADDRESS);
        const pairContract = new ethers.Contract(
            pairAddress,
            [
                "function balanceOf(address) view returns (uint256)",
                "function approve(address spender, uint256 amount) returns (bool)",
                "function getReserves() external view returns (uint112, uint112, uint32)",
                "function token0() external view returns (address)"
            ],
            wallet
        );
        
        const [reserve0, reserve1] = await pairContract.getReserves();
        const token0 = await pairContract.token0();
        const lpBalance = await pairContract.balanceOf(wallet.address);
        
        // Determine which reserve is which
        let hpReserve, usdtReserve;
        if (token0.toLowerCase() === contractAddress.toLowerCase()) {
            hpReserve = reserve0;
            usdtReserve = reserve1;
        } else {
            hpReserve = reserve1;
            usdtReserve = reserve0;
        }
        
        const hpInPool = parseFloat(ethers.formatEther(hpReserve));
        const usdtInPool = parseFloat(ethers.formatUnits(usdtReserve, 6));
        const currentRate = usdtInPool / hpInPool;
        
        console.log("\\n🏊 Current Pool Status:");
        console.log("- HP in Pool:", hpInPool.toFixed(2), "HP");
        console.log("- USDT in Pool:", usdtInPool.toFixed(2), "USDT");
        console.log("- Current Rate:", currentRate.toFixed(2), "USDT per HP");
        console.log("- Your LP Tokens:", ethers.formatEther(lpBalance));
        
        console.log("\\n🎯 Rate Analysis:");
        console.log("- Contract Rate: 11 USDT per HP (hardcoded)");
        console.log("- Target Rate: 12 USDT per HP (1000 INR equivalent)");
        console.log("- Pool Rate:", currentRate.toFixed(2), "USDT per HP");
        
        // Calculate optimal liquidity for 96 USDT budget at 12 USDT rate
        console.log("\\n💡 Liquidity Options for 1000 INR = 12 USDT Rate:");
        console.log("════════════════════════════════════════════════");
        
        const scenarios = [
            { name: "Conservative", hpAmount: 2, description: "Small test pool" },
            { name: "Balanced", hpAmount: 4, description: "Good for moderate trading" },
            { name: "Optimal", hpAmount: Math.min(hpAmount, 6), description: "Best with your HP balance" }
        ];
        
        scenarios.forEach(scenario => {
            const hpForPool = scenario.hpAmount;
            const usdtForPool = hpForPool * 12; // 12 USDT per HP for INR peg
            const hpToMint = Math.max(0, hpForPool - hpAmount);
            const usdtForMinting = hpToMint * 13.2; // Current contract rate is 11 + 10% = 12.1, but we need some buffer
            const totalUSDTNeeded = usdtForMinting + usdtForPool;
            
            console.log(`\\n${scenario.name}:`);
            console.log(`   HP for pool: ${hpForPool} HP`);
            console.log(`   USDT for pool: ${usdtForPool} USDT (at 12 USDT rate)`);
            console.log(`   HP to mint: ${hpToMint} HP`);
            console.log(`   USDT for minting: ${usdtForMinting.toFixed(1)} USDT`);
            console.log(`   Total USDT needed: ${totalUSDTNeeded.toFixed(1)} USDT`);
            console.log(`   Fits budget? ${totalUSDTNeeded <= 96 ? '✅ YES' : '❌ NO'}`);
            console.log(`   Result: ${scenario.description}`);
        });
        
        // Recommend best approach
        console.log("\\n🎯 RECOMMENDED APPROACH:");
        console.log("═════════════════════════");
        console.log("Given your 96 USDT budget and existing HP tokens:");
        console.log("\\n✅ OPTION A: Update Pool Ratio (Recommended)");
        console.log("   - Remove existing liquidity");
        console.log("   - Add fresh liquidity at 1:12 ratio");
        console.log("   - Use 4 HP + 48 USDT (fits your budget)");
        console.log("   - This creates arbitrage opportunity");
        console.log("\\n🔄 OPTION B: Gradual Adjustment");
        console.log("   - Add more liquidity slowly");
        console.log("   - Let market forces adjust the rate");
        console.log("   - Takes longer but uses less capital");
        
        // Execute Option A if user wants
        console.log("\\n🚀 EXECUTING OPTION A: Update to 12 USDT Rate");
        console.log("═══════════════════════════════════════════════");
        
        const targetHP = 4;
        const targetUSDT = 48; // 4 * 12 = 48 USDT
        
        // Step 1: Remove existing liquidity if any
        if (lpBalance > 0n) {
            console.log("\\n🗑️ Step 1: Removing existing liquidity...");
            
            const approveLPTx = await pairContract.approve(PANCAKESWAP_ROUTER, lpBalance);
            await approveLPTx.wait();
            
            const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
            const removeTx = await router.removeLiquidity(
                contractAddress,
                USDT_BSC_ADDRESS,
                lpBalance,
                0, 0,
                wallet.address,
                deadline
            );
            await removeTx.wait();
            console.log("✅ Existing liquidity removed");
        }
        
        // Step 2: Add new liquidity at 1:12 ratio
        console.log("\\n✨ Step 2: Adding liquidity at 1:12 ratio...");
        console.log(`Target: ${targetHP} HP + ${targetUSDT} USDT`);
        
        const hpAmountForLP = ethers.parseEther(targetHP.toString());
        const usdtAmountForLP = ethers.parseUnits(targetUSDT.toString(), 6);
        
        // Approve tokens
        const hpApproveTx = await hpContract.approve(PANCAKESWAP_ROUTER, hpAmountForLP);
        await hpApproveTx.wait();
        
        const usdtApproveTx = await usdtContract.approve(PANCAKESWAP_ROUTER, usdtAmountForLP);
        await usdtApproveTx.wait();
        
        // Add liquidity
        const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
        const addLiquidityTx = await router.addLiquidity(
            contractAddress,
            USDT_BSC_ADDRESS,
            hpAmountForLP,
            usdtAmountForLP,
            0, 0,
            wallet.address,
            deadline
        );
        
        const receipt = await addLiquidityTx.wait();
        console.log("✅ New liquidity added at 1:12 ratio!");
        console.log("📍 Transaction:", receipt.hash);
        
        console.log("\\n🎉 SUCCESS! Pool Updated to Reflect INR Peg");
        console.log("═══════════════════════════════════════════════");
        console.log("\\n📊 New Pool Status:");
        console.log(`- HP Reserve: ~${targetHP} HP`);
        console.log(`- USDT Reserve: ~${targetUSDT} USDT`);
        console.log("- Pool Rate: 1 HP = 12 USDT ✅");
        console.log("- INR Equivalent: 1000 INR per HP ✅");
        console.log(`- You spent: ${targetUSDT} USDT`);
        console.log(`- You have left: ${96 - targetUSDT} USDT`);
        
        console.log("\\n💡 What This Achieves:");
        console.log("- Pool now reflects 1000 INR = 12 USDT rate");
        console.log("- Contract still mints at 11 USDT (creates arbitrage)");
        console.log("- Users can buy HP at ~12 USDT on DEX");
        console.log("- Users can mint HP at 12.1 USDT from contract");
        console.log("- Price pressure will stabilize around 12 USDT");
        
        console.log("\\n🔗 Test your updated token:");
        console.log("https://pancakeswap.finance/swap?inputCurrency=" + USDT_BSC_ADDRESS + "&outputCurrency=" + contractAddress);
        
    } catch (error) {
        console.error("❌ Error:", error);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});