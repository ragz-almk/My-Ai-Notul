// Inisialisasi ikon Lucide
lucide.createIcons();

// =========================================================
// KONFIGURASI API KEY AI (Ganti dengan API Key Anda!)
// =========================================================
// API 1: Untuk Speech to Text (Contoh: Groq Whisper API atau OpenAI)
const STT_API_KEY = "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"; 
const STT_API_URL = "https://api.openai.com/v1/audio/speech"; // Ubah URL jika menggunakan provider lain seperti Groq

// API 2: Untuk Ringkasan Bahasa (Contoh: OpenAI GPT-4 atau Llama/Gemini)
const LLM_API_KEY = "MASUKKAN_API_KEY_LLM_ANDA_DISINI";
const LLM_API_URL = "https://api.openai.com/v1/chat/completions";

// Variabel State
let isRecording = false;
let recordingTime = 0;
let timerInterval;
let mediaRecorder;
let audioChunks = [];
let aiSummaryText = ""; // Untuk fitur Text-to-Speech

// DOM Elements
const timerDisplay = document.getElementById('timerDisplay');
const toggleRecordBtn = document.getElementById('toggle-record-btn');
const recordIcon = document.getElementById('record-icon');
const recordText = document.getElementById('record-text');
const waveformContainer = document.getElementById('waveform');
const statusText = document.getElementById('status-text');
const transcriptContainer = document.getElementById('transcript-container');
const summaryContainer = document.getElementById('summary-container');

// 1. BUAT GELOMBANG SUARA (Visual UI saja)
for (let i = 0; i < 30; i++) {
    const bar = document.createElement('div');
    bar.className = 'wave-bar';
    waveformContainer.appendChild(bar);
}

// 2. NAVIGASI TAB & SIDEBAR
function switchTab(tabId) {
    // Sembunyikan semua view
    document.getElementById('view-dashboard').classList.replace('block', 'hidden');
    document.getElementById('view-recording').classList.replace('flex', 'hidden');
    document.getElementById('view-notes').classList.replace('flex', 'hidden');

    // Reset style semua tombol navigasi
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('bg-indigo-50', 'text-indigo-600', 'font-medium');
        btn.classList.add('text-gray-500', 'hover:bg-gray-50');
    });

    // Tampilkan view yang dipilih
    if(tabId === 'recording') {
        document.getElementById('view-recording').classList.replace('hidden', 'flex');
        document.getElementById('header-title').innerText = 'Sesi Rekaman';
    } else if(tabId === 'dashboard') {
        document.getElementById('view-dashboard').classList.replace('hidden', 'block');
        document.getElementById('header-title').innerText = 'Selamat Pagi!';
    } else {
        document.getElementById('view-notes').classList.replace('hidden', 'flex');
        document.getElementById('header-title').innerText = 'Arsip Notulen';
    }

    // Update style tombol yang aktif
    const activeBtn = document.getElementById(`nav-${tabId}`);
    activeBtn.classList.remove('text-gray-500', 'hover:bg-gray-50');
    activeBtn.classList.add('bg-indigo-50', 'text-indigo-600', 'font-medium');

    // Tutup sidebar di mobile
    document.getElementById('sidebar').classList.add('-translate-x-full');
    document.getElementById('sidebar-overlay').classList.add('hidden');
}

// Sidebar Mobile Toggle
document.getElementById('open-sidebar').onclick = () => {
    document.getElementById('sidebar').classList.remove('-translate-x-full');
    document.getElementById('sidebar-overlay').classList.remove('hidden');
};
document.getElementById('close-sidebar').onclick = () => {
    document.getElementById('sidebar').classList.add('-translate-x-full');
    document.getElementById('sidebar-overlay').classList.add('hidden');
};
document.getElementById('sidebar-overlay').onclick = document.getElementById('close-sidebar').onclick;

// 3. FUNGSI PEREKAMAN AUDIO
toggleRecordBtn.addEventListener('click', async () => {
    if (!isRecording) {
        await startRecording();
    } else {
        stopRecording();
    }
});

async function startRecording() {
    try {
        // Meminta izin mikrofon
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = event => {
            if (event.data.size > 0) audioChunks.push(event.data);
        };

        mediaRecorder.onstop = processAudio; // Saat berhenti, proses ke AI

        mediaRecorder.start();
        isRecording = true;
        switchTab('recording');

        // Update UI Button
        toggleRecordBtn.classList.replace('bg-indigo-600', 'bg-red-50');
        toggleRecordBtn.classList.replace('text-white', 'text-red-600');
        toggleRecordBtn.classList.add('ring-1', 'ring-red-200');
        recordText.innerText = "Hentikan";
        recordIcon.setAttribute('data-lucide', 'square');
        lucide.createIcons();
        waveformContainer.classList.add('is-recording');
        statusText.innerText = "Sedang merekam... Bicaralah.";
        
        // Mulai Timer & Animasi Gelombang
        timerInterval = setInterval(updateTimerAndWaveform, 1000);

    } catch (err) {
        alert("Gagal mengakses mikrofon: " + err.message);
    }
}

function stopRecording() {
    isRecording = false;
    mediaRecorder.stop();
    mediaRecorder.stream.getTracks().forEach(track => track.stop()); // Matikan mikrofon
    clearInterval(timerInterval);

    // Reset UI Button
    toggleRecordBtn.classList.replace('bg-red-50', 'bg-indigo-600');
    toggleRecordBtn.classList.replace('text-red-600', 'text-white');
    toggleRecordBtn.classList.remove('ring-1', 'ring-red-200');
    recordText.innerText = "Mulai Rekam";
    recordIcon.setAttribute('data-lucide', 'mic');
    lucide.createIcons();
    waveformContainer.classList.remove('is-recording');
    
    // Reset tinggi gelombang
    document.querySelectorAll('.wave-bar').forEach(bar => bar.style.height = '8px');
    statusText.innerText = "Memproses transkripsi AI... Mohon tunggu.";
}

function updateTimerAndWaveform() {
    recordingTime++;
    const m = Math.floor(recordingTime / 60).toString().padStart(2, '0');
    const s = (recordingTime % 60).toString().padStart(2, '0');
    document.getElementById('timer-display').innerText = `${m}:${s}`;

    // Animasi acak untuk gelombang saat merekam
    document.querySelectorAll('.wave-bar').forEach(bar => {
        const height = Math.floor(Math.random() * 40) + 10; // Tinggi acak 10-50px
        bar.style.height = `${height}px`;
    });
}

// 4. MEMPROSES AUDIO KE API STT & LLM
async function processAudio() {
    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
    const audioFile = new File([audioBlob], "recording.webm", { type: 'audio/webm' });

    // Cek jika API Key belum diisi
    if(STT_API_KEY === "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") {
        transcriptContainer.innerHTML = `<p class="text-red-500 text-sm">⚠️ API Key STT belum dimasukkan di script.js!</p>`;
        return;
    }

    try {
        // --- PROSES 1: Speech-to-Text (API 1) ---
        const formData = new FormData();
        formData.append("file", audioFile);
        formData.append("model", "gpt-4o-transcribe"); 
        
        transcriptContainer.innerHTML = `<p class="text-indigo-500 animate-pulse text-sm">Sedang mengunggah audio ke AI Transkrip...</p>`;

        const sttResponse = await fetch(STT_API_URL, {
            method: "POST",
            headers: { "Authorization": `Bearer ${STT_API_KEY}` },
            body: formData
        });

        const sttData = await sttResponse.json();
        
        if(!sttResponse.ok) throw new Error(sttData.error?.message || "STT API Error");

        const transcript = sttData.text;
        transcriptContainer.innerHTML = `<p>${transcript}</p>`;
        statusText.innerText = "Transkripsi selesai.";

        // --- PROSES 2: Summarization (API 2) ---
        generateSummary(transcript);

    } catch (error) {
        console.error("STT Error:", error);
        transcriptContainer.innerHTML = `<p class="text-red-500 text-sm">Gagal mentranskrip: ${error.message}</p>`;
    }
}

async function generateSummary(text) {
    if(LLM_API_KEY === "MASUKKAN_API_KEY_LLM_ANDA_DISINI") {
        summaryContainer.innerHTML = `<p class="text-red-500 text-sm">⚠️ API Key LLM belum dimasukkan!</p>`;
        return;
    }

    summaryContainer.innerHTML = `<p class="text-indigo-500 animate-pulse text-sm">Sedang merangkum dan membuat action items...</p>`;

    try {
        const prompt = `Anda adalah asisten notulen profesional. Buat ringkasan paragraf singkat dan daftar bullet "Action Items" dari transkrip berikut:\n\n"${text}"`;

        const llmResponse = await fetch(LLM_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${LLM_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo", // Sesuaikan dengan model LLM Anda
                messages: [{ role: "user", content: prompt }]
            })
        });

        const llmData = await llmResponse.json();
        if(!llmResponse.ok) throw new Error(llmData.error?.message || "LLM API Error");

        aiSummaryText = llmData.choices[0].message.content; // Simpan untuk Text-to-Speech

        // Format teks menggunakan Regex sederhana untuk tampilan HTML
        const formattedHTML = aiSummaryText
            .replace(/\n\n/g, '<br><br>')
            .replace(/- (.*)/g, '<li class="flex items-start text-sm text-gray-600 mb-1"><i data-lucide="check-circle-2" class="w-4 h-4 text-indigo-500 mr-2 shrink-0"></i>$1</li>');

        summaryContainer.innerHTML = `<div class="text-sm text-gray-800">${formattedHTML}</div>`;
        lucide.createIcons(); // render ulang ikon yang baru disuntikkan

    } catch (error) {
        console.error("LLM Error:", error);
        summaryContainer.innerHTML = `<p class="text-red-500 text-sm">Gagal membuat ringkasan: ${error.message}</p>`;
    }
}

// 5. FITUR TEXT TO SPEECH (Menggunakan OpenAI TTS)
async function playTTS() {
    if (!aiSummaryText) {
        alert("Belum ada ringkasan untuk dibacakan.");
        return;
    }
    
    // Pastikan API Key OpenAI sudah diisi
    if(LLM_API_KEY === "MASUKKAN_API_KEY_OPENAI_ANDA_DISINI" || !LLM_API_KEY) {
        alert("⚠️ API Key OpenAI belum dimasukkan untuk fitur TTS!");
        return;
    }

    const ttsButton = document.querySelector('button[title="Bacakan Notulen"]');
    const originalIcon = ttsButton.innerHTML; // Simpan ikon original (Volume)

    try {
        // Ubah ikon tombol menjadi status "Loading" agar pengguna tahu proses sedang berjalan
        ttsButton.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin text-indigo-500"></i>`;
        lucide.createIcons();

        // Mengirim request ke OpenAI Audio Speech API
        const response = await fetch(TTS_API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${LLM_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "tts-1", // Bisa pakai "tts-1-hd" jika ingin kualitas studio (lebih mahal sedikit)
                voice: "nova",  // Pilihan suara: alloy, echo, fable, onyx, nova, shimmer
                input: aiSummaryText
            })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error?.message || "Gagal memanggil API TTS OpenAI");
        }

        // OpenAI mengembalikan file audio (audio/mpeg). Kita ubah menjadi Blob.
        const audioBlob = await response.blob();
        
        // Buat URL sementara (Object URL) dari Blob tersebut agar bisa diputar di browser
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        // Putar suaranya!
        audio.play();

        // Kembalikan ikon ke semula ketika audio mulai diputar
        audio.onplay = () => {
            ttsButton.innerHTML = originalIcon;
            lucide.createIcons();
        };

        // Bersihkan memori setelah audio selesai diputar
        audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
        };

    } catch (error) {
        console.error("TTS Error:", error);
        alert("Terjadi kesalahan saat memutar TTS: " + error.message);
        
        // Kembalikan ikon jika terjadi error
        ttsButton.innerHTML = originalIcon;
        lucide.createIcons();
    }
}
