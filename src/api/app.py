from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import re
from bs4 import BeautifulSoup
import nltk
from nltk.stem import WordNetLemmatizer
from nltk.corpus import wordnet
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_caching import Cache

# constants
CACHE_TTL = 86400               # 24h, used for @cache.cached timeout
HTTP_TIMEOUT = 10               # seconds, used for requests.get timeout
RATE_LIMIT_PER_MIN = 10         # requests per minute
RATE_LIMIT_PER_DAY = 100        # requests per minute
MAX_LEMMA_DEPTH = 3             # max recursion depth for lemmatization fallback

# app setup
app = Flask(__name__)

# TODO: restrict CORS to your actual frontend origin(s) in prod
CORS(app, origins="*", supports_credentials=True)

# handle rate limiting
limiter = Limiter(
    get_remote_address, 
    app=app, 
    default_limits=[
        f"{RATE_LIMIT_PER_DAY} per day", 
        f"{RATE_LIMIT_PER_MIN} per minute"
    ]
)

# cache common requests
cache = Cache(app, config={
    'CACHE_TYPE': 'SimpleCache', 
    'CACHE_DEFAULT_TIMEOUT': CACHE_TTL
})

# used to reduce words to their root if needed
lemmatizer = WordNetLemmatizer()


def simple_pos(word):
    """rough POS guess for lemmatization fallback."""
    if word.endswith("er") or word.endswith("est"):
        return wordnet.ADJ
    elif word.endswith("ing") or word.endswith("ed"):
        return wordnet.VERB
    else:
        return wordnet.NOUN


def scrape_etymology(word, base_word=None, _depth=0):
    """
    scrape etymology for a word from etymonline.com.
    falls back to lemmatized root if no result found, up to MAX_LEMMA_DEPTH.
    """
    # prevent potential infinite recursion case
    if _depth > MAX_LEMMA_DEPTH:
        app.logger.warning(f"Max lemma depth reached for word '{word}'")
        return {
            "word": base_word or word,
            "root": word if base_word else None,
            "word_type": None,
            "first-attested-meaning": None
        }
    
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
        response = session.get(url, headers=headers, timeout=HTTP_TIMEOUT)
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
            return scrape_etymology(root, base_word=word, _depth=_depth + 1)

    output = {
        "word": original_word,
        "root": root,
        "word_type": clean_word_type,
        "first-attested-meaning": etymology
    }

    return output


@app.route('/etymology/<word>', methods=['GET'])
@limiter.limit(f"{RATE_LIMIT_PER_MIN} per minute")
@cache.cached(timeout=CACHE_TTL, key_prefix=lambda: f"etymology_{request.view_args['word'].lower()}")
def get_etymology(word):
    if not re.match(r'^[a-zA-Z\-]+$', word):
        return jsonify({'error': 'Invalid word'}), 400
    
    try:
        etymology = scrape_etymology(word)
        if not etymology.get('first-attested-meaning'):
            return jsonify({'error': 'Etymology not found'}), 404
        return jsonify({'etymology': etymology}), 200
    except Exception as e:
        app.logger.error(f"Error for word '{word}': {e}")
        return jsonify({'error': 'Internal server error'}), 500


if __name__ == '__main__':
    app.run()
