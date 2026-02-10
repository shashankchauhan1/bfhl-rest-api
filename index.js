import express from "express";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json({ limit: "10kb" }));

const EMAIL = process.env.OFFICIAL_EMAIL;

// Find the number is prime or not
const isPrime = (n) => {
    if (n < 2) return false;

    for (let i = 2; i * i <= n; i++) {
        if (n % i === 0) return false;
    }

    return true;
};

// Fibonacci Series
const fibonacci = (n) => {
    if (!Number.isInteger(n) || n < 0) return null;
    const result = [];
    let a = 0, b = 1;
    for (let i = 0; i < n; i++) {
        result.push(a);
        [a, b] = [b, a + b];
    }
    return result;
};

// Find GCD
const gcd = (a, b) => {
    if (b === 0) return a;
    return gcd(b, a % b);
}

// Find HCF
const hcf = (arr) => {
    if (!Array.isArray(arr) || arr.length === 0) return null;

    return arr.reduce((a, b) => gcd(a, b));
}

// Find LCM
const lcm = (arr) => {
    if (!Array.isArray(arr) || arr.length === 0) return null;

    return arr.reduce((a, b) => (a * b) / gcd(a, b));
}

// Health Route
app.get("/health", (req, res) => {
    res.status(200).json({
        is_success: true,
        official_email: EMAIL
    });
});

// bhfl Route
app.post("/bfhl", async (req, res) => {
    try {
        const body = req.body;
        const keys = Object.keys(body);

        if (keys.length !== 1) {
            return res.status(400).json({
                is_success: false,
                official_email: EMAIL,
                error: "Request must contain exactly one key"
            });
        }

        const key = keys[0];
        const value = body[key];

        let data;

        switch (key) {
            case "fibonacci":
                data = fibonacci(value);
                if (!data) throw new Error("Invalid fibonacci input");
                break;

            case "prime":
                if (!Array.isArray(value)) throw new Error("Invalid prime array input");
                data = value.filter(
                    (n) => Number.isInteger(n) && isPrime(n)
                );
                break;

            case "lcm":
                if (!Array.isArray(value) || value.some(v => !Number.isInteger(v))) {
                    throw new Error("Invalid lcm array input");
                }
                data = lcm(value);
                break;

            case "hcf":
                if (!Array.isArray(value) || value.some(v => !Number.isInteger(v))) {
                    throw new Error("Invalid hcf array input");
                }
                data = hcf(value);
                break;

            case "AI":
                if (typeof value !== "string" || value.trim() === "") {
                    throw new Error("AI expects a non-empty string");
                }

                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            contents: [{
                                parts: [{ text: `${value}. Respond with exactly one single word, which is the direct answer.` }]
                            }]
                        })
                    }
                );

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error("Gemini API Error:", errorData);
                    throw new Error("Gemini API failed");
                }

                const result = await response.json();

                const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text || "";
                data = rawText.trim().replace(/[.,!?;:]/g, "").split(/\s+/)[0];
                break;

            default:
                return res.status(400).json({
                    is_success: false,
                    official_email: EMAIL,
                    error: "Invalid key"
                });
        }

        res.status(200).json({
            is_success: true,
            official_email: EMAIL,
            data
        });

    } catch (err) {
        console.error("DEBUG ERROR:", err.message);
        res.status(500).json({
            is_success: false,
            official_email: EMAIL,
            error: "Internal Server Error"
        });
    }
});


// Start Server 
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
