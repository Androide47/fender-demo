# Guitar Store AI with Ollama Integration

A guitar store frontend with AI-powered chatbot integration using Ollama.

## Quick Start with Docker (Recommended)

### Prerequisites
- Docker
- Docker Compose

### Running with Docker

1. Clone the repository:
```bash
git clone <your-repo-url>
cd fender-demo
```

2. Start all services:
```bash
docker-compose up --build
```

3. Pull the llama3.1:8b model in Ollama:
```bash
docker-compose exec ollama ollama pull llama3.1:8b
```

4. Access the application:
- Frontend: http://your-server-ip:5173
- Backend API: http://your-server-ip:8005
- Ollama API: http://your-server-ip:11435

The application is now accessible from any computer on your network!

## Manual Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js 20.19+ or 22.12+
- Ollama installed and running

### Backend Setup

1. Install Python dependencies:
```bash
cd backend
pip install -r requirements.txt
```

2. Make sure Ollama is running:
```bash
# Install Ollama if you haven't already
# Visit https://ollama.ai for installation instructions

# Run Ollama (it should start automatically after installation)
ollama serve

# Pull a model (choose one that works for you)
ollama pull llama3.1:8b
# or
ollama pull mistral:7b
# or use any of the models you already have installed
```

3. Start the backend server:
```bash
cd backend
uvicorn main:app --reload --port 8005
```

The backend will be available at `http://localhost:8005`

### Frontend Setup

1. Install dependencies using Bun:
```bash
cd fender-fronend
bun install
```

2. Start the development server:
```bash
bun run dev
```

The frontend will be available at `http://localhost:5173`

## Configuration

### Changing the Ollama Model

Edit `backend/main.py` and change the model name:
```python
"model": "llama3.1",  # Change to your preferred model
```

### Changing the Ollama URL

If Ollama is running on a different URL, set the environment variable:
```bash
export OLLAMA_API_URL="http://your-ollama-url:11434"
```

## Usage

1. Start Ollama (should already be running)
2. Start the backend (`uvicorn main:app --reload --port 8002`)
3. Start the frontend (`bun run dev`)
4. Open http://localhost:5173 in your browser
5. Type a query like "I want to sound like Jimmy Hendrix"
6. The AI will respond with recommendations
7. Products will be displayed below

## Project Structure

```
fender-demo/
├── backend/
│   ├── main.py           # FastAPI backend with Ollama integration
│   └── requirements.txt  # Python dependencies
└── fender-fronend/
    ├── src/
    │   ├── App.tsx      # Main React component
    │   └── App.css      # Styling
    └── package.json     # Node dependencies
```

## Troubleshooting

### "Failed to connect to Ollama"
- Make sure Ollama is running: `ollama serve`
- Check that the model is pulled: `ollama list`
- Verify the Ollama URL is correct

### Frontend can't connect to backend
- Make sure the backend is running on port 8000
- Check the CORS configuration in `main.py`

### Model not found
- Pull the model: `ollama pull llama3.1`
- Or change to a model you have: `ollama pull <model-name>`
