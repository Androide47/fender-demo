#!/bin/bash

echo "🚀 Starting Fender Demo Application..."
echo ""

# Build and start services
echo "📦 Building and starting Docker containers..."
docker-compose up -d --build

echo ""
echo "⏳ Waiting for Ollama to be ready..."
sleep 10

echo ""
echo "📥 Pulling llama3.1:8b model..."
docker-compose exec -T ollama ollama pull llama3.1:8b

echo ""
echo "✅ Setup complete!"
echo ""
echo "Access the application at:"
echo "  Frontend: http://localhost:5173 (or http://YOUR_IP:5173 from external devices)"
echo "  Backend:  http://localhost:8005 (or http://YOUR_IP:8005)"
echo "  Ollama:   http://localhost:11435 (or http://YOUR_IP:11435)"
echo ""
echo "All services are bound to 0.0.0.0 for external access!"
echo ""
echo "To view logs, run: docker-compose logs -f"
echo "To stop, run: docker-compose down"
