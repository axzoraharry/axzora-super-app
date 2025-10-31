#!/bin/bash

# Quick Start Script for Google Assistant Integration
# This script sets up and starts the Google Assistant webhook server

echo "🚀 Starting Axzora Google Assistant Integration"
echo "================================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"
echo ""

# Navigate to backend directory
cd backend || exit 1

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install express cors body-parser dotenv
    echo ""
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found. Creating from example..."
    cp .env.example .env
    echo "📝 Please edit backend/.env and add your IFTTT webhook key"
    echo ""
fi

# Start the server
echo "🎤 Starting Google Assistant webhook server..."
echo "📡 Server will be available at: http://localhost:3001"
echo ""
echo "Next steps:"
echo "1. Open another terminal and run: ngrok http 3001"
echo "2. Copy the ngrok URL"
echo "3. Configure IFTTT applets with the ngrok URL"
echo "4. Say 'Hey Google, ask Axzora to show my balance'"
echo ""
echo "Press Ctrl+C to stop the server"
echo "================================================"
echo ""

node google-assistant-server.js
