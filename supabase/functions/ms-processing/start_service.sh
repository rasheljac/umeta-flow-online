
#!/bin/bash

# MS Processing Service Startup Script
echo "=== Starting MS Processing Service ==="

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "python_service.py" ]; then
    echo "Error: python_service.py not found. Make sure you're in the ms-processing directory."
    exit 1
fi

# Set default port
export PORT=${PORT:-8001}

echo "Installing/updating dependencies..."
pip3 install -r requirements.txt 2>/dev/null || {
    echo "Warning: Could not install from requirements.txt, trying manual installation..."
    python3 auto_setup.py
}

echo "Starting service on port $PORT..."

# Try to start the service
if command -v uvicorn &> /dev/null; then
    uvicorn python_service:app --host 0.0.0.0 --port $PORT --reload
else
    python3 python_service.py
fi
