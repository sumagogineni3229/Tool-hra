async function run() {
  console.log("Calling API POST...");
  try {
    const response = await fetch("http://localhost:3000/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: "Workspace Facilities",
        message: "Test feedback from direct fetch script",
        rating: 5,
        isAnonymous: false,
        email: "employee@hraconnect.com"
      })
    });
    console.log("Status Code:", response.status);
    const text = await response.text();
    console.log("Response text:", text);
  } catch (err) {
    console.error("Fetch failed:", err.message);
  }
}

run();
