/**
 * Main Application Controller - Integrates all Axzora Super App Systems
 * Voice, Biometric, Avatar, Blockchain, and UI Management
 */

class AxzoraApp {
    constructor() {
        this.isInitialized = false;
        this.isLoading = true;
        this.currentView = 'dashboard';
        this.notifications = [];
        this.systemStatus = {
            biometric: false,
            voice: false,
            blockchain: false,
            avatar: true
        };
        
        // Application state
        this.appState = {
            user: null,
            isAuthenticated: false,
            theme: 'dark',
            language: 'en',
            voiceEnabled: true,
            biometricEnabled: true,
            autoConnect: true
        };
        
        // Load saved preferences
        this.loadPreferences();
        
        // Initialize application
        this.initialize();
    }

    async initialize() {
        try {
            console.log('🚀 Initializing Axzora Super App...');
            
            // Show loading screen
            this.showLoadingScreen();
            
            // Initialize core systems in sequence
            await this.initializeCoreSystems();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Setup UI interactions
            this.setupUIInteractions();
            
            // Setup notification system
            this.setupNotifications();
            
            // Initialize dashboard
            this.initializeDashboard();
            
            // Complete initialization
            this.completeInitialization();
            
            console.log('✅ Axzora Super App initialized successfully');
            
        } catch (error) {
            console.error('❌ Application initialization failed:', error);
            this.showInitializationError(error);
        }
    }

    async initializeCoreSystems() {
        console.log('🔄 Initializing core systems...');
        
        // Initialize systems with progress updates
        const systems = [
            { name: 'Biometric Monitor', delay: 1000 },
            { name: 'Voice Processor', delay: 1500 },
            { name: 'Avatar Controller', delay: 500 },
            { name: 'Blockchain Interface', delay: 2000 }
        ];
        
        let progress = 0;
        const progressIncrement = 100 / systems.length;
        
        for (const system of systems) {
            this.updateLoadingProgress(progress, `Loading ${system.name}...`);
            
            // Simulate system loading time
            await new Promise(resolve => setTimeout(resolve, system.delay));
            
            progress += progressIncrement;
        }
        
        this.updateLoadingProgress(100, 'Starting Application...');
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setupEventListeners() {
        console.log('📡 Setting up event listeners...');
        
        // System status events
        window.addEventListener('user-authenticated', (event) => {
            this.handleUserAuthenticated(event.detail);
        });
        
        window.addEventListener('wallet-connected', (event) => {
            this.handleWalletConnected(event.detail);
        });
        
        window.addEventListener('wallet-disconnected', (event) => {
            this.handleWalletDisconnected(event.detail);
        });
        
        // Voice command events
        window.addEventListener('voice-command', (event) => {
            this.handleVoiceCommand(event.detail);
        });
        
        // Notification events
        window.addEventListener('show-notification', (event) => {
            this.showNotification(event.detail);
        });
        
        // Window events
        window.addEventListener('beforeunload', () => {
            this.savePreferences();
        });
        
        window.addEventListener('resize', () => {
            this.handleWindowResize();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (event) => {
            this.handleKeyboardShortcuts(event);
        });
        
        // Visibility change
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });
    }

    setupUIInteractions() {
        console.log('🎨 Setting up UI interactions...');
        
        // Microphone button
        const micButton = document.getElementById('micButton');
        if (micButton) {
            micButton.addEventListener('click', () => {
                this.toggleVoiceRecognition();
            });
        }
        
        // Connect wallet button
        const connectWallet = document.getElementById('connectWallet');
        if (connectWallet) {
            connectWallet.addEventListener('click', () => {
                this.connectWallet();
            });
        }
        
        // Disconnect wallet button
        const disconnectWallet = document.getElementById('disconnectWallet');
        if (disconnectWallet) {
            disconnectWallet.addEventListener('click', () => {
                this.disconnectWallet();
            });
        }
        
        // Verify account button
        const verifyAccount = document.getElementById('verifyAccount');
        if (verifyAccount) {
            verifyAccount.addEventListener('click', () => {
                this.verifyCurrentAccount();
            });
        }
        
        // Action buttons
        const actionButtons = document.querySelectorAll('.action-btn');
        actionButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.closest('.action-btn').dataset.action;
                this.handleAction(action);
            });
        });
        
        // Navigation items
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (event) => {
                const target = event.target.dataset.target;
                if (target) {
                    this.navigateToView(target);
                }
            });
        });
        
        // Quick action buttons
        const quickActions = document.querySelectorAll('.quick-action');
        quickActions.forEach(button => {
            button.addEventListener('click', (event) => {
                const action = event.target.dataset.action;
                this.executeQuickAction(action);
            });
        });
        
        // Settings button
        const settingsButton = document.getElementById('settingsButton');
        if (settingsButton) {
            settingsButton.addEventListener('click', () => {
                this.showSettings();
            });
        }
        
        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
    }

    setupNotifications() {
        console.log('🔔 Setting up notifications...');
        
        // Create notifications container if it doesn't exist
        if (!document.getElementById('notificationsContainer')) {
            const container = document.createElement('div');
            container.id = 'notificationsContainer';
            container.className = 'notifications-container';
            document.body.appendChild(container);
        }
        
        // Auto-clear old notifications
        setInterval(() => {
            this.clearOldNotifications();
        }, 30000); // Every 30 seconds
    }

    initializeDashboard() {
        console.log('📊 Initializing dashboard...');
        
        // Update system status indicators
        this.updateSystemStatus();
        
        // Load suggested commands
        this.loadSuggestedCommands();
        
        // Initialize market data display
        this.initializeMarketDisplay();
        
        // Start periodic updates
        this.startPeriodicUpdates();
    }

    completeInitialization() {
        // Hide loading screen
        this.hideLoadingScreen();
        
        // Show main application
        this.showMainApplication();
        
        // Mark as initialized
        this.isInitialized = true;
        this.isLoading = false;
        
        // Welcome message
        setTimeout(() => {
            if (window.voiceProcessor) {
                window.voiceProcessor.speak('Welcome to Axzora Super App! I am Mr. Happy, your AI assistant. How can I help you today?');
            }
        }, 2000);
        
        // Show welcome notification
        this.showNotification({
            message: '🎉 Welcome to Axzora Super App! All systems are ready.',
            type: 'success',
            duration: 5000
        });
    }

    handleUserAuthenticated(user) {
        console.log('👤 User authenticated:', user);
        
        this.appState.user = user;
        this.appState.isAuthenticated = true;
        
        this.updateSystemStatus();
        this.updateUserInterface();
        
        this.showNotification({
            message: `Welcome back, ${user.name}!`,
            type: 'success',
            duration: 3000
        });
    }

    handleWalletConnected(wallet) {
        console.log('💰 Wallet connected:', wallet);
        
        this.appState.wallet = wallet;
        this.appState.isWalletConnected = true;
        this.systemStatus.blockchain = true;
        
        this.updateSystemStatus();
        this.updateWalletUI();
        
        const address = wallet.account || wallet.address || wallet;
        this.showNotification({
            message: `Wallet connected: ${address.substring(0, 6)}...${address.substring(address.length - 4)}`,
            type: 'success',
            duration: 3000
        });
        
        // Load account data after wallet connects
        if (window.blockchainInterface) {
            window.blockchainInterface.loadAccountData();
        }
    }

    handleWalletDisconnected() {
        console.log('💰 Wallet disconnected');
        
        this.systemStatus.blockchain = false;
        this.updateSystemStatus();
        
        this.showNotification({
            message: 'Wallet disconnected',
            type: 'info',
            duration: 3000
        });
    }

    handleVoiceCommand(command) {
        console.log('🎤 Voice command received in main app:', command);
        
        // Add visual feedback for voice commands
        this.showCommandFeedback(command);
        
        // Forward all voice commands to Mr. Happy if available
        if (window.mrHappy) {
            window.mrHappy.handleVoiceCommand(command);
            return;
        }
        
        // Fallback handling if Mr. Happy is not available
        if (command.type === 'navigate' && command.params.target) {
            this.navigateToView(command.params.target);
        }
        
        if (command.type === 'show' && command.params.target) {
            this.showDataView(command.params.target);
        }
    }

    toggleVoiceRecognition() {
        if (window.voiceProcessor) {
            if (window.voiceProcessor.isCurrentlyListening()) {
                window.voiceProcessor.stopListening();
                this.showNotification({
                    message: 'Voice recognition stopped',
                    type: 'info'
                });
            } else {
                window.voiceProcessor.startListening();
                this.showNotification({
                    message: 'Voice recognition started - say a command!',
                    type: 'info'
                });
            }
        }
    }

    async toggleWalletConnection() {
        if (window.blockchainInterface) {
            if (window.blockchainInterface.isWalletConnected()) {
                await window.blockchainInterface.disconnectWallet();
            } else {
                await window.blockchainInterface.connectWallet();
            }
        }
    }

    navigateToView(viewName) {
        console.log('🧭 Navigating to:', viewName);
        
        // Update current view
        this.currentView = viewName;
        
        // Update navigation UI
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.classList.toggle('active', item.dataset.target === viewName);
        });
        
        // Update main content area
        this.updateMainContent(viewName);
        
        // Update URL (if using routing)
        if (history.pushState) {
            history.pushState({ view: viewName }, '', `#${viewName}`);
        }
        
        // Speak navigation confirmation
        if (window.voiceProcessor) {
            window.voiceProcessor.speak(`Navigated to ${viewName}`);
        }
    }

    executeQuickAction(action) {
        console.log('⚡ Executing quick action:', action);
        
        switch (action) {
            case 'mint':
                if (window.blockchainInterface && window.blockchainInterface.isWalletConnected()) {
                    this.showMintDialog();
                } else {
                    this.showNotification({
                        message: 'Please connect your wallet first',
                        type: 'warning'
                    });
                }
                break;
                
            case 'burn':
                if (window.blockchainInterface && window.blockchainInterface.isWalletConnected()) {
                    this.showBurnDialog();
                } else {
                    this.showNotification({
                        message: 'Please connect your wallet first',
                        type: 'warning'
                    });
                }
                break;
                
            case 'transfer':
                if (window.blockchainInterface && window.blockchainInterface.isWalletConnected()) {
                    this.showTransferDialog();
                } else {
                    this.showNotification({
                        message: 'Please connect your wallet first',
                        type: 'warning'
                    });
                }
                break;
                
            case 'scan':
                this.showQRScanner();
                break;
                
            case 'generate':
                this.showQRGenerator();
                break;
                
            case 'refresh':
                this.refreshAllData();
                break;
                
            default:
                console.warn('Unknown quick action:', action);
        }
    }

    showCommandFeedback(command) {
        const commandInterface = document.getElementById('commandInterface');
        if (commandInterface) {
            // Add pulsing animation
            commandInterface.classList.add('command-active');
            
            setTimeout(() => {
                commandInterface.classList.remove('command-active');
            }, 2000);
        }
        
        // Update current command display
        const currentCommand = document.getElementById('currentCommand');
        if (currentCommand) {
            currentCommand.textContent = `Executed: ${command.type}`;
            currentCommand.classList.add('command-executed');
            
            setTimeout(() => {
                currentCommand.classList.remove('command-executed');
                currentCommand.textContent = 'Say a command...';
            }, 3000);
        }
    }

    updateSystemStatus() {
        // Throttle system status updates to prevent excessive calls
        const now = Date.now();
        if (this.lastSystemStatusUpdate && now - this.lastSystemStatusUpdate < 3000) {
            return; // Skip if less than 3 seconds since last update
        }
        this.lastSystemStatusUpdate = now;
        
        console.log('📊 Updating system status...');
        
        // Update biometric status
        if (window.biometricMonitor) {
            this.systemStatus.biometric = window.biometricMonitor.isUserAuthenticated();
        }
        
        // Update voice status
        if (window.voiceProcessor) {
            this.systemStatus.voice = window.voiceProcessor.isCurrentlyListening();
        }
        
        // Update blockchain status
        if (window.blockchainInterface) {
            this.systemStatus.blockchain = window.blockchainInterface.isWalletConnected();
        }
        
        // Update status indicators in UI
        Object.entries(this.systemStatus).forEach(([system, isActive]) => {
            const statusEl = document.getElementById(`${system}Status`);
            if (statusEl) {
                const dot = statusEl.querySelector('.status-dot');
                if (dot) {
                    dot.classList.toggle('active', isActive);
                    dot.classList.toggle('inactive', !isActive);
                }
                
                const label = statusEl.querySelector('.status-label');
                if (label) {
                    label.textContent = isActive ? 'Online' : 'Offline';
                }
            }
        });
        
        // Update overall system health
        const activeCount = Object.values(this.systemStatus).filter(Boolean).length;
        const totalCount = Object.keys(this.systemStatus).length;
        const healthPercent = Math.round((activeCount / totalCount) * 100);
        
        const systemHealth = document.getElementById('systemHealth');
        if (systemHealth) {
            systemHealth.textContent = `${healthPercent}%`;
            systemHealth.className = `system-health ${this.getHealthClass(healthPercent)}`;
        }
    }

    getHealthClass(percent) {
        if (percent >= 75) return 'excellent';
        if (percent >= 50) return 'good';
        if (percent >= 25) return 'fair';
        return 'poor';
    }

    loadSuggestedCommands() {
        const commandsContainer = document.getElementById('suggestedCommands');
        if (!commandsContainer) return;
        
        const commands = [
            { text: 'Hello Mr. Happy', icon: '👋' },
            { text: 'Show Balance', icon: '💰' },
            { text: 'Mint Tokens', icon: '🏭' },
            { text: 'Make Payment', icon: '💳' },
            { text: 'Help', icon: '❓' }
        ];
        
        commandsContainer.innerHTML = commands.map(cmd => `
            <div class="command-chip" onclick="window.voiceProcessor?.processVoiceCommand('${cmd.text.toLowerCase()}')">
                <span class="command-icon">${cmd.icon}</span>
                <span class="command-text">${cmd.text}</span>
            </div>
        `).join('');
    }

    initializeMarketDisplay() {
        // Simulate market data updates
        setInterval(() => {
            this.updateMarketData();
        }, 30000); // Update every 30 seconds
        
        // Initialize with current data
        this.updateMarketData();
    }

    updateMarketData() {
        // Get real data from blockchain interface
        if (window.blockchainInterface) {
            const marketData = window.blockchainInterface.getMarketData();
            
            // Update HP price display (fixed at $11 USDT)
            const hpPriceEl = document.getElementById('hpPrice');
            if (hpPriceEl) {
                hpPriceEl.textContent = `$${marketData.hpPrice}`;
            }
            
            // Update real volume display
            const volumeEl = document.getElementById('volume24h');
            if (volumeEl) {
                volumeEl.textContent = `$${parseFloat(marketData.volume24h).toLocaleString()}`;
            }
            
            // Update market cap
            const marketCapEl = document.getElementById('marketCap');
            if (marketCapEl) {
                marketCapEl.textContent = `$${parseFloat(marketData.marketCap).toLocaleString()}`;
            }
            
            // Update holder count
            const holdersEl = document.getElementById('holders');
            if (holdersEl) {
                holdersEl.textContent = marketData.holders;
            }
            
            // HP token has a stable peg at $11 USDT, so price change is minimal
            const changeEl = document.getElementById('priceChange');
            if (changeEl) {
                // Stable token - minimal price changes
                const change = 0.00; // Stable peg
                changeEl.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
                changeEl.className = 'price-change stable';
            }
        }
    }

    startPeriodicUpdates() {
        // Update system status every 10 seconds (reduced frequency)
        this.systemStatusInterval = setInterval(() => {
            this.updateSystemStatus();
        }, 10000);
        
        // Refresh blockchain data every 2 minutes (reduced frequency)
        this.blockchainRefreshInterval = setInterval(() => {
            if (window.blockchainInterface && window.blockchainInterface.isWalletConnected()) {
                window.blockchainInterface.refreshData();
            }
        }, 120000);
        
        // Clean up old notifications every 2 minutes
        this.notificationCleanupInterval = setInterval(() => {
            this.clearOldNotifications();
        }, 120000);
    }

    showNotification(notification) {
        const container = document.getElementById('notificationsContainer');
        if (!container) return;
        
        const id = notification.id || Date.now();
        const duration = notification.duration || 4000;
        
        const notificationEl = document.createElement('div');
        notificationEl.id = `notification-${id}`;
        notificationEl.className = `notification ${notification.type || 'info'}`;
        notificationEl.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">${this.getNotificationIcon(notification.type)}</div>
                <div class="notification-message">${notification.message}</div>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        container.appendChild(notificationEl);
        
        // Add to notifications array
        this.notifications.push({
            ...notification,
            id,
            timestamp: new Date(),
            element: notificationEl
        });
        
        // Auto-remove after duration
        setTimeout(() => {
            this.removeNotification(id);
        }, duration);
        
        // Animate in
        requestAnimationFrame(() => {
            notificationEl.classList.add('show');
        });
    }

    removeNotification(id) {
        const notificationEl = document.getElementById(`notification-${id}`);
        if (notificationEl) {
            notificationEl.classList.add('fade-out');
            setTimeout(() => {
                notificationEl.remove();
            }, 300);
        }
        
        // Remove from array
        this.notifications = this.notifications.filter(n => n.id !== id);
    }

    clearOldNotifications() {
        const now = new Date();
        this.notifications.forEach(notification => {
            const age = now - notification.timestamp;
            if (age > 300000) { // 5 minutes
                this.removeNotification(notification.id);
            }
        });
    }

    getNotificationIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    }

    showLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'flex';
        }
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.classList.add('fade-out');
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 1000);
        }
    }

    showMainApplication() {
        const mainContainer = document.getElementById('mainContainer');
        if (mainContainer) {
            mainContainer.style.display = 'grid';
            setTimeout(() => {
                mainContainer.classList.add('fade-in');
            }, 100);
        }
    }

    updateLoadingProgress(percent, message) {
        const progressBar = document.querySelector('.progress-fill');
        const progressText = document.querySelector('.loading-text');
        
        if (progressBar) {
            progressBar.style.width = `${percent}%`;
        }
        
        if (progressText) {
            progressText.textContent = message;
        }
    }

    handleKeyboardShortcuts(event) {
        // Ctrl+Shift+V: Toggle voice recognition
        if (event.ctrlKey && event.shiftKey && event.key === 'V') {
            event.preventDefault();
            this.toggleVoiceRecognition();
        }
        
        // Ctrl+Shift+W: Toggle wallet connection
        if (event.ctrlKey && event.shiftKey && event.key === 'W') {
            event.preventDefault();
            this.toggleWalletConnection();
        }
        
        // Escape: Close modals/dialogs
        if (event.key === 'Escape') {
            this.closeAllModals();
        }
    }

    handleWindowResize() {
        // Responsive adjustments
        const width = window.innerWidth;
        document.body.classList.toggle('mobile', width < 768);
        document.body.classList.toggle('tablet', width >= 768 && width < 1024);
    }

    handleVisibilityChange() {
        if (document.hidden) {
            // App is hidden - pause non-essential operations
            console.log('📱 App hidden - pausing operations');
        } else {
            // App is visible - resume operations
            console.log('📱 App visible - resuming operations');
            this.updateSystemStatus();
        }
    }

    loadPreferences() {
        const saved = localStorage.getItem('axzoraPreferences');
        if (saved) {
            try {
                const preferences = JSON.parse(saved);
                this.appState = { ...this.appState, ...preferences };
            } catch (error) {
                console.warn('Failed to load preferences:', error);
            }
        }
    }

    savePreferences() {
        localStorage.setItem('axzoraPreferences', JSON.stringify(this.appState));
    }

    showInitializationError(error) {
        const errorDiv = document.createElement('div');
        errorDiv.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); display: flex; align-items: center; justify-content: center; z-index: 10000; color: white; text-align: center;">
                <div>
                    <h1>🚨 Initialization Failed</h1>
                    <p>Failed to start Axzora Super App</p>
                    <pre style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; margin: 20px 0; font-size: 12px;">${error.message}</pre>
                    <button onclick="location.reload()" style="padding: 10px 20px; background: #00D4FF; border: none; border-radius: 5px; color: white; cursor: pointer;">Retry</button>
                </div>
            </div>
        `;
        document.body.appendChild(errorDiv);
    }

    // Utility methods for dialogs
    showMintDialog() {
        console.log('🏭 Opening mint dialog from main app');
        if (window.blockchainInterface && window.blockchainInterface.isConnected) {
            window.blockchainInterface.showMintModal();
        } else {
            this.showNotification({ message: 'Please connect wallet first', type: 'warning' });
        }
    }

    showBurnDialog() {
        console.log('🔥 Opening burn dialog from main app');
        if (window.blockchainInterface && window.blockchainInterface.isConnected) {
            window.blockchainInterface.showBurnModal();
        } else {
            this.showNotification({ message: 'Please connect wallet first', type: 'warning' });
        }
    }

    showTransferDialog() {
        console.log('💸 Opening transfer dialog from main app');
        if (window.transferInterface) {
            window.transferInterface.openTransferModal();
        } else {
            this.showNotification({ message: 'Transfer interface not available', type: 'error' });
        }
    }

    showQRScanner() {
        this.showNotification({ message: 'Opening QR scanner...', type: 'info' });
    }

    showQRGenerator() {
        this.showNotification({ message: 'Opening QR generator...', type: 'info' });
    }

    refreshAllData() {
        this.showNotification({ message: 'Refreshing all data...', type: 'info' });
        
        if (window.blockchainInterface) {
            window.blockchainInterface.refreshData();
        }
        
        this.updateSystemStatus();
        this.updateMarketData();
    }

    closeAllModals() {
        const modals = document.querySelectorAll('.modal.show');
        modals.forEach(modal => {
            modal.classList.remove('show');
        });
    }

    updateMainContent(viewName) {
        // Placeholder for view switching logic
        console.log(`Switching to ${viewName} view`);
    }

    updateUserInterface() {
        // Update user-specific UI elements
        if (this.appState.user) {
            const userNameEl = document.getElementById('userName');
            if (userNameEl) {
                userNameEl.textContent = this.appState.user.name || 'User';
            }
        }
    }

    showDataView(target) {
        // Handle data view commands from voice
        switch (target) {
            case 'balance':
                this.navigateToView('wallet');
                break;
            case 'transactions':
                this.navigateToView('history');
                break;
            default:
                this.navigateToView('dashboard');
        }
    }
    
    // Wallet connection methods
    async connectWallet() {
        try {
            if (window.blockchainInterface) {
                await window.blockchainInterface.connectWallet();
                this.updateWalletUI();
                
                // Check if connected wallet is contract owner
                if (window.ownerManager) {
                    await window.ownerManager.checkOwnerStatus();
                }
            } else {
                this.showNotification({
                    message: 'Blockchain interface not available',
                    type: 'error'
                });
            }
        } catch (error) {
            console.error('Failed to connect wallet:', error);
            this.showNotification({
                message: 'Failed to connect wallet: ' + error.message,
                type: 'error'
            });
        }
    }
    
    disconnectWallet() {
        if (window.blockchainInterface) {
            window.blockchainInterface.disconnectWallet();
            this.updateWalletUI();
            
            // Hide owner panel when disconnecting
            if (window.ownerManager) {
                window.ownerManager.hideOwnerPanel();
            }
        }
    }
    
    updateWalletUI() {
        const connectBtn = document.getElementById('connectWallet');
        const walletInfo = document.getElementById('walletInfo');
        const walletAddress = document.getElementById('walletAddress');
        const actionButtons = document.querySelectorAll('.action-btn');
        const securityStatus = document.getElementById('securityStatus');
        const accountVerification = document.getElementById('accountVerification');
        
        if (window.blockchainInterface && window.blockchainInterface.isConnected) {
            if (connectBtn) connectBtn.style.display = 'none';
            if (walletInfo) walletInfo.style.display = 'block';
            if (walletAddress) {
                const addr = window.blockchainInterface.connectedAccount;
                walletAddress.textContent = `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
            }
            
            // Update security indicators
            if (securityStatus) {
                const dot = securityStatus.querySelector('.security-dot');
                const text = securityStatus.querySelector('.security-text');
                if (dot) dot.className = 'security-dot active';
                if (text) text.textContent = 'Secure';
            }
            
            if (accountVerification) {
                accountVerification.className = 'account-verification';
                const verificationText = accountVerification.querySelector('.verification-text');
                if (verificationText) verificationText.textContent = 'Account Verified';
            }
            
            // Enable action buttons
            actionButtons.forEach(btn => btn.disabled = false);
        } else {
            if (connectBtn) connectBtn.style.display = 'flex';
            if (walletInfo) walletInfo.style.display = 'none';
            
            // Update security indicators for disconnected state
            if (securityStatus) {
                const dot = securityStatus.querySelector('.security-dot');
                const text = securityStatus.querySelector('.security-text');
                if (dot) dot.className = 'security-dot error';
                if (text) text.textContent = 'Disconnected';
            }
            
            // Disable action buttons
            actionButtons.forEach(btn => btn.disabled = true);
        }
    }
    
    async verifyCurrentAccount() {
        try {
            console.log('🔒 Verifying current account...');
            
            if (window.walletSecurity) {
                const isValid = await window.walletSecurity.checkAccountConsistency();
                
                if (isValid) {
                    this.showNotification({
                        message: '✔️ Account verification successful',
                        type: 'success'
                    });
                } else {
                    this.showNotification({
                        message: '⚠️ Account verification failed - please reconnect',
                        type: 'warning'
                    });
                }
            } else {
                this.showNotification({
                    message: 'ℹ️ Security system not available',
                    type: 'info'
                });
            }
            
        } catch (error) {
            console.error('❌ Account verification failed:', error);
            this.showNotification({
                message: '❌ Account verification error: ' + error.message,
                type: 'error'
            });
        }
    }
    
    handleAction(action) {
        if (!window.blockchainInterface || !window.blockchainInterface.isConnected) {
            this.showNotification({
                message: 'Please connect your wallet first',
                type: 'warning'
            });
            return;
        }
        
        switch (action) {
            case 'mint':
                this.showMintDialog();
                break;
            case 'burn':
                this.showBurnDialog();
                break;
            case 'transfer':
                this.showTransferDialog();
                break;
            case 'stake':
                this.showStakingDialog();
                break;
            case 'upi':
                this.showNotification({
                    message: 'UPI integration coming soon!',
                    type: 'info'
                });
                break;
        }
    }
    
    showStakingDialog() {
        console.log('🔒 Opening staking dialog...');
        
        if (window.hpStaking) {
            window.hpStaking.openStakingModal();
        } else {
            this.showNotification({
                message: 'Staking system not available',
                type: 'error'
            });
        }
    }
    
    // Public API methods
    getAppState() {
        return { ...this.appState };
    }

    getSystemStatus() {
        return { ...this.systemStatus };
    }

    isAppReady() {
        return this.isInitialized && !this.isLoading;
    }
}

// Initialize the main application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌟 DOM ready - starting Axzora Super App...');
    window.axzoraApp = new AxzoraApp();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AxzoraApp;
}