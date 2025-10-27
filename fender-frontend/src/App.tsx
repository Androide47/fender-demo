import { useState, useRef, useEffect } from 'react'
import { Search, Send, X, ShoppingBag, MapPin, User, Filter, Grid } from 'lucide-react'
import './App.css'
import productsData from './products.json'

interface Product {
  id: number
  name: string
  price: string
  description: string
  category: string
  image: string
  badge?: string
  stock?: string
}

interface ChatMessage {
  role: string
  content: string
  recommendedProducts?: Product[]
}

function App() {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(productsData as Product[])
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isChatOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isChatOpen])

  const handleSearchClick = () => {
    setIsChatOpen(true)
  }

  const handleCloseChat = () => {
    setIsChatOpen(false)
    setMessages([])
    setFilteredProducts(productsData as Product[])
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userInput = input.trim()
    const query = userInput
    
    const userMessage = { role: 'user', content: userInput }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    let fullContent = ''
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage]
        })
      })

      if (!response.ok) {
        throw new Error('Network response was not ok')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No reader available')
      }

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break
        
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              if (data.error) {
                fullContent = `Sorry, I encountered an error: ${data.error}`
                setIsLoading(false)
                break
              }
              
              if (data.content) {
                fullContent += data.content
                
                // Update the AI message with streaming content
                setMessages(prev => {
                  const lastIndex = prev.length - 1
                  if (prev[lastIndex]?.role === 'assistant') {
                    // Update existing AI message
                    return prev.map((msg, idx) => 
                      idx === lastIndex ? { ...msg, content: fullContent } : msg
                    )
                  } else {
                    // Add new AI message
                    return [...prev, { role: 'assistant', content: fullContent }]
                  }
                })
              }
              
              if (data.done) {
                // Extract products from full AI response - be more specific
                const aiContent = fullContent.toLowerCase()
                const allProducts = productsData as Product[]
                
                // Look for specific product names in the AI response
                const mentionedProducts: Product[] = []
                
                allProducts.forEach(product => {
                  const productName = product.name.toLowerCase()
                  // Extract the key words from product name (remove generic terms)
                  const keyWords = productName
                    .replace(/fender|electric|guitar|bass|amp|effects|pedal|player|american|professional|classic|limited edition/gi, '')
                    .split(/\s+/)
                    .filter(w => w.length > 3 && !['sounds', 'sound', 'the', 'with'].includes(w))
                  
                  // Check if AI response contains key words from product name
                  const hasKeyWords = keyWords.some(word => aiContent.includes(word))
                  
                  // Also check if full product name is mentioned
                  const fullNameMentioned = aiContent.includes(productName) || 
                                            aiContent.includes(productName.replace('®', ''))
                  
                  // Check for category matches only if specific terms
                  const categoryMentioned = ['stratocaster', 'telecaster', 'precision', 'jazz', 'blues junior', 'twin reverb', 'princeton'].some(term => 
                    aiContent.includes(term) && productName.includes(term)
                  )
                  
                  if (hasKeyWords || fullNameMentioned || categoryMentioned) {
                    mentionedProducts.push(product)
                  }
                })
                
                // Limit to top 3 most relevant
                const recommended = mentionedProducts.slice(0, 3)
                
                // Update the last message with recommended products
                setMessages(prev => {
                  const lastIndex = prev.length - 1
                  if (prev[lastIndex]?.role === 'assistant') {
                    return prev.map((msg, idx) => 
                      idx === lastIndex ? { ...msg, content: fullContent, recommendedProducts: recommended } : msg
                    )
                  }
                  return prev
                })
                
                // Update filtered products for main view
                if (recommended.length > 0) {
                  setFilteredProducts(recommended)
                } else {
                  setFilteredProducts(allProducts)
                }
                
                setIsLoading(false)
                break
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e)
            }
          }
        }
      }
    } catch (error) {
      console.error('Error calling AI:', error)
      const aiResponse = {
        role: 'assistant',
        content: 'Sorry, I couldn\'t process your request. Here are our products:'
      }
      setMessages(prev => [...prev, aiResponse])
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend()
    }
  }

  return (
    <div className="app">
      {/* Top Bar */}
      <div className="top-bar">
        <div className="top-bar-content">
          <div className="logo-small">Fender</div>
          <div className="search-container">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="What can we help you find?"
              className="top-search-input"
              onClick={handleSearchClick}
            />
          </div>
          <div className="top-actions">
            <button className="icon-button"><MapPin size={20} /></button>
            <button className="icon-button"><User size={20} /></button>
            <button className="icon-button"><ShoppingBag size={20} /></button>
          </div>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="breadcrumbs">
        <span>Home</span>
        <span className="separator">&gt;</span>
        <span className="current">All Products</span>
      </div>

      {/* Controls */}
      <div className="controls">
        <button className="filters-button">
          <Filter size={18} />
          Filters
        </button>
        <div className="controls-right">
          <select className="sort-select">
            <option>Sort by</option>
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
            <option>Newest</option>
          </select>
          <button className="view-button active">
            <Grid size={18} />
          </button>
          <span className="results-count">{filteredProducts.length} Results</span>
        </div>
      </div>

      {/* Main Content */}
      <main className="main-content">
        <div className="products-grid">
          {filteredProducts.map(product => (
            <div key={product.id} className="product-card">
              {product.badge && (
                <div className="product-badge">{product.badge}</div>
              )}
              <div className="product-image">
                <img src={product.image} alt={product.name} />
              </div>
              {product.stock && (
                <div className="product-stock">{product.stock}</div>
              )}
              <div className="product-info">
                <h3 className="product-name">{product.name}</h3>
                <p className="product-description">{product.description}</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Chat Modal */}
      {isChatOpen && (
        <div className="chat-modal">
          <div className="chat-header">
            <div className="chat-title">
              <Search size={24} />
              <span>AI Search Assistant</span>
            </div>
            <button className="close-button" onClick={handleCloseChat}>
              <X size={24} />
            </button>
          </div>
          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="chat-welcome">
                <h3>How can I help you find the perfect gear?</h3>
                <p>Try asking:</p>
                <ul>
                  <li>"I want to sound like Jimmy Hendrix"</li>
                  <li>"Show me classic rock guitars"</li>
                  <li>"I need a high-gain pedal"</li>
                </ul>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className={`chat-message ${msg.role}`}>
                  <div className="chat-message-content">{msg.content}</div>
                  {msg.role === 'assistant' && msg.recommendedProducts && msg.recommendedProducts.length > 0 && (
                    <div className="chat-recommendations">
                      <h4 className="recommendations-title">Recommended Products:</h4>
                      <div className="recommendations-grid">
                        {msg.recommendedProducts.map(product => (
                          <div key={product.id} className="recommendation-card">
                            <img src={product.image} alt={product.name} />
                            <div className="recommendation-info">
                              <h5>{product.name}</h5>
                              <p>{product.price}</p>
                              <button className="add-to-cart-btn">
                                <ShoppingBag size={16} />
                                Add to Cart
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="chat-input-container">
            <input
              ref={searchInputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isLoading ? "AI is thinking..." : "Type your search..."}
              className="chat-input"
              disabled={isLoading}
            />
            <button onClick={handleSend} className="chat-send-button" disabled={isLoading}>
              <Send size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
