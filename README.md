# Word Ancestry

## Overview
**Word Ancestry** is a browser extension and RESTful API that lets you discover the etymology of any word on the internet instantly. Simply highlight a word, and the extension will show its origin and historical meaning.

## Features
This extension has implemented the following key features.
- **Etymology Lookup:** Highlight any word on a webpage to see its origin and historical meaning immediately
- **Learning Tracking:** Keep a personal history of the words you’ve looked up and learned
- **Lightweight Design:** Designed to work seamlessly without slowing down your browsing experience

## Demonstration
To learn how the extension works, you can watch the video below.

[![Word Ancestry Demo](https://img.youtube.com/vi/JVwncdCThkw/0.jpg)](https://www.youtube.com/watch?v=JVwncdCThkw)

## Installation
Currently, the published Chrome extension is in testing so to self-host simply do the following.

1. **Clone the repository**

   ```bash
   git clone https://github.com/nzajk/word-ancestry.git
   ```
   
2. **Host the API**
   ```bash
   python src/api/app.py
   ```

3. **Load the extension**
   - Open `chrome://extensions/`.
   - Enable Developer mode.
   - Click Load unpacked and select the `chrome-extension` folder.
  
4. **Have fun learning!**

## Architecture
The API for this project scrapes etymology data from `etymonline.com`, exposes it through a RESTful interface, and is consumed by content.js to display relevant word history directly within the browser.

## Limitations
This project currently relies on `etymonline.com` as its primary data source. While this approach was intentional and suitable for the current state of development, it introduces dependency on an external site. Future versions may move to a self-hosted database or additional sources to improve reliability, coverage, and control over the data.
