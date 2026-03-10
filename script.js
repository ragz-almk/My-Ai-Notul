// =========================================================
// 1. KONFIGURASI FIREBASE
// =========================================================
const firebaseConfig = {
    apiKey: "AIzaSyBvTKkWvz5iC04Za-zkbKYvBjaNlg8try0",
    authDomain: "project-9d0d452a-34e8-478d-81b.firebaseapp.com",
    projectId: "project-9d0d452a-34e8-478d-81b",
    storageBucket: "project-9d0d452a-34e8-478d-81b.firebasestorage.app",
    messagingSenderId: "403143207083",
    appId: "1:403143207083:web:7293fa99502bea373a2fee",
    measurementId: "G-SPWXJ62FLV"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
lucide.createIcons();

// =========================================================
// 2. VARIABEL STATE & DOM ELEMENTS
// =========================================================
let isRecording = false;
let recordingTime = 0;
let timerInterval;
let mediaRecorder;
let audioChunks = [];
let aiSummaryText = ""; 

const timerDisplay = document.getElementById('timer-display');
const toggleRecordBtn = document.getElementById('toggle-record-btn');
const recordIcon = document.getElementById('record-icon');
const recordText = document.getElementById('record-text');
const waveformContainer = document.getElementById('waveform');
const statusText = document.getElementById('status-text');
const transcriptContainer = document.getElementById('transcript-container');
const summaryContainer = document.getElementById('summary-container');
const btnSave = document.getElementById('btn-save');

// Visual Waveform
for (let i = 0; i < 30; i++) {
    const bar = document.createElement('div');
    bar.className = 'wave-bar';
    waveformContainer.appendChild(bar);
}

// =========================================================
// 3. NAVIGASI
// =========================================================
function switchTab(tabId) {
    document.getElementById('view-dashboard').classList.replace('block', 'hidden');
    document.getElementById('view-recording').classList.replace('flex', 'hidden');
    document.getElementById('view-notes').classList.replace('hidden', 'flex');

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('bg-indigo-50', 'text-indigo-600', 'font-medium');
        btn.classList.add('text-gray-500', 'hover:bg-gray-50');
    });

    if(tabId === 'recording') {
        document.getElementById('view-recording').classList.replace('hidden', 'flex');
        document.getElementById('header-title').innerText = 'Sesi Rekaman';
    } else if(tabId === 'dashboard') {
        document.getElementById('view-dashboard').classList.replace('hidden', 'block');
        document.getElementById('header-title').innerText = 'Selamat Pagi!';
    } else {
        document.getElementById('view-notes').classList.replace('hidden', 'flex');
        document.getElementById('header-title').innerText = 'Arsip Notulen';
        // loadArchive(); // Panggil ini jika sudah membuat fungsi load
    }

    const activeBtn = document.getElementById(`nav-${tabId}`);
    activeBtn.classList.add('bg-indigo-50', 'text-indigo-600', 'font-medium');
    document.getElementById('sidebar').classList.add('-translate-x-full');
    document.getElementById('sidebar-overlay').classList.add('hidden');
}

// =========================================================
// 4. LOGIKA PEREKAMAN
// =========================================================
toggleRecordBtn.addEventListener('click', async () => {
    if (!isRecording) {
        await startRecording();
    } else {
        stopRecording();
    }
});

async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        mediaRecorder.ondataavailable = event => { if (event.data.size > 0) audioChunks.push(event.data); };
        mediaRecorder.onstop = processAudio;
        mediaRecorder.start();
        
        isRecording = true;
        recordingTime = 0;
        btnSave.classList.add('hidden'); 
        toggleRecordBtn.classList.replace('bg-indigo-600', 'bg-red-50');
        toggleRecordBtn.classList.replace('text-white', 'text-red-600');
        recordText.innerText = "Hentikan";
        recordIcon.setAttribute('data-lucide', 'square');
        lucide.createIcons();
        waveformContainer.classList.add('is-recording');
        statusText.innerText = "Sedang merekam...";
        timerInterval = setInterval(updateTimerAndWaveform, 1000);
    } catch (err) { alert("Akses mikrofon ditolak."); }
}

function stopRecording() {
    isRecording = false;
    mediaRecorder.stop();
    mediaRecorder.stream.getTracks().forEach(track => track.stop());
    clearInterval(timerInterval);
    toggleRecordBtn.classList.replace('bg-red-50', 'bg-indigo-600');
    toggleRecordBtn.classList.replace('text-red-600', 'text-white');
    recordText.innerText = "Mulai Rekam";
    recordIcon.setAttribute('data-lucide', 'mic');
    lucide.createIcons();
    waveformContainer.classList.remove('is-recording');
    statusText.innerText = "Menunggu AI...";
}

function updateTimerAndWaveform() {
    recordingTime++;
    const m = Math.floor(recordingTime / 60).toString().padStart(2, '0');
    const s = (recordingTime % 60).toString().padStart(2, '0');
    timerDisplay.innerText = `${m}:${s}`;
    document.querySelectorAll('.wave-bar').forEach(bar => {
        bar.style.height = `${Math.floor(Math.random() * 40) + 10}px`;
    });
}

// =========================================================
// 5. PEMROSESAN AI
// =========================================================
async function processAudio() {
    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    
    reader.onloadend = async () => {
        const base64Audio = reader.result.split(',')[1];
        try {
            transcriptContainer.innerHTML = `<p class="text-indigo-500 animate-pulse text-sm">Mentranskrip via Google Cloud...</p>`;
            const response = await fetch('/api/transcribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ audioBase64: base64Audio })
            });
            const data = await response.json();
            if(!response.ok) throw new Error(data.error);

            transcriptContainer.innerHTML = `<p class="text-gray-800">${data.text}</p>`;
            generateSummary(data.text);
        } catch (error) {
            transcriptContainer.innerHTML = `<p class="text-red-500 text-sm">Error STT: ${error.message}</p>`;
        }
    };
}

async function generateSummary(text) {
    // 🌟 PERBAIKAN: Menampilkan loading murni tanpa variabel yang belum ada
    summaryContainer.innerHTML = `<p class="text-indigo-500 animate-pulse text-sm">Gemini sedang merangkum...</p>`;
    
    try {
        const response = await fetch('/api/summarize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text })
        });

        const data = await response.json();
        if(!response.ok) throw new Error(data.error);

        aiSummaryText = data.summary;
        
        // 🌟 PERBAIKAN: Format dilakukan SETELAH data diterima
        const cleanText = aiSummaryText.replace(/\*\*/g, '');
        const formattedHTML = cleanText
            .replace(/\n\n/g, '<br><br>')
            .replace(/\* (.*)/g, '<li class="flex items-start text-sm text-gray-600 mb-1"><i data-lucide="check-circle-2" class="w-4 h-4 text-indigo-500 mr-2 shrink-0"></i>$1</li>');

        summaryContainer.innerHTML = `<div class="text-sm text-gray-800">${formattedHTML}</div>`;
        btnSave.classList.remove('hidden'); // Munculkan tombol simpan
        statusText.innerText = "Selesai.";
        lucide.createIcons();
    } catch (error) {
        summaryContainer.innerHTML = `<p class="text-red-500 text-sm">Error Summary: ${error.message}</p>`;
    }
}

// =========================================================
// 6. FITUR TAMBAHAN (TTS & FIREBASE)
// =========================================================
function playTTS() {
    if (!aiSummaryText) return;
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(aiSummaryText.replace(/\*/g, ''));
    speech.lang = 'id-ID';
    window.speechSynthesis.speak(speech);
}

async function saveToFirebase() {
    const originalContent = btnSave.innerHTML;
    btnSave.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin mr-2"></i> Menyimpan...`;
    btnSave.classList.add('opacity-75', 'cursor-not-allowed');
    lucide.createIcons();

    try {
        const transcriptText = transcriptContainer.querySelector('p').innerText;
        await db.collection("arsip_rapat").add({
            tanggal: new Date().toISOString(),
            judul_rapat: "Rapat " + new Date().toLocaleDateString('id-ID'),
            transkrip: transcriptText,
            ringkasan: aiSummaryText,
        });

        btnSave.innerHTML = `<i data-lucide="check" class="w-4 h-4 mr-2"></i> Tersimpan!`;
        btnSave.classList.replace('bg-indigo-600', 'bg-emerald-500');

        setTimeout(() => {
            btnSave.innerHTML = originalContent;
            btnSave.classList.replace('bg-emerald-500', 'bg-indigo-600');
            btnSave.classList.remove('opacity-75', 'cursor-not-allowed');
            lucide.createIcons();
        }, 3000);
    } catch (error) {
        alert("Gagal simpan: " + error.message);
        btnSave.innerHTML = originalContent;
        btnSave.classList.remove('opacity-75', 'cursor-not-allowed');
    }
}
