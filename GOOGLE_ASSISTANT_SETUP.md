# Google Assistant Integration Guide for Axzora Super App

This guide will help you integrate Google Assistant voice commands with your Axzora DApp, allowing users to control the app through voice commands like "Hey Google, ask Axzora to show my balance."

---

## Overview

The Google Assistant integration uses **IFTTT (If This Then That)** as a bridge between Google Assistant and your Axzora app. When a user speaks a command to Google Assistant, IFTTT triggers a webhook that calls your backend server, which then executes the corresponding action in your DApp.

### Architecture

```
User Voice → Google Assistant → IFTTT → Webhook → Your Server → Axzora DApp
```

---

## Prerequisites

Before you begin, ensure you have:

1. **IFTTT Account** - Free account at [ifttt.com](https://ifttt.com)
2. **Google Account** - For Google Assistant integration
3. **Public Server** - Your webhook endpoint must be publicly accessible (use ngrok for testing)
4. **Node.js** - For running the webhook server

---

## Step 1: Set Up the Webhook Server

### Install Dependencies

First, navigate to your backend directory and install the required packages:

```bash
cd backend
npm install express cors body-parser
```

### Start the Webhook Server

Run the Google Assistant webhook server:

```bash
node google-assistant-server.js
```

The server will start on port 3001 by default. You should see:

```
🚀 Google Assistant Bridge Server running on port 3001
📡 Webhook endpoint: http://localhost:3001/api/google-assistant/webhook
🔗 IFTTT endpoint: http://localhost:3001/api/ifttt/webhook/:command
```

### Make Your Server Publicly Accessible

For development and testing, use **ngrok** to expose your local server:

```bash
# Install ngrok (if not already installed)
npm install -g ngrok

# Expose port 3001
ngrok http 3001
```

Ngrok will provide you with a public URL like: `https://abc123.ngrok.io`

**Important:** Save this URL - you'll need it for IFTTT configuration.

---

## Step 2: Configure IFTTT

### Get Your Webhook Key

1. Go to [https://ifttt.com/maker_webhooks](https://ifttt.com/maker_webhooks)
2. Click **Documentation**
3. Copy your webhook key (it looks like: `dA1B2c3D4e5F6g7H8i9J0k`)

### Create IFTTT Applets

You need to create one applet for each voice command. Here's how:

#### Example: "Show Balance" Command

1. **Go to IFTTT** and click **Create**

2. **Configure the Trigger (IF)**:
   - Click **Add** next to "If This"
   - Search for and select **Google Assistant**
   - Choose **Say a simple phrase**
   - Fill in the phrases:
     - **What do you want to say?**: `show my balance`
     - **What's another way to say it?**: `check my balance`
     - **And another way?**: `what's my balance`
   - **What do you want the Assistant to say in response?**: `Checking your Axzora balance`
   - Click **Create trigger**

3. **Configure the Action (THEN)**:
   - Click **Add** next to "Then That"
   - Search for and select **Webhooks**
   - Choose **Make a web request**
   - Fill in the details:
     - **URL**: `https://your-ngrok-url.ngrok.io/api/ifttt/webhook/show_balance`
     - **Method**: `POST`
     - **Content Type**: `application/json`
     - **Body**: 
       ```json
       {
         "command": "show_balance",
         "userId": "{{GoogleAssistantUserId}}"
       }
       ```
   - Click **Create action**

4. **Finish**: Click **Continue** and then **Finish**

### Recommended Applets to Create

Create similar applets for these commands:

| Voice Command | Webhook Endpoint | Command JSON |
|--------------|------------------|--------------|
| "open my dashboard" | `/api/ifttt/webhook/open_dashboard` | `{"command": "open_dashboard"}` |
| "open my wallet" | `/api/ifttt/webhook/open_wallet` | `{"command": "open_wallet"}` |
| "show my balance" | `/api/ifttt/webhook/show_balance` | `{"command": "show_balance"}` |
| "mint tokens" | `/api/ifttt/webhook/mint_tokens` | `{"command": "mint_tokens"}` |
| "burn tokens" | `/api/ifttt/webhook/burn_tokens` | `{"command": "burn_tokens"}` |
| "transfer tokens" | `/api/ifttt/webhook/transfer_tokens` | `{"command": "transfer_tokens"}` |
| "stake tokens" | `/api/ifttt/webhook/stake_tokens` | `{"command": "stake_tokens"}` |
| "check my rewards" | `/api/ifttt/webhook/check_rewards` | `{"command": "check_rewards"}` |
| "make a payment" | `/api/ifttt/webhook/make_payment` | `{"command": "make_payment"}` |
| "check token price" | `/api/ifttt/webhook/check_price` | `{"command": "check_price"}` |

---

## Step 3: Integrate with Frontend

### Add the Bridge Script

Add the Google Assistant bridge script to your `index.html`:

```html
<!-- Add before closing </body> tag -->
<script src="google-assistant-bridge.js"></script>
```

### Initialize the Bridge

Add this to your main app initialization:

```javascript
// Initialize Google Assistant Bridge
if (window.googleAssistantBridge) {
    // Set your IFTTT webhook key
    window.googleAssistantBridge.setupIFTTT('YOUR_IFTTT_WEBHOOK_KEY');
    
    console.log('✅ Google Assistant integration ready');
}
```

### Connect Backend Responses to Frontend

Add a listener for webhook responses:

```javascript
// Listen for commands from backend
async function pollForCommands() {
    try {
        const response = await fetch('https://your-ngrok-url.ngrok.io/api/session/YOUR_SESSION_ID');
        const data = await response.json();
        
        if (data.success && data.pendingCommand) {
            await window.googleAssistantBridge.executeCommand(
                data.pendingCommand.action,
                data.pendingCommand.parameters
            );
        }
    } catch (error) {
        console.error('Error polling for commands:', error);
    }
}

// Poll every 2 seconds when app is active
setInterval(pollForCommands, 2000);
```

---

## Step 4: Testing

### Test Your Setup

1. **Start your servers**:
   ```bash
   # Terminal 1: Start backend webhook server
   cd backend
   node google-assistant-server.js
   
   # Terminal 2: Start ngrok
   ngrok http 3001
   
   # Terminal 3: Start frontend
   cd frontend
   python server.py
   ```

2. **Test with Google Assistant**:
   - Open Google Assistant on your phone or say "Hey Google"
   - Try a command: "Hey Google, show my balance"
   - Google Assistant should respond and trigger your webhook

3. **Check the logs**:
   - Watch your webhook server terminal for incoming requests
   - You should see: `📥 IFTTT command: show_balance`

### Troubleshooting

**Issue: Google Assistant doesn't respond**
- Check that your IFTTT applet is enabled
- Verify the trigger phrases match what you're saying
- Make sure you're logged into the same Google account

**Issue: Webhook not receiving requests**
- Verify ngrok is running and the URL is correct in IFTTT
- Check that your webhook server is running
- Test the webhook URL directly with curl:
  ```bash
  curl -X POST https://your-ngrok-url.ngrok.io/api/ifttt/webhook/show_balance \
    -H "Content-Type: application/json" \
    -d '{"command":"show_balance"}'
  ```

**Issue: Command executes but nothing happens in the app**
- Check browser console for errors
- Verify the frontend bridge is initialized
- Ensure the command mapping is correct

---

## Step 5: Production Deployment

### Deploy Your Webhook Server

For production, deploy your webhook server to a cloud platform:

#### Option A: Heroku

```bash
# Install Heroku CLI
npm install -g heroku

# Login and create app
heroku login
heroku create axzora-assistant-bridge

# Deploy
git add backend/google-assistant-server.js
git commit -m "Add Google Assistant webhook server"
git push heroku main

# Get your URL
heroku open
```

#### Option B: Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd backend
vercel --prod
```

#### Option C: AWS Lambda

Use the AWS Lambda deployment guide (see `AWS_LAMBDA_DEPLOYMENT.md` for details).

### Update IFTTT with Production URL

1. Go to each IFTTT applet
2. Click **Settings**
3. Update the webhook URL from ngrok to your production URL
4. Save changes

### Secure Your Webhook

Add authentication to your webhook endpoint:

```javascript
// In google-assistant-server.js
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'your-secret-key';

app.post('/api/ifttt/webhook/:command', (req, res) => {
    const authHeader = req.headers['authorization'];
    
    if (authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
        return res.status(401).send('Unauthorized');
    }
    
    // ... rest of the code
});
```

Update IFTTT webhook configuration to include the auth header:
- Add **Additional Headers**: `Authorization: Bearer your-secret-key`

---

## Available Voice Commands

Once set up, users can say:

### Navigation
- "Hey Google, ask Axzora to open my dashboard"
- "Hey Google, tell Axzora to open my wallet"
- "Hey Google, ask Axzora to show my portfolio"

### Token Operations
- "Hey Google, ask Axzora to show my balance"
- "Hey Google, tell Axzora to mint tokens"
- "Hey Google, ask Axzora to burn tokens"
- "Hey Google, tell Axzora to transfer tokens"
- "Hey Google, ask Axzora to stake tokens"

### Rewards & Pricing
- "Hey Google, ask Axzora to check my rewards"
- "Hey Google, tell Axzora to check token price"

### Payments
- "Hey Google, ask Axzora to make a payment"
- "Hey Google, tell Axzora to scan QR code"
- "Hey Google, ask Axzora to generate QR code"

### Security
- "Hey Google, tell Axzora to authenticate me"
- "Hey Google, ask Axzora to verify my identity"

---

## Advanced Features

### Custom Parameters

You can pass parameters in voice commands:

**IFTTT Configuration:**
- Phrase: "mint $ tokens"
- Body: `{"command": "mint_tokens", "amount": "{{NumberField}}"}`

**Usage:**
- "Hey Google, ask Axzora to mint 100 tokens"

### Response Feedback

Send responses back to Google Assistant:

```javascript
// In your frontend
async function sendResponseToAssistant(message) {
    await window.googleAssistantBridge.sendToAssistant('axzora_response', {
        message: message,
        timestamp: new Date().toISOString()
    });
}
```

Create an IFTTT applet that listens for the `axzora_response` event and speaks the message.

---

## Security Considerations

1. **Authentication**: Always verify user identity before executing sensitive commands
2. **Rate Limiting**: Implement rate limiting on your webhook endpoint
3. **HTTPS Only**: Never use HTTP for webhooks in production
4. **Secret Keys**: Store IFTTT keys and webhook secrets in environment variables
5. **Input Validation**: Validate all incoming webhook data
6. **Session Management**: Use secure session tokens

---

## Cost Considerations

- **IFTTT**: Free tier allows 2 applets. Pro plan ($2.50/month) for unlimited applets
- **ngrok**: Free for testing. Paid plans for production ($8/month)
- **Server Hosting**: Varies by platform (Heroku free tier, Vercel free tier, AWS Lambda pay-per-use)

---

## Support

For issues or questions:
- Check the troubleshooting section above
- Review server logs for error messages
- Test webhooks with curl or Postman
- Open an issue on GitHub

---

**Happy voice commanding! 🎤🚀**
