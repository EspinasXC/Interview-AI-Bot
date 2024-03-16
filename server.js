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

const questions = [
    "Describe a situation where you had to work in a team.",
    "Explain a complex concept in simple terms.",
    "Tell us about a time you overcame a challenge."
];

app.get('/get-question', (req, res) => {
    const randomIndex = Math.floor(Math.random() * questions.length);
    const question = questions[randomIndex];
    res.json({ question });
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
