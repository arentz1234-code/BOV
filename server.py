#!/usr/bin/env python3
"""
Simple HTTP server for the BOV Generator
Run with: python3 server.py
Then open: http://localhost:8000
"""

import http.server
import socketserver
import webbrowser
import os

PORT = 8000

# Change to the directory containing this script
os.chdir(os.path.dirname(os.path.abspath(__file__)))

Handler = http.server.SimpleHTTPRequestHandler

# Add proper MIME types
Handler.extensions_map.update({
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.html': 'text/html',
})

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"\n{'='*50}")
    print(f"  BOV Generator Server Running")
    print(f"{'='*50}")
    print(f"\n  Open your browser to: http://localhost:{PORT}")
    print(f"\n  Press Ctrl+C to stop the server")
    print(f"{'='*50}\n")

    # Open browser automatically
    webbrowser.open(f'http://localhost:{PORT}')

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\nServer stopped.")
