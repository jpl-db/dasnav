#!/bin/bash
# Local development script - runs both backend and frontend

echo "🚀 Starting Databricks App (Hybrid Mode)"
echo "=========================================="
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "✅ Created .env file"
fi

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🐍 Activating Python environment..."
source venv/bin/activate

# Install/update backend dependencies
echo "📥 Installing backend dependencies..."
pip install -q -r backend/requirements.txt

# Start backend API
echo ""
echo "🔧 Starting Backend API (port 8001)..."
cd backend
python api.py &
BACKEND_PID=$!
cd ..

echo "✅ Backend started (PID: $BACKEND_PID)"
echo ""

# Check if frontend exists
if [ -f "frontend/package.json" ]; then
    echo "🎨 Starting Frontend..."
    cd frontend
    
    # Install frontend dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "📥 Installing frontend dependencies..."
        npm install
    fi
    
    # Start frontend with real backend (no mock data)
    VITE_USE_MOCK=false npm run dev &
    FRONTEND_PID=$!
    cd ..
    
    echo "✅ Frontend started (PID: $FRONTEND_PID)"
    echo ""
    echo "🌐 App running at:"
    echo "   Frontend: http://localhost:8080"
    echo "   Backend API: http://localhost:8001"
    echo ""
    echo "📊 Mode: Real Unity Catalog data (mock mode disabled)"
else
    echo "ℹ️  No frontend found yet."
    echo "   Drop your Lovable export into the 'frontend/' directory"
    echo ""
    echo "🌐 Backend API running at: http://localhost:8001"
fi

echo ""
echo "📝 Logs:"
echo "   Backend: Check terminal output above"
echo ""
echo "🛑 To stop: Press Ctrl+C or run: pkill -f 'python api.py'"
echo ""

# Wait for Ctrl+C
wait
