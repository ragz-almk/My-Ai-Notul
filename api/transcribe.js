export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { audioBase64 } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;

        // Memanggil API Gemini 2.5 Flash
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: "Tolong tuliskan transkrip dari rekaman rapat audio ini dengan akurat dalam bahasa Indonesia. Jangan tambahkan komentar apa pun, cukup kembalikan teks yang diucapkan saja." },
                        { inlineData: { mimeType: "audio/webm", data: audioBase64 } }
                    ]
                }]
            })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || "Error dari Gemini STT");

        // Mengambil hasil teks dari struktur respons Gemini
        const transcriptText = data.candidates[0].content.parts[0].text;
        
        res.status(200).json({ text: transcriptText });
    } catch (error) {
        console.error("Backend Transcribe Error:", error);
        res.status(500).json({ error: error.message });
    }
}
