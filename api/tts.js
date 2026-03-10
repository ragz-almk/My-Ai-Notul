export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { text } = req.body;

        const response = await fetch("https://api.openai.com/v1/audio/speech", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "tts-1",
                voice: "nova",
                input: text
            })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error?.message || "Error dari OpenAI TTS");
        }

        // Ambil file audio sebagai ArrayBuffer dan kirim ke frontend
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // Beritahu frontend bahwa yang dikirim adalah file audio
        res.setHeader('Content-Type', 'audio/mpeg');
        res.status(200).send(buffer);
    } catch (error) {
        console.error("Backend TTS Error:", error);
        res.status(500).json({ error: error.message });
    }
}
