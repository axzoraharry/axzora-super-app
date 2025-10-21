# 🧪 HP Token Minting Fix - Test Checklist

## Pre-Test Setup ✅
- [ ] Frontend is open at http://localhost:8000/frontend/
- [ ] MetaMask is installed and configured
- [ ] Connected to BSC Mainnet (Network ID: 56)
- [ ] Have some BNB for gas fees (at least 0.001 BNB)
- [ ] Have some USDT for testing (at least 15 USDT recommended)

## 🔗 Connection Test
1. [ ] Click "Connect Wallet" button
2. [ ] MetaMask should prompt for connection
3. [ ] After connection, verify:
   - [ ] Wallet address shows correctly (0x...abc format)
   - [ ] HP balance loads (may be 0.00)
   - [ ] USDT balance loads (should show your actual USDT)
   - [ ] BNB balance loads

## 🏦 Minting Test - CRITICAL TEST CASE

### Test Case 1: Mint 0.1 HP Token (Safest Test)
1. [ ] Click "Mint HP" button or mint modal
2. [ ] Enter `0.1` in the HP amount field
3. [ ] Verify the USDT calculation shows: **Required: 1.16 USDT (includes 5% reserve)**
4. [ ] Click "Auto Mint HP" button
5. [ ] **Expected Steps:**
   - [ ] Step 1: Checking USDT allowance...
   - [ ] Step 2: Approving USDT (if needed) - MetaMask popup
   - [ ] Step 3: Minting HP tokens - MetaMask popup
6. [ ] **Expected Result:**
   - [ ] Success message: "Successfully minted 0.1 HP tokens using 1.16 USDT"
   - [ ] HP balance increases by **exactly 0.1 HP**
   - [ ] USDT balance decreases by **approximately 1.16 USDT**

### Test Case 2: Mint 1 HP Token (Full Test)
1. [ ] Click "Mint HP" button again
2. [ ] Enter `1.0` in the HP amount field  
3. [ ] Verify the USDT calculation shows: **Required: 11.55 USDT (includes 5% reserve)**
4. [ ] Click "Auto Mint HP" button
5. [ ] **Expected Result:**
   - [ ] Success message: "Successfully minted 1.0 HP tokens using 11.55 USDT"
   - [ ] HP balance increases by **exactly 1.0 HP**
   - [ ] USDT balance decreases by **approximately 11.55 USDT**

## ❌ What Should NOT Happen (Previous Bugs)
- [ ] ❌ HP balance should NOT show 11 HP when you mint 1 HP
- [ ] ❌ USDT requirement should NOT be calculated as just 1 USDT
- [ ] ❌ Transaction should NOT fail with "execution reverted"
- [ ] ❌ MetaMask should NOT show HP token with wrong decimals

## 🔥 Burn Test (Reverse Verification)
1. [ ] Click "Burn HP" button
2. [ ] Enter the amount you just minted (e.g., `0.1` or `1.0`)
3. [ ] Verify: "You'll receive: X USDT" (11.00 USDT per HP, no reserve on burn)
4. [ ] Click "Auto Burn HP"
5. [ ] **Expected Result:**
   - [ ] HP balance decreases by the burned amount
   - [ ] USDT balance increases by 11.00 USDT per HP burned

## 📊 Balance Verification
### Check on BSCScan (Most Reliable)
1. [ ] Go to https://bscscan.com/
2. [ ] Search your wallet address
3. [ ] Click "Token" tab
4. [ ] Find "Happy Paisa Token (HP)" 
5. [ ] Verify the HP amount matches what you see in the frontend

### Check in MetaMask
1. [ ] Go to MetaMask assets
2. [ ] If HP token not visible, add it:
   - [ ] Click "Import tokens"
   - [ ] Token Contract: `0xf99ae6F3234b5E7f247BD12A8a59668Aa479E560`
   - [ ] Symbol: HP
   - [ ] Decimals: 18
3. [ ] Verify HP balance matches BSCScan

## 🚨 Troubleshooting
If tests fail:
1. [ ] Check console for error messages (F12 → Console)
2. [ ] Verify network is BSC Mainnet (not testnet)
3. [ ] Check USDT balance is sufficient
4. [ ] Check BNB balance for gas fees
5. [ ] Try refreshing the page and reconnecting

## ✅ Success Criteria
- [ ] **Math is correct**: 1 HP costs 11.55 USDT to mint
- [ ] **Display is correct**: HP balance shows the right amount
- [ ] **MetaMask is correct**: HP token appears with proper decimals
- [ ] **Reversible**: Burn function gives back 11.00 USDT per HP
- [ ] **BSCScan confirms**: Blockchain shows correct token amounts

---
## 🎯 Key Fix Verification
The main fix was changing the contract call from:
```javascript
❌ OLD: mintTokens(usdtAmountInWei)  // Wrong parameter type
✅ NEW: mintTokens(hpAmountInWei)    // Correct parameter type
```

If the test passes, it confirms the core decimal conversion bug is fixed!