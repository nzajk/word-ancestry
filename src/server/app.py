from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import re
from bs4 import BeautifulSoup

app = Flask(__name__)
CORS(app)

def scrape_etymology(word):
    # initialize values for output
    clean_word_type = None
    etymology = None

    url = f"https://www.etymonline.com/word/{word}"
    response = requests.get(url)
    response.raise_for_status()

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

    output = {
        "word": word,
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

"""
if __name__ == "__main__":
    test_word = "twin"
    result = scrape_etymology(test_word)
    print(result)
"""