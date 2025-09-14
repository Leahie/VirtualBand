#!/usr/bin/env python3
"""
BandForge Startup Script
Starts both the backend Flask server and frontend development server
"""

import subprocess
import sys
import os
import time
import threading
import signal

def run_backend():
    """Start the Flask backend server"""
    print("🎵 Starting BandForge Backend...")
    os.chdir('Backend')
    try:
        subprocess.run([sys.executable, 'run_server.py'], check=True)
    except KeyboardInterrupt:
        print("\n🛑 Backend stopped")
    except Exception as e:
        print(f"❌ Backend error: {e}")

def run_frontend():
    """Start the React frontend development server"""
    print("🎨 Starting BandForge Frontend...")
    os.chdir('Frontend/bandmate-builder')
    try:
        subprocess.run(['npm', 'run', 'dev'], check=True)
    except KeyboardInterrupt:
        print("\n🛑 Frontend stopped")
    except Exception as e:
        print(f"❌ Frontend error: {e}")

def main():
    print("🚀 Starting BandForge - AI Band Builder")
    print("=" * 50)
    
    # Check if we're in the right directory
    if not os.path.exists('Backend') or not os.path.exists('Frontend'):
        print("❌ Please run this script from the VirtualBand root directory")
        sys.exit(1)
    
    # Start backend in a separate thread
    backend_thread = threading.Thread(target=run_backend, daemon=True)
    backend_thread.start()
    
    # Wait a moment for backend to start
    time.sleep(3)
    
    # Start frontend (this will block)
    try:
        run_frontend()
    except KeyboardInterrupt:
        print("\n🛑 Shutting down BandForge...")
        sys.exit(0)

if __name__ == '__main__':
    main()
