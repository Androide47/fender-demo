#!/bin/bash

echo "🚀 Starting Fender Demo (Local Development)"
echo ""

# Kill any existing processes
echo "🧹 Cleaning up existing processes..."
pkill -f "uvicorn main:app.*8005" 2>/dev/null || true
pkill -f "vite.*fender-frontend" 2>/dev/null || true
pkill -f "bun run dev" 2>/dev/null || true
sleep 2

# Check if Ollama is running
echo "📡 Checking Ollama connection..."
if curl -s http://localhost:11434/api/tags > /dev/null; then
    echo "✅ Ollama is running"
else
    echo "❌ Ollama is not running. Please start Ollama first."
    exit 1
fi

# Start Backend
echo ""
echo "🔧 Starting Backend on http://0.0.0.0:8005..."
cd backend
source .fender-venv/bin/activate
export OLLAMA_API_URL=http://localhost:11434
uvicorn main:app --reload --host 0.0.0.0 --port 8005 &
BACKEND_PID=$!

echo "Backend PID: $BACKEND_PID"

# Wait a bit for backend to start
sleep 3

# Start Frontend
echo ""
echo "🎨 Starting Frontend on http://localhost:5173..."
cd ../fender-frontend
bun run dev &
FRONTEND_PID=$!

echo "Frontend PID: $FRONTEND_PID"

echo ""
echo "✅ Services started!"
echo ""
echo "Frontend: http://localhost:5173"
echo "Backend:  http://localhost:8005"
echo "Ollama:   http://localhost:11434"
echo ""
echo "To stop services, run:"
echo "  kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "Or press Ctrl+C and run: pkill -f 'uvicorn main:app' && pkill -f 'vite'"

# Wait for user interrupt
wait
