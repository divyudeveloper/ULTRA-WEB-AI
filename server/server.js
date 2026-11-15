const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 5000;
const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen3:8b";

// Middleware
app.use(cors({
    origin: [
        process.env.FRONTEND_URL || "http://localhost:5173",
        "http://localhost:5174"
    ]
}));

app.use(express.json({ limit: "1mb" }));

// Health check API
app.get("/api/status", (req, res) => {
    res.status(200).json({
        success: true,
        name: "ULTRA WEB AI",
        status: "online",
        version: "1.0.0",
        message: "Backend is running successfully"
    });
});

// AI Chat API
app.post("/api/ai/chat", async (req, res) => {
    try {
        const { prompt } = req.body;

        if (typeof prompt !== "string" || !prompt.trim()) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid prompt."
            });
        }

        if (prompt.length > 12000) {
            return res.status(400).json({
                success: false,
                message: "Prompt is too long. Maximum 12000 characters."
            });
        }

        const response = await fetch(`${OLLAMA_URL}/api/chat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                messages: [
                    {
                        role: "user",
                        content: prompt.trim()
                    }
                ],
                stream: false,
                think: false
            }),
            signal: AbortSignal.timeout(180000)
        });

        if (!response.ok) {
            const errorText = await response.text();

            return res.status(502).json({
                success: false,
                message: "Ollama AI request failed.",
                error: errorText
            });
        }

        const data = await response.json();
        const answer = data.message?.content;

        if (!answer) {
            return res.status(502).json({
                success: false,
                message: "AI returned an empty response."
            });
        }

        res.status(200).json({
            success: true,
            model: OLLAMA_MODEL,
            reply: answer
        });

    } catch (error) {
        const isTimeout = error.name === "TimeoutError";

        console.error("AI Chat Error:", error.message);

        res.status(isTimeout ? 504 : 503).json({
            success: false,
            message: isTimeout
                ? "AI request timed out."
                : "Unable to connect to Ollama. Check whether Ollama is running."
        });
    }
});


// AI Website Generation API
app.post("/api/ai/generate", async (req, res) => {
    try {
        const { prompt } = req.body;

        if (typeof prompt !== "string" || !prompt.trim()) {
            return res.status(400).json({ success: false, message: "Please provide a website description." });
        }

        if (prompt.length > 8000) {
            return res.status(400).json({ success: false, message: "Prompt is too long." });
        }

        async function generateFile(instruction, maxTokens) {
            const response = await fetch(OLLAMA_URL + "/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: OLLAMA_MODEL,
                    messages: [
                        { role: "system", content: "You are an expert frontend developer. Follow the user requirements exactly. Generate only the requested file type. Never mix HTML, CSS, and JavaScript. Return complete valid source code only, without Markdown fences or explanations." },
                        { role: "user", content: instruction }
                    ],
                    stream: false,
                    think: false,
                    options: { num_predict: maxTokens, temperature: 0.2 }
                }),
                signal: AbortSignal.timeout(240000)
            });

            if (!response.ok) throw new Error("Ollama generation request failed.");

            const data = await response.json();
            let code = (data.message?.content || "")
                .replace(/^`{2,3}[a-zA-Z0-9_-]*\s*/gm, "")
                .replace(/^\s*`{2,3}\s*$/gm, "")
                .trim();

            if (!code) throw new Error("AI returned empty code.");
            return code;
        }

        console.log("Generating HTML...");
        const html = await generateFile(
            "Create a premium, visually rich and responsive website based exactly on these requirements: " + prompt + ". Build a strong visual structure with a modern navbar, impressive hero section, clear call-to-action buttons, well-organized content sections, stylish card layouts and a professional footer. Use meaningful content and semantic HTML. Link style.css and script.js. Do not create a generic portfolio unless requested. No inline CSS or JavaScript.",
            1100
        );

        console.log("Generating CSS...");
        const css = await generateFile(
            "Create premium, modern and visually impressive responsive CSS for this HTML. Use beautiful colors, gradients, professional typography, generous spacing, polished cards, shadows, hover effects, smooth transitions and attractive buttons. Make the hero section visually striking. Ensure mobile responsiveness. Return CSS only, without HTML or JavaScript. HTML:\n" + html,
            1400
        );

        console.log("Generating JavaScript...");
        const js = await generateFile(
            "Write functional JavaScript for this HTML. Return JavaScript only. Make buttons and interactions work. HTML:\n" + html,
            900
        );

        if (!html.toLowerCase().includes("<html")) throw new Error("Generated HTML is invalid.");

        res.status(200).json({
            success: true,
            model: OLLAMA_MODEL,
            projectName: "Generated Website",
            files: [
                { name: "index.html", content: html },
                { name: "style.css", content: css },
                { name: "script.js", content: js }
            ]
        });
    } catch (error) {
        const timedOut = error.name === "TimeoutError" || error.name === "AbortError";
        console.error("Website Generation Error:", error.message);
        res.status(timedOut ? 504 : 502).json({
            success: false,
            message: timedOut ? "File generation timed out. Please try again." : error.message
        });
    }
});

// Server
app.listen(PORT, () => {
    console.log(`ULTRA WEB AI server running on port ${PORT}`);
    console.log(`AI Model: ${OLLAMA_MODEL}`);
});









