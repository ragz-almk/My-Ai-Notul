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
// 5. PEMROSESAN AI
// =========================================================
async function processAudio() {
    // 1. Siapkan file audio dari hasil rekaman
    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
    
    // 2. Buat nama file yang unik berdasarkan waktu saat ini
    const fileName = `rekaman_${Date.now()}.webm`;
    
    // 3. Tentukan lokasi penyimpanan di Firebase Storage (folder: audio_rapat)
    const storageRef = storage.ref(`audio_rapat/${fileName}`);
    
    try {
        // Tampilkan status loading upload ke layar
        const fileSizeMB = (audioBlob.size / 1024 / 1024).toFixed(2);
        transcriptContainer.innerHTML = `<p class="text-indigo-500 animate-pulse text-sm">Mengunggah rekaman ke Cloud (${fileSizeMB} MB)...</p>`;
        
        // 4. Proses unggah file ke Firebase Storage
        await storageRef.put(audioBlob);
        
        // 5. Buat format URL khusus (gs://) yang diwajibkan oleh Google Cloud STT
        const gcsUri = `gs://${firebaseConfig.storageBucket}/audio_rapat/${fileName}`;
        
        // Update status di layar
        transcriptContainer.innerHTML = `<p class="text-indigo-500 animate-pulse text-sm">Meminta AI memulai transkripsi...</p>`;
        
        // 6. Minta backend memulai proses dengan mengirim URI storage
        const startRes = await fetch('/api/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gcsUri: gcsUri }) 
        });
        const startData = await startRes.json();
        
        // Jika ada error dari server, hentikan dan lempar error
        if(!startRes.ok) throw new Error(startData.error || "Gagal memulai API");

        // Ambil "Nomor Resi" (Operation Name) dari backend
        const operationName = startData.operationName;
        
        // Update status di layar lagi
        transcriptContainer.innerHTML = `<p class="text-indigo-500 animate-pulse text-sm">AI sedang mentranskrip (mengecek setiap 5 detik)...</p>`;

        // 7. Lakukan pengecekan (Polling) dari Frontend agar Vercel aman dari Timeout
        let isDone = false;
        
        while (!isDone) {
            // Jeda/tunggu 5 detik sebelum mengecek lagi ke server
            await new Promise(resolve => setTimeout(resolve, 5000));

            // Tanya backend: "Apakah resi ini sudah selesai?"
            const checkRes = await fetch('/api/check-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ operationName: operationName })
            });
            
            const checkData = await checkRes.json();
            
            if (!checkRes.ok) throw new Error(checkData.error || "Gagal mengecek status API");

            // Jika backend menjawab "Sudah Selesai" (done: true)
            if (checkData.done) {
                isDone = true; // Hentikan perulangan (loop)
                
                // Tampilkan hasil teks transkrip di layar
                transcriptContainer.innerHTML = `<p class="text-gray-800">${checkData.text}</p>`;
                
                // Lanjut otomatis ke proses Rangkuman (Gemini)
                generateSummary(checkData.text); 
            }
        }
        
    } catch (error) {
        // Jika ada yang gagal di tahap mana pun, tampilkan pesan error merah
        transcriptContainer.innerHTML = `<p class="text-red-500 text-sm">Error Pemrosesan: ${error.message}</p>`;
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
