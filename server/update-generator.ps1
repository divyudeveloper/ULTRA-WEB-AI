$path = ".\server.js"
$source = Get-Content $path -Raw
$start = $source.IndexOf("// AI Website Generation API")
$end = $source.IndexOf("// Server", $start)

if ($start -lt 0 -or $end -lt 0) { throw "Generator section not found. No changes made." }

$backup = "server.js.backup-" + (Get-Date -Format "yyyyMMdd_HHmmss")
Copy-Item $path $backup

$replacement = @"
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
                        { role: "system", content: "You are an expert web developer. Return only complete source code. No Markdown fences or explanations." },
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
                .replace(/^```[a-zA-Z0-9_-]*\s*/, "")
                .replace(/\s*```$/, "")
                .trim();

            if (!code) throw new Error("AI returned empty code.");
            return code;
        }

        console.log("Generating HTML...");
        const html = await generateFile(
            "Create complete responsive HTML for this website: " + prompt + ". Include semantic sections and link style.css and script.js. No inline CSS or JavaScript.",
            1100
        );

        console.log("Generating CSS...");
        const css = await generateFile(
            "Write complete responsive CSS for this HTML. Return CSS only. HTML:\n" + html,
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
"@

$updated = $source.Substring(0, $start) + $replacement + $source.Substring($end + 9)
Set-Content -Path $path -Value $updated -Encoding utf8
Write-Host "Generator updated. Backup:" $backup
