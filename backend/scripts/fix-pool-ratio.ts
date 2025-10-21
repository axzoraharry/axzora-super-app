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
    console.log("🔧 Fix HP/USDT Pool Ratio Script");
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
    console.log("👤 Wallet:", wallet.address);
    
    try {
        // Get pair address
        const pairAddress = await factoryContract.getPair(contractAddress, USDT_BSC_ADDRESS);
        console.log("📍 LP Pair:", pairAddress);
        
        // Get current balances
        const hpBalance = await hpContract.balanceOf(wallet.address);
        const usdtBalance = await usdtContract.balanceOf(wallet.address);
        
        console.log("\\n📊 Your Current Balances:");
        console.log("- HP Balance:", ethers.formatEther(hpBalance), "HP");
        console.log("- USDT Balance:", ethers.formatUnits(usdtBalance, 6), "USDT");
        
        // Check LP tokens
        const pairContract = new ethers.Contract(
            pairAddress,
            [
                "function balanceOf(address) view returns (uint256)",
                "function approve(address spender, uint256 amount) returns (bool)",
                "function getReserves() external view returns (uint112, uint112, uint32)",
                "function token0() external view returns (address)",
                "function token1() external view returns (address)"
            ],
            wallet
        );
        
        const lpBalance = await pairContract.balanceOf(wallet.address);
        const [reserve0, reserve1] = await pairContract.getReserves();
        const token0 = await pairContract.token0();
        
        // Determine which reserve is which
        let hpReserve, usdtReserve;
        if (token0.toLowerCase() === contractAddress.toLowerCase()) {
            hpReserve = reserve0;
            usdtReserve = reserve1;
        } else {
            hpReserve = reserve1;
            usdtReserve = reserve0;
        }
        
        console.log("\\n🏊 Current Pool Status:");
        console.log("- Your LP Tokens:", ethers.formatEther(lpBalance));
        console.log("- HP Reserve:", ethers.formatEther(hpReserve), "HP");
        console.log("- USDT Reserve:", ethers.formatUnits(usdtReserve, 6), "USDT");
        
        const currentPrice = parseFloat(ethers.formatUnits(usdtReserve, 6)) / parseFloat(ethers.formatEther(hpReserve));
        console.log("- Current Price:", currentPrice.toFixed(2), "USDT per HP");
        console.log("- Target Price: 11.00 USDT per HP");
        
        // Step 1: Remove existing liquidity if you have any
        if (lpBalance > 0) {
            console.log("\\n🗑️ Step 1: Removing existing liquidity...");
            
            // Approve LP tokens for router
            console.log("📝 Approving LP tokens...");
            const approveLPTx = await pairContract.approve(PANCAKESWAP_ROUTER, lpBalance);
            await approveLPTx.wait();
            console.log("✅ LP tokens approved");
            
            // Remove liquidity
            console.log("🗑️ Removing liquidity...");
            const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
            
            const removeTx = await router.removeLiquidity(
                contractAddress,
                USDT_BSC_ADDRESS,
                lpBalance,
                0, // amountAMin
                0, // amountBMin
                wallet.address,
                deadline
            );
            
            const removeReceipt = await removeTx.wait();
            console.log("✅ Liquidity removed!");
            console.log("📍 Remove TX:", removeReceipt.hash);
            
            // Check new balances
            const newHPBalance = await hpContract.balanceOf(wallet.address);
            const newUSDTBalance = await usdtContract.balanceOf(wallet.address);
            console.log("\\n📊 After Removal:");
            console.log("- HP Balance:", ethers.formatEther(newHPBalance), "HP");
            console.log("- USDT Balance:", ethers.formatUnits(newUSDTBalance, 6), "USDT");
        }
        
        // Step 2: Add fresh liquidity with correct ratio
        console.log("\\n✨ Step 2: Adding fresh liquidity with correct 1:11 ratio...");
        
        // Use your available tokens (aim for 10 HP + 110 USDT)
        const targetHP = 10;
        const targetUSDT = targetHP * 11; // 110 USDT
        
        const finalHP = ethers.parseEther(targetHP.toString());
        const finalUSDT = ethers.parseUnits(targetUSDT.toString(), 6);
        
        console.log(`🎯 Target: ${targetHP} HP + ${targetUSDT} USDT`);
        
        // Check if we have enough tokens
        const currentHPBalance = await hpContract.balanceOf(wallet.address);
        const currentUSDTBalance = await usdtContract.balanceOf(wallet.address);
        
        if (currentHPBalance < finalHP) {
            console.log("⚠️ Not enough HP tokens. You have:", ethers.formatEther(currentHPBalance), "HP");
            console.log("💡 Use what you have instead...");
            const availableHP = Math.floor(parseFloat(ethers.formatEther(currentHPBalance)));
            const correspondingUSDT = availableHP * 11;
            
            console.log(`🔄 Adjusted target: ${availableHP} HP + ${correspondingUSDT} USDT`);
            
            const adjustedHPAmount = ethers.parseEther(availableHP.toString());
            const adjustedUSDTAmount = ethers.parseUnits(correspondingUSDT.toString(), 6);
            
            // Use adjusted amounts
            await addLiquidity(hpContract, usdtContract, router, contractAddress, adjustedHPAmount, adjustedUSDTAmount, wallet.address);
        } else {
            // Use target amounts
            await addLiquidity(hpContract, usdtContract, router, contractAddress, finalHP, finalUSDT, wallet.address);
        }
        
        console.log("\\n🎉 SUCCESS! Pool ratio should now be fixed!");
        console.log("\\n🔗 Test your token:");
        console.log("- Swap: https://pancakeswap.finance/swap?inputCurrency=" + USDT_BSC_ADDRESS + "&outputCurrency=" + contractAddress);
        
    } catch (error) {
        console.error("❌ Error:", error);
    }
}

async function addLiquidity(hpContract: any, usdtContract: any, router: any, contractAddress: string, hpAmount: any, usdtAmount: any, walletAddress: string) {
    // Approve tokens
    console.log("📝 Approving HP tokens...");
    const hpApproveTx = await hpContract.approve(PANCAKESWAP_ROUTER, hpAmount);
    await hpApproveTx.wait();
    console.log("✅ HP tokens approved");
    
    console.log("📝 Approving USDT tokens...");
    const usdtApproveTx = await usdtContract.approve(PANCAKESWAP_ROUTER, usdtAmount);
    await usdtApproveTx.wait();
    console.log("✅ USDT tokens approved");
    
    // Add liquidity
    console.log("🏊 Adding liquidity...");
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
    
    const addTx = await router.addLiquidity(
        contractAddress,
        USDT_BSC_ADDRESS,
        hpAmount,
        usdtAmount,
        0, // amountAMin
        0, // amountBMin
        walletAddress,
        deadline
    );
    
    const addReceipt = await addTx.wait();
    console.log("✅ Fresh liquidity added!");
    console.log("📍 Add TX:", addReceipt.hash);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});