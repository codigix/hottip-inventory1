// Test script for leave requests endpoint
const BASE_URL = "http://localhost:5000";

async function testLeaveRequests() {
  try {
    console.log("🧪 Testing leave requests endpoint...");

    const response = await fetch(`${BASE_URL}/api/leave-requests`, {
      headers: {
        Authorization: "Bearer dev-token-admin",
        "Content-Type": "application/json",
      },
    });

    console.log("📊 Response status:", response.status);
    console.log(
      "📊 Response headers:",
      Object.fromEntries(response.headers.entries())
    );

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Leave requests data:", data);
      console.log("📈 Data type:", typeof data);
      console.log("📈 Is array:", Array.isArray(data));
      console.log("📈 Length:", data?.length || "N/A");
    } else {
      const errorText = await response.text();
      console.log("❌ Error response:", errorText);
    }
  } catch (error) {
    console.error("❌ Request failed:", error.message);
  }
}

testLeaveRequests();
