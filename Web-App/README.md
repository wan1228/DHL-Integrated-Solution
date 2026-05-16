# DHL Knowledge Base Automation System
## SECJ 3483 – Web Technology | Individual Assignment | Scenario 1

---

## How to Run

### Step 1 — Install JSON Server
Open your terminal in VS Code (Terminal > New Terminal) and run:
```
npm install
```
Or if you prefer globally:
```
npm install -g json-server
```

### Step 2 — Start the JSON Server (Mock API)
In the terminal, run:
```
npm start
```
OR:
```
json-server --watch db.json --port 3001
```

You should see:
```
  \{^_^}/ hi!

  Loading db.json
  Done

  Resources
  http://localhost:3001/users
  http://localhost:3001/articles
```

### Step 3 — Open the Web App
Open `index.html` in your browser. You can:
- Right-click `index.html` in VS Code → "Open with Live Server" (if you have the Live Server extension)
- Or just double-click `index.html` to open it in your browser

### Step 4 — Login
Use one of these demo accounts:
| Username   | Password    | Role     |
|------------|-------------|----------|
| admin      | admin123    | admin    |
| editor     | editor123   | editor   |
| reviewer   | reviewer123 | reviewer |

---

## Features
- ✅ Login / Logout with session storage
- ✅ Upload Console: Text input, PDF and DOCX file upload
- ✅ Create KB Articles (POST to JSON Server)
- ✅ View all articles in searchable/filterable grid (GET)
- ✅ Filter by: search, status, creator, date, tag
- ✅ Click article to view full details
- ✅ Status workflow: Draft → Reviewed → Published (PATCH)
- ✅ Status history tracking with timestamps
- ✅ Delete articles (DELETE)
- ✅ Full CRUD via REST API

## API Endpoints (JSON Server)
| Method | Endpoint              | Description          |
|--------|-----------------------|----------------------|
| GET    | /articles             | Get all articles     |
| GET    | /articles/:id         | Get single article   |
| POST   | /articles             | Create new article   |
| PATCH  | /articles/:id         | Update article       |
| DELETE | /articles/:id         | Delete article       |
| GET    | /users                | Get all users        |

## Project Structure
```
kb-automation/
├── index.html     ← Main web app (all pages)
├── style.css      ← Stylesheet
├── app.js         ← All JavaScript / API calls
├── db.json        ← Mock database (JSON Server)
├── package.json   ← NPM config
└── README.md      ← This file
```
