export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { text } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;

        const prompt = `Anda adalah asisten notulen profesional. Buat ringkasan paragraf singkat dan daftar bullet "Action Items" dari transkrip rapat berikut:\n\n"${text}"`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || "Error dari Gemini LLM");

        // Mengambil hasil teks dari struktur respons Gemini
        const summaryText = data.candidates[0].content.parts[0].text;

        res.status(200).json({ summary: summaryText });
    } catch (error) {
        console.error("Backend Summarize Error:", error);
        res.status(500).json({ error: error.message });
    }
}
