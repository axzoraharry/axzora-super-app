/**
 * HP Token Staking Interface
 * 30-day lock period with 6% APR and $1000 maximum stake
 */

class HPTokenStaking {
    constructor() {
        this.stakingContract = null;
        this.userStakes = [];
        this.maxStakeValueUSD = 1000;
        this.hpPriceUSD = this.getHPPriceUSD();
        this.maxStakeHP = this.maxStakeValueUSD / this.hpPriceUSD; // ~86.58 HP
        this.stakingAPR = 0.06; // 6% APR
        this.lockPeriodDays = 30;
        this.dailyRewardRate = this.stakingAPR / 365; // Daily rate
        this.stakingData = this.loadStakingData();
        
        this.initializeStaking();
    }

    async initializeStaking() {
        console.log('🔒 Initializing HP Token Staking...');
        this.setupEventListeners();
        this.updateStakingInterface();
        
        // Load existing stakes from localStorage
        this.loadUserStakes();
        
        // Set initial available amounts
        this.updateAvailableStakingAmounts();
        
        // Update amounts when wallet connection changes
        window.addEventListener('wallet-connected', () => {
            console.log('🔗 Wallet connected - updating staking interface');
            setTimeout(() => {
                this.hpPriceUSD = this.getHPPriceUSD(); // Refresh price
                this.maxStakeHP = this.maxStakeValueUSD / this.hpPriceUSD; // Recalculate max stake
                this.updateAvailableStakingAmounts();
                this.updateStakingButtons();
            }, 1000);
        });
        
        window.addEventListener('wallet-disconnected', () => {
            console.log('🔗 Wallet disconnected - updating staking interface');
            this.updateAvailableStakingAmounts();
            this.updateStakingButtons();
        });
        
        // Listen for account changes
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                console.log('🔄 Accounts changed - updating staking interface');
                setTimeout(() => {
                    this.updateAvailableStakingAmounts();
                    this.updateStakingButtons();
                }, 500);
            });
        }
    }

    setupEventListeners() {
        // Staking amount input change
        const stakeAmountInput = document.getElementById('stakeAmount');
        if (stakeAmountInput) {
            stakeAmountInput.addEventListener('input', () => this.updateStakeCalculation());
        }

        // Quick action button
        const stakeBtn = document.querySelector('.action-btn.stake-btn');
        if (stakeBtn) {
            stakeBtn.addEventListener('click', () => this.openStakingModal());
        }
    }

    openStakingModal() {
        const modal = document.getElementById('stakingModal');
        const isConnected = this.isWalletConnected();
        
        if (modal && isConnected) {
            modal.style.display = 'flex';
            this.updateStakingModalData();
            
            // Enable/disable stake button based on wallet connection
            const stakeButton = document.getElementById('stakeButton');
            if (stakeButton) {
                stakeButton.disabled = !isConnected;
            }
        } else {
            showNotification('Please connect your wallet first', 'warning');
        }
    }

    closeStakingModal() {
        const modal = document.getElementById('stakingModal');
        if (modal) {
            modal.style.display = 'none';
            this.resetStakingForm();
        }
    }

    async updateStakingModalData() {
        try {
            // Update HP balance
            const hpBalance = await this.getHPBalance();
            document.getElementById('stakeHpBalance').textContent = `${hpBalance.toFixed(2)} HP`;
            
            // Update currently staked amount
            const totalStaked = this.getTotalStakedAmount();
            document.getElementById('currentlyStaked').textContent = `${totalStaked.toFixed(2)} HP`;
            
            // Calculate and show available staking amount
            const currentStakedValueUSD = totalStaked * this.hpPriceUSD;
            const remainingValueCapacity = Math.max(0, this.maxStakeValueUSD - currentStakedValueUSD);
            const remainingHPCapacity = remainingValueCapacity / this.hpPriceUSD;
            const availableToStake = Math.min(hpBalance, remainingHPCapacity);
            const availableValueUSD = availableToStake * this.hpPriceUSD;
            
            document.getElementById('modalAvailableStake').textContent = 
                `${availableToStake.toFixed(2)} HP ($${availableValueUSD.toFixed(0)})`;
            
            // Update max input limit
            const stakeAmountInput = document.getElementById('stakeAmount');
            if (stakeAmountInput) {
                stakeAmountInput.setAttribute('max', availableToStake.toFixed(2));
            }
            
            // Store for MAX button
            this.availableToStake = availableToStake;
            
            // Show active stakes if any
            this.displayActiveStakes();
            
        } catch (error) {
            console.error('Error updating staking modal:', error);
        }
    }

    updateStakeCalculation() {
        const stakeAmountInput = document.getElementById('stakeAmount');
        const stakeAmount = parseFloat(stakeAmountInput.value) || 0;
        
        // Calculate USD value
        const stakeValueUSD = stakeAmount * this.hpPriceUSD;
        
        // Update value display
        document.getElementById('stakeValueUSD').textContent = `Value: $${stakeValueUSD.toFixed(2)}`;
        
        // Show warning if exceeds maximum
        const warningElement = document.getElementById('stakeLimitWarning');
        if (stakeValueUSD > this.maxStakeValueUSD) {
            warningElement.style.display = 'block';
            stakeAmountInput.value = this.maxStakeHP.toFixed(2);
            this.updateStakeCalculation(); // Recursive call with corrected value
            return;
        } else {
            warningElement.style.display = 'none';
        }
        
        // Update calculator
        this.updateRewardCalculation(stakeAmount);
        
        // Enable/disable stake button
        const stakeButton = document.getElementById('stakeButton');
        if (stakeButton) {
            stakeButton.disabled = stakeAmount <= 0 || !this.isWalletConnected();
        }
    }

    updateRewardCalculation(stakeAmount) {
        // Calculate 30-day reward (6% APR)
        const dailyReward = stakeAmount * this.dailyRewardRate;
        const thirtyDayReward = dailyReward * this.lockPeriodDays;
        const totalAfterStaking = stakeAmount + thirtyDayReward;
        
        // Update display
        document.getElementById('calcStakeAmount').textContent = `${stakeAmount.toFixed(2)} HP`;
        document.getElementById('expectedReward').textContent = `${thirtyDayReward.toFixed(4)} HP`;
        document.getElementById('totalAfterStaking').textContent = `${totalAfterStaking.toFixed(4)} HP`;
    }

    setMaxStake() {
        // Set maximum stake amount based on available capacity
        const stakeAmountInput = document.getElementById('stakeAmount');
        if (stakeAmountInput) {
            const availableAmount = this.availableToStake || 0;
            
            if (availableAmount <= 0) {
                showNotification('Maximum staking limit of $1000 reached', 'warning');
                return;
            }
            
            stakeAmountInput.value = availableAmount.toFixed(2);
            this.updateStakeCalculation();
        }
    }

    async executeStaking() {
        const stakeAmountInput = document.getElementById('stakeAmount');
        const stakeAmount = parseFloat(stakeAmountInput.value);
        
        if (!stakeAmount || stakeAmount <= 0) {
            showNotification('Please enter a valid stake amount', 'error');
            return;
        }
        
        if (!this.isWalletConnected()) {
            showNotification('Please connect your wallet first', 'error');
            return;
        }
        
        try {
            // Show process steps
            this.showStakingSteps();
            
            // Step 1: Validate stake amount
            this.updateStepStatus('stakeStep1', 'processing', 'Validating stake amount...');
            
            const hpBalance = await this.getHPBalance();
            if (stakeAmount > hpBalance) {
                throw new Error('Insufficient HP token balance');
            }
            
            const stakeValueUSD = stakeAmount * this.hpPriceUSD;
            if (stakeValueUSD > this.maxStakeValueUSD) {
                throw new Error('Stake amount exceeds $1000 maximum limit');
            }
            
            this.updateStepStatus('stakeStep1', 'completed', 'Stake amount validated ✓');
            
            // Step 2: Create stake record
            this.updateStepStatus('stakeStep2', 'processing', 'Creating stake record...');
            
            const stakeRecord = {
                id: Date.now().toString(),
                amount: stakeAmount,
                valueUSD: stakeValueUSD,
                startDate: new Date(),
                endDate: new Date(Date.now() + (this.lockPeriodDays * 24 * 60 * 60 * 1000)),
                expectedReward: stakeAmount * this.dailyRewardRate * this.lockPeriodDays,
                status: 'active',
                apr: this.stakingAPR
            };
            
            // In a real implementation, this would interact with the smart contract
            // For now, we'll simulate the staking process
            await this.simulateStakingTransaction(stakeRecord);
            
            this.updateStepStatus('stakeStep2', 'completed', 'Tokens locked for 30 days ✓');
            
            // Step 3: Confirm transaction
            this.updateStepStatus('stakeStep3', 'processing', 'Confirming stake transaction...');
            
            // Save stake record
            this.userStakes.push(stakeRecord);
            this.saveStakingData();
            
            this.updateStepStatus('stakeStep3', 'completed', 'Stake transaction confirmed ✓');
            
            // Show success notification
            showNotification(
                `Successfully staked ${stakeAmount.toFixed(2)} HP tokens for 30 days! Expected reward: ${stakeRecord.expectedReward.toFixed(4)} HP`, 
                'success'
            );
            
            // Update interface
            this.updateStakingInterface();
            
            // Close modal after delay
            setTimeout(() => {
                this.closeStakingModal();
            }, 3000);
            
        } catch (error) {
            console.error('Staking error:', error);
            showNotification(`Staking failed: ${error.message}`, 'error');
            this.hideStakingSteps();
        }
    }

    async simulateStakingTransaction(stakeRecord) {
        // Simulate blockchain transaction delay
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('🔒 Staking transaction simulated:', stakeRecord);
                resolve();
            }, 2000);
        });
    }

    showStakingSteps() {
        const stepsContainer = document.getElementById('stakingSteps');
        const stakeButton = document.getElementById('stakeButton');
        
        if (stepsContainer) {
            stepsContainer.style.display = 'block';
        }
        
        if (stakeButton) {
            stakeButton.disabled = true;
        }
    }

    hideStakingSteps() {
        const stepsContainer = document.getElementById('stakingSteps');
        const stakeButton = document.getElementById('stakeButton');
        
        if (stepsContainer) {
            stepsContainer.style.display = 'none';
        }
        
        if (stakeButton) {
            stakeButton.disabled = false;
        }
    }

    updateStepStatus(stepId, status, text) {
        const step = document.getElementById(stepId);
        if (step) {
            const icon = step.querySelector('.step-icon');
            const textElement = step.querySelector('.step-text');
            
            if (status === 'processing') {
                icon.textContent = '⏳';
                step.classList.add('processing');
                step.classList.remove('completed');
            } else if (status === 'completed') {
                icon.textContent = '✅';
                step.classList.add('completed');
                step.classList.remove('processing');
            }
            
            if (textElement) {
                textElement.textContent = text;
            }
        }
    }

    displayActiveStakes() {
        const activeStakes = this.userStakes.filter(stake => stake.status === 'active');
        const stakesContainer = document.getElementById('activeStakes');
        const stakesList = document.getElementById('stakesList');
        
        if (activeStakes.length > 0) {
            stakesContainer.style.display = 'block';
            stakesList.innerHTML = '';
            
            activeStakes.forEach(stake => {
                const stakeElement = this.createStakeElement(stake);
                stakesList.appendChild(stakeElement);
            });
        } else {
            stakesContainer.style.display = 'none';
        }
    }

    createStakeElement(stake) {
        const div = document.createElement('div');
        div.className = 'stake-item';
        
        const timeRemaining = this.getTimeRemaining(stake.endDate);
        const currentReward = this.calculateCurrentReward(stake);
        
        div.innerHTML = `
            <div class="stake-info">
                <div class="stake-amount">${stake.amount.toFixed(2)} HP</div>
                <div class="stake-value">$${stake.valueUSD.toFixed(2)}</div>
            </div>
            <div class="stake-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${this.getStakeProgress(stake)}%"></div>
                </div>
                <div class="progress-text">${timeRemaining}</div>
            </div>
            <div class="stake-reward">
                <div class="current-reward">Earned: ${currentReward.toFixed(4)} HP</div>
                <div class="expected-reward">Expected: ${stake.expectedReward.toFixed(4)} HP</div>
            </div>
            <div class="stake-actions">
                ${stake.status === 'completed' ? 
                    `<button class="btn-small btn-success" onclick="hpStaking.claimStake('${stake.id}')">Claim</button>` :
                    `${this.isOwner() ? 
                        `<button class="btn-small btn-warning" onclick="hpStaking.ownerUnstakeEarly('${stake.id}')">Unstake Early (Owner)</button>` : 
                        `<button class="btn-small btn-secondary" disabled>Locked</button>`
                    }`
                }
            </div>
        `;
        
        return div;
    }

    getTimeRemaining(endDate) {
        const now = new Date();
        const end = new Date(endDate);
        const diff = end - now;
        
        if (diff <= 0) {
            return 'Ready to claim';
        }
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        if (days > 0) {
            return `${days}d ${hours}h remaining`;
        } else {
            return `${hours}h remaining`;
        }
    }

    getStakeProgress(stake) {
        const start = new Date(stake.startDate);
        const end = new Date(stake.endDate);
        const now = new Date();
        
        const totalTime = end - start;
        const elapsed = now - start;
        
        return Math.min(Math.max((elapsed / totalTime) * 100, 0), 100);
    }

    calculateCurrentReward(stake) {
        const start = new Date(stake.startDate);
        const now = new Date();
        const daysElapsed = Math.min((now - start) / (1000 * 60 * 60 * 24), this.lockPeriodDays);
        
        return stake.amount * this.dailyRewardRate * daysElapsed;
    }

    async claimStake(stakeId) {
        const stake = this.userStakes.find(s => s.id === stakeId);
        if (!stake) {
            showNotification('Stake not found', 'error');
            return;
        }
        
        const now = new Date();
        if (now < new Date(stake.endDate)) {
            showNotification('Stake is still locked', 'warning');
            return;
        }
        
        try {
            // Calculate final reward
            const finalReward = this.calculateCurrentReward(stake);
            const totalAmount = stake.amount + finalReward;
            
            // Mark stake as completed
            stake.status = 'completed';
            stake.claimedDate = now;
            stake.finalReward = finalReward;
            
            // Save updated data
            this.saveStakingData();
            
            // Update interface
            this.updateStakingInterface();
            
            showNotification(
                `Successfully claimed ${totalAmount.toFixed(4)} HP tokens (${stake.amount.toFixed(2)} + ${finalReward.toFixed(4)} reward)!`, 
                'success'
            );
            
        } catch (error) {
            console.error('Claim error:', error);
            showNotification(`Failed to claim stake: ${error.message}`, 'error');
        }
    }

    updateStakingInterface() {
        // Update sidebar staking overview
        const totalStaked = this.getTotalStakedAmount();
        const pendingRewards = this.getTotalPendingRewards();
        const nextUnlock = this.getNextUnlockDate();
        
        // Update display elements
        const totalStakedElement = document.getElementById('totalStakedHP');
        if (totalStakedElement) {
            totalStakedElement.textContent = `${totalStaked.toFixed(2)} HP`;
        }
        
        const totalStakedUSDElement = document.getElementById('totalStakedUSD');
        if (totalStakedUSDElement) {
            totalStakedUSDElement.textContent = `($${(totalStaked * this.hpPriceUSD).toFixed(2)})`;
        }
        
        const pendingRewardsElement = document.getElementById('pendingRewards');
        if (pendingRewardsElement) {
            pendingRewardsElement.textContent = `${pendingRewards.toFixed(4)} HP`;
        }
        
        const pendingRewardsUSDElement = document.getElementById('pendingRewardsUSD');
        if (pendingRewardsUSDElement) {
            pendingRewardsUSDElement.textContent = `($${(pendingRewards * this.hpPriceUSD).toFixed(2)})`;
        }
        
        const nextUnlockElement = document.getElementById('nextUnlock');
        if (nextUnlockElement) {
            nextUnlockElement.textContent = nextUnlock || 'None';
        }
        
        // Update available staking amounts
        this.updateAvailableStakingAmounts();
        
        // Enable/disable buttons
        this.updateStakingButtons();
    }

    isWalletConnected() {
        // Primary check: blockchain interface with wallet connected method
        if (window.blockchainInterface && typeof window.blockchainInterface.isWalletConnected === 'function') {
            return window.blockchainInterface.isWalletConnected();
        }
        
        // Secondary check: blockchain interface with account property
        if (window.blockchainInterface && window.blockchainInterface.account) {
            return true;
        }
        
        // Tertiary check: global app state
        if (window.axzoraApp && window.axzoraApp.appState && window.axzoraApp.appState.isWalletConnected) {
            return true;
        }
        
        // Fallback checks for web3 and user account
        return !!(window.web3 && window.userAccount) || 
               !!(window.blockchainInterface && window.blockchainInterface.isConnected) ||
               !!(window.ethereum && window.ethereum.selectedAddress);
    }
    
    getHPPriceUSD() {
        // Get HP price from price display module if available
        if (window.hpPriceDisplay && window.hpPriceDisplay.getHPPrice) {
            return window.hpPriceDisplay.getHPPrice().usd;
        }
        
        // Fallback to default price
        return 11.55;
    }
    
    async updateAvailableStakingAmounts() {
        try {
            const connected = this.isWalletConnected();
            
            if (!connected) {
                // Not connected - show connect wallet message
                const mainStakeBtn = document.getElementById('stakeAvailableAmount');
                const sidebarStakeBtn = document.getElementById('sidebarStakeAmount');
                
                if (mainStakeBtn) mainStakeBtn.textContent = 'Connect Wallet';
                if (sidebarStakeBtn) sidebarStakeBtn.textContent = 'Connect Wallet';
                return;
            }
            
            // Get user's HP balance
            const hpBalance = await this.getHPBalance();
            
            // Calculate maximum stakeable amount based on $1000 limit
            const maxStakeByValue = this.maxStakeHP; // ~86.58 HP at $11.55 per HP
            const maxStakeByBalance = hpBalance;
            
            // Get current total staked by user
            const currentStaked = this.getTotalStakedAmount();
            const currentStakedValueUSD = currentStaked * this.hpPriceUSD;
            
            // Calculate remaining stake capacity
            const remainingValueCapacity = Math.max(0, this.maxStakeValueUSD - currentStakedValueUSD);
            const remainingHPCapacity = remainingValueCapacity / this.hpPriceUSD;
            
            // Final available amount is minimum of balance and remaining capacity
            const availableToStake = Math.min(maxStakeByBalance, remainingHPCapacity);
            const availableValueUSD = availableToStake * this.hpPriceUSD;
            
            // Update button text
            const mainStakeBtn = document.getElementById('stakeAvailableAmount');
            const sidebarStakeBtn = document.getElementById('sidebarStakeAmount');
            
            if (availableToStake <= 0) {
                // No capacity left
                if (mainStakeBtn) mainStakeBtn.textContent = 'Max $1000 Reached';
                if (sidebarStakeBtn) sidebarStakeBtn.textContent = 'Limit Reached';
            } else if (availableToStake < 0.01) {
                // Very small amount
                if (mainStakeBtn) mainStakeBtn.textContent = `$${availableValueUSD.toFixed(2)} Available`;
                if (sidebarStakeBtn) sidebarStakeBtn.textContent = `$${availableValueUSD.toFixed(2)}`;
            } else {
                // Normal available amount
                if (mainStakeBtn) mainStakeBtn.textContent = `${availableToStake.toFixed(2)} HP ($${availableValueUSD.toFixed(0)})`;
                if (sidebarStakeBtn) sidebarStakeBtn.textContent = `Max: ${availableToStake.toFixed(1)} HP`;
            }
            
            // Store for later use
            this.availableToStake = availableToStake;
            
        } catch (error) {
            console.error('Error updating available staking amounts:', error);
            const mainStakeBtn = document.getElementById('stakeAvailableAmount');
            const sidebarStakeBtn = document.getElementById('sidebarStakeAmount');
            
            if (mainStakeBtn) mainStakeBtn.textContent = 'Error Loading';
            if (sidebarStakeBtn) sidebarStakeBtn.textContent = 'Error';
        }
    }
    
    updateStakingButtons() {
        const connected = this.isWalletConnected();
        
        // Quick action buttons
        const stakeBtn = document.querySelector('.action-btn.stake-btn');
        if (stakeBtn) {
            stakeBtn.disabled = !connected;
        }
        
        // Sidebar buttons
        const stakeQuickBtn = document.querySelector('.stake-quick-btn');
        const unstakeQuickBtn = document.querySelector('.unstake-quick-btn');
        
        if (stakeQuickBtn) {
            stakeQuickBtn.disabled = !connected;
        }
        
        if (unstakeQuickBtn) {
            const hasActiveStakes = this.userStakes.some(s => s.status === 'active');
            unstakeQuickBtn.disabled = !connected || !hasActiveStakes;
        }
    }

    getTotalStakedAmount() {
        return this.userStakes
            .filter(stake => stake.status === 'active')
            .reduce((total, stake) => total + stake.amount, 0);
    }

    getTotalPendingRewards() {
        return this.userStakes
            .filter(stake => stake.status === 'active')
            .reduce((total, stake) => total + this.calculateCurrentReward(stake), 0);
    }

    getNextUnlockDate() {
        const activeStakes = this.userStakes.filter(stake => stake.status === 'active');
        if (activeStakes.length === 0) return null;
        
        const nextUnlock = activeStakes.reduce((earliest, stake) => {
            const stakeEnd = new Date(stake.endDate);
            return !earliest || stakeEnd < earliest ? stakeEnd : earliest;
        }, null);
        
        if (nextUnlock) {
            const timeRemaining = this.getTimeRemaining(nextUnlock);
            return timeRemaining;
        }
        
        return null;
    }

    async getHPBalance() {
        try {
            // Get balance from blockchain interface
            if (window.blockchainInterface && window.blockchainInterface.isWalletConnected()) {
                const transactionData = window.blockchainInterface.getTransactionData();
                return parseFloat(transactionData.hpBalance || '0');
            }
            
            // Fallback to global balance
            return parseFloat(window.hpBalance || '0');
            
        } catch (error) {
            console.error('Error getting HP balance:', error);
            return 0;
        }
    }

    resetStakingForm() {
        const stakeAmountInput = document.getElementById('stakeAmount');
        if (stakeAmountInput) {
            stakeAmountInput.value = '';
        }
        
        this.updateStakeCalculation();
        this.hideStakingSteps();
    }

    loadUserStakes() {
        const saved = localStorage.getItem('hpTokenStakes');
        if (saved) {
            try {
                this.userStakes = JSON.parse(saved);
                // Convert date strings back to Date objects
                this.userStakes.forEach(stake => {
                    stake.startDate = new Date(stake.startDate);
                    stake.endDate = new Date(stake.endDate);
                    if (stake.claimedDate) {
                        stake.claimedDate = new Date(stake.claimedDate);
                    }
                });
            } catch (error) {
                console.error('Error loading stakes:', error);
                this.userStakes = [];
            }
        }
    }

    loadStakingData() {
        const saved = localStorage.getItem('hpStakingData');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (error) {
                console.error('Error loading staking data:', error);
            }
        }
        return {};
    }

    saveStakingData() {
        try {
            localStorage.setItem('hpTokenStakes', JSON.stringify(this.userStakes));
            localStorage.setItem('hpStakingData', JSON.stringify(this.stakingData));
        } catch (error) {
            console.error('Error saving staking data:', error);
        }
    }

    isOwner() {
        // Check if current wallet is the contract owner
        if (window.ownerManagement && window.ownerManagement.isOwner) {
            return window.ownerManagement.isOwner;
        }
        
        // Fallback check if owner management not available
        if (!window.blockchainInterface || !window.blockchainInterface.account) {
            return false;
        }
        
        // You can add a hard-coded owner address here as fallback
        const OWNER_ADDRESS = '0x9A1BA34e3B23e258974baEE1E883BE9374A39276'; // Replace with actual owner
        return window.blockchainInterface.account.toLowerCase() === OWNER_ADDRESS.toLowerCase();
    }
    
    async ownerUnstakeEarly(stakeId) {
        if (!this.isOwner()) {
            showNotification('Only the contract owner can withdraw tokens before the 30-day lock period', 'error');
            return;
        }
        
        const stake = this.userStakes.find(s => s.id === stakeId);
        if (!stake) {
            showNotification('Stake not found', 'error');
            return;
        }
        
        if (stake.status !== 'active') {
            showNotification('This stake is not active', 'warning');
            return;
        }
        
        try {
            // Confirm early withdrawal
            const confirmed = confirm(
                `⚠️ OWNER EARLY WITHDRAWAL\n\n` +
                `Amount: ${stake.amount.toFixed(2)} HP\n` +
                `Current Reward: ${this.calculateCurrentReward(stake).toFixed(4)} HP\n\n` +
                `This will forfeit the remaining lock period rewards.\n\n` +
                `Are you sure you want to proceed?`
            );
            
            if (!confirmed) {
                return;
            }
            
            // Calculate current reward (partial)
            const partialReward = this.calculateCurrentReward(stake);
            const totalAmount = stake.amount + partialReward;
            
            // Mark stake as completed with early withdrawal flag
            stake.status = 'completed';
            stake.claimedDate = new Date();
            stake.finalReward = partialReward;
            stake.earlyWithdrawal = true;
            stake.withdrawnBy = 'owner';
            
            // Save updated data
            this.saveStakingData();
            
            // Update interface
            this.updateStakingInterface();
            
            showNotification(
                `Owner early withdrawal successful: ${totalAmount.toFixed(4)} HP tokens (${stake.amount.toFixed(2)} + ${partialReward.toFixed(4)} partial reward)`, 
                'success'
            );
            
        } catch (error) {
            console.error('Early withdrawal error:', error);
            showNotification(`Failed to withdraw early: ${error.message}`, 'error');
        }
    }
    
    showUnstakeOptions() {
        const activeStakes = this.userStakes.filter(stake => stake.status === 'active');
        if (activeStakes.length === 0) {
            showNotification('No active stakes found', 'info');
            return;
        }
        
        // Open staking modal to show unstaking options
        this.openStakingModal();
    }
}

// Global functions for modal interaction
function openStakingModal() {
    if (window.hpStaking) {
        window.hpStaking.openStakingModal();
    }
}

function closeStakingModal() {
    if (window.hpStaking) {
        window.hpStaking.closeStakingModal();
    }
}

function setMaxStake() {
    if (window.hpStaking) {
        window.hpStaking.setMaxStake();
    }
}

function executeStaking() {
    if (window.hpStaking) {
        window.hpStaking.executeStaking();
    }
}

function showUnstakeOptions() {
    if (window.hpStaking) {
        window.hpStaking.showUnstakeOptions();
    }
}

// Initialize staking when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.hpStaking = new HPTokenStaking();
    console.log('🔒 HP Token Staking system initialized');
});