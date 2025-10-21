/**
 * Owner Management Interface for Happy Paisa Token Contract
 * Provides contract owner functions like profit withdrawal and emergency controls
 */

class OwnerManagement {
    constructor() {
        this.isOwner = false;
        this.contractAddress = '0x9A1BA34e3B23e258974baEE1E883BE9374A39276';
        this.init();
    }

    init() {
        this.setupEventListeners();
        console.log('Owner Management initialized');
    }

    setupEventListeners() {
        // Main owner buttons
        document.getElementById('withdrawProfitsBtn')?.addEventListener('click', () => this.openWithdrawProfitsModal());
        document.getElementById('emergencyWithdrawBtn')?.addEventListener('click', () => this.openEmergencyModal());
        document.getElementById('checkCollateralBtn')?.addEventListener('click', () => this.checkCollateralStatus());
        document.getElementById('pauseContractBtn')?.addEventListener('click', () => this.pauseContract());
        document.getElementById('resumeContractBtn')?.addEventListener('click', () => this.resumeContract());
        document.getElementById('lowerReserveBtn')?.addEventListener('click', () => this.lowerReserveRatio());

        // Modal buttons
        document.getElementById('executeProfitWithdraw')?.addEventListener('click', () => this.withdrawSpecificAmount());
        document.getElementById('withdrawAllProfits')?.addEventListener('click', () => this.withdrawAllProfits());
    }

    /**
     * Check if connected wallet is contract owner
     */
    async checkOwnerStatus() {
        if (!window.blockchainInterface || !window.blockchainInterface.isConnected || !window.blockchainInterface.contract) {
            this.hideOwnerPanel();
            return false;
        }

        try {
            const userAccount = window.blockchainInterface.account;
            console.log('Checking owner status for:', userAccount);
            const owner = await window.blockchainInterface.contract.methods.owner().call();
            const isOwner = userAccount.toLowerCase() === owner.toLowerCase();
            
            console.log('Contract owner:', owner);
            console.log('User account:', userAccount);
            console.log('Is owner:', isOwner);

            this.isOwner = isOwner;
            
            if (isOwner) {
                this.showOwnerPanel();
                this.loadOwnerData();
            } else {
                this.hideOwnerPanel();
            }

            return isOwner;
        } catch (error) {
            console.error('Error checking owner status:', error);
            this.hideOwnerPanel();
            return false;
        }
    }

    showOwnerPanel() {
        const panel = document.getElementById('ownerPanel');
        if (panel) {
            panel.style.display = 'block';
            console.log('Owner panel shown');
        }
    }

    hideOwnerPanel() {
        const panel = document.getElementById('ownerPanel');
        if (panel) {
            panel.style.display = 'none';
        }
    }

    /**
     * Load owner-specific data
     */
    async loadOwnerData() {
        try {
            // Get contract info
            const info = await window.blockchainInterface.contract.methods.getContractInfo().call();
            const totalSupplyHP = info.totalSupplyHP;
            const totalCollateralUSDT = info.totalCollateralUSDT;
            const reserveRatio = info.currentReserveRatio;

            // Convert values for display - Handle BigInt properly
            const totalSupplyStr = typeof totalSupplyHP === 'bigint' ? totalSupplyHP.toString() : totalSupplyHP.toString();
            const totalSupplyFormatted = parseFloat(window.blockchainInterface.web3.utils.fromWei(totalSupplyStr, 'ether')).toFixed(4);
            
            let totalCollateralFormatted;
            const collateralStr = typeof totalCollateralUSDT === 'bigint' ? totalCollateralUSDT.toString() : totalCollateralUSDT.toString();
            const rawCollateral = parseFloat(collateralStr);
            
            console.log('Raw collateral value:', rawCollateral, 'Type:', typeof totalCollateralUSDT);
            
            if (rawCollateral > 1e18) {
                // Value is in wei format (18 decimals)
                totalCollateralFormatted = (rawCollateral / 1e18).toFixed(6);
            } else if (rawCollateral > 1e6) {
                // Value is in USDT format (6 decimals)
                totalCollateralFormatted = (rawCollateral / 1e6).toFixed(6);
            } else {
                // Value is already in proper format
                totalCollateralFormatted = rawCollateral.toFixed(6);
            }

            // Calculate available profits using contract's exact formula
            // Users pay 11.55 USDT per HP: 11 USDT base + 0.55 USDT (5% profit)
            // Contract keeps: 11 USDT base + 5% reserve = 11.55 USDT per HP
            // So actually NO excess until reserve ratio drops!
            let availableProfits = 0;
            if (parseFloat(totalSupplyFormatted) > 0) {
                const HP_TO_USDT_RATE = 11; // Base collateral per HP
                const baseCollateral = parseFloat(totalSupplyFormatted) * HP_TO_USDT_RATE;
                const reservePercentage = parseFloat(reserveRatio) / 100; // Convert to decimal
                const requiredReserve = baseCollateral * reservePercentage; // 5% reserve
                const totalRequired = baseCollateral + requiredReserve; // Base + Reserve
                
                // Available = Total - (Base + Reserve)
                availableProfits = Math.max(0, parseFloat(totalCollateralFormatted) - totalRequired);
            } else {
                availableProfits = parseFloat(totalCollateralFormatted);
            }
            
            console.log('Profit calculation:', {
                totalSupply: totalSupplyFormatted + ' HP',
                totalCollateral: totalCollateralFormatted + ' USDT',
                baseCollateral: (parseFloat(totalSupplyFormatted) * 11).toFixed(6) + ' USDT',
                reserveRatio: reserveRatio + '%',
                requiredReserve: ((parseFloat(totalSupplyFormatted) * 11) * (parseFloat(reserveRatio) / 100)).toFixed(6) + ' USDT',
                totalRequired: ((parseFloat(totalSupplyFormatted) * 11) * (1 + parseFloat(reserveRatio) / 100)).toFixed(6) + ' USDT',
                availableProfits: availableProfits.toFixed(6) + ' USDT'
            });

            // Update UI
            document.getElementById('availableProfits').textContent = `${availableProfits.toFixed(6)} USDT`;
            document.getElementById('totalCollateral').textContent = `${totalCollateralFormatted} USDT`;
            
            console.log('Owner data loaded:', {
                totalSupply: totalSupplyFormatted,
                totalCollateral: totalCollateralFormatted,
                availableProfits: availableProfits.toFixed(6)
            });

        } catch (error) {
            console.error('Error loading owner data:', error);
            document.getElementById('availableProfits').textContent = 'Error';
            document.getElementById('totalCollateral').textContent = 'Error';
        }
    }

    /**
     * Open withdraw profits modal
     */
    async openWithdrawProfitsModal() {
        const modal = document.getElementById('withdrawProfitsModal');
        if (!modal) return;

        // Load fresh data for modal
        await this.loadModalData();
        modal.style.display = 'block';
    }

    /**
     * Load data for profit withdrawal modal
     */
    async loadModalData() {
        try {
            const info = await window.blockchainInterface.contract.methods.getContractInfo().call();
            const totalSupplyHP = info.totalSupplyHP;
            const totalCollateralUSDT = info.totalCollateralUSDT;
            const reserveRatio = info.currentReserveRatio;

            const totalSupplyFormatted = parseFloat(window.blockchainInterface.web3.utils.fromWei(totalSupplyHP.toString(), 'ether')).toFixed(4);
            let totalCollateralFormatted;
            const rawCollateral = parseFloat(totalCollateralUSDT.toString());
            
            if (rawCollateral > 1e18) {
                totalCollateralFormatted = (rawCollateral / 1e18).toFixed(6);
            } else if (rawCollateral > 1e6) {
                totalCollateralFormatted = (rawCollateral / 1e6).toFixed(6);
            } else {
                totalCollateralFormatted = rawCollateral.toFixed(6);
            }

            let availableProfits = 0;
            if (parseFloat(totalSupplyFormatted) > 0) {
                const HP_TO_USDT_RATE = 11; // Base collateral per HP
                const baseCollateral = parseFloat(totalSupplyFormatted) * HP_TO_USDT_RATE;
                const reservePercentage = parseFloat(reserveRatio) / 100; // Convert to decimal
                const requiredReserve = baseCollateral * reservePercentage; // 5% reserve
                const totalRequired = baseCollateral + requiredReserve; // Base + Reserve
                
                // Available = Total - (Base + Reserve)
                availableProfits = Math.max(0, parseFloat(totalCollateralFormatted) - totalRequired);
            } else {
                availableProfits = parseFloat(totalCollateralFormatted);
            }

            // Update modal content
            document.getElementById('modalTotalHP').textContent = `${totalSupplyFormatted} HP`;
            document.getElementById('modalTotalUSDT').textContent = `${totalCollateralFormatted} USDT`;
            document.getElementById('modalAvailableProfits').textContent = `${availableProfits.toFixed(6)} USDT`;

            // Store for later use
            this.currentProfitsData = {
                availableProfits: availableProfits,
                totalCollateral: totalCollateralFormatted
            };

        } catch (error) {
            console.error('Error loading modal data:', error);
            this.showNotification('Error loading profit data', 'error');
        }
    }

    /**
     * Set maximum profits amount
     */
    setMaxProfits() {
        if (this.currentProfitsData) {
            document.getElementById('profitAmount').value = this.currentProfitsData.availableProfits.toFixed(6);
        }
    }

    /**
     * Withdraw specific amount of profits
     */
    async withdrawSpecificAmount() {
        const amountInput = document.getElementById('profitAmount');
        const amount = parseFloat(amountInput.value);

        if (!amount || amount <= 0) {
            this.showNotification('Please enter a valid amount', 'error');
            return;
        }

        if (!this.currentProfitsData || amount > this.currentProfitsData.availableProfits) {
            this.showNotification(`Amount exceeds available profits (${this.currentProfitsData?.availableProfits?.toFixed(6) || 0} USDT)`, 'error');
            return;
        }

        await this.executeWithdrawal(amount);
    }

    /**
     * Withdraw all available profits
     */
    async withdrawAllProfits() {
        if (!this.currentProfitsData || this.currentProfitsData.availableProfits <= 0) {
            this.showNotification('No profits available for withdrawal', 'error');
            return;
        }

        await this.executeWithdrawal(this.currentProfitsData.availableProfits);
    }

    /**
     * Execute profit withdrawal
     */
    async executeWithdrawal(amount) {
        if (!window.blockchainInterface || !window.blockchainInterface.isConnected) {
            this.showNotification('Please connect wallet first', 'error');
            return;
        }

        // Try multiple withdrawal approaches
        const withdrawalMethods = [
            {
                name: 'Wei Format (18 decimals)',
                convert: (amt) => window.blockchainInterface.web3.utils.toWei(amt.toString(), 'ether')
            },
            {
                name: 'USDT Format (6 decimals)',
                convert: (amt) => (parseFloat(amt) * 1e6).toString()
            },
            {
                name: 'Raw Format',
                convert: (amt) => amt.toString()
            },
            {
                name: 'BigInt Wei Format',
                convert: (amt) => BigInt(Math.floor(parseFloat(amt) * 1e18)).toString()
            }
        ];

        for (let i = 0; i < withdrawalMethods.length; i++) {
            const method = withdrawalMethods[i];
            try {
                this.showNotification(`Attempting withdrawal with ${method.name}...`, 'info');
                
                const convertedAmount = method.convert(amount);
                console.log(`Trying ${method.name}:`, amount, '→', convertedAmount);
                
                // Estimate gas first
                const gasEstimate = await window.blockchainInterface.contract.methods.withdrawExcessCollateral(convertedAmount).estimateGas({
                    from: window.blockchainInterface.account
                });
                
                console.log('Gas estimate successful:', gasEstimate);
                this.showNotification('Please approve the transaction in MetaMask...', 'info');
                
                // Execute withdrawal
                const result = await window.blockchainInterface.contract.methods.withdrawExcessCollateral(convertedAmount).send({
                    from: window.blockchainInterface.account,
                    gas: Math.floor(Number(gasEstimate) * 1.2),
                    gasPrice: window.blockchainInterface.web3.utils.toWei('5', 'gwei')
                });
                
                this.showNotification(`✅ Withdrawal successful! ${amount.toFixed(6)} USDT withdrawn using ${method.name}. TX: ${result.transactionHash}`, 'success');
                
                // Close modal and refresh data
                this.closeWithdrawProfitsModal();
                setTimeout(() => this.loadOwnerData(), 2000);
                return; // Success, exit function
                
            } catch (error) {
                console.error(`${method.name} failed:`, error.message);
                
                if (error.message.includes('User denied')) {
                    this.showNotification('Transaction cancelled by user', 'warning');
                    return; // User cancelled, stop trying
                }
                
                // If this is the last method, show error
                if (i === withdrawalMethods.length - 1) {
                    this.showNotification(`All withdrawal methods failed. Last error: ${error.message}`, 'error');
                }
                // Otherwise continue to next method
            }
        }
    }

    /**
     * Retry withdrawal with alternative amount format
     */
    async retryWithdrawalAlternativeFormat(amount) {
        try {
            this.showNotification('Retrying with alternative format...', 'info');
            
            const amountUSDT = Math.floor(amount * 1e6).toString();
            console.log('Retrying with USDT format:', amountUSDT);

            const gasEstimate = await window.blockchainInterface.contract.methods.withdrawExcessCollateral(amountUSDT).estimateGas({
                from: window.blockchainInterface.account
            });

            const result = await window.blockchainInterface.contract.methods.withdrawExcessCollateral(amountUSDT).send({
                from: window.blockchainInterface.account,
                gas: Math.floor(gasEstimate * 1.2),
                gasPrice: window.blockchainInterface.web3.utils.toWei('5', 'gwei')
            });

            this.showNotification(`✅ Withdrawal successful! ${amount.toFixed(6)} USDT withdrawn. TX: ${result.transactionHash}`, 'success');
            this.closeWithdrawProfitsModal();
            setTimeout(() => this.loadOwnerData(), 2000);

        } catch (retryError) {
            this.showNotification(`Both withdrawal methods failed: ${retryError.message}`, 'error');
        }
    }

    /**
     * Open emergency withdraw modal
     */
    openEmergencyModal() {
        const modal = document.getElementById('emergencyWithdrawModal');
        if (modal) {
            modal.style.display = 'block';
            // Reset confirmation
            document.getElementById('emergencyConfirmation').style.display = 'none';
        }
    }

    /**
     * Execute emergency withdrawal
     */
    async executeEmergencyWithdraw(method) {
        // Show confirmation
        const confirmation = document.getElementById('emergencyConfirmation');
        const confirmText = document.getElementById('confirmationText');
        const finalBtn = document.getElementById('finalConfirmBtn');

        let methodName;
        switch (method) {
            case 'emergencyWithdraw':
                methodName = 'Emergency Withdraw Function';
                break;
            case 'withdrawAll':
                methodName = 'Withdraw All Function';
                break;
            case 'totalCollateral':
                methodName = 'Total Collateral Withdrawal';
                break;
        }

        confirmText.textContent = `You are about to execute "${methodName}". This will withdraw ALL USDT from the contract. Are you absolutely sure?`;
        
        finalBtn.onclick = () => this.finalEmergencyExecute(method);
        confirmation.style.display = 'block';
    }

    /**
     * Final emergency withdrawal execution with comprehensive methods
     */
    async finalEmergencyExecute(method) {
        if (!window.blockchainInterface || !window.blockchainInterface.isConnected) {
            this.showNotification('Please connect wallet first', 'error');
            return;
        }

        try {
            this.showNotification(`Executing emergency action: ${method}...`, 'warning');

            let results = [];
            
            if (method === 'pauseAndWithdraw') {
                // First pause the contract
                this.showNotification('Step 1: Pausing contract...', 'warning');
                try {
                    if (window.blockchainInterface.contract.methods.pause) {
                        const pauseResult = await window.blockchainInterface.contract.methods.pause().send({
                            from: window.blockchainInterface.account,
                            gasPrice: window.blockchainInterface.web3.utils.toWei('5', 'gwei')
                        });
                        results.push(`Pause TX: ${pauseResult.transactionHash}`);
                        this.showNotification('Step 2: Withdrawing all funds...', 'warning');
                    } else {
                        this.showNotification('Pause function not available, proceeding with withdrawal only...', 'warning');
                    }
                } catch (pauseError) {
                    console.error('Pause failed:', pauseError);
                    this.showNotification('Pause failed, proceeding with withdrawal only...', 'warning');
                }
                
                // Then withdraw all funds using multiple methods
                await this.attemptAllWithdrawalMethods();
                
            } else if (method === 'pauseOnly') {
                // Only pause the contract
                if (window.blockchainInterface.contract.methods.pause) {
                    const result = await window.blockchainInterface.contract.methods.pause().send({
                        from: window.blockchainInterface.account,
                        gasPrice: window.blockchainInterface.web3.utils.toWei('5', 'gwei')
                    });
                    this.showNotification(`⏸️ Contract paused successfully! TX: ${result.transactionHash}`, 'success');
                } else {
                    this.showNotification('Pause function not available on this contract', 'warning');
                }
                
            } else if (method === 'totalCollateral') {
                // Force withdrawal using collateral amount with multiple formats
                await this.forceCollateralWithdrawal();
                
            } else {
                // Try emergency methods with fallbacks
                await this.attemptEmergencyFunction(method);
            }

            this.closeEmergencyModal();
            setTimeout(() => this.loadOwnerData(), 3000);

        } catch (error) {
            console.error('Emergency action error:', error);
            
            if (error.message.includes('User denied')) {
                this.showNotification('Emergency action cancelled by user', 'warning');
            } else {
                this.showNotification(`Emergency action failed: ${error.message}`, 'error');
            }
        }
    }
    
    /**
     * Attempt all available withdrawal methods
     */
    async attemptAllWithdrawalMethods() {
        const withdrawalMethods = ['emergencyWithdraw', 'withdrawAll', 'withdraw'];
        let success = false;
        
        for (const methodName of withdrawalMethods) {
            if (window.blockchainInterface.contract.methods[methodName]) {
                try {
                    this.showNotification(`Attempting ${methodName}()...`, 'warning');
                    
                    let result;
                    if (methodName === 'withdraw') {
                        // For withdraw function, try with total collateral amount
                        const totalCollateral = await window.blockchainInterface.contract.methods.totalCollateral().call();
                        result = await window.blockchainInterface.contract.methods[methodName](totalCollateral).send({
                            from: window.blockchainInterface.account,
                            gasPrice: window.blockchainInterface.web3.utils.toWei('5', 'gwei')
                        });
                    } else {
                        result = await window.blockchainInterface.contract.methods[methodName]().send({
                            from: window.blockchainInterface.account,
                            gasPrice: window.blockchainInterface.web3.utils.toWei('5', 'gwei')
                        });
                    }
                    
                    this.showNotification(`✅ ${methodName}() successful! TX: ${result.transactionHash}`, 'success');
                    success = true;
                    break;
                } catch (error) {
                    console.error(`${methodName} failed:`, error.message);
                }
            }
        }
        
        if (!success) {
            // Try force collateral withdrawal as last resort
            await this.forceCollateralWithdrawal();
        }
    }
    
    /**
     * Force collateral withdrawal using multiple amount formats
     */
    async forceCollateralWithdrawal() {
        try {
            const totalCollateral = await window.blockchainInterface.contract.methods.totalCollateral().call();
            if (!totalCollateral || totalCollateral.toString() === '0') {
                this.showNotification('No collateral to withdraw!', 'error');
                return;
            }
            
            // Try different amount formats
            const collateralFormats = [
                totalCollateral.toString(),
                totalCollateral,
                window.blockchainInterface.web3.utils.toWei('1000000', 'ether'), // Try large amount
                '999999999999999999999999' // Very large number
            ];
            
            for (const amount of collateralFormats) {
                try {
                    this.showNotification(`Attempting collateral withdrawal with format: ${amount.toString().substring(0,10)}...`, 'warning');
                    
                    const result = await window.blockchainInterface.contract.methods.withdrawExcessCollateral(amount).send({
                        from: window.blockchainInterface.account,
                        gasPrice: window.blockchainInterface.web3.utils.toWei('5', 'gwei')
                    });
                    
                    this.showNotification(`✅ Force collateral withdrawal successful! TX: ${result.transactionHash}`, 'success');
                    return;
                } catch (error) {
                    console.error(`Collateral format ${amount.toString().substring(0,10)} failed:`, error.message);
                }
            }
            
            this.showNotification('All collateral withdrawal methods failed', 'error');
        } catch (error) {
            this.showNotification(`Force withdrawal failed: ${error.message}`, 'error');
        }
    }
    
    /**
     * Attempt emergency function with multiple approaches
     */
    async attemptEmergencyFunction(method) {
        if (window.blockchainInterface.contract.methods[method]) {
            try {
                const result = await window.blockchainInterface.contract.methods[method]().send({
                    from: window.blockchainInterface.account,
                    gasPrice: window.blockchainInterface.web3.utils.toWei('5', 'gwei')
                });
                
                this.showNotification(`✅ ${method}() successful! TX: ${result.transactionHash}`, 'success');
            } catch (error) {
                console.error(`${method} failed:`, error.message);
                this.showNotification(`${method} failed: ${error.message}. Trying alternative methods...`, 'warning');
                
                // Try alternative withdrawal methods
                await this.attemptAllWithdrawalMethods();
            }
        } else {
            this.showNotification(`Function ${method}() not found in contract. Trying alternatives...`, 'warning');
            await this.attemptAllWithdrawalMethods();
        }
    }

    /**
     * Check collateral status
     */
    async checkCollateralStatus() {
        this.showNotification('Checking collateral status...', 'info');
        await this.loadOwnerData();
        this.showNotification('Collateral status updated', 'success');
    }

    /**
     * Pause contract (if function exists)
     */
    async pauseContract() {
        if (!window.blockchainInterface || !window.blockchainInterface.isConnected) {
            this.showNotification('Please connect wallet first', 'error');
            return;
        }

        try {
            this.showNotification('Attempting to pause contract...', 'info');
            
            // Check if pause function exists
            if (window.blockchainInterface.contract.methods.pause) {
                const result = await window.blockchainInterface.contract.methods.pause().send({
                    from: window.blockchainInterface.account,
                    gasPrice: window.blockchainInterface.web3.utils.toWei('5', 'gwei')
                });
                
                this.showNotification(`Contract paused! TX: ${result.transactionHash}`, 'success');
            } else {
                this.showNotification('Pause function not available on this contract', 'warning');
            }
        } catch (error) {
            console.error('Pause error:', error);
            this.showNotification(`Failed to pause contract: ${error.message}`, 'error');
        }
    }
    
    /**
     * Lower reserve ratio to free up collateral for withdrawal
     */
    async lowerReserveRatio() {
        if (!window.blockchainInterface || !window.blockchainInterface.isConnected) {
            this.showNotification('Please connect wallet first', 'error');
            return;
        }

        try {
            // Get current reserve ratio
            const info = await window.blockchainInterface.contract.methods.getContractInfo().call();
            const currentRatio = parseInt(info.currentReserveRatio);
            
            this.showNotification(`Current reserve ratio: ${currentRatio}%`, 'info');
            
            // Ask user for new ratio
            const newRatio = prompt(`Enter new reserve ratio (100-200). Current: ${currentRatio}%\nLower it to 100-105% to free up excess collateral:`, '105');
            
            if (!newRatio) return; // User cancelled
            
            const newRatioNum = parseInt(newRatio);
            if (isNaN(newRatioNum) || newRatioNum < 100 || newRatioNum > 200) {
                this.showNotification('Invalid ratio. Must be between 100 and 200', 'error');
                return;
            }
            
            if (newRatioNum >= currentRatio) {
                this.showNotification('New ratio must be lower than current ratio to free up funds', 'warning');
                return;
            }
            
            this.showNotification(`Setting reserve ratio to ${newRatioNum}%...`, 'info');
            
            const result = await window.blockchainInterface.contract.methods.updateReserveRatio(newRatioNum).send({
                from: window.blockchainInterface.account,
                gasPrice: window.blockchainInterface.web3.utils.toWei('5', 'gwei')
            });
            
            this.showNotification(`✅ Reserve ratio updated to ${newRatioNum}%! TX: ${result.transactionHash}`, 'success');
            
            // Refresh data after 2 seconds
            setTimeout(() => this.loadOwnerData(), 2000);
            
        } catch (error) {
            console.error('Update reserve ratio error:', error);
            
            if (error.message.includes('User denied')) {
                this.showNotification('Transaction cancelled by user', 'warning');
            } else {
                this.showNotification(`Failed to update reserve ratio: ${error.message}`, 'error');
            }
        }
    }
    
    /**
     * Resume/Unpause contract (if function exists)
     */
    async resumeContract() {
        if (!window.blockchainInterface || !window.blockchainInterface.isConnected) {
            this.showNotification('Please connect wallet first', 'error');
            return;
        }

        try {
            this.showNotification('Attempting to resume contract...', 'info');
            
            // Try different unpause function names
            const unpauseFunctions = ['unpause', 'resume', 'start'];
            let success = false;
            
            for (const funcName of unpauseFunctions) {
                if (window.blockchainInterface.contract.methods[funcName]) {
                    try {
                        const result = await window.blockchainInterface.contract.methods[funcName]().send({
                            from: window.blockchainInterface.account,
                            gasPrice: window.blockchainInterface.web3.utils.toWei('5', 'gwei')
                        });
                        
                        this.showNotification(`Contract resumed using ${funcName}()! TX: ${result.transactionHash}`, 'success');
                        success = true;
                        break;
                    } catch (error) {
                        console.error(`${funcName} failed:`, error.message);
                    }
                }
            }
            
            if (!success) {
                this.showNotification('Resume/unpause function not available on this contract', 'warning');
            }
        } catch (error) {
            console.error('Resume error:', error);
            this.showNotification(`Failed to resume contract: ${error.message}`, 'error');
        }
    }

    /**
     * Modal management functions
     */
    closeWithdrawProfitsModal() {
        const modal = document.getElementById('withdrawProfitsModal');
        if (modal) modal.style.display = 'none';
    }

    closeEmergencyModal() {
        const modal = document.getElementById('emergencyWithdrawModal');
        if (modal) modal.style.display = 'none';
    }

    cancelEmergencyWithdraw() {
        document.getElementById('emergencyConfirmation').style.display = 'none';
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        `;

        const container = document.getElementById('notifications');
        if (container) {
            container.appendChild(notification);

            // Auto remove after 5 seconds
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 5000);

            // Close button
            notification.querySelector('.notification-close').onclick = () => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            };
        }

        console.log(`${type.toUpperCase()}: ${message}`);
    }
}

// Global functions for modal management
function closeWithdrawProfitsModal() {
    window.ownerManager?.closeWithdrawProfitsModal();
}

function closeEmergencyModal() {
    window.ownerManager?.closeEmergencyModal();
}

function cancelEmergencyWithdraw() {
    window.ownerManager?.cancelEmergencyWithdraw();
}

function setMaxProfits() {
    window.ownerManager?.setMaxProfits();
}

function executeEmergencyWithdraw(method) {
    window.ownerManager?.executeEmergencyWithdraw(method);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.ownerManager = new OwnerManagement();
    console.log('Owner Management system loaded');
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OwnerManagement;
}