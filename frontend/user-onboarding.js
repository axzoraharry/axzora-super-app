/**
 * User Onboarding System - Interactive Tutorial and Welcome Experience
 * Guides new users through Happy Paisa Token application
 */

class UserOnboardingSystem {
    constructor() {
        this.currentStep = 0;
        this.isOnboardingActive = false;
        this.userProgress = {
            hasConnectedWallet: false,
            hasSeenBalances: false,
            hasUsedMrHappy: false,
            hasViewedFeatures: false,
            isCompleted: false
        };
        
        this.onboardingSteps = [
            {
                id: 'welcome',
                title: '🎉 Welcome to Happy Paisa Token!',
                description: 'Your gateway to secure, intelligent cryptocurrency management.',
                target: '.ai-avatar-container',
                position: 'bottom',
                content: this.createWelcomeContent(),
                action: () => this.showAppOverview()
            },
            {
                id: 'meet-mr-happy',
                title: '🤖 Meet Mr. Happy - Your AI Assistant',
                description: 'Your friendly AI companion who can help with everything!',
                target: '#mrHappyAvatar',
                position: 'right',
                content: this.createMrHappyIntro(),
                action: () => this.demonstrateMrHappy()
            },
            {
                id: 'connect-wallet',
                title: '🔗 Connect Your Wallet',
                description: 'Secure connection with MetaMask for BSC transactions.',
                target: '#connectWallet',
                position: 'left',
                content: this.createWalletGuide(),
                action: () => this.showWalletConnection()
            },
            {
                id: 'security-features',
                title: '🔒 Security First',
                description: 'Advanced real-time security monitoring keeps you safe.',
                target: '#securityStatus',
                position: 'bottom',
                content: this.createSecurityInfo(),
                action: () => this.explainSecurity()
            },
            {
                id: 'token-features',
                title: '💰 Token Management',
                description: 'Mint, burn, and transfer HP tokens with ease.',
                target: '.quick-actions',
                position: 'top',
                content: this.createTokenGuide(),
                action: () => this.showTokenFeatures()
            },
            {
                id: 'voice-features',
                title: '🎤 Voice Commands',
                description: 'Control everything with your voice - just say "Hey Happy"!',
                target: '#micButton',
                position: 'top',
                content: this.createVoiceGuide(),
                action: () => this.demonstrateVoice()
            },
            {
                id: 'completion',
                title: '🎊 Ready to Go!',
                description: 'You\'re all set up! Enjoy using Happy Paisa Token.',
                target: '.center-content',
                position: 'center',
                content: this.createCompletionContent(),
                action: () => this.completeOnboarding()
            }
        ];
        
        this.init();
    }

    init() {
        console.log('🎓 Initializing User Onboarding System...');
        this.createOnboardingElements();
        this.setupEventListeners();
        this.checkUserStatus();
    }

    checkUserStatus() {
        // Check if user has been here before
        const hasCompletedOnboarding = localStorage.getItem('hp-onboarding-completed');
        const lastVisit = localStorage.getItem('hp-last-visit');
        
        if (!hasCompletedOnboarding || this.isNewUser()) {
            setTimeout(() => {
                this.startOnboarding();
            }, 2000); // Start after app initialization
        } else {
            this.showWelcomeBackMessage();
        }
    }

    isNewUser() {
        const visits = parseInt(localStorage.getItem('hp-visit-count') || '0');
        return visits < 3;
    }

    startOnboarding() {
        console.log('🎓 Starting user onboarding...');
        this.isOnboardingActive = true;
        this.currentStep = 0;
        
        // Show welcome overlay
        this.showOnboardingOverlay();
        
        // Start first step
        this.showStep(0);
        
        // Track onboarding start
        this.trackEvent('onboarding_started');
    }

    showStep(stepIndex) {
        if (stepIndex >= this.onboardingSteps.length) {
            this.completeOnboarding();
            return;
        }

        const step = this.onboardingSteps[stepIndex];
        this.currentStep = stepIndex;
        
        console.log(`🎓 Showing step ${stepIndex + 1}: ${step.title}`);
        
        // Hide previous tooltip
        this.hideTooltip();
        
        // Show new tooltip
        setTimeout(() => {
            this.showTooltip(step);
        }, 300);
        
        // Execute step action
        if (step.action) {
            step.action();
        }
    }

    showTooltip(step) {
        const tooltip = document.getElementById('onboarding-tooltip');
        const target = document.querySelector(step.target);
        
        if (!target || !tooltip) return;
        
        // Update tooltip content
        tooltip.innerHTML = `
            <div class="tooltip-header">
                <h3>${step.title}</h3>
                <button class="tooltip-close" onclick="window.onboarding?.skipOnboarding()">×</button>
            </div>
            <div class="tooltip-body">
                <p class="tooltip-description">${step.description}</p>
                ${step.content}
            </div>
            <div class="tooltip-footer">
                <div class="step-progress">
                    <span class="step-current">${this.currentStep + 1}</span>
                    <span class="step-separator">of</span>
                    <span class="step-total">${this.onboardingSteps.length}</span>
                </div>
                <div class="tooltip-actions">
                    ${this.currentStep > 0 ? '<button class="btn-secondary" onclick="window.onboarding?.previousStep()">Previous</button>' : ''}
                    <button class="btn-primary" onclick="window.onboarding?.nextStep()">${this.currentStep === this.onboardingSteps.length - 1 ? 'Finish' : 'Next'}</button>
                </div>
            </div>
        `;
        
        // Position tooltip
        this.positionTooltip(tooltip, target, step.position);
        
        // Show tooltip
        tooltip.classList.add('visible');
        
        // Highlight target
        this.highlightElement(target);
    }

    positionTooltip(tooltip, target, position) {
        const targetRect = target.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        
        let top, left;
        
        switch (position) {
            case 'top':
                top = targetRect.top - tooltipRect.height - 10;
                left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
                break;
            case 'bottom':
                top = targetRect.bottom + 10;
                left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
                break;
            case 'left':
                top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
                left = targetRect.left - tooltipRect.width - 10;
                break;
            case 'right':
                top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
                left = targetRect.right + 10;
                break;
            case 'center':
                top = window.innerHeight / 2 - tooltipRect.height / 2;
                left = window.innerWidth / 2 - tooltipRect.width / 2;
                break;
        }
        
        // Ensure tooltip stays in viewport
        top = Math.max(10, Math.min(top, window.innerHeight - tooltipRect.height - 10));
        left = Math.max(10, Math.min(left, window.innerWidth - tooltipRect.width - 10));
        
        tooltip.style.top = `${top + window.scrollY}px`;
        tooltip.style.left = `${left + window.scrollX}px`;
    }

    highlightElement(element) {
        // Remove previous highlights
        document.querySelectorAll('.onboarding-highlight').forEach(el => {
            el.classList.remove('onboarding-highlight');
        });
        
        // Add highlight to current element
        element.classList.add('onboarding-highlight');
    }

    hideTooltip() {
        const tooltip = document.getElementById('onboarding-tooltip');
        if (tooltip) {
            tooltip.classList.remove('visible');
        }
        
        // Remove highlights
        document.querySelectorAll('.onboarding-highlight').forEach(el => {
            el.classList.remove('onboarding-highlight');
        });
    }

    nextStep() {
        this.showStep(this.currentStep + 1);
    }

    previousStep() {
        if (this.currentStep > 0) {
            this.showStep(this.currentStep - 1);
        }
    }

    skipOnboarding() {
        if (confirm('Are you sure you want to skip the tutorial? You can restart it anytime from the help menu.')) {
            this.completeOnboarding();
        }
    }

    completeOnboarding() {
        console.log('🎉 Onboarding completed!');
        
        this.isOnboardingActive = false;
        this.hideTooltip();
        this.hideOnboardingOverlay();
        
        // Mark as completed
        localStorage.setItem('hp-onboarding-completed', 'true');
        localStorage.setItem('hp-onboarding-date', new Date().toISOString());
        
        // Show completion message
        this.showCompletionCelebration();
        
        // Track completion
        this.trackEvent('onboarding_completed');
    }

    showCompletionCelebration() {
        // Create celebration modal
        const celebration = document.createElement('div');
        celebration.className = 'onboarding-celebration';
        celebration.innerHTML = `
            <div class="celebration-content">
                <div class="celebration-emoji">🎉</div>
                <h2>Welcome Aboard!</h2>
                <p>You're now ready to experience the full power of Happy Paisa Token!</p>
                <div class="celebration-features">
                    <div class="feature-highlight">
                        <span class="feature-icon">🔒</span>
                        <span>Secure Wallet Connection</span>
                    </div>
                    <div class="feature-highlight">
                        <span class="feature-icon">🤖</span>
                        <span>AI Assistant Ready</span>
                    </div>
                    <div class="feature-highlight">
                        <span class="feature-icon">💰</span>
                        <span>Token Management</span>
                    </div>
                </div>
                <button class="btn-primary celebration-close" onclick="this.parentElement.parentElement.remove()">
                    Let's Get Started! 🚀
                </button>
            </div>
        `;
        
        document.body.appendChild(celebration);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (celebration.parentElement) {
                celebration.remove();
            }
        }, 5000);
    }

    // Content creation methods
    createWelcomeContent() {
        return `
            <div class="onboarding-welcome">
                <div class="welcome-features">
                    <div class="feature-item">
                        <span class="feature-icon">🔒</span>
                        <span class="feature-text">Bank-level Security</span>
                    </div>
                    <div class="feature-item">
                        <span class="feature-icon">🤖</span>
                        <span class="feature-text">AI-Powered Assistant</span>
                    </div>
                    <div class="feature-item">
                        <span class="feature-icon">🎤</span>
                        <span class="feature-text">Voice Commands</span>
                    </div>
                </div>
                <p>Let's take a quick tour to get you started!</p>
            </div>
        `;
    }

    createMrHappyIntro() {
        return `
            <div class="mr-happy-intro">
                <p>👋 Say hello to Mr. Happy! He can:</p>
                <ul>
                    <li>🗣️ Understand voice commands</li>
                    <li>💬 Chat with you naturally</li>
                    <li>🎯 Help with all app functions</li>
                    <li>🔍 Answer your questions</li>
                </ul>
                <p><strong>Try saying:</strong> "Hey Mr. Happy, how are you?"</p>
            </div>
        `;
    }

    createWalletGuide() {
        return `
            <div class="wallet-guide">
                <p>🔗 Connect your MetaMask wallet to start using HP tokens:</p>
                <ol>
                    <li>Click "Connect Wallet"</li>
                    <li>Choose MetaMask</li>
                    <li>Approve the connection</li>
                    <li>We'll auto-switch to BSC network</li>
                </ol>
                <div class="security-note">
                    <span class="security-icon">🛡️</span>
                    <span>Your security is our priority - we never store your private keys!</span>
                </div>
            </div>
        `;
    }

    createSecurityInfo() {
        return `
            <div class="security-info">
                <p>🔒 Your security features:</p>
                <div class="security-features">
                    <div class="security-feature">
                        <span class="feature-dot green"></span>
                        <span>Real-time account monitoring</span>
                    </div>
                    <div class="security-feature">
                        <span class="feature-dot green"></span>
                        <span>Instant mismatch detection</span>
                    </div>
                    <div class="security-feature">
                        <span class="feature-dot green"></span>
                        <span>Auto-disconnect protection</span>
                    </div>
                </div>
            </div>
        `;
    }

    createTokenGuide() {
        return `
            <div class="token-guide">
                <p>💰 Manage your HP tokens easily:</p>
                <div class="token-actions">
                    <div class="action-item">
                        <span class="action-icon">🪙</span>
                        <div>
                            <strong>Mint HP</strong>
                            <small>Buy HP tokens with USDT (1 HP = 11 USDT)</small>
                        </div>
                    </div>
                    <div class="action-item">
                        <span class="action-icon">🔥</span>
                        <div>
                            <strong>Burn HP</strong>
                            <small>Sell HP tokens back for USDT</small>
                        </div>
                    </div>
                    <div class="action-item">
                        <span class="action-icon">📤</span>
                        <div>
                            <strong>Transfer</strong>
                            <small>Send HP tokens to any BSC address</small>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createVoiceGuide() {
        return `
            <div class="voice-guide">
                <p>🎤 Control everything with your voice:</p>
                <div class="voice-commands">
                    <div class="command-example">
                        <span class="command-text">"Hey Happy, check my balance"</span>
                    </div>
                    <div class="command-example">
                        <span class="command-text">"Buy some tokens"</span>
                    </div>
                    <div class="command-example">
                        <span class="command-text">"Send tokens to address"</span>
                    </div>
                </div>
                <p><small>💡 Mr. Happy understands natural language!</small></p>
            </div>
        `;
    }

    createCompletionContent() {
        return `
            <div class="completion-content">
                <p>🎊 Congratulations! You're now ready to:</p>
                <div class="completion-checklist">
                    <div class="check-item">✅ Connect your wallet securely</div>
                    <div class="check-item">✅ Chat with Mr. Happy</div>
                    <div class="check-item">✅ Use voice commands</div>
                    <div class="check-item">✅ Manage HP tokens</div>
                    <div class="check-item">✅ Stay secure with real-time monitoring</div>
                </div>
                <p><strong>Need help?</strong> Just ask Mr. Happy or click the help button!</p>
            </div>
        `;
    }

    // Action methods
    showAppOverview() {
        if (window.mrHappy) {
            window.mrHappy.addChatMessage("Welcome to Happy Paisa Token! I'm Mr. Happy, and I'll be your guide today. 🎉", 'ai');
        }
    }

    demonstrateMrHappy() {
        if (window.mrHappy) {
            setTimeout(() => {
                window.mrHappy.addChatMessage("Hi there! 👋 I'm excited to help you with everything related to HP tokens. You can chat with me or use voice commands!", 'ai');
            }, 1000);
        }
    }

    showWalletConnection() {
        // Highlight the connect wallet button
        const connectBtn = document.getElementById('connectWallet');
        if (connectBtn) {
            connectBtn.classList.add('pulse-highlight');
        }
    }

    explainSecurity() {
        if (window.mrHappy) {
            window.mrHappy.addChatMessage("🔒 Security is our top priority! I constantly monitor your wallet connection to ensure you're always safe.", 'ai');
        }
    }

    showTokenFeatures() {
        // Highlight action buttons
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.classList.add('feature-highlight');
        });
    }

    demonstrateVoice() {
        const micButton = document.getElementById('micButton');
        if (micButton) {
            micButton.classList.add('pulse-highlight');
        }
        
        if (window.mrHappy) {
            window.mrHappy.addChatMessage("🎤 Try clicking the microphone and say 'Hey Happy, how are you?' - I'll respond with voice!", 'ai');
        }
    }

    // UI Creation
    createOnboardingElements() {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.id = 'onboarding-overlay';
        overlay.className = 'onboarding-overlay';
        document.body.appendChild(overlay);
        
        // Create tooltip
        const tooltip = document.createElement('div');
        tooltip.id = 'onboarding-tooltip';
        tooltip.className = 'onboarding-tooltip';
        document.body.appendChild(tooltip);
        
        console.log('🎓 Onboarding UI elements created');
    }

    showOnboardingOverlay() {
        const overlay = document.getElementById('onboarding-overlay');
        if (overlay) {
            overlay.classList.add('visible');
        }
    }

    hideOnboardingOverlay() {
        const overlay = document.getElementById('onboarding-overlay');
        if (overlay) {
            overlay.classList.remove('visible');
        }
    }

    setupEventListeners() {
        // Listen for wallet connections
        window.addEventListener('wallet-connected', () => {
            this.userProgress.hasConnectedWallet = true;
            if (this.currentStep === 2) { // wallet connection step
                setTimeout(() => this.nextStep(), 1500);
            }
        });
        
        // Listen for Mr. Happy interactions
        window.addEventListener('mr-happy-interaction', () => {
            this.userProgress.hasUsedMrHappy = true;
        });
        
        // Escape key to skip
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOnboardingActive) {
                this.skipOnboarding();
            }
        });
    }

    // Analytics
    trackEvent(eventName, data = {}) {
        console.log(`📊 Onboarding Event: ${eventName}`, data);
        // Here you could send to analytics service
    }

    showWelcomeBackMessage() {
        const visits = parseInt(localStorage.getItem('hp-visit-count') || '0') + 1;
        localStorage.setItem('hp-visit-count', visits.toString());
        localStorage.setItem('hp-last-visit', new Date().toISOString());
        
        setTimeout(() => {
            if (window.mrHappy) {
                const messages = [
                    "Welcome back! 😊 Great to see you again!",
                    "Hello again! 👋 Ready for some HP token action?",
                    "Hey there! 🎉 Welcome back to Happy Paisa Token!"
                ];
                const randomMessage = messages[Math.floor(Math.random() * messages.length)];
                window.mrHappy.addChatMessage(randomMessage, 'ai');
            }
        }, 3000);
    }

    // Public methods
    restartOnboarding() {
        localStorage.removeItem('hp-onboarding-completed');
        this.startOnboarding();
    }

    showQuickHelp() {
        const helpContent = `
            <div class="quick-help">
                <h3>🚀 Quick Help</h3>
                <div class="help-sections">
                    <div class="help-section">
                        <h4>🔗 Getting Started</h4>
                        <p>1. Connect your MetaMask wallet<br>
                        2. Switch to BSC network<br>
                        3. Start trading HP tokens!</p>
                    </div>
                    <div class="help-section">
                        <h4>🤖 Using Mr. Happy</h4>
                        <p>Chat or use voice commands:<br>
                        "Check balance", "Buy tokens", "Help"</p>
                    </div>
                    <div class="help-section">
                        <h4>🔒 Security</h4>
                        <p>Your wallet is monitored in real-time<br>
                        Green dot = secure, Red = check connection</p>
                    </div>
                </div>
            </div>
        `;
        
        if (window.mrHappy) {
            window.mrHappy.addChatMessage(helpContent, 'ai');
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.onboarding = new UserOnboardingSystem();
    initializeHelpMenu();
    console.log('🎓 User Onboarding System ready');
});

// Help Menu System
function initializeHelpMenu() {
    const helpMenuBtn = document.getElementById('helpMenuBtn');
    const helpMenuModal = document.getElementById('helpMenuModal');
    
    if (helpMenuBtn) {
        helpMenuBtn.addEventListener('click', openHelpMenu);
    }
    
    // Close help menu when clicking outside
    if (helpMenuModal) {
        helpMenuModal.addEventListener('click', (e) => {
            if (e.target === helpMenuModal) {
                closeHelpMenu();
            }
        });
    }
}

function openHelpMenu() {
    const modal = document.getElementById('helpMenuModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeHelpMenu() {
    const modal = document.getElementById('helpMenuModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

function startOnboardingTutorial() {
    closeHelpMenu();
    if (window.onboarding) {
        window.onboarding.restartOnboarding();
    }
}

function showQuickHelp() {
    closeHelpMenu();
    if (window.showNotification) {
        window.showNotification('💡 Quick Help', 'Voice Commands: "Hey Happy", "Check balance", "Send money". Biometric security is always active. Connect wallet to start trading!', 'info');
    } else if (window.mrHappy) {
        window.mrHappy.addChatMessage('💡 Quick Help: Voice Commands: "Hey Happy", "Check balance", "Send money". Biometric security is always active. Connect wallet to start trading!', 'ai');
    }
}

function showVoiceCommands() {
    closeHelpMenu();
    const commands = [
        '🎤 "Hey Happy" - Activate AI assistant',
        '💰 "Mint HP tokens" - Create new tokens',
        '📊 "Check balance" - View wallet balance',
        '💸 "Send money" - Transfer tokens',
        '⚙️ "System status" - View security status'
    ];
    
    const commandsText = commands.join('\n');
    
    if (window.showNotification) {
        window.showNotification('🎤 Voice Commands', commandsText.replace(/\n/g, '<br>'), 'info');
    } else if (window.mrHappy) {
        window.mrHappy.addChatMessage(`🎤 Voice Commands:\n${commandsText}`, 'ai');
    }
}

function showSecurityHelp() {
    closeHelpMenu();
    const securityInfo = '🛡️ Security Features: Biometric face detection monitors your identity continuously. Voice patterns are analyzed for authenticity. Wallet connections are secured with account verification. Your security level is displayed in real-time.';
    
    if (window.showNotification) {
        window.showNotification('🛡️ Security Features', securityInfo.replace('🛡️ Security Features: ', ''), 'info');
    } else if (window.mrHappy) {
        window.mrHappy.addChatMessage(securityInfo, 'ai');
    }
}

function showTokenHelp() {
    closeHelpMenu();
    const tokenInfo = '🪙 Token Management: Happy Paisa (HP) tokens are backed by USDT collateral. Mint new tokens by depositing USDT. Burn tokens to withdraw USDT. Transfer tokens to other wallets. Only contract owner can withdraw profits.';
    
    if (window.showNotification) {
        window.showNotification('🪙 Token Management', tokenInfo.replace('🪙 Token Management: ', ''), 'info');
    } else if (window.mrHappy) {
        window.mrHappy.addChatMessage(tokenInfo, 'ai');
    }
}

function contactSupport() {
    closeHelpMenu();
    const supportInfo = '📞 Support Contact: For technical support, please contact our team at support@happypaisa.com or visit our help center. Live chat support is available 24/7 for premium users.';
    
    if (window.showNotification) {
        window.showNotification('📞 Support Contact', supportInfo.replace('📞 Support Contact: ', ''), 'info');
    } else if (window.mrHappy) {
        window.mrHappy.addChatMessage(supportInfo, 'ai');
    }
}

// Export for global access
window.UserOnboardingSystem = UserOnboardingSystem;

// Global help functions
window.openHelpMenu = openHelpMenu;
window.closeHelpMenu = closeHelpMenu;
window.startOnboardingTutorial = startOnboardingTutorial;
window.showQuickHelp = showQuickHelp;
window.showVoiceCommands = showVoiceCommands;
window.showSecurityHelp = showSecurityHelp;
window.showTokenHelp = showTokenHelp;
window.contactSupport = contactSupport;
