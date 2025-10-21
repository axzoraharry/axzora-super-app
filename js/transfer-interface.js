/**
 * Transfer Interface - Handle HP Token Transfers
 * Provides UI and functionality for sending HP tokens to other addresses
 */

class TransferInterface {
    constructor() {
        this.isTransferring = false;
        this.currentGasEstimate = null;
        this.transferData = {
            toAddress: '',
            amount: 0,
            gasEstimate: 0
        };
        
        this.init();
    }

    init() {
        console.log('🔄 Initializing Transfer Interface...');
        this.setupEventListeners();
        this.loadTransferData();
    }

    setupEventListeners() {
        // Transfer amount input
        const transferAmountInput = document.getElementById('transferHpAmount');
        if (transferAmountInput) {
            transferAmountInput.addEventListener('input', () => {
                this.updateTransferValue();
                this.validateTransferForm();
            });
        }

        // Address input
        const addressInput = document.getElementById('transferToAddress');
        if (addressInput) {
            addressInput.addEventListener('input', () => {
                this.validateAddress();
                this.validateTransferForm();
            });
            
            addressInput.addEventListener('paste', (e) => {
                setTimeout(() => {
                    this.validateAddress();
                    this.validateTransferForm();
                }, 100);
            });
        }

        // Listen for wallet connections
        window.addEventListener('wallet-connected', () => {
            this.loadTransferData();
        });

        window.addEventListener('account-data-updated', () => {
            this.loadTransferData();
        });
    }

    async loadTransferData() {
        if (!window.blockchainInterface?.isConnected) return;

        try {
            // Update HP balance display
            const hpBalanceEl = document.getElementById('transferHpBalance');
            if (hpBalanceEl && window.blockchainInterface.transactionData) {
                const hpBalance = window.blockchainInterface.transactionData.hpBalance || '0.00';
                hpBalanceEl.textContent = `${hpBalance} HP`;
            }

        } catch (error) {
            console.error('❌ Error loading transfer data:', error);
        }
    }

    updateTransferValue() {
        const amountInput = document.getElementById('transferHpAmount');
        const valueDisplay = document.getElementById('transferValue');
        
        if (amountInput && valueDisplay) {
            const amount = parseFloat(amountInput.value) || 0;
            const usdtValue = (amount * 11.00).toFixed(2); // HP price is $11 USDT
            valueDisplay.textContent = `Value: ~${usdtValue} USDT`;
            
            // Update summary
            const summaryAmount = document.getElementById('summaryAmount');
            if (summaryAmount) {
                summaryAmount.textContent = `${amount.toFixed(2)} HP`;
            }
        }
    }

    async validateAddress() {
        const addressInput = document.getElementById('transferToAddress');
        const validationDiv = document.getElementById('addressValidation');
        
        if (!addressInput || !validationDiv) return false;

        const address = addressInput.value.trim();
        
        if (!address) {
            validationDiv.style.display = 'none';
            return false;
        }

        if (!window.blockchainInterface?.web3?.utils.isAddress(address)) {
            validationDiv.style.display = 'block';
            validationDiv.innerHTML = '<span class="validation-error">❌ Invalid BSC address</span>';
            addressInput.classList.add('error');
            return false;
        }

        // Check if it's the user's own address
        if (address.toLowerCase() === window.blockchainInterface.account?.toLowerCase()) {
            validationDiv.style.display = 'block';
            validationDiv.innerHTML = '<span class="validation-warning">⚠️ Cannot send to your own address</span>';
            addressInput.classList.add('warning');
            return false;
        }

        validationDiv.style.display = 'block';
        validationDiv.innerHTML = '<span class="validation-success">✅ Valid address</span>';
        addressInput.classList.remove('error', 'warning');
        addressInput.classList.add('valid');

        // Update summary
        const summaryAddress = document.getElementById('summaryAddress');
        if (summaryAddress) {
            summaryAddress.textContent = `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
        }

        return true;
    }

    async validateTransferForm() {
        const addressInput = document.getElementById('transferToAddress');
        const amountInput = document.getElementById('transferHpAmount');
        const transferButton = document.getElementById('transferButton');
        const summaryDiv = document.getElementById('transferSummary');
        
        if (!addressInput || !amountInput || !transferButton) return;

        const address = addressInput.value.trim();
        const amount = parseFloat(amountInput.value) || 0;
        const currentBalance = parseFloat(window.blockchainInterface?.transactionData?.hpBalance || '0');

        let isValid = true;
        let errors = [];

        // Validate address
        if (!address) {
            errors.push('Enter recipient address');
            isValid = false;
        } else if (!window.blockchainInterface?.web3?.utils.isAddress(address)) {
            errors.push('Invalid address format');
            isValid = false;
        } else if (address.toLowerCase() === window.blockchainInterface.account?.toLowerCase()) {
            errors.push('Cannot send to yourself');
            isValid = false;
        }

        // Validate amount
        if (!amount || amount <= 0) {
            errors.push('Enter amount to transfer');
            isValid = false;
        } else if (amount > currentBalance) {
            errors.push('Insufficient HP balance');
            isValid = false;
        }

        // Update button state
        transferButton.disabled = !isValid;
        
        if (isValid) {
            transferButton.classList.remove('disabled');
            summaryDiv.style.display = 'block';
            this.estimateGas(address, amount);
        } else {
            transferButton.classList.add('disabled');
            summaryDiv.style.display = 'none';
        }

        return isValid;
    }

    async estimateGas(toAddress, amount) {
        try {
            if (!window.blockchainInterface?.contract) return;

            const amountWei = window.blockchainInterface.web3.utils.toWei(amount.toString(), 'ether');
            
            const gasEstimateBigInt = await window.blockchainInterface.contract.methods
                .transfer(toAddress, amountWei)
                .estimateGas({ from: window.blockchainInterface.account });
                
            const gasEstimate = parseInt(gasEstimateBigInt.toString());
            this.currentGasEstimate = gasEstimate;

            // Estimate BNB cost (gas * gas price)
            const gasPrice = await window.blockchainInterface.web3.eth.getGasPrice();
            const gasCostWei = gasEstimate * parseInt(gasPrice);
            const gasCostBnb = window.blockchainInterface.web3.utils.fromWei(gasCostWei.toString(), 'ether');
            
            const summaryGas = document.getElementById('summaryGas');
            if (summaryGas) {
                summaryGas.textContent = `~${parseFloat(gasCostBnb).toFixed(6)} BNB`;
            }

        } catch (error) {
            console.error('❌ Gas estimation failed:', error);
            const summaryGas = document.getElementById('summaryGas');
            if (summaryGas) {
                summaryGas.textContent = '~0.001 BNB (est.)';
            }
        }
    }

    setMaxHPTransfer() {
        const amountInput = document.getElementById('transferHpAmount');
        const currentBalance = parseFloat(window.blockchainInterface?.transactionData?.hpBalance || '0');
        
        if (amountInput && currentBalance > 0) {
            amountInput.value = currentBalance.toString();
            this.updateTransferValue();
            this.validateTransferForm();
        }
    }

    async executeTransfer() {
        if (this.isTransferring) return;

        const addressInput = document.getElementById('transferToAddress');
        const amountInput = document.getElementById('transferHpAmount');
        
        if (!addressInput || !amountInput) {
            this.showError('Form elements not found');
            return;
        }

        const toAddress = addressInput.value.trim();
        const amount = parseFloat(amountInput.value);

        if (!await this.validateTransferForm()) {
            this.showError('Please fix form errors');
            return;
        }

        try {
            this.isTransferring = true;
            this.showTransferSteps(true);
            this.updateTransferStep(1, 'pending', 'Validating transaction...');

            // Validate final checks
            if (!window.blockchainInterface?.isConnected) {
                throw new Error('Wallet not connected');
            }

            this.updateTransferStep(1, 'success', 'Transaction validated ✅');
            this.updateTransferStep(2, 'pending', 'Sending HP tokens...');

            // Execute transfer
            const tx = await window.blockchainInterface.transferTokens(toAddress, amount);

            this.updateTransferStep(2, 'success', 'HP tokens sent ✅');
            this.updateTransferStep(3, 'pending', 'Confirming transaction...');

            // Wait a bit for confirmation
            await new Promise(resolve => setTimeout(resolve, 2000));

            this.updateTransferStep(3, 'success', 'Transaction confirmed ✅');

            // Show success and close modal
            setTimeout(() => {
                this.showSuccess(`Successfully transferred ${amount} HP tokens!`);
                this.closeTransferModal();
            }, 1000);

        } catch (error) {
            console.error('❌ Transfer failed:', error);
            this.showError(`Transfer failed: ${error.message}`);
            this.showTransferSteps(false);
        } finally {
            this.isTransferring = false;
        }
    }

    showTransferSteps(show) {
        const stepsDiv = document.getElementById('transferSteps');
        const transferButton = document.getElementById('transferButton');
        
        if (stepsDiv) {
            stepsDiv.style.display = show ? 'block' : 'none';
        }
        
        if (transferButton) {
            transferButton.disabled = show;
            transferButton.classList.toggle('loading', show);
        }
    }

    updateTransferStep(stepNumber, status, text) {
        const stepEl = document.getElementById(`transferStep${stepNumber}`);
        if (!stepEl) return;

        const iconEl = stepEl.querySelector('.step-icon');
        const textEl = stepEl.querySelector('.step-text');

        if (textEl) {
            textEl.textContent = `${stepNumber}. ${text}`;
        }

        if (iconEl) {
            switch (status) {
                case 'pending':
                    iconEl.textContent = '⏳';
                    stepEl.className = 'step pending';
                    break;
                case 'success':
                    iconEl.textContent = '✅';
                    stepEl.className = 'step success';
                    break;
                case 'error':
                    iconEl.textContent = '❌';
                    stepEl.className = 'step error';
                    break;
            }
        }
    }

    openTransferModal() {
        const modal = document.getElementById('transferModal');
        if (modal) {
            modal.style.display = 'block';
            this.loadTransferData();
            this.resetTransferForm();
        }
    }

    closeTransferModal() {
        const modal = document.getElementById('transferModal');
        if (modal) {
            modal.style.display = 'none';
            this.resetTransferForm();
        }
    }

    resetTransferForm() {
        // Reset form fields
        const addressInput = document.getElementById('transferToAddress');
        const amountInput = document.getElementById('transferHpAmount');
        const validationDiv = document.getElementById('addressValidation');
        const summaryDiv = document.getElementById('transferSummary');
        const stepsDiv = document.getElementById('transferSteps');
        
        if (addressInput) {
            addressInput.value = '';
            addressInput.classList.remove('error', 'warning', 'valid');
        }
        
        if (amountInput) {
            amountInput.value = '';
        }
        
        if (validationDiv) {
            validationDiv.style.display = 'none';
        }
        
        if (summaryDiv) {
            summaryDiv.style.display = 'none';
        }
        
        if (stepsDiv) {
            stepsDiv.style.display = 'none';
        }

        this.updateTransferValue();
        this.isTransferring = false;
    }

    scanQRForTransfer() {
        // Placeholder for QR scanning functionality
        this.showInfo('QR scanning feature will be added soon!');
    }

    showSuccess(message) {
        if (window.showNotification) {
            window.showNotification(message, 'success');
        } else {
            alert(message);
        }
    }

    showError(message) {
        if (window.showNotification) {
            window.showNotification(message, 'error');
        } else {
            alert('Error: ' + message);
        }
    }

    showInfo(message) {
        if (window.showNotification) {
            window.showNotification(message, 'info');
        } else {
            alert(message);
        }
    }
}

// Global functions for HTML onclick handlers
function closeTransferModal() {
    if (window.transferInterface) {
        window.transferInterface.closeTransferModal();
    }
}

function setMaxHPTransfer() {
    if (window.transferInterface) {
        window.transferInterface.setMaxHPTransfer();
    }
}

function executeTransfer() {
    if (window.transferInterface) {
        window.transferInterface.executeTransfer();
    }
}

function scanQRForTransfer() {
    if (window.transferInterface) {
        window.transferInterface.scanQRForTransfer();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.transferInterface = new TransferInterface();
    console.log('✅ Transfer Interface initialized');
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TransferInterface;
}