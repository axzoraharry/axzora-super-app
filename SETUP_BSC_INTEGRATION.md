# 🔗 BSC Integration Setup Guide

Follow these steps to enable **real BSC data** in your Axzora Super App:

## 🔑 1. Get BSCScan API Key (Free)

1. Visit **[BSCScan APIs](https://bscscan.com/apis)**
2. Click **"Sign Up"** for a free account
3. Verify your email
4. Go to **"API-KEYs"** section
5. Create a new API key
6. Copy the generated key

## ⚙️ 2. Configure Your App

1. Open `config.js` file
2. Replace `'YourBSCScanAPIKeyHere'` with your actual API key:

```javascript
BSC_API_KEY: 'ABC123XYZ789...', // Your actual API key here
```

## 🏭 3. Verify Contract Addresses

Your Happy Paisa Token contract is already configured:
- **HP Token**: `0xf99ae6F3234b5E7f247BD12A8a59668Aa479E560`
- **USDT BSC**: `0x55d398326f99059fF775485246999027B3197955`

If you need to change these, update them in `config.js`.

## 🚀 4. Launch the App

Run the app with your server:

```bash
# Option 1: Use the batch file
launch-axzora.bat

# Option 2: Python server
python server.py

# Option 3: Alternative
python -m http.server 8000
```

## 📊 5. Real Data Features Enabled

Once configured, you'll get:

✅ **Real-time BNB prices** from CoinGecko  
✅ **Live HP token transactions** from BSCScan  
✅ **Accurate total supply** from your contract  
✅ **Current collateral ratio** from your contract  
✅ **Market cap calculation** (Supply × Price)  
✅ **24h transaction volume** from recent BSC transactions  
✅ **Token holder count** (estimated)  

## 🔍 6. Testing Real Data

1. **Connect MetaMask** to BSC Mainnet
2. **Connect your wallet** that has HP tokens
3. **Check dashboard** - you should see:
   - Your real HP token balance
   - Your real USDT balance  
   - Your real BNB balance
   - Live market data
   - Recent HP token transactions

## 🌐 7. API Rate Limits

**Free BSCScan API**: 5 calls/second, 100,000 calls/day

The app is optimized to stay within these limits:
- Market data updates every 30 seconds
- Transaction history loads on demand
- Smart caching to reduce API calls

## 🐛 8. Troubleshooting

### No Data Showing
- Check browser console for API errors
- Verify your BSCScan API key is valid
- Ensure you're connected to BSC network

### API Rate Limit Exceeded
- Wait a few minutes for rate limit reset
- Consider getting BSCScan Pro account for higher limits

### Wrong Token Data
- Verify contract address in `config.js`
- Make sure you're on BSC Mainnet (Chain ID: 56)

## 📈 9. Advanced Features

For production use, consider:
- **Premium BSCScan API** for higher rate limits
- **Multiple API providers** for redundancy  
- **Real-time WebSocket** connections for live updates
- **Price oracles** for more accurate pricing

## ✅ 10. Verification Checklist

Before going live:
- [ ] BSCScan API key configured
- [ ] Contract addresses verified
- [ ] MetaMask connected to BSC
- [ ] Real balances displaying correctly
- [ ] Transaction history loading
- [ ] Market data updating
- [ ] Voice commands working
- [ ] Camera permissions granted

---

**Your Axzora Super App now uses 100% real BSC data! 🎉**

No more mock data - everything is live from the blockchain!