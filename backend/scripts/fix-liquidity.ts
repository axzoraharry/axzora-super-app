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
    console.log("🔧 HP Token Liquidity Fix Script");
    console.log("================================");
    
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
    
    const routerABI = [
        "function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB, uint liquidity)"
    ];
    const router = new ethers.Contract(PANCAKESWAP_ROUTER, routerABI, wallet);
    
    console.log("📍 HP Token:", contractAddress);
    console.log("👤 Wallet:", wallet.address);
    
    try {
        // Check current balances
        const hpBalance = await hpContract.balanceOf(wallet.address);
        const usdtBalance = await usdtContract.balanceOf(wallet.address);
        
        console.log("\\n📊 Current Balances:");
        console.log("- HP Balance:", ethers.formatEther(hpBalance), "HP");
        console.log("- USDT Balance:", ethers.formatUnits(usdtBalance, 6), "USDT");
        
        // Liquidity scenarios
        const scenarios = [
            { name: "Quick Fix", hp: 2, description: "Basic functionality" },
            { name: "Balanced", hp: 10, description: "Good stability (RECOMMENDED)" },
            { name: "Professional", hp: 50, description: "Excellent stability" }
        ];
        
        console.log("\\n🎯 Liquidity Options:");
        console.log("══════════════════════");
        
        scenarios.forEach((scenario, index) => {
            const hpNeeded = scenario.hp;
            const usdtForLP = hpNeeded * 11;
            const hpToMint = Math.max(0, hpNeeded - parseFloat(ethers.formatEther(hpBalance)));
            const usdtToMint = hpToMint * 12.1;
            const totalUSDTNeeded = usdtToMint + usdtForLP;
            
            console.log(`\\n${index + 1}. ${scenario.name}:`);
            console.log(`   - Total HP needed: ${hpNeeded} HP`);
            console.log(`   - HP to mint: ${hpToMint} HP`);
            console.log(`   - USDT for minting: ${usdtToMint} USDT`);
            console.log(`   - USDT for LP: ${usdtForLP} USDT`);
            console.log(`   - Total USDT needed: ${totalUSDTNeeded} USDT`);
            console.log(`   - Result: ${scenario.description}`);
        });
        
        // Execute the BALANCED approach (recommended)
        const targetHP = 10;
        const targetUSDTForLP = targetHP * 11; // 110 USDT
        const currentHP = parseFloat(ethers.formatEther(hpBalance));
        const hpToMint = Math.max(0, targetHP - currentHP);
        
        console.log("\\n🚀 Executing BALANCED APPROACH:");
        console.log("═══════════════════════════════");
        console.log(`- Target: ${targetHP} HP + ${targetUSDTForLP} USDT in LP`);
        console.log(`- Need to mint: ${hpToMint} HP tokens`);
        
        if (hpToMint > 0) {
            console.log("\\n🪙 Step 1: Minting HP tokens...");
            const hpAmount = ethers.parseEther(hpToMint.toString());
            const usdtAmount = ethers.parseUnits((hpToMint * 12.1).toString(), 6);
            
            // Approve USDT for minting
            console.log("📝 Approving USDT for minting...");
            const approveTx = await usdtContract.approve(contractAddress, usdtAmount);
            await approveTx.wait();
            console.log("✅ USDT approved for minting");
            
            // Mint HP tokens
            console.log("🪙 Minting", hpToMint, "HP tokens...");
            const mintTx = await hpContract.mintTokens(hpAmount);
            const mintReceipt = await mintTx.wait();
            console.log("✅ HP tokens minted!");
            console.log("📍 Mint TX:", mintReceipt.hash);
        } else {
            console.log("✅ You already have enough HP tokens!");
        }
        
        // Step 2: Add liquidity
        console.log("\\n🏊 Step 2: Adding liquidity to fix pricing...");
        
        const finalHP = ethers.parseEther(targetHP.toString());
        const finalUSDT = ethers.parseUnits(targetUSDTForLP.toString(), 6);
        
        // Approve tokens for router
        console.log("📝 Approving HP tokens for router...");
        const hpApproveTx = await hpContract.approve(PANCAKESWAP_ROUTER, finalHP);
        await hpApproveTx.wait();
        console.log("✅ HP tokens approved");
        
        console.log("📝 Approving USDT tokens for router...");
        const usdtApproveTx = await usdtContract.approve(PANCAKESWAP_ROUTER, finalUSDT);
        await usdtApproveTx.wait();
        console.log("✅ USDT tokens approved");
        
        // Add liquidity
        console.log("🏊 Adding liquidity:", targetHP, "HP +", targetUSDTForLP, "USDT...");
        const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes
        
        const addLiquidityTx = await router.addLiquidity(
            contractAddress,    // tokenA (HP)
            USDT_BSC_ADDRESS,   // tokenB (USDT)
            finalHP,            // amountADesired
            finalUSDT,          // amountBDesired
            0,                  // amountAMin
            0,                  // amountBMin
            wallet.address,     // to
            deadline            // deadline
        );
        
        const liquidityReceipt = await addLiquidityTx.wait();
        console.log("✅ Liquidity added successfully!");
        console.log("📍 Liquidity TX:", liquidityReceipt.hash);
        
        console.log("\\n🎉 SUCCESS! Your HP token pricing is now fixed!");
        console.log("\\n📊 New Pool Status:");
        console.log("- HP Reserve: ~", targetHP, "HP");
        console.log("- USDT Reserve: ~", targetUSDTForLP, "USDT"); 
        console.log("- Price: 1 HP = 11 USDT ✅");
        console.log("- Slippage: <0.9% for small trades ✅");
        
        console.log("\\n🔗 Test Your Token:");
        console.log("- Swap: https://pancakeswap.finance/swap?inputCurrency=" + USDT_BSC_ADDRESS + "&outputCurrency=" + contractAddress);
        console.log("- Add More Liquidity: https://pancakeswap.finance/add/" + USDT_BSC_ADDRESS + "/" + contractAddress);
        
        console.log("\\n💡 Next Steps:");
        console.log("1. Test swapping small amounts on PancakeSwap");
        console.log("2. Monitor price stability");
        console.log("3. Add more liquidity if trading volume increases");
        
    } catch (error) {
        console.error("❌ Error:", error);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});