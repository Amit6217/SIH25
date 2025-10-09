# Minimal FastAPI app for testing
from fastapi import FastAPI, Request, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict
import uvicorn
import os
import tempfile
import asyncio
import traceback
import logging

# === Logging Setup ===
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# === FastAPI App ===
app = FastAPI(
    title="Insurance Claim Evaluator - Minimal Version",
    description="Minimal backend for testing without ML dependencies",
    version="1.0.0"
)

# === Enable CORS ===
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === PDF Storage ===
uploaded_pdfs: Dict[str, str] = {}  # pdf_id -> pdf_path

# === Health Check ===
@app.get("/")
def read_root():
    return {
        "status": "ok",
        "message": "Insurance Claim Evaluator API - Minimal Version",
        "version": "1.0.0"
    }

@app.get("/health")
def health_check():
    return {
        "status": "running",
        "message": "Backend is up!",
        "uploaded_pdfs": len(uploaded_pdfs)
    }

# === Upload PDF Endpoint ===
@app.post("/pdf/upload")
async def upload_pdf(file: UploadFile = File(...)):
    """
    Upload a PDF once and return a pdf_id.
    """
    try:
        # Validate file type
        if not file.filename.endswith('.pdf'):
            raise HTTPException(status_code=400, detail="❌ Only PDF files allowed")
        
        # Read file content
        content = await file.read()
        
        # Validate file size (max 10MB)
        max_size = 10 * 1024 * 1024  # 10MB
        if len(content) > max_size:
            raise HTTPException(
                status_code=400,
                detail=f"❌ File too large (max {max_size // (1024*1024)}MB)"
            )
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(content)
            pdf_path = tmp.name

        # Use filename as simple ID
        pdf_id = os.path.basename(pdf_path)

        uploaded_pdfs[pdf_id] = pdf_path
        logger.info(f"✅ PDF uploaded: {pdf_id} ({file.filename})")
        
        return {
            "pdf_id": pdf_id,
            "filename": file.filename,
            "message": "✅ PDF uploaded successfully (minimal version)"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("PDF upload failed")
        raise HTTPException(status_code=500, detail=f"❌ Failed to upload: {str(e)}")

# === Query PDF Endpoint (SIMPLIFIED) ===
@app.post("/pdf/query")
async def query_pdf(
    pdf_id: str = Form(...),
    question: str = Form(...),
    session_id: str = Form("default")
):
    """
    Query an already uploaded PDF using its pdf_id.
    This is a simplified version that returns a mock response.
    """
    if pdf_id not in uploaded_pdfs:
        raise HTTPException(
            status_code=404,
            detail=f"❌ pdf_id '{pdf_id}' not found. Please upload the PDF first!"
        )

    pdf_path = uploaded_pdfs[pdf_id]
    
    try:
        logger.info(f"📝 Query from session '{session_id}': {question[:50]}...")
        
        # Mock response for testing
        mock_answer = f"""
This is a mock response for testing purposes.

Question: {question}
PDF: {pdf_id}
Session: {session_id}

The full RAG pipeline with vector search, BM25, and LLM integration is not yet available in this minimal version. 
To enable full functionality, please install the required ML dependencies:
- langchain
- chromadb  
- sentence-transformers
- transformers
- langchain_groq

For now, this endpoint confirms that:
✅ PDF upload is working
✅ File storage is working  
✅ API endpoints are accessible
✅ Session management is ready
        """
        
        return {
            "answer": mock_answer.strip(),
            "metadata": [{"content": "Mock response", "pdf_name": pdf_id, "page": "N/A"}],
            "session_id": session_id
        }
        
    except Exception as e:
        logger.exception(f"Query failed for session '{session_id}'")
        raise HTTPException(status_code=500, detail=f"❌ Query failed: {str(e)}")

# === List Uploaded PDFs ===
@app.get("/pdf/list")
async def list_pdfs():
    """
    Get list of all uploaded PDFs.
    """
    return {
        "count": len(uploaded_pdfs),
        "pdfs": list(uploaded_pdfs.keys())
    }

# === Delete PDF Endpoint ===
@app.delete("/pdf/{pdf_id}")
async def delete_pdf(pdf_id: str):
    """
    Delete an uploaded PDF and free resources.
    """
    if pdf_id not in uploaded_pdfs:
        raise HTTPException(
            status_code=404,
            detail=f"❌ pdf_id '{pdf_id}' not found"
        )
    
    pdf_path = uploaded_pdfs.pop(pdf_id)
    
    try:
        # Remove PDF file
        if os.path.exists(pdf_path):
            os.remove(pdf_path)
        
        logger.info(f"🗑️ Deleted PDF: {pdf_id}")
        return {
            "message": f"✅ Deleted {pdf_id}",
            "pdf_id": pdf_id
        }
        
    except Exception as e:
        logger.exception(f"Failed to delete PDF '{pdf_id}'")
        raise HTTPException(status_code=500, detail=f"❌ Failed to delete: {str(e)}")

# === Run Server ===
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(
        "main_minimal:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )
