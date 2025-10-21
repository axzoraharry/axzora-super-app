/**
 * HP Token Price Display Enhancement
 * Shows accurate USD values since MetaMask shows "No conversion available"
 */

class HPPriceDisplay {
    constructor() {
        this.HP_PRICE_USD = 11.55; // Pegged to 1000 INR ≈ $11.55
        this.HP_PRICE_INR = 1000;  // Pegged to 1000 INR
        this.updateInterval = null;
        this.initialize();
    }

    initialize() {
        console.log('🔄 Initializing HP Price Display...');
        this.startPriceUpdates();
        this.enhanceTokenDisplays();
    }

    startPriceUpdates() {
        // Update HP prices every 30 seconds
        this.updateInterval = setInterval(() => {
            this.updateAllHPDisplays();
        }, 30000);

        // Initial update
        this.updateAllHPDisplays();
    }

    async updateAllHPDisplays() {
        try {
            // Update main balance display
            await this.updateMainBalanceDisplay();
            
            // Update staking displays
            this.updateStakingDisplays();
            
            // Update modal displays
            this.updateModalDisplays();
            
            // Update sidebar displays
            this.updateSidebarDisplays();
            
        } catch (error) {
            console.error('Error updating HP displays:', error);
        }
    }

    async updateMainBalanceDisplay() {
        if (!window.blockchainInterface || !window.blockchainInterface.isWalletConnected()) {
            return;
        }

        try {
            const transactionData = window.blockchainInterface.getTransactionData();
            const hpBalance = parseFloat(transactionData.hpBalance || '0');
            const usdValue = this.calculateUSDValue(hpBalance);
            const inrValue = this.calculateINRValue(hpBalance);

            // Update HP balance card
            const hpBalanceElement = document.getElementById('hpBalance');
            const hpValueElement = document.getElementById('hpValue');
            
            if (hpBalanceElement) {
                hpBalanceElement.textContent = hpBalance.toFixed(2);
            }
            
            if (hpValueElement) {
                hpValueElement.innerHTML = `
                    <span class="usd-value">$${usdValue.toFixed(2)}</span>
                    <span class="inr-value">₹${inrValue.toFixed(0)}</span>
                `;
            }

            // Update any other HP displays with class 'hp-balance-display'
            const hpDisplays = document.querySelectorAll('.hp-balance-display');
            hpDisplays.forEach(display => {
                display.innerHTML = `
                    <span class="hp-amount">${hpBalance.toFixed(2)} HP</span>
                    <span class="usd-equivalent">($${usdValue.toFixed(2)})</span>
                `;
            });

        } catch (error) {
            console.error('Error updating main balance display:', error);
        }
    }

    updateStakingDisplays() {
        // Update staking button with available amount in USD
        const stakeAvailableAmount = document.getElementById('stakeAvailableAmount');
        const sidebarStakeAmount = document.getElementById('sidebarStakeAmount');
        
        if (window.hpStaking && window.hpStaking.availableToStake) {
            const availableHP = window.hpStaking.availableToStake;
            const availableUSD = this.calculateUSDValue(availableHP);
            
            if (stakeAvailableAmount) {
                stakeAvailableAmount.textContent = `${availableHP.toFixed(2)} HP ($${availableUSD.toFixed(0)})`;
            }
            
            if (sidebarStakeAmount) {
                sidebarStakeAmount.textContent = `Max: ${availableHP.toFixed(1)} HP ($${availableUSD.toFixed(0)})`;
            }
        }

        // Update staking overview values
        this.updateStakingOverview();
    }

    updateStakingOverview() {
        if (!window.hpStaking) return;

        const totalStaked = window.hpStaking.getTotalStakedAmount ? window.hpStaking.getTotalStakedAmount() : 0;
        const pendingRewards = window.hpStaking.getTotalPendingRewards ? window.hpStaking.getTotalPendingRewards() : 0;

        const totalStakedUSD = this.calculateUSDValue(totalStaked);
        const pendingRewardsUSD = this.calculateUSDValue(pendingRewards);

        // Update sidebar staking overview
        const totalStakedElement = document.getElementById('totalStakedHP');
        const totalStakedUSDElement = document.getElementById('totalStakedUSD');
        const pendingRewardsElement = document.getElementById('pendingRewards');
        const pendingRewardsUSDElement = document.getElementById('pendingRewardsUSD');

        if (totalStakedElement) {
            totalStakedElement.textContent = `${totalStaked.toFixed(2)} HP`;
        }
        
        if (totalStakedUSDElement) {
            totalStakedUSDElement.textContent = `($${totalStakedUSD.toFixed(2)})`;
        }
        
        if (pendingRewardsElement) {
            pendingRewardsElement.textContent = `${pendingRewards.toFixed(4)} HP`;
        }
        
        if (pendingRewardsUSDElement) {
            pendingRewardsUSDElement.textContent = `($${pendingRewardsUSD.toFixed(2)})`;
        }
    }

    updateModalDisplays() {
        // Update staking modal displays
        const modalAvailableStake = document.getElementById('modalAvailableStake');
        if (modalAvailableStake && window.hpStaking && window.hpStaking.availableToStake) {
            const availableHP = window.hpStaking.availableToStake;
            const availableUSD = this.calculateUSDValue(availableHP);
            modalAvailableStake.textContent = `${availableHP.toFixed(2)} HP ($${availableUSD.toFixed(0)})`;
        }

        // Update other modal HP displays
        const modalElements = [
            'stakeHpBalance',
            'burnHpBalance', 
            'transferHpBalance'
        ];

        modalElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                const hpText = element.textContent;
                const hpAmount = parseFloat(hpText.replace(/[^\d.]/g, ''));
                if (!isNaN(hpAmount) && hpAmount > 0) {
                    const usdValue = this.calculateUSDValue(hpAmount);
                    element.innerHTML = `${hpAmount.toFixed(2)} HP <span class="usd-value">($${usdValue.toFixed(2)})</span>`;
                }
            }
        });
    }

    updateSidebarDisplays() {
        // Update any HP price references in sidebar
        const hpPriceElements = document.querySelectorAll('.hp-price-display');
        hpPriceElements.forEach(element => {
            element.textContent = `$${this.HP_PRICE_USD}`;
        });
    }

    enhanceTokenDisplays() {
        // Add CSS for enhanced displays
        this.addCustomStyles();
        
        // Create price ticker display
        this.createPriceTicker();
    }

    createPriceTicker() {
        // Create a small price ticker for HP
        const existingTicker = document.getElementById('hpPriceTicker');
        if (existingTicker) return;

        const ticker = document.createElement('div');
        ticker.id = 'hpPriceTicker';
        ticker.className = 'hp-price-ticker';
        ticker.innerHTML = `
            <div class="ticker-content">
                <span class="ticker-symbol">HP</span>
                <span class="ticker-price">$${this.HP_PRICE_USD}</span>
                <span class="ticker-peg">≈ ₹${this.HP_PRICE_INR}</span>
                <span class="ticker-status stable">STABLE</span>
            </div>
        `;

        // Add to header if available
        const header = document.querySelector('.main-header .header-center');
        if (header) {
            header.appendChild(ticker);
        }
    }

    addCustomStyles() {
        const existingStyles = document.getElementById('hpPriceStyles');
        if (existingStyles) return;

        const styles = document.createElement('style');
        styles.id = 'hpPriceStyles';
        styles.textContent = `
            /* HP Price Display Enhancements */
            .hp-balance-display {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 4px;
            }

            .hp-amount {
                font-weight: 600;
                color: var(--text-color);
            }

            .usd-equivalent {
                font-size: 0.9em;
                color: var(--text-secondary);
                opacity: 0.8;
            }

            .usd-value {
                color: #10b981;
                font-weight: 500;
                margin-left: 4px;
            }

            .inr-value {
                color: #6b7280;
                font-size: 0.85em;
                margin-left: 4px;
            }

            /* Price Ticker */
            .hp-price-ticker {
                background: rgba(16, 185, 129, 0.1);
                border: 1px solid rgba(16, 185, 129, 0.3);
                border-radius: 8px;
                padding: 8px 12px;
                margin: 0 10px;
            }

            .ticker-content {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 0.9em;
            }

            .ticker-symbol {
                font-weight: 700;
                color: var(--accent-color);
            }

            .ticker-price {
                font-weight: 600;
                color: #10b981;
            }

            .ticker-peg {
                color: var(--text-secondary);
                font-size: 0.85em;
            }

            .ticker-status {
                background: #10b981;
                color: white;
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 0.75em;
                font-weight: 600;
            }

            .ticker-status.stable {
                background: #10b981;
                animation: pulse-stable 2s infinite;
            }

            @keyframes pulse-stable {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }

            /* Enhanced balance cards */
            .balance-card.hp-card .card-value {
                display: flex;
                flex-direction: column;
                gap: 2px;
            }

            .balance-card.hp-card .card-value .usd-value {
                font-size: 1.1em;
                font-weight: 600;
                color: #10b981;
            }

            .balance-card.hp-card .card-value .inr-value {
                font-size: 0.9em;
                color: #6b7280;
            }

            /* Staking value displays */
            .staking-stat .stat-value {
                display: flex;
                flex-direction: column;
                align-items: flex-start;
            }

            .staking-stat .stat-usd {
                font-size: 0.8em;
                color: #10b981;
                font-weight: 500;
            }
        `;

        document.head.appendChild(styles);
    }

    calculateUSDValue(hpAmount) {
        return hpAmount * this.HP_PRICE_USD;
    }

    calculateINRValue(hpAmount) {
        return hpAmount * this.HP_PRICE_INR;
    }

    getHPPrice() {
        return {
            usd: this.HP_PRICE_USD,
            inr: this.HP_PRICE_INR,
            symbol: 'HP',
            name: 'Happy Paisa Token',
            type: 'Stablecoin',
            peg: '1000 INR'
        };
    }

    // Public methods for external use
    formatHPValue(hpAmount, showINR = false) {
        const usdValue = this.calculateUSDValue(hpAmount);
        const inrValue = this.calculateINRValue(hpAmount);
        
        if (showINR) {
            return `${hpAmount.toFixed(2)} HP ($${usdValue.toFixed(2)} / ₹${inrValue.toFixed(0)})`;
        } else {
            return `${hpAmount.toFixed(2)} HP ($${usdValue.toFixed(2)})`;
        }
    }

    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }
}

// Initialize HP Price Display when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.hpPriceDisplay = new HPPriceDisplay();
    console.log('🔄 HP Price Display initialized');
});

// Update displays when wallet connects
window.addEventListener('wallet-connected', () => {
    if (window.hpPriceDisplay) {
        setTimeout(() => window.hpPriceDisplay.updateAllHPDisplays(), 1000);
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HPPriceDisplay;
}