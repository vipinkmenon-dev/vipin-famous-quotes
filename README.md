# QuoteVault — Famous Quotes Explorer

A lightweight, elegant web application built using **Python Flask**, **Plain Vanilla JavaScript**, and **HTML5/CSS3** to search, filter, and discover random quotes from 100 well-known quotes by historical thinkers, leaders, scientists, and authors.

---

## ✨ Features

- **🎲 Random Quote Generator**: Instantly loads a random quote with smooth animated transitions.
- **🔍 Instant Search**: Real-time search across quote contents, author names, and topics with debouncing.
- **🏷️ Category Filtering**: Filter quotes across 10 categories including *Wisdom, Motivation, Philosophy, Science, Art, Literature, Leadership, Courage, Life, and Inspiration*.
- **👤 Author Filter**: Filter quotes by specific thinkers and authors.
- **📋 Copy & Share**: One-click clipboard copy with toast feedback, plus direct sharing to X (Twitter).
- **⚡ Lightweight**: Zero front-end libraries or frameworks — pure Vanilla JS and CSS.
- **🧪 Tested**: Includes 12 automated unit and integration tests with `pytest`.

---

## 🛠️ Tech Stack

- **Backend**: Python 3, Flask
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Testing**: Pytest

---

## 📁 Project Structure

```text
├── data/
│   └── quotes.json          # Dataset of 100 curated quotes
├── static/
│   ├── css/
│   │   └── style.css        # Responsive dark UI styles & animations
│   └── js/
│       └── app.js           # Vanilla JS client logic
├── templates/
│   └── index.html           # Main application HTML template
├── tests/
│   └── test_app.py          # Pytest unit & integration test suite
├── app.py                   # Flask server and REST API endpoints
├── requirements.txt         # Project dependencies
├── .gitignore               # Standard git ignore rules
└── README.md                # Project documentation
```

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have **Python 3.8+** installed.

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Run the Application
```bash
python app.py
```
Open your browser and navigate to:
```
http://127.0.0.1:5000
```

---

## 📡 REST API Endpoints

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/api/quotes/random` | `GET` | Returns a random quote. Supports optional `?category=` and `?author=` params. |
| `/api/quotes/search` | `GET` | Search quotes. Query params: `?q=`, `?category=`, `?author=`. |
| `/api/categories` | `GET` | Returns list of distinct categories and quote counts. |
| `/api/authors` | `GET` | Returns list of distinct authors and quote counts. |
| `/api/quotes` | `GET` | Returns all 100 quotes. |

---

## 🧪 Running Tests

Run the test suite with `pytest`:
```bash
pytest tests/test_app.py -v
```
