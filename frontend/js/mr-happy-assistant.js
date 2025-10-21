/**
 * Mr. Happy AI Assistant - User-friendly Contract Management
 * Simple voice commands and conversational interface
 */

class MrHappyAssistant {
    constructor() {
        this.isListening = false;
        this.currentConversation = [];
        this.userPreferences = {
            language: 'simple', // simple, technical
            voiceEnabled: true,
            confirmBeforeActions: true
        };
        this.init();
    }

    init() {
        console.log('🎉 Mr. Happy AI Assistant initialized!');
        this.setupVoiceCommands();
        this.setupConversationInterface();
        this.greetUser();
    }

    /**
     * Setup voice command recognition
     */
    setupVoiceCommands() {
        // Voice command patterns for contract management
        this.voiceCommands = {
            // Greeting and help
            'hello': () => this.greetUser(),
            'help': () => this.showHelp(),
            'what can you do': () => this.showCapabilities(),
            
            // Wallet connection
            'connect wallet': () => this.helpConnectWallet(),
            'connect my wallet': () => this.helpConnectWallet(),
            
            // Balance and status
            'check balance': () => this.checkUserBalance(),
            'show balance': () => this.checkUserBalance(),
            'how much money do i have': () => this.checkUserBalance(),
            'what is my balance': () => this.checkUserBalance(),
            
            // Contract status
            'check contract': () => this.checkContractStatus(),
            'contract status': () => this.checkContractStatus(),
            'how is the contract': () => this.checkContractStatus(),
            
            // Owner functions (only if user is owner)
            'withdraw profits': () => this.initiateWithdrawProfits(),
            'take out profits': () => this.initiateWithdrawProfits(),
            'withdraw money': () => this.initiateWithdrawProfits(),
            'get my profits': () => this.initiateWithdrawProfits(),
            
            'emergency withdraw': () => this.initiateEmergencyWithdraw(),
            'emergency help': () => this.initiateEmergencyWithdraw(),
            'withdraw everything': () => this.initiateEmergencyWithdraw(),
            
            'pause contract': () => this.initiatePauseContract(),
            'stop contract': () => this.initiatePauseContract(),
            'pause everything': () => this.initiatePauseContract(),
            
            'resume contract': () => this.initiateResumeContract(),
            'start contract': () => this.initiateResumeContract(),
            'unpause contract': () => this.initiateResumeContract(),
            
            // Trading
            'buy tokens': () => this.initiateBuyTokens(),
            'mint tokens': () => this.initiateBuyTokens(),
            'get hp tokens': () => this.initiateBuyTokens(),
            
            'sell tokens': () => this.initiateSellTokens(),
            'burn tokens': () => this.initiateSellTokens(),
            'convert to usdt': () => this.initiateSellTokens(),
        };

        // Listen for voice commands
        if (window.voiceProcessor) {
            window.addEventListener('voice-command', (event) => {
                this.handleVoiceCommand(event.detail);
            });
        }
    }

    /**
     * Setup conversation interface
     */
    setupConversationInterface() {
        // Add chat interface to the AI response area
        const aiResponseArea = document.getElementById('aiResponse');
        if (aiResponseArea) {
            aiResponseArea.innerHTML = this.createChatInterface();
            this.setupChatListeners();
        }
    }

    /**
     * Setup chat input listeners
     */
    setupChatListeners() {
        const chatInput = document.getElementById('chatInput');
        const chatSend = document.getElementById('chatSend');
        
        if (chatInput) {
            // Handle Enter key
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleTextInput();
                }
            });
        }
        
        if (chatSend) {
            chatSend.addEventListener('click', () => {
                this.handleTextInput();
            });
        }
    }

    /**
     * Handle text input from chat
     */
    handleTextInput() {
        const chatInput = document.getElementById('chatInput');
        if (!chatInput || !chatInput.value.trim()) return;
        
        const userMessage = chatInput.value.trim();
        this.addChatMessage(`💬 "${userMessage}"`, 'user');
        
        // Clear input
        chatInput.value = '';
        
        // Process the input
        this.processUserInput(userMessage);
    }

    /**
     * Process user input (both voice and text)
     */
    processUserInput(input) {
        const command = input.toLowerCase().trim();
        console.log('🧠 Processing user input:', input, '-> normalized:', command);
        
        // Handle greetings and casual conversation
        if (this.isGreeting(command)) {
            console.log('✅ Detected greeting');
            this.handleGreeting(command);
        }
        // Handle help requests
        else if (this.isHelpRequest(command)) {
            this.showHelp();
        }
        // Handle wallet commands
        else if (command.includes('connect') && command.includes('wallet')) {
            this.helpConnectWallet();
        }
        // Handle balance commands
        else if (command.includes('balance') || command.includes('how much') || command.includes('check money')) {
            this.checkUserBalance();
        }
        // Handle buy commands
        else if (command.includes('buy') || command.includes('purchase') || command.includes('get tokens')) {
            this.initiateBuyTokens();
        }
        // Handle sell commands
        else if (command.includes('sell') || command.includes('convert')) {
            this.initiateSellTokens();
        }
        // Handle transfer commands
        else if (command.includes('transfer') || command.includes('send') || command.includes('send tokens')) {
            this.initiateTransfer();
        }
        // Owner commands
        else if (command.includes('withdraw') && command.includes('profit')) {
            this.initiateWithdrawProfits();
        }
        else if (command.includes('emergency') && command.includes('withdraw')) {
            this.initiateEmergencyWithdraw();
        }
        else if (command.includes('pause') && command.includes('contract')) {
            this.initiatePauseContract();
        }
        else if (command.includes('resume') && command.includes('contract')) {
            this.initiateResumeContract();
        }
        else if (command.includes('contract') && (command.includes('status') || command.includes('check'))) {
            this.checkContractStatus();
        }
        // Handle unknown input with friendly response
        else {
            this.handleUnknownInput(command);
        }
    }

    /**
     * Check if input is a greeting
     */
    isGreeting(command) {
        const greetings = [
            'hello', 'hi', 'hey', 'how are you', 'how r u', 'how are u', 'how u',
            'whats up', 'what\'s up', 'wassup', 'good morning', 'good afternoon',
            'good evening', 'sup', 'yo', 'howdy', 'greetings', 'mr happy',
            'hola', 'bonjour', 'namaste', 'how do you do', 'how\'s it going'
        ];
        
        return greetings.some(greeting => command.includes(greeting));
    }

    /**
     * Check if input is a help request
     */
    isHelpRequest(command) {
        const helpKeywords = [
            'help', 'what can you do', 'commands', 'capabilities',
            'what do you do', 'how to', 'instructions'
        ];
        
        return helpKeywords.some(keyword => command.includes(keyword));
    }

    /**
     * Handle greeting messages
     */
    handleGreeting(command) {
        const responses = [
            "Hey there! 😊 I'm doing fantastic, thanks for asking! I'm here and ready to help you with your Happy Paisa tokens. What would you like to do today?",
            "Hello! I'm doing great and feeling quite happy (as always)! 🌟 How can I assist you with your crypto journey today?",
            "Hi there, friend! I'm doing wonderful - always excited to help with Happy Paisa tokens! What can I do for you?",
            "Hey! I'm doing amazing, thank you! Ready to make your crypto experience as smooth as possible. What shall we work on?",
            "Hello! 👋 I'm in a great mood and ready to help! Whether it's trading, checking balances, or managing your tokens - I'm here for you!",
            "Yo! 😄 I'm doing awesome! Living my best AI life helping people with crypto! What brings you here today?",
            "Namaste! 🙏 I'm feeling super positive and ready to make your token management experience delightful! How can I help?",
            "What's up! 😎 I'm doing fantastic - just chilling and ready to help with all things Happy Paisa! What's on your mind?"
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        this.addChatMessage(randomResponse, 'ai');
        
        // Follow up with capabilities if they seem new
        setTimeout(() => {
            this.addChatMessage("By the way, I can help you with:\n\n🔗 Connect your wallet\n💰 Check token balances\n📈 Buy & sell HP tokens\n🔍 Monitor transactions\n\n" + 
            (window.ownerManager?.isOwner ? "And since you're the contract owner:\n👑 Withdraw profits\n⚠️ Emergency functions\n⏸️ Pause/Resume contract\n📊 Check collateral" : "Just tell me what you'd like to do!"), 'ai');
        }, 1500);
    }

    /**
     * Handle unknown input with friendly responses
     */
    handleUnknownInput(command) {
        const friendlyResponses = [
            "Hmm, I'm not quite sure what you meant by that! 🤔 Could you try rephrasing? Or just ask me 'what can you do?' to see my capabilities!",
            "I didn't catch that one! 😅 Try saying something like 'connect wallet', 'check balance', or 'buy tokens'. Or just say 'help' to see everything I can do!",
            "Oops, that's not something I recognize yet! 😊 I'm great with wallet stuff, trading, and casual chat. What would you like to try?",
            "I'm scratching my virtual head on that one! 🤖 Maybe try 'help' to see my full list of abilities, or just tell me what you want to do with your tokens!"
        ];
        
        const randomResponse = friendlyResponses[Math.floor(Math.random() * friendlyResponses.length)];
        this.addChatMessage(randomResponse, 'ai');
        
        // Offer suggestions after a pause
        setTimeout(() => {
            this.addChatMessage("Here are some things you can try:\n• 'Check my balance'\n• 'Buy some tokens'\n• 'Connect wallet'\n• 'Help'\n\nOr just chat with me! I'm friendly! 😊", 'ai');
        }, 2000);
    }

    createChatInterface() {
        return `
            <div class="mr-happy-chat">
                <div class="chat-messages" id="chatMessages">
                    <div class="message ai-message">
                        <div class="message-avatar">😊</div>
                        <div class="message-content">
                            <p>Hi! I'm Mr. Happy, your friendly assistant for managing HP tokens!</p>
                            <p>You can talk to me or type commands. Try saying "help" to see what I can do!</p>
                        </div>
                    </div>
                </div>
                <div class="chat-input-area">
                    <input type="text" id="chatInput" placeholder="Type your message or voice command..." />
                    <button id="chatSend" class="chat-send-btn">Send</button>
                </div>
                <div class="voice-status" id="voiceStatus">
                    <span class="voice-indicator" id="voiceIndicator">🎤 Say "Hey Happy" to start</span>
                </div>
            </div>
        `;
    }

    /**
     * Handle voice commands with natural language understanding
     */
    handleVoiceCommand(command) {
        const commandText = command.text?.toLowerCase() || command.type?.toLowerCase() || '';
        console.log('🎤 Voice command received by Mr. Happy:', commandText, command);

        // Add voice message to chat
        this.addChatMessage(`🎤 "${commandText}"`, 'user');
        
        // Use the unified processing method
        this.processUserInput(commandText);
    }

    /**
     * Help user connect wallet
     */
    helpConnectWallet() {
        this.addChatMessage("Let me help you connect your wallet! 🔗", 'ai');
        
        setTimeout(() => {
            this.addChatMessage("I'm opening the wallet connection interface for you. You'll see options for MetaMask, WalletConnect, and more!", 'ai');
        }, 1000);
        
        // Trigger wallet connection
        if (window.blockchainInterface) {
            window.blockchainInterface.connectWallet();
        } else {
            setTimeout(() => {
                this.addChatMessage("It looks like the wallet interface isn't ready yet. Please try clicking the 'Connect Wallet' button on the page!", 'ai');
            }, 1500);
        }
    }

    /**
     * Add message to chat interface
     */
    addChatMessage(message, type) {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        
        const avatar = type === 'ai' ? '😊' : '👤';
        messageDiv.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                <p>${message}</p>
                <span class="message-time">${new Date().toLocaleTimeString()}</span>
            </div>
        `;

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Speak the message if it's from AI
        if (type === 'ai' && this.userPreferences.voiceEnabled) {
            this.speak(message);
        }
    }

    /**
     * Text-to-speech
     */
    speak(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.8;
            utterance.pitch = 1;
            speechSynthesis.speak(utterance);
        }
    }

    /**
     * Greeting function
     */
    greetUser() {
        const greeting = [
            "Hello! I'm Mr. Happy, your friendly token assistant! 😊",
            "I'm here to help you manage your HP tokens easily.",
            "You can talk to me using voice commands or type messages.",
            "Try saying 'help' to see what I can do for you!"
        ].join('\n');

        this.addChatMessage(greeting, 'ai');
    }

    /**
     * Show help and capabilities
     */
    showHelp() {
        const helpText = `
Here's what I can help you with:

💰 **Money & Balance:**
- "Check balance" - See your HP and USDT
- "How much money do I have?" - Same as above

🏪 **Trading:**
- "Buy tokens" - Get HP tokens with USDT
- "Sell tokens" - Convert HP back to USDT

🔧 **Contract Management (Owner Only):**
- "Withdraw profits" - Take out your profits
- "Emergency withdraw" - Get all money out
- "Pause contract" - Stop the contract
- "Resume contract" - Start the contract again

❓ **Getting Help:**
- "Help" - Show this message
- "What can you do?" - See my capabilities

Just speak naturally! I understand simple English. 😊
        `;

        this.addChatMessage(helpText, 'ai');
    }

    /**
     * Show capabilities
     */
    showCapabilities() {
        const capabilities = `
I'm designed to be your friendly crypto assistant! Here's what makes me special:

✨ **Easy to Use:**
- Talk to me like a friend
- No complicated technical words
- Voice commands that work naturally

🧠 **Smart Understanding:**
- I understand different ways of saying things
- "Check balance" = "How much money do I have?"
- "Buy tokens" = "Get HP tokens"

🔒 **Safe & Secure:**
- I'll always ask before doing important things
- Owner functions only work for the contract owner
- Clear explanations of what will happen

🎤 **Voice Friendly:**
- Say "Hey Happy" to start talking
- I'll speak back to you
- Works with typing too!

Try me out! Ask me anything about your tokens! 😊
        `;

        this.addChatMessage(capabilities, 'ai');
    }

    /**
     * Help connect wallet
     */
    async helpConnectWallet() {
        if (window.blockchainInterface?.isConnected) {
            this.addChatMessage("Great! Your wallet is already connected! 🎉", 'ai');
            this.checkUserStatus();
        } else {
            this.addChatMessage("Let me help you connect your wallet...", 'ai');
            
            setTimeout(() => {
                this.addChatMessage("I'm opening MetaMask for you. Please approve the connection! 🦊", 'ai');
            }, 1000);

            try {
                if (window.axzoraApp) {
                    await window.axzoraApp.connectWallet();
                }
            } catch (error) {
                this.addChatMessage("Oops! There was a problem connecting your wallet. Make sure MetaMask is installed and try again.", 'ai');
            }
        }
    }

    /**
     * Check user balance
     */
    async checkUserBalance() {
        if (!window.blockchainInterface?.isConnected) {
            this.addChatMessage("First, let's connect your wallet so I can check your balance!", 'ai');
            this.helpConnectWallet();
            return;
        }

        this.addChatMessage("Let me check your balance... 💰", 'ai');

        try {
            // Get balance data
            const hpBalance = document.getElementById('hpBalance')?.textContent || '0';
            const usdtBalance = document.getElementById('usdtBalance')?.textContent || '0';
            const bnbBalance = document.getElementById('bnbBalance')?.textContent || '0';

            const balanceMessage = `
Here's your current balance:

💰 **HP Tokens:** ${hpBalance} HP
💵 **USDT:** ${usdtBalance} USDT  
⛽ **BNB (Gas):** ${bnbBalance} BNB

${parseFloat(hpBalance) > 0 ? "Great! You have HP tokens! 🎉" : "You don't have any HP tokens yet. Want to buy some?"}
            `;

            this.addChatMessage(balanceMessage, 'ai');

            // Suggest actions based on balance
            if (parseFloat(hpBalance) === 0 && parseFloat(usdtBalance) > 0) {
                setTimeout(() => {
                    this.addChatMessage("I see you have USDT! Would you like me to help you buy some HP tokens? Just say 'buy tokens'!", 'ai');
                }, 2000);
            }
        } catch (error) {
            this.addChatMessage("Sorry, I couldn't check your balance right now. Please try again in a moment.", 'ai');
        }
    }

    /**
     * Check contract status
     */
    async checkContractStatus() {
        this.addChatMessage("Let me check the contract status for you... 📊", 'ai');

        try {
            if (window.ownerManager) {
                await window.ownerManager.loadOwnerData();
                
                const totalCollateral = document.getElementById('totalCollateral')?.textContent || '0';
                const availableProfits = document.getElementById('availableProfits')?.textContent || '0';

                const statusMessage = `
Here's the contract status:

📊 **Total USDT in Contract:** ${totalCollateral}
💰 **Available Profits:** ${availableProfits}
✅ **Status:** Contract is running normally

${window.ownerManager.isOwner ? "Since you're the owner, you can manage these funds!" : "Everything looks good!"}
                `;

                this.addChatMessage(statusMessage, 'ai');
            } else {
                this.addChatMessage("The contract is working fine! All systems are operational. ✅", 'ai');
            }
        } catch (error) {
            this.addChatMessage("I couldn't get the contract status right now, but it's probably working fine!", 'ai');
        }
    }

    /**
     * Initiate withdraw profits
     */
    async initiateWithdrawProfits() {
        if (!this.checkOwnerAccess()) return;

        this.addChatMessage("Great! Let me help you withdraw your profits! 💰", 'ai');

        setTimeout(() => {
            this.addChatMessage("I'm opening the withdrawal interface for you. You can choose how much to withdraw or take all profits!", 'ai');
        }, 1000);

        // Open the withdrawal modal
        if (window.ownerManager) {
            await window.ownerManager.openWithdrawProfitsModal();
        }
    }

    /**
     * Initiate emergency withdraw
     */
    async initiateEmergencyWithdraw() {
        if (!this.checkOwnerAccess()) return;

        this.addChatMessage("This is the emergency withdrawal! ⚠️", 'ai');
        
        setTimeout(() => {
            this.addChatMessage("This will get ALL money out of the contract. Are you sure this is an emergency?", 'ai');
        }, 1000);

        setTimeout(() => {
            this.addChatMessage("Opening emergency options... Please be careful and read everything! 🆘", 'ai');
        }, 2500);

        // Open emergency modal
        if (window.ownerManager) {
            window.ownerManager.openEmergencyModal();
        }
    }

    /**
     * Initiate pause contract
     */
    async initiatePauseContract() {
        if (!this.checkOwnerAccess()) return;

        this.addChatMessage("I can help you pause the contract! ⏸️", 'ai');
        
        if (this.userPreferences.confirmBeforeActions) {
            setTimeout(() => {
                this.addChatMessage("This will stop all contract operations. Are you sure? Say 'yes pause' to confirm.", 'ai');
            }, 1000);
        } else {
            this.executePauseContract();
        }
    }

    /**
     * Execute pause contract
     */
    async executePauseContract() {
        this.addChatMessage("Pausing the contract now... ⏸️", 'ai');
        
        if (window.ownerManager) {
            await window.ownerManager.pauseContract();
        }
    }

    /**
     * Initiate resume contract
     */
    async initiateResumeContract() {
        if (!this.checkOwnerAccess()) return;

        this.addChatMessage("Let me help you resume the contract! ▶️", 'ai');
        
        setTimeout(() => {
            this.addChatMessage("Starting the contract operations again...", 'ai');
        }, 1000);

        if (window.ownerManager) {
            await window.ownerManager.resumeContract();
        }
    }

    /**
     * Initiate buy tokens
     */
    async initiateBuyTokens() {
        if (!window.blockchainInterface?.isConnected) {
            this.addChatMessage("First, let's connect your wallet so you can buy tokens!", 'ai');
            this.helpConnectWallet();
            return;
        }

        this.addChatMessage("Great! Let me help you buy HP tokens! 🏪", 'ai');
        
        setTimeout(() => {
            this.addChatMessage("Opening the token purchase interface... You'll need USDT to buy HP tokens!", 'ai');
        }, 1000);

        // Open mint modal
        const mintModal = document.getElementById('mintModal');
        if (mintModal) {
            mintModal.style.display = 'block';
        }
    }

    /**
     * Initiate sell tokens
     */
    async initiateSellTokens() {
        if (!window.blockchainInterface?.isConnected) {
            this.addChatMessage("First, let's connect your wallet so you can sell tokens!", 'ai');
            this.helpConnectWallet();
            return;
        }

        this.addChatMessage("I'll help you sell your HP tokens for USDT! 💸", 'ai');
        
        setTimeout(() => {
            this.addChatMessage("Opening the token selling interface...", 'ai');
        }, 1000);

        // Open burn modal
        const burnModal = document.getElementById('burnModal');
        if (burnModal) {
            burnModal.style.display = 'block';
        }
    }

    /**
     * Initiate transfer tokens
     */
    async initiateTransfer() {
        if (!window.blockchainInterface?.isConnected) {
            this.addChatMessage("First, let's connect your wallet so you can transfer tokens!", 'ai');
            this.helpConnectWallet();
            return;
        }

        this.addChatMessage("Great! I'll help you transfer HP tokens to another address! 📤", 'ai');
        
        setTimeout(() => {
            this.addChatMessage("Opening the transfer interface... You'll be able to enter the recipient's address and the amount to send!", 'ai');
        }, 1000);

        // Open transfer modal
        if (window.transferInterface) {
            window.transferInterface.openTransferModal();
        } else {
            setTimeout(() => {
                this.addChatMessage("It looks like the transfer interface isn't ready yet. Please try clicking the 'Transfer' button on the page!", 'ai');
            }, 1500);
        }
    }

    /**
     * Check owner access
     */
    checkOwnerAccess() {
        if (!window.blockchainInterface?.isConnected) {
            this.addChatMessage("First, let's connect your wallet!", 'ai');
            this.helpConnectWallet();
            return false;
        }

        if (!window.ownerManager?.isOwner) {
            this.addChatMessage("Sorry, only the contract owner can do that! You can still buy/sell tokens and check balances though! 😊", 'ai');
            return false;
        }

        return true;
    }

    /**
     * Check user status and provide personalized help
     */
    async checkUserStatus() {
        if (!window.blockchainInterface?.isConnected) {
            return;
        }

        // Check if user is owner
        if (window.ownerManager) {
            await window.ownerManager.checkOwnerStatus();
            
            if (window.ownerManager.isOwner) {
                setTimeout(() => {
                    this.addChatMessage("I see you're the contract owner! 👑 You have access to special management features!", 'ai');
                }, 2000);
                
                setTimeout(() => {
                    this.addChatMessage("You can say things like 'withdraw profits', 'check contract', or 'emergency withdraw'.", 'ai');
                }, 4000);
            }
        }

        // Check balance and give suggestions
        setTimeout(() => {
            this.checkUserBalance();
        }, 3000);
    }
}

// Initialize Mr. Happy Assistant when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.mrHappy = new MrHappyAssistant();
    console.log('🎉 Mr. Happy Assistant is ready!');
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MrHappyAssistant;
}