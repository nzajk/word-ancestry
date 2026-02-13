// listen for toggle changes from the popup in real time 
chrome.storage.onChanged.addListener((changes) => {
  if (changes.enabled) {
    enabled = changes.enabled.newValue;
  }
});

// track the enabled state
let enabled = false;

chrome.storage.local.get('enabled', (result) => {
  enabled = result.enabled || false;
});

// save a word to history
function saveToHistory(word, wordType, etymology) {
  chrome.storage.local.get('history', (result) => {
    const history = result.history || [];
    const newEntry = {
      word,
      type: wordType,
      preview: etymology,
      savedAt: Date.now(),  // real timestamp so popup can show accurate relative time
    };
    // skip if the same word was just looked up
    if (history.length > 0 && history[0].word === word) return;
    const updated = [newEntry, ...history].slice(0, 5);
    chrome.storage.local.set({ history: updated });
  });
}

// this listener includes the main functionality for the web extension
document.addEventListener('dblclick', async function(event) {
    // if toggled off do nothing
    if (!enabled) return;

    if (event.target.closest('#extension-panel') || event.target.closest('#popup-tab')) {
        return;
    }

    var word = window.getSelection().toString().trim().toLowerCase();

    if (word) {
        try {
            var etymologyData = await getEtymology(word);
            var word = etymologyData?.etymology?.word || 'No word found';
            var root = etymologyData?.etymology?.root || null;
            var wordType = etymologyData?.etymology?.word_type || 'No word type found';
            var etymology = etymologyData?.etymology?.['first-attested-meaning'] || 'No etymology found';

            saveToHistory(word, wordType, etymology)

            displayEtymology(word, wordType, etymology, root);
        } catch (err) {
            if (err?.status === 429) {
                displayEtymology(word, '-', 'You are being rate limited. Try again later.');
            } else {
                console.log(err)
                displayEtymology(word, 'Error fetching etymology');
            }
        }
    };
});

// the api call for the etymology
async function getEtymology(word) {
    var response = await fetch(`https://word-ancestry-service.onrender.com/etymology/${word}`);

    if (!response.ok) {
        const error = new Error('Error in fetching etymology');
        error.status = response.status;
        throw error;
    }
    
    return await response.json();
}

// create and display a panel to show the word and etymology (css styling for the extension box)
function extensionPanel(wordText, wordType, etymologyText, rootText) {
  const existingPanel = document.getElementById('extension-panel');
  if (existingPanel) existingPanel.remove();

  if (!document.getElementById('extension-panel-styles')) {
    const style = document.createElement('style');
    style.id = 'extension-panel-styles';
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500&display=swap');

      #extension-panel {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 280px;
        height: 180px;
        padding: 22px 22px 16px 22px;
        background: rgba(255,255,255,0.98);
        border: 1px solid rgba(255,255,255,0.98);
        border-radius: 18px;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255,255,255,0.98);
        z-index: 10000;
        box-sizing: border-box;
        font-family: 'DM Sans', sans-serif;
        animation: panelIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        transform-origin: bottom right;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      @keyframes panelIn {
        from { opacity: 0; transform: scale(0.88) translateY(8px); }
        to   { opacity: 1; transform: scale(1) translateY(0); }
      }

      #extension-panel .ep-word-line {
        display: flex;
        align-items: baseline;
        gap: 8px;
        margin-bottom: 10px;
        flex-shrink: 0;
      }

      #extension-panel .ep-word {
        font-family: 'Instrument Serif', serif;
        font-size: 28px;
        font-weight: 800;
        color: #111;
        letter-spacing: 0px;
        line-height: 1;
      }

      #extension-panel .ep-word-type {
        font-family: 'DM Sans', sans-serif;
        font-size: 11px;
        font-weight: 500;
        color: #999;
        text-transform: lowercase;
        background: rgba(0,0,0,0.05);
        padding: 2px 7px;
        border-radius: 99px;
        align-self: center;
      }

      #extension-panel .ep-divider {
        width: 28px;
        height: 1.5px;
        background: linear-gradient(90deg, #d4a8ff, #a8d4ff);
        border-radius: 2px;
        margin-bottom: 10px;
        flex-shrink: 0;
      }

      #extension-panel .ep-root {
        font-family: 'DM Sans', sans-serif;
        font-size: 11px;
        font-weight: 500;
        color: #777;
        margin-bottom: 8px;
        opacity: 0.9;
      }

      #extension-panel .ep-root::before {
        content: "↳ ";
        color: #bbb;
      }

      #extension-panel .ep-scroll-area {
        flex: 1;
        overflow-y: auto;
        min-height: 0;
        padding-right: 4px;
        margin-right: -4px;
      }

      #extension-panel .ep-scroll-area::-webkit-scrollbar {
        width: 3px;
      }

      #extension-panel .ep-scroll-area::-webkit-scrollbar-track {
        background: transparent;
      }

      #extension-panel .ep-scroll-area::-webkit-scrollbar-thumb {
        background: rgba(0,0,0,0.15);
        border-radius: 99px;
      }

      #extension-panel .ep-scroll-area::-webkit-scrollbar-thumb:hover {
        background: rgba(0,0,0,0.28);
      }

      #extension-panel .ep-etymology {
        font-family: 'DM Sans', sans-serif;
        font-size: 13px;
        font-weight: 400;
        color: #555;
        line-height: 1.55;
        margin: 0;
        padding: 0 0 2px 0;
      }

      #extension-panel .ep-close {
        position: absolute;
        top: 12px;
        right: 12px;
        width: 24px;
        height: 24px;
        border: none;
        background: rgba(0,0,0,0.06);
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #888;
        font-size: 13px;
        line-height: 1;
        transition: background 0.15s, color 0.15s;
        padding: 0;
        font-family: 'DM Sans', sans-serif;
        flex-shrink: 0;
        z-index: 1;
      }

      #extension-panel .ep-close:hover {
        background: rgba(0,0,0,0.12);
        color: #333;
      }
    `;
    document.head.appendChild(style);
  }

  const panel = document.createElement('div');
  panel.id = 'extension-panel';

  const wordLine = document.createElement('div');
  wordLine.className = 'ep-word-line';

  const wordEl = document.createElement('span');
  wordEl.className = 'ep-word';
  wordEl.id = 'word';
  wordEl.textContent = wordText;

  const typeEl = document.createElement('span');
  typeEl.className = 'ep-word-type';
  typeEl.id = 'word-type';
  typeEl.textContent = wordType;

  wordLine.appendChild(wordEl);
  wordLine.appendChild(typeEl);

  const divider = document.createElement('div');
  divider.className = 'ep-divider';

  const scrollArea = document.createElement('div');
  scrollArea.className = 'ep-scroll-area';

  const etymologyEl = document.createElement('p');
  etymologyEl.className = 'ep-etymology';
  etymologyEl.id = 'etymology';
  etymologyEl.textContent = etymologyText;

  scrollArea.appendChild(etymologyEl);

  const closeBtn = document.createElement('button');
  closeBtn.className = 'ep-close';
  closeBtn.innerHTML = '✕';
  closeBtn.onclick = () => panel.remove();
  panel.appendChild(closeBtn);
  panel.appendChild(wordLine);
  panel.appendChild(divider);
  if (rootText) {
    const rootEl = document.createElement('div');
    rootEl.className = 'ep-root';
    rootEl.textContent = `from ${rootText}`;
    panel.appendChild(rootEl);
  }
  panel.appendChild(scrollArea);

  document.body.appendChild(panel);

  setTimeout(() => {
    function clickOutsideListener(e) {
      if (!panel.contains(e.target)) {
        panel.remove();
        document.removeEventListener('click', clickOutsideListener);
      }
    }
    document.addEventListener('click', clickOutsideListener);
  }, 0);
}

// update the word and etymology within the floating panel
function displayEtymology(word, wordType, etymology, root) {
    if (!document.getElementById('extension-panel')) {
        extensionPanel(word, wordType, etymology, root);
    }
}
