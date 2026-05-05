const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';


app.post('/summarize', async (req, res) => {
    const { title, content } = req.body;

    if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' });
    }

    if (!process.env.GROQ_API_KEY) {
        console.error('GROQ_API_KEY is not set in environment variables');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    try {
        // dynamic import for node-fetch is needed because node-fetch v3 is an ES module
        // and we initialized the project as CommonJS. Alternatively we could use native fetch if Node version >= 18.
        const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
        
        const response = await fetch(GROQ_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: 'user',
                        content: `Analyze this webpage and provide a structured summary.
                        
Page Title: ${title}
Content: ${content}

Respond in this exact format:

SUMMARY:
- [3-5 bullet points summarizing the page]

KEY INSIGHTS:
- [2-3 key takeaways]

READING TIME: [estimated minutes] min read`
                    }
                ],
                max_tokens: 1000
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Groq API Error:', data);
            throw new Error(`Groq API scale failed: ${response.status} ${response.statusText}`);
        }

        res.json({ success: true, summary: data.choices[0].message.content });
    } catch (error) {
        console.error('Error in /summarize:', error);
        res.status(500).json({ success: false, error: 'Failed to generate summary' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
