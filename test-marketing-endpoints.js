// Test script for marketing attendance endpoints
const fetch = require("node-fetch");

const BASE_URL = "http://localhost:5000";

// Simple development token (this should work in development mode)
const DEV_TOKEN = "dev-token-admin-user";

async function testEndpoint(endpoint, description) {
  console.log(`\n🧪 Testing ${description}...`);
  console.log(`📡 URL: ${BASE_URL}${endpoint}`);

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${DEV_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    console.log(`📊 Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Success! Response:`, JSON.stringify(data, null, 2));
      return { success: true, data };
    } else {
      const errorText = await response.text();
      console.log(`❌ Error Response:`, errorText);
      return { success: false, error: errorText };
    }
  } catch (error) {
    console.log(`💥 Network Error:`, error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log("🚀 Starting Marketing Attendance API Tests...");
  console.log("=".repeat(60));

  // Test the endpoints
  const results = [];

  results.push(
    await testEndpoint(
      "/api/marketing-attendance/today",
      "Today's Marketing Attendance"
    )
  );
  results.push(
    await testEndpoint(
      "/api/marketing-attendance/metrics",
      "Marketing Attendance Metrics"
    )
  );

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📋 TEST SUMMARY:");

  const successful = results.filter((r) => r.success).length;
  const total = results.length;

  console.log(`✅ Successful: ${successful}/${total}`);
  console.log(`❌ Failed: ${total - successful}/${total}`);

  if (successful === total) {
    console.log(
      "🎉 All tests passed! The marketing attendance endpoints are working correctly."
    );
  } else {
    console.log("⚠️  Some tests failed. Check the error messages above.");
  }
}

// Run the tests
runTests().catch(console.error);
