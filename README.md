# Word Ancestry

**Word Ancestry** is a browser extension and RESTful API that lets you discover the etymology of any word on the internet instantly. Simply highlight a word, and the extension will show its origin and historical meaning.

---

## Demonstration

1. **Find a word** on any webpage.  

   <img src="https://github.com/user-attachments/assets/e8f3fd50-64d8-4e17-b526-05ce0b83fca4" alt="Word selection example" width="500" style="border:1px solid #ddd; border-radius:5px;" />

2. **Double-click the word** to trigger the extension.  

   <img src="https://github.com/user-attachments/assets/c5000380-8cee-4e2d-8ce3-e13d27149f47" alt="Double click highlighted word" width="200" style="border:1px solid #ddd; border-radius:5px;" />

3. **Read the etymology** in the pop-up window at the bottom-right corner.  

   <img src="https://github.com/user-attachments/assets/38f2dbfa-dcf8-4c05-b708-25a57580afbe" alt="Etymology pop-up" width="400" style="border:1px solid #ddd; border-radius:5px;" />

---

## Getting Started

1. **Clone the repository:**

   ```bash
   git clone https://github.com/nzajk/word-ancestry.git
   ```
   
2. **Host the API**
   ```
   python src/api/app.py
   # or
   python3 src/api/app.py
   ```

3. **Load the Extension**
   - Open `chrome://extensions/`.
   - Enable Developer mode.
   - Click Load unpacked and select the extension folder.
  
4. **Use it**
   Double-click any word on a webpage to see its etymology instantly.
