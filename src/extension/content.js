// this listener includes the main functionality for the web extension
document.addEventListener('dblclick', async function(event) {
    if (event.target.closest('#extension-panel') || event.target.closest('#popup-tab')) {
        return;
    }

    var word = window.getSelection().toString().trim().toLowerCase();

    if (word) {
        try {
            var etymologyData = await getEtymology(word);
            const etymology = etymologyData?.etymology?.['first-attested-meaning'] || 'No etymology found';
            displayEtymology(word, etymology);
        } catch (err) {
            console.error(err);
            displayEtymology(word, 'Error fetching etymology');
        }
    };
});

// the API call for the etymology
async function getEtymology(word) {
    var response = await fetch(`http://127.0.0.1:5000/etymology/${word}`);
    var data = await response.json();

    if (response.ok) {
        console.log(data)
        return data;
    } else {
        throw new Error('Error in fetching etymology');
    }
}

// create and display a panel to show the word and etymology (css styling for the extension box)
function extensionPanel() {
    var panel = document.createElement('div');
    panel.id = 'extension-panel';
    panel.style.position = 'fixed';
    panel.style.bottom = '15px';
    panel.style.right = '15px';
    panel.style.width = '300px'; 
    panel.style.height = '200px';
    panel.style.padding = '5px';
    panel.style.backgroundColor = '#e9ecef';
    panel.style.color = 'black';
    panel.style.border = '2px solid black';
    panel.style.borderColor = '#343a40';
    panel.style.overflowY = 'scroll';  // make the panel scrollable
    panel.style.zIndex = '10000'; // make the panel appear on top of everything
    panel.style.boxSizing = 'border-box';
    panel.style.borderRadius = '3%';

    var wordElement = document.createElement('p');
    wordElement.id = 'word';
    panel.appendChild(wordElement);

    var etymologyElement = document.createElement('p');
    etymologyElement.id = 'etymology';
    panel.appendChild(etymologyElement);

    var exitButton = document.createElement('button');
    exitButton.innerHTML = 'x';
    exitButton.style.position = 'absolute';
    exitButton.style.top = '5px';
    exitButton.style.right = '5px';
    exitButton.style.paddingRight = '7.5px';
    exitButton.style.color = 'black';
    exitButton.style.backgroundColor = 'transparent';
    exitButton.onclick = function() {
        document.body.removeChild(panel);
    };
    panel.appendChild(exitButton);

    document.body.appendChild(panel);
}

// update the word and etymology within the floating panel
function displayEtymology(word, etymology) {
    if (!document.getElementById('extension-panel')) {
        extensionPanel();
    }

    word = word.charAt(0).toUpperCase() + word.slice(1); // capitalize the first letter of the word

    document.getElementById('word').innerHTML = `<strong>Word:</strong> ${word}`;
    document.getElementById('etymology').innerHTML = `<strong>Etymology:</strong> ${etymology}`;
}