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
    console.log("🔍 PancakeSwap LP Troubleshooting Helper");
    console.log("=======================================");
    
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
        ["function balanceOf(address) view returns (uint256)"],
        wallet
    );
    
    // Factory contract to check if pair exists
    const factoryContract = new ethers.Contract(
        PANCAKESWAP_FACTORY,
        ["function getPair(address tokenA, address tokenB) external view returns (address pair)"],
        provider
    );
    
    console.log("📍 HP Token:", contractAddress);
    console.log("📍 USDT Token:", USDT_BSC_ADDRESS);
    console.log("👤 Your Address:", wallet.address);
    
    try {
        // Check balances
        const hpBalance = await hpContract.balanceOf(wallet.address);
        const usdtBalance = await usdtContract.balanceOf(wallet.address);
        
        console.log("\\n📊 Your Current Balances:");
        console.log("- HP Balance:", ethers.formatEther(hpBalance), "HP");
        console.log("- USDT Balance:", ethers.formatUnits(usdtBalance, 6), "USDT");
        
        // Check if HP/USDT pair exists
        const pairAddress = await factoryContract.getPair(contractAddress, USDT_BSC_ADDRESS);
        console.log("\\n🏊 Liquidity Pool Status:");
        
        if (pairAddress === "0x0000000000000000000000000000000000000000") {
            console.log("❌ HP/USDT pair does NOT exist yet!");
            console.log("💡 This means the liquidity addition might have failed");
            console.log("🔄 Try running the add-usdt-liquidity script again");
        } else {
            console.log("✅ HP/USDT pair EXISTS!");
            console.log("📍 Pair Address:", pairAddress);
            
            // Check pair balance
            const pairContract = new ethers.Contract(
                pairAddress,
                [
                    "function balanceOf(address) view returns (uint256)",
                    "function totalSupply() view returns (uint256)",
                    "function getReserves() view returns (uint112, uint112, uint32)"
                ],
                provider
            );
            
            const yourLPBalance = await pairContract.balanceOf(wallet.address);
            const totalLPSupply = await pairContract.totalSupply();
            const [reserve0, reserve1] = await pairContract.getReserves();
            
            console.log("\\n💧 Your LP Position:");
            console.log("- Your LP Tokens:", ethers.formatEther(yourLPBalance));
            console.log("- Total LP Supply:", ethers.formatEther(totalLPSupply));
            console.log("- Pool Reserves:", ethers.formatEther(reserve0), "/", ethers.formatUnits(reserve1, 6));
        }
        
        // Check if HP/BNB pair exists too
        const WBNB_ADDRESS = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
        const bnbPairAddress = await factoryContract.getPair(contractAddress, WBNB_ADDRESS);
        
        console.log("\\n🚀 HP/BNB Pool Status:");
        if (bnbPairAddress === "0x0000000000000000000000000000000000000000") {
            console.log("❌ HP/BNB pair does not exist");
        } else {
            console.log("✅ HP/BNB pair exists:", bnbPairAddress);
        }
        
        console.log("\\n🎯 PancakeSwap Instructions:");
        console.log("\\n1. Add HP token to your wallet:");
        console.log("   - Contract: " + contractAddress);
        console.log("   - Symbol: HP");
        console.log("   - Decimals: 18");
        
        console.log("\\n2. Go to PancakeSwap:");
        console.log("   - Liquidity: https://pancakeswap.finance/liquidity");
        console.log("   - Click 'Add Liquidity'");
        console.log("   - Select USDT as first token");
        console.log("   - Paste HP contract address for second token");
        
        console.log("\\n3. Direct Links:");
        console.log("   - Add Liquidity: https://pancakeswap.finance/add/" + USDT_BSC_ADDRESS + "/" + contractAddress);
        console.log("   - Swap: https://pancakeswap.finance/swap?inputCurrency=" + USDT_BSC_ADDRESS + "&outputCurrency=" + contractAddress);
        
        console.log("\\n4. Suggested amounts to add:");
        console.log("   - HP: 1.0");
        console.log("   - USDT: 11.0 (maintains 1:11 ratio)");
        
    } catch (error) {
        console.error("❌ Error:", error);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});