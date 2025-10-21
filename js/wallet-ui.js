/**
 * 🎨 Axzora Built-in Wallet UI Components
 * Beautiful wallet interface with setup, unlock, and transaction management
 */

class WalletUI {
    constructor() {
        this.isSetupComplete = false;
        this.currentView = 'loading';
        this.setupWalletUI();
        this.bindEvents();
    }

    setupWalletUI() {
        // Check if wallet exists
        const existingWallet = localStorage.getItem('axzora_wallet');
        if (existingWallet) {
            this.showUnlockScreen();
        } else {
            this.showWelcomeScreen();
        }
    }

    showWelcomeScreen() {
        const walletContainer = this.createWalletContainer();
        walletContainer.innerHTML = `
            <div class="wallet-welcome">
                <div class="welcome-animation">
                    <div class="wallet-icon">💎</div>
                    <div class="glow-effect"></div>
                </div>
                
                <h2>Welcome to Axzora Wallet</h2>
                <p>Your secure, built-in wallet with biometric protection</p>
                
                <div class="features-list">
                    <div class="feature">
                        <span class="icon">🔐</span>
                        <span>Biometric Security</span>
                    </div>
                    <div class="feature">
                        <span class="icon">⚡</span>
                        <span>Instant Transactions</span>
                    </div>
                    <div class="feature">
                        <span class="icon">🎯</span>
                        <span>No Extensions Needed</span>
                    </div>
                </div>
                
                <div class="wallet-actions">
                    <button id="createWalletBtn" class="btn-primary glow">
                        <span class="btn-text">Create New Wallet</span>
                        <span class="btn-icon">✨</span>
                    </button>
                    <button id="importWalletBtn" class="btn-secondary">
                        <span class="btn-text">Import Existing Wallet</span>
                        <span class="btn-icon">📥</span>
                    </button>
                </div>
            </div>
        `;
        
        this.bindWelcomeEvents();
    }

    showCreateWalletScreen() {
        const walletContainer = document.getElementById('walletContainer');
        walletContainer.innerHTML = `
            <div class="wallet-create">
                <div class="step-indicator">
                    <div class="step active">1</div>
                    <div class="step-line"></div>
                    <div class="step">2</div>
                    <div class="step-line"></div>
                    <div class="step">3</div>
                </div>
                
                <h2>Create Your Wallet</h2>
                <p>Set a strong password to protect your wallet</p>
                
                <form id="createWalletForm" class="wallet-form">
                    <div class="input-group">
                        <label>Password</label>
                        <div class="password-input">
                            <input type="password" id="walletPassword" required minlength="8"
                                   placeholder="Enter strong password">
                            <button type="button" class="toggle-password" id="togglePassword">
                                <span class="eye-icon">👁️</span>
                            </button>
                        </div>
                        <div class="password-strength">
                            <div class="strength-bar">
                                <div class="strength-fill" id="strengthFill"></div>
                            </div>
                            <span class="strength-text" id="strengthText">Enter password</span>
                        </div>
                    </div>
                    
                    <div class="input-group">
                        <label>Confirm Password</label>
                        <input type="password" id="confirmPassword" required
                               placeholder="Confirm your password">
                    </div>
                    
                    <div class="security-options">
                        <label class="checkbox-label">
                            <input type="checkbox" id="enableBiometric" checked>
                            <span class="checkmark"></span>
                            Enable biometric authentication (Recommended)
                        </label>
                        
                        <label class="checkbox-label">
                            <input type="checkbox" id="agreeTerms" required>
                            <span class="checkmark"></span>
                            I agree to the terms and understand that I'm responsible for my wallet security
                        </label>
                    </div>
                    
                    <div class="wallet-actions">
                        <button type="button" id="backToWelcome" class="btn-secondary">
                            Back
                        </button>
                        <button type="submit" id="createWalletSubmit" class="btn-primary" disabled>
                            Create Wallet
                        </button>
                    </div>
                </form>
                
                <div class="loading-overlay" id="walletCreationLoading" style="display: none;">
                    <div class="loading-content">
                        <div class="loading-spinner"></div>
                        <p>Creating your secure wallet...</p>
                    </div>
                </div>
            </div>
        `;
        
        this.bindCreateWalletEvents();
    }

    showMnemonicBackup(mnemonic) {
        const walletContainer = document.getElementById('walletContainer');
        walletContainer.innerHTML = `
            <div class="wallet-backup">
                <div class="step-indicator">
                    <div class="step completed">1</div>
                    <div class="step-line completed"></div>
                    <div class="step active">2</div>
                    <div class="step-line"></div>
                    <div class="step">3</div>
                </div>
                
                <h2>🔐 Backup Your Wallet</h2>
                <p>Write down these 12 words in order. Keep them safe - they're your only way to recover your wallet!</p>
                
                <div class="mnemonic-container">
                    <div class="security-warning">
                        <span class="warning-icon">⚠️</span>
                        <p>Never share these words with anyone. Store them securely offline.</p>
                    </div>
                    
                    <div class="mnemonic-grid">
                        ${mnemonic.split(' ').map((word, index) => `
                            <div class="mnemonic-word">
                                <span class="word-number">${index + 1}</span>
                                <span class="word-text">${word}</span>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="backup-actions">
                        <button id="copyMnemonic" class="btn-secondary">
                            <span class="btn-icon">📋</span>
                            Copy to Clipboard
                        </button>
                        <button id="downloadBackup" class="btn-secondary">
                            <span class="btn-icon">💾</span>
                            Download Backup
                        </button>
                    </div>
                </div>
                
                <div class="confirmation-check">
                    <label class="checkbox-label">
                        <input type="checkbox" id="confirmedBackup" required>
                        <span class="checkmark"></span>
                        I have securely saved my recovery phrase
                    </label>
                </div>
                
                <div class="wallet-actions">
                    <button id="proceedToVerification" class="btn-primary" disabled>
                        Continue to Verification
                    </button>
                </div>
            </div>
        `;
        
        this.bindBackupEvents(mnemonic);
    }

    showUnlockScreen() {
        const walletContainer = this.createWalletContainer();
        const walletData = JSON.parse(localStorage.getItem('axzora_wallet'));
        
        walletContainer.innerHTML = `
            <div class="wallet-unlock">
                <div class="wallet-header">
                    <div class="wallet-icon">🔐</div>
                    <h2>Unlock Your Wallet</h2>
                    <p>Welcome back! Your wallet address:</p>
                    <div class="wallet-address">
                        <span class="address-text">${this.formatAddress(walletData.address)}</span>
                        <button class="copy-btn" onclick="navigator.clipboard.writeText('${walletData.address}')">📋</button>
                    </div>
                </div>
                
                <form id="unlockWalletForm" class="wallet-form">
                    <div class="input-group">
                        <label>Enter Password</label>
                        <div class="password-input">
                            <input type="password" id="unlockPassword" required
                                   placeholder="Enter your wallet password">
                            <button type="button" class="toggle-password" id="toggleUnlockPassword">
                                <span class="eye-icon">👁️</span>
                            </button>
                        </div>
                    </div>
                    
                    <div class="biometric-option">
                        <button type="button" id="biometricUnlock" class="btn-biometric">
                            <span class="btn-icon">👤</span>
                            <span class="btn-text">Unlock with Biometric</span>
                            <div class="biometric-status" id="biometricStatus">
                                Face recognition ready
                            </div>
                        </button>
                    </div>
                    
                    <div class="wallet-actions">
                        <button type="submit" class="btn-primary glow">
                            <span class="btn-text">Unlock Wallet</span>
                            <span class="btn-icon">🔓</span>
                        </button>
                    </div>
                    
                    <div class="recovery-options">
                        <a href="#" id="forgotPassword">Forgot password?</a>
                        <span>•</span>
                        <a href="#" id="importDifferentWallet">Import different wallet</a>
                    </div>
                </form>
                
                <div id="unlockError" class="error-message" style="display: none;"></div>
            </div>
        `;
        
        this.bindUnlockEvents();
    }

    showWalletDashboard() {
        const walletContainer = document.getElementById('walletContainer');
        walletContainer.innerHTML = `
            <div class="wallet-dashboard">
                <!-- Wallet Header -->
                <div class="wallet-header">
                    <div class="wallet-info">
                        <div class="wallet-avatar">
                            <canvas id="walletAvatar" width="40" height="40"></canvas>
                        </div>
                        <div class="wallet-details">
                            <h3>My Axzora Wallet</h3>
                            <div class="wallet-address">
                                <span class="address-text" id="currentAddress">Loading...</span>
                                <button class="copy-btn" id="copyAddress">📋</button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="wallet-controls">
                        <button id="lockWallet" class="btn-icon" title="Lock Wallet">🔒</button>
                        <button id="walletSettings" class="btn-icon" title="Settings">⚙️</button>
                        <div class="network-status">
                            <div class="status-dot active"></div>
                            <span>BSC</span>
                        </div>
                    </div>
                </div>
                
                <!-- Balance Cards -->
                <div class="balance-cards">
                    <div class="balance-card bnb">
                        <div class="card-header">
                            <span class="token-icon">⚡</span>
                            <span class="token-name">BNB</span>
                        </div>
                        <div class="card-balance">
                            <span class="amount" id="bnbBalance">0.00</span>
                            <span class="currency">BNB</span>
                        </div>
                        <div class="card-value" id="bnbValue">$0.00</div>
                    </div>
                    
                    <div class="balance-card hp">
                        <div class="card-header">
                            <span class="token-icon">💰</span>
                            <span class="token-name">Happy Paisa</span>
                        </div>
                        <div class="card-balance">
                            <span class="amount" id="hpBalance">0.00</span>
                            <span class="currency">HP</span>
                        </div>
                        <div class="card-value" id="hpValue">$0.00</div>
                    </div>
                    
                    <div class="balance-card usdt">
                        <div class="card-header">
                            <span class="token-icon">💵</span>
                            <span class="token-name">USDT</span>
                        </div>
                        <div class="card-balance">
                            <span class="amount" id="usdtBalance">0.00</span>
                            <span class="currency">USDT</span>
                        </div>
                        <div class="card-value" id="usdtValue">$0.00</div>
                    </div>
                </div>
                
                <!-- Quick Actions -->
                <div class="quick-actions">
                    <button class="action-btn send" id="sendTokens">
                        <span class="btn-icon">📤</span>
                        <span class="btn-text">Send</span>
                    </button>
                    <button class="action-btn receive" id="receiveTokens">
                        <span class="btn-icon">📥</span>
                        <span class="btn-text">Receive</span>
                    </button>
                    <button class="action-btn mint" id="mintTokens">
                        <span class="btn-icon">⚡</span>
                        <span class="btn-text">Mint HP</span>
                    </button>
                    <button class="action-btn stake" id="stakeTokens">
                        <span class="btn-icon">📊</span>
                        <span class="btn-text">Stake</span>
                    </button>
                </div>
                
                <!-- Transaction History -->
                <div class="transaction-history">
                    <div class="section-header">
                        <h4>Recent Transactions</h4>
                        <button id="viewAllTransactions" class="btn-link">View All</button>
                    </div>
                    <div class="transactions-list" id="transactionsList">
                        <div class="no-transactions">
                            <span class="icon">📝</span>
                            <p>No transactions yet</p>
                            <small>Your transaction history will appear here</small>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.bindDashboardEvents();
        this.updateWalletDisplay();
    }

    createWalletContainer() {
        let container = document.getElementById('walletContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'walletContainer';
            container.className = 'wallet-container';
            document.body.appendChild(container);
        }
        return container;
    }

    // Event Binding Methods
    bindWelcomeEvents() {
        document.getElementById('createWalletBtn').addEventListener('click', () => {
            this.showCreateWalletScreen();
        });
        
        document.getElementById('importWalletBtn').addEventListener('click', () => {
            this.showImportWalletScreen();
        });
    }

    bindCreateWalletEvents() {
        const passwordInput = document.getElementById('walletPassword');
        const confirmInput = document.getElementById('confirmPassword');
        const submitBtn = document.getElementById('createWalletSubmit');
        const agreeTerms = document.getElementById('agreeTerms');
        
        // Password strength checker
        passwordInput.addEventListener('input', this.checkPasswordStrength.bind(this));
        
        // Form validation
        const validateForm = () => {
            const password = passwordInput.value;
            const confirm = confirmInput.value;
            const agreed = agreeTerms.checked;
            
            const isValid = password.length >= 8 && password === confirm && agreed;
            submitBtn.disabled = !isValid;
            submitBtn.className = isValid ? 'btn-primary glow' : 'btn-primary';
        };
        
        [passwordInput, confirmInput, agreeTerms].forEach(el => {
            el.addEventListener('change', validateForm);
            el.addEventListener('input', validateForm);
        });
        
        // Toggle password visibility
        document.getElementById('togglePassword').addEventListener('click', () => {
            const input = passwordInput;
            const type = input.type === 'password' ? 'text' : 'password';
            input.type = type;
        });
        
        // Form submission
        document.getElementById('createWalletForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleWalletCreation(passwordInput.value);
        });
        
        // Back button
        document.getElementById('backToWelcome').addEventListener('click', () => {
            this.showWelcomeScreen();
        });
    }

    bindUnlockEvents() {
        const form = document.getElementById('unlockWalletForm');
        const passwordInput = document.getElementById('unlockPassword');
        const biometricBtn = document.getElementById('biometricUnlock');
        const toggleBtn = document.getElementById('toggleUnlockPassword');
        
        // Toggle password visibility
        toggleBtn.addEventListener('click', () => {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
        });
        
        // Form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleWalletUnlock(passwordInput.value);
        });
        
        // Biometric unlock
        biometricBtn.addEventListener('click', () => {
            this.handleBiometricUnlock();
        });
    }

    bindDashboardEvents() {
        // Update wallet display
        this.updateWalletDisplay();
        
        // Copy address
        document.getElementById('copyAddress').addEventListener('click', () => {
            navigator.clipboard.writeText(window.axzoraWallet.account);
            this.showNotification('Address copied to clipboard!', 'success');
        });
        
        // Lock wallet
        document.getElementById('lockWallet').addEventListener('click', () => {
            window.axzoraWallet.lockWallet();
            this.showUnlockScreen();
        });
        
        // Quick actions
        document.getElementById('sendTokens').addEventListener('click', () => this.showSendModal());
        document.getElementById('receiveTokens').addEventListener('click', () => this.showReceiveModal());
        document.getElementById('mintTokens').addEventListener('click', () => this.showMintModal());
        document.getElementById('stakeTokens').addEventListener('click', () => this.showStakeModal());
    }

    // Wallet Operations
    async handleWalletCreation(password) {
        const loadingOverlay = document.getElementById('walletCreationLoading');
        loadingOverlay.style.display = 'flex';
        
        try {
            const result = await window.axzoraWallet.createWallet(password);
            
            if (result.success) {
                loadingOverlay.style.display = 'none';
                this.showMnemonicBackup(result.mnemonic);
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            loadingOverlay.style.display = 'none';
            this.showNotification('Failed to create wallet: ' + error.message, 'error');
        }
    }

    async handleWalletUnlock(password) {
        try {
            const result = await window.axzoraWallet.unlockWallet(password);
            
            if (result.success) {
                this.showWalletDashboard();
                this.showNotification('Wallet unlocked successfully!', 'success');
            } else {
                const errorEl = document.getElementById('unlockError');
                errorEl.textContent = result.error;
                errorEl.style.display = 'block';
            }
        } catch (error) {
            this.showNotification('Failed to unlock wallet: ' + error.message, 'error');
        }
    }

    updateWalletDisplay() {
        if (!window.axzoraWallet.isUnlocked) return;
        
        // Update address
        const addressEl = document.getElementById('currentAddress');
        if (addressEl) {
            addressEl.textContent = this.formatAddress(window.axzoraWallet.account);
        }
        
        // Update balances
        const balances = window.axzoraWallet.balances;
        if (document.getElementById('bnbBalance')) {
            document.getElementById('bnbBalance').textContent = this.formatBalance(balances.BNB);
            document.getElementById('hpBalance').textContent = this.formatBalance(balances.HP);
            document.getElementById('usdtBalance').textContent = this.formatBalance(balances.USDT);
        }
    }

    // Utility Methods
    formatAddress(address) {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }

    formatBalance(balance) {
        const num = parseFloat(balance);
        if (num === 0) return '0.00';
        if (num < 0.01) return '< 0.01';
        return num.toFixed(2);
    }

    checkPasswordStrength(event) {
        const password = event.target.value;
        const strengthFill = document.getElementById('strengthFill');
        const strengthText = document.getElementById('strengthText');
        
        let strength = 0;
        let text = 'Weak';
        let color = '#ff4757';
        
        if (password.length >= 8) strength += 25;
        if (password.match(/[a-z]/)) strength += 25;
        if (password.match(/[A-Z]/)) strength += 25;
        if (password.match(/[0-9]/)) strength += 25;
        
        if (strength >= 75) {
            text = 'Strong';
            color = '#2ed573';
        } else if (strength >= 50) {
            text = 'Medium';
            color = '#ffa502';
        }
        
        strengthFill.style.width = strength + '%';
        strengthFill.style.backgroundColor = color;
        strengthText.textContent = text;
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <span class="notification-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
            <span class="notification-text">${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    bindEvents() {
        // Listen for wallet changes
        window.addEventListener('walletChanged', (event) => {
            const { account, isUnlocked } = event.detail;
            
            if (account && isUnlocked) {
                this.showWalletDashboard();
            } else if (account && !isUnlocked) {
                this.showUnlockScreen();
            }
        });
        
        // Listen for balance updates
        window.addEventListener('balanceUpdated', () => {
            this.updateWalletDisplay();
        });
    }
}

// Initialize Wallet UI
window.walletUI = new WalletUI();

console.log('🎨 Axzora Wallet UI loaded successfully!');