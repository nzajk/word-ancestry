from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup

app = Flask(__name__)
CORS(app)

def scrape_etymology(word):
    url = f'https://www.etymonline.com/word/{word}'
    response = requests.get(url)
    soup = BeautifulSoup(response.text, 'html.parser')
    etymos = soup.find_all('div', class_='word--C9UPa') 

    output = []
    for etymo in etymos:
        if etymo.text[0:len(word)].lower() == word.lower():
            output.append(etymo.text)

    return output

@app.route('/etymology/<word>', methods=['GET'])
def get_etymology(word):
    etymology = scrape_etymology(word)
    return jsonify({'etymology': etymology}), 200

if __name__ == '__main__':
    app.run(debug=True)