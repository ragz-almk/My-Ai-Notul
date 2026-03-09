lucide.createIcons();

// State Variables
let isRecording = false;
let recordingTime = 0;
let timerInterval = null;

// DOM Elements
const views = document.querySelectorAll('.view-section');
const viewHome = document.getElementById('view-home');
const viewRecording = document.getElementById('view-recording');
const viewDetail = document.getElementById('view-detail');

const timerDisplay = document.getElementById('timer-display');
const btnPauseResume = document.getElementById('btn-pause-resume');
const iconPause = document.getElementById('icon-pause');
const iconPlay = document.getElementById('icon-play');
const btnStopRecord = document.getElementById('btn-stop-record');

const tabSummary = document.getElementById('tab-summary');
const tabTranscript = document.getElementById('tab-transcript');
const contentSummary = document.getElementById('content-summary');
const contentTranscript = document.getElementById('content-transcript');

// --- FUNGSI NAVIGASI HALAMAN (Khusus Mobile) ---
function showView(viewToShow) {
  // Hanya berdampak di mobile berkat CSS Media Query kita
  views.forEach(view => view.classList.remove('active'));
  viewToShow.classList.add('active');
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
  recordingTime = 0;
  isRecording = true;
  timerDisplay.textContent = formatTime(recordingTime);
  
  iconPause.classList.remove('hidden');
  iconPlay.classList.add('hidden');

  showView(viewRecording);

  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (isRecording) {
      recordingTime++;
      timerDisplay.textContent = formatTime(recordingTime);
    }
  }, 1000);
}

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

btnStopRecord.addEventListener('click', () => {
  isRecording = false;
  clearInterval(timerInterval);
  showView(viewDetail);
});

// --- LOGIKA TAB DI HALAMAN DETAIL ---
function switchTab(activeTab) {
  if (activeTab === 'summary') {
    tabSummary.classList.replace('text-slate-400', 'text-indigo-600');
    tabTranscript.classList.replace('text-indigo-600', 'text-slate-400');
    tabSummary.querySelector('.tab-indicator').classList.remove('hidden');
    tabTranscript.querySelector('.tab-indicator').classList.add('hidden');
    contentSummary.classList.remove('hidden');
    contentTranscript.classList.add('hidden');
  } else {
    tabTranscript.classList.replace('text-slate-400', 'text-indigo-600');
    tabSummary.classList.replace('text-indigo-600', 'text-slate-400');
    tabTranscript.querySelector('.tab-indicator').classList.remove('hidden');
    tabSummary.querySelector('.tab-indicator').classList.add('hidden');
    contentTranscript.classList.remove('hidden');
    contentSummary.classList.add('hidden');
  }
}

tabSummary.addEventListener('click', () => switchTab('summary'));
tabTranscript.addEventListener('click', () => switchTab('transcript'));
