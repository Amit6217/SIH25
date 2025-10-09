#!/usr/bin/env node

/**
 * Debug script for chat attachment issues
 * This script helps test different attachment formats
 */

const axios = require('axios');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

// Test data with different attachment formats
const testCases = [
  {
    name: 'String attachments (problematic)',
    data: {
      content: 'Hello, this is a test message',
      attachments: "[ { name: 'contract3.pdf', type: 'document', size: 62525 } ]"
    }
  },
  {
    name: 'Array attachments (correct)',
    data: {
      content: 'Hello, this is a test message',
      attachments: [{ name: 'contract3.pdf', type: 'document', size: 62525 }]
    }
  },
  {
    name: 'Empty attachments',
    data: {
      content: 'Hello, this is a test message',
      attachments: []
    }
  },
  {
    name: 'No attachments',
    data: {
      content: 'Hello, this is a test message'
    }
  }
];

async function testAttachmentFormats() {
  console.log('🧪 Testing different attachment formats...\n');

  for (const testCase of testCases) {
    console.log(`\n--- Testing: ${testCase.name} ---`);
    console.log('Data:', JSON.stringify(testCase.data, null, 2));

    try {
      const response = await axios.post(`${BACKEND_URL}/api/debug/test-message-processing`, testCase.data, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_TOKEN_HERE' // You'll need to replace this with a real token
        }
      });

      console.log('✅ Success:', response.data.message);
      console.log('Processed message:', JSON.stringify(response.data.processedMessage, null, 2));

    } catch (error) {
      console.log('❌ Failed:', error.response?.data?.error || error.message);
      if (error.response?.data?.validationDetails) {
        console.log('Validation details:', error.response.data.validationDetails);
      }
    }
  }
}

async function testSchema() {
  console.log('\n🔍 Testing schema...\n');

  try {
    const response = await axios.get(`${BACKEND_URL}/api/debug/test-schema`, {
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE' // You'll need to replace this with a real token
      }
    });

    console.log('✅ Schema test successful');
    console.log('Schema info:', JSON.stringify(response.data.schema, null, 2));

  } catch (error) {
    console.log('❌ Schema test failed:', error.response?.data?.error || error.message);
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting attachment debug tests...\n');
  
  try {
    await testSchema();
    await testAttachmentFormats();
    
    console.log('\n✅ All tests completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Check the server logs for detailed debugging information');
    console.log('2. Replace YOUR_TOKEN_HERE with a real authentication token');
    console.log('3. Run the tests again to see the actual results');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
}

// Run if this script is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testAttachmentFormats,
  testSchema,
  runTests
};
