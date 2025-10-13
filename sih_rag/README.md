# 🚀 Insurance Claim Evaluator - RAG System

A powerful **Retrieval-Augmented Generation (RAG)** system for insurance policy evaluation with session-based memory and hybrid search capabilities.

## 📋 Table of Contents

- [Features](#-features)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [API Endpoints](#-api-endpoints)
- [Usage Examples](#-usage-examples)
- [Development](#-development)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)

## ✨ Features

### 🎯 **Core Functionality**
- ✅ **PDF Upload & Processing** - Upload insurance documents
- ✅ **Hybrid Search** - Vector embeddings + BM25 text search
- ✅ **Session Management** - Maintain conversation history
- ✅ **AI-Powered Responses** - Groq LLM integration
- ✅ **File Caching** - Efficient document indexing
- ✅ **RESTful API** - FastAPI with automatic documentation

### 🔧 **Technical Features**
- **Vector Database**: ChromaDB for semantic search
- **Text Search**: BM25 algorithm for keyword matching
- **LLM Integration**: Groq API with Llama 3.3 70B
- **Memory System**: Session-based conversation history
- **Caching**: LFU cache for performance optimization
- **CORS Support**: Frontend integration ready

## 📁 Project Structure

```
sih_rag/
├── 📄 main.py                    # Original FastAPI application
├── 📄 main_simple.py             # Simplified version (recommended)
├── 📄 main_minimal.py            # Minimal test version
├── 📄 crew_pipeline.py           # Original ML pipeline
├── 📄 crew_pipeline_simple.py    # Simplified pipeline
├── 📄 BM25_INDEX.py              # BM25 search implementation
├── 📄 BM25_INDEXER.py            # BM25 indexer
├── 📄 gemini_embedder.py         # Google Gemini embeddings
├── 📄 requirements.txt           # Full dependencies
├── 📄 requirements_simple.txt    # Simplified dependencies
├── 📄 package.json               # Node.js dependencies
├── 📁 embedders/                 # Custom embedding modules
│   ├── __init__.py
│   └── twelvelabs_embedder.py
├── 📁 venv/                      # Python virtual environment
└── 📁 chroma_db/                 # Vector database storage
```

## 🚀 Quick Start

### **Option 1: Simplified Version (Recommended)**

```bash
# 1. Navigate to project directory
cd "C:\Users\shivam jat\OneDrive\Desktop\fuckSIH\sih_rag"

# 2. Activate virtual environment
.\venv\scripts\activate

# 3. Run the application
python main_simple.py
```

### **Option 2: Original Version (Full ML Features)**

```bash
# 1. Install all dependencies
pip install -r requirements.txt

# 2. Set up environment variables
# Create .env file with GROQ_API_KEY

# 3. Run the application
python main.py
```

## 📦 Installation

### **Prerequisites**
- Python 3.11+
- pip package manager
- Git (optional)

### **Step 1: Clone Repository**
```bash
git clone <repository-url>
cd sih_rag
```

### **Step 2: Create Virtual Environment**
```bash
python -m venv venv
```

### **Step 3: Activate Virtual Environment**

**Windows:**
```bash
.\venv\scripts\activate
```

**Linux/Mac:**
```bash
source venv/bin/activate
```

### **Step 4: Install Dependencies**

**For Simplified Version:**
```bash
pip install -r requirements_simple.txt
```

**For Full Version:**
```bash
pip install -r requirements.txt
```

## ⚙️ Configuration

### **Environment Variables**

Create a `.env` file in the project root:

```env
# Required for AI responses
GROQ_API_KEY=your_groq_api_key_here

# Optional configurations
PORT=8000
LOG_LEVEL=info
```

### **Getting Groq API Key**
1. Visit [Groq Console](https://console.groq.com/)
2. Sign up/Login
3. Generate API key
4. Add to `.env` file

## 🌐 API Endpoints

### **Base URL**: `http://localhost:8000`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | API status and version info |
| `GET` | `/health` | Health check |
| `POST` | `/pdf/upload` | Upload PDF document |
| `POST` | `/pdf/query` | Query uploaded PDF |
| `GET` | `/pdf/list` | List uploaded PDFs |
| `DELETE` | `/pdf/{pdf_id}` | Delete uploaded PDF |
| `POST` | `/memory/reset` | Reset conversation memory |
| `GET` | `/memory/sessions` | Get active sessions |

### **API Documentation**
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## 💡 Usage Examples

### **1. Upload PDF**
```bash
curl -X POST "http://localhost:8000/pdf/upload" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@insurance_policy.pdf"
```

**Response:**
```json
{
  "pdf_id": "tmp123456.pdf",
  "filename": "insurance_policy.pdf",
  "message": "✅ PDF uploaded & indexed successfully"
}
```

### **2. Query PDF**
```bash
curl -X POST "http://localhost:8000/pdf/query" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "pdf_id=tmp123456.pdf&question=What is the coverage limit?&session_id=user123"
```

**Response:**
```json
{
  "answer": "Based on the policy document, the coverage limit is $500,000...",
  "metadata": [
    {
      "content": "Coverage limit: $500,000",
      "pdf_name": "insurance_policy.pdf",
      "page": "Page 5",
      "score": 0.95
    }
  ],
  "session_id": "user123"
}
```

### **3. Check Health**
```bash
curl http://localhost:8000/health
```

### **4. List PDFs**
```bash
curl http://localhost:8000/pdf/list
```

## 🔧 Development

### **Running in Development Mode**
```bash
# Auto-reload on changes
python main_simple.py
```

### **Testing the API**
```bash
# Test health endpoint
curl http://localhost:8000/health

# Test root endpoint
curl http://localhost:8000/
```

### **Adding New Features**

1. **Custom Embeddings**: Add to `embedders/` directory
2. **New Search Methods**: Extend `crew_pipeline_simple.py`
3. **API Endpoints**: Modify `main_simple.py`

## 🐛 Troubleshooting

### **Common Issues**

#### **1. Module Not Found Errors**
```bash
# Solution: Ensure virtual environment is activated
.\venv\scripts\activate
```

#### **2. Port Already in Use**
```bash
# Solution: Kill existing process
netstat -ano | findstr :8000
taskkill /PID <process_id> /F
```

#### **3. SSL Certificate Errors**
```bash
# Solution: Use trusted hosts
pip install --trusted-host pypi.org --trusted-host pypi.python.org --trusted-host files.pythonhosted.org <package>
```

#### **4. Groq API Errors**
- Check API key in `.env` file
- Verify API key is valid
- Check rate limits

### **Version Compatibility**

| Component | Version | Status |
|-----------|---------|--------|
| Python | 3.11+ | ✅ Supported |
| FastAPI | 0.111.0 | ✅ Working |
| Uvicorn | 0.30.6 | ✅ Working |
| PyPDF | 4.2.0+ | ✅ Working |

## 📊 Performance

### **Benchmarks**
- **PDF Upload**: ~2-5 seconds (10MB file)
- **Text Search**: ~100-500ms
- **AI Response**: ~1-3 seconds (with Groq)
- **Memory Usage**: ~50-100MB base

### **Optimization Tips**
- Use `requirements_simple.txt` for faster startup
- Enable caching for repeated queries
- Limit PDF file size to 10MB
- Use session management for better UX

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **FastAPI** - Modern web framework
- **Groq** - High-performance LLM inference
- **ChromaDB** - Vector database
- **LangChain** - LLM application framework
- **PyPDF** - PDF processing library

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review API documentation at `/docs`

---

**Made with ❤️ for SIH (Smart India Hackathon)**
