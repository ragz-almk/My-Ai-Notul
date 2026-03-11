export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { operationName } = req.body;
        const apiKey = process.env.GOOGLE_CLOUD_API_KEY;

        // Cek status resi ke Google
        const response = await fetch(`https://speech.googleapis.com/v1/operations/${operationName}?key=${apiKey}`);
        const data = await response.json();

        if (!response.ok) throw new Error(data.error?.message || "Gagal mengecek status");

        // Jika proses sudah selesai (done: true)
        if (data.done) {
            let transcriptText = "(Tidak ada suara yang terdeteksi)";
            if (data.response && data.response.results) {
                transcriptText = data.response.results
                    .map(result => result.alternatives[0].transcript)
                    .join(' ');
            }
            return res.status(200).json({ done: true, text: transcriptText });
        } 
        
        // Jika belum selesai
        return res.status(200).json({ done: false });

    } catch (error) {
        console.error("Check Status Error:", error);
        res.status(500).json({ error: error.message });
    }
}