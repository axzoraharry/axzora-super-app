# Google Assistant Integration - Quick Reference

## Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install express cors body-parser dotenv
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env and add your IFTTT webhook key
```

### 3. Start the Server
```bash
node google-assistant-server.js
```

Or use the convenience script:
```bash
./start-google-assistant.sh
```

### 4. Expose with ngrok (for testing)
```bash
ngrok http 3001
```

## Files Added

- `google-assistant-server.js` - Webhook server that handles Google Assistant commands
- `package-google-assistant.json` - Dependencies for the webhook server
- `.env.example` - Configuration template
- `README-GOOGLE-ASSISTANT.md` - This file

## Frontend Integration

Add to your `frontend/index.html`:

```html
<script src="google-assistant-bridge.js"></script>
<script>
  // Initialize Google Assistant Bridge
  window.googleAssistantBridge.setupIFTTT('YOUR_IFTTT_KEY');
</script>
```

## IFTTT Setup

1. Create IFTTT account at https://ifttt.com
2. Get webhook key from https://ifttt.com/maker_webhooks
3. Create applets with:
   - **Trigger**: Google Assistant → Say a simple phrase
   - **Action**: Webhooks → Make a web request
   - **URL**: `https://your-ngrok-url.ngrok.io/api/ifttt/webhook/{command}`

## Available Commands

| Command | Endpoint |
|---------|----------|
| Show Balance | `/api/ifttt/webhook/show_balance` |
| Open Dashboard | `/api/ifttt/webhook/open_dashboard` |
| Open Wallet | `/api/ifttt/webhook/open_wallet` |
| Mint Tokens | `/api/ifttt/webhook/mint_tokens` |
| Burn Tokens | `/api/ifttt/webhook/burn_tokens` |
| Transfer Tokens | `/api/ifttt/webhook/transfer_tokens` |
| Stake Tokens | `/api/ifttt/webhook/stake_tokens` |
| Check Rewards | `/api/ifttt/webhook/check_rewards` |
| Check Price | `/api/ifttt/webhook/check_price` |

## Testing

Test webhook directly:
```bash
curl -X POST http://localhost:3001/api/ifttt/webhook/show_balance \
  -H "Content-Type: application/json" \
  -d '{"command":"show_balance"}'
```

## Documentation

See `../GOOGLE_ASSISTANT_SETUP.md` for complete setup instructions.

## Support

For issues, check:
1. Server logs in terminal
2. ngrok dashboard at http://localhost:4040
3. IFTTT activity log
4. Browser console for frontend errors
