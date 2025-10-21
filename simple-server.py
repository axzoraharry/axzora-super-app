#!/usr/bin/env python3
"""
Simple HTTP Server for Axzora Super App Frontend - No Unicode
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
    time.sleep(2)
    url = f"http://localhost:{port}"
    print(f"Opening browser: {url}")
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
    
    print("Starting Axzora Super App Local Server...")
    print(f"Serving from: {os.getcwd()}")
    print(f"Server running at: http://localhost:{PORT}")
    print("Press Ctrl+C to stop the server")
    print("="*50)
    
    # Start browser opening in a separate thread
    browser_thread = threading.Thread(target=open_browser, args=(PORT,))
    browser_thread.daemon = True
    browser_thread.start()
    
    try:
        with socketserver.TCPServer(("", PORT), CORSHTTPRequestHandler) as httpd:
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped by user")
        sys.exit(0)

if __name__ == "__main__":
    main()