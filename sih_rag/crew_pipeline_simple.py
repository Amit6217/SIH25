# Modified crew_pipeline.py that works without heavy ML dependencies
import os
import hashlib
import time
from functools import wraps
from cachetools import LFUCache
from dotenv import load_dotenv

# === Load Env Vars ===
load_dotenv()
groq_api_key = os.getenv("GROQ_API_KEY")

# === Caches ===
pdf_cache = LFUCache(maxsize=10)     # Cache per-PDF indexes
query_cache = LFUCache(maxsize=100)  # Cache per-query answers

# === Session-based Memory Manager ===
class MemoryManager:
    def __init__(self):
        self.sessions = {}  # session_id -> simple dict storage

    def get_memory(self, session_id: str):
        if session_id not in self.sessions:
            self.sessions[session_id] = {
                "history": [],
                "messages": []
            }
        return self.sessions[session_id]

    def reset_memory(self, session_id: str):
        if session_id in self.sessions:
            self.sessions[session_id] = {
                "history": [],
                "messages": []
            }
            print(f"Memory cleared for session: {session_id}")
        else:
            print(f"No memory found for session: {session_id}")

memory_manager = MemoryManager()

# === Decorator for query caching ===
def cache_query(func):
    @wraps(func)
    def wrapper(user_query: str, pdf_path: str, session_id="default"):
        cache_key = (user_query, pdf_path, session_id)
        if cache_key in query_cache:
            print(f"Returning cached answer for: {cache_key}")
            return query_cache[cache_key]

        print(f"Executing pipeline for: {cache_key}")
        result = func(user_query, pdf_path, session_id=session_id)
        query_cache[cache_key] = result
        return result
    return wrapper

# === PDF Loader ===
def load_pdf_chunks(pdf_path):
    from pypdf import PdfReader
    if not os.path.exists(pdf_path):
        print(f"File not found: {pdf_path}")
        return []

    try:
        reader = PdfReader(pdf_path)
        texts = [page.extract_text() or "" for page in reader.pages]
    except Exception as e:
        print(f"Error reading PDF: {e}")
        return []
    return texts

# === Get/Create Indexes (SIMPLIFIED) ===
def get_or_create_indexes(pdf_path):
    if pdf_path in pdf_cache:
        print(f"Using cached indexes for {pdf_path}")
        return pdf_cache[pdf_path]

    print(f"Creating simple text index for {pdf_path}")
    chunks = load_pdf_chunks(pdf_path)
    texts = [doc for doc in chunks if isinstance(doc, str)]

    # Simple text storage without vector embeddings
    index_data = {
        "texts": texts,
        "pdf_path": pdf_path
    }

    pdf_cache[pdf_path] = index_data
    return index_data

# === Simple Text Search ===
def simple_text_search(query, texts, k=5):
    """Simple keyword-based search"""
    query_words = query.lower().split()
    scored_texts = []
    
    for text in texts:
        text_lower = text.lower()
        score = sum(1 for word in query_words if word in text_lower)
        if score > 0:
            scored_texts.append((score, text))
    
    # Sort by score and return top k
    scored_texts.sort(key=lambda x: x[0], reverse=True)
    return [text for score, text in scored_texts[:k]]

# === Extract Relevant Text with Metadata ===
def extract_relevant_clause(pdf_path, user_query, k=6):
    indexes = get_or_create_indexes(pdf_path)
    texts = indexes["texts"]

    # Simple text search
    try:
        relevant_passages = simple_text_search(user_query, texts, k=k)
    except Exception as e:
        print("Text search failed:", e)
        relevant_passages = []

    if not relevant_passages:
        return "", []

    # Create mock metadata
    metadata_info = []
    for i, passage in enumerate(relevant_passages):
        metadata_info.append({
            "content": passage,
            "pdf_name": os.path.basename(pdf_path),
            "page": f"Page {i+1}",
            "score": 1.0
        })

    return "\n\n".join(relevant_passages), metadata_info

# === Main Pipeline with Memory (SIMPLIFIED) ===
@cache_query
def run_full_pipeline(user_query: str, pdf_path: str, session_id="default"):
    context, metadata_info = extract_relevant_clause(pdf_path, user_query, k=10)

    metadata_text = "\n".join(
        [f"- Source: {m['pdf_name']}, Page: {m['page']}" for m in metadata_info]
    ) or "No metadata available."

    # Get memory for session
    memory = memory_manager.get_memory(session_id)
    
    # Load conversation history
    chat_history = memory.get("history", [])
    
    # Format chat history for prompt
    history_text = ""
    if chat_history:
        history_text = "\n\nConversation History:\n"
        for msg in chat_history:
            history_text += f"{msg['role']}: {msg['content']}\n"

    # Check if we have Groq API key
    if groq_api_key:
        try:
            from langchain_groq import ChatGroq
            
            llm = ChatGroq(
                model="llama-3.3-70b-versatile",
                temperature=0.0,
                max_tokens=800,
            )
            
            prompt_template = f"""
You are an intelligent assistant working for the Department of Higher Education (MoE).
Your role is to help officials quickly retrieve, compare, and interpret data, rules,
schemes, projects, and policies from multiple authentic documents.

Objectives:
1. Find all relevant information from provided contexts — even if scattered or overlapping.
2. Combine related clauses logically, avoid repetition, and highlight any conflicting info.
3. Maintain traceability by citing document names and page numbers.
4. Always remain factual, concise, and policy-accurate.
5. If data is insufficient or unclear, clearly state that instead of guessing.
6. Use conversation history to provide contextual answers and maintain coherent dialogue.
{history_text}

User Query:
{user_query}

Retrieved Contexts:
{context}

Source Metadata:
{metadata_text}
"""

            # Add user message to memory
            memory["history"].append({"role": "User", "content": user_query})

            # Call LLM
            start = time.time()
            llm_response = llm.invoke(prompt_template)
            print(f"⏱ Groq call took {time.time() - start:.2f} sec")

            # Add AI response to memory
            memory["history"].append({"role": "Assistant", "content": llm_response.content})

            return {
                "answer": llm_response.content,
                "metadata": metadata_info
            }
            
        except ImportError:
            print("langchain_groq not available, using mock response")
        except Exception as e:
            print(f"Groq API error: {e}, using mock response")

    # Fallback: Mock response when Groq is not available
    mock_answer = f"""
**Mock Response (Groq API not configured)**

Question: {user_query}

Retrieved Context:
{context[:500]}...

**Note**: This is a simplified response. To enable full AI capabilities:
1. Set GROQ_API_KEY environment variable
2. Install langchain_groq: `pip install langchain_groq`
3. Install other ML dependencies for vector search

Current capabilities:
✅ PDF upload and storage
✅ Basic text search
✅ Session management
✅ File caching
⚠️ AI-powered responses (requires API key)
⚠️ Vector embeddings (requires ML libraries)
"""

    # Add to memory
    memory["history"].append({"role": "User", "content": user_query})
    memory["history"].append({"role": "Assistant", "content": mock_answer})

    return {
        "answer": mock_answer,
        "metadata": metadata_info
    }

# === Reset Memory Helper ===
def reset_memory(session_id="default"):
    memory_manager.reset_memory(session_id)
