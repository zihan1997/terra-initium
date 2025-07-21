// utility call to gpt
async function callGPT(message) {
    return await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
            "Authorization": "",
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "gpt-4o-mini",
            input: [
                { role: "system", content: "You are a Java coding assistant for LeetCode." },
                { role: "user", content: `Solve this LeetCode problem in Java:\n\n${problemText}\n\nOnly output Java code.` }
            ],
            temperature: 0.5
        })
    });
}
