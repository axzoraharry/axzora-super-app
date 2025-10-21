/**
 * Mint/Burn Interface - Global Functions for Automatic HP Token Operations
 * Axzora Super App - One-Click Mint/Burn Functionality
 */

// Global functions for modal interactions
function closeMintModal() {
    if (window.blockchainInterface) {
        window.blockchainInterface.closeMintModal();
    }
}

function closeBurnModal() {
    if (window.blockchainInterface) {
        window.blockchainInterface.closeBurnModal();
    }
}

function setMaxHP() {
    if (window.blockchainInterface) {
        const usdtBalance = parseFloat(window.blockchainInterface.transactionData.usdtBalance);
        const maxHP = Math.floor((usdtBalance / 11) * 100) / 100; // Max HP based on USDT balance
        
        const hpAmountInput = document.getElementById('hpAmount');
        if (hpAmountInput) {
            hpAmountInput.value = maxHP.toFixed(2);
            window.blockchainInterface.updateMintCalculation();
        }
    }
}

function setMaxHPBurn() {
    if (window.blockchainInterface) {
        const hpBalance = parseFloat(window.blockchainInterface.transactionData.hpBalance);
        
        const burnHpAmountInput = document.getElementById('burnHpAmount');
        if (burnHpAmountInput) {
            burnHpAmountInput.value = hpBalance.toFixed(2);
            window.blockchainInterface.updateBurnCalculation();
        }
    }
}

async function executeAutoMint() {
    const hpAmount = document.getElementById('hpAmount')?.value;
    
    if (!hpAmount || parseFloat(hpAmount) <= 0) {
        alert('Please enter a valid HP amount to mint');
        return;
    }
    
    if (window.blockchainInterface) {
        try {
            await window.blockchainInterface.autoMintTokens(hpAmount);
        } catch (error) {
            console.error('Auto mint failed:', error);
        }
    } else {
        alert('Blockchain interface not available. Please refresh the page.');
    }
}

async function executeAutoBurn() {
    const hpAmount = document.getElementById('burnHpAmount')?.value;
    
    if (!hpAmount || parseFloat(hpAmount) <= 0) {
        alert('Please enter a valid HP amount to burn');
        return;
    }
    
    if (window.blockchainInterface) {
        try {
            await window.blockchainInterface.autoBurnTokens(hpAmount);
        } catch (error) {
            console.error('Auto burn failed:', error);
        }
    } else {
        alert('Blockchain interface not available. Please refresh the page.');
    }
}

// Auto-update calculations when amount changes
document.addEventListener('DOMContentLoaded', () => {
    // Set up input listeners for real-time calculation updates
    const hpAmountInput = document.getElementById('hpAmount');
    if (hpAmountInput) {
        hpAmountInput.addEventListener('input', () => {
            if (window.blockchainInterface) {
                window.blockchainInterface.updateMintCalculation();
            }
        });
    }
    
    const burnHpAmountInput = document.getElementById('burnHpAmount');
    if (burnHpAmountInput) {
        burnHpAmountInput.addEventListener('input', () => {
            if (window.blockchainInterface) {
                window.blockchainInterface.updateBurnCalculation();
            }
        });
    }
    
    // Close modal when clicking outside
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            if (e.target.id === 'mintModal') {
                closeMintModal();
            } else if (e.target.id === 'burnModal') {
                closeBurnModal();
            }
        }
    });
    
    // ESC key to close modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const mintModal = document.getElementById('mintModal');
            const burnModal = document.getElementById('burnModal');
            
            if (mintModal.classList.contains('show')) {
                closeMintModal();
            } else if (burnModal.classList.contains('show')) {
                closeBurnModal();
            }
        }
    });
    
    console.log('✅ Mint/Burn interface loaded and ready!');
});

// Voice command integration
window.addEventListener('voice-command', (event) => {
    const command = event.detail;
    
    if (command.type === 'mint' && command.params) {
        // Voice command: "mint 1 HP"
        if (command.params.amount) {
            if (window.blockchainInterface) {
                window.blockchainInterface.openMintModal();
                setTimeout(() => {
                    const hpAmountInput = document.getElementById('hpAmount');
                    if (hpAmountInput) {
                        hpAmountInput.value = command.params.amount;
                        window.blockchainInterface.updateMintCalculation();
                    }
                }, 100);
            }
        }
    } else if (command.type === 'burn' && command.params) {
        // Voice command: "burn 1 HP"
        if (command.params.amount) {
            if (window.blockchainInterface) {
                window.blockchainInterface.openBurnModal();
                setTimeout(() => {
                    const burnHpAmountInput = document.getElementById('burnHpAmount');
                    if (burnHpAmountInput) {
                        burnHpAmountInput.value = command.params.amount;
                        window.blockchainInterface.updateBurnCalculation();
                    }
                }, 100);
            }
        }
    }
});

// Export functions for global access
window.closeMintModal = closeMintModal;
window.closeBurnModal = closeBurnModal;
window.setMaxHP = setMaxHP;
window.setMaxHPBurn = setMaxHPBurn;
window.executeAutoMint = executeAutoMint;
window.executeAutoBurn = executeAutoBurn;