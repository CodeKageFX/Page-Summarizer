const summarizeBtn = document.getElementById('summarize-btn')
const resetBtn = document.getElementById('reset-btn')
const loadingEl = document.getElementById('loading')
const summaryEl = document.getElementById('summary-output')
const pageTitleEl = document.getElementById('page-title')

// show current page title when popup opens
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    pageTitleEl.textContent = `You're summarizing: ${tabs[0].title}`
})

// retry messaging content.js up to 3 times to avoid race condition
async function getContentFromTab(tabId) {
    for (let i = 0; i < 3; i++) {
        try {
            return await chrome.tabs.sendMessage(tabId, { action: 'getContent' })
        } catch (e) {
            await new Promise(r => setTimeout(r, 100))
        }
    }
    throw new Error('Could not connect to page. Try refreshing.')
}

summarizeBtn.addEventListener('click', async () => {
    loadingEl.classList.remove('hidden')
    summaryEl.classList.add('hidden')
    summarizeBtn.disabled = true

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

        // inject content.js into the page on demand
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
        })

        // get page content from content.js
        const pageData = await getContentFromTab(tab.id)
console.log('Step 3 - sending to background...')
        // send to background.js to call Groq
        const result = await chrome.runtime.sendMessage({
            action: 'summarize',
            title: pageData.title,
            content: pageData.content,
            url: tab.url
        })

        if (!result.success) throw new Error(result.error)

            console.log('Step 4 - got result:', result)

        // format and display summary
        const formatted = result.summary
            .replace(/^SUMMARY:/m, '<h3>Summary</h3>')
            .replace(/^KEY INSIGHTS:/m, '<h3>Key Insights</h3>')
            .replace(/^READING TIME:/m, '<h3>Reading Time</h3>')
            .replace(/^[-•]\s+(.+)/gm, '<li>$1</li>')
            .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')

        summaryEl.innerHTML = formatted
        summaryEl.classList.remove('hidden')

    } catch (err) {
        // user friendly error messages
        let userMessage = err.message

        if (err.message.includes('Cannot access')) {
            userMessage = "This page can't be summarized. Try on a news article or blog post."
        } else if (err.message.includes('Could not connect')) {
            userMessage = 'Could not read page content. Try refreshing the page.'
        }

        summaryEl.innerText = userMessage
        summaryEl.classList.remove('hidden')
    } finally {
        loadingEl.classList.add('hidden')
        summarizeBtn.disabled = false
    }
})

resetBtn.addEventListener('click', () => {
    summaryEl.innerHTML = ''
    summaryEl.classList.add('hidden')
    pageTitleEl.textContent = "You're summarizing:"
})