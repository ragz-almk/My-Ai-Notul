// transcribe.js
export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { audioUrl } = req.body; // Whisper butuh URL publik atau file langsung
        const apiKey = process.env.GROQ_API_KEY; 

        // Catatan: Jika audio ada di GCS, pastikan 'audioUrl' adalah Signed URL yang bisa diakses publik
        
        // Menyiapkan Form Data untuk Whisper
        // Di lingkungan Node.js, biasanya kita perlu mengambil file-nya dulu atau menggunakan stream
        const response = await fetch(`https://api.groq.com/openai/v1/audio/transcriptions`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json" // Jika mengirim file langsung, gunakan multipart/form-data
            },
            body: JSON.stringify({
                file: audioUrl, // Tergantung library, biasanya perlu dikonversi ke Blob/File
                model: "whisper-large-v3",
                language: "id",
                response_format: "json"
            })
        });

        const data = await response.json();
        
        // Berbeda dengan Google, data di sini kemungkinan besar LANGSUNG berisi teks
        res.status(200).json({ 
            text: data.text, 
            status: "completed" // Kita beri status completed agar frontend tahu ini sudah selesai
        });

    } catch (error) {
        console.error("Whisper Error:", error);
        res.status(500).json({ error: error.message });
    }
}