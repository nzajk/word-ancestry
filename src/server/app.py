from flask import Flask, jsonify
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup
import nltk

# download wordnet once
nltk.download('wordnet')

from nltk.stem import WordNetLemmatizer
from nltk.corpus import wordnet

app = Flask(__name__)
CORS(app)

lemmatizer = WordNetLemmatizer()

# handle common comparatives and superlatives (needs to be more robust)
def simple_pos(word):
    if word.endswith("er") or word.endswith("est"):
        return wordnet.ADJ
    elif word.endswith("ing") or word.endswith("ed"):
        return wordnet.VERB
    else:
        return wordnet.NOUN

def scrape_etymology(word, base_word=None):
    # initialize values for output
    original_word = word
    root = None
    clean_word_type = None
    etymology = None

    # if word was reduced to the root update necessary fields
    if base_word:
        original_word = base_word
        root = word

    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    }

    url = f"https://www.etymonline.com/word/{word}"
    try:
        session = requests.Session()
        response = session.get(url, headers=headers)
        response.raise_for_status()
    except requests.HTTPError:
        response = None

    if response:
        soup = BeautifulSoup(response.text, "html.parser")

        # get header data for the lexical category (word type)
        word_header = soup.find("h2", class_='scroll-m-16 text-2xl font-serif font-bold text-foreground text-4xl')
        if word_header:
            spans = word_header.find_all("span")
            word_type = spans[1].get_text(" ", strip=True) if len(spans) >= 2 else None
            clean_word_type = word_type.strip("()")

        # get the first attested meaning (etymology) of the word
        etymology_divs = soup.find_all("div", class_="space-y-2 pb-2")
        if len(etymology_divs) > 0:
            etymology = etymology_divs[0].get_text(" ", strip=True)

    # reduce the word to the root if needed
    if not etymology:
        pos = simple_pos(word)
        root = lemmatizer.lemmatize(word, pos=pos)
        if word != root:
            return scrape_etymology(root, base_word=word)

    output = {
        "word": original_word,
        "root": root,
        "word_type": clean_word_type,
        "first-attested-meaning": etymology
    }

    return output


@app.route('/etymology/<word>', methods=['GET'])
def get_etymology(word):
    etymology = scrape_etymology(word)
    return jsonify({'etymology': etymology}), 200


if __name__ == '__main__':
    app.run(debug=True)
