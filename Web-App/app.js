// ═══════════════════════════════════════════════════════
//  DHL Knowledge Base System — app.js
//  Backend: JSON Server on http://localhost:3001
// ═══════════════════════════════════════════════════════

const API = 'http://localhost:3001';
let currentUser = null;
let allArticles = [];
let currentArticleId = null;
let fileTextContent = '';

// ═══════════════════════════ INIT
window.onload = () => {
  const saved = sessionStorage.getItem('kb_user');
  if (saved) {
    currentUser = JSON.parse(saved);
    enterApp();
  }
};

// ═══════════════════════════ AUTH
async function handleLogin() {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value.trim();
  const errEl = document.getElementById('login-error');

  if (!username || !password) {
    showLoginError('Please enter username and password.');
    return;
  }

  try {
    const res = await fetch(`${API}/users?username=${username}&password=${password}`);
    const users = await res.json();

    if (users.length === 0) {
      showLoginError('Invalid username or password.');
      return;
    }

    currentUser = users[0];
    sessionStorage.setItem('kb_user', JSON.stringify(currentUser));
    errEl.classList.add('hidden');
    enterApp();
  } catch (err) {
    showLoginError('Cannot connect to server. Make sure JSON Server is running on port 3001.');
  }
}

function showLoginError(msg) {
  const errEl = document.getElementById('login-error');
  errEl.textContent = msg;
  errEl.classList.remove('hidden');
}

function handleLogout() {
  currentUser = null;
  sessionStorage.removeItem('kb_user');
  document.getElementById('page-app').classList.add('hidden');
  document.getElementById('page-app').classList.remove('active');
  document.getElementById('page-login').classList.add('active');
  document.getElementById('page-login').classList.remove('hidden');
  document.getElementById('login-username').value = '';
  document.getElementById('login-password').value = '';
}

function enterApp() {
  document.getElementById('page-login').classList.remove('active');
  document.getElementById('page-login').classList.add('hidden');
  document.getElementById('page-app').classList.remove('hidden');
  document.getElementById('page-app').classList.add('active');
  document.getElementById('nav-username').textContent = currentUser.name;
  document.getElementById('nav-role').textContent = currentUser.role;
  loadArticles();
}

// Allow Enter key on login
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && document.getElementById('page-login').classList.contains('active')) {
    handleLogin();
  }
});

// ═══════════════════════════ NAVIGATION
function showSection(name) {
  document.querySelectorAll('.section').forEach(s => {
    s.classList.remove('active');
    s.classList.add('hidden');
  });
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  document.getElementById(`section-${name}`).classList.remove('hidden');
  document.getElementById(`section-${name}`).classList.add('active');
  document.getElementById(`nav-${name}`).classList.add('active');

  if (name === 'viewer') loadArticles();
}

// ═══════════════════════════ ARTICLES — FETCH & DISPLAY
async function loadArticles() {
  try {
    const res = await fetch(`${API}/articles`);
    allArticles = await res.json();
    populateCreatorFilter();
    renderArticles(allArticles);
  } catch (err) {
    console.error('Failed to load articles:', err);
    document.getElementById('articles-grid').innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <p>Cannot connect to JSON Server.<br>Run: <code>json-server --watch db.json --port 3001</code></p>
      </div>`;
  }
}

function renderArticles(articles) {
  const grid = document.getElementById('articles-grid');
  document.getElementById('article-count').textContent = `${articles.length} article${articles.length !== 1 ? 's' : ''}`;

  if (articles.length === 0) {
    grid.innerHTML = `<div class="empty-state"><div class="empty-icon">📭</div><p>No articles found.</p></div>`;
    return;
  }

  grid.innerHTML = articles.map(a => `
    <div class="article-card status-${a.status}" onclick="openArticle(${a.id})">
      <div class="card-header">
        <div class="card-title">${escapeHtml(a.title)}</div>
        <span class="status-pill ${a.status}">${a.status}</span>
      </div>
      <div class="card-summary">${escapeHtml(a.summary)}</div>
      <div class="card-tags">
        ${a.tags.slice(0, 4).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}
        ${a.tags.length > 4 ? `<span class="tag">+${a.tags.length - 4}</span>` : ''}
      </div>
      <div class="card-meta">
        <span>👤 ${escapeHtml(a.creatorName)}</span>
        <span>${formatDate(a.createdAt)}</span>
      </div>
    </div>
  `).join('');
}

// ═══════════════════════════ FILTERS
function populateCreatorFilter() {
  const select = document.getElementById('filter-creator');
  const creators = [...new Set(allArticles.map(a => a.creatorName))];
  const current = select.value;
  select.innerHTML = '<option value="">All Creators</option>';
  creators.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    if (c === current) opt.selected = true;
    select.appendChild(opt);
  });
}

function filterArticles() {
  const search = document.getElementById('search-input').value.toLowerCase();
  const status = document.getElementById('filter-status').value;
  const creator = document.getElementById('filter-creator').value;
  const date = document.getElementById('filter-date').value;
  const tag = document.getElementById('filter-tag').value.toLowerCase();

  const filtered = allArticles.filter(a => {
    const matchSearch = !search ||
      a.title.toLowerCase().includes(search) ||
      a.summary.toLowerCase().includes(search);
    const matchStatus = !status || a.status === status;
    const matchCreator = !creator || a.creatorName === creator;
    const matchDate = !date || a.createdAt.startsWith(date);
    const matchTag = !tag || a.tags.some(t => t.toLowerCase().includes(tag));
    return matchSearch && matchStatus && matchCreator && matchDate && matchTag;
  });

  renderArticles(filtered);
}

function clearFilters() {
  document.getElementById('search-input').value = '';
  document.getElementById('filter-status').value = '';
  document.getElementById('filter-creator').value = '';
  document.getElementById('filter-date').value = '';
  document.getElementById('filter-tag').value = '';
  renderArticles(allArticles);
}

// ═══════════════════════════ ARTICLE MODAL
async function openArticle(id) {
  currentArticleId = id;
  try {
    const res = await fetch(`${API}/articles/${id}`);
    const article = await res.json();
    renderModal(article);
    document.getElementById('modal-overlay').classList.remove('hidden');
    document.getElementById('modal-overlay').style.display = 'flex';
  } catch (err) {
    alert('Failed to load article.');
  }
}

function renderModal(article) {
  const stepsHtml = article.steps.map(s => `<li>${escapeHtml(s)}</li>`).join('');
  const tagsHtml = article.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('');

  const historyHtml = (article.statusHistory || []).map(h => `
    <div class="history-item">
      <div class="history-dot ${h.status}">✓</div>
      <div class="history-info">
        <div class="history-status">${h.status}</div>
        <div class="history-time">${formatDateTime(h.timestamp)}</div>
        <div class="history-by">by ${escapeHtml(h.by)}</div>
      </div>
    </div>
  `).join('');

  // Build status transition buttons
  let actionBtns = '';
  if (article.status === 'Draft') {
    actionBtns += `<button class="btn-status to-reviewed" onclick="updateStatus(${article.id}, 'Reviewed')">→ Mark as Reviewed</button>`;
  }
  if (article.status === 'Reviewed') {
    actionBtns += `<button class="btn-status to-draft" onclick="updateStatus(${article.id}, 'Draft')">← Back to Draft</button>`;
    actionBtns += `<button class="btn-status to-published" onclick="updateStatus(${article.id}, 'Published')">→ Publish</button>`;
  }
  if (article.status === 'Published') {
    actionBtns += `<button class="btn-status to-draft" onclick="updateStatus(${article.id}, 'Draft')">↩ Revert to Draft</button>`;
  }
  actionBtns += `<button class="btn-delete" onclick="deleteArticle(${article.id})">🗑 Delete</button>`;

  document.getElementById('modal-content').innerHTML = `
    <div class="modal-title">${escapeHtml(article.title)}</div>
    <div class="modal-meta">
      Created by ${escapeHtml(article.creatorName)} · ${formatDateTime(article.createdAt)}
      &nbsp;|&nbsp; Updated ${formatDateTime(article.updatedAt)}
      &nbsp;|&nbsp; <span class="status-pill ${article.status}" style="font-size:11px">${article.status}</span>
    </div>

    <div class="modal-section">
      <div class="modal-section-label">Summary</div>
      <div class="modal-summary">${escapeHtml(article.summary)}</div>
    </div>

    <div class="modal-section modal-steps">
      <div class="modal-section-label">Steps / Content</div>
      <ol>${stepsHtml}</ol>
    </div>

    <div class="modal-section">
      <div class="modal-section-label">Tags</div>
      <div class="modal-tags">${tagsHtml}</div>
    </div>

    <div class="modal-section">
      <div class="modal-section-label">Status History</div>
      <div class="status-history">${historyHtml}</div>
    </div>

    <div class="modal-actions">${actionBtns}</div>
  `;
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
  document.getElementById('modal-overlay').style.display = 'none';
  currentArticleId = null;
}

// ═══════════════════════════ CRUD OPERATIONS

// UPDATE STATUS (PATCH)
async function updateStatus(id, newStatus) {
  try {
    const res = await fetch(`${API}/articles/${id}`);
    const article = await res.json();

    const updatedHistory = [
      ...(article.statusHistory || []),
      {
        status: newStatus,
        timestamp: new Date().toISOString(),
        by: currentUser.name
      }
    ];

    const patchRes = await fetch(`${API}/articles/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: newStatus,
        updatedAt: new Date().toISOString(),
        statusHistory: updatedHistory
      })
    });

    if (!patchRes.ok) throw new Error('PATCH failed');

    const updated = await patchRes.json();
    renderModal(updated);

    // Also refresh the local array
    const idx = allArticles.findIndex(a => a.id === id);
    if (idx !== -1) allArticles[idx] = updated;
    filterArticles();

  } catch (err) {
    alert('Failed to update status: ' + err.message);
  }
}

// DELETE (DELETE)
async function deleteArticle(id) {
  if (!confirm('Are you sure you want to delete this article? This cannot be undone.')) return;
  try {
    const res = await fetch(`${API}/articles/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('DELETE failed');
    closeModal();
    allArticles = allArticles.filter(a => a.id !== id);
    renderArticles(allArticles);
  } catch (err) {
    alert('Failed to delete article: ' + err.message);
  }
}

// POST — Submit new article
async function submitArticle() {
  const title = document.getElementById('article-title').value.trim();
  const summary = document.getElementById('article-summary').value.trim();
  const status = document.getElementById('article-status').value;
  const tagsRaw = document.getElementById('article-tags').value;

  const stepInputs = document.querySelectorAll('.step-input');
  const steps = Array.from(stepInputs).map(i => i.value.trim()).filter(v => v);

  const msgEl = document.getElementById('upload-msg');

  // Validation
  if (!title) { showUploadMsg('Please enter a title.', 'error'); return; }
  if (!summary) { showUploadMsg('Please enter a summary.', 'error'); return; }
  if (steps.length === 0) { showUploadMsg('Please add at least one step.', 'error'); return; }

  const tags = tagsRaw.split(',').map(t => t.trim()).filter(t => t);
  const now = new Date().toISOString();

  const newArticle = {
    title,
    summary,
    steps,
    tags,
    status: 'Pending',
    cleaned_steps: "",
    creatorName: currentUser.name,
    creatorId: currentUser.id,
    createdAt: now,
    updatedAt: now,
    fileAttachments: fileTextContent ? [{ name: 'uploaded-file', content: fileTextContent.slice(0, 500) }] : [],
    statusHistory: [
      { status: 'Pending', timestamp: now, by: currentUser.name }
    ]
  };

  try {
    const res = await fetch(`${API}/articles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newArticle)
    });

    if (!res.ok) throw new Error('POST failed');
    const created = await res.json();
    allArticles.push(created);

    showUploadMsg(`✓ Article "${title}" saved successfully!`, 'success');
    clearForm();

  } catch (err) {
    showUploadMsg('Failed to save article. Make sure JSON Server is running.', 'error');
  }
}

function showUploadMsg(msg, type) {
  const el = document.getElementById('upload-msg');
  el.textContent = msg;
  el.className = `upload-msg ${type}`;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 4000);
}

// ═══════════════════════════ FORM HELPERS
function addStep() {
  const container = document.getElementById('steps-container');
  const count = container.querySelectorAll('.step-row').length + 1;
  const div = document.createElement('div');
  div.className = 'step-row';
  div.innerHTML = `
    <span class="step-num">${count}</span>
    <input type="text" class="step-input" placeholder="Enter step ${count}..." />
    <button class="btn-remove-step" onclick="removeStep(this)">✕</button>
  `;
  container.appendChild(div);
}

function removeStep(btn) {
  const container = document.getElementById('steps-container');
  if (container.querySelectorAll('.step-row').length <= 1) return;
  btn.closest('.step-row').remove();
  // Re-number
  container.querySelectorAll('.step-row').forEach((row, i) => {
    row.querySelector('.step-num').textContent = i + 1;
    row.querySelector('.step-input').placeholder = `Enter step ${i + 1}...`;
  });
}

function clearForm() {
  document.getElementById('article-title').value = '';
  document.getElementById('article-summary').value = '';
  document.getElementById('article-tags').value = '';
  document.getElementById('article-status').value = 'Draft';
  document.getElementById('raw-text').value = '';
  document.getElementById('steps-container').innerHTML = `
    <div class="step-row">
      <span class="step-num">1</span>
      <input type="text" class="step-input" placeholder="Enter step 1..." />
      <button class="btn-remove-step" onclick="removeStep(this)">✕</button>
    </div>`;
  document.getElementById('file-preview').classList.add('hidden');
  fileTextContent = '';
  const dropZone = document.getElementById('drop-zone');
  dropZone.style.borderColor = '';
}

// ═══════════════════════════ TABS
function switchTab(name) {
  document.querySelectorAll('.tab-content').forEach(t => {
    t.classList.remove('active');
    t.classList.add('hidden');
  });
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`input-${name}`).classList.remove('hidden');
  document.getElementById(`input-${name}`).classList.add('active');
  document.getElementById(`tab-${name}`).classList.add('active');
}

// ═══════════════════════════ FILE UPLOAD
function handleFileSelect(event) {
  const file = event.target.files[0];
  if (file) processFile(file);
}

function handleDragOver(event) {
  event.preventDefault();
  document.getElementById('drop-zone').classList.add('drag-over');
}

function handleDrop(event) {
  event.preventDefault();
  document.getElementById('drop-zone').classList.remove('drag-over');
  const file = event.dataTransfer.files[0];
  if (file) processFile(file);
}

function processFile(file) {
  const allowedTypes = [
    'text/plain',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  const ext = file.name.split('.').pop().toLowerCase();
  const allowedExts = ['txt', 'pdf', 'docx'];

  if (!allowedExts.includes(ext)) {
    alert('Only .txt, .pdf, and .docx files are supported.');
    return;
  }

  const reader = new FileReader();

  if (ext === 'txt') {
    reader.onload = (e) => {
      fileTextContent = e.target.result;
      showFilePreview(file.name, fileTextContent);
      autofillFromText(fileTextContent);
    };
    reader.readAsText(file);
  } else {
    // For PDF and DOCX: show file name, note that content is noted
    fileTextContent = `[File uploaded: ${file.name} - ${(file.size / 1024).toFixed(1)} KB]`;
    showFilePreview(file.name, `File: ${file.name}\nSize: ${(file.size / 1024).toFixed(1)} KB\n\nNote: For PDF/DOCX processing, content will be attached as reference. You can also paste the text manually in the Text Input tab.`);
  }
}

function showFilePreview(name, content) {
  const preview = document.getElementById('file-preview');
  preview.classList.remove('hidden');
  preview.innerHTML = `
    <div class="file-name">📄 ${escapeHtml(name)}</div>
    <div class="file-content">${escapeHtml(content.slice(0, 600))}${content.length > 600 ? '...' : ''}</div>
  `;
  document.getElementById('drop-zone').style.borderColor = 'var(--status-published)';
}

function autofillFromText(text) {
  // Try to auto-fill title from first line
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  if (lines.length > 0 && !document.getElementById('article-title').value) {
    document.getElementById('article-title').value = lines[0].slice(0, 100);
  }
  // Auto-fill summary from first paragraph
  if (lines.length > 1 && !document.getElementById('article-summary').value) {
    document.getElementById('article-summary').value = lines.slice(1, 4).join(' ').slice(0, 300);
  }
}

// ═══════════════════════════ UTILS
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-MY', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}
