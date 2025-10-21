#!/usr/bin/env python3
"""
Simple HTTP Server for Axzora Super App Frontend
Serves the frontend files with proper CORS headers for local development
"""

import http.server
import socketserver
import webbrowser
import threading
import time
import os
import sys

class CORSHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

def open_browser(port):
    """Open the default web browser after a short delay"""
    time.sleep(2)  # Wait for server to start
    url = f"http://localhost:{port}"
    print(f"\n🌐 Opening Axzora Super App in your default browser...")
    print(f"   URL: {url}")
    webbrowser.open(url)

def main():
    PORT = 8000
    
    # Try to find an available port
    for port in range(8000, 8010):
        try:
            with socketserver.TCPServer(("", port), CORSHTTPRequestHandler) as httpd:
                PORT = port
                break
        except OSError:
            continue
    
    print("🚀 Starting Axzora Super App Local Server...")
    print(f"📁 Serving from: {os.getcwd()}")
    print(f"🌍 Server running at: http://localhost:{PORT}")
    print(f"📱 Access from mobile: http://{get_local_ip()}:{PORT}")
    print("\n" + "="*60)
    print("🎉 AXZORA SUPER APP - LOCAL DEVELOPMENT SERVER")
    print("="*60)
    print("📋 Features Available:")
    print("   🔐 Biometric Face Recognition")
    print("   🎤 Voice Commands & Speech Recognition") 
    print("   🤖 AI Avatar (Mr. Happy) with Expressions")
    print("   🔗 Blockchain Integration (MetaMask)")
    print("   💰 Happy Paisa Token Operations")
    print("   📱 Responsive Mobile-First Design")
    print("\n📝 Setup Instructions:")
    print("   1. Allow camera permissions for face recognition")
    print("   2. Allow microphone permissions for voice commands")
    print("   3. Install MetaMask for blockchain features")
    print("   4. Say 'Hello Mr Happy' to test voice commands")
    print("\n⚠️  Important Notes:")
    print("   • Use HTTPS in production for camera/microphone access")
    print("   • Some features need MetaMask wallet installed")
    print("   • Voice commands work best in quiet environment")
    print("\n🔧 Press Ctrl+C to stop the server")
    print("="*60)
    
    # Start browser opening in a separate thread
    browser_thread = threading.Thread(target=open_browser, args=(PORT,))
    browser_thread.daemon = True
    browser_thread.start()
    
    try:
        # Start the server
        with socketserver.TCPServer(("", PORT), CORSHTTPRequestHandler) as httpd:
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\n🛑 Server stopped by user")
        print("👋 Thank you for using Axzora Super App!")
        sys.exit(0)

def get_local_ip():
    """Get the local IP address"""
    import socket
    try:
        # Connect to a remote server to get local IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "localhost"

if __name__ == "__main__":
    main()