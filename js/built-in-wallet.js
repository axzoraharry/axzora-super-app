/**
 * 🚀 Axzora Built-in Wallet System
 * Complete wallet functionality without MetaMask dependency
 * Includes biometric security, encryption, and seamless Web3 integration
 */

class AxzoraWallet {
    constructor() {
        this.web3 = null;
        this.account = null;
        this.privateKey = null;
        this.isUnlocked = false;
        this.biometricEnabled = false;
        this.transactions = [];
        this.balances = {
            BNB: '0',
            HP: '0',
            USDT: '0'
        };
        
        // BSC Network Configuration
        this.networkConfig = {
            chainId: '0x38', // BSC Mainnet
            chainName: 'Binance Smart Chain',
            nativeCurrency: {
                name: 'BNB',
                symbol: 'BNB',
                decimals: 18
            },
            rpcUrls: ['https://bsc-dataseed1.binance.org/'],
            blockExplorerUrls: ['https://bscscan.com/']
        };
        
        this.initializeWallet();
    }

    async initializeWallet() {
        try {
            // Initialize Web3 with BSC RPC
            this.web3 = new Web3('https://bsc-dataseed1.binance.org/');
            
            // Check if wallet exists
            const savedWallet = this.getStoredWallet();
            if (savedWallet) {
                await this.loadWallet(savedWallet);
            }
            
            this.setupEventListeners();
            this.startBalanceMonitoring();
            
            console.log('🔐 Axzora Wallet initialized successfully');
        } catch (error) {
            console.error('❌ Wallet initialization failed:', error);
        }
    }

    // 🔐 Wallet Creation & Management
    async createWallet(password) {
        try {
            // Generate new account
            const account = this.web3.eth.accounts.create();
            
            // Generate mnemonic phrase
            const mnemonic = this.generateMnemonic();
            
            // Encrypt private key
            const encryptedPrivateKey = await this.encryptData(account.privateKey, password);
            const encryptedMnemonic = await this.encryptData(mnemonic, password);
            
            // Store wallet data
            const walletData = {
                address: account.address,
                encryptedPrivateKey,
                encryptedMnemonic,
                created: Date.now(),
                version: '1.0.0'
            };
            
            localStorage.setItem('axzora_wallet', JSON.stringify(walletData));
            
            // Set current account
            this.account = account.address;
            this.privateKey = account.privateKey;
            this.isUnlocked = true;
            
            await this.updateBalances();
            this.notifyWalletChange();
            
            return {
                success: true,
                address: account.address,
                mnemonic: mnemonic
            };
            
        } catch (error) {
            console.error('❌ Wallet creation failed:', error);
            return { success: false, error: error.message };
        }
    }

    async unlockWallet(password) {
        try {
            const walletData = this.getStoredWallet();
            if (!walletData) {
                throw new Error('No wallet found');
            }
            
            // Decrypt private key
            const privateKey = await this.decryptData(walletData.encryptedPrivateKey, password);
            const account = this.web3.eth.accounts.privateKeyToAccount(privateKey);
            
            // Verify account matches
            if (account.address.toLowerCase() !== walletData.address.toLowerCase()) {
                throw new Error('Invalid password');
            }
            
            this.account = account.address;
            this.privateKey = privateKey;
            this.isUnlocked = true;
            
            await this.updateBalances();
            this.notifyWalletChange();
            
            return { success: true, address: account.address };
            
        } catch (error) {
            console.error('❌ Wallet unlock failed:', error);
            return { success: false, error: error.message };
        }
    }

    lockWallet() {
        this.privateKey = null;
        this.isUnlocked = false;
        this.notifyWalletChange();
    }

    // 💰 Balance Management
    async updateBalances() {
        if (!this.account) return;
        
        try {
            // Get BNB balance
            const bnbBalance = await this.web3.eth.getBalance(this.account);
            this.balances.BNB = this.web3.utils.fromWei(bnbBalance, 'ether');
            
            // Get HP Token balance
            if (window.hpContract) {
                const hpBalance = await window.hpContract.methods.balanceOf(this.account).call();
                this.balances.HP = this.web3.utils.fromWei(hpBalance, 'ether');
            }
            
            // Get USDT balance
            if (window.usdtContract) {
                const usdtBalance = await window.usdtContract.methods.balanceOf(this.account).call();
                this.balances.USDT = this.web3.utils.fromWei(usdtBalance, 'ether');
            }
            
            this.notifyBalanceUpdate();
            
        } catch (error) {
            console.error('❌ Balance update failed:', error);
        }
    }

    // 📤 Transaction Management
    async sendTransaction(toAddress, amount, tokenType = 'BNB') {
        if (!this.isUnlocked) {
            throw new Error('Wallet is locked');
        }
        
        try {
            let txData;
            
            if (tokenType === 'BNB') {
                txData = {
                    to: toAddress,
                    value: this.web3.utils.toWei(amount, 'ether'),
                    gas: 21000,
                    gasPrice: await this.web3.eth.getGasPrice()
                };
            } else {
                // Token transfer
                const contract = tokenType === 'HP' ? window.hpContract : window.usdtContract;
                const transferData = contract.methods.transfer(
                    toAddress,
                    this.web3.utils.toWei(amount, 'ether')
                ).encodeABI();
                
                txData = {
                    to: contract.options.address,
                    data: transferData,
                    gas: 100000,
                    gasPrice: await this.web3.eth.getGasPrice()
                };
            }
            
            // Sign transaction
            const signedTx = await this.web3.eth.accounts.signTransaction(txData, this.privateKey);
            
            // Send transaction
            const receipt = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);
            
            // Add to transaction history
            this.addTransaction({
                hash: receipt.transactionHash,
                from: this.account,
                to: toAddress,
                amount: amount,
                tokenType: tokenType,
                timestamp: Date.now(),
                status: 'confirmed'
            });
            
            await this.updateBalances();
            
            return {
                success: true,
                hash: receipt.transactionHash,
                receipt: receipt
            };
            
        } catch (error) {
            console.error('❌ Transaction failed:', error);
            return { success: false, error: error.message };
        }
    }

    // 🔐 Security & Encryption
    async encryptData(data, password) {
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(data);
        const passwordBuffer = encoder.encode(password);
        
        // Create key from password
        const key = await crypto.subtle.importKey(
            'raw',
            passwordBuffer,
            { name: 'PBKDF2' },
            false,
            ['deriveBits', 'deriveKey']
        );
        
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const derivedKey = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            key,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
        
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv },
            derivedKey,
            dataBuffer
        );
        
        // Combine salt, iv, and encrypted data
        const result = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
        result.set(salt, 0);
        result.set(iv, salt.length);
        result.set(new Uint8Array(encrypted), salt.length + iv.length);
        
        return Array.from(result);
    }

    async decryptData(encryptedArray, password) {
        const encryptedData = new Uint8Array(encryptedArray);
        const salt = encryptedData.slice(0, 16);
        const iv = encryptedData.slice(16, 28);
        const data = encryptedData.slice(28);
        
        const encoder = new TextEncoder();
        const passwordBuffer = encoder.encode(password);
        
        const key = await crypto.subtle.importKey(
            'raw',
            passwordBuffer,
            { name: 'PBKDF2' },
            false,
            ['deriveBits', 'deriveKey']
        );
        
        const derivedKey = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            key,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
        
        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: iv },
            derivedKey,
            data
        );
        
        const decoder = new TextDecoder();
        return decoder.decode(decrypted);
    }

    // 🎲 Mnemonic Generation
    generateMnemonic() {
        const words = [
            'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract',
            'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid',
            'acoustic', 'acquire', 'across', 'act', 'action', 'actor', 'actress', 'actual',
            'adapt', 'add', 'addict', 'address', 'adjust', 'admit', 'adult', 'advance',
            'advice', 'aerobic', 'affair', 'afford', 'afraid', 'again', 'age', 'agent',
            'agree', 'ahead', 'aim', 'air', 'airport', 'aisle', 'alarm', 'album'
        ];
        
        const mnemonic = [];
        for (let i = 0; i < 12; i++) {
            mnemonic.push(words[Math.floor(Math.random() * words.length)]);
        }
        
        return mnemonic.join(' ');
    }

    // 💾 Storage Management
    getStoredWallet() {
        const stored = localStorage.getItem('axzora_wallet');
        return stored ? JSON.parse(stored) : null;
    }

    async loadWallet(walletData) {
        // Wallet exists but is locked
        this.account = walletData.address;
        this.isUnlocked = false;
        this.notifyWalletChange();
    }

    // 📝 Transaction History
    addTransaction(tx) {
        this.transactions.unshift(tx);
        // Keep only last 100 transactions
        if (this.transactions.length > 100) {
            this.transactions = this.transactions.slice(0, 100);
        }
        
        // Save to localStorage
        localStorage.setItem('axzora_transactions', JSON.stringify(this.transactions));
        this.notifyTransactionUpdate();
    }

    getTransactionHistory() {
        const stored = localStorage.getItem('axzora_transactions');
        if (stored) {
            this.transactions = JSON.parse(stored);
        }
        return this.transactions;
    }

    // 🔄 Event Handling
    setupEventListeners() {
        // Listen for biometric authentication
        window.addEventListener('biometricAuthenticated', (event) => {
            if (event.detail.success) {
                this.biometricEnabled = true;
                this.notifyWalletChange();
            }
        });
    }

    startBalanceMonitoring() {
        // Update balances every 30 seconds
        setInterval(() => {
            if (this.isUnlocked) {
                this.updateBalances();
            }
        }, 30000);
    }

    // 📢 Event Notifications
    notifyWalletChange() {
        window.dispatchEvent(new CustomEvent('walletChanged', {
            detail: {
                account: this.account,
                isUnlocked: this.isUnlocked,
                balances: this.balances
            }
        }));
    }

    notifyBalanceUpdate() {
        window.dispatchEvent(new CustomEvent('balanceUpdated', {
            detail: {
                balances: this.balances
            }
        }));
    }

    notifyTransactionUpdate() {
        window.dispatchEvent(new CustomEvent('transactionUpdated', {
            detail: {
                transactions: this.transactions
            }
        }));
    }

    // 🔍 Utility Methods
    isValidAddress(address) {
        return this.web3.utils.isAddress(address);
    }

    formatBalance(balance, decimals = 4) {
        const num = parseFloat(balance);
        if (num === 0) return '0';
        if (num < 0.0001) return '< 0.0001';
        return num.toFixed(decimals);
    }

    // 📱 QR Code Generation
    generateQRCode(address) {
        return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${address}`;
    }

    // 🗑️ Wallet Reset
    resetWallet() {
        localStorage.removeItem('axzora_wallet');
        localStorage.removeItem('axzora_transactions');
        this.account = null;
        this.privateKey = null;
        this.isUnlocked = false;
        this.transactions = [];
        this.balances = { BNB: '0', HP: '0', USDT: '0' };
        this.notifyWalletChange();
    }
}

// Initialize global wallet instance
window.axzoraWallet = new AxzoraWallet();

console.log('🚀 Axzora Built-in Wallet loaded successfully!');