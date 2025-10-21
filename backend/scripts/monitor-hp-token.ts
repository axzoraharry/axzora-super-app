import { parseEther, formatEther, formatUnits, parseUnits } from "viem";
import hre from "hardhat";
import readline from "readline";

// Your existing contract address
const EXISTING_CONTRACT = "0x47b38b895A2d6E90fACE5619E85D3278dDd86476";
const USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";

interface ContractInfo {
  totalSupplyHP: bigint;
  totalCollateralUSDT: bigint;
  currentReserveRatio: bigint;
  currentCollateralizationRatio: bigint;
}

class HPTokenMonitor {
  private publicClient: any;
  private walletClient: any;
  private contract: any;
  private usdtContract: any;

  async initialize() {
    console.log("🔗 Connecting to BSC Mainnet...");
    
    this.publicClient = await hre.viem.getPublicClient();
    [this.walletClient] = await hre.viem.getWalletClients();

    // Connect to existing contract
    this.contract = await hre.viem.getContractAt(
      "HappyPaisaToken",
      EXISTING_CONTRACT
    );

    this.usdtContract = await hre.viem.getContractAt(
      "IERC20",
      USDT_ADDRESS
    );

    console.log("✅ Connected to HP Token:", EXISTING_CONTRACT);
    console.log("👤 Your Address:", this.walletClient.account?.address);
    console.log();
  }

  async displayContractStatus() {
    console.log("📊 HP TOKEN STATUS DASHBOARD");
    console.log("=" * 40);

    try {
      // Get contract info
      const info = await this.contract.read.getContractInfo() as ContractInfo;
      
      console.log("💰 Token Supply & Collateral:");
      console.log(`   Total HP Supply: ${formatEther(info.totalSupplyHP)} HP`);
      console.log(`   Total USDT Collateral: ${formatUnits(info.totalCollateralUSDT, 6)} USDT`);
      
      const totalValue = (info.totalSupplyHP * parseUnits("11", 6)) / parseEther("1");
      console.log(`   Theoretical Value: ${formatUnits(totalValue, 6)} USDT (at 11 USDT/HP)`);
      console.log();
      
      console.log("📈 Collateralization:");
      console.log(`   Reserve Ratio: ${info.currentReserveRatio}%`);
      console.log(`   Current Ratio: ${info.currentCollateralizationRatio}%`);
      
      const healthStatus = info.currentCollateralizationRatio >= 110n ? "🟢 Healthy" :
                          info.currentCollateralizationRatio >= 100n ? "🟡 Warning" : "🔴 Critical";
      console.log(`   Health Status: ${healthStatus}`);
      console.log();

      // Calculate stability metrics
      if (info.totalSupplyHP > 0) {
        const overCollateralized = info.totalCollateralUSDT > totalValue;
        const excess = overCollateralized 
          ? formatUnits(info.totalCollateralUSDT - totalValue, 6)
          : formatUnits(totalValue - info.totalCollateralUSDT, 6);
        
        console.log("💡 Stability Analysis:");
        console.log(`   Status: ${overCollateralized ? "Over-collateralized" : "Under-collateralized"}`);
        console.log(`   ${overCollateralized ? "Excess" : "Deficit"}: ${excess} USDT`);
        console.log();
      }

      // User balances
      await this.displayUserBalances();

    } catch (error) {
      console.error("❌ Error fetching contract status:", error);
    }
  }

  async displayUserBalances() {
    const userAddress = this.walletClient.account?.address;
    if (!userAddress) return;

    console.log("👤 Your Balances:");
    
    try {
      const hpBalance = await this.contract.read.balanceOf([userAddress]);
      const usdtBalance = await this.usdtContract.read.balanceOf([userAddress]);
      const usdtAllowance = await this.usdtContract.read.allowance([userAddress, EXISTING_CONTRACT]);
      
      console.log(`   HP Tokens: ${formatEther(hpBalance)} HP`);
      console.log(`   USDT Balance: ${formatUnits(usdtBalance, 6)} USDT`);
      console.log(`   USDT Allowance: ${formatUnits(usdtAllowance, 6)} USDT`);
      
      if (hpBalance > 0) {
        const burnReturn = await this.contract.read.calculateUSDTReturn([hpBalance]);
        console.log(`   Burn Value: ${formatUnits(burnReturn, 6)} USDT`);
      }
      console.log();
    } catch (error) {
      console.error("❌ Error fetching balances:", error);
    }
  }

  async calculateMintCost(hpAmount: string) {
    try {
      const amount = parseEther(hpAmount);
      const collateralNeeded = await this.contract.read.calculateCollateralNeeded([amount]);
      
      console.log(`💵 Cost to mint ${hpAmount} HP:`);
      console.log(`   USDT Required: ${formatUnits(collateralNeeded, 6)} USDT`);
      console.log(`   Rate: ${formatUnits(collateralNeeded, 6) / parseFloat(hpAmount)} USDT per HP`);
      console.log();
    } catch (error) {
      console.error("❌ Error calculating mint cost:", error);
    }
  }

  async calculateBurnReturn(hpAmount: string) {
    try {
      const amount = parseEther(hpAmount);
      const usdtReturn = await this.contract.read.calculateUSDTReturn([amount]);
      
      console.log(`💰 Return from burning ${hpAmount} HP:`);
      console.log(`   USDT Returned: ${formatUnits(usdtReturn, 6)} USDT`);
      console.log(`   Rate: ${formatUnits(usdtReturn, 6) / parseFloat(hpAmount)} USDT per HP`);
      console.log();
    } catch (error) {
      console.error("❌ Error calculating burn return:", error);
    }
  }

  async approveUSDT(amount: string) {
    try {
      const amountBigInt = parseUnits(amount, 6);
      
      console.log(`🔓 Approving ${amount} USDT for HP Token contract...`);
      const hash = await this.usdtContract.write.approve([EXISTING_CONTRACT, amountBigInt]);
      
      console.log(`   Transaction: ${hash}`);
      await this.publicClient.waitForTransactionReceipt({ hash });
      console.log("✅ USDT approval successful!");
      console.log();
    } catch (error) {
      console.error("❌ Error approving USDT:", error);
    }
  }

  async mintTokens(hpAmount: string) {
    try {
      const amount = parseEther(hpAmount);
      const collateralNeeded = await this.contract.read.calculateCollateralNeeded([amount]);
      
      console.log(`🪙 Minting ${hpAmount} HP tokens...`);
      console.log(`   USDT Required: ${formatUnits(collateralNeeded, 6)} USDT`);
      
      const hash = await this.contract.write.mintTokens([amount]);
      console.log(`   Transaction: ${hash}`);
      
      await this.publicClient.waitForTransactionReceipt({ hash });
      console.log("✅ Mint successful!");
      console.log();
    } catch (error) {
      console.error("❌ Error minting tokens:", error);
    }
  }

  async burnTokens(hpAmount: string) {
    try {
      const amount = parseEther(hpAmount);
      const usdtReturn = await this.contract.read.calculateUSDTReturn([amount]);
      
      console.log(`🔥 Burning ${hpAmount} HP tokens...`);
      console.log(`   USDT To Receive: ${formatUnits(usdtReturn, 6)} USDT`);
      
      const hash = await this.contract.write.burnTokens([amount]);
      console.log(`   Transaction: ${hash}`);
      
      await this.publicClient.waitForTransactionReceipt({ hash });
      console.log("✅ Burn successful!");
      console.log();
    } catch (error) {
      console.error("❌ Error burning tokens:", error);
    }
  }

  async showMenu() {
    console.log("🎯 HP TOKEN MANAGEMENT MENU");
    console.log("=" * 30);
    console.log("1. 📊 Show Status Dashboard");
    console.log("2. 💵 Calculate Mint Cost");
    console.log("3. 💰 Calculate Burn Return");
    console.log("4. 🔓 Approve USDT");
    console.log("5. 🪙 Mint HP Tokens");
    console.log("6. 🔥 Burn HP Tokens");
    console.log("7. 📈 Continuous Monitoring");
    console.log("0. ❌ Exit");
    console.log();
  }

  async continuousMonitoring() {
    console.log("📡 Starting continuous monitoring (Ctrl+C to stop)...");
    console.log();
    
    const monitor = async () => {
      console.clear();
      console.log(`🕒 ${new Date().toLocaleString()}`);
      await this.displayContractStatus();
      
      // Show price stability
      const info = await this.contract.read.getContractInfo() as ContractInfo;
      if (info.totalSupplyHP > 0) {
        const actualRate = Number(formatUnits(info.totalCollateralUSDT, 6)) / Number(formatEther(info.totalSupplyHP));
        const pegDeviation = ((actualRate - 11) / 11) * 100;
        
        console.log("🎯 Peg Stability:");
        console.log(`   Current Rate: ${actualRate.toFixed(4)} USDT/HP`);
        console.log(`   Target Rate: 11.0000 USDT/HP`);
        console.log(`   Deviation: ${pegDeviation >= 0 ? '+' : ''}${pegDeviation.toFixed(2)}%`);
        console.log();
      }
    };

    // Initial call
    await monitor();
    
    // Set interval for updates
    const intervalId = setInterval(monitor, 30000); // Update every 30 seconds
    
    // Handle Ctrl+C
    process.on('SIGINT', () => {
      clearInterval(intervalId);
      console.log("\n📊 Monitoring stopped.");
      process.exit(0);
    });
  }
}

async function main() {
  const monitor = new HPTokenMonitor();
  await monitor.initialize();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const askQuestion = (question: string): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(question, resolve);
    });
  };

  console.log("🚀 HP TOKEN MONITORING & MANAGEMENT SYSTEM");
  console.log("==========================================");
  console.log();

  while (true) {
    await monitor.showMenu();
    const choice = await askQuestion("Enter your choice: ");

    switch (choice) {
      case '1':
        await monitor.displayContractStatus();
        break;
      
      case '2':
        const mintAmount = await askQuestion("Enter HP amount to mint: ");
        await monitor.calculateMintCost(mintAmount);
        break;
      
      case '3':
        const burnAmount = await askQuestion("Enter HP amount to burn: ");
        await monitor.calculateBurnReturn(burnAmount);
        break;
      
      case '4':
        const approveAmount = await askQuestion("Enter USDT amount to approve: ");
        await monitor.approveUSDT(approveAmount);
        break;
      
      case '5':
        const mintTokenAmount = await askQuestion("Enter HP amount to mint: ");
        await monitor.mintTokens(mintTokenAmount);
        break;
      
      case '6':
        const burnTokenAmount = await askQuestion("Enter HP amount to burn: ");
        await monitor.burnTokens(burnTokenAmount);
        break;
      
      case '7':
        rl.close();
        await monitor.continuousMonitoring();
        return;
      
      case '0':
        console.log("👋 Goodbye!");
        rl.close();
        return;
      
      default:
        console.log("❌ Invalid choice. Please try again.");
    }

    await askQuestion("Press Enter to continue...");
    console.clear();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export default HPTokenMonitor;