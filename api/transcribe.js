export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { fileUrl } = req.body; 
        const apiKey = process.env.GROQ_API_KEY;

        if (!fileUrl) throw new Error("File URL kosong");

        // 1. Ambil file dari Firebase
        const audioResponse = await fetch(fileUrl);
        const audioBlob = await audioResponse.blob();

        // 2. Bungkus ke FormData (Format WAJIB Whisper Groq)
        const formData = new FormData();
        formData.append('file', audioBlob, 'rekaman.webm');
        formData.append('model', 'whisper-large-v3');
        formData.append('language', 'id'); // Paksa ke Bahasa Indonesia
        formData.append('response_format', 'json');

        // 3. Tembak ke Groq
        const groqRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`
                // Jangan set Content-Type manual, fetch akan otomatis set ke multipart/form-data
            },
            body: formData
        });

        const data = await groqRes.json();

        if (!groqRes.ok) {
            console.error("Groq Ngambek:", data);
            throw new Error(data.error?.message || "Gagal di Groq");
        }

        // 4. Balikkan teks ke Frontend
        res.status(200).json({ text: data.text });

    } catch (error) {
        console.error("Transcribe Error:", error);
        res.status(500).json({ error: error.message });
    }
}