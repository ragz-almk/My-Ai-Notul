export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { audioBase64 } = req.body;
        
        // Pastikan Anda sudah membuat API Key di Google Cloud Console
        // dan mengaktifkan Cloud Speech-to-Text API
        const apiKey = process.env.GOOGLE_CLOUD_API_KEY; 

        // Memanggil REST API Google Cloud STT
        const response = await fetch(`https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                config: {
                    // WEBM_OPUS adalah standar umum jika audio berasal dari MediaRecorder web
                    encoding: "WEBM_OPUS", 
                    languageCode: "id-ID", // Atur ke bahasa Indonesia
                    // sampleRateHertz: 48000, // Buka komentar ini jika STT meminta sample rate yang spesifik
                },
                audio: {
                    content: audioBase64
                }
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error?.message || "Error dari Google Cloud STT");
        }

        // Google STT mengembalikan array 'results', kita perlu menggabungkannya menjadi satu paragraf
        let transcriptText = "";
        if (data.results && data.results.length > 0) {
            transcriptText = data.results
                .map(result => result.alternatives[0].transcript)
                .join(' ');
        } else {
            transcriptText = "(Tidak ada suara yang terdeteksi)";
        }
        
        res.status(200).json({ text: transcriptText });
    } catch (error) {
        console.error("Backend Transcribe Error:", error);
        res.status(500).json({ error: error.message });
    }
}
