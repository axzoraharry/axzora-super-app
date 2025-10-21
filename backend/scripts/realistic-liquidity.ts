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
    console.log("💰 Realistic HP Liquidity Plan (96 USDT Budget)");
    console.log("===============================================");
    
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
    
    // Factory and router contracts
    const factoryContract = new ethers.Contract(
        PANCAKESWAP_FACTORY,
        ["function getPair(address tokenA, address tokenB) external view returns (address pair)"],
        provider
    );
    
    const routerABI = [
        "function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB, uint liquidity)"
    ];
    const router = new ethers.Contract(PANCAKESWAP_ROUTER, routerABI, wallet);
    
    console.log("📍 HP Token:", contractAddress);
    console.log("👤 Your Address:", wallet.address);
    console.log("💰 Your Budget: 96 USDT");
    
    try {
        // Check real balances
        const hpBalance = await hpContract.balanceOf(wallet.address);
        const usdtBalance = await usdtContract.balanceOf(wallet.address);
        
        // Convert to readable numbers
        const hpAmount = parseFloat(ethers.formatEther(hpBalance));
        const usdtAmount = parseFloat(ethers.formatUnits(usdtBalance, 6));
        
        console.log("\\n📊 Your Real Balances:");
        console.log("- HP Balance:", hpAmount.toFixed(2), "HP");
        console.log("- USDT Balance:", usdtAmount.toFixed(2), "USDT");
        
        // Realistic scenarios with 96 USDT budget
        console.log("\\n🎯 Liquidity Options with 96 USDT Budget:");
        console.log("═════════════════════════════════════════");
        
        const scenarios = [
            {
                name: "Option 1: Conservative",
                description: "Use existing HP + small USDT",
                hpForLP: Math.min(hpAmount, 2),
                calculation: "Use what you have"
            },
            {
                name: "Option 2: Balanced", 
                description: "Mint some HP + use more USDT",
                hpForLP: 4,
                calculation: "Need to mint 2-3 more HP"
            },
            {
                name: "Option 3: Maximum",
                description: "Use most of your 96 USDT",
                hpForLP: 6,
                calculation: "Need to mint 4-5 more HP"
            }
        ];
        
        scenarios.forEach((scenario, index) => {
            const hpNeeded = scenario.hpForLP;
            const usdtForLP = hpNeeded * 11;
            const hpToMint = Math.max(0, hpNeeded - hpAmount);
            const usdtForMinting = hpToMint * 12.1;
            const totalUSDTNeeded = usdtForMinting + usdtForLP;
            
            console.log(`\\n${scenario.name}:`);
            console.log(`   HP for LP: ${hpNeeded} HP`);
            console.log(`   USDT for LP: ${usdtForLP} USDT`);
            console.log(`   HP to mint: ${hpToMint.toFixed(1)} HP`);
            console.log(`   USDT for minting: ${usdtForMinting.toFixed(1)} USDT`);
            console.log(`   Total USDT needed: ${totalUSDTNeeded.toFixed(1)} USDT`);
            console.log(`   Fits budget? ${totalUSDTNeeded <= 96 ? '✅ YES' : '❌ NO'}`);
            console.log(`   Result: ${scenario.description}`);
        });
        
        // Find the best option that fits budget
        let bestOption = null;
        for (const scenario of scenarios.reverse()) { // Start from maximum
            const hpNeeded = scenario.hpForLP;
            const usdtForLP = hpNeeded * 11;
            const hpToMint = Math.max(0, hpNeeded - hpAmount);
            const usdtForMinting = hpToMint * 12.1;
            const totalUSDTNeeded = usdtForMinting + usdtForLP;
            
            if (totalUSDTNeeded <= 96) {
                bestOption = {
                    ...scenario,
                    hpNeeded,
                    usdtForLP,
                    hpToMint,
                    usdtForMinting,
                    totalUSDTNeeded
                };
                break;
            }
        }
        
        if (!bestOption) {
            console.log("\\n❌ None of the options fit your 96 USDT budget!");
            console.log("💡 Try with a smaller amount or get more USDT");
            return;
        }
        
        console.log("\\n🎯 RECOMMENDED PLAN:");
        console.log("══════════════════════");
        console.log(`✅ ${bestOption.name}`);
        console.log(`   - Mint: ${bestOption.hpToMint.toFixed(1)} HP (${bestOption.usdtForMinting.toFixed(1)} USDT)`);
        console.log(`   - Add to LP: ${bestOption.hpNeeded} HP + ${bestOption.usdtForLP} USDT`);
        console.log(`   - Total cost: ${bestOption.totalUSDTNeeded.toFixed(1)} USDT`);
        console.log(`   - Remaining: ${(96 - bestOption.totalUSDTNeeded).toFixed(1)} USDT`);
        
        // Execute the plan
        console.log("\\n🚀 EXECUTING PLAN...");
        console.log("═══════════════════════");
        
        // Step 1: Mint HP if needed
        if (bestOption.hpToMint > 0) {
            console.log(`\\n🪙 Step 1: Minting ${bestOption.hpToMint.toFixed(1)} HP tokens...`);
            
            const hpAmountToMint = ethers.parseEther(bestOption.hpToMint.toFixed(1));
            const usdtAmountForMinting = ethers.parseUnits(bestOption.usdtForMinting.toFixed(1), 6);
            
            // Approve USDT for minting
            console.log("📝 Approving USDT for minting...");
            const approveForMintTx = await usdtContract.approve(contractAddress, usdtAmountForMinting);
            await approveForMintTx.wait();
            console.log("✅ USDT approved for minting");
            
            // Mint HP tokens
            console.log("🪙 Minting HP tokens...");
            const mintTx = await hpContract.mintTokens(hpAmountToMint);
            const mintReceipt = await mintTx.wait();
            console.log("✅ HP tokens minted!");
            console.log("📍 Mint TX:", mintReceipt.hash);
        } else {
            console.log("\\n✅ No need to mint - using existing HP tokens");
        }
        
        // Step 2: Add liquidity
        console.log(`\\n🏊 Step 2: Adding ${bestOption.hpNeeded} HP + ${bestOption.usdtForLP} USDT to liquidity...`);
        
        const hpForLiquidity = ethers.parseEther(bestOption.hpNeeded.toString());
        const usdtForLiquidity = ethers.parseUnits(bestOption.usdtForLP.toString(), 6);
        
        // Approve tokens for router
        console.log("📝 Approving HP tokens for router...");
        const hpApproveTx = await hpContract.approve(PANCAKESWAP_ROUTER, hpForLiquidity);
        await hpApproveTx.wait();
        console.log("✅ HP tokens approved");
        
        console.log("📝 Approving USDT tokens for router...");
        const usdtApproveTx = await usdtContract.approve(PANCAKESWAP_ROUTER, usdtForLiquidity);
        await usdtApproveTx.wait();
        console.log("✅ USDT tokens approved");
        
        // Add liquidity
        console.log("🏊 Adding liquidity...");
        const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
        
        const addLiquidityTx = await router.addLiquidity(
            contractAddress,
            USDT_BSC_ADDRESS,
            hpForLiquidity,
            usdtForLiquidity,
            0, // amountAMin
            0, // amountBMin
            wallet.address,
            deadline
        );
        
        const liquidityReceipt = await addLiquidityTx.wait();
        console.log("✅ Liquidity added successfully!");
        console.log("📍 Liquidity TX:", liquidityReceipt.hash);
        
        console.log("\\n🎉 SUCCESS! Your HP token now has proper liquidity!");
        console.log("\\n📊 New Pool Status:");
        console.log(`- HP Reserve: ~${bestOption.hpNeeded} HP`);
        console.log(`- USDT Reserve: ~${bestOption.usdtForLP} USDT`);
        console.log("- Price: 1 HP = 11 USDT ✅");
        console.log(`- You spent: ${bestOption.totalUSDTNeeded.toFixed(1)} USDT`);
        console.log(`- You have left: ${(96 - bestOption.totalUSDTNeeded).toFixed(1)} USDT`);
        
        console.log("\\n🔗 Test your token:");
        console.log("https://pancakeswap.finance/swap?inputCurrency=" + USDT_BSC_ADDRESS + "&outputCurrency=" + contractAddress);
        
    } catch (error) {
        console.error("❌ Error:", error);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});