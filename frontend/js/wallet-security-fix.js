/**
 * Wallet Security Fix - Real-time Account Detection
 * Ensures the app always connects to the currently selected account
 * Prevents cached/saved account security issues
 */

class WalletSecurityManager {
    constructor() {
        this.currentAccount = null;
        this.isMonitoring = false;
        this.accountCheckInterval = null;
        this.forceDisconnectOnMismatch = true;
        
        this.init();
    }

    init() {
        console.log('🔒 Initializing Wallet Security Manager...');
        this.setupAccountMonitoring();
        this.patchWalletConnection();
        this.setupSecurityEventListeners();
    }

    /**
     * Force real-time account detection - no cached connections
     */
    async getCurrentMetaMaskAccount() {
        try {
            if (!window.ethereum) {
                return null;
            }

            // Always request fresh account list - never use cache
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            if (!accounts || accounts.length === 0) {
                return null;
            }

            // Return the currently selected account (first in array is selected)
            return accounts[0].toLowerCase();
        } catch (error) {
            console.error('❌ Failed to get current MetaMask account:', error);
            return null;
        }
    }

    /**
     * Setup continuous account monitoring
     */
    setupAccountMonitoring() {
        // Clear any existing monitoring
        if (this.accountCheckInterval) {
            clearInterval(this.accountCheckInterval);
        }

        // Monitor account changes every 2 seconds
        this.accountCheckInterval = setInterval(async () => {
            await this.checkAccountConsistency();
        }, 2000);

        this.isMonitoring = true;
        console.log('🔒 Account monitoring started');
    }

    /**
     * Check if connected account matches currently selected MetaMask account
     */
    async checkAccountConsistency() {
        try {
            const currentMetaMaskAccount = await this.getCurrentMetaMaskAccount();
            
            if (!currentMetaMaskAccount) {
                // No MetaMask account selected
                if (window.blockchainInterface?.isConnected) {
                    console.log('🔒 No MetaMask account selected, disconnecting...');
                    await this.forceDisconnect('No account selected in MetaMask');
                }
                return;
            }

            if (window.blockchainInterface?.isConnected) {
                const connectedAccount = window.blockchainInterface.account?.toLowerCase();
                
                if (connectedAccount && connectedAccount !== currentMetaMaskAccount) {
                    console.log('🚨 SECURITY ALERT: Account mismatch detected!');
                    console.log('Connected:', connectedAccount);
                    console.log('MetaMask Selected:', currentMetaMaskAccount);
                    
                    await this.handleAccountMismatch(connectedAccount, currentMetaMaskAccount);
                }
            }

            this.currentAccount = currentMetaMaskAccount;
        } catch (error) {
            console.error('❌ Account consistency check failed:', error);
        }
    }

    /**
     * Handle account mismatch - security critical
     */
    async handleAccountMismatch(connectedAccount, currentAccount) {
        // Immediate disconnect for security
        await this.forceDisconnect('Account changed in MetaMask');
        
        // Show security warning
        this.showSecurityWarning(
            'Security Alert: Account Changed',
            `MetaMask account was switched from ${connectedAccount.substring(0, 8)}... to ${currentAccount.substring(0, 8)}... Please reconnect to continue.`
        );
        
        // Auto-reconnect to new account after user confirmation
        setTimeout(() => {
            this.offerReconnection(currentAccount);
        }, 1000);
    }

    /**
     * Force disconnect and clear all cached data
     */
    async forceDisconnect(reason) {
        console.log('🔒 Force disconnecting:', reason);
        
        if (window.blockchainInterface) {
            // Clear all connection data
            window.blockchainInterface.account = null;
            window.blockchainInterface.connectedAccount = null;
            window.blockchainInterface.isConnected = false;
            window.blockchainInterface.contract = null;
            window.blockchainInterface.usdtContract = null;
            
            // Clear localStorage
            localStorage.removeItem('walletConnected');
            
            // Update UI
            window.blockchainInterface.updateWalletUI();
            window.blockchainInterface.updateStatus('blockchain', false);
            
            // Dispatch disconnect event
            window.blockchainInterface.dispatchEvent('wallet-disconnected', { reason });
        }
        
        // Hide owner panel if shown
        if (window.ownerManager) {
            window.ownerManager.hideOwnerPanel();
        }
    }

    /**
     * Offer reconnection to new account
     */
    async offerReconnection(newAccount) {
        const shouldReconnect = confirm(
            `Connect to ${newAccount.substring(0, 8)}...${newAccount.substring(newAccount.length - 4)}?\n\nThis is the currently selected account in MetaMask.`
        );
        
        if (shouldReconnect) {
            try {
                await this.secureConnect();
            } catch (error) {
                this.showSecurityWarning('Connection Failed', error.message);
            }
        }
    }

    /**
     * Secure connection method that always uses current account
     */
    async secureConnect() {
        try {
            console.log('🔒 Starting secure wallet connection...');
            
            // Force fresh account detection
            const currentAccount = await this.getCurrentMetaMaskAccount();
            if (!currentAccount) {
                throw new Error('No account selected in MetaMask');
            }
            
            // Clear any cached connection data first
            localStorage.removeItem('walletConnected');
            
            if (window.blockchainInterface) {
                // Force fresh connection
                window.blockchainInterface.account = null;
                window.blockchainInterface.isConnected = false;
                
                // Connect with current account
                await window.blockchainInterface.connectWallet();
                
                // Verify the connection matches current account
                const connectedAccount = window.blockchainInterface.account?.toLowerCase();
                if (connectedAccount !== currentAccount) {
                    throw new Error('Connection verification failed - account mismatch');
                }
                
                console.log('✅ Secure connection verified');
                this.showSecuritySuccess(`Securely connected to ${currentAccount.substring(0, 8)}...`);
            }
            
        } catch (error) {
            console.error('❌ Secure connection failed:', error);
            throw error;
        }
    }

    /**
     * Patch the existing wallet connection to be more secure
     */
    patchWalletConnection() {
        if (window.blockchainInterface) {
            const originalConnect = window.blockchainInterface.connectWallet;
            
            window.blockchainInterface.connectWallet = async function() {
                try {
                    console.log('🔒 Enhanced secure wallet connection...');
                    
                    // Always clear localStorage first to prevent cached connections
                    localStorage.removeItem('walletConnected');
                    
                    // Clear existing connection state
                    this.account = null;
                    this.connectedAccount = null;
                    this.isConnected = false;
                    
                    // Force fresh account request
                    const accounts = await window.ethereum.request({
                        method: 'eth_requestAccounts'
                    });
                    
                    if (!accounts || accounts.length === 0) {
                        throw new Error('No accounts available in MetaMask');
                    }
                    
                    const selectedAccount = accounts[0];
                    console.log('🔒 MetaMask selected account:', selectedAccount);
                    
                    // Double-check this is the current account
                    const verifyAccounts = await window.ethereum.request({
                        method: 'eth_accounts'
                    });
                    
                    if (!verifyAccounts.includes(selectedAccount)) {
                        throw new Error('Account verification failed');
                    }
                    
                    // Proceed with original connection logic
                    this.account = selectedAccount;
                    this.connectedAccount = selectedAccount;
                    
                    // Get and verify network
                    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
                    const networkId = parseInt(chainId, 16);
                    
                    console.log(`🌐 Network: ${networkId}`);
                    
                    // Auto-switch to BSC if needed
                    if (networkId !== 56) {
                        console.log('🔄 Switching to BSC Mainnet...');
                        try {
                            await this.switchToBSC();
                        } catch (switchError) {
                            console.warn('⚠️ Could not switch to BSC:', switchError);
                            this.showNotification('Please manually switch to BSC Mainnet', 'warning');
                        }
                    }
                    
                    this.isConnected = true;
                    
                    // Initialize contracts and load data
                    try {
                        await this.initializeContract();
                        await this.loadAccountData();
                    } catch (contractError) {
                        console.warn('⚠️ Contract initialization issue:', contractError);
                        this.updateBasicWalletInfo();
                    }
                    
                    // Update UI and dispatch events
                    this.updateWalletUI();
                    this.updateStatus('blockchain', true);
                    this.dispatchEvent('wallet-connected', { 
                        account: this.account, 
                        chainId,
                        timestamp: Date.now()
                    });
                    
                    console.log('✅ Secure wallet connection completed');
                    
                } catch (error) {
                    console.error('❌ Secure wallet connection failed:', error);
                    this.showError('Connection failed: ' + error.message);
                    throw error;
                }
            };
            
            console.log('🔒 Wallet connection patched for security');
        }
    }

    /**
     * Setup security event listeners
     */
    setupSecurityEventListeners() {
        // Listen for MetaMask account changes
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', async (accounts) => {
                console.log('🔒 MetaMask accounts changed:', accounts);
                
                if (accounts.length === 0) {
                    // No accounts connected
                    await this.forceDisconnect('All accounts disconnected');
                } else {
                    // Account switched
                    const newAccount = accounts[0].toLowerCase();
                    if (this.currentAccount && this.currentAccount !== newAccount) {
                        console.log('🔒 Account switch detected');
                        await this.handleAccountMismatch(this.currentAccount, newAccount);
                    }
                }
            });
            
            window.ethereum.on('disconnect', () => {
                console.log('🔒 MetaMask disconnected');
                this.forceDisconnect('MetaMask disconnected');
            });
        }
        
        // Listen for page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                // Page became visible, check account consistency
                setTimeout(() => {
                    this.checkAccountConsistency();
                }, 1000);
            }
        });
    }

    /**
     * Show security warning to user
     */
    showSecurityWarning(title, message) {
        if (window.axzoraApp) {
            window.axzoraApp.showNotification({
                message: `🚨 ${title}: ${message}`,
                type: 'error',
                duration: 10000
            });
        } else {
            alert(`🚨 ${title}\n\n${message}`);
        }
    }

    /**
     * Show security success message
     */
    showSecuritySuccess(message) {
        if (window.axzoraApp) {
            window.axzoraApp.showNotification({
                message: `🔒 ${message}`,
                type: 'success',
                duration: 5000
            });
        } else {
            console.log(`🔒 ${message}`);
        }
    }

    /**
     * Stop monitoring (for cleanup)
     */
    stopMonitoring() {
        if (this.accountCheckInterval) {
            clearInterval(this.accountCheckInterval);
            this.accountCheckInterval = null;
        }
        this.isMonitoring = false;
        console.log('🔒 Account monitoring stopped');
    }
}

// Initialize security manager
document.addEventListener('DOMContentLoaded', () => {
    window.walletSecurity = new WalletSecurityManager();
    console.log('🔒 Wallet Security Manager initialized');
});

// Export for global access
window.WalletSecurityManager = WalletSecurityManager;

console.log('🔒 Wallet Security Fix loaded');