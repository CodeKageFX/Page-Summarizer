# AI Page Summarizer — Chrome Extension

A Chrome Extension that extracts content from any webpage and uses AI to generate a structured summary with key insights and estimated reading time.

## Demo
[Add your 2-5 minute video link here]

## Features
- One-click page summarization
- Bullet-point summary + key insights + reading time
- Caches summaries per page (no duplicate API calls)
- Clean, minimal popup UI
- Graceful error handling

## Setup Instructions

### Prerequisites
- Google Chrome browser
- A Groq API key (free at [console.groq.com](https://console.groq.com))

### Installation
1. Clone this repository
```bash
   git clone [your-repo-url]
   cd ai-summarizer
```

2. Load the extension in Chrome
   - Go to `chrome://extensions`
   - Enable **Developer Mode** (top right toggle)
   - Click **Load unpacked**
   - Select the `ai-summarizer` folder

3. Start the Backend Proxy Server
   - Open a new terminal instance and run:
   ```bash
   cd server
   npm install
   ```
   - Create a `.env` file inside the `server/` directory:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   ```
   - Start the server:
   ```bash
   node index.js
   ```

4. Generate a Summary
   - Navigate to any article or blog post.
   - Click the extension icon and hit **Generate Summary**.

## Architecture
ai-summarizer/
├── server/            # Backend Proxy Server
│   ├── .env           # Secret API Keys (ignored by git)
│   ├── index.js       # Express server logic
│   └── package.json   # Server dependencies
├── manifest.json      # Extension config and permissions
├── popup.html         # UI structure
├── popup.css          # Styles
├── popup.js           # UI logic and orchestrations
└── background.js      # API calls and caching

### How the pieces talk to each other
User clicks Summarize
↓
popup.js injects content extraction function into the page
↓
Extracted text returned directly to popup.js
↓
popup.js sends text to background.js via `chrome.runtime.sendMessage`
↓
background.js sends data to Local Proxy Server (`http://localhost:4000/summarize`)
↓
Proxy Server calls Groq API securely
↓
Summary returned to popup.js and displayed

## AI Integration

- **Provider:** Groq (llama-3.3-70b-versatile model)
- **Why Groq:** Fast inference, generous free tier, OpenAI-compatible API
- The AI is prompted to return a structured response with SUMMARY, KEY INSIGHTS, and READING TIME sections
- Content is trimmed to 5000 characters before sending to stay within token limits

## Security Decisions

- **Backend Proxy Pattern** — The API key (`GROQ_API_KEY`) is stored securely on the backend server (`server/.env`) and is never sent to the client's browser.
- **No API keys in source code** — The proxy architecture ensures the project is safe to push to public repositories.
- **Zero-config for users** — Users can install the extension and use it immediately without needing to insert their own API keys.
- **`innerText` used for user-facing content** — prevents XSS injection
- **`innerHTML` only used for formatting our own API response** — never for user input
- **Minimal permissions requested:**
  - `activeTab` — only access the current tab, only when user clicks the extension
  - `scripting` — inject content extraction on demand, not on every page load
  - `storage` — cache summaries locally

## Trade-offs

| Decision | Trade-off |
|----------|-----------|
| No content_scripts in manifest | Better performance — script only runs when user clicks Summarize, not on every page load |
| 5000 char content limit | Misses some content on very long pages, but keeps API costs low and responses fast |
| Cache by page title | Simple but not perfect — two pages with same title would share a cache entry. URL-based caching would be more accurate |
| Groq over Gemini | Groq has better free tier limits but requires account setup |

## Limitations
- Cannot summarize Chrome internal pages (`chrome://`), the Chrome Web Store, or pages that block extension scripts
- Summary quality depends on how well the page uses semantic HTML (`<main>`, `<article>` tags)