// Inisialisasi ikon Lucide
lucide.createIcons();

// --- MANAJEMEN TAB ---
const tabs = ['stt', 'summary', 'tts'];

tabs.forEach(tab => {
  document.getElementById(`btn-tab-${tab}`).addEventListener('click', () => {
    // Sembunyikan semua konten dan reset tombol
    tabs.forEach(t => {
      document.getElementById(`tab-${t}`).classList.add('hidden');
      document.getElementById(`tab-${t}`).classList.remove('block');
      
      const btn = document.getElementById(`btn-tab-${t}`);
      btn.className = `tab-btn flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all text-slate-500 hover:text-slate-700`;
    });

    // Tampilkan tab yang dipilih
    document.getElementById(`tab-${tab}`).classList.remove('hidden');
    document.getElementById(`tab-${tab}`).classList.add('block');
    
    // Ubah gaya tombol yang aktif
    const activeBtn = document.getElementById(`btn-tab-${tab}`);
    activeBtn.className = `tab-btn flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all bg-white text-blue-600 shadow-sm`;
  });
});

// --- STATE APLIKASI ---
let isRecording = false;
let recordingTimer = null;
let secondsElapsed = 0;
let fullTranscript = ""; // Akan menyimpan teks gabungan untuk diringkas
let mediaRecorder;
let audioChunks = [];

// Elemen DOM
const btnRecord = document.getElementById('btn-record');
const recordIcon = document.getElementById('record-icon');
const recordPulse = document.getElementById('record-pulse');
const recordingStatus = document.getElementById('recording-status');
const recordingTimeEl = document.getElementById('recording-time');
const transcriptContainer = document.getElementById('transcript-container');
const btnGenerateSummary = document.getElementById('btn-generate-summary');
const summaryContent = document.getElementById('summary-content');

// --- FORMAT WAKTU ---
function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// --- FUNGSI MEREKAM SUARA ---
async function toggleRecording() {
  if (!isRecording) {
    // MULAI MEREKAM
    try {
      // Minta izin akses mikrofon
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        // Saat rekaman dihentikan, jadikan blob (file audio)
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        await processAudioWithAI(audioBlob);
      };

      mediaRecorder.start();

      // Update UI
      isRecording = true;
      btnRecord.classList.replace('bg-red-500', 'bg-slate-800');
      btnRecord.classList.replace('hover:bg-red-600', 'hover:bg-slate-700');
      recordIcon.setAttribute('data-lucide', 'square');
      recordPulse.classList.remove('hidden');
      recordingStatus.innerText = 'Merekam...';
      transcriptContainer.innerHTML = `<div class="p-3 bg-blue-50 text-blue-600 rounded-xl text-sm animate-pulse">Sedang mendengarkan...</div>`;
      lucide.createIcons();

      // Mulai Timer
      secondsElapsed = 0;
      recordingTimeEl.innerText = formatTime(secondsElapsed);
      recordingTimer = setInterval(() => {
        secondsElapsed++;
        recordingTimeEl.innerText = formatTime(secondsElapsed);
      }, 1000);

    } catch (err) {
      alert("Gagal mengakses mikrofon. Pastikan izin diberikan.");
      console.error(err);
    }

  } else {
    // BERHENTI MEREKAM
    mediaRecorder.stop(); // Ini akan memicu event onstop di atas

    // Update UI
    isRecording = false;
    clearInterval(recordingTimer);
    btnRecord.classList.replace('bg-slate-800', 'bg-red-500');
    btnRecord.classList.replace('hover:bg-slate-700', 'hover:bg-red-600');
    recordIcon.setAttribute('data-lucide', 'mic');
    recordPulse.classList.add('hidden');
    recordingStatus.innerText = 'Memproses Audio...';
    lucide.createIcons();
  }
}

btnRecord.addEventListener('click', toggleRecording);

// --- 1. INTEGRASI API: SPEECH TO TEXT ---
// Fungsi ini mengirim file audio ke backend Vercel kamu
async function processAudioWithAI(audioBlob) {
  try {
    // Membuat form data untuk dikirim
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.webm');

    // MOCK API CALL - Ganti URL ini dengan endpoint Vercel-mu!
    // Contoh: const response = await fetch('/api/stt', { method: 'POST', body: formData });
    
    // Simulasi loading/delay API (Hapus ini jika sudah pakai API asli)
    await new Promise(resolve => setTimeout(resolve, 2000));
    const mockResponse = { text: "Selamat pagi semuanya. Mari kita mulai rapat sinkronisasi hari ini. Agenda utama kita adalah peluncuran fitur baru bulan depan." };
    
    // Anggap transkrip berhasil didapat
    const transcriptText = mockResponse.text; // Pada API asli: await response.json().text
    fullTranscript += transcriptText + " "; // Simpan untuk diringkas nanti

    // Tampilkan di UI
    recordingStatus.innerText = 'Siap Merekam';
    transcriptContainer.innerHTML = `
      <div class="flex gap-3 mb-4">
        <div class="flex-1 bg-slate-50 p-3 rounded-2xl border border-slate-100">
          <p class="text-slate-600 leading-relaxed text-sm">${transcriptText}</p>
        </div>
      </div>
    `;

  } catch (error) {
    console.error("Error STT API:", error);
    recordingStatus.innerText = 'Gagal memproses audio';
  }
}

// --- 2. INTEGRASI API: NATURAL LANGUAGE (RINGKASAN) ---
// Fungsi ini mengirim fullTranscript ke AI untuk diringkas
btnGenerateSummary.addEventListener('click', async () => {
  if (!fullTranscript.trim()) {
    alert("Belum ada transkrip untuk diringkas. Silakan rekam sesuatu di tab Rapat Aktif.");
    return;
  }

  summaryContent.innerHTML = `<p class="text-blue-500 text-sm animate-pulse">AI sedang menganalisis rapat... mohon tunggu.</p>`;

  try {
    // MOCK API CALL - Ganti URL ini dengan endpoint Vercel-mu!
    /*
    const response = await fetch('/api/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: fullTranscript })
    });
    const result = await response.json();
    */

    // Simulasi loading/delay API
    await new Promise(resolve => setTimeout(resolve, 2500));
    const aiSummary = "Rapat membahas persiapan peluncuran fitur baru. Segera selesaikan persiapan peluncuran.";

    // Tampilkan di UI
    summaryContent.innerHTML = `
      <div class="bg-slate-50 p-4 rounded-2xl border border-slate-100">
        <h3 class="font-bold text-slate-700 mb-2">Ringkasan Utama</h3>
        <p class="text-slate-600 text-sm md:text-base leading-relaxed">
          ${aiSummary}
        </p>
      </div>
    `;

  } catch (error) {
    console.error("Error Summary API:", error);
    summaryContent.innerHTML = `<p class="text-red-500 text-sm">Gagal membuat ringkasan. Coba lagi.</p>`;
  }
});
