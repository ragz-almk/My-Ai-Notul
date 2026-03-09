// Inisialisasi Lucide Icons
lucide.createIcons();

// State Variables
let isRecording = false;
let recordingTime = 0;
let timerInterval = null;

// DOM Elements - Views
const viewHome = document.getElementById('view-home');
const viewRecording = document.getElementById('view-recording');
const viewDetail = document.getElementById('view-detail');

// DOM Elements - Buttons & Text
const timerDisplay = document.getElementById('timer-display');
const btnPauseResume = document.getElementById('btn-pause-resume');
const iconPause = document.getElementById('icon-pause');
const iconPlay = document.getElementById('icon-play');
const btnStopRecord = document.getElementById('btn-stop-record');

// Tabs
const tabSummary = document.getElementById('tab-summary');
const tabTranscript = document.getElementById('tab-transcript');
const contentSummary = document.getElementById('content-summary');
const contentTranscript = document.getElementById('content-transcript');

// --- FUNGSI NAVIGASI HALAMAN ---
function showView(viewToShow) {
  // Sembunyikan semua
  viewHome.classList.add('hidden');
  viewRecording.classList.add('hidden');
  viewDetail.classList.add('hidden');
  // Tampilkan yang diminta
  viewToShow.classList.remove('hidden');
}

// Event Listeners Navigasi
document.getElementById('btn-start-record-main').addEventListener('click', startRecording);
document.querySelectorAll('.btn-start-record').forEach(btn => {
  btn.addEventListener('click', startRecording);
});
document.querySelectorAll('.btn-open-detail').forEach(btn => {
  btn.addEventListener('click', () => showView(viewDetail));
});
document.querySelectorAll('.btn-back-home').forEach(btn => {
  btn.addEventListener('click', () => showView(viewHome));
});


// --- LOGIKA RECORDING & TIMER ---
function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function startRecording() {
  // Reset Timer
  recordingTime = 0;
  isRecording = true;
  timerDisplay.textContent = formatTime(recordingTime);
  
  // Update ikon tombol pause/play
  iconPause.classList.remove('hidden');
  iconPlay.classList.add('hidden');

  showView(viewRecording);

  // Jalankan interval
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (isRecording) {
      recordingTime++;
      timerDisplay.textContent = formatTime(recordingTime);
    }
  }, 1000);
}

// Pause / Resume Record
btnPauseResume.addEventListener('click', () => {
  isRecording = !isRecording;
  if(isRecording) {
    iconPause.classList.remove('hidden');
    iconPlay.classList.add('hidden');
  } else {
    iconPause.classList.add('hidden');
    iconPlay.classList.remove('hidden');
  }
});

// Stop Record
btnStopRecord.addEventListener('click', () => {
  isRecording = false;
  clearInterval(timerInterval);
  showView(viewDetail);
});


// --- LOGIKA TAB DI HALAMAN DETAIL ---
function switchTab(activeTab) {
  if (activeTab === 'summary') {
    // Styling teks
    tabSummary.classList.replace('text-slate-400', 'text-indigo-600');
    tabTranscript.classList.replace('text-indigo-600', 'text-slate-400');
    
    // Indikator garis bawah
    tabSummary.querySelector('.tab-indicator').classList.remove('hidden');
    tabTranscript.querySelector('.tab-indicator').classList.add('hidden');
    
    // Tampilan Konten
    contentSummary.classList.remove('hidden');
    contentTranscript.classList.add('hidden');

  } else {
    // Styling teks
    tabTranscript.classList.replace('text-slate-400', 'text-indigo-600');
    tabSummary.classList.replace('text-indigo-600', 'text-slate-400');
    
    // Indikator garis bawah
    tabTranscript.querySelector('.tab-indicator').classList.remove('hidden');
    tabSummary.querySelector('.tab-indicator').classList.add('hidden');
    
    // Tampilan Konten
    contentTranscript.classList.remove('hidden');
    contentSummary.classList.add('hidden');
  }
}

tabSummary.addEventListener('click', () => switchTab('summary'));
tabTranscript.addEventListener('click', () => switchTab('transcript'));
