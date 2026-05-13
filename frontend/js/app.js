/* ─────────────────────────────────────────────────
   ECG Arrhythmia Detector — Python Backend Integration
   ───────────────────────────────────────────────── */

const API = '/api';

// ── State ──────────────────────────────────────────
const state = {
  filename: null,
  totalRows: 0,
  source: 'demo',   // Default to demo for max row access
};

// ── DOM refs ───────────────────────────────────────
const dropZone      = document.getElementById('drop-zone');
const csvInput      = document.getElementById('csv-input');
const fileInfo      = document.getElementById('file-info');
const fileName      = document.getElementById('file-name');
const fileMeta      = document.getElementById('file-meta');
const removeFileBtn = document.getElementById('remove-file');
const rowInput      = document.getElementById('row-input');
const rowMax        = document.getElementById('row-max');
const analyzeBtn    = document.getElementById('analyze-btn');
const demoBtn       = document.getElementById('demo-btn');
const tabUpload     = document.getElementById('tab-upload');
const tabDemo       = document.getElementById('tab-demo');

const loadingOverlay = document.getElementById('loading-overlay');
const loadingText    = document.getElementById('loading-text');
const steps          = [
  document.getElementById('step-1'),
  document.getElementById('step-2'),
  document.getElementById('step-3'),
  document.getElementById('step-4'),
];

const resultsSection    = document.getElementById('results-section');
const diagnosisBanner   = document.getElementById('diagnosis-banner');
const diagnosisBadge    = document.getElementById('diagnosis-badge');
const diagnosisIcon     = document.getElementById('diagnosis-icon');
const diagnosisRisk     = document.getElementById('diagnosis-risk');
const diagnosisClass    = document.getElementById('diagnosis-class');
const confidenceCircle  = document.getElementById('confidence-circle');
const confidenceValue   = document.getElementById('confidence-value');
const arrhythmiaAlert   = document.getElementById('arrhythmia-alert');
const arrhythmiaDetail  = document.getElementById('arrhythmia-detail');
const descriptionText   = document.getElementById('description-text');
const ecgPlot           = document.getElementById('ecg-plot');
const histogramPlot     = document.getElementById('histogram-plot');
const confidenceBars    = document.getElementById('confidence-bars');
const resetBtn          = document.getElementById('reset-btn');

// ── Drag & Drop ────────────────────────────────────
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('drop-zone--active');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drop-zone--active'));
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('drop-zone--active');
  const file = e.dataTransfer.files[0];
  if (file) handleFileSelect(file);
});
csvInput.addEventListener('change', () => {
  if (csvInput.files[0]) handleFileSelect(csvInput.files[0]);
});

// ── File Handling (to Python Server) ───────────────
async function handleFileSelect(file) {
  if (!file.name.toLowerCase().endsWith('.csv')) {
    showToast('Please upload a .csv file.', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    analyzeBtn.disabled = true;
    showToast('Uploading to Python server...', 'info');
    const res = await fetch(`${API}/upload`, { method: 'POST', body: formData });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Upload failed');

    state.filename = data.filename;
    state.totalRows = data.rows;
    state.source = 'upload';

    // Show file info
    dropZone.hidden = true;
    fileInfo.hidden = false;
    fileName.textContent = data.filename;
    fileMeta.textContent = `${data.rows.toLocaleString()} rows · ${data.columns} columns`;

    // Row constraints
    rowInput.max = data.rows - 1;
    rowMax.textContent = `Max row index: ${data.rows - 1}`;
    rowMax.hidden = false;

    activateTab('upload');
    analyzeBtn.disabled = false;
    showToast('File uploaded to server successfully!', 'success');

  } catch (err) {
    showToast(`Upload error: ${err.message}. Is your Python server running via run_server.bat?`, 'error');
    analyzeBtn.disabled = true;
  }
}

// Remove file
removeFileBtn.addEventListener('click', () => {
  state.filename = null;
  fileInfo.hidden = true;
  dropZone.hidden = false;
  csvInput.value = '';
  rowMax.hidden = true;
  analyzeBtn.disabled = true;
});

// ── Source Tabs ────────────────────────────────────
tabUpload.addEventListener('click', () => activateTab('upload'));
tabDemo.addEventListener('click',   () => loadDemoData());

function activateTab(source) {
  state.source = source;
  tabUpload.classList.toggle('source-tab--active', source === 'upload');
  tabDemo.classList.toggle('source-tab--active',   source === 'demo');
}

async function loadDemoData() {
  try {
    const res  = await fetch(`${API}/sample-data`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    state.filename  = data.filename;
    state.totalRows = data.rows;

    fileInfo.hidden = false;
    dropZone.hidden = true;
    fileName.textContent = '🧪 ' + data.filename + ' (demo)';
    fileMeta.textContent = `${data.rows.toLocaleString()} rows · ${data.columns} columns`;

    rowInput.max = data.rows - 1;
    rowMax.textContent = `Max row index: ${data.rows - 1}`;
    rowMax.hidden = false;

    activateTab('demo');
    analyzeBtn.disabled = false;
    showToast('Server demo data loaded!', 'success');

  } catch (err) {
    showToast(`Could not load demo from server: ${err.message}`, 'error');
  }
}

// Hero demo button
demoBtn.addEventListener('click', () => {
  document.getElementById('upload-section').scrollIntoView({ behavior: 'smooth' });
  setTimeout(loadDemoData, 600);
});

// ── Analyze (via Python Server) ────────────────────
analyzeBtn.addEventListener('click', runAnalysis);

async function runAnalysis() {
  const rowNumber = parseInt(rowInput.value, 10);

  if (!state.filename) { showToast('Please upload a CSV file first.', 'error'); return; }
  if (isNaN(rowNumber) || rowNumber < 0) { showToast('Please enter a valid row number.', 'error'); return; }
  if (state.totalRows && rowNumber >= state.totalRows) {
    showToast(`Row ${rowNumber} is out of range. Max: ${state.totalRows - 1}`, 'error');
    return;
  }

  showLoading();

  try {
    // Start animation immediately before fetch
    const animationPromise = animateLoadingSteps();

    const body = JSON.stringify({ filename: state.filename, row_number: rowNumber });
    const res  = await fetch(`${API}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    
    // Wait for the animation sequence to hit the final step before removing it
    await animationPromise;
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Analysis failed');

    hideLoading();
    renderResults(data);

  } catch (err) {
    hideLoading();
    showToast(`Python Server Error: ${err.message}`, 'error');
  }
}

// ── Loading Sequence ───────────────────────────────
function showLoading() {
  loadingOverlay.hidden = false;
  steps.forEach(s => { s.className = 'loading-step'; });
  steps[0].classList.add('loading-step--active');
}

function hideLoading() {
  loadingOverlay.hidden = true;
}

async function animateLoadingSteps() {
  const messages = [
    'Sending request to Python API…',
    'Running CNN inference locally…',
    'Generating Matplotlib visuals…',
    'Preparing results…',
  ];
  for (let i = 0; i < steps.length; i++) {
    await delay(700);
    if (i > 0) steps[i - 1].classList.replace('loading-step--active', 'loading-step--done');
    steps[i].classList.add('loading-step--active');
    loadingText.textContent = messages[i];
  }
  await delay(400);
  steps[steps.length - 1].classList.replace('loading-step--active', 'loading-step--done');
}

// ── Render Results ─────────────────────────────────
function renderResults(data) {
  // Diagnosis banner
  const riskLevel = data.risk_level || 'low';
  const riskIcons  = { low: '💚', medium: '🟠', high: '🔴' };
  const riskLabels = { low: 'Low Risk', medium: 'Medium Risk', high: 'High Risk' };

  diagnosisBadge.className = `diagnosis-badge diagnosis-badge--${riskLevel}`;
  diagnosisIcon.textContent  = riskIcons[riskLevel];
  diagnosisRisk.textContent  = riskLabels[riskLevel];
  diagnosisClass.textContent = data.class_name;

  // Confidence ring
  const pct = data.max_confidence || 0;
  const circumference = 2 * Math.PI * 42; // r=42
  const offset = circumference * (1 - pct / 100);
  setTimeout(() => {
    confidenceCircle.style.strokeDashoffset = offset.toFixed(2);
    confidenceValue.textContent = `${pct.toFixed(1)}%`;
  }, 200);

  // Arrhythmia alert
  if (data.is_arrhythmia && data.arrhythmia_detail) {
    arrhythmiaAlert.hidden = false;
    arrhythmiaDetail.textContent = data.arrhythmia_detail;
  } else {
    arrhythmiaAlert.hidden = true;
  }

  // Description
  descriptionText.textContent = data.description;

  // Plots from Matplotlib
  ecgPlot.src       = `data:image/png;base64,${data.ecg_plot}`;
  histogramPlot.src = `data:image/png;base64,${data.histogram}`;

  // Confidence bars
  confidenceBars.innerHTML = '';
  const scores = data.confidence_scores || {};
  Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .forEach(([label, pctVal]) => {
      const bar = document.createElement('div');
      bar.className = 'confidence-bar';
      bar.innerHTML = `
        <span class="confidence-bar__label">${label}</span>
        <div class="confidence-bar__track">
          <div class="confidence-bar__fill" style="width:0%" data-target="${pctVal}"></div>
        </div>
        <span class="confidence-bar__pct">${pctVal.toFixed(1)}%</span>
      `;
      confidenceBars.appendChild(bar);
    });

  // Animate bars
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.querySelectorAll('.confidence-bar__fill').forEach(el => {
        el.style.width = `${el.dataset.target}%`;
      });
    });
  });

  // Show section
  resultsSection.hidden = false;
  setTimeout(() => {
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    // Auto-pop the chatbot with the diagnosis context!
    if (typeof window.triggerDiagnosisChat === 'function') {
      window.triggerDiagnosisChat(data.class_name, pct);
    }
  }, 100);
}

// ── Reset ──────────────────────────────────────────
resetBtn.addEventListener('click', () => {
  resultsSection.hidden = true;
  confidenceCircle.style.strokeDashoffset = '264';
  confidenceValue.textContent = '0%';
  document.getElementById('upload-section').scrollIntoView({ behavior: 'smooth' });
});

// ── Toast Notifications ────────────────────────────
function showToast(message, type = 'info') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = message;

  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  toast.textContent = `${icons[type] || ''} ${message}`;

  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '28px',
    right: '28px',
    padding: '14px 22px',
    borderRadius: '12px',
    fontSize: '0.88rem',
    fontWeight: '600',
    zIndex: '9999',
    maxWidth: '360px',
    lineHeight: '1.5',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    animation: 'toast-in 0.35s cubic-bezier(0.4,0,0.2,1) forwards',
    background: type === 'success' ? 'rgba(46,213,115,0.15)'
              : type === 'error'   ? 'rgba(255,71,87,0.15)'
              : 'rgba(0,212,170,0.15)',
    border: type === 'success' ? '1px solid rgba(46,213,115,0.4)'
          : type === 'error'   ? '1px solid rgba(255,71,87,0.4)'
          : '1px solid rgba(0,212,170,0.4)',
    color: type === 'success' ? '#2ed573'
         : type === 'error'   ? '#ff4757'
         : '#00d4aa',
  });

  if (!document.getElementById('toast-style')) {
    const style = document.createElement('style');
    style.id = 'toast-style';
    style.textContent = `
      @keyframes toast-in {
        from { opacity:0; transform: translateY(12px) scale(0.95); }
        to   { opacity:1; transform: translateY(0) scale(1); }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// ── Utility ────────────────────────────────────────
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

// Scroll reveal
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }, i * 80);
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.class-card').forEach(card => {
  card.style.opacity = '0';
  card.style.transform = 'translateY(24px)';
  card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  observer.observe(card);
});

// Load the 21,000+ row dataset automatically on startup
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(loadDemoData, 500); 
});
