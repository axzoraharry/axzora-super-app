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

const PANCAKESWAP_FACTORY = "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73";
const USDT_BSC_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";

async function main() {
    console.log("📊 HP Token Liquidity & Price Analysis");
    console.log("=====================================");
    
    // Load deployment info
    const deploymentPath = path.join(__dirname, "../deployment.json");
    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    const contractAddress = deploymentInfo.contractAddress;
    
    // Setup provider
    const rpcUrl = process.env.BSC_RPC_URL || "https://bsc-dataseed1.binance.org";
    const privateKey = process.env.BSC_PRIVATE_KEY;
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey!, provider);
    
    // Factory contract
    const factoryContract = new ethers.Contract(
        PANCAKESWAP_FACTORY,
        ["function getPair(address tokenA, address tokenB) external view returns (address pair)"],
        provider
    );
    
    // Get pair address
    const pairAddress = await factoryContract.getPair(contractAddress, USDT_BSC_ADDRESS);
    
    console.log("📍 HP Token:", contractAddress);
    console.log("📍 USDT Token:", USDT_BSC_ADDRESS);
    console.log("📍 LP Pair:", pairAddress);
    
    if (pairAddress === "0x0000000000000000000000000000000000000000") {
        console.log("❌ No HP/USDT pair found!");
        return;
    }
    
    // Load pair contract
    const pairContract = new ethers.Contract(
        pairAddress,
        [
            "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
            "function token0() external view returns (address)",
            "function token1() external view returns (address)",
            "function totalSupply() external view returns (uint256)"
        ],
        provider
    );
    
    try {
        // Get current reserves
        const [reserve0, reserve1] = await pairContract.getReserves();
        const token0 = await pairContract.token0();
        const token1 = await pairContract.token1();
        
        // Determine which token is which
        let hpReserve, usdtReserve;
        if (token0.toLowerCase() === contractAddress.toLowerCase()) {
            hpReserve = reserve0;
            usdtReserve = reserve1;
        } else {
            hpReserve = reserve1;
            usdtReserve = reserve0;
        }
        
        const hpReserveFormatted = parseFloat(ethers.formatEther(hpReserve));
        const usdtReserveFormatted = parseFloat(ethers.formatUnits(usdtReserve, 6));
        
        console.log("\\n📊 Current Pool Status:");
        console.log("- HP Reserve:", hpReserveFormatted.toFixed(6), "HP");
        console.log("- USDT Reserve:", usdtReserveFormatted.toFixed(2), "USDT");
        
        // Calculate current price
        let currentPrice = 0;
        if (hpReserveFormatted > 0) {
            currentPrice = usdtReserveFormatted / hpReserveFormatted;
        }
        
        console.log("\\n💰 Current Pricing:");
        console.log("- Current Price: 1 HP =", currentPrice.toFixed(4), "USDT");
        console.log("- Target Price: 1 HP = 11.0000 USDT");
        console.log("- Price Deviation:", ((currentPrice - 11) / 11 * 100).toFixed(2), "%");
        
        // Calculate liquidity needed for stability
        const targetPrice = 11.0; // 1 HP = 11 USDT
        
        console.log("\\n🎯 Liquidity Analysis:");
        console.log("═════════════════════════");
        
        // For different liquidity scenarios
        const scenarios = [
            { hp: 10, usdt: 110 },      // 10 HP + 110 USDT
            { hp: 50, usdt: 550 },      // 50 HP + 550 USDT  
            { hp: 100, usdt: 1100 },    // 100 HP + 1100 USDT
            { hp: 500, usdt: 5500 },    // 500 HP + 5500 USDT
            { hp: 1000, usdt: 11000 }   // 1000 HP + 11000 USDT
        ];
        
        console.log("\\n📈 Recommended Liquidity Scenarios:");
        console.log("┌─────────────┬──────────────┬──────────────┬──────────────┐");
        console.log("│   HP Tokens │    USDT      │  Price Impact│   Stability  │");
        console.log("├─────────────┼──────────────┼──────────────┼──────────────┤");
        
        scenarios.forEach((scenario, index) => {
            // Calculate price impact for 1 USDT trade
            const k = scenario.hp * scenario.usdt; // Constant product
            const priceImpact1USDT = calculatePriceImpact(scenario.hp, scenario.usdt, 1);
            const priceImpact10USDT = calculatePriceImpact(scenario.hp, scenario.usdt, 10);
            
            let stability;
            if (priceImpact1USDT < 1) stability = "🟢 Excellent";
            else if (priceImpact1USDT < 3) stability = "🟡 Good";
            else if (priceImpact1USDT < 5) stability = "🟠 Fair";
            else stability = "🔴 Poor";
            
            console.log(`│ ${scenario.hp.toString().padStart(11)} │ ${scenario.usdt.toString().padStart(12)} │ ${priceImpact1USDT.toFixed(2).padStart(11)}% │ ${stability.padEnd(12)} │`);
        });
        console.log("└─────────────┴──────────────┴──────────────┴──────────────┘");
        
        // Your current capacity analysis
        console.log("\\n🔍 Your Current Situation:");
        console.log("- Your HP Balance: 2.0 HP");
        console.log("- Your USDT Balance: ~96 trillion USDT (enough!)");
        console.log("- Contract Collateral: 120.2 USDT");
        
        // Recommendations
        console.log("\\n💡 Recommendations:");
        console.log("══════════════════════════");
        
        if (currentPrice === 0 || Math.abs(currentPrice - 11) > 1) {
            console.log("🚨 IMMEDIATE ACTION NEEDED:");
            console.log("   Current price is severely off target!");
            console.log("   Add liquidity ASAP to establish proper pricing.");
        }
        
        console.log("\\n🎯 For Different Goals:");
        console.log("\\n1. 🏃 QUICK FIX (Minimal liquidity):");
        console.log("   - Add: 2 HP + 22 USDT");
        console.log("   - Result: Basic functionality, high slippage");
        console.log("   - Best for: Testing, low volume");
        
        console.log("\\n2. 🎯 BALANCED APPROACH (Recommended):");
        console.log("   - Add: 10-50 HP + 110-550 USDT");
        console.log("   - Result: Good stability, reasonable slippage");
        console.log("   - Best for: Normal operations, moderate volume");
        
        console.log("\\n3. 🏦 PROFESSIONAL SETUP (High liquidity):");
        console.log("   - Add: 100-500 HP + 1100-5500 USDT");
        console.log("   - Result: Excellent stability, minimal slippage");
        console.log("   - Best for: High volume, serious trading");
        
        // Calculate how much you can add with current balance
        const yourHP = 2.0;
        const maxHPFromBalance = Math.floor(yourHP);
        const correspondingUSDT = maxHPFromBalance * 11;
        
        console.log("\\n🎯 What You Can Add Right Now:");
        console.log(`   - Available HP: ${yourHP} HP`);
        console.log(`   - Corresponding USDT: ${correspondingUSDT} USDT`);
        console.log("   - This gives you: BASIC stability");
        
        console.log("\\n🪙 To Get More HP Tokens:");
        console.log("   Run: npx hardhat run scripts/mint-hp-tokens.ts --network bscMainnet");
        console.log("   Cost: 12.1 USDT per HP token");
        
        // Action plan
        console.log("\\n🚀 RECOMMENDED ACTION PLAN:");
        console.log("═══════════════════════════");
        console.log("\\n1. Start with what you have (2 HP + 22 USDT)");
        console.log("2. Test the system functionality");
        console.log("3. Gradually mint more HP tokens as needed");
        console.log("4. Target: 50 HP + 550 USDT for good stability");
        console.log("5. Monitor and adjust based on trading volume");
        
    } catch (error) {
        console.error("❌ Error:", error);
    }
}

function calculatePriceImpact(hpReserve: number, usdtReserve: number, tradeAmountUSDT: number): number {
    // Calculate price impact using constant product formula
    const k = hpReserve * usdtReserve;
    const newUSDTReserve = usdtReserve + tradeAmountUSDT;
    const newHPReserve = k / newUSDTReserve;
    const hpReceived = hpReserve - newHPReserve;
    
    const expectedHP = tradeAmountUSDT / 11; // At perfect 11 USDT rate
    const priceImpact = Math.abs((expectedHP - hpReceived) / expectedHP * 100);
    
    return priceImpact;
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});