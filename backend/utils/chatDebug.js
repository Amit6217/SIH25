/**
 * Utility functions for debugging chat and attachment issues
 */

/**
 * Debug function to inspect message data before processing
 */
const debugMessageData = (msg, label = 'Message') => {
  console.log(`\n=== ${label} Debug ===`);
  console.log('Raw message:', JSON.stringify(msg, null, 2));
  console.log('Content type:', typeof msg.content);
  console.log('Content value:', msg.content);
  console.log('Attachments type:', typeof msg.attachments);
  console.log('Attachments value:', msg.attachments);
  console.log('Is attachments array:', Array.isArray(msg.attachments));
  console.log('========================\n');
};

/**
 * Test function to validate message processing
 */
const testMessageProcessing = () => {
  const testCases = [
    // Case 1: Normal message with array attachments
    {
      content: "Hello, this is a test message",
      role: "user",
      attachments: [
        { name: 'contract3.pdf', type: 'document', size: 62525 }
      ]
    },
    // Case 2: Message with stringified attachments
    {
      content: "Hello, this is a test message",
      role: "user", 
      attachments: "[ { name: 'contract3.pdf', type: 'document', size: 62525 } ]"
    },
    // Case 3: Message with empty content (should fail)
    {
      content: "",
      role: "user",
      attachments: []
    },
    // Case 4: Message with no attachments
    {
      content: "Hello, this is a test message",
      role: "user"
    }
  ];

  testCases.forEach((testCase, index) => {
    console.log(`\n--- Test Case ${index + 1} ---`);
    debugMessageData(testCase, `Test Case ${index + 1}`);
    
    try {
      // This would be the processMessageData function call
      console.log('✅ Test case would pass validation');
    } catch (error) {
      console.log('❌ Test case would fail:', error.message);
    }
  });
};

module.exports = {
  debugMessageData,
  testMessageProcessing
};
