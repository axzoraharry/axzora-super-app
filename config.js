/**
 * Configuration File for Axzora Super App
 * Update these values with your specific settings
 */

window.AXZORA_CONFIG = {
    // BSCScan API Configuration
    // Get your free API key from: https://bscscan.com/apis
    BSC_API_KEY: 'UGV3PURXCUVDHQQ64MDJABFUGWA6VTXWMZ',
    
    // Contract Addresses (Your Happy Paisa Token)
    HP_TOKEN_ADDRESS: '0x9A1BA34e3B23e258974baEE1E883BE9374A39276', // FIXED & DEPLOYED HP Contract - BSC Mainnet
    USDT_BSC_ADDRESS: '0x55d398326f99059fF775485246999027B3197955',
    
    // Network Configuration
    BSC_CHAIN_ID: '0x38', // 56 in hex
    BSC_RPC_URL: 'https://bsc-dataseed1.binance.org/',
    
    // API Endpoints
    API_ENDPOINTS: {
        BSCSCAN: 'https://api.bscscan.com/api',
        COINGECKO: 'https://api.coingecko.com/api/v3',
        DEXSCREENER: 'https://api.dexscreener.com/latest/dex'
    },
    
    // Happy Paisa Token Configuration
    HP_TOKEN_CONFIG: {
        NAME: 'Happy Paisa Token',
        SYMBOL: 'HP',
        DECIMALS: 18,
        FIXED_PRICE_USDT: '11.00', // 1 HP = 11 USDT
        COLLATERAL_RATIO: '105', // 105% collateral ratio
    },
    
    // Voice Recognition Settings
    VOICE_CONFIG: {
        LANGUAGE: 'en-US',
        CONFIDENCE_THRESHOLD: 0.6,
        CONTINUOUS: true,
        INTERIM_RESULTS: true
    },
    
    // Biometric Settings
    BIOMETRIC_CONFIG: {
        CONFIDENCE_THRESHOLD: 70,
        SECURITY_LEVEL_THRESHOLD: 80,
        FACE_DETECTION_INTERVAL: 100, // milliseconds
        BLINK_THRESHOLD: 0.25
    },
    
    // UI Settings
    UI_CONFIG: {
        THEME: 'dark',
        ANIMATION_DURATION: 300,
        NOTIFICATION_DURATION: 4000,
        AUTO_REFRESH_INTERVAL: 30000 // 30 seconds
    },
    
    // Development Settings
    DEV_CONFIG: {
        ENABLE_CONSOLE_LOGS: true,
        MOCK_DATA_FALLBACK: false,
        DEBUG_MODE: true
    }
};

// Instructions for setup:
console.log(`
🔧 Axzora Super App Configuration
================================

To set up real BSC data integration:

1. Get BSCScan API Key:
   - Visit: https://bscscan.com/apis
   - Sign up for free account
   - Generate API key
   - Replace 'YourBSCScanAPIKeyHere' above

2. Verify Contract Addresses:
   - HP Token: ${window.AXZORA_CONFIG.HP_TOKEN_ADDRESS}
   - USDT BSC: ${window.AXZORA_CONFIG.USDT_BSC_ADDRESS}

3. Network Settings:
   - Chain ID: ${window.AXZORA_CONFIG.BSC_CHAIN_ID} (BSC Mainnet)
   - RPC URL: ${window.AXZORA_CONFIG.BSC_RPC_URL}

4. Features Enabled:
   ✅ Real-time BSC data
   ✅ Live token transactions
   ✅ Market cap calculation
   ✅ Holder count tracking
   ✅ 24h volume calculation
   ✅ BNB price updates

Happy coding! 🚀
`);