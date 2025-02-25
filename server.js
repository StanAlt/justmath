const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config();

console.log('Starting server...');
console.log('Environment variables:', {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'Set' : 'Not set',
    ASSISTANT_ID: process.env.ASSISTANT_ID
});

// Define image directory path
const IMAGE_DIR = 'C:\\Users\\stana\\CascadeProjects\\personal-website\\images';

// Initialize Express
const app = express();

// Configure CORS
app.use(cors({
    origin: '*', // For development only
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());
app.use(express.static(path.join(__dirname)));
app.use('/images', express.static(IMAGE_DIR));

// Load image mapping
let imageMapping;
async function loadImageMapping() {
    try {
        const mappingData = await fs.readFile(path.join(IMAGE_DIR, 'image-mapping.json'), 'utf8');
        imageMapping = JSON.parse(mappingData);
    } catch (error) {
        console.error('Error loading image mapping:', error);
        imageMapping = { topics: { default: { images: ['pencil.png'] } } };
    }
}
loadImageMapping();

// Add a health check endpoint that doesn't depend on OpenAI
app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});

let openai;
let askedQuestions = new Set();

try {
    console.log('Initializing OpenAI...');
    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is not set in environment variables');
    }
    openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });
    console.log('OpenAI initialized successfully');
} catch (error) {
    console.error('Failed to initialize OpenAI:', error);
}

function getRandomImage(topic) {
    try {
        const topicImages = imageMapping.topics[topic.toLowerCase()] || imageMapping.topics.default;
        const images = topicImages.images;
        const randomIndex = Math.floor(Math.random() * images.length);
        return `/images/${images[randomIndex]}`;
    } catch (error) {
        console.error('Error getting random image:', error);
        return '/images/pencil.png'; // Fallback to default image
    }
}

app.post('/api/question', async (req, res) => {
    if (!openai) {
        return res.status(500).json({ error: 'OpenAI client not initialized' });
    }

    try {
        const { age, difficulty, previousPerformance } = req.body;
        console.log('Received question request:', { age, difficulty, previousPerformance });
        
        let attempts = 0;
        const maxAttempts = 3;
        let questionData;

        while (attempts < maxAttempts) {
            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "You are a mathematics education expert specialized in assessment. Generate questions in valid JSON format only."
                    },
                    {
                        role: "user",
                        content: `Generate a unique math question appropriate for a ${age}-year-old student.
                                 Difficulty level: ${difficulty}
                                 Previous performance: ${previousPerformance || 'N/A'}
                                 
                                 Return ONLY a JSON object with this exact structure (no markdown, no backticks):
                                 {
                                     "question": "The question text",
                                     "options": ["option1", "option2", "option3", "option4"],
                                     "correct_answer": "The correct answer",
                                     "difficulty": "${difficulty}",
                                     "topic": "math topic"
                                 }`
                    }
                ]
            });

            try {
                const content = completion.choices[0].message.content.trim();
                const jsonStr = content.replace(/^```json\n|\n```$/g, '');
                questionData = JSON.parse(jsonStr);

                // Check if this question has been asked before
                if (!askedQuestions.has(questionData.question)) {
                    askedQuestions.add(questionData.question);
                    break;
                }
            } catch (parseError) {
                console.error('Failed to parse question data:', parseError);
                attempts++;
                continue;
            }

            attempts++;
        }

        if (!questionData) {
            throw new Error('Failed to generate a unique question after multiple attempts');
        }

        // Get a random image for the topic
        questionData.illustration = getRandomImage(questionData.topic.toLowerCase());

        console.log('OpenAI response received and parsed successfully');
        res.json(questionData);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to generate question', details: error.message });
    }
});

app.post('/api/check-answer', async (req, res) => {
    if (!openai) {
        return res.status(500).json({ error: 'OpenAI client not initialized' });
    }

    try {
        const { question, answer, age } = req.body;
        console.log('Checking answer:', { question, answer, age });

        // Convert answer to string for comparison
        const userAnswer = question.options[answer];
        const isCorrect = userAnswer === question.correct_answer;

        // Determine next difficulty
        let nextDifficulty = question.difficulty;
        if (isCorrect && nextDifficulty === 'easy') nextDifficulty = 'medium';
        else if (isCorrect && nextDifficulty === 'medium') nextDifficulty = 'hard';
        else if (!isCorrect && nextDifficulty === 'hard') nextDifficulty = 'medium';
        else if (!isCorrect && nextDifficulty === 'medium') nextDifficulty = 'easy';

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are a supportive math tutor. Provide brief, encouraging feedback for student answers."
                },
                {
                    role: "user",
                    content: `The student (age ${age}) answered a ${question.difficulty} math question.
                    Question: ${question.question}
                    Correct answer: ${question.correct_answer}
                    Student's answer: ${userAnswer}
                    ${isCorrect ? 'They got it right!' : 'They got it wrong.'}
                    Provide brief, encouraging feedback explaining why the answer is ${isCorrect ? 'correct' : 'incorrect'}.`
                }
            ]
        });

        const feedback = completion.choices[0].message.content;
        const correctAnswerIndex = question.options.indexOf(question.correct_answer);

        if (correctAnswerIndex === -1) {
            console.error('Correct answer not found in options:', {
                options: question.options,
                correctAnswer: question.correct_answer
            });
        }

        res.json({
            is_correct: isCorrect,
            explanation: feedback,
            next_difficulty: nextDifficulty,
            correct_answer_index: correctAnswerIndex
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to check answer', details: error.message });
    }
});

app.post('/api/assessment', async (req, res) => {
    if (!openai) {
        return res.status(500).json({ error: 'OpenAI client not initialized' });
    }

    try {
        const { age, questionHistory } = req.body;
        console.log('Received assessment request:', { age, questionHistory });
        
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are a mathematics education expert specialized in assessment."
                },
                {
                    role: "user",
                    content: `Based on this student's performance, provide a comprehensive assessment.
                             Age: ${age}
                             Question History: ${JSON.stringify(questionHistory)}
                             
                             Return the response in the following JSON format:
                             {
                                 "grade_level": "Estimated grade level",
                                 "proficiency": "Overall proficiency level",
                                 "strengths": ["strength1", "strength2"],
                                 "areas_to_improve": ["area1", "area2"],
                                 "recommended_topics": ["topic1", "topic2"],
                                 "detailed_feedback": "Comprehensive feedback"
                             }`
                }
            ]
        });

        console.log('OpenAI response received');
        res.json(completion.choices[0].message.content);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to generate assessment', details: error.message });
    }
});

// Add error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Export the app for Vercel
module.exports = app;
