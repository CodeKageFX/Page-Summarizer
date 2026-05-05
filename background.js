const PROXY_URL = 'http://localhost:4000/summarize'

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'summarize') {
        summarizeWithProxy(message.title, message.content, message.url)
            .then(summary => sendResponse({ success: true, summary }))
            .catch(err => sendResponse({ success: false, error: err.message }))
        return true
    }
})

async function summarizeWithProxy(title, content, url) {
    const cached = await getCached(url)
    if (cached) return cached

    const response = await fetch(PROXY_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            title: title,
            content: content
        })
    })

    const data = await response.json()

    if (!response.ok) throw new Error(data.error || `Server error: ${response.status}`)
    if (!data.success) throw new Error(data.error || 'Failed to generate summary')

    const summary = data.summary
    await setCached(url, summary)
    return summary
}

// chrome.storage wrapper functions
function getCached(title) {
    return new Promise(resolve => {
        chrome.storage.local.get(title, result => {
            resolve(result[title] || null)
        })
    })
}

function setCached(title, summary) {
    return new Promise(resolve => {
        chrome.storage.local.set({ [title]: summary }, resolve)
    })
}