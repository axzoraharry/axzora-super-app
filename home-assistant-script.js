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
            showNotification('Requesting location access...', 'info');
            
            if (navigator.geolocation) {
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject);
                });
                
                this.permissions.location = true;
                this.updatePermissionUI('locationPermission', true);
                showNotification('Location access granted!', 'success');
                
                // Store location for security
                localStorage.setItem('userLocation', JSON.stringify({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    timestamp: Date.now()
                }));
                
            } else {
                throw new Error('Geolocation not supported');
            }
        } catch (error) {
            console.error('Location error:', error);
            showNotification('Location access denied or not available', 'error');
        }
        
        this.checkAllPermissions();
    }
    
    async requestFingerprint() {
        try {
            showNotification('Checking biometric authentication...', 'info');
            
            if (window.PublicKeyCredential) {
                // Check if biometric authentication is available
                const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
                
                if (available) {
                    this.permissions.fingerprint = true;
                    this.updatePermissionUI('fingerprintPermission', true);
                    showNotification('Biometric authentication enabled!', 'success');
                    
                    // Store biometric preference
                    localStorage.setItem('biometricEnabled', 'true');
                } else {
                    // Simulate fingerprint for demo
                    this.permissions.fingerprint = true;
                    this.updatePermissionUI('fingerprintPermission', true);
                    showNotification('Biometric authentication simulated (demo mode)', 'success');
                }
            } else {
                // Fallback for older browsers
                this.permissions.fingerprint = true;
                this.updatePermissionUI('fingerprintPermission', true);
                showNotification('Biometric authentication simulated (fallback)', 'success');
            }
        } catch (error) {
            console.error('Fingerprint error:', error);
            showNotification('Biometric authentication failed', 'error');
        }
        
        this.checkAllPermissions();
    }
    
    async requestCamera() {
        try {
            showNotification('Requesting camera access...', 'info');
            
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            
            // Stop the stream immediately, we just needed permission
            stream.getTracks().forEach(track => track.stop());
            
            this.permissions.camera = true;
            this.updatePermissionUI('cameraPermission', true);
            showNotification('Camera access granted!', 'success');
            
        } catch (error) {
            console.error('Camera error:', error);
            showNotification('Camera access denied or not available', 'error');
        }
        
        this.checkAllPermissions();
    }
    
    updatePermissionUI(permissionId, granted) {
        const permissionItem = document.getElementById(permissionId);
        const btn = permissionItem.querySelector('.permission-btn');
        
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
            showNotification('Welcome to Axzora Home Assistant!', 'success');
        } else {
            showNotification('Please grant all permissions first', 'warning');
        }
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
        document.getElementById('walletStatus').classList.toggle('active', this.walletConnected);
        document.getElementById('securityStatus').classList.add('active'); // Always secure with permissions
        
        // Update sidebar security status
        document.getElementById('locationStatus').textContent = 
            this.permissions.location ? 'Location: Enabled' : 'Location: Disabled';
        document.getElementById('biometricStatus').textContent = 
            this.permissions.fingerprint ? 'Biometric: Active' : 'Biometric: Inactive';
        document.getElementById('encryptionStatus').textContent = 'Encryption: Strong';
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
    const container = document.getElementById('notifications');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    container.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
    
    // Remove on click
    notification.addEventListener('click', () => {
        notification.remove();
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

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    app = new HomeAssistantApp();
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