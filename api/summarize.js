export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { text } = req.body;
        const prompt = `Anda adalah asisten notulen profesional. Buat ringkasan paragraf singkat dan daftar bullet "Action Items" dari transkrip berikut:\n\n"${text}"`;

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: prompt }]
            })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || "Error dari OpenAI LLM");

        res.status(200).json(data);
    } catch (error) {
        console.error("Backend LLM Error:", error);
        res.status(500).json({ error: error.message });
    }
}
