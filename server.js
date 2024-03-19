require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const {OpenAI} = require('openai');
const path = require('path');

const app = express();
const port = 3000;

// OpenAI API setup
const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

  // Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

app.post('/get-question', async (req, res) => {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are going to help me prep for my interviews." },
                { role: "user", content: "Generate a single random behavioral style question that could be asked in a job interview." }
            ],
            max_tokens: 150
        });
        const question = response.choices[0].message.content.trim();
        res.json({ question });
    } catch (error) {
        console.error('Error calling OpenAI API:', error);
        res.status(500).json({ feedback: 'Error generating your question. Please try again.' });
    }
});


app.post('/submit-answer', async (req, res) => {
    const { answer } = req.body;
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are a well-educated bot that grades interview responses." },
                { role: "user", content: `Here's an interview answer for grading: ${answer}` }
            ],
            max_tokens: 150
        });
        const feedback = response.choices[0].message.content.trim();
        res.json({ feedback });
    } catch (error) {
        console.error('Error calling OpenAI API:', error);
        res.status(500).json({ feedback: 'Error processing your answer. Please try again.' });
    }
});


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Interview Prep Bot server listening at http://localhost:${port}`);
});
