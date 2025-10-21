/**
 * Blockchain Interface - Web3 Integration for Happy Paisa Token Operations
 * Axzora Super App - Blockchain Connectivity
 */

class BlockchainInterface {
    constructor() {
        this.isInitialized = false;
        this.web3 = null;
        this.contract = null;
        this.account = null;
        this.chainId = null;
        this.isConnected = false;
        
        // Contract configuration (from config.js)
        this.contractConfig = {
            address: window.AXZORA_CONFIG?.HP_TOKEN_ADDRESS || '0x9A1BA34e3B23e258974baEE1E883BE9374A39276', // Verified HP Contract
            abi: [{
                "inputs":[{"internalType":"address","name":"_usdtAddress","type":"address"}],
                "stateMutability":"nonpayable",
                "type":"constructor"
            },{
                "inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"allowance","type":"uint256"},{"internalType":"uint256","name":"needed","type":"uint256"}],
                "name":"ERC20InsufficientAllowance",
                "type":"error"
            },{
                "inputs":[{"internalType":"address","name":"sender","type":"address"},{"internalType":"uint256","name":"balance","type":"uint256"},{"internalType":"uint256","name":"needed","type":"uint256"}],
                "name":"ERC20InsufficientBalance",
                "type":"error"
            },{
                "inputs":[{"internalType":"address","name":"approver","type":"address"}],
                "name":"ERC20InvalidApprover",
                "type":"error"
            },{
                "inputs":[{"internalType":"address","name":"receiver","type":"address"}],
                "name":"ERC20InvalidReceiver",
                "type":"error"
            },{
                "inputs":[{"internalType":"address","name":"sender","type":"address"}],
                "name":"ERC20InvalidSender",
                "type":"error"
            },{
                "inputs":[{"internalType":"address","name":"spender","type":"address"}],
                "name":"ERC20InvalidSpender",
                "type":"error"
            },{
                "inputs":[],
                "name":"EnforcedPause",
                "type":"error"
            },{
                "inputs":[],
                "name":"ExpectedPause",
                "type":"error"
            },{
                "inputs":[{"internalType":"address","name":"owner","type":"address"}],
                "name":"OwnableInvalidOwner",
                "type":"error"
            },{
                "inputs":[{"internalType":"address","name":"account","type":"address"}],
                "name":"OwnableUnauthorizedAccount",
                "type":"error"
            },{
                "inputs":[],
                "name":"ReentrancyGuardReentrantCall",
                "type":"error"
            },{
                "anonymous":false,
                "inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],
                "name":"Approval",
                "type":"event"
            },{
                "anonymous":false,
                "inputs":[{"indexed":true,"internalType":"address","name":"depositor","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],
                "name":"CollateralDeposited",
                "type":"event"
            },{
                "anonymous":false,
                "inputs":[{"indexed":true,"internalType":"address","name":"withdrawer","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],
                "name":"CollateralWithdrawn",
                "type":"event"
            },{
                "anonymous":false,
                "inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],
                "name":"OwnershipTransferred",
                "type":"event"
            },{
                "anonymous":false,
                "inputs":[{"indexed":false,"internalType":"address","name":"account","type":"address"}],
                "name":"Paused",
                "type":"event"
            },{
                "anonymous":false,
                "inputs":[{"indexed":false,"internalType":"uint256","name":"oldRatio","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"newRatio","type":"uint256"}],
                "name":"ReserveRatioUpdated",
                "type":"event"
            },{
                "anonymous":false,
                "inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":false,"internalType":"uint256","name":"hpAmount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"usdtReturned","type":"uint256"}],
                "name":"TokensBurned",
                "type":"event"
            },{
                "anonymous":false,
                "inputs":[{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"hpAmount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"usdtCollateral","type":"uint256"}],
                "name":"TokensMinted",
                "type":"event"
            },{
                "anonymous":false,
                "inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],
                "name":"Transfer",
                "type":"event"
            },{
                "anonymous":false,
                "inputs":[{"indexed":false,"internalType":"address","name":"account","type":"address"}],
                "name":"Unpaused",
                "type":"event"
            },{
                "inputs":[],
                "name":"HP_DECIMALS",
                "outputs":[{"internalType":"uint256","name":"","type":"uint256"}],
                "stateMutability":"view",
                "type":"function"
            },{
                "inputs":[],
                "name":"HP_TO_USDT_RATE",
                "outputs":[{"internalType":"uint256","name":"","type":"uint256"}],
                "stateMutability":"view",
                "type":"function"
            },{
                "inputs":[],
                "name":"USDT",
                "outputs":[{"internalType":"contract IERC20","name":"","type":"address"}],
                "stateMutability":"view",
                "type":"function"
            },{
                "inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],
                "name":"allowance",
                "outputs":[{"internalType":"uint256","name":"","type":"uint256"}],
                "stateMutability":"view",
                "type":"function"
            },{
                "inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],
                "name":"approve",
                "outputs":[{"internalType":"bool","name":"","type":"bool"}],
                "stateMutability":"nonpayable",
                "type":"function"
            },{
                "inputs":[{"internalType":"address","name":"account","type":"address"}],
                "name":"balanceOf",
                "outputs":[{"internalType":"uint256","name":"","type":"uint256"}],
                "stateMutability":"view",
                "type":"function"
            },{
                "inputs":[{"internalType":"uint256","name":"hpAmount","type":"uint256"}],
                "name":"burnTokens",
                "outputs":[],
                "stateMutability":"nonpayable",
                "type":"function"
            },{
                "inputs":[{"internalType":"uint256","name":"hpAmount","type":"uint256"}],
                "name":"calculateCollateralNeeded",
                "outputs":[{"internalType":"uint256","name":"","type":"uint256"}],
                "stateMutability":"view",
                "type":"function"
            },{
                "inputs":[{"internalType":"uint256","name":"hpAmount","type":"uint256"}],
                "name":"calculateUSDTReturn",
                "outputs":[{"internalType":"uint256","name":"","type":"uint256"}],
                "stateMutability":"pure",
                "type":"function"
            },{
                "inputs":[],
                "name":"decimals",
                "outputs":[{"internalType":"uint8","name":"","type":"uint8"}],
                "stateMutability":"view",
                "type":"function"
            },{
                "inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],
                "name":"depositCollateral",
                "outputs":[],
                "stateMutability":"nonpayable",
                "type":"function"
            },{
                "inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],
                "name":"emergencyWithdraw",
                "outputs":[],
                "stateMutability":"nonpayable",
                "type":"function"
            },{
                "inputs":[],
                "name":"getContractInfo",
                "outputs":[{"internalType":"uint256","name":"totalSupplyHP","type":"uint256"},{"internalType":"uint256","name":"totalCollateralUSDT","type":"uint256"},{"internalType":"uint256","name":"currentReserveRatio","type":"uint256"},{"internalType":"uint256","name":"currentCollateralizationRatio","type":"uint256"}],
                "stateMutability":"view",
                "type":"function"
            },{
                "inputs":[],
                "name":"getCurrentCollateralizationRatio",
                "outputs":[{"internalType":"uint256","name":"","type":"uint256"}],
                "stateMutability":"view",
                "type":"function"
            },{
                "inputs":[{"internalType":"uint256","name":"hpAmount","type":"uint256"}],
                "name":"mintTokens",
                "outputs":[],
                "stateMutability":"nonpayable",
                "type":"function"
            },{
                "inputs":[],
                "name":"name",
                "outputs":[{"internalType":"string","name":"","type":"string"}],
                "stateMutability":"view",
                "type":"function"
            },{
                "inputs":[],
                "name":"owner",
                "outputs":[{"internalType":"address","name":"","type":"address"}],
                "stateMutability":"view",
                "type":"function"
            },{
                "inputs":[],
                "name":"pause",
                "outputs":[],
                "stateMutability":"nonpayable",
                "type":"function"
            },{
                "inputs":[],
                "name":"paused",
                "outputs":[{"internalType":"bool","name":"","type":"bool"}],
                "stateMutability":"view",
                "type":"function"
            },{
                "inputs":[],
                "name":"renounceOwnership",
                "outputs":[],
                "stateMutability":"nonpayable",
                "type":"function"
            },{
                "inputs":[],
                "name":"reserveRatio",
                "outputs":[{"internalType":"uint256","name":"","type":"uint256"}],
                "stateMutability":"view",
                "type":"function"
            },{
                "inputs":[],
                "name":"symbol",
                "outputs":[{"internalType":"string","name":"","type":"string"}],
                "stateMutability":"view",
                "type":"function"
            },{
                "inputs":[],
                "name":"totalCollateral",
                "outputs":[{"internalType":"uint256","name":"","type":"uint256"}],
                "stateMutability":"view",
                "type":"function"
            },{
                "inputs":[],
                "name":"totalSupply",
                "outputs":[{"internalType":"uint256","name":"","type":"uint256"}],
                "stateMutability":"view",
                "type":"function"
            },{
                "inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],
                "name":"transfer",
                "outputs":[{"internalType":"bool","name":"","type":"bool"}],
                "stateMutability":"nonpayable",
                "type":"function"
            },{
                "inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],
                "name":"transferFrom",
                "outputs":[{"internalType":"bool","name":"","type":"bool"}],
                "stateMutability":"nonpayable",
                "type":"function"
            },{
                "inputs":[{"internalType":"address","name":"newOwner","type":"address"}],
                "name":"transferOwnership",
                "outputs":[],
                "stateMutability":"nonpayable",
                "type":"function"
            },{
                "inputs":[],
                "name":"unpause",
                "outputs":[],
                "stateMutability":"nonpayable",
                "type":"function"
            },{
                "inputs":[{"internalType":"uint256","name":"newRatio","type":"uint256"}],
                "name":"updateReserveRatio",
                "outputs":[],
                "stateMutability":"nonpayable",
                "type":"function"
            },{
                "inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],
                "name":"withdrawExcessCollateral",
                "outputs":[],
                "stateMutability":"nonpayable",
                "type":"function"
            }]
        };
        
        // USDT contract configuration (BSC Mainnet)
        this.usdtConfig = {
            address: window.AXZORA_CONFIG?.USDT_BSC_ADDRESS || '0x55d398326f99059fF775485246999027B3197955',
            abi: [
                {
                    "constant": true,
                    "inputs": [{"name": "_owner", "type": "address"}],
                    "name": "balanceOf",
                    "outputs": [{"name": "balance", "type": "uint256"}],
                    "type": "function"
                },
                {
                    "constant": false,
                    "inputs": [
                        {"name": "_spender", "type": "address"},
                        {"name": "_value", "type": "uint256"}
                    ],
                    "name": "approve",
                    "outputs": [{"name": "", "type": "bool"}],
                    "type": "function"
                },
                {
                    "constant": true,
                    "inputs": [
                        {"name": "_owner", "type": "address"},
                        {"name": "_spender", "type": "address"}
                    ],
                    "name": "allowance",
                    "outputs": [{"name": "", "type": "uint256"}],
                    "type": "function"
                },
                {
                    "constant": false,
                    "inputs": [
                        {"name": "_to", "type": "address"},
                        {"name": "_value", "type": "uint256"}
                    ],
                    "name": "transfer",
                    "outputs": [{"name": "", "type": "bool"}],
                    "type": "function"
                },
                {
                    "constant": true,
                    "inputs": [],
                    "name": "decimals",
                    "outputs": [{"name": "", "type": "uint8"}],
                    "type": "function"
                }
            ]
        };
        
        // Network configuration
        this.networks = {
            bsc: {
                chainId: '0x38', // 56 in hex
                chainName: 'Binance Smart Chain',
                nativeCurrency: {
                    name: 'BNB',
                    symbol: 'BNB',
                    decimals: 18
                },
                rpcUrls: ['https://bsc-dataseed1.binance.org/'],
                blockExplorerUrls: ['https://bscscan.com/']
            }
        };
        
        // Transaction data
        this.transactionData = {
            hpBalance: '0',
            usdtBalance: '0',
            bnbBalance: '0',
            pendingTransactions: [],
            transactionHistory: [],
            allowance: '0'
        };
        
        // Market data (will be loaded from BSC)
        this.marketData = {
            hpPrice: '11.00', // 1 HP = 11 USDT (fixed peg)
            usdtPrice: '1.00',
            bnbPrice: '0',
            collateralRatio: '0',
            totalSupply: '0',
            volume24h: '0',
            marketCap: '0',
            holders: '0'
        };
        
        // BSC API endpoints
        this.bscApiEndpoints = {
            bscscan: 'https://api.bscscan.com/api',
            pancakeswap: 'https://api.pancakeswap.info/api/v2',
            coingecko: 'https://api.coingecko.com/api/v3',
            dexscreener: 'https://api.dexscreener.com/latest/dex'
        };
        
        // BSCScan API key (get free from bscscan.com)
        this.bscscanApiKey = window.AXZORA_CONFIG?.BSC_API_KEY || 'YourBSCScanAPIKey';
        
        this.initialize();
    }

    async initialize() {
        try {
            console.log('🔗 Initializing blockchain interface...');
            
            if (typeof window.ethereum !== 'undefined') {
                // Initialize Web3
                this.web3 = new Web3(window.ethereum);
                
                // Setup event listeners
                this.setupEventListeners();
                
                // Remove auto-connect for security - user must manually connect
                // This prevents using cached/old account connections
                localStorage.removeItem('walletConnected');
                console.log('🔒 Auto-connect disabled for security - manual connection required');
                
                console.log('✅ Blockchain interface initialized successfully');
                this.isInitialized = true;
                this.updateStatus('blockchain', true);
                
            } else {
                throw new Error('Web3 provider not found');
            }
            
        } catch (error) {
            console.error('❌ Blockchain interface initialization failed:', error);
            this.showWeb3Error();
            this.updateStatus('blockchain', false);
        }
    }

    setupEventListeners() {
        // Account change listener
        window.ethereum.on('accountsChanged', (accounts) => {
            console.log('👤 Accounts changed:', accounts);
            this.handleAccountChange(accounts);
        });
        
        // Chain change listener
        window.ethereum.on('chainChanged', (chainId) => {
            console.log('🔄 Chain changed:', chainId);
            this.handleChainChange(chainId);
        });
        
        // Disconnect listener
        window.ethereum.on('disconnect', (error) => {
            console.log('🔌 Wallet disconnected:', error);
            this.handleDisconnect();
        });
        
        // Voice command listeners
        window.addEventListener('voice-command', (event) => {
            this.handleVoiceCommand(event.detail);
        });
    }

    async connectWallet() {
        try {
            console.log('🔗 Connecting to MetaMask...');
            
            // Request account access
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });
            
            if (accounts.length === 0) {
                throw new Error('No accounts found');
            }
            
            this.account = accounts[0];
            this.connectedAccount = this.account; // For UI access
            
            console.log('✅ Connected:', this.account);
            
            // Get chain ID
            this.chainId = await window.ethereum.request({
                method: 'eth_chainId'
            });
            
            const networkId = parseInt(this.chainId, 16);
            const networkName = this.getNetworkName(networkId);
            console.log(`🌐 Network: ${networkId} (${networkName})`);
            
            // Diagnostic info
            console.log('🔍 Network Diagnostics:');
            console.log(`  - Chain ID (hex): ${this.chainId}`);
            console.log(`  - Chain ID (decimal): ${networkId}`);
            console.log(`  - Network Name: ${networkName}`);
            console.log(`  - Expected BSC Chain ID: 56`);
            
            // Check if on BSC, if not, ask to switch
            if (networkId !== 56) {
                console.log('⚠️ Not on BSC network, attempting to switch...');
                const switched = await this.switchToBSC();
                if (!switched) {
                    // Continue without switching - show warning but still connect
                    this.showError(`Warning: Connected to ${networkName}. Some features may not work correctly. Please switch to BSC Mainnet.`);
                }
            }
            
            // Always set connected state first
            this.isConnected = true;
            localStorage.setItem('walletConnected', 'true');
            
            // Try to initialize contract and load data
            try {
                await this.initializeContract();
                await this.loadAccountData();
            } catch (contractError) {
                console.warn('⚠️ Contract initialization failed, but wallet connected:', contractError);
                
                // Check if it's a network issue
                const currentNetworkId = parseInt(this.chainId, 16);
                if (currentNetworkId !== 56) {
                    this.showError(`Connected to network ${currentNetworkId}. Please switch to BSC (network 56) for full functionality.`);
                } else {
                    this.showError('Contract not available on this network. Some features may be limited.');
                }
                
                // Still show basic connection success
                this.updateBasicWalletInfo();
            }
            
            console.log('✅ Wallet connected successfully');
            this.updateWalletUI();
            this.updateStatus('blockchain', true);
            
            // Notify other systems
            this.dispatchEvent('wallet-connected', {
                account: this.account,
                chainId: this.chainId
            });
            
        } catch (error) {
            console.error('❌ Wallet connection failed:', error);
            this.showError('Failed to connect wallet: ' + error.message);
        }
    }

    async disconnectWallet() {
        try {
            this.account = null;
            this.chainId = null;
            this.isConnected = false;
            this.contract = null;
            
            localStorage.removeItem('walletConnected');
            
            console.log('🔌 Wallet disconnected');
            this.updateWalletUI();
            this.updateStatus('blockchain', false);
            
            this.dispatchEvent('wallet-disconnected', {});
            
        } catch (error) {
            console.error('❌ Wallet disconnection failed:', error);
        }
    }

    async switchToBSC() {
        try {
            console.log('🔄 Switching to BSC network...');
            
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: this.networks.bsc.chainId }]
            });
            
            console.log('✅ Successfully switched to BSC network');
            return true;
            
        } catch (error) {
            // If the chain is not added, add it
            if (error.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [this.networks.bsc]
                    });
                    console.log('✅ Successfully added and switched to BSC network');
                    return true;
                } catch (addError) {
                    console.error('❌ Failed to add BSC network:', addError);
                    return false;
                }
            } else if (error.code === 4001) {
                console.log('⚠️ User rejected network switch');
                return false;
            } else {
                console.error('❌ Failed to switch to BSC network:', error);
                return false;
            }
        }
    }

    async initializeContract() {
        if (!this.web3 || !this.account) {
            console.warn('⚠️ Cannot initialize contracts - missing web3 or account');
            return;
        }
        
        try {
            console.log('📋 Initializing contracts...');
            console.log('🏗️ HP Token address:', this.contractConfig.address);
            console.log('💰 USDT address:', this.usdtConfig.address);
            
            // Initialize Happy Paisa contract
            this.contract = new this.web3.eth.Contract(
                this.contractConfig.abi,
                this.contractConfig.address
            );
            
            // Test HP contract method availability
            if (this.contract.methods && this.contract.methods.balanceOf) {
                console.log('✅ HP contract methods available');
                
                // Verify mintTokens method exists
                if (this.contract.methods.mintTokens) {
                    console.log('✅ HP contract mintTokens method available');
                } else {
                    console.warn('⚠️ HP contract mintTokens method NOT available');
                }
            } else {
                console.warn('⚠️ HP contract methods missing');
            }
            
            // Initialize USDT contract
            this.usdtContract = new this.web3.eth.Contract(
                this.usdtConfig.abi,
                this.usdtConfig.address
            );
            
            // Test USDT contract method availability
            if (this.usdtContract.methods && this.usdtContract.methods.balanceOf) {
                console.log('✅ USDT contract methods available');
            } else {
                console.warn('⚠️ USDT contract methods missing');
            }
            
            // Perform basic contract verification
            await this.verifyContracts();
            
            console.log('📋 Contracts initialized successfully');
            
        } catch (error) {
            console.error('❌ Contract initialization failed:', error);
            console.error('ABI used:', this.contractConfig.abi);
            throw error;
        }
    }
    
    async verifyContracts() {
        try {
            console.log('🔍 Verifying contracts...');
            
            // Check if HP contract address has code
            const hpCode = await this.web3.eth.getCode(this.contractConfig.address);
            if (hpCode === '0x') {
                throw new Error('HP contract address has no code - invalid contract');
            }
            console.log('✅ HP contract has code');
            
            // Check if USDT contract address has code
            const usdtCode = await this.web3.eth.getCode(this.usdtConfig.address);
            if (usdtCode === '0x') {
                throw new Error('USDT contract address has no code - invalid contract');
            }
            console.log('✅ USDT contract has code');
            
            // Try to read basic contract info
            try {
                const hpName = await this.contract.methods.name().call();
                console.log('✅ HP contract name:', hpName);
            } catch (nameError) {
                console.warn('⚠️ Could not read HP contract name:', nameError.message);
            }
            
            try {
                const usdtDecimals = await this.usdtContract.methods.decimals().call();
                console.log('✅ USDT decimals:', usdtDecimals);
            } catch (decimalError) {
                console.warn('⚠️ Could not read USDT decimals:', decimalError.message);
            }
            
        } catch (error) {
            console.error('❌ Contract verification failed:', error);
            throw error;
        }
    }

    async loadAccountData() {
        if (!this.contract || !this.account) {
            console.warn('⚠️ Contract or account not available for loading data');
            return;
        }
        
        try {
            console.log('📊 Loading real account data from BSC...');
            
            // Show loading state
            this.showLoadingState(true);
            
            // Get HP balance with BigInt handling
            console.log('🏦 Loading HP balance...');
            const hpBalanceBigInt = await this.contract.methods.balanceOf(this.account).call();
            this.transactionData.hpBalance = this.web3.utils.fromWei(hpBalanceBigInt.toString(), 'ether');
            console.log(`💰 HP Balance: ${this.transactionData.hpBalance} HP`);
            
            // Get USDT balance with BigInt handling (BSC USDT has 18 decimals!)
            console.log('💵 Loading USDT balance...');
            const usdtBalanceBigInt = await this.usdtContract.methods.balanceOf(this.account).call();
            // Fix USDT balance calculation - BSC USDT uses 18 decimals
            this.transactionData.usdtBalance = this.web3.utils.fromWei(usdtBalanceBigInt.toString(), 'ether');
            console.log(`💵 USDT Balance: ${this.transactionData.usdtBalance} USDT`);
            
            // Get BNB balance with BigInt handling
            console.log('🔶 Loading BNB balance...');
            const bnbBalanceBigInt = await this.web3.eth.getBalance(this.account);
            this.transactionData.bnbBalance = this.web3.utils.fromWei(bnbBalanceBigInt.toString(), 'ether');
            console.log(`🔶 BNB Balance: ${this.transactionData.bnbBalance} BNB`);
            
            // Get USDT allowance for HP contract with BigInt handling (USDT has 18 decimals!)
            const allowanceBigInt = await this.usdtContract.methods.allowance(
                this.account,
                this.contractConfig.address
            ).call();
            // Fix USDT allowance calculation - BSC USDT uses 18 decimals
            this.transactionData.allowance = this.web3.utils.fromWei(allowanceBigInt.toString(), 'ether');
            
            // Update UI with balances
            this.updateBalanceUI();
            
            // Get market data
            await this.loadMarketData();
            
            // Load transaction history
            await this.updateTransactionUI();
            
            this.showLoadingState(false);
            console.log('✅ All real account data loaded successfully');
            
            // Show success notification
            this.showSuccess(`Loaded real data for ${this.account.substring(0, 8)}...`);
            
        } catch (error) {
            console.error('❌ Failed to load account data:', error);
            this.showLoadingState(false);
            this.showError(`Failed to load account data: ${error.message}`);
            
            // Try to show partial data if some calls succeeded
            this.updateBalanceUI();
        }
    }

    async loadMarketData() {
        try {
            console.log('📈 Loading real market data from BSC...');
            
            // Get contract data with BigInt handling
            const totalSupplyBigInt = await this.contract.methods.totalSupply().call();
            this.marketData.totalSupply = this.web3.utils.fromWei(totalSupplyBigInt.toString(), 'ether');
            
            const collateralRatioBigInt = await this.contract.methods.getCurrentCollateralizationRatio().call();
            this.marketData.collateralRatio = collateralRatioBigInt.toString();
            
            // Calculate market cap (Total Supply × Price)
            const marketCap = parseFloat(this.marketData.totalSupply) * parseFloat(this.marketData.hpPrice);
            this.marketData.marketCap = marketCap.toFixed(2);
            
            // Load real-time BNB price
            await this.loadBNBPrice();
            
            // Load token holder count
            await this.loadHolderCount();
            
            // Load transaction volume
            await this.loadTransactionVolume();
            
            console.log('✅ Real market data loaded:', this.marketData);
            this.updateMarketUI();
            
        } catch (error) {
            console.error('❌ Failed to load market data:', error);
        }
    }

    async mintTokens(hpAmount) {
        if (!this.contract || !this.account) {
            throw new Error('Wallet not connected');
        }
        
        try {
            console.log('🏦 Minting tokens:', hpAmount, 'HP');
            console.log('🏢️ Contract address:', this.contractConfig.address);
            console.log('👤 Account:', this.account);
            console.log('🌐 Chain ID:', this.chainId);
            
            // Comprehensive pre-mint validation
            console.log('🔍 Starting comprehensive validation...');
            try {
                await this.validateMintingEnvironment();
                console.log('✅ Environment validation passed');
            } catch (validationError) {
                console.error('❌ Environment validation failed:', validationError);
                throw validationError;
            }
            
            // Convert HP amount to wei (contract expects HP amount in 18 decimals)
            const hpAmountWei = this.web3.utils.toWei(hpAmount.toString(), 'ether');
            console.log('🔄 Converting HP to wei:', hpAmount, 'HP =', hpAmountWei, 'wei');
            
            // Calculate USDT required for approval (contract will need this much USDT)
            const requiredUsdtAmount = parseFloat(hpAmount) * 11.55; // 5% reserve included
            console.log('💵 USDT required by contract:', requiredUsdtAmount, 'USDT');
            
            // Verify contract has mintTokens method
            if (!this.contract.methods.mintTokens) {
                throw new Error('Contract does not have mintTokens method');
            }
            
            // Check if approval is needed
            const currentAllowance = parseFloat(this.transactionData.allowance);
            console.log(`📄 Current allowance: ${currentAllowance} USDT, Required: ${requiredUsdtAmount} USDT`);
            
            if (currentAllowance < requiredUsdtAmount) {
                console.log('📝 Approving USDT spending...');
                await this.approveUSDT(requiredUsdtAmount * 2); // Approve double for future transactions
                console.log('✅ USDT approval completed');
            }
            
            // Check account balances before minting
            console.log('💵 Current USDT balance:', this.transactionData.usdtBalance);
            console.log('🔶 Current BNB balance:', this.transactionData.bnbBalance);
            
            // Validate user has enough USDT
            const userUsdtBalance = parseFloat(this.transactionData.usdtBalance);
            if (userUsdtBalance < requiredUsdtAmount) {
                throw new Error(`Insufficient USDT balance. Required: ${requiredUsdtAmount.toFixed(2)} USDT, Available: ${userUsdtBalance.toFixed(2)} USDT`);
            }
            
            // Estimate gas with BigInt handling and detailed logging
            console.log('⛽ Estimating gas for mint transaction...');
            try {
                const gasEstimateBigInt = await this.contract.methods.mintTokens(hpAmountWei).estimateGas({
                    from: this.account
                });
                const gasEstimate = parseInt(gasEstimateBigInt.toString());
                console.log(`⛽ Gas estimate: ${gasEstimate}`);
                
                // Send mint transaction
                console.log('📤 Sending mint transaction...');
                const tx = await this.contract.methods.mintTokens(hpAmountWei).send({
                    from: this.account,
                    gas: Math.floor(gasEstimate * 1.2) // Add 20% buffer
                });
                
                console.log('✅ Mint transaction successful:', tx.transactionHash);
                
                // Add to pending transactions
                this.addPendingTransaction({
                    type: 'mint',
                    hash: tx.transactionHash,
                    amount: hpAmount,
                    status: 'confirmed',
                    timestamp: new Date()
                });
                
                // Refresh data
                await this.loadAccountData();
                
                this.showSuccess(`Successfully minted ${hpAmount} HP tokens using ${requiredUsdtAmount.toFixed(2)} USDT`);
                
                return tx;
                
            } catch (gasError) {
                console.error('❌ Gas estimation failed:', gasError);
                
                // Try to get more details about the error
                if (gasError.message) {
                    console.error('Gas error message:', gasError.message);
                }
                if (gasError.data) {
                    console.error('Gas error data:', gasError.data);
                }
                
                // Check if it's a contract execution revert
                if (gasError.message.includes('execution reverted')) {
                    throw new Error('Transaction would fail: ' + gasError.message);
                }
                
                throw gasError;
            }
            
        } catch (error) {
            console.error('❌ Mint transaction failed:', error);
            console.error('Error details:', {
                message: error.message,
                code: error.code,
                data: error.data
            });
            
            // Provide more specific error messages
            let errorMessage = error.message;
            if (error.message.includes('Internal JSON-RPC error')) {
                errorMessage = 'RPC connection error. Please check your network connection and try again.';
            } else if (error.message.includes('insufficient funds')) {
                errorMessage = 'Insufficient BNB for transaction fees or insufficient USDT balance.';
            } else if (error.message.includes('execution reverted')) {
                errorMessage = 'Contract rejected the transaction. Please check your balance and allowances.';
            }
            
            this.showError('Mint failed: ' + errorMessage);
            throw error;
        }
    }

    async burnTokens(hpAmount) {
        if (!this.contract || !this.account) {
            throw new Error('Wallet not connected');
        }
        
        try {
            console.log('🔥 Burning tokens:', hpAmount, 'HP');
            
            const amountWei = this.web3.utils.toWei(hpAmount.toString(), 'ether');
            
            // Check balance
            const currentBalance = parseFloat(this.transactionData.hpBalance);
            if (currentBalance < parseFloat(hpAmount)) {
                throw new Error('Insufficient HP balance');
            }
            
            // Estimate gas with BigInt handling
            const gasEstimateBigInt = await this.contract.methods.burnTokens(amountWei).estimateGas({
                from: this.account
            });
            const gasEstimate = parseInt(gasEstimateBigInt.toString());
            
            // Send burn transaction
            const tx = await this.contract.methods.burnTokens(amountWei).send({
                from: this.account,
                gas: Math.floor(gasEstimate * 1.2)
            });
            
            console.log('✅ Burn transaction successful:', tx.transactionHash);
            
            // Add to pending transactions
            this.addPendingTransaction({
                type: 'burn',
                hash: tx.transactionHash,
                amount: hpAmount,
                status: 'confirmed',
                timestamp: new Date()
            });
            
            // Refresh data
            await this.loadAccountData();
            
            this.showSuccess(`Successfully burned ${hpAmount} HP tokens`);
            
            return tx;
            
        } catch (error) {
            console.error('❌ Burn transaction failed:', error);
            this.showError('Burn failed: ' + error.message);
            throw error;
        }
    }

    async transferTokens(toAddress, hpAmount) {
        if (!this.contract || !this.account) {
            throw new Error('Wallet not connected');
        }
        
        try {
            console.log('💸 Transferring tokens:', hpAmount, 'HP to', toAddress);
            
            const amountWei = this.web3.utils.toWei(hpAmount.toString(), 'ether');
            
            // Validate address
            if (!this.web3.utils.isAddress(toAddress)) {
                throw new Error('Invalid recipient address');
            }
            
            // Check balance
            const currentBalance = parseFloat(this.transactionData.hpBalance);
            if (currentBalance < parseFloat(hpAmount)) {
                throw new Error('Insufficient HP balance');
            }
            
            // Estimate gas with BigInt handling
            const gasEstimateBigInt = await this.contract.methods.transfer(toAddress, amountWei).estimateGas({
                from: this.account
            });
            const gasEstimate = parseInt(gasEstimateBigInt.toString());
            
            // Send transfer transaction
            const tx = await this.contract.methods.transfer(toAddress, amountWei).send({
                from: this.account,
                gas: Math.floor(gasEstimate * 1.2)
            });
            
            console.log('✅ Transfer transaction successful:', tx.transactionHash);
            
            // Add to pending transactions
            this.addPendingTransaction({
                type: 'transfer',
                hash: tx.transactionHash,
                amount: hpAmount,
                to: toAddress,
                status: 'confirmed',
                timestamp: new Date()
            });
            
            // Refresh data
            await this.loadAccountData();
            
            this.showSuccess(`Successfully transferred ${hpAmount} HP tokens`);
            
            return tx;
            
        } catch (error) {
            console.error('❌ Transfer transaction failed:', error);
            this.showError('Transfer failed: ' + error.message);
            throw error;
        }
    }

    async approveUSDT(amount) {
        if (!this.usdtContract || !this.account) {
            throw new Error('Wallet not connected');
        }
        
        try {
            // BSC USDT has 18 decimals!
            const amountWei = this.web3.utils.toWei(amount.toString(), 'ether');
            
            // Estimate gas with BigInt handling
            const gasEstimateBigInt = await this.usdtContract.methods.approve(
                this.contractConfig.address,
                amountWei
            ).estimateGas({ from: this.account });
            const gasEstimate = parseInt(gasEstimateBigInt.toString());
            
            // Send approval transaction
            const tx = await this.usdtContract.methods.approve(
                this.contractConfig.address,
                amountWei
            ).send({
                from: this.account,
                gas: Math.floor(gasEstimate * 1.2)
            });
            
            console.log('✅ USDT approval successful:', tx.transactionHash);
            
            // Update allowance
            await this.loadAccountData();
            
            return tx;
            
        } catch (error) {
            console.error('❌ USDT approval failed:', error);
            throw error;
        }
    }

    async handleVoiceCommand(command) {
        if (!this.isConnected) {
            this.showError('Please connect wallet first');
            return;
        }
        
        switch (command.type) {
            case 'mint':
                this.showMintModal();
                break;
                
            case 'burn':
                this.showBurnModal();
                break;
                
            case 'transfer':
                this.showTransferModal();
                break;
                
            case 'show':
                if (command.params.target === 'balance') {
                    this.speakBalance();
                } else if (command.params.target === 'transactions') {
                    this.speakTransactionHistory();
                }
                break;
        }
    }

    handleAccountChange(accounts) {
        if (accounts.length === 0) {
            this.disconnectWallet();
        } else if (accounts[0] !== this.account) {
            this.account = accounts[0];
            this.loadAccountData();
            this.updateWalletUI();
        }
    }

    handleChainChange(chainId) {
        this.chainId = chainId;
        
        if (chainId !== this.networks.bsc.chainId) {
            this.showError('Please switch to Binance Smart Chain');
            this.updateStatus('blockchain', false);
        } else {
            this.initializeContract();
            this.loadAccountData();
            this.updateStatus('blockchain', true);
        }
    }

    handleDisconnect() {
        this.disconnectWallet();
    }

    addPendingTransaction(tx) {
        this.transactionData.pendingTransactions.push(tx);
        this.transactionData.transactionHistory.unshift(tx);
        
        // Keep only last 50 transactions
        if (this.transactionData.transactionHistory.length > 50) {
            this.transactionData.transactionHistory = this.transactionData.transactionHistory.slice(0, 50);
        }
        
        this.updateTransactionUI();
    }

    updateWalletUI() {
        // Update wallet address display
        const walletAddressEl = document.getElementById('walletAddress');
        if (walletAddressEl) {
            walletAddressEl.textContent = this.isConnected 
                ? `${this.account.substring(0, 6)}...${this.account.substring(38)}`
                : 'Not Connected';
        }
        
        // Update connection button
        const connectBtn = document.getElementById('connectWallet');
        if (connectBtn) {
            connectBtn.textContent = this.isConnected ? 'Disconnect' : 'Connect Wallet';
            connectBtn.onclick = this.isConnected ? () => this.disconnectWallet() : () => this.connectWallet();
        }
    }

    updateBalanceUI() {
        // Update HP balance
        const hpBalanceEl = document.getElementById('hpBalance');
        const hpValueEl = document.getElementById('hpValue');
        if (hpBalanceEl) {
            const hpBalance = parseFloat(this.transactionData.hpBalance);
            hpBalanceEl.textContent = hpBalance.toFixed(2);
            
            // Update HP value in INR (assuming 1 USD = 83 INR approximately)
            if (hpValueEl) {
                const hpValueUSD = hpBalance * parseFloat(this.marketData.hpPrice);
                const hpValueINR = hpValueUSD * 83; // USD to INR conversion
                hpValueEl.textContent = `₹${hpValueINR.toFixed(0)}`;
            }
        }
        
        // Update USDT balance
        const usdtBalanceEl = document.getElementById('usdtBalance');
        const usdtValueEl = document.getElementById('usdtValue');
        if (usdtBalanceEl) {
            const usdtBalance = parseFloat(this.transactionData.usdtBalance);
            usdtBalanceEl.textContent = usdtBalance.toFixed(2);
            
            // Update USDT value in INR
            if (usdtValueEl) {
                const usdtValueINR = usdtBalance * 83; // USD to INR
                usdtValueEl.textContent = `₹${usdtValueINR.toFixed(0)}`;
            }
        }
        
        // Update BNB balance
        const bnbBalanceEl = document.getElementById('bnbBalance');
        const bnbValueEl = document.getElementById('bnbValue');
        if (bnbBalanceEl) {
            const bnbBalance = parseFloat(this.transactionData.bnbBalance);
            bnbBalanceEl.textContent = bnbBalance.toFixed(4);
            
            // Update BNB value in INR
            if (bnbValueEl) {
                const bnbValueUSD = bnbBalance * parseFloat(this.marketData.bnbPrice || '300');
                const bnbValueINR = bnbValueUSD * 83; // USD to INR
                bnbValueEl.textContent = `₹${bnbValueINR.toFixed(0)}`;
            }
        }
        
        // Update portfolio value
        const portfolioValueEl = document.getElementById('portfolioValue');
        if (portfolioValueEl) {
            const hpValue = parseFloat(this.transactionData.hpBalance) * parseFloat(this.marketData.hpPrice);
            const usdtValue = parseFloat(this.transactionData.usdtBalance);
            const bnbValue = parseFloat(this.transactionData.bnbBalance) * parseFloat(this.marketData.bnbPrice || '300');
            const totalValue = hpValue + usdtValue + bnbValue;
            
            portfolioValueEl.textContent = `$${totalValue.toFixed(2)}`;
        }
        
        console.log('💰 Balance UI updated with real data');
    }

    updateMarketUI() {
        // Update total supply
        const totalSupplyEl = document.getElementById('totalSupply');
        if (totalSupplyEl) {
            totalSupplyEl.textContent = parseFloat(this.marketData.totalSupply).toFixed(0);
        }
        
        // Update collateral ratio
        const collateralRatioEl = document.getElementById('collateralRatio');
        if (collateralRatioEl) {
            collateralRatioEl.textContent = `${this.marketData.collateralRatio}%`;
        }
    }

    async updateTransactionUI() {
        const transactionsList = document.getElementById('transactionsList');
        if (!transactionsList) return;
        
        transactionsList.innerHTML = '<div class="loading-transactions">🔄 Loading transactions...</div>';
        
        try {
            // Load real transactions from BSC
            const realTransactions = await this.getTokenTransactions(this.account, 10);
            
            transactionsList.innerHTML = '';
            
            // Combine real transactions with pending ones
            const allTransactions = [...this.transactionData.pendingTransactions, ...realTransactions];
            
            if (allTransactions.length === 0) {
                transactionsList.innerHTML = '<div class="no-transactions">📋 No transactions found</div>';
                return;
            }
            
            allTransactions.slice(0, 10).forEach(tx => {
                const txElement = document.createElement('div');
                txElement.className = 'transaction-item';
                
                // Determine transaction type and details
                let txType = tx.type || 'unknown';
                let txAmount = tx.amount || tx.value || '0';
                let txStatus = tx.status || 'confirmed';
                let txHash = tx.hash || tx.transactionHash;
                
                // Format based on transaction type
                if (tx.from && tx.to) {
                    if (tx.to.toLowerCase() === this.account?.toLowerCase()) {
                        txType = 'receive';
                    } else {
                        txType = 'send';
                    }
                }
                
                txElement.innerHTML = `
                    <div class="transaction-info">
                        <div class="transaction-type">${this.getTransactionIcon(txType)} ${txType.toUpperCase()}</div>
                        <div class="transaction-amount">${parseFloat(txAmount).toFixed(4)} HP</div>
                    </div>
                    <div class="transaction-meta">
                        <div class="transaction-status status-${txStatus}">${txStatus}</div>
                        <div class="transaction-time">${this.formatTime(tx.timestamp)}</div>
                    </div>
                `;
                
                if (txHash) {
                    txElement.onclick = () => {
                        window.open(`https://bscscan.com/tx/${txHash}`, '_blank');
                    };
                    txElement.style.cursor = 'pointer';
                    txElement.title = 'Click to view on BSCScan';
                }
                
                transactionsList.appendChild(txElement);
            });
            
        } catch (error) {
            console.error('❌ Failed to update transaction UI:', error);
            transactionsList.innerHTML = '<div class="error-transactions">❌ Failed to load transactions</div>';
        }
    }
    
    getTransactionIcon(type) {
        const icons = {
            'mint': '🏭',
            'burn': '🔥',
            'send': '📸',
            'receive': '📸',
            'transfer': '🔄',
            'approve': '✅',
            'unknown': '❓'
        };
        return icons[type] || icons.unknown;
    }

    showMintModal() {
        console.log('🏦 Opening mint modal');
        this.openMintModal();
    }

    showBurnModal() {
        console.log('🔥 Opening burn modal');
        this.openBurnModal();
    }

    showTransferModal() {
        console.log('💸 Opening transfer modal');
        this.showNotification('Transfer interface coming soon!', 'info');
    }
    
    // Open mint modal with current balances
    openMintModal() {
        const modal = document.getElementById('mintModal');
        const usdtBalance = document.getElementById('mintUsdtBalance');
        
        // Update USDT balance in modal
        if (usdtBalance) {
            usdtBalance.textContent = `${parseFloat(this.transactionData.usdtBalance).toFixed(2)} USDT`;
        }
        
        // Show modal
        modal.classList.add('show');
        
        // Set default value to 1 HP
        const hpAmountInput = document.getElementById('hpAmount');
        if (hpAmountInput) {
            hpAmountInput.value = '1.0';
            this.updateMintCalculation();
        }
    }
    
    // Open burn modal with current balances  
    openBurnModal() {
        const modal = document.getElementById('burnModal');
        const hpBalance = document.getElementById('burnHpBalance');
        
        // Update HP balance in modal
        if (hpBalance) {
            hpBalance.textContent = `${parseFloat(this.transactionData.hpBalance).toFixed(2)} HP`;
        }
        
        // Show modal
        modal.classList.add('show');
        
        // Set default value to 1 HP
        const burnHpAmountInput = document.getElementById('burnHpAmount');
        if (burnHpAmountInput) {
            burnHpAmountInput.value = '1.0';
            this.updateBurnCalculation();
        }
    }
    
    // Update mint calculation when amount changes
    updateMintCalculation() {
        const hpAmount = parseFloat(document.getElementById('hpAmount')?.value || '0');
        const usdtRequired = hpAmount * 11.55; // 1 HP = 11.55 USDT (includes 5% reserve)
        
        const usdtRequiredEl = document.getElementById('usdtRequired');
        if (usdtRequiredEl) {
            usdtRequiredEl.textContent = `Required: ${usdtRequired.toFixed(2)} USDT (includes 5% reserve)`;
        }
        
        // Check if user has enough USDT
        const userUsdt = parseFloat(this.transactionData.usdtBalance);
        const mintButton = document.getElementById('mintButton');
        
        if (mintButton) {
            if (usdtRequired > userUsdt) {
                mintButton.disabled = true;
                mintButton.querySelector('.btn-text').textContent = 'Insufficient USDT';
            } else {
                mintButton.disabled = false;
                mintButton.querySelector('.btn-text').textContent = 'Auto Mint HP';
            }
        }
    }
    
    // Update burn calculation when amount changes
    updateBurnCalculation() {
        const hpAmount = parseFloat(document.getElementById('burnHpAmount')?.value || '0');
        const usdtReceived = hpAmount * 11; // 1 HP = 11 USDT
        
        const usdtReceivedEl = document.getElementById('usdtReceived');
        if (usdtReceivedEl) {
            usdtReceivedEl.textContent = `You'll receive: ${usdtReceived.toFixed(2)} USDT`;
        }
        
        // Check if user has enough HP
        const userHp = parseFloat(this.transactionData.hpBalance);
        const burnButton = document.getElementById('burnButton');
        
        if (burnButton) {
            if (hpAmount > userHp) {
                burnButton.disabled = true;
                burnButton.querySelector('.btn-text').textContent = 'Insufficient HP';
            } else {
                burnButton.disabled = false;
                burnButton.querySelector('.btn-text').textContent = 'Auto Burn HP';
            }
        }
    }
    
    // Automatic mint process with steps
    async autoMintTokens(hpAmount) {
        const steps = document.getElementById('mintSteps');
        const step1 = document.getElementById('step1');
        const step2 = document.getElementById('step2');
        const step3 = document.getElementById('step3');
        const mintButton = document.getElementById('mintButton');
        
        try {
            console.log(`🏦 Starting auto mint for ${hpAmount} HP`);
            
            // Disable button and show steps
            mintButton.disabled = true;
            steps.style.display = 'block';
            
            // Step 1: Check USDT allowance
            step1.classList.add('active');
            step1.querySelector('.step-icon').textContent = '⏳';
            
            const usdtRequired = parseFloat(hpAmount) * 11.55; // Same as contract calculation
            console.log(`📄 Required USDT: ${usdtRequired}`);
            
            // Get current allowance with proper BigInt handling
            const currentAllowanceBigInt = await this.usdtContract.methods.allowance(
                this.account,
                this.contractConfig.address
            ).call();
            
            // Convert BigInt to USDT amount (BSC USDT has 18 decimals!)
            const allowanceAmount = parseFloat(this.web3.utils.fromWei(currentAllowanceBigInt.toString(), 'ether'));
            console.log(`📄 Current USDT allowance: ${allowanceAmount}`);
            
            step1.classList.remove('active');
            step1.classList.add('completed');
            step1.querySelector('.step-icon').textContent = '✅';
            
            // Step 2: Approve USDT if needed
            if (allowanceAmount < usdtRequired) {
                step2.classList.add('active');
                step2.querySelector('.step-icon').textContent = '⏳';
                step2.querySelector('.step-text').textContent = '2. Approving USDT spending...';
                
                await this.approveUSDT(usdtRequired * 2); // Approve double for future use
                
                step2.classList.remove('active');
                step2.classList.add('completed');
                step2.querySelector('.step-icon').textContent = '✅';
                step2.querySelector('.step-text').textContent = '2. USDT approved successfully!';
            } else {
                step2.classList.add('completed');
                step2.querySelector('.step-icon').textContent = '✅';
                step2.querySelector('.step-text').textContent = '2. USDT allowance sufficient!';
            }
            
            // Step 3: Mint HP tokens
            step3.classList.add('active');
            step3.querySelector('.step-icon').textContent = '⏳';
            
            // Call mintTokens with the HP amount (function expects HP, not USDT)
            const tx = await this.mintTokens(hpAmount);
            
            step3.classList.remove('active');
            step3.classList.add('completed');
            step3.querySelector('.step-icon').textContent = '✅';
            step3.querySelector('.step-text').textContent = '3. HP tokens minted successfully!';
            
            // Success!
            this.showSuccess(`✅ Successfully minted ${hpAmount} HP tokens!`);
            
            // Speak success
            if (window.voiceProcessor) {
                window.voiceProcessor.speak(`Successfully minted ${hpAmount} Happy Paisa tokens!`);
            }
            
            // Close modal after 2 seconds
            setTimeout(() => {
                this.closeMintModal();
            }, 2000);
            
            return tx;
            
        } catch (error) {
            console.error('❌ Auto mint failed:', error);
            
            // Mark current step as error
            const activeStep = steps.querySelector('.step.active');
            if (activeStep) {
                activeStep.classList.remove('active');
                activeStep.classList.add('error');
                activeStep.querySelector('.step-icon').textContent = '❌';
                activeStep.querySelector('.step-text').textContent += ' - Failed!';
            }
            
            this.showError(`Failed to mint HP: ${error.message}`);
            mintButton.disabled = false;
            
            throw error;
        }
    }
    
    // Automatic burn process with steps
    async autoBurnTokens(hpAmount) {
        const steps = document.getElementById('burnSteps');
        const burnStep1 = document.getElementById('burnStep1');
        const burnStep2 = document.getElementById('burnStep2');
        const burnButton = document.getElementById('burnButton');
        
        try {
            console.log(`🔥 Starting auto burn for ${hpAmount} HP`);
            
            // Disable button and show steps
            burnButton.disabled = true;
            steps.style.display = 'block';
            
            // Step 1: Burn HP tokens
            burnStep1.classList.add('active');
            burnStep1.querySelector('.step-icon').textContent = '⏳';
            
            const tx = await this.burnTokens(hpAmount);
            
            burnStep1.classList.remove('active');
            burnStep1.classList.add('completed');
            burnStep1.querySelector('.step-icon').textContent = '✅';
            burnStep1.querySelector('.step-text').textContent = '1. HP tokens burned successfully!';
            
            // Step 2: USDT received
            burnStep2.classList.add('completed');
            burnStep2.querySelector('.step-icon').textContent = '✅';
            burnStep2.querySelector('.step-text').textContent = `2. Received ${(parseFloat(hpAmount) * 11).toFixed(2)} USDT!`;
            
            // Success!
            this.showSuccess(`✅ Successfully burned ${hpAmount} HP and received ${(parseFloat(hpAmount) * 11).toFixed(2)} USDT!`);
            
            // Speak success
            if (window.voiceProcessor) {
                window.voiceProcessor.speak(`Successfully burned ${hpAmount} Happy Paisa tokens and received ${(parseFloat(hpAmount) * 11).toFixed(2)} USDT!`);
            }
            
            // Close modal after 2 seconds
            setTimeout(() => {
                this.closeBurnModal();
            }, 2000);
            
            return tx;
            
        } catch (error) {
            console.error('❌ Auto burn failed:', error);
            
            // Mark current step as error
            const activeStep = steps.querySelector('.step.active');
            if (activeStep) {
                activeStep.classList.remove('active');
                activeStep.classList.add('error');
                activeStep.querySelector('.step-icon').textContent = '❌';
                activeStep.querySelector('.step-text').textContent += ' - Failed!';
            }
            
            this.showError(`Failed to burn HP: ${error.message}`);
            burnButton.disabled = false;
            
            throw error;
        }
    }
    
    // Close modals
    closeMintModal() {
        const modal = document.getElementById('mintModal');
        modal.classList.remove('show');
        
        // Reset form
        const steps = document.getElementById('mintSteps');
        steps.style.display = 'none';
        
        // Reset steps
        const allSteps = steps.querySelectorAll('.step');
        allSteps.forEach(step => {
            step.classList.remove('active', 'completed', 'error');
            step.querySelector('.step-icon').textContent = '⏳';
        });
        
        // Reset original step text
        document.getElementById('step1').querySelector('.step-text').textContent = '1. Checking USDT allowance...';
        document.getElementById('step2').querySelector('.step-text').textContent = '2. Approving USDT (if needed)...';
        document.getElementById('step3').querySelector('.step-text').textContent = '3. Minting HP tokens...';
        
        // Re-enable button
        const mintButton = document.getElementById('mintButton');
        mintButton.disabled = false;
    }
    
    closeBurnModal() {
        const modal = document.getElementById('burnModal');
        modal.classList.remove('show');
        
        // Reset form
        const steps = document.getElementById('burnSteps');
        steps.style.display = 'none';
        
        // Reset steps
        const allSteps = steps.querySelectorAll('.step');
        allSteps.forEach(step => {
            step.classList.remove('active', 'completed', 'error');
            step.querySelector('.step-icon').textContent = '⏳';
        });
        
        // Reset original step text
        document.getElementById('burnStep1').querySelector('.step-text').textContent = '1. Burning HP tokens...';
        document.getElementById('burnStep2').querySelector('.step-text').textContent = '2. Receiving USDT...';
        
        // Re-enable button
        const burnButton = document.getElementById('burnButton');
        burnButton.disabled = false;
    }

    speakBalance() {
        const balanceText = `Your current balance is ${this.transactionData.hpBalance} Happy Paisa tokens, ${this.transactionData.usdtBalance} USDT, and ${this.transactionData.bnbBalance} BNB.`;
        
        if (window.voiceProcessor) {
            window.voiceProcessor.speak(balanceText);
        }
    }

    speakTransactionHistory() {
        const recentTx = this.transactionData.transactionHistory[0];
        let message = 'No recent transactions found.';
        
        if (recentTx) {
            message = `Your last transaction was a ${recentTx.type} of ${recentTx.amount} tokens, completed at ${this.formatTime(recentTx.timestamp)}.`;
        }
        
        if (window.voiceProcessor) {
            window.voiceProcessor.speak(message);
        }
    }

    formatTime(timestamp) {
        return new Date(timestamp).toLocaleTimeString();
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type = 'info') {
        const notification = {
            id: Date.now(),
            message: message,
            type: type,
            timestamp: new Date()
        };
        
        const event = new CustomEvent('show-notification', { detail: notification });
        window.dispatchEvent(event);
    }

    updateStatus(system, isActive) {
        const statusEl = document.getElementById(`${system}Status`);
        if (statusEl) {
            const dot = statusEl.querySelector('.status-dot');
            if (dot) {
                dot.classList.toggle('active', isActive);
                dot.classList.toggle('inactive', !isActive);
            }
        }
    }

    showWeb3Error() {
        const blockchainSection = document.querySelector('.trading-dashboard');
        if (blockchainSection) {
            const errorDiv = document.createElement('div');
            errorDiv.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #ff6b6b; background: rgba(255,107,107,0.1); border-radius: 10px; margin: 10px;">
                    <div style="font-size: 1.5rem; margin-bottom: 10px;">🔗</div>
                    <div>Web3 wallet not found</div>
                    <div style="font-size: 0.8rem; opacity: 0.7; margin-top: 5px;">Please install MetaMask or similar wallet</div>
                </div>
            `;
            blockchainSection.prepend(errorDiv);
        }
    }

    dispatchEvent(eventType, data) {
        const event = new CustomEvent(eventType, { detail: data });
        window.dispatchEvent(event);
    }
    
    showLoadingState(isLoading) {
        // Update loading indicators in the UI
        const loadingElements = [
            'hpBalance',
            'usdtBalance', 
            'bnbBalance',
            'totalSupply',
            'collateralRatio',
            'marketCap',
            'volume24h',
            'holders'
        ];
        
        loadingElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                if (isLoading) {
                    element.textContent = '⏳';
                    element.classList.add('loading');
                } else {
                    element.classList.remove('loading');
                }
            }
        });
        
        // Show/hide loading message
        if (isLoading) {
            console.log('🔄 Loading real BSC data...');
        }
    }
    
    updateBasicWalletInfo() {
        // Update basic wallet connection info when contracts fail
        console.log('🔗 Updating basic wallet info (contracts unavailable)');
        
        try {
            // Try to get BNB balance at least
            this.web3.eth.getBalance(this.account).then(balance => {
                this.transactionData.bnbBalance = this.web3.utils.fromWei(balance, 'ether');
                this.updateBalanceUI();
                console.log(`🔶 BNB Balance: ${this.transactionData.bnbBalance} BNB`);
            }).catch(error => {
                console.warn('⚠️ Failed to get BNB balance:', error);
            });
            
            // Set other values to defaults since contracts aren't available
            this.transactionData.hpBalance = '0';
            this.transactionData.usdtBalance = '0';
            this.updateBalanceUI();
            
        } catch (error) {
            console.warn('⚠️ Failed to update basic wallet info:', error);
        }
    }

    // Public API methods
    isWalletConnected() {
        return this.isConnected;
    }

    getCurrentAccount() {
        return this.account;
    }

    getTransactionData() {
        return { ...this.transactionData };
    }

    getMarketData() {
        return { ...this.marketData };
    }

    async refreshData() {
        if (this.isConnected) {
            await this.loadAccountData();
        }
    }
    
    // Real BSC API methods for live data
    async loadBNBPrice() {
        try {
            // Use CoinGecko instead of BSCScan for BNB price (more reliable)
            const response = await fetch(`${this.bscApiEndpoints.coingecko}/simple/price?ids=binancecoin&vs_currencies=usd`);
            const data = await response.json();
            
            if (data.binancecoin && data.binancecoin.usd) {
                this.marketData.bnbPrice = data.binancecoin.usd.toFixed(2);
                console.log(`💰 BNB Price: $${this.marketData.bnbPrice}`);
            } else {
                // Fallback: try BSCScan V2 stats endpoint
                await this.loadBNBPriceFromBSC();
            }
        } catch (error) {
            console.warn('⚠️ Failed to load BNB price from CoinGecko:', error);
            // Try BSCScan as fallback
            await this.loadBNBPriceFromBSC();
        }
    }
    
    async loadBNBPriceFromBSC() {
        try {
            // Use BSCScan V2 compatible endpoint
            const response = await fetch(
                `${this.bscApiEndpoints.bscscan}?module=stats&action=coinprice&coin=BNB&apikey=${this.bscscanApiKey}`
            );
            const data = await response.json();
            
            if (data.status === '1' && data.result) {
                this.marketData.bnbPrice = parseFloat(data.result.coin_usd).toFixed(2);
                console.log(`💰 BNB Price (BSC): $${this.marketData.bnbPrice}`);
            } else {
                this.marketData.bnbPrice = '300.00'; // Fallback
                console.log('⚠️ Using fallback BNB price');
            }
        } catch (error) {
            console.warn('⚠️ BSCScan BNB price fallback failed:', error);
            this.marketData.bnbPrice = '300.00'; // Fallback
        }
    }
    
    async loadHolderCount() {
        try {
            // Get holder count from BSCScan
            const response = await fetch(
                `${this.bscApiEndpoints.bscscan}?module=token&action=tokenholderlist&contractaddress=${this.contractConfig.address}&page=1&offset=1&apikey=${this.bscscanApiKey}`
            );
            const data = await response.json();
            
            if (data.status === '1') {
                // This is a simplified approach - BSCScan API has limitations
                // For accurate holder count, you'd need a premium API or indexing service
                this.marketData.holders = '1000+'; // Placeholder
                console.log(`👥 Token Holders: ${this.marketData.holders}`);
            }
        } catch (error) {
            console.warn('⚠️ Failed to load holder count:', error);
            this.marketData.holders = '1000+';
        }
    }
    
    async loadTransactionVolume() {
        try {
            // Check if we have a valid API key
            if (this.bscscanApiKey === 'YourBSCScanAPIKey' || this.bscscanApiKey === 'YourBSCScanAPIKeyHere') {
                console.log('⚠️ BSCScan API key not configured, using fallback data');
                this.marketData.volume24h = '0';
                return;
            }
            
            // Get recent transactions for volume calculation using V2 compatible endpoint
            const response = await fetch(
                `${this.bscApiEndpoints.bscscan}?module=account&action=tokentx&contractaddress=${this.contractConfig.address}&page=1&offset=100&startblock=0&endblock=latest&sort=desc&apikey=${this.bscscanApiKey}`
            );
            const data = await response.json();
            
            if (data.status === '1' && data.result) {
                // Calculate 24h volume from recent transactions
                const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
                let volume24h = 0;
                
                data.result.forEach(tx => {
                    const txTime = parseInt(tx.timeStamp) * 1000;
                    if (txTime > oneDayAgo) {
                        const tokenAmount = parseFloat(this.web3.utils.fromWei(tx.value, 'ether'));
                        volume24h += tokenAmount * parseFloat(this.marketData.hpPrice);
                    }
                });
                
                this.marketData.volume24h = volume24h.toFixed(2);
                console.log(`📊 24h Volume: $${this.marketData.volume24h}`);
            } else if (data.message && data.message.includes('API Key')) {
                console.warn('⚠️ BSCScan API key issue:', data.message);
                this.showError('BSCScan API key required for transaction data. Please update config.js');
                this.marketData.volume24h = '0';
            }
        } catch (error) {
            console.warn('⚠️ Failed to load transaction volume:', error);
            this.marketData.volume24h = '0';
        }
    }
    
    async getTokenTransactions(address = null, limit = 10) {
        try {
            const targetAddress = address || this.account;
            if (!targetAddress) return [];
            
            // For now, skip BSCScan API and return empty transactions
            console.log('⚠️ Skipping transaction loading while API is being fixed');
            return [];
            
            // Check if we have a valid API key
            if (this.bscscanApiKey === 'YourBSCScanAPIKey' || this.bscscanApiKey === 'YourBSCScanAPIKeyHere') {
                console.log('⚠️ BSCScan API key not configured, cannot load transaction history');
                return [];
            }
            
            const response = await fetch(
                `${this.bscApiEndpoints.bscscan}?module=account&action=tokentx&contractaddress=${this.contractConfig.address}&address=${targetAddress}&page=1&offset=${limit}&startblock=0&endblock=latest&sort=desc&apikey=${this.bscscanApiKey}`
            );
            const data = await response.json();
            
            if (data.status === '1' && data.result) {
                return data.result.map(tx => ({
                    hash: tx.hash,
                    from: tx.from,
                    to: tx.to,
                    value: this.web3.utils.fromWei(tx.value, 'ether'),
                    timestamp: new Date(parseInt(tx.timeStamp) * 1000),
                    blockNumber: tx.blockNumber,
                    type: tx.to.toLowerCase() === targetAddress.toLowerCase() ? 'receive' : 'send'
                }));
            }
            
            return [];
        } catch (error) {
            console.error('❌ Failed to load token transactions:', error);
            return [];
        }
    }
    
    async getContractEvents(eventName = null, fromBlock = 'latest') {
        try {
            if (!this.contract) return [];
            
            let events;
            if (eventName) {
                events = await this.contract.getPastEvents(eventName, {
                    fromBlock: fromBlock,
                    toBlock: 'latest'
                });
            } else {
                events = await this.contract.getPastEvents('allEvents', {
                    fromBlock: fromBlock,
                    toBlock: 'latest'
                });
            }
            
            return events.map(event => ({
                event: event.event,
                blockNumber: event.blockNumber,
                transactionHash: event.transactionHash,
                returnValues: event.returnValues,
                timestamp: new Date() // Would need additional call to get block timestamp
            }));
        } catch (error) {
            console.error('❌ Failed to load contract events:', error);
            return [];
        }
    }
    
    async validateMintingEnvironment() {
        console.log('🔍 Validating minting environment...');
        
        // 1. Check current network
        const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
        const networkId = parseInt(currentChainId, 16);
        const networkName = this.getNetworkName(networkId);
        
        console.log(`🌐 Current Network: ${networkId} (${networkName})`);
        
        if (networkId !== 56) {
            throw new Error(`Wrong network! Please switch to BSC Mainnet (56). Currently on: ${networkName}`);
        }
        
        // 2. Test RPC connection with multiple endpoints
        console.log('📶 Testing RPC connection...');
        
        const rpcEndpoints = [
            'https://bsc-dataseed1.binance.org/',
            'https://bsc-dataseed2.binance.org/',
            'https://bsc-dataseed3.binance.org/',
            'https://bsc-dataseed4.binance.org/',
            'https://bsc-dataseed1.defibit.io/',
            'https://bsc-dataseed2.defibit.io/',
            'https://rpc.ankr.com/bsc'
        ];
        
        let rpcWorking = false;
        let lastError = null;
        
        // Try current Web3 provider first
        try {
            console.log('🔍 Testing current Web3 provider...');
            const blockNumber = await this.web3.eth.getBlockNumber();
            console.log(`✅ Current RPC Connection OK - Latest block: ${blockNumber}`);
            rpcWorking = true;
        } catch (rpcError) {
            console.error('❌ Current RPC Failed:', rpcError);
            lastError = rpcError;
            
            // Try fallback RPC endpoints
            console.log('🔄 Trying fallback RPC endpoints...');
            
            for (const endpoint of rpcEndpoints) {
                try {
                    console.log(`🔍 Testing RPC: ${endpoint}`);
                    const testWeb3 = new Web3(endpoint);
                    const blockNumber = await testWeb3.eth.getBlockNumber();
                    console.log(`✅ Fallback RPC OK - ${endpoint} - Block: ${blockNumber}`);
                    
                    // Switch to working RPC
                    this.web3 = testWeb3;
                    console.log(`🔄 Switched to working RPC: ${endpoint}`);
                    rpcWorking = true;
                    break;
                } catch (endpointError) {
                    console.warn(`⚠️ RPC ${endpoint} failed:`, endpointError.message);
                    lastError = endpointError;
                }
            }
        }
        
        if (!rpcWorking) {
            console.error('❌ All RPC endpoints failed. Last error:', lastError);
            console.error('🌐 Network details:');
            console.error('  - User Agent:', navigator.userAgent);
            console.error('  - Online:', navigator.onLine);
            console.error('  - Connection:', navigator.connection);
            
            throw new Error(`All RPC endpoints failed. Last error: ${lastError?.message || 'Unknown RPC error'}. Please check your internet connection or try again later.`);
        }
        
        // 3. Verify contracts exist
        console.log('📝 Verifying contracts...');
        const hpCode = await this.web3.eth.getCode(this.contractConfig.address);
        if (hpCode === '0x') {
            throw new Error(`HP contract not found at address: ${this.contractConfig.address}`);
        }
        
        const usdtCode = await this.web3.eth.getCode(this.usdtConfig.address);
        if (usdtCode === '0x') {
            throw new Error(`USDT contract not found at address: ${this.usdtConfig.address}`);
        }
        
        console.log('✅ Contracts verified');
        
        // 4. Test contract calls
        console.log('📞 Testing contract calls...');
        try {
            const hpName = await this.contract.methods.name().call();
            const usdtDecimals = await this.usdtContract.methods.decimals().call();
            console.log(`✅ HP Token: ${hpName}`);
            console.log(`✅ USDT Decimals: ${usdtDecimals}`);
        } catch (callError) {
            console.error('❌ Contract call failed:', callError);
            throw new Error('Contract calls failed. Contract may not be deployed or network issues.');
        }
        
        // 5. Check account balance
        const bnbBalance = await this.web3.eth.getBalance(this.account);
        const bnbBalanceEth = parseFloat(this.web3.utils.fromWei(bnbBalance, 'ether'));
        console.log(`💰 BNB Balance: ${bnbBalanceEth} BNB`);
        
        if (bnbBalanceEth < 0.001) {
            throw new Error('Insufficient BNB for gas fees. Please add some BNB to your wallet.');
        }
        
        console.log('✅ Minting environment validation complete');
    }
    
    getNetworkName(chainId) {
        const networks = {
            1: 'Ethereum Mainnet',
            3: 'Ropsten Testnet',
            4: 'Rinkeby Testnet',
            5: 'Goerli Testnet',
            56: 'BSC Mainnet',
            97: 'BSC Testnet',
            137: 'Polygon Mainnet',
            80001: 'Polygon Mumbai',
            43114: 'Avalanche Mainnet',
            43113: 'Avalanche Testnet',
            250: 'Fantom Mainnet',
            4002: 'Fantom Testnet'
        };
        
        return networks[chainId] || `Unknown Network (${chainId})`;
    }
}

// Initialize blockchain interface with error handling
try {
    console.log('🔗 Creating BlockchainInterface instance...');
    window.blockchainInterface = new BlockchainInterface();
    console.log('✅ BlockchainInterface created successfully:', window.blockchainInterface);
} catch (error) {
    console.error('❌ Failed to create BlockchainInterface:', error);
    
    // Create a minimal fallback object to prevent errors
    window.blockchainInterface = {
        isConnected: false,
        isWalletConnected: () => false,
        connectWallet: () => {
            console.error('Blockchain interface failed to initialize');
            throw new Error('Blockchain interface not available. Please refresh the page.');
        },
        showMintModal: () => console.error('Blockchain interface not available'),
        showBurnModal: () => console.error('Blockchain interface not available')
    };
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BlockchainInterface;
}
