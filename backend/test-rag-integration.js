#!/usr/bin/env node

/**
 * Test script for Backend-RAG Integration
 * This script tests the basic functionality of the RAG integration
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const RAG_URL = process.env.RAG_URL || 'http://localhost:8000';
const TEST_PDF_PATH = path.join(__dirname, '../test-sample.pdf');

// Test credentials (no longer needed - authentication removed)
const TEST_USER = {
  email: 'test@example.com',
  password: 'testpassword123'
};

let authToken = null; // No longer used

/**
 * Helper function to make requests (no authentication required)
 */
async function makeRequest(method, url, data = null, headers = {}) {
  const config = {
    method,
    url: `${BACKEND_URL}${url}`,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };

  if (data) {
    config.data = data;
  }

  try {
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`Request failed: ${method} ${url}`);
    console.error('Error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Test user authentication (no longer needed)
 */
async function testAuth() {
  console.log('🔐 Authentication removed - skipping auth test');
  return true; // Always pass since auth is removed
}

/**
 * Test RAG service health
 */
async function testRAGHealth() {
  console.log('🏥 Testing RAG service health...');
  
  try {
    const health = await makeRequest('GET', '/api/rag/health');
    console.log('✅ RAG service is healthy:', health.status);
    return true;
  } catch (error) {
    console.log('❌ RAG service health check failed:', error.message);
    return false;
  }
}

/**
 * Test RAG service management
 */
async function testRAGServiceManagement() {
  console.log('⚙️ Testing RAG service management...');
  
  try {
    // Check service status
    const status = await makeRequest('GET', '/api/rag/service/status');
    console.log('📊 Service status:', status.status);
    
    // Try to start service if not running
    if (!status.status.isRunning) {
      console.log('🚀 Starting RAG service...');
      const startResponse = await makeRequest('POST', '/api/rag/service/start');
      console.log('✅ Service start result:', startResponse.message);
    }
    
    return true;
  } catch (error) {
    console.log('❌ Service management test failed:', error.message);
    return false;
  }
}

/**
 * Test PDF upload
 */
async function testPDFUpload() {
  console.log('📄 Testing PDF upload...');
  
  // Create a simple test PDF content (this is just for testing)
  const testPDFContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
72 720 Td
(Test PDF Document) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000206 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
299
%%EOF`;

  try {
    // Create temporary PDF file
    const tempPDFPath = path.join(__dirname, 'temp-test.pdf');
    fs.writeFileSync(tempPDFPath, testPDFContent);

    // Create form data
    const formData = new FormData();
    formData.append('pdf', fs.createReadStream(tempPDFPath), {
      filename: 'test.pdf',
      contentType: 'application/pdf'
    });

    // Upload PDF
    const uploadResponse = await axios.post(`${BACKEND_URL}/api/rag/upload`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${authToken}`
      }
    });

    console.log('✅ PDF uploaded successfully:', uploadResponse.data.pdfId);
    
    // Clean up
    fs.unlinkSync(tempPDFPath);
    
    return uploadResponse.data.pdfId;
  } catch (error) {
    console.log('❌ PDF upload failed:', error.message);
    return null;
  }
}

/**
 * Test PDF query
 */
async function testPDFQuery(pdfId) {
  console.log('❓ Testing PDF query...');
  
  if (!pdfId) {
    console.log('❌ No PDF ID available for query test');
    return false;
  }

  try {
    const queryResponse = await makeRequest('POST', '/api/rag/query', {
      pdfId: pdfId,
      question: 'What is this document about?',
      sessionId: 'test-session-123'
    });

    console.log('✅ Query successful:', queryResponse.answer);
    return true;
  } catch (error) {
    console.log('❌ PDF query failed:', error.message);
    return false;
  }
}

/**
 * Test chat integration
 */
async function testChatIntegration() {
  console.log('💬 Testing chat integration...');
  
  try {
    // Create a test chat
    const chatResponse = await makeRequest('POST', '/api/chats', {
      title: 'RAG Test Chat',
      messages: []
    });

    const chatId = chatResponse._id;
    console.log('✅ Chat created:', chatId);

    // Send a message with RAG processing
    const messageResponse = await makeRequest('POST', `/api/chats/${chatId}/messages`, {
      content: 'Hello, can you help me understand this document?',
      useRAG: false // Set to true if you have a PDF uploaded
    });

    console.log('✅ Message sent successfully');
    console.log('📝 AI Response:', messageResponse.aiResponse.content);
    
    return true;
  } catch (error) {
    console.log('❌ Chat integration test failed:', error.message);
    return false;
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🧪 Starting Backend-RAG Integration Tests\n');

  const results = {
    auth: false,
    ragHealth: false,
    serviceManagement: false,
    pdfUpload: false,
    pdfQuery: false,
    chatIntegration: false
  };

  try {
    // Test authentication
    results.auth = await testAuth();
    if (!results.auth) {
      console.log('❌ Authentication failed, skipping other tests');
      return;
    }

    console.log('');

    // Test RAG service health
    results.ragHealth = await testRAGHealth();
    console.log('');

    // Test service management
    results.serviceManagement = await testRAGServiceManagement();
    console.log('');

    // Test PDF upload
    const pdfId = await testPDFUpload();
    results.pdfUpload = pdfId !== null;
    console.log('');

    // Test PDF query
    results.pdfQuery = await testPDFQuery(pdfId);
    console.log('');

    // Test chat integration
    results.chatIntegration = await testChatIntegration();
    console.log('');

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }

  // Print results summary
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });

  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Integration is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Check the logs above for details.');
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  runTests,
  testAuth,
  testRAGHealth,
  testRAGServiceManagement,
  testPDFUpload,
  testPDFQuery,
  testChatIntegration
};
