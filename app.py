import json
import os
import random
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

# Path to the quotes dataset
DATA_PATH = os.path.join(os.path.dirname(__file__), 'data', 'quotes.json')

def load_quotes():
    """Load quotes from the JSON data file."""
    if not os.path.exists(DATA_PATH):
        return []
    with open(DATA_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)

QUOTES = load_quotes()

@app.route('/')
def index():
    """Render main application page."""
    return render_template('index.html')

@app.route('/api/quotes/random', methods=['GET'])
def get_random_quote():
    """Return a random quote, optionally filtered by category or author."""
    category = request.args.get('category', '').strip().lower()
    author = request.args.get('author', '').strip().lower()

    filtered = QUOTES
    if category:
        filtered = [q for q in filtered if q['category'].lower() == category]
    if author:
        filtered = [q for q in filtered if author in q['author'].lower()]

    if not filtered:
        return jsonify({
            'success': False,
            'message': 'No quotes found matching criteria.'
        }), 404

    quote = random.choice(filtered)
    return jsonify({
        'success': True,
        'data': quote
    })

@app.route('/api/quotes/search', methods=['GET'])
def search_quotes():
    """Search quotes by query string (q), category, or author."""
    q = request.args.get('q', '').strip().lower()
    category = request.args.get('category', '').strip().lower()
    author = request.args.get('author', '').strip().lower()

    results = QUOTES

    if category:
        results = [quote for quote in results if quote['category'].lower() == category]

    if author:
        results = [quote for quote in results if author in quote['author'].lower()]

    if q:
        results = [
            quote for quote in results
            if q in quote['quote'].lower() or q in quote['author'].lower() or q in quote['category'].lower()
        ]

    return jsonify({
        'success': True,
        'count': len(results),
        'data': results
    })

@app.route('/api/categories', methods=['GET'])
def get_categories():
    """Return list of distinct categories with quote counts."""
    category_counts = {}
    for quote in QUOTES:
        cat = quote['category']
        category_counts[cat] = category_counts.get(cat, 0) + 1
    
    categories = sorted([
        {'name': cat, 'count': count}
        for cat, count in category_counts.items()
    ], key=lambda x: x['name'])

    return jsonify({
        'success': True,
        'total_categories': len(categories),
        'data': categories
    })

@app.route('/api/authors', methods=['GET'])
def get_authors():
    """Return list of distinct authors with quote counts."""
    author_counts = {}
    for quote in QUOTES:
        author = quote['author']
        author_counts[author] = author_counts.get(author, 0) + 1

    authors = sorted([
        {'name': author, 'count': count}
        for author, count in author_counts.items()
    ], key=lambda x: x['name'])

    return jsonify({
        'success': True,
        'total_authors': len(authors),
        'data': authors
    })

@app.route('/api/quotes', methods=['GET'])
def get_all_quotes():
    """Return all quotes with total count."""
    return jsonify({
        'success': True,
        'total': len(QUOTES),
        'data': QUOTES
    })

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5000)
