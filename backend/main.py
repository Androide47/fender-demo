from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict
import httpx
import os
import json
import asyncio

app = FastAPI()

# Add CORS middleware to allow frontend to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (for development)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]

# Ollama API URL
OLLAMA_API_URL = os.getenv("OLLAMA_API_URL", "http://localhost:11434")

# Load product catalog
def load_products():
    """Load the product catalog from JSON file"""
    try:
        # Try current directory first (for local dev)
        if os.path.exists("products.json"):
            with open("products.json", "r") as f:
                products = json.load(f)
            return json.dumps(products, indent=2)
        # Try in the same directory as this file (for Docker)
        elif os.path.exists(os.path.join(os.path.dirname(__file__), "products.json")):
            with open(os.path.join(os.path.dirname(__file__), "products.json"), "r") as f:
                products = json.load(f)
            return json.dumps(products, indent=2)
        else:
            return "[]"
    except Exception as e:
        print(f"Error loading products: {e}")
        return "[]"

def get_system_prompt():
    """Create a system prompt with product context"""
    products_json = load_products()
    return f"""You are a helpful assistant for a Fender guitar store. Your job is to help customers find the right products based on their needs and preferences.

You have access to the following product catalog:

{products_json}

When a customer asks you a question:
1. Analyze their request to understand what type of product they're looking for (guitar, bass, amp, pedal, etc.)
2. **IMPORTANT: When recommending products, you MUST mention the EXACT product names from the catalog**. For example, if you recommend a Stratocaster, say "American Professional Classic Stratocaster" or "Player Plus Stratocaster" - use the full exact name from the catalog.
3. Suggest 1-3 specific products by their exact names
4. Provide a brief explanation of why these specific products match their needs
5. Be conversational and helpful

If you can't find exact matches, suggest the closest alternatives. Remember to consider:
- Sound preferences
- Budget ranges
- Experience level
- Musical style/genre

Always respond in a friendly, knowledgeable tone, and ALWAYS include the exact product names when making recommendations."""

@app.get("/")
def read_root():
    return {"message": "the API is on"}

@app.post("/api/chat")
async def chat(request: ChatRequest):
    """
    Send messages to Ollama and get AI responses with product context (streaming).
    """
    try:
        # Get system prompt with product catalog
        system_prompt = get_system_prompt()
        
        # Prepare messages with system prompt at the beginning
        messages = [
            {"role": "system", "content": system_prompt},
            *[
                {
                    "role": msg.role,
                    "content": msg.content
                }
                for msg in request.messages
            ]
        ]
        
        async def generate():
            async with httpx.AsyncClient(timeout=60.0) as client:
                async with client.stream(
                    "POST",
                    f"{OLLAMA_API_URL}/api/chat",
                    json={
                        "model": "llama3.1:8b",
                        "messages": messages,
                        "stream": True
                    }
                ) as response:
                    async for line in response.aiter_lines():
                        if line.strip():
                            try:
                                data = json.loads(line)
                                if "message" in data and "content" in data["message"]:
                                    chunk = data["message"]["content"]
                                    yield f"data: {json.dumps({'content': chunk, 'done': data.get('done', False)})}\n\n"
                                elif "error" in data:
                                    yield f"data: {json.dumps({'error': data['error']})}\n\n"
                            except json.JSONDecodeError:
                                continue
                    
        return StreamingResponse(generate(), media_type="text/event-stream")
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return {"error": f"An error occurred: {str(e)}"}

@app.get("/api/health")
def health():
    """
    Health check endpoint.
    """
    return {"status": "ok"}

@app.get("/api/products")
def get_products():
    """
    Get the product catalog.
    """
    try:
        # Try current directory first (for local dev)
        if os.path.exists("products.json"):
            with open("products.json", "r") as f:
                products = json.load(f)
            return products
        # Try in the same directory as this file (for Docker)
        elif os.path.exists(os.path.join(os.path.dirname(__file__), "products.json")):
            with open(os.path.join(os.path.dirname(__file__), "products.json"), "r") as f:
                products = json.load(f)
            return products
        else:
            return []
    except Exception as e:
        print(f"Error loading products: {e}")
        return []
