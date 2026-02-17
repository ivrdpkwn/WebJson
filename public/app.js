const inputEl = document.getElementById('input');
const outputEl = document.getElementById('output');
const fileInput = document.getElementById('fileInput');
const formatBtn = document.getElementById('formatBtn');
const minifyBtn = document.getElementById('minifyBtn');
const downloadBtn = document.getElementById('downloadBtn');
const errorEl = document.getElementById('error');
const fileInfoEl = document.getElementById('fileInfo');
const viewSelect = document.getElementById('viewSelect');
const downloadName = document.getElementById('downloadName');
const themeSelect = document.getElementById('themeSelect');
const workerStatus = document.getElementById('workerStatus');

// Web Worker support
const WORKER_THRESHOLD = 200 * 1024; // use worker for inputs >200KB
let jsonWorker = null;
let workerAvailable = false;
if (window.Worker) {
  try {
    jsonWorker = new Worker('/worker.js');
    workerAvailable = true;
    workerStatus.textContent = 'Worker: 已启用';
  } catch (e) {
    workerAvailable = false;
    workerStatus.textContent = 'Worker: 不可用';
  }
} else {
  workerStatus.textContent = 'Worker: 不支持';
}

let lastFormatted = '';

function showError(msg) {
  errorEl.textContent = msg || '';
}

fileInput.addEventListener('change', () => {
  const f = fileInput.files[0];
  if (!f) return;
  fileInfoEl.textContent = `选择: ${f.name} (${(f.size/1024).toFixed(1)} KB)`;
  if (f.size > 5 * 1024 * 1024) {
    showError('文件过大（>5MB），请使用更小的文件');
    return;
  }
  if (f.size > 1024 * 1024) {
    fileInfoEl.textContent += ' — 大文件，可能较慢';
  }
  const reader = new FileReader();
  reader.onload = () => {
    inputEl.value = reader.result;
    showError('');
    viewSelect.value = 'raw';
  };
  reader.onerror = () => showError('无法读取文件');
  reader.readAsText(f, 'utf-8');
});

async function postFormat(text) {
  const res = await fetch('/format', {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    body: text,
  });
  const body = await res.text();
  if (!res.ok) {
    try {
      const j = JSON.parse(body);
      throw new Error(j.error || body);
    } catch (e) {
      throw new Error(body || '格式化失败');
    }
  }
  return body;
}

function formatWithWorker(text, timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    if (!workerAvailable || !jsonWorker) return reject(new Error('worker not available'));
    const onmsg = (ev) => {
      clearTimeout(timer);
      jsonWorker.removeEventListener('message', onmsg);
      const d = ev.data || {};
      if (d.ok) resolve(d.result); else reject(new Error(d.error || '格式化失败'));
    };
    const timer = setTimeout(() => {
      jsonWorker.removeEventListener('message', onmsg);
      reject(new Error('worker timeout'));
    }, timeoutMs);
    jsonWorker.addEventListener('message', onmsg);
    jsonWorker.postMessage({ type: 'format', text });
  });
}

formatBtn.addEventListener('click', async () => {
  showError('');
  outputEl.textContent = '格式化中...';
  formatBtn.disabled = true;
  try {
    const text = inputEl.value || '';
    let result;
    if (workerAvailable && text.length > WORKER_THRESHOLD) {
      workerStatus.textContent = 'Worker: 格式化中...';
      try {
        try {
          result = await formatWithWorker(text);
        } catch (e) {
          // worker failed or timed out -> fallback to server
          console.warn('worker failed, falling back to server:', e && e.message);
          result = await postFormat(text);
        }
      } finally {
        workerStatus.textContent = 'Worker: 空闲';
      }
    } else {
      result = await postFormat(text);
    }
    lastFormatted = result;
    outputEl.textContent = result;
    viewSelect.value = 'pretty';
  } catch (e) {
    outputEl.textContent = '';
    showError(e.message);
  } finally {
    formatBtn.disabled = false;
  }
});

minifyBtn.addEventListener('click', () => {
  showError('');
  try {
    const j = JSON.parse(inputEl.value);
    const s = JSON.stringify(j);
    lastFormatted = s;
    outputEl.textContent = s;
    viewSelect.value = 'minified';
  } catch (e) {
    showError('无效的 JSON: ' + e.message);
  }
});

viewSelect.addEventListener('change', async () => {
  const v = viewSelect.value;
  showError('');
  if (v === 'raw') {
    outputEl.textContent = inputEl.value;
  } else if (v === 'minified') {
    try {
      const j = JSON.parse(inputEl.value);
      const s = JSON.stringify(j);
      lastFormatted = s;
      outputEl.textContent = s;
    } catch (e) {
      showError('无效的 JSON: ' + e.message);
      outputEl.textContent = '';
    }
  } else if (v === 'pretty') {
    // prefer lastFormatted if it came from server
    if (lastFormatted && (lastFormatted.trim().startsWith('{') || lastFormatted.trim().startsWith('['))) {
      outputEl.textContent = lastFormatted;
      return;
    }
    // call server to format
    outputEl.textContent = '格式化中...';
    try {
      const text = inputEl.value || '';
      let result;
      if (workerAvailable && text.length > WORKER_THRESHOLD) {
        workerStatus.textContent = 'Worker: 格式化中...';
        try {
          try {
            result = await formatWithWorker(text);
          } catch (e) {
            console.warn('worker failed, falling back to server:', e && e.message);
            result = await postFormat(text);
          }
        } finally {
          workerStatus.textContent = 'Worker: 空闲';
        }
      } else {
        result = await postFormat(text);
      }
      lastFormatted = result;
      outputEl.textContent = result;
    } catch (e) {
      outputEl.textContent = '';
      showError(e.message);
    }
  }
});

downloadBtn.addEventListener('click', () => {
  const text = outputEl.textContent || '';
  const name = (downloadName && downloadName.value) ? downloadName.value : (document.getElementById('saveName').value || 'formatted.json');
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name || 'formatted.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

// Theme persistence
function applyTheme(t) {
  if (t === 'dark') document.documentElement.classList.add('theme-dark'); else document.documentElement.classList.remove('theme-dark');
}
themeSelect.addEventListener('change', () => {
  const v = themeSelect.value;
  applyTheme(v);
  localStorage.setItem('webjson:theme', v);
});
const savedTheme = localStorage.getItem('webjson:theme') || 'light';
themeSelect.value = savedTheme;
applyTheme(savedTheme);

