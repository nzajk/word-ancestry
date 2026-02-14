const toggle      = document.getElementById('main-toggle');
const label       = document.getElementById('toggle-label');
const dot         = document.getElementById('status-dot');
const statusText  = document.getElementById('status-text');
const wordList    = document.getElementById('word-list');
const clearBtn    = document.getElementById('clear-btn');
const wordCount   = document.getElementById('word-count');
const contentArea = document.getElementById('content-area');
const accentDiv   = document.getElementById('accent-divider');

// helper function to get relative time
function relativeTime(savedAt) {
  const seconds = Math.floor((Date.now() - savedAt) / 1000);
  if (seconds < 60)                        return 'just now';
  if (seconds < 3600)                      return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400)                     return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function renderHistory(history) {
  wordList.innerHTML = '';

  if (!history || history.length === 0) {
    wordList.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">∅</div>
        <div class="empty-text">Double-click any word on the page<br>to explore its origins.</div>
      </div>`;
    accentDiv.style.display = 'none';
    wordCount.textContent = '';
    return;
  }

  accentDiv.style.display = 'block';
  wordCount.textContent = `${history.length} word${history.length !== 1 ? 's' : ''}`;

  history.forEach((entry, i) => {
    const item = document.createElement('div');
    item.className = 'word-item';
    item.style.animationDelay = `${i * 40}ms`;
    item.innerHTML = `
      <span class="word-item-name">${entry.word}</span>
      <span class="word-item-type">${entry.type}</span>
      <span class="word-item-preview">${entry.preview}</span>
      <span class="word-item-time">${relativeTime(entry.savedAt)}</span>
    `;
    item.title = `Re-look up "${entry.word}"`;
    wordList.appendChild(item);
  });
}

function setEnabled(enabled) {
  label.textContent      = enabled ? 'on' : 'off';
  label.className        = enabled ? 'toggle-label active' : 'toggle-label';
  dot.className          = enabled ? 'status-dot on' : 'status-dot';
  statusText.className   = enabled ? 'status-text on' : 'status-text';
  statusText.textContent = enabled
    ? 'listening for double-clicks'
    : 'extension paused on this tab';
  contentArea.className  = enabled ? 'content-area' : 'content-area dimmed';
}

toggle.addEventListener('change', () => {
  const enabled = toggle.checked;
  setEnabled(enabled);
  chrome.storage.local.set({ enabled });
});

clearBtn.addEventListener('click', () => {
  chrome.storage.local.set({ history: [] });
  renderHistory([]);
});

// read real state from storage on popup open
chrome.storage.local.get(['enabled', 'history'], (result) => {
  const enabled = result.enabled || false;
  const history = result.history || [];
  toggle.checked = enabled;
  setEnabled(enabled);
  renderHistory(history);
});