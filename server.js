require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const {OpenAI} = require('openai');
const path = require('path');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');


const app = express();
const port = 3000;

// OpenAI API setup
const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

  // Middleware
  app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: '/tmp/'  // Make sure this directory exists or is accessible
}));
app.use(bodyParser.json());
app.use(express.static('public'));

app.post('/get-question', async (req, res) => {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are going to help me prep for my interviews." },
                { role: "user", content: "Generate a single random behavioral style question that could be asked in a job interview. Make the questions unique so you don't repeat any" }
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
    const { answer, question } = req.body;
    console.log("Received answer:", answer);
    console.log("Received question:", question); // This should now log correctly
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    "role": "system",
                    "content": "You are a sophisticated AI trained to evaluate and provide constructive feedback on interview responses using the STAR method."
                },
                {
                    "role": "user",
                    "content": `Here is the interview question I was given: ${question}. Here's my interview response for grading: ${answer}. Please critique this response thoroughly, focusing on how effectively I've used the STAR method, the clarity and relevance of my examples, and any suggestions for improvement. Your feedback should help me refine my approach and enhance my response for future interviews.`
                }
            ],
            max_tokens: 250 // Adjusted to allow for longer feedback if necessary
        });
        const feedback = response.choices[0].message.content.trim();
        res.json({ feedback });
    } catch (error) {
        console.error('Error calling OpenAI API:', error);
        res.status(500).json({ feedback: 'Error processing your answer. Please try again.' });
    }
});


// Add endpoint to receive and transcribe audio
app.post('/transcribe-audio', (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    const audioFile = req.files.audio;
    const outputPath = '/tmp/output.wav'; // Choose a supported format like 'wav'

    ffmpeg(audioFile.tempFilePath)
        .output(outputPath)
        .on('end', function() {
            console.log('Conversion finished');
            const fileStream = fs.createReadStream(outputPath);

            openai.audio.transcriptions.create({
                file: fileStream,
                model: "whisper-1",
            })
            .then(transcription => {
                console.log('Transcription text:', transcription.text);
                res.json({ transcribedText: transcription.text });

                // Cleanup: delete temp files
                fs.unlinkSync(outputPath);
                fs.unlinkSync(audioFile.tempFilePath);
            })
            .catch(error => {
                console.error('Error calling OpenAI API:', error);
                res.status(500).send('Error processing audio input.');

                // Cleanup: delete temp files
                fs.unlinkSync(outputPath);
                fs.unlinkSync(audioFile.tempFilePath);
            });
        })
        .on('error', function(err) {
            console.error('An error occurred: ' + err.message);
            res.status(500).send('Error processing audio file');

            // Cleanup: delete temp files
            fs.unlinkSync(outputPath);
            fs.unlinkSync(audioFile.tempFilePath);
        })
        .run();
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Interview Prep Bot server listening at http://localhost:${port}`);
});
