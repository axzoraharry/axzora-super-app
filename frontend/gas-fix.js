/**
 * Gas Estimation Fix for Happy Paisa Token Transactions
 * Fixes MetaMask "Transaction likely to fail" warnings
 */

window.GasFix = {
    // Predefined gas limits for different functions
    gasLimits: {
        mintTokens: 500000,
        burnTokens: 400000,
        approve: 100000,
        transfer: 100000,
        depositCollateral: 200000,
        withdrawExcessCollateral: 300000
    },
    
    // Gas price for BSC (in Gwei)
    gasPrice: '5', // 5 Gwei - standard for BSC
    
    /**
     * Get gas parameters for a transaction
     */
    getGasParams(functionName, amount = '0') {
        const gasLimit = this.gasLimits[functionName] || 500000;
        
        return {
            gas: gasLimit,
            gasPrice: window.web3.utils.toWei(this.gasPrice, 'gwei'),
            // For EIP-1559 networks (optional)
            maxFeePerGas: window.web3.utils.toWei('10', 'gwei'),
            maxPriorityFeePerGas: window.web3.utils.toWei('2', 'gwei')
        };
    },
    
    /**
     * Safe transaction sender with proper gas estimation
     */
    async sendTransaction(contract, method, params = [], options = {}) {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            const from = accounts[0];
            
            // Get gas parameters
            const gasParams = this.getGasParams(method);
            
            // Merge with provided options
            const txOptions = {
                from: from,
                ...gasParams,
                ...options
            };
            
            console.log(`🚀 Sending ${method} transaction with gas limit: ${txOptions.gas}`);
            
            // Send transaction
            const result = await contract.methods[method](...params).send(txOptions);
            
            console.log(`✅ Transaction successful:`, result.transactionHash);
            return result;
            
        } catch (error) {
            console.error(`❌ Transaction failed:`, error);
            throw error;
        }
    },
    
    /**
     * Check if user has enough BNB for gas
     */
    async checkBNBBalance() {
        try {
            if (!window.ethereum) {
                console.warn('⚠️ MetaMask not available');
                return 0;
            }
            
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (!accounts || accounts.length === 0) {
                console.warn('⚠️ No accounts connected');
                return 0;
            }
            
            // Use the blockchain interface's web3 instance if available
            const web3Instance = window.blockchainInterface?.web3 || window.web3;
            if (!web3Instance) {
                console.warn('⚠️ Web3 instance not available');
                return 0;
            }
            
            const balance = await web3Instance.eth.getBalance(accounts[0]);
            const balanceInBNB = web3Instance.utils.fromWei(balance, 'ether');
            
            console.log(`💰 BNB Balance: ${balanceInBNB} BNB`);
            
            if (parseFloat(balanceInBNB) < 0.01) {
                console.warn('⚠️ Low BNB balance for gas fees. Consider adding more BNB.');
            }
            
            return parseFloat(balanceInBNB);
        } catch (error) {
            console.error('❌ BNB balance check failed:', error);
            return 0;
        }
    },
    
    /**
     * Initialize gas fix
     */
    init() {
        console.log('⚡ Gas Fix initialized for Happy Paisa Token');
        
        // Check BNB balance on init
        this.checkBNBBalance().catch(console.error);
        
        // Override Web3 send methods if needed
        this.patchWeb3();
    },
    
    /**
     * Patch Web3 for better gas estimation
     */
    patchWeb3() {
        if (window.web3 && window.web3.eth) {
            const originalSend = window.web3.eth.Contract.prototype.send;
            
            // Override send method to use our gas estimation
            window.web3.eth.Contract.prototype.send = function(options) {
                if (!options.gas && !options.gasLimit) {
                    options.gas = 500000; // Default gas limit
                }
                if (!options.gasPrice) {
                    options.gasPrice = window.web3.utils.toWei('5', 'gwei');
                }
                
                return originalSend.call(this, options);
            };
        }
    }
};

// Auto-initialize when loaded
document.addEventListener('DOMContentLoaded', () => {
    window.GasFix.init();
});

console.log('🔧 Gas Fix loaded for Happy Paisa Token transactions');