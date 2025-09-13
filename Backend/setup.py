#!/usr/bin/env python3
"""
Setup script for VirtualBand
Run this to install dependencies and set up the environment
"""

import subprocess
import sys
import os

def install_requirements():
    """Install required packages"""
    print("📦 Installing required packages...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ All packages installed successfully!")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error installing packages: {e}")
        return False
    return True

def check_api_key():
    """Check if API key is set"""
    api_key = os.getenv('TANDEM_API_KEY')
    if not api_key:
        print("⚠️  TANDEM_API_KEY environment variable not set!")
        print("Please set it with: set TANDEM_API_KEY=your_key_here")
        print("Get your API key from: https://tandemn.com/")
        return False
    else:
        print("✅ API key found!")
        return True

def main():
    print("🎵 VirtualBand Setup")
    print("=" * 50)
    
    # Install requirements
    if not install_requirements():
        return
    
    # Check API key
    check_api_key()
    
    print("\n🚀 Setup complete! You can now run:")
    print("python test.py")
    print("\nMake sure to set your TANDEM_API_KEY first!")

if __name__ == "__main__":
    main()
