#!/usr/bin/env python3
"""
Test script for BandForge API endpoints
"""

import requests
import json
import os

BASE_URL = "http://localhost:5000"

def test_health():
    """Test health check endpoint"""
    print("🔍 Testing health check...")
    try:
        response = requests.get(f"{BASE_URL}/api/health")
        if response.status_code == 200:
            print("✅ Health check passed")
            print(f"   Response: {response.json()}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Health check error: {e}")

def test_generate_band():
    """Test band generation endpoint"""
    print("\n🔍 Testing band generation...")
    try:
        response = requests.post(f"{BASE_URL}/api/generate-band", 
                               json={"instrument": "piano"})
        if response.status_code == 200:
            data = response.json()
            print("✅ Band generation passed")
            print(f"   Generated instruments: {data.get('band_instruments', [])}")
        else:
            print(f"❌ Band generation failed: {response.status_code}")
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"❌ Band generation error: {e}")

def test_upload():
    """Test file upload endpoint"""
    print("\n🔍 Testing file upload...")
    
    # Create a dummy MIDI file for testing
    dummy_midi = b"MThd\x00\x00\x00\x06\x00\x01\x00\x01\x00\x80MTrk\x00\x00\x00\x0b\x00\xff\x2f\x00"
    
    try:
        files = {'file': ('test.mid', dummy_midi, 'audio/midi')}
        data = {'instrument': 'piano'}
        
        response = requests.post(f"{BASE_URL}/api/upload", 
                               files=files, data=data)
        if response.status_code == 200:
            data = response.json()
            print("✅ File upload passed")
            print(f"   Session ID: {data.get('session_id')}")
            print(f"   Instrument: {data.get('instrument')}")
        else:
            print(f"❌ File upload failed: {response.status_code}")
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"❌ File upload error: {e}")

def main():
    print("🧪 BandForge API Test Suite")
    print("=" * 40)
    
    # Test all endpoints
    test_health()
    test_generate_band()
    test_upload()
    
    print("\n" + "=" * 40)
    print("🏁 Test suite completed")

if __name__ == '__main__':
    main()
