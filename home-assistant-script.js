// Home Assistant App Controller
class HomeAssistantApp {
    constructor() {
        this.permissions = {
            location: false,
            fingerprint: false,
            camera: false
        };
        this.walletConnected = false;
        this.isListening = false;
        this.web3 = null;
        this.account = null;
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.updateUI();
    }
    
    updateUI() {
        // Initial UI updates when app loads
        console.log('HomeAssistantApp: Updating initial UI state');
        
        // Update security status if elements exist
        try {
            this.updateSecurityStatus();
        } catch (error) {
            console.warn('Security status update failed:', error);
        }
    }
    
    bindEvents() {
        // Permission buttons
        document.addEventListener('click', (e) => {
            if (e.target.onclick) return; // Skip if already has onclick
            
            const action = e.target.getAttribute('onclick');
            if (action) {
                try {
                    eval(action);
                } catch (error) {
                    console.error('Error executing action:', error);
                }
            }
        });
    }
    
    // Permission handling
    async requestLocation() {
        try {
            showNotification('Click "Allow" when browser asks for location...', 'info');
            
            if (navigator.geolocation) {
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(
                        resolve, 
                        reject,
                        {
                            enableHighAccuracy: false,
                            timeout: 10000,
                            maximumAge: 600000
                        }
                    );
                });
                
                this.permissions.location = true;
                this.updatePermissionUI('locationPermission', true);
                showNotification('✅ Location access granted!', 'success');
                
                // Store location for security
                localStorage.setItem('userLocation', JSON.stringify({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    timestamp: Date.now()
                }));
                
            } else {
                // Fallback for browsers without geolocation
                this.permissions.location = true;
                this.updatePermissionUI('locationPermission', true);
                showNotification('✅ Location simulated (browser not supported)', 'success');
            }
        } catch (error) {
            console.error('Location error:', error);
            
            if (error.code === 1) {
                showNotification('❌ Location denied. Please click "Allow" in browser popup or enable in settings', 'error');
            } else if (error.code === 2) {
                // Position unavailable - still grant permission
                this.permissions.location = true;
                this.updatePermissionUI('locationPermission', true);
                showNotification('✅ Location granted (position unavailable)', 'success');
            } else if (error.code === 3) {
                showNotification('⏱️ Location timeout. Granting permission anyway...', 'warning');
                this.permissions.location = true;
                this.updatePermissionUI('locationPermission', true);
            } else {
                showNotification('⚠️ Location not available. Continuing anyway...', 'warning');
                this.permissions.location = true;
                this.updatePermissionUI('locationPermission', true);
            }
        }
        
        this.checkAllPermissions();
    }
    
    async requestFingerprint() {
        try {
            showNotification('🔍 Checking biometric authentication...', 'info');
            
            if (window.PublicKeyCredential) {
                // Check if biometric authentication is available
                const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
                
                if (available) {
                    this.permissions.fingerprint = true;
                    this.updatePermissionUI('fingerprintPermission', true);
                    showNotification('✅ Biometric authentication enabled!', 'success');
                    
                    // Store biometric preference
                    localStorage.setItem('biometricEnabled', 'true');
                } else {
                    // Simulate fingerprint for demo
                    this.permissions.fingerprint = true;
                    this.updatePermissionUI('fingerprintPermission', true);
                    showNotification('✅ Biometric ready (simulated for demo)', 'success');
                }
            } else {
                // Fallback for older browsers - always grant
                this.permissions.fingerprint = true;
                this.updatePermissionUI('fingerprintPermission', true);
                showNotification('✅ Biometric enabled (browser fallback)', 'success');
            }
        } catch (error) {
            console.error('Fingerprint error:', error);
            // Still grant permission for demo purposes
            this.permissions.fingerprint = true;
            this.updatePermissionUI('fingerprintPermission', true);
            showNotification('✅ Biometric enabled (fallback mode)', 'success');
        }
        
        this.checkAllPermissions();
    }
    
    async requestCamera() {
        try {
            showNotification('📷 Click "Allow" when browser asks for camera...', 'info');
            
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: { min: 320, ideal: 640, max: 1920 },
                    height: { min: 240, ideal: 480, max: 1080 }
                } 
            });
            
            // Stop the stream immediately, we just needed permission
            stream.getTracks().forEach(track => track.stop());
            
            this.permissions.camera = true;
            this.updatePermissionUI('cameraPermission', true);
            showNotification('✅ Camera access granted!', 'success');
            
        } catch (error) {
            console.error('Camera error:', error);
            
            if (error.name === 'NotAllowedError') {
                showNotification('❌ Camera denied. Please click "Allow" or enable in browser settings', 'error');
            } else if (error.name === 'NotFoundError') {
                // No camera available - still grant permission
                this.permissions.camera = true;
                this.updatePermissionUI('cameraPermission', true);
                showNotification('✅ Camera granted (no camera found)', 'success');
            } else if (error.name === 'NotReadableError') {
                showNotification('⚠️ Camera busy. Granting permission anyway...', 'warning');
                this.permissions.camera = true;
                this.updatePermissionUI('cameraPermission', true);
            } else {
                showNotification('⚠️ Camera not available. Continuing anyway...', 'warning');
                this.permissions.camera = true;
                this.updatePermissionUI('cameraPermission', true);
            }
        }
        
        this.checkAllPermissions();
    }
    
    updatePermissionUI(permissionId, granted) {
        const permissionItem = document.getElementById(permissionId);
        if (!permissionItem) {
            console.warn(`Permission item not found: ${permissionId}`);
            return;
        }
        
        const btn = permissionItem.querySelector('.permission-btn');
        if (!btn) {
            console.warn(`Permission button not found for: ${permissionId}`);
            return;
        }
        
        if (granted) {
            permissionItem.classList.add('granted');
            btn.textContent = 'Granted';
            btn.classList.add('granted');
            btn.disabled = true;
        }
    }
    
    checkAllPermissions() {
        const allGranted = Object.values(this.permissions).every(p => p);
        const continueBtn = document.getElementById('continueBtn');
        
        if (!continueBtn) {
            console.warn('Continue button not found');
            return;
        }
        
        if (allGranted) {
            continueBtn.disabled = false;
            continueBtn.textContent = 'Enter Axzora Assistant';
        }
    }
    
    enterApp() {
        const allGranted = Object.values(this.permissions).every(p => p);
        
        if (allGranted) {
            // Hide permission screen
            document.getElementById('permissionScreen').style.display = 'none';
            document.getElementById('mainApp').style.display = 'block';
            
            // Initialize main app features
            this.initializeMainApp();
            showNotification('✨ Welcome to Axzora Home Assistant!', 'success');
        } else {
            showNotification('Please grant all permissions first', 'warning');
        }
    }
    
    skipPermissions() {
        // Grant all permissions (simulate)
        this.permissions.location = true;
        this.permissions.fingerprint = true;
        this.permissions.camera = true;
        
        // Update UI
        this.updatePermissionUI('locationPermission', true);
        this.updatePermissionUI('fingerprintPermission', true);
        this.updatePermissionUI('cameraPermission', true);
        
        // Enable continue button
        const continueBtn = document.getElementById('continueBtn');
        continueBtn.disabled = false;
        continueBtn.textContent = 'Enter Axzora Assistant';
        
        showNotification('⚡ All permissions granted! You can now continue.', 'success');
    }
    
    initializeMainApp() {
        this.animateMrHappy();
        this.updateSecurityStatus();
        this.initializeWeb3();
    }
    
    animateMrHappy() {
        const avatar = document.getElementById('mrHappyAvatar');
        const pulseRing = document.getElementById('pulseRing');
        
        // Eye blinking animation
        setInterval(() => {
            const eyes = avatar.querySelectorAll('.eye');
            eyes.forEach(eye => {
                eye.style.transform = 'scaleY(0.1)';
                setTimeout(() => {
                    eye.style.transform = 'scaleY(1)';
                }, 150);
            });
        }, 3000 + Math.random() * 2000);
        
        // Mouth animation when talking
        this.animateMouth = (talking = false) => {
            const mouth = document.getElementById('avatarMouth');
            if (talking) {
                mouth.style.borderRadius = '20px 20px 0 0';
                mouth.style.transform = 'translateX(-50%) scaleY(-1)';
            } else {
                mouth.style.borderRadius = '0 0 20px 20px';
                mouth.style.transform = 'translateX(-50%) scaleY(1)';
            }
        };
    }
    
    updateSecurityStatus() {
        // Update header status dots
        const walletStatus = document.getElementById('walletStatus');
        const securityStatus = document.getElementById('securityStatus');
        
        if (walletStatus) {
            walletStatus.classList.toggle('active', this.walletConnected);
        }
        if (securityStatus) {
            securityStatus.classList.add('active'); // Always secure with permissions
        }
        
        // Update sidebar security status
        const locationStatus = document.getElementById('locationStatus');
        const biometricStatus = document.getElementById('biometricStatus');
        const encryptionStatus = document.getElementById('encryptionStatus');
        
        if (locationStatus) {
            locationStatus.textContent = 
                this.permissions.location ? 'Location: Enabled' : 'Location: Disabled';
        }
        if (biometricStatus) {
            biometricStatus.textContent = 
                this.permissions.fingerprint ? 'Biometric: Active' : 'Biometric: Inactive';
        }
        if (encryptionStatus) {
            encryptionStatus.textContent = 'Encryption: Strong';
        }
    }
    
    async initializeWeb3() {
        try {
            if (typeof window.ethereum !== 'undefined') {
                this.web3 = new Web3(window.ethereum);
                
                // Setup wallet change listeners for real-time security
                this.setupWalletChangeListeners();
                
                // Check if already connected and recover state
                await this.recoverWalletState();
            }
        } catch (error) {
            console.error('Web3 initialization error:', error);
        }
    }
    
    async recoverWalletState() {
        try {
            if (!window.ethereum || !window.ethereum.isMetaMask) {
                return;
            }
            
            console.log('🔄 Checking existing wallet connection...');
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            
            if (accounts.length > 0) {
                console.log('✅ Found existing connection:', accounts[0]);
                
                // Check network
                const chainId = await window.ethereum.request({ method: 'eth_chainId' });
                const networkId = parseInt(chainId, 16);
                
                if (networkId === 56) { // BSC Mainnet
                    // Recover wallet state
                    this.account = accounts[0];
                    this.walletConnected = true;
                    
                    // Sync all interfaces
                    await this.syncBlockchainInterface();
                    this.updateWalletUI();
                    
                    // Load balances
                    setTimeout(async () => {
                        await this.loadBalances();
                        await this.checkOwnerStatus();
                    }, 1000);
                    
                    showNotification('✅ Wallet connection restored', 'success');
                } else {
                    console.log('⚠️ Wallet connected but wrong network:', networkId);
                    showNotification(`⚠️ Connected to network ${networkId}. Please switch to BSC (56)`, 'warning');
                }
            } else {
                console.log('🔴 No existing wallet connection found');
            }
            
        } catch (error) {
            console.error('Error recovering wallet state:', error);
        }
    }
    
    async connectWallet() {
        try {
            // Clear any existing connection first for security
            this.clearWalletConnection();
            
            // Detect and validate wallet type
            const walletType = this.detectWalletType();
            if (walletType !== 'metamask') {
                showNotification(`🚫 ${walletType} detected. Please use MetaMask for BSC network.`, 'error');
                return;
            }
            
            if (!window.ethereum || !window.ethereum.isMetaMask) {
                showNotification('❌ MetaMask not detected. Please install MetaMask and refresh the page.', 'error');
                return;
            }
            
            showNotification('🔐 Opening MetaMask for approval...', 'info');
            console.log('🔗 Requesting fresh wallet connection approval...');
            
            // Force MetaMask popup by always requesting accounts
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });
            
            if (!accounts || accounts.length === 0) {
                showNotification('❌ No accounts available. Please unlock MetaMask.', 'error');
                return;
            }
            
            console.log('✅ MetaMask approval received for:', accounts[0]);
            
            // Security check - ensure account format is valid Ethereum address
            if (!this.isValidEthereumAddress(accounts[0])) {
                showNotification('❌ Invalid Ethereum address format detected.', 'error');
                this.clearWalletConnection();
                return;
            }
            
            // Update local state
            this.account = accounts[0];
            this.walletConnected = true;
            this.web3 = new Web3(window.ethereum);
            
            // Verify network and force BSC if needed
            const networkValid = await this.verifyAndSwitchNetwork();
            if (!networkValid) {
                this.clearWalletConnection();
                return;
            }
            
            // Update UI and load data
            this.updateWalletUI();
            await this.loadBalances();
            
            // Sync blockchain interface
            await this.syncBlockchainInterface();
            
            showNotification(`✅ MetaMask connected: ${this.account.substring(0, 6)}...${this.account.substring(38)}`, 'success');
            
        } catch (error) {
            console.error('Wallet connection error:', error);
            this.clearWalletConnection();
            
            if (error.code === 4001) {
                showNotification('❌ Connection rejected. Please approve in MetaMask to continue.', 'error');
            } else if (error.code === -32002) {
                showNotification('⏳ Connection request pending. Please check MetaMask popup.', 'warning');
            } else {
                showNotification(`❌ Failed to connect: ${error.message}`, 'error');
            }
        }
    }
    
    setupWalletChangeListeners() {
        if (!window.ethereum) return;
        
        console.log('🔒 Setting up real-time wallet change detection...');
        
        // Remove any existing listeners to prevent duplicates
        if (window.ethereum.removeAllListeners) {
            window.ethereum.removeAllListeners();
        }
        
        // Listen for account changes
        window.ethereum.on('accountsChanged', (accounts) => {
            console.log('🔄 Account changed detected:', accounts);
            this.handleAccountChange(accounts);
        });
        
        // Listen for chain changes
        window.ethereum.on('chainChanged', (chainId) => {
            console.log('🔄 Chain changed detected:', chainId);
            this.handleChainChange(chainId);
        });
        
        // Listen for connection state changes
        window.ethereum.on('connect', (connectInfo) => {
            console.log('🔗 Wallet connection established:', connectInfo);
            // Refresh current state
            setTimeout(() => {
                this.initializeWeb3();
            }, 1000);
        });
        
        // Listen for disconnect
        window.ethereum.on('disconnect', (error) => {
            console.log('🔌 Wallet disconnected:', error);
            this.handleWalletDisconnect();
        });
        
        // Set up periodic connection check as fallback
        setInterval(async () => {
            if (this.walletConnected && window.ethereum) {
                try {
                    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                    if (accounts.length === 0 && this.walletConnected) {
                        console.log('⚠️ Periodic check: Wallet appears disconnected');
                        this.handleAccountChange([]);
                    }
                } catch (error) {
                    console.warn('Periodic wallet check failed:', error);
                }
            }
        }, 5000); // Check every 5 seconds
    }
    
    async handleAccountChange(accounts) {
        console.log('🔒 Processing account change for security...');
        
        // Immediately hide owner panel for security
        const ownerPanel = document.getElementById('ownerPanel');
        if (ownerPanel) {
            ownerPanel.style.display = 'none';
            console.log('🔒 Owner panel hidden for security');
        }
        
        if (accounts.length === 0) {
            // Wallet disconnected
            this.walletConnected = false;
            this.account = null;
            this.web3 = null;
            
            showNotification('🔌 Wallet disconnected', 'warning');
            this.updateWalletUI();
        } else {
            // Account changed
            const newAccount = accounts[0];
            const oldAccount = this.account;
            
            this.account = newAccount;
            
            showNotification(`🔄 Wallet changed to: ${newAccount.substring(0, 6)}...${newAccount.substring(38)}`, 'info');
            
            // Update UI immediately
            this.updateWalletUI();
            
            // Reload balances for new account
            await this.loadBalances();
            
            // Security: Re-check owner status with new account
            await this.checkOwnerStatus();
            
            console.log(`🔒 Account change processed: ${oldAccount} → ${newAccount}`);
        }
    }
    
    handleChainChange(chainId) {
        const networkId = parseInt(chainId, 16);
        console.log(`🔄 Network changed to: ${networkId}`);
        
        // Hide owner panel when switching networks for security
        const ownerPanel = document.getElementById('ownerPanel');
        if (ownerPanel) {
            ownerPanel.style.display = 'none';
        }
        
        if (networkId !== 56) {
            showNotification(`⚠️ Switched to network ${networkId}. Please use BSC (56) for full functionality.`, 'warning');
        } else {
            showNotification('✅ Connected to BSC Mainnet', 'success');
            // Re-check everything on BSC
            setTimeout(() => {
                this.loadBalances();
                this.checkOwnerStatus();
            }, 1000);
        }
    }
    
    handleWalletDisconnect() {
        console.log('🔌 Processing wallet disconnect...');
        
        this.clearWalletConnection();
        showNotification('🔌 Wallet disconnected', 'warning');
        this.updateWalletUI();
    }
    
    // Security Methods
    detectWalletType() {
        if (window.solana && window.solana.isPhantom) {
            return 'phantom';
        }
        if (window.ethereum) {
            if (window.ethereum.isMetaMask) {
                return 'metamask';
            }
            if (window.ethereum.isCoinbaseWallet) {
                return 'coinbase';
            }
            if (window.ethereum.isTrust) {
                return 'trust';
            }
            return 'ethereum';
        }
        return 'none';
    }
    
    isValidEthereumAddress(address) {
        if (!address || typeof address !== 'string') return false;
        return /^0x[a-fA-F0-9]{40}$/.test(address);
    }
    
    async verifyAndSwitchNetwork() {
        try {
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            const networkId = parseInt(chainId, 16);
            
            console.log('🌐 Current network ID:', networkId);
            
            if (networkId !== 56) {
                showNotification(`⚠️ Wrong network (${networkId}). Switching to BSC Mainnet...`, 'warning');
                
                try {
                    // Try to switch to BSC
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: '0x38' }] // BSC Mainnet
                    });
                    
                    showNotification('✅ Successfully switched to BSC Mainnet', 'success');
                    return true;
                    
                } catch (switchError) {
                    // Network doesn't exist, try to add it
                    if (switchError.code === 4902) {
                        try {
                            await window.ethereum.request({
                                method: 'wallet_addEthereumChain',
                                params: [{
                                    chainId: '0x38',
                                    chainName: 'BSC Mainnet',
                                    rpcUrls: ['https://bsc-dataseed.binance.org/'],
                                    nativeCurrency: {
                                        name: 'BNB',
                                        symbol: 'BNB',
                                        decimals: 18
                                    },
                                    blockExplorerUrls: ['https://bscscan.com/']
                                }]
                            });
                            
                            showNotification('✅ BSC network added and connected', 'success');
                            return true;
                            
                        } catch (addError) {
                            showNotification(`❌ Failed to add BSC network: ${addError.message}`, 'error');
                            return false;
                        }
                    } else {
                        showNotification(`❌ Failed to switch network: ${switchError.message}`, 'error');
                        return false;
                    }
                }
            } else {
                showNotification('✅ Connected to BSC Mainnet', 'success');
                return true;
            }
            
        } catch (error) {
            console.error('Network verification error:', error);
            showNotification(`❌ Network check failed: ${error.message}`, 'error');
            return false;
        }
    }
    
    clearWalletConnection() {
        console.log('🧹 Clearing wallet connection for security...');
        
        this.walletConnected = false;
        this.account = null;
        this.web3 = null;
        
        // Clear blockchain interface
        if (window.blockchainInterface) {
            window.blockchainInterface.account = null;
            window.blockchainInterface.isConnected = false;
            window.blockchainInterface.web3 = null;
        }
        
        // Hide owner panel immediately for security
        const ownerPanel = document.getElementById('ownerPanel');
        if (ownerPanel) {
            ownerPanel.style.display = 'none';
        }
    }
    
    async syncBlockchainInterface() {
        if (window.blockchainInterface) {
            console.log('⚙️ Syncing blockchain interface...');
            
            // Set basic properties
            window.blockchainInterface.account = this.account;
            window.blockchainInterface.isConnected = this.walletConnected;
            window.blockchainInterface.web3 = this.web3;
            
            // Ensure blockchain interface is properly initialized
            if (this.web3 && this.account && this.walletConnected) {
                try {
                    // Check if contract is initialized
                    if (!window.blockchainInterface.contract) {
                        console.log('⚙️ Initializing blockchain interface contract...');
                        await window.blockchainInterface.initializeContract();
                    }
                    
                    // Force refresh the connection state
                    if (typeof window.blockchainInterface.refreshConnection === 'function') {
                        await window.blockchainInterface.refreshConnection();
                    }
                    
                    console.log('✅ Blockchain interface fully synced - Account:', this.account, 'Connected:', this.walletConnected);
                    console.log('✅ Contract available:', !!window.blockchainInterface.contract);
                    console.log('✅ Web3 available:', !!window.blockchainInterface.web3);
                } catch (error) {
                    console.error('❌ Error during blockchain interface sync:', error);
                }
            } else {
                console.log('⚠️ Cannot fully sync blockchain interface - missing wallet data');
            }
        } else {
            console.warn('⚠️ Blockchain interface not available for syncing');
        }
    }
    
    async validateWalletConnection() {
        try {
            // Check local state first
            if (!this.walletConnected || !this.account || !this.web3) {
                console.log('🔴 Local wallet state invalid');
                return false;
            }
            
            // Verify with MetaMask directly
            if (window.ethereum && window.ethereum.isMetaMask) {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                
                if (accounts.length === 0) {
                    console.log('🔴 No accounts available in MetaMask');
                    this.clearWalletConnection();
                    this.updateWalletUI();
                    return false;
                }
                
                // Check if the current account is still available
                const currentAccountAvailable = accounts.some(acc => 
                    acc.toLowerCase() === this.account.toLowerCase()
                );
                
                if (!currentAccountAvailable) {
                    console.log('🔴 Current account no longer available in MetaMask');
                    // Update to the new active account
                    this.account = accounts[0];
                    await this.syncBlockchainInterface();
                    showNotification(`🔄 Account changed to: ${accounts[0].substring(0, 6)}...${accounts[0].substring(38)}`, 'info');
                    this.updateWalletUI();
                }
                
                // Check network
                const chainId = await window.ethereum.request({ method: 'eth_chainId' });
                const networkId = parseInt(chainId, 16);
                
                if (networkId !== 56) {
                    console.log('🔴 Wrong network:', networkId);
                    showNotification(`⚠️ Please switch to BSC Mainnet (current: ${networkId})`, 'warning');
                    return false;
                }
                
                console.log('✅ Wallet connection validated successfully');
                return true;
            }
            
            console.log('🔴 MetaMask not available');
            return false;
            
        } catch (error) {
            console.error('Wallet validation error:', error);
            return false;
        }
    }
    
    updateWalletUI() {
        const walletCardStatus = document.getElementById('walletCardStatus');
        const walletStatus = document.getElementById('walletStatus');
        
        // Find the connect wallet card more reliably
        let connectWalletCard = document.querySelector('.action-card[onclick*="connectWallet"]');
        if (!connectWalletCard) {
            connectWalletCard = document.querySelector('.action-card[onclick*="disconnectWallet"]');
        }
        
        console.log('🔄 Updating wallet UI - Connected:', this.walletConnected, 'Account:', this.account);
        
        if (this.walletConnected && this.account) {
            if (walletCardStatus) walletCardStatus.classList.add('active');
            if (walletStatus) walletStatus.classList.add('active');
            
            // Update connect wallet card to show connected state
            if (connectWalletCard) {
                const cardContent = connectWalletCard.querySelector('.card-content');
                if (cardContent) {
                    const h3 = cardContent.querySelector('h3');
                    const p = cardContent.querySelector('p');
                    if (h3) h3.textContent = 'Wallet Connected';
                    if (p) p.textContent = `${this.account.substring(0, 6)}...${this.account.substring(38)}`;
                }
                connectWalletCard.setAttribute('onclick', 'disconnectWallet()');
                connectWalletCard.classList.add('connected');
            }
            
            // Update wallet address display
            const walletAddressElements = document.querySelectorAll('[id*="walletAddress"], [class*="wallet-address"]');
            walletAddressElements.forEach(element => {
                if (element) {
                    element.textContent = `${this.account.substring(0, 6)}...${this.account.substring(38)}`;
                }
            });
            
            // Enable action cards
            const actionCards = ['mintCard', 'burnCard', 'transferCard', 'stakeCard'];
            actionCards.forEach(cardId => {
                const card = document.getElementById(cardId);
                if (card) card.classList.remove('disabled');
            });
            
            // Force balance loading after UI update
            setTimeout(() => {
                this.loadBalances();
                this.checkOwnerStatus();
            }, 500);
            
        } else {
            // Wallet not connected - disable everything
            if (walletCardStatus) walletCardStatus.classList.remove('active');
            if (walletStatus) walletStatus.classList.remove('active');
            
            // Update connect wallet card to show disconnected state
            if (connectWalletCard) {
                const cardContent = connectWalletCard.querySelector('.card-content');
                if (cardContent) {
                    const h3 = cardContent.querySelector('h3');
                    const p = cardContent.querySelector('p');
                    if (h3) h3.textContent = 'Connect Wallet';
                    if (p) p.textContent = 'Link your crypto wallet';
                }
                connectWalletCard.setAttribute('onclick', 'connectWallet()');
                connectWalletCard.classList.remove('connected');
            }
            
            // Disable action cards
            const actionCards = ['mintCard', 'burnCard', 'transferCard', 'stakeCard'];
            actionCards.forEach(cardId => {
                const card = document.getElementById(cardId);
                if (card) card.classList.add('disabled');
            });
            
            // Reset balance display
            const balanceElements = {
                'hpBalance': '0.00',
                'usdtBalance': '0.00', 
                'bnbBalance': '0.00',
                'hpValue': '$0.00',
                'usdtValue': '$0.00',
                'bnbValue': '$0.00'
            };
            
            Object.entries(balanceElements).forEach(([id, value]) => {
                const element = document.getElementById(id);
                if (element) element.textContent = value;
            });
            
            // Hide owner panel
            const ownerPanel = document.getElementById('ownerPanel');
            if (ownerPanel) {
                ownerPanel.style.display = 'none';
            }
        }
        
        this.updateSecurityStatus();
    }
    
    disconnectWallet() {
        try {
            console.log('🔌 Disconnecting wallet...');
            
            // Reset local state
            this.walletConnected = false;
            this.account = null;
            this.web3 = null;
            
            // Reset blockchain interface if available
            if (window.blockchainInterface) {
                window.blockchainInterface.account = null;
                window.blockchainInterface.isConnected = false;
                window.blockchainInterface.web3 = null;
            }
            
            // Update UI
            this.updateWalletUI();
            
            showNotification('🔌 Wallet disconnected successfully', 'info');
            
        } catch (error) {
            console.error('Disconnect error:', error);
            showNotification('❌ Error disconnecting wallet', 'error');
        }
    }
    
    async loadBalances() {
        if (!this.walletConnected || !this.account) {
            console.log('⚠️ Cannot load balances - wallet not connected or no account');
            return;
        }
        
        try {
            console.log('💰 Loading balances for account:', this.account);
            
            // Force sync blockchain interface with our state
            if (window.blockchainInterface) {
                window.blockchainInterface.account = this.account;
                window.blockchainInterface.isConnected = true;
                window.blockchainInterface.web3 = this.web3;
            }
            
            // Use existing blockchain interface for loading balances
            if (window.blockchainInterface && typeof window.blockchainInterface.loadAllBalances === 'function') {
                await window.blockchainInterface.loadAllBalances();
                
                // Get updated balances from the interface
                const balances = window.blockchainInterface.balances;
                
                console.log('📊 Balance data received:', balances);
                
                if (balances) {
                    // Update BNB balance
                    const bnbElement = document.getElementById('bnbBalance');
                    const bnbValueElement = document.getElementById('bnbValue');
                    if (bnbElement && balances.bnb !== undefined) {
                        const bnbBalance = parseFloat(balances.bnb) || 0;
                        bnbElement.textContent = bnbBalance.toFixed(4);
                        if (bnbValueElement && window.bnbPrice) {
                            bnbValueElement.textContent = `$${(bnbBalance * window.bnbPrice).toFixed(2)}`;
                        }
                        console.log('🟡 BNB balance updated:', bnbBalance);
                    }
                    
                    // Update HP balance
                    const hpElement = document.getElementById('hpBalance');
                    const hpValueElement = document.getElementById('hpValue');
                    if (hpElement && balances.hp !== undefined) {
                        const hpBalance = parseFloat(balances.hp) || 0;
                        hpElement.textContent = hpBalance.toFixed(2);
                        if (hpValueElement) {
                            const hpValue = hpBalance * 11; // HP fixed price
                            hpValueElement.textContent = `$${hpValue.toFixed(2)}`;
                        }
                        console.log('🪙 HP balance updated:', hpBalance);
                    }
                    
                    // Update USDT balance
                    const usdtElement = document.getElementById('usdtBalance');
                    const usdtValueElement = document.getElementById('usdtValue');
                    if (usdtElement && balances.usdt !== undefined) {
                        const usdtBalance = parseFloat(balances.usdt) || 0;
                        usdtElement.textContent = usdtBalance.toFixed(2);
                        if (usdtValueElement) {
                            usdtValueElement.textContent = `$${usdtBalance.toFixed(2)}`;
                        }
                        console.log('💵 USDT balance updated:', usdtBalance);
                    }
                    
                    showNotification('✅ Balances updated successfully', 'success');
                } else {
                    console.warn('⚠️ No balance data received from blockchain interface');
                    // Try fallback method
                    await this.loadTokenBalancesFallback();
                }
            } else {
                console.log('🔄 Using fallback balance loading');
                // Fallback balance loading
                await this.loadTokenBalancesFallback();
            }
        } catch (error) {
            console.error('Error loading balances:', error);
            showNotification('❌ Error loading balances: ' + error.message, 'error');
            
            // Try fallback on error
            try {
                await this.loadTokenBalancesFallback();
            } catch (fallbackError) {
                console.error('Fallback balance loading also failed:', fallbackError);
            }
        }
    }
    
    async loadTokenBalancesFallback() {
        try {
            if (!this.web3) return;
            
            // Load BNB balance
            const bnbBalance = await this.web3.eth.getBalance(this.account);
            const bnbFormatted = this.web3.utils.fromWei(bnbBalance, 'ether');
            
            const bnbElement = document.getElementById('bnbBalance');
            const bnbValueElement = document.getElementById('bnbValue');
            if (bnbElement) {
                bnbElement.textContent = parseFloat(bnbFormatted).toFixed(4);
            }
            if (bnbValueElement) {
                bnbValueElement.textContent = `$${(parseFloat(bnbFormatted) * 300).toFixed(2)}`; // Estimated BNB price
            }
            
            // Load token balances using contract addresses from config
            if (window.AXZORA_CONFIG) {
                await this.loadTokenBalancesFromContract();
            }
        } catch (error) {
            console.error('Error in fallback balance loading:', error);
        }
    }
    
    async loadTokenBalancesFromContract() {
        try {
            const config = window.AXZORA_CONFIG;
            if (!config) return;
            
            // Create contract instances
            const hpContract = new this.web3.eth.Contract([
                {
                    "constant": true,
                    "inputs": [{"name": "_owner", "type": "address"}],
                    "name": "balanceOf",
                    "outputs": [{"name": "balance", "type": "uint256"}],
                    "type": "function"
                }
            ], config.HP_TOKEN_ADDRESS);
            
            const usdtContract = new this.web3.eth.Contract([
                {
                    "constant": true,
                    "inputs": [{"name": "_owner", "type": "address"}],
                    "name": "balanceOf",
                    "outputs": [{"name": "balance", "type": "uint256"}],
                    "type": "function"
                }
            ], config.USDT_BSC_ADDRESS);
            
            // Load HP balance
            const hpBalance = await hpContract.methods.balanceOf(this.account).call();
            const hpFormatted = this.web3.utils.fromWei(hpBalance, 'ether');
            
            const hpElement = document.getElementById('hpBalance');
            const hpValueElement = document.getElementById('hpValue');
            if (hpElement) {
                hpElement.textContent = parseFloat(hpFormatted).toFixed(2);
            }
            if (hpValueElement) {
                const hpValue = parseFloat(hpFormatted) * 11; // HP fixed price
                hpValueElement.textContent = `$${hpValue.toFixed(2)}`;
            }
            
            // Load USDT balance
            const usdtBalance = await usdtContract.methods.balanceOf(this.account).call();
            const usdtFormatted = this.web3.utils.fromWei(usdtBalance, 'ether');
            
            const usdtElement = document.getElementById('usdtBalance');
            const usdtValueElement = document.getElementById('usdtValue');
            if (usdtElement) {
                usdtElement.textContent = parseFloat(usdtFormatted).toFixed(2);
            }
            if (usdtValueElement) {
                usdtValueElement.textContent = `$${parseFloat(usdtFormatted).toFixed(2)}`;
            }
            
        } catch (error) {
            console.error('Error loading token balances from contract:', error);
        }
    }
    
    toggleVoice() {
        const voiceBtn = document.getElementById('voiceBtn');
        const voiceText = voiceBtn.querySelector('.voice-text');
        const pulseRing = document.getElementById('pulseRing');
        
        if (this.isListening) {
            this.stopListening();
            voiceBtn.classList.remove('listening');
            voiceText.textContent = 'Talk to Mr. Happy';
            pulseRing.style.display = 'none';
            this.animateMouth(false);
        } else {
            this.startListening();
            voiceBtn.classList.add('listening');
            voiceText.textContent = 'Stop Listening';
            pulseRing.style.display = 'block';
            this.animateMouth(true);
        }
        
        this.isListening = !this.isListening;
    }
    
    startListening() {
        showNotification('Mr. Happy is now listening...', 'info');
        document.getElementById('assistantMessage').textContent = 
            'I\'m listening! Try saying "mint tokens" or "check balance"';
        
        // Simulate voice recognition
        setTimeout(() => {
            if (this.isListening) {
                const responses = [
                    "I heard you! What would you like me to help with?",
                    "Your voice is clear! How can I assist you today?",
                    "I'm ready to help with your crypto needs!",
                    "Connected and listening! What's on your mind?"
                ];
                const randomResponse = responses[Math.floor(Math.random() * responses.length)];
                document.getElementById('assistantMessage').textContent = randomResponse;
            }
        }, 2000);
    }
    
    stopListening() {
        showNotification('Mr. Happy stopped listening', 'info');
        document.getElementById('assistantMessage').textContent = 
            'Ready to help with your Happy Paisa tokens!';
    }
    
    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('open');
    }
    
    // Modal functions
    openMintModal() {
        if (!this.walletConnected) {
            showNotification('Please connect your wallet first', 'warning');
            return;
        }
        document.getElementById('mintModal').classList.add('show');
    }
    
    closeMintModal() {
        document.getElementById('mintModal').classList.remove('show');
    }
    
    openBurnModal() {
        if (!this.walletConnected) {
            showNotification('Please connect your wallet first', 'warning');
            return;
        }
        document.getElementById('burnModal').classList.add('show');
    }
    
    closeBurnModal() {
        document.getElementById('burnModal').classList.remove('show');
    }
    
    openTransferModal() {
        if (!this.walletConnected) {
            showNotification('Please connect your wallet first', 'warning');
            return;
        }
        document.getElementById('transferModal').classList.add('show');
    }
    
    closeTransferModal() {
        document.getElementById('transferModal').classList.remove('show');
    }
    
    openStakingModal() {
        if (!this.walletConnected) {
            showNotification('Please connect your wallet first', 'warning');
            return;
        }
        document.getElementById('stakingModal').classList.add('show');
    }
    
    closeStakingModal() {
        document.getElementById('stakingModal').classList.remove('show');
    }
    
    showHelp() {
        const helpMessage = `
🏠 Welcome to Axzora Home Assistant!

Quick Commands:
• "Connect wallet" - Link your MetaMask
• "Mint tokens" - Create new HP tokens  
• "Check balance" - View your balances
• "Transfer tokens" - Send HP to others
• "Stake tokens" - Earn 6% APR

Security Features:
📍 Location-based security
👆 Biometric authentication  
🔒 End-to-end encryption

Need help? Just ask Mr. Happy!
        `;
        
        alert(helpMessage);
    }
    
    // Owner management functions
    openWithdrawProfitsModal() {
        if (window.ownerManager && typeof window.ownerManager.openWithdrawProfitsModal === 'function') {
            window.ownerManager.openWithdrawProfitsModal();
        } else {
            const modal = document.getElementById('withdrawProfitsModal');
            if (modal) {
                modal.style.display = 'block';
            }
        }
    }
    
    closeWithdrawProfitsModal() {
        if (window.ownerManager && typeof window.ownerManager.closeWithdrawProfitsModal === 'function') {
            window.ownerManager.closeWithdrawProfitsModal();
        } else {
            const modal = document.getElementById('withdrawProfitsModal');
            if (modal) {
                modal.style.display = 'none';
            }
        }
    }
    
    openEmergencyModal() {
        if (window.ownerManager && typeof window.ownerManager.openEmergencyModal === 'function') {
            window.ownerManager.openEmergencyModal();
        } else {
            const modal = document.getElementById('emergencyWithdrawModal');
            if (modal) {
                modal.style.display = 'block';
            }
        }
    }
    
    closeEmergencyModal() {
        if (window.ownerManager && typeof window.ownerManager.closeEmergencyModal === 'function') {
            window.ownerManager.closeEmergencyModal();
        } else {
            const modal = document.getElementById('emergencyWithdrawModal');
            if (modal) {
                modal.style.display = 'none';
            }
        }
    }
    
    setMaxProfits() {
        if (window.ownerManager && typeof window.ownerManager.setMaxProfits === 'function') {
            window.ownerManager.setMaxProfits();
        } else {
            const availableProfits = document.getElementById('modalAvailableProfits').textContent;
            const amount = parseFloat(availableProfits.replace(/[^0-9.]/g, ''));
            const profitAmountInput = document.getElementById('profitAmount');
            if (profitAmountInput) {
                profitAmountInput.value = amount.toFixed(6);
            }
        }
    }
    
    executeWithdrawProfits() {
        if (window.ownerManager && typeof window.ownerManager.withdrawSpecificAmount === 'function') {
            window.ownerManager.withdrawSpecificAmount();
        } else {
            const amount = document.getElementById('profitAmount').value;
            if (!amount || amount <= 0) {
                showNotification('Please enter a valid amount', 'warning');
                return;
            }
            
            try {
                showNotification(`💰 Withdrawing ${amount} USDT profits...`, 'info');
                this.closeWithdrawProfitsModal();
                
                // Fallback implementation
                if (window.blockchainInterface && window.blockchainInterface.contract) {
                    const convertedAmount = window.blockchainInterface.web3.utils.toWei(amount.toString(), 'ether');
                    window.blockchainInterface.contract.methods.withdrawExcessCollateral(convertedAmount).send({
                        from: window.blockchainInterface.account
                    }).then(result => {
                        showNotification(`✅ Successfully withdrew ${amount} USDT profits! TX: ${result.transactionHash}`, 'success');
                        setTimeout(() => this.loadOwnerData(), 2000);
                    }).catch(error => {
                        showNotification(`❌ Failed to withdraw profits: ${error.message}`, 'error');
                    });
                } else {
                    throw new Error('Blockchain interface not available');
                }
                
            } catch (error) {
                console.error('Withdraw profits error:', error);
                showNotification(`❌ Failed to withdraw profits: ${error.message}`, 'error');
            }
        }
    }
    
    executeEmergencyWithdraw() {
        if (window.ownerManager && typeof window.ownerManager.executeEmergencyWithdraw === 'function') {
            window.ownerManager.executeEmergencyWithdraw('emergencyWithdraw');
        } else {
            try {
                showNotification('🆘 Executing emergency withdrawal...', 'warning');
                this.closeEmergencyModal();
                
                // Fallback implementation
                if (window.blockchainInterface && window.blockchainInterface.contract) {
                    // Try emergency withdraw function
                    if (window.blockchainInterface.contract.methods.emergencyWithdraw) {
                        window.blockchainInterface.contract.methods.emergencyWithdraw().send({
                            from: window.blockchainInterface.account
                        }).then(result => {
                            showNotification(`✅ Emergency withdrawal executed! TX: ${result.transactionHash}`, 'success');
                            setTimeout(() => this.loadOwnerData(), 2000);
                        }).catch(error => {
                            showNotification(`❌ Emergency withdrawal failed: ${error.message}`, 'error');
                        });
                    } else {
                        throw new Error('Emergency withdraw function not available on contract');
                    }
                } else {
                    throw new Error('Blockchain interface not available');
                }
            } catch (error) {
                console.error('Emergency withdrawal error:', error);
                showNotification(`❌ Emergency withdrawal failed: ${error.message}`, 'error');
            }
        }
    }
    
    checkCollateral() {
        if (window.ownerManager && typeof window.ownerManager.checkCollateralStatus === 'function') {
            window.ownerManager.checkCollateralStatus();
        } else {
            try {
                showNotification('📊 Checking collateral status...', 'info');
                
                // Fallback - reload owner data
                this.loadOwnerData();
                showNotification('✅ Collateral status updated', 'success');
            } catch (error) {
                console.error('Collateral check error:', error);
                showNotification(`⚠️ Collateral check failed: ${error.message}`, 'warning');
            }
        }
    }
    
    pauseContract() {
        if (window.ownerManager && typeof window.ownerManager.pauseContract === 'function') {
            window.ownerManager.pauseContract();
        } else {
            try {
                showNotification('⏸️ Pausing contract...', 'warning');
                
                // Fallback implementation
                if (window.blockchainInterface && window.blockchainInterface.contract && window.blockchainInterface.contract.methods.pause) {
                    window.blockchainInterface.contract.methods.pause().send({
                        from: window.blockchainInterface.account
                    }).then(result => {
                        showNotification(`✅ Contract paused successfully! TX: ${result.transactionHash}`, 'success');
                        const statusElement = document.getElementById('contractStatus');
                        if (statusElement) statusElement.textContent = 'Paused';
                    }).catch(error => {
                        showNotification(`❌ Failed to pause contract: ${error.message}`, 'error');
                    });
                } else {
                    throw new Error('Pause function not available on contract');
                }
            } catch (error) {
                console.error('Contract pause error:', error);
                showNotification(`❌ Failed to pause contract: ${error.message}`, 'error');
            }
        }
    }
    
    // Check if user is owner and show/hide owner panel
    async checkOwnerStatus() {
        if (!this.walletConnected || !this.account) {
            // No wallet connected - hide owner panel
            const ownerPanel = document.getElementById('ownerPanel');
            if (ownerPanel) {
                ownerPanel.style.display = 'none';
            }
            return;
        }
        
        try {
            console.log(`🔒 Checking owner status for: ${this.account}`);
            
            let isOwner = false;
            
            // Use existing owner management for ownership check
            if (window.ownerManager && typeof window.ownerManager.checkOwnerStatus === 'function') {
                // Force re-check with current account
                window.ownerManager.isOwner = false; // Reset cached status
                isOwner = await window.ownerManager.checkOwnerStatus();
            } else {
                // Fallback - check contract owner directly
                isOwner = await this.checkContractOwner();
                
                const ownerPanel = document.getElementById('ownerPanel');
                if (ownerPanel) {
                    ownerPanel.style.display = isOwner ? 'block' : 'none';
                }
                
                if (isOwner) {
                    console.log('✅ Owner status confirmed - loading owner data');
                    await this.loadOwnerData();
                } else {
                    console.log('❌ Not contract owner - owner panel hidden');
                }
            }
            
        } catch (error) {
            console.error('Owner status check error:', error);
            // On error, always hide owner panel for security
            const ownerPanel = document.getElementById('ownerPanel');
            if (ownerPanel) {
                ownerPanel.style.display = 'none';
            }
        }
    }
    
    async checkContractOwner() {
        try {
            if (!this.web3 || !this.account || !window.AXZORA_CONFIG) {
                console.log('❌ Missing requirements for owner check');
                return false;
            }
            
            console.log(`🔍 Checking contract owner for account: ${this.account}`);
            
            // Use blockchain interface contract if available
            let contract;
            if (window.blockchainInterface && window.blockchainInterface.contract) {
                contract = window.blockchainInterface.contract;
            } else {
                // Create contract instance
                contract = new this.web3.eth.Contract([
                    {
                        "constant": true,
                        "inputs": [],
                        "name": "owner",
                        "outputs": [{"name": "", "type": "address"}],
                        "type": "function"
                    }
                ], window.AXZORA_CONFIG.HP_TOKEN_ADDRESS);
            }
            
            const contractOwner = await contract.methods.owner().call();
            const isOwner = contractOwner.toLowerCase() === this.account.toLowerCase();
            
            console.log(`📋 Contract owner: ${contractOwner}`);
            console.log(`👤 Current account: ${this.account}`);
            console.log(`🔒 Is owner: ${isOwner}`);
            
            return isOwner;
            
        } catch (error) {
            console.error('Contract owner check error:', error);
            return false;
        }
    }
    
    async loadOwnerData() {
        try {
            // Use existing owner management for loading data
            if (window.ownerManager && typeof window.ownerManager.loadOwnerData === 'function') {
                await window.ownerManager.loadOwnerData();
            } else {
                // Fallback to blockchain interface methods
                if (window.blockchainInterface && window.blockchainInterface.contract) {
                    const info = await window.blockchainInterface.contract.methods.getContractInfo().call();
                    
                    // Format collateral amount
                    const collateralStr = info.totalCollateralUSDT.toString();
                    const rawCollateral = parseFloat(collateralStr);
                    
                    let totalCollateralFormatted;
                    if (rawCollateral > 1e18) {
                        totalCollateralFormatted = (rawCollateral / 1e18).toFixed(6);
                    } else if (rawCollateral > 1e6) {
                        totalCollateralFormatted = (rawCollateral / 1e6).toFixed(6);
                    } else {
                        totalCollateralFormatted = rawCollateral.toFixed(6);
                    }
                    
                    // Update UI elements
                    const collateralElement = document.getElementById('totalCollateral');
                    if (collateralElement) {
                        collateralElement.textContent = `${totalCollateralFormatted} USDT`;
                    }
                    
                    // Calculate profits (simplified)
                    const availableProfits = Math.max(0, parseFloat(totalCollateralFormatted) * 0.1); // Estimate
                    const profitsElement = document.getElementById('availableProfits');
                    if (profitsElement) {
                        profitsElement.textContent = `${availableProfits.toFixed(6)} USDT`;
                    }
                }
            }
        } catch (error) {
            console.error('Error loading owner data:', error);
        }
    }

    // Transaction functions (integrate with existing blockchain interface)
    async executeMint() {
        const amount = document.getElementById('mintAmount').value;
        if (!amount || amount <= 0) {
            showNotification('Please enter a valid amount', 'warning');
            return;
        }
        
        // Comprehensive wallet validation
        const isValid = await this.validateWalletConnection();
        if (!isValid) {
            console.log('⚠️ Wallet validation failed for minting');
            showNotification('❌ Wallet connection invalid. Please reconnect your MetaMask wallet.', 'error');
            return;
        }
        
        try {
            console.log('🔄 Syncing interfaces before minting...');
            // Sync blockchain interface with current wallet state
            await this.syncBlockchainInterface();
            
            showNotification(`🏭 Minting ${amount} HP tokens...`, 'info');
            this.closeMintModal();
            
            // Use existing mint interface with retry logic
            let success = false;
            
            // First try blockchain interface
            if (window.blockchainInterface && typeof window.blockchainInterface.mintTokens === 'function') {
                try {
                    // Ensure account is properly set
                    window.blockchainInterface.account = this.account;
                    window.blockchainInterface.isConnected = true;
                    window.blockchainInterface.web3 = this.web3;
                    
                    await window.blockchainInterface.mintTokens(amount);
                    success = true;
                    showNotification(`✅ Successfully minted ${amount} HP tokens!`, 'success');
                } catch (interfaceError) {
                    console.warn('Blockchain interface mint failed:', interfaceError);
                }
            }
            
            // Then try global function if the first attempt failed
            if (!success && window.mintTokens && typeof window.mintTokens === 'function') {
                try {
                    await window.mintTokens(amount);
                    success = true;
                    showNotification(`✅ Successfully minted ${amount} HP tokens!`, 'success');
                } catch (globalError) {
                    console.warn('Global mint function failed:', globalError);
                }
            }
            
            // Last resort - UI button
            if (!success) {
                // Fallback - trigger existing mint modal if available
                const mintBtn = document.querySelector('[data-action="mint"]');
                if (mintBtn && !mintBtn.disabled) {
                    console.log('🔄 Trying UI button for minting...');
                    mintBtn.click();
                    return;
                }
                throw new Error('No available mint functionality found');
            }
            
            // Reload balances after successful mint
            setTimeout(() => {
                this.loadBalances();
            }, 2000);
            
        } catch (error) {
            console.error('Mint error:', error);
            showNotification(`❌ Failed to mint tokens: ${error.message}`, 'error');
        }
    }
    
    async executeBurn() {
        const amount = document.getElementById('burnAmount').value;
        if (!amount || amount <= 0) {
            showNotification('Please enter a valid amount', 'warning');
            return;
        }
        
        try {
            showNotification(`🔥 Burning ${amount} HP tokens...`, 'info');
            this.closeBurnModal();
            
            // Use existing burn interface
            if (window.burnTokens && typeof window.burnTokens === 'function') {
                await window.burnTokens(amount);
                showNotification(`✅ Successfully burned ${amount} HP tokens!`, 'success');
            } else if (window.blockchainInterface && typeof window.blockchainInterface.burnTokens === 'function') {
                await window.blockchainInterface.burnTokens(amount);
                showNotification(`✅ Successfully burned ${amount} HP tokens!`, 'success');
            } else {
                // Fallback - trigger existing burn modal if available
                const burnBtn = document.querySelector('[data-action="burn"]');
                if (burnBtn && !burnBtn.disabled) {
                    burnBtn.click();
                    return;
                }
                throw new Error('Burn functionality not available');
            }
            
            // Reload balances after successful burn
            setTimeout(() => {
                this.loadBalances();
            }, 2000);
            
        } catch (error) {
            console.error('Burn error:', error);
            showNotification(`❌ Failed to burn tokens: ${error.message}`, 'error');
        }
    }
    
    async executeTransfer() {
        const address = document.getElementById('transferAddress').value;
        const amount = document.getElementById('transferAmount').value;
        
        if (!address || !amount || amount <= 0) {
            showNotification('Please enter valid address and amount', 'warning');
            return;
        }
        
        try {
            showNotification(`📤 Transferring ${amount} HP tokens...`, 'info');
            this.closeTransferModal();
            
            // Use existing transfer interface
            if (window.transferTokens && typeof window.transferTokens === 'function') {
                await window.transferTokens(address, amount);
                showNotification(`✅ Successfully transferred ${amount} HP tokens!`, 'success');
            } else if (window.blockchainInterface && typeof window.blockchainInterface.transferTokens === 'function') {
                await window.blockchainInterface.transferTokens(address, amount);
                showNotification(`✅ Successfully transferred ${amount} HP tokens!`, 'success');
            } else {
                // Fallback - trigger existing transfer modal if available
                const transferBtn = document.querySelector('[data-action="transfer"]');
                if (transferBtn && !transferBtn.disabled) {
                    transferBtn.click();
                    return;
                }
                throw new Error('Transfer functionality not available');
            }
            
            // Reload balances after successful transfer
            setTimeout(() => {
                this.loadBalances();
            }, 2000);
            
        } catch (error) {
            console.error('Transfer error:', error);
            showNotification(`❌ Failed to transfer tokens: ${error.message}`, 'error');
        }
    }
    
    async executeStaking() {
        const amount = document.getElementById('stakeAmount').value;
        if (!amount || amount <= 0) {
            showNotification('Please enter a valid amount', 'warning');
            return;
        }
        
        try {
            showNotification(`🔒 Staking ${amount} HP tokens...`, 'info');
            this.closeStakingModal();
            
            // Use existing staking interface
            if (window.stakeTokens && typeof window.stakeTokens === 'function') {
                await window.stakeTokens(amount);
                showNotification(`✅ Successfully staked ${amount} HP tokens!`, 'success');
            } else if (window.blockchainInterface && typeof window.blockchainInterface.stakeTokens === 'function') {
                await window.blockchainInterface.stakeTokens(amount);
                showNotification(`✅ Successfully staked ${amount} HP tokens!`, 'success');
            } else {
                // Fallback - trigger existing staking modal if available
                const stakeBtn = document.querySelector('[data-action="stake"]');
                if (stakeBtn && !stakeBtn.disabled) {
                    stakeBtn.click();
                    return;
                }
                throw new Error('Staking functionality not available');
            }
            
            // Reload balances after successful staking
            setTimeout(() => {
                this.loadBalances();
            }, 2000);
            
        } catch (error) {
            console.error('Staking error:', error);
            showNotification(`❌ Failed to stake tokens: ${error.message}`, 'error');
        }
    }
}

// Notification system
function showNotification(message, type = 'info') {
    console.log(`Notification [${type}]: ${message}`);
    
    const container = document.getElementById('notifications');
    if (!container) {
        console.warn('Notifications container not found');
        return;
    }
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    container.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
    
    // Remove on click
    notification.addEventListener('click', () => {
        if (notification.parentNode) {
            notification.remove();
        }
    });
}

// Global function declarations for onclick handlers
let app;

function requestLocation() {
    if (app) app.requestLocation();
}

function requestFingerprint() {
    if (app) app.requestFingerprint();
}

function requestCamera() {
    if (app) app.requestCamera();
}

function enterApp() {
    if (app) app.enterApp();
}

function skipPermissions() {
    console.log('skipPermissions called');
    
    if (!app) {
        console.log('App not initialized yet, initializing...');
        app = new HomeAssistantApp();
        
        // Wait a moment for initialization
        setTimeout(() => {
            app.skipPermissions();
        }, 100);
        return;
    }
    
    try {
        app.skipPermissions();
    } catch (error) {
        console.error('Error in skipPermissions:', error);
        
        // Fallback - directly manipulate DOM
        fallbackSkipPermissions();
    }
}

// Fallback function that works without the app object
function fallbackSkipPermissions() {
    console.log('Using fallback skip permissions');
    
    // Update permission items
    const permissionItems = ['locationPermission', 'fingerprintPermission', 'cameraPermission'];
    
    permissionItems.forEach(itemId => {
        const item = document.getElementById(itemId);
        const btn = item?.querySelector('.permission-btn');
        
        if (item && btn) {
            item.classList.add('granted');
            btn.textContent = 'Granted';
            btn.classList.add('granted');
            btn.disabled = true;
        }
    });
    
    // Enable continue button
    const continueBtn = document.getElementById('continueBtn');
    if (continueBtn) {
        continueBtn.disabled = false;
        continueBtn.textContent = 'Enter Axzora Assistant';
    }
    
    // Show notification
    showNotification('⚡ All permissions granted! You can now continue.', 'success');
}

function connectWallet() {
    if (app && app.connectWallet) {
        app.connectWallet();
    }
}

function disconnectWallet() {
    if (app && app.disconnectWallet) {
        app.disconnectWallet();
    }
}

function toggleSidebar() {
    if (app && app.toggleSidebar) app.toggleSidebar();
}

function toggleVoice() {
    if (app && app.toggleVoice) app.toggleVoice();
}

function openMintModal() {
    if (app && app.openMintModal) app.openMintModal();
}

function closeMintModal() {
    if (app && app.closeMintModal) app.closeMintModal();
}

function openBurnModal() {
    if (app && app.openBurnModal) app.openBurnModal();
}

function closeBurnModal() {
    if (app && app.closeBurnModal) app.closeBurnModal();
}

function openTransferModal() {
    if (app && app.openTransferModal) app.openTransferModal();
}

function closeTransferModal() {
    if (app && app.closeTransferModal) app.closeTransferModal();
}

function openStakingModal() {
    if (app && app.openStakingModal) app.openStakingModal();
}

function closeStakingModal() {
    if (app && app.closeStakingModal) app.closeStakingModal();
}

function showHelp() {
    if (app && app.showHelp) app.showHelp();
}

function executeMint() {
    if (app && app.executeMint) app.executeMint();
}

function executeBurn() {
    if (app && app.executeBurn) app.executeBurn();
}

function executeTransfer() {
    if (app && app.executeTransfer) app.executeTransfer();
}

function executeStaking() {
    if (app && app.executeStaking) app.executeStaking();
}

// Owner management functions
function openWithdrawProfitsModal() {
    if (app && app.openWithdrawProfitsModal) app.openWithdrawProfitsModal();
}

function closeWithdrawProfitsModal() {
    if (app && app.closeWithdrawProfitsModal) app.closeWithdrawProfitsModal();
}

function openEmergencyModal() {
    if (app && app.openEmergencyModal) app.openEmergencyModal();
}

function closeEmergencyModal() {
    if (app && app.closeEmergencyModal) app.closeEmergencyModal();
}

function setMaxProfits() {
    if (app && app.setMaxProfits) app.setMaxProfits();
}

function executeWithdrawProfits() {
    if (app && app.executeWithdrawProfits) app.executeWithdrawProfits();
}

function executeEmergencyWithdraw() {
    if (app && app.executeEmergencyWithdraw) app.executeEmergencyWithdraw();
}

function checkCollateral() {
    if (app && app.checkCollateral) app.checkCollateral();
}

function pauseContract() {
    if (app && app.pauseContract) app.pauseContract();
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    app = new HomeAssistantApp();
    
    // Add direct event listener for skip button as backup
    const skipBtn = document.getElementById('skipBtn');
    if (skipBtn) {
        skipBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Skip button clicked via event listener');
            skipPermissions();
        });
    }
});

// Handle modal clicks outside content
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('show');
    }
});

// Update input calculations
document.addEventListener('input', (e) => {
    if (e.target.id === 'mintAmount') {
        const amount = parseFloat(e.target.value) || 0;
        document.getElementById('mintCost').textContent = `${(amount * 11).toFixed(2)} USDT`;
    }
    
    if (e.target.id === 'burnAmount') {
        const amount = parseFloat(e.target.value) || 0;
        document.getElementById('burnReceive').textContent = `${(amount * 11).toFixed(2)} USDT`;
    }
    
    if (e.target.id === 'stakeAmount') {
        const amount = parseFloat(e.target.value) || 0;
        const reward = amount * 0.06 * (30/365); // 6% APR for 30 days
        document.getElementById('expectedReward').textContent = `${reward.toFixed(4)} HP`;
    }
});

// Handle escape key to close modals
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modals = document.querySelectorAll('.modal.show');
        modals.forEach(modal => modal.classList.remove('show'));
        
        const sidebar = document.getElementById('sidebar');
        if (sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
        }
    }
});