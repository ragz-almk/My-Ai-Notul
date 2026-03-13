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
const storage = firebase.storage();
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
    // 1. Sembunyikan semua halaman terlebih dahulu dengan aman
    document.getElementById('view-dashboard').classList.add('hidden');
    document.getElementById('view-dashboard').classList.remove('block');
    
    document.getElementById('view-recording').classList.add('hidden');
    document.getElementById('view-recording').classList.remove('flex');
    
    document.getElementById('view-notes').classList.add('hidden');
    document.getElementById('view-notes').classList.remove('flex');

    // 2. Reset tampilan semua tombol navigasi
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('bg-indigo-50', 'text-indigo-600', 'font-medium');
        btn.classList.add('text-gray-500', 'hover:bg-gray-50');
    });

    // 3. Tampilkan hanya halaman yang dipilih sesuai tabId
    if(tabId === 'recording') {
        document.getElementById('view-recording').classList.remove('hidden');
        document.getElementById('view-recording').classList.add('flex');
        document.getElementById('header-title').innerText = 'Sesi Rekaman';
    } else if(tabId === 'dashboard') {
        document.getElementById('view-dashboard').classList.remove('hidden');
        document.getElementById('view-dashboard').classList.add('block');
        document.getElementById('header-title').innerText = 'Selamat Pagi!';
    } else {
        document.getElementById('view-notes').classList.remove('hidden');
        document.getElementById('view-notes').classList.add('flex');
        document.getElementById('header-title').innerText = 'Arsip Notulen';
        // loadArchive(); // Panggil ini jika sudah membuat fungsi load
    }

    // 4. Tandai tombol navigasi yang aktif
    const activeBtn = document.getElementById(`nav-${tabId}`);
    activeBtn.classList.add('bg-indigo-50', 'text-indigo-600', 'font-medium');
    
    // 5. Tutup sidebar di mode mobile
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
// 5. PEMROSESAN AI (VERSI FIX)
// =========================================================
async function processAudio() {
    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
    const fileName = `rekaman_${Date.now()}.webm`;
    const storageRef = storage.ref(`audio_rapat/${fileName}`);
    
    try {
        const fileSizeMB = (audioBlob.size / 1024 / 1024).toFixed(2);
        transcriptContainer.innerHTML = `<p class="text-indigo-500 animate-pulse text-sm">Mengunggah ke Storage (${fileSizeMB} MB)...</p>`;
        
        // 1. Upload ke Firebase
        await storageRef.put(audioBlob);
        
        // 2. Ambil Download URL
        const downloadURL = await storageRef.getDownloadURL();
        
        transcriptContainer.innerHTML = `<p class="text-indigo-500 animate-pulse text-sm">AI Whisper sedang mentranskrip...</p>`;
        
        // 3. Panggil Backend
        const startRes = await fetch('/api/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileUrl: downloadURL }) 
        });
        
        // Pastikan variabel penampung json konsisten
        const result = await startRes.json(); 
        
        // Cek startRes.ok (bukan response.ok)
        if(!startRes.ok) throw new Error(result.error || "Gagal transkripsi");

        // Gunakan variabel result yang sudah di-parse tadi
        if (result.text) {
            transcriptContainer.innerHTML = `<p class="text-gray-800">${result.text}</p>`;
        
            // 4. Lanjut ke Summary
            generateSummary(result.text); 
        } else {
            throw new Error("Teks tidak ditemukan dalam respon JSON");
        } 
        
    } catch (error) {
        // Akan menangkap error jika Groq Error 400 atau variabel salah panggil
        transcriptContainer.innerHTML = `<p class="text-red-500 text-sm">Error: ${error.message}</p>`;
    }
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
    // 1. Mencegah klik ganda saat sedang loading
    if (btnSave.disabled) return;
    
    // Simpan teks asli dengan ikon
    const originalContent = `<i data-lucide="save" class="w-4 h-4 mr-2"></i> Simpan ke Arsip`;
    
    // 2. Kunci tombol agar tidak bisa diklik lagi
    btnSave.disabled = true;
    btnSave.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin mr-2"></i> Menyimpan...`;
    btnSave.classList.add('opacity-75', 'cursor-not-allowed');
    lucide.createIcons();

    try {
        // 3. Ambil teks dengan aman (mencegah error undefined)
        const pElement = transcriptContainer.querySelector('p');
        const transcriptText = pElement ? pElement.innerText : "Tidak ada transkrip";
        const finalSummary = aiSummaryText || "Tidak ada ringkasan AI";

        console.log("Mengirim ke Firestore...", { transcriptText, finalSummary });

        // 4. Proses Simpan
        await db.collection("arsip_rapat").add({
            tanggal: new Date().toISOString(),
            judul_rapat: "Rapat " + new Date().toLocaleDateString('id-ID'),
            transkrip: transcriptText,
            ringkasan: finalSummary,
        });

        // 5. Berhasil!
        console.log("Berhasil disimpan ke arsip!");
        btnSave.innerHTML = `<i data-lucide="check" class="w-4 h-4 mr-2"></i> Tersimpan!`;
        btnSave.classList.replace('bg-indigo-600', 'bg-emerald-500');
        lucide.createIcons();

        // Kembalikan tombol ke semula setelah 3 detik
        setTimeout(() => {
            btnSave.disabled = false;
            btnSave.innerHTML = originalContent;
            btnSave.classList.replace('bg-emerald-500', 'bg-indigo-600');
            btnSave.classList.remove('opacity-75', 'cursor-not-allowed');
            lucide.createIcons();
        }, 3000);

    } catch (error) {
        // 6. Jika gagal, tampilkan error di console dan layar
        console.error("Gagal simpan ke Firestore:", error);
        alert("Gagal menyimpan ke arsip: " + error.message);
        
        // Kembalikan status tombol
        btnSave.disabled = false;
        btnSave.innerHTML = originalContent;
        btnSave.classList.remove('opacity-75', 'cursor-not-allowed');
        lucide.createIcons();
    }
}

// =========================================================
// 7. KONTROL SIDEBAR (MOBILE VIEW)
// =========================================================
const sidebar = document.getElementById('sidebar');
const openSidebarBtn = document.getElementById('open-sidebar');
const closeSidebarBtn = document.getElementById('close-sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');

// Fungsi untuk membuka sidebar
openSidebarBtn.addEventListener('click', () => {
    sidebar.classList.remove('-translate-x-full');
    sidebarOverlay.classList.remove('hidden');
});

// Fungsi untuk menutup sidebar dari tombol "X"
closeSidebarBtn.addEventListener('click', () => {
    sidebar.classList.add('-translate-x-full');
    sidebarOverlay.classList.add('hidden');
});

// Fungsi untuk menutup sidebar jika user mengklik area gelap (overlay) di luar sidebar
sidebarOverlay.addEventListener('click', () => {
    sidebar.classList.add('-translate-x-full');
    sidebarOverlay.classList.add('hidden');
});
