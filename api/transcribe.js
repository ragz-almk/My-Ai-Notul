export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { gcsUri } = req.body; 
        const apiKey = process.env.GOOGLE_CLOUD_API_KEY; 

        // Memanggil API Asynchronous (longrunningrecognize)
        const response = await fetch(`https://speech.googleapis.com/v1/speech:longrunningrecognize?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                config: { encoding: "WEBM_OPUS", languageCode: "id-ID" },
                audio: { uri: gcsUri } 
            })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || "Gagal memulai STT");

        // Langsung kembalikan "Nomor Resi" (operationName) ke Frontend
        res.status(200).json({ operationName: data.name });

    } catch (error) {
        console.error("Transcribe Start Error:", error);
        res.status(500).json({ error: error.message });
    }
}