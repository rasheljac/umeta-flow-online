
#!/usr/bin/env python3
"""
Automatic setup script for the MS Processing Service
This script handles dependency installation and service startup
"""

import os
import sys
import subprocess
import time
import requests
from pathlib import Path

def install_dependencies():
    """Install required Python packages"""
    print("Installing Python dependencies...")
    
    # Essential packages that should always work
    essential_packages = [
        "fastapi==0.104.1",
        "uvicorn==0.24.0", 
        "python-multipart==0.0.6",
        "numpy==1.24.3",
        "pandas==2.0.3",
        "scipy==1.11.3",
        "statsmodels"
    ]
    
    for package in essential_packages:
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", package])
            print(f"✓ Installed {package}")
        except subprocess.CalledProcessError as e:
            print(f"✗ Failed to install {package}: {e}")
    
    # Try to install PyOpenMS (might fail on some systems)
    print("\nAttempting to install PyOpenMS...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pyopenms==3.1.0"])
        print("✓ PyOpenMS installed successfully")
        return True
    except subprocess.CalledProcessError:
        print("⚠ PyOpenMS installation failed - service will use fallback algorithms")
        return False

def check_service_health(port=8001, max_retries=30):
    """Check if the service is running and healthy"""
    print(f"Checking service health on port {port}...")
    
    for i in range(max_retries):
        try:
            response = requests.get(f"http://localhost:{port}/health", timeout=5)
            if response.status_code == 200:
                data = response.json()
                print(f"✓ Service is healthy!")
                print(f"  PyOpenMS available: {data.get('pyopenms_available', False)}")
                print(f"  Version: {data.get('version', 'unknown')}")
                return True
        except requests.exceptions.RequestException:
            pass
        
        if i < max_retries - 1:
            print(f"  Waiting for service... ({i+1}/{max_retries})")
            time.sleep(2)
    
    print("✗ Service health check failed")
    return False

def start_service():
    """Start the MS processing service"""
    print("Starting MS Processing Service...")
    
    # Set environment variables
    os.environ.setdefault("PORT", "8001")
    os.environ.setdefault("HOST", "0.0.0.0")
    
    try:
        # Import and run the service
        from python_service import app
        import uvicorn
        
        print("Service starting on http://localhost:8001")
        uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info")
        
    except ImportError as e:
        print(f"✗ Failed to import service: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"✗ Failed to start service: {e}")
        sys.exit(1)

def main():
    """Main setup and startup routine"""
    print("=== MS Processing Service Auto Setup ===")
    
    # Install dependencies
    pyopenms_available = install_dependencies()
    
    if pyopenms_available:
        print("\n✓ Full PyOpenMS setup completed")
    else:
        print("\n⚠ Fallback setup completed (PyOpenMS unavailable)")
    
    print("\nStarting service...")
    start_service()

if __name__ == "__main__":
    main()
