export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { audioBase64 } = req.body;

        // Ubah Base64 kembali menjadi bentuk Buffer/File
        const buffer = Buffer.from(audioBase64, 'base64');
        const blob = new Blob([buffer], { type: 'audio/webm' });
        
        // Siapkan FormData untuk dikirim ke OpenAI
        const formData = new FormData();
        formData.append("file", blob, "recording.webm");
        formData.append("model", "whisper-1");

        // Kirim ke OpenAI secara diam-diam dari server
        const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: formData
        });

        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error?.message || "Error dari OpenAI STT");

        // Kembalikan hasil transkrip ke frontend
        res.status(200).json(data);
    } catch (error) {
        console.error("Backend STT Error:", error);
        res.status(500).json({ error: error.message });
    }
}
