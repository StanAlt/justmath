class MathAPI {
    constructor() {
        this.baseURL = 'http://localhost:3001/api';
    }

    async getQuestion(age, difficulty, previousPerformance = null) {
        try {
            const response = await fetch(`${this.baseURL}/question`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    age,
                    difficulty,
                    previousPerformance
                })
            });

            if (!response.ok) {
                throw new Error('Failed to fetch question');
            }

            const data = await response.json();
            return typeof data === 'string' ? JSON.parse(data) : data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    async checkAnswer(question, userAnswer, age) {
        try {
            const response = await fetch(`${this.baseURL}/check-answer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    question,
                    userAnswer,
                    age
                })
            });

            if (!response.ok) {
                throw new Error('Failed to check answer');
            }

            const data = await response.json();
            return typeof data === 'string' ? JSON.parse(data) : data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    async getFinalAssessment(age, questionHistory) {
        try {
            const response = await fetch(`${this.baseURL}/assessment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    age,
                    questionHistory
                })
            });

            if (!response.ok) {
                throw new Error('Failed to generate assessment');
            }

            const data = await response.json();
            return typeof data === 'string' ? JSON.parse(data) : data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
}
