const payments = [
    {
        order_id: "test_verify_5",
        amount: 3000,
        currency: "INR",
        method: "upi",
        vpa: "verify@upi"
    },
    {
        order_id: "test_verify_6",
        amount: 8000,
        currency: "INR",
        method: "card"
    }
];

const headers = {
    "X-Api-Key": "key_test_abc123",
    "X-Api-Secret": "secret_test_xyz789",
    "Content-Type": "application/json"
};

async function verify() {
    console.log("🚀 Starting Verification...");

    // 1. Create Payments
    for (const p of payments) {
        try {
            const res = await fetch("http://localhost:8000/api/v1/payments", {
                method: "POST",
                headers,
                body: JSON.stringify(p)
            });
            const data = await res.json();
            console.log(`Payment Created: ${res.status}`, data.id);
        } catch (e) {
            console.error("Payment Failed:", e.message);
        }
    }

    // 2. Wait for Workers
    console.log("⏳ Waiting 5s for workers...");
    await new Promise(r => setTimeout(r, 5000));

    // 3. Fetch Logs
    try {
        const res = await fetch("http://localhost:8000/api/v1/webhooks", { headers });
        const data = await res.json();
        console.log("\n📊 Webhook Logs Found:", data.total);
        console.dir(data.data, { depth: null });
    } catch (e) {
        console.error("Fetch Logs Failed:", e.message);
    }
}

verify();
