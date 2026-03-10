// Inisialisasi ikon Lucide
lucide.createIcons();

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

// ... (Kode bagian atas script.js, navigasi tab, dan timer biarkan sama seperti sebelumnya) ...
// PENTING: Hapus semua variabel STT_API_KEY, LLM_API_KEY, dan URL dari bagian atas script.js Anda!

// 4. MEMPROSES AUDIO KE VERCEL BACKEND (MENGGUNAKAN GEMINI)
async function processAudio() {
    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
    
    // Ubah audio menjadi string Base64
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    
    reader.onloadend = async () => {
        const base64Audio = reader.result.split(',')[1];

        try {
            transcriptContainer.innerHTML = `<p class="text-indigo-500 animate-pulse text-sm">Sedang mengirim audio ke Google Cloud STT...</p>`;

            // --- PROSES 1: Transkripsi ---
            const sttResponse = await fetch('/api/transcribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ audioBase64: base64Audio })
            });

            const sttData = await sttResponse.json();
            if(!sttResponse.ok) throw new Error(sttData.error || "Gagal menghubungi backend STT");

            const transcript = sttData.text; // Sesuai dengan kembalian di api/transcribe.js
            transcriptContainer.innerHTML = `<p>${transcript}</p>`;
            statusText.innerText = "Transkripsi selesai.";

            // --- PROSES 2: Rangkuman ---
            generateSummary(transcript);

        } catch (error) {
            console.error("STT Error:", error);
            transcriptContainer.innerHTML = `<p class="text-red-500 text-sm">Gagal mentranskrip: ${error.message}</p>`;
        }
    };
}

async function generateSummary(text) {
    summaryContainer.innerHTML = `<p class="text-indigo-500 animate-pulse text-sm">Gemini sedang merangkum notulen...</p>`;

    try {
        const llmResponse = await fetch('/api/summarize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text })
        });

        const llmData = await llmResponse.json();
        if(!llmResponse.ok) throw new Error(llmData.error || "Gagal menghubungi backend LLM");

        aiSummaryText = llmData.summary; // Menyimpan teks murni untuk fitur TTS

        // Membersihkan format Markdown tebal (**) dari Gemini agar tampilan HTML lebih rapi
        let cleanText = aiSummaryText.replace(/\*\*/g, '');

        // Format teks untuk tampilan HTML
        const formattedHTML = cleanText
            .replace(/\n\n/g, '<br><br>')
            .replace(/\* (.*)/g, '<li class="flex items-start text-sm text-gray-600 mb-1"><i data-lucide="check-circle-2" class="w-4 h-4 text-indigo-500 mr-2 shrink-0"></i>$1</li>');

        summaryContainer.innerHTML = `<div class="text-sm text-gray-800">${formattedHTML}</div>`;
        lucide.createIcons();

    } catch (error) {
        console.error("LLM Error:", error);
        summaryContainer.innerHTML = `<p class="text-red-500 text-sm">Gagal membuat ringkasan: ${error.message}</p>`;
    }
}

// 5. FITUR TEXT TO SPEECH (Menggunakan Browser Native Web Speech API)
function playTTS() {
    if (!aiSummaryText) {
        alert("Belum ada ringkasan untuk dibacakan.");
        return;
    }

    // Menghentikan jika ada ucapan sebelumnya yang masih berjalan
    window.speechSynthesis.cancel(); 

    // Membersihkan simbol bintang dari markdown Gemini agar tidak ikut dibaca oleh robot
    const cleanTextForSpeech = aiSummaryText.replace(/\*/g, '');

    const speech = new SpeechSynthesisUtterance(cleanTextForSpeech);
    speech.lang = 'id-ID'; // Menggunakan bahasa Indonesia
    speech.rate = 1.0;     // Kecepatan normal
    
    const ttsButton = document.querySelector('button[title="Bacakan Notulen"]');
    const originalIcon = ttsButton.innerHTML;

    // Ubah ikon saat mulai berbicara
    speech.onstart = () => {
        ttsButton.innerHTML = `<i data-lucide="volume-x" class="w-4 h-4 text-indigo-500 animate-pulse"></i>`;
        lucide.createIcons();
    };

    // Kembalikan ikon saat selesai
    speech.onend = () => {
        ttsButton.innerHTML = originalIcon;
        lucide.createIcons();
    };

    speech.onerror = () => {
        ttsButton.innerHTML = originalIcon;
        lucide.createIcons();
    };

    // Putar suara
    window.speechSynthesis.speak(speech);
}
