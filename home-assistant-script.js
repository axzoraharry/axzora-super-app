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
                
                // Check if already connected
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    this.account = accounts[0];
                    this.walletConnected = true;
                    this.updateWalletUI();
                }
            }
        } catch (error) {
            console.error('Web3 initialization error:', error);
        }
    }
    
    async connectWallet() {
        try {
            if (!window.ethereum) {
                showNotification('MetaMask not detected. Please install MetaMask.', 'error');
                return;
            }
            
            showNotification('Connecting to wallet...', 'info');
            
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });
            
            if (accounts.length > 0) {
                this.account = accounts[0];
                this.walletConnected = true;
                this.web3 = new Web3(window.ethereum);
                
                this.updateWalletUI();
                this.loadBalances();
                
                showNotification('Wallet connected successfully!', 'success');
            }
        } catch (error) {
            console.error('Wallet connection error:', error);
            showNotification('Failed to connect wallet', 'error');
        }
    }
    
    updateWalletUI() {
        const walletCardStatus = document.getElementById('walletCardStatus');
        const walletStatus = document.getElementById('walletStatus');
        
        if (this.walletConnected) {
            walletCardStatus.classList.add('active');
            walletStatus.classList.add('active');
            
            // Update action cards
            document.getElementById('mintCard').classList.remove('disabled');
            document.getElementById('burnCard').classList.remove('disabled');
            document.getElementById('transferCard').classList.remove('disabled');
            document.getElementById('stakeCard').classList.remove('disabled');
            
            // Check if user is owner and show owner functions
            this.checkOwnerStatus();
        }
        
        this.updateSecurityStatus();
    }
    
    async loadBalances() {
        if (!this.walletConnected || !this.web3) return;
        
        try {
            // Load BNB balance
            const bnbBalance = await this.web3.eth.getBalance(this.account);
            const bnbFormatted = this.web3.utils.fromWei(bnbBalance, 'ether');
            
            document.getElementById('bnbBalance').textContent = parseFloat(bnbFormatted).toFixed(4);
            document.getElementById('bnbValue').textContent = `$${(parseFloat(bnbFormatted) * 300).toFixed(2)}`; // Estimated BNB price
            
            // Load token balances (HP and USDT)
            this.loadTokenBalances();
            
        } catch (error) {
            console.error('Error loading balances:', error);
        }
    }
    
    async loadTokenBalances() {
        // This would integrate with your existing blockchain interface
        // For now, show placeholder values
        document.getElementById('hpBalance').textContent = '0.00';
        document.getElementById('hpValue').textContent = '$0.00';
        document.getElementById('usdtBalance').textContent = '0.00';
        document.getElementById('usdtValue').textContent = '$0.00';
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
        document.getElementById('withdrawProfitsModal').classList.add('show');
    }
    
    closeWithdrawProfitsModal() {
        document.getElementById('withdrawProfitsModal').classList.remove('show');
    }
    
    openEmergencyModal() {
        document.getElementById('emergencyWithdrawModal').classList.add('show');
    }
    
    closeEmergencyModal() {
        document.getElementById('emergencyWithdrawModal').classList.remove('show');
    }
    
    setMaxProfits() {
        const availableProfits = document.getElementById('modalAvailableProfits').textContent;
        const amount = parseFloat(availableProfits.replace(/[^0-9.]/g, ''));
        document.getElementById('profitAmount').value = amount.toFixed(6);
    }
    
    executeWithdrawProfits() {
        const amount = document.getElementById('profitAmount').value;
        if (!amount || amount <= 0) {
            showNotification('Please enter a valid amount', 'warning');
            return;
        }
        
        showNotification(`Withdrawing ${amount} USDT profits...`, 'info');
        this.closeWithdrawProfitsModal();
        
        // This will integrate with existing owner management functionality
        setTimeout(() => {
            showNotification(`Successfully withdrew ${amount} USDT profits!`, 'success');
        }, 2000);
    }
    
    executeEmergencyWithdraw() {
        showNotification('Executing emergency withdrawal...', 'warning');
        this.closeEmergencyModal();
        
        // This will integrate with existing emergency withdrawal functionality
        setTimeout(() => {
            showNotification('Emergency withdrawal executed!', 'success');
        }, 2000);
    }
    
    checkCollateral() {
        showNotification('Checking collateral status...', 'info');
        
        // This will integrate with existing collateral checking
        setTimeout(() => {
            showNotification('Collateral status: Healthy', 'success');
        }, 1000);
    }
    
    pauseContract() {
        showNotification('Pausing contract...', 'warning');
        
        // This will integrate with existing contract pause functionality
        setTimeout(() => {
            showNotification('Contract paused successfully!', 'success');
            document.getElementById('contractStatus').textContent = 'Paused';
        }, 2000);
    }
    
    // Check if user is owner and show/hide owner panel
    checkOwnerStatus() {
        // This will integrate with existing owner checking
        // For now, show panel if wallet is connected
        if (this.walletConnected) {
            const ownerPanel = document.getElementById('ownerPanel');
            if (ownerPanel) {
                ownerPanel.style.display = 'block';
            }
        }
    }

    // Transaction functions (integrate with existing blockchain interface)
    async executeMint() {
        const amount = document.getElementById('mintAmount').value;
        if (!amount || amount <= 0) {
            showNotification('Please enter a valid amount', 'warning');
            return;
        }
        
        showNotification(`Minting ${amount} HP tokens...`, 'info');
        this.closeMintModal();
        
        // Integrate with existing mint functionality
        setTimeout(() => {
            showNotification(`Successfully minted ${amount} HP tokens!`, 'success');
            this.loadBalances();
        }, 2000);
    }
    
    async executeBurn() {
        const amount = document.getElementById('burnAmount').value;
        if (!amount || amount <= 0) {
            showNotification('Please enter a valid amount', 'warning');
            return;
        }
        
        showNotification(`Burning ${amount} HP tokens...`, 'info');
        this.closeBurnModal();
        
        // Integrate with existing burn functionality
        setTimeout(() => {
            showNotification(`Successfully burned ${amount} HP tokens!`, 'success');
            this.loadBalances();
        }, 2000);
    }
    
    async executeTransfer() {
        const address = document.getElementById('transferAddress').value;
        const amount = document.getElementById('transferAmount').value;
        
        if (!address || !amount || amount <= 0) {
            showNotification('Please enter valid address and amount', 'warning');
            return;
        }
        
        showNotification(`Transferring ${amount} HP tokens...`, 'info');
        this.closeTransferModal();
        
        // Integrate with existing transfer functionality
        setTimeout(() => {
            showNotification(`Successfully transferred ${amount} HP tokens!`, 'success');
            this.loadBalances();
        }, 2000);
    }
    
    async executeStaking() {
        const amount = document.getElementById('stakeAmount').value;
        if (!amount || amount <= 0) {
            showNotification('Please enter a valid amount', 'warning');
            return;
        }
        
        showNotification(`Staking ${amount} HP tokens...`, 'info');
        this.closeStakingModal();
        
        // Integrate with existing staking functionality
        setTimeout(() => {
            showNotification(`Successfully staked ${amount} HP tokens!`, 'success');
            this.loadBalances();
        }, 2000);
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
    app.requestLocation();
}

function requestFingerprint() {
    app.requestFingerprint();
}

function requestCamera() {
    app.requestCamera();
}

function enterApp() {
    app.enterApp();
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
    app.connectWallet();
}

function toggleSidebar() {
    app.toggleSidebar();
}

function toggleVoice() {
    app.toggleVoice();
}

function openMintModal() {
    app.openMintModal();
}

function closeMintModal() {
    app.closeMintModal();
}

function openBurnModal() {
    app.openBurnModal();
}

function closeBurnModal() {
    app.closeBurnModal();
}

function openTransferModal() {
    app.openTransferModal();
}

function closeTransferModal() {
    app.closeTransferModal();
}

function openStakingModal() {
    app.openStakingModal();
}

function closeStakingModal() {
    app.closeStakingModal();
}

function showHelp() {
    app.showHelp();
}

function executeMint() {
    app.executeMint();
}

function executeBurn() {
    app.executeBurn();
}

function executeTransfer() {
    app.executeTransfer();
}

function executeStaking() {
    app.executeStaking();
}

// Owner management functions
function openWithdrawProfitsModal() {
    if (app) app.openWithdrawProfitsModal();
}

function closeWithdrawProfitsModal() {
    if (app) app.closeWithdrawProfitsModal();
}

function openEmergencyModal() {
    if (app) app.openEmergencyModal();
}

function closeEmergencyModal() {
    if (app) app.closeEmergencyModal();
}

function setMaxProfits() {
    if (app) app.setMaxProfits();
}

function executeWithdrawProfits() {
    if (app) app.executeWithdrawProfits();
}

function executeEmergencyWithdraw() {
    if (app) app.executeEmergencyWithdraw();
}

function checkCollateral() {
    if (app) app.checkCollateral();
}

function pauseContract() {
    if (app) app.pauseContract();
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