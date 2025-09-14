#!/usr/bin/env python3
"""
BandForge Backend Server
Run this script to start the Flask API server
"""

import os
import sys
from app import app

if __name__ == '__main__':
    # Ensure we're in the Backend directory
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(backend_dir)
    
    print("🎵 Starting BandForge Backend Server...")
    print("📍 Backend directory:", backend_dir)
    print("🌐 Server will be available at: http://localhost:5000")
    print("📡 API endpoints:")
    print("   - POST /api/upload - Upload MIDI file")
    print("   - POST /api/generate-band - Generate band members")
    print("   - POST /api/generate-ai-music - Generate AI music")
    print("   - POST /api/combine-music - Combine all music")
    print("   - GET /api/audio/<filename> - Serve audio files")
    print("   - GET /api/health - Health check")
    print("\n" + "="*50)
    
    try:
        app.run(debug=True, host='0.0.0.0', port=5000)
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        sys.exit(1)
