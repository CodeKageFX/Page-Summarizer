function extractPageContent() {
    const title = document.title

    const contentElement =
        document.querySelector('main') ||
        document.querySelector('article') ||
        document.body

    const clutter = contentElement.querySelectorAll('nav, footer, header, aside, script, style')
    clutter.forEach(el => el.remove())

    return {
        title: title,
        content: contentElement.innerText.slice(0, 5000)
    }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'getContent') {
        sendResponse(extractPageContent())
    }
    return true
})