import json
import os
import sys
import pytest

# Add parent directory to path so app can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app, QUOTES, DATA_PATH

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_quotes_dataset_count_and_schema():
    """Verify that quotes.json contains exactly 100 well-formatted quotes."""
    assert os.path.exists(DATA_PATH), "quotes.json does not exist"
    with open(DATA_PATH, 'r', encoding='utf-8') as f:
        quotes = json.load(f)

    assert len(quotes) == 100, f"Expected 100 quotes, but found {len(quotes)}"
    for q in quotes:
        assert 'id' in q, "Missing 'id' field in quote"
        assert 'quote' in q and len(q['quote']) > 0, "Missing or empty 'quote' field"
        assert 'author' in q and len(q['author']) > 0, "Missing or empty 'author' field"
        assert 'category' in q and len(q['category']) > 0, "Missing or empty 'category' field"

def test_index_route(client):
    """Test that the home page renders correctly."""
    response = client.get('/')
    assert response.status_code == 200
    assert b'QuoteVault' in response.data
    assert b'spotlight-quote' in response.data

def test_get_all_quotes(client):
    """Test fetching all quotes endpoint."""
    response = client.get('/api/quotes')
    assert response.status_code == 200
    data = response.get_json()
    assert data['success'] is True
    assert data['total'] == 100
    assert len(data['data']) == 100

def test_get_random_quote(client):
    """Test fetching a random quote."""
    response = client.get('/api/quotes/random')
    assert response.status_code == 200
    data = response.get_json()
    assert data['success'] is True
    assert 'quote' in data['data']
    assert 'author' in data['data']
    assert 'category' in data['data']

def test_get_random_quote_with_category_filter(client):
    """Test fetching random quote filtered by category."""
    response = client.get('/api/quotes/random?category=Philosophy')
    assert response.status_code == 200
    data = response.get_json()
    assert data['success'] is True
    assert data['data']['category'].lower() == 'philosophy'

def test_get_random_quote_with_author_filter(client):
    """Test fetching random quote filtered by author."""
    response = client.get('/api/quotes/random?author=Einstein')
    assert response.status_code == 200
    data = response.get_json()
    assert data['success'] is True
    assert 'einstein' in data['data']['author'].lower()

def test_get_random_quote_not_found(client):
    """Test 404 when no quote matches the criteria."""
    response = client.get('/api/quotes/random?category=NonExistentCategoryXYZ')
    assert response.status_code == 404
    data = response.get_json()
    assert data['success'] is False

def test_search_quotes_by_query(client):
    """Test searching quotes by query string."""
    response = client.get('/api/quotes/search?q=impossible')
    assert response.status_code == 200
    data = response.get_json()
    assert data['success'] is True
    assert data['count'] >= 1
    assert any('impossible' in q['quote'].lower() for q in data['data'])

def test_search_quotes_by_author(client):
    """Test searching quotes by author."""
    response = client.get('/api/quotes/search?author=Jobs')
    assert response.status_code == 200
    data = response.get_json()
    assert data['success'] is True
    assert data['count'] >= 1
    assert all('jobs' in q['author'].lower() for q in data['data'])

def test_search_quotes_by_category(client):
    """Test searching quotes by category."""
    response = client.get('/api/quotes/search?category=Science')
    assert response.status_code == 200
    data = response.get_json()
    assert data['success'] is True
    assert data['count'] >= 1
    assert all(q['category'].lower() == 'science' for q in data['data'])

def test_get_categories(client):
    """Test fetching categories list."""
    response = client.get('/api/categories')
    assert response.status_code == 200
    data = response.get_json()
    assert data['success'] is True
    assert data['total_categories'] > 0
    categories = data['data']
    category_names = [c['name'] for c in categories]
    assert 'Motivation' in category_names
    assert 'Philosophy' in category_names

def test_get_authors(client):
    """Test fetching authors list."""
    response = client.get('/api/authors')
    assert response.status_code == 200
    data = response.get_json()
    assert data['success'] is True
    assert data['total_authors'] > 0
    authors = [a['name'] for a in data['data']]
    assert 'Albert Einstein' in authors
    assert 'Oscar Wilde' in authors
