// Add any interactive JavaScript here
console.log(`Welcome to Stan Altshuller's personal website!`);

// Math Assessment Logic
class MathAssessment {
    constructor() {
        this.questions = [];
        this.answers = [];
        this.difficulty = "medium";
        this.totalQuestions = 10;
        this.selectedAnswer = null;
        this.apiBaseUrl = 'http://localhost:3001/api';
        this.currentTimer = null;
        this.initialize();
    }

    async initialize() {
        // Add event listener for the submit button
        document.getElementById('submit-answer').addEventListener('click', () => this.submitAnswer());
        
        // Add event listener for the next question button
        document.getElementById('next-question').addEventListener('click', () => this.nextQuestion());
        
        // Hide the assessment initially
        document.getElementById('assessment').classList.add('hidden');
        
        // Show the start screen
        document.getElementById('start-screen').classList.remove('hidden');

        // Add event listener for the start form
        document.getElementById('start-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const ageInput = document.getElementById('age');
            const errorMessage = document.getElementById('age-error');

            // Clear any existing error message
            errorMessage.textContent = '';
            errorMessage.className = 'error-message';

            // Check if input is empty or not a number
            if (!ageInput.value || ageInput.value.trim() === '') {
                errorMessage.textContent = 'Please enter your age';
                errorMessage.classList.add('show');
                return;
            }

            const age = parseInt(ageInput.value);

            // Check if age is NaN or not a positive number
            if (isNaN(age) || age <= 0) {
                errorMessage.textContent = 'Please enter a valid age';
                errorMessage.classList.add('show');
                return;
            }

            if (age < 5) {
                errorMessage.textContent = 'Sorry, this assessment is for ages 5 and up';
                errorMessage.classList.add('show');
                return;
            }

            if (age > 100) {
                const funnyResponses = [
                    "Wow! You must be really wise! But let's keep it under 100 for now 😉",
                    "Are you a time traveler from the future? 🚀 Please enter an age under 100",
                    "That's a lot of birthdays! 🎂 Try an age under 100",
                    "You must have some amazing stories! But for now, let's use an age under 100 🌟"
                ];
                const randomResponse = funnyResponses[Math.floor(Math.random() * funnyResponses.length)];
                errorMessage.textContent = randomResponse;
                errorMessage.classList.add('show');
                return;
            }

            // Store the age
            this.age = age;

            if (age > 18) {
                errorMessage.textContent = "You're a bit older than our target age, but feel free to try it out!";
                errorMessage.className = 'info-message show';
                // Add a slight delay before starting to show the message
                setTimeout(() => this.startAssessment(), 1500);
                return;
            }

            this.startAssessment();
        });
    }

    async startAssessment() {
        // Hide start screen and show assessment
        document.getElementById('start-screen').classList.add('hidden');
        const assessment = document.getElementById('assessment');
        assessment.classList.remove('hidden');
        assessment.style.display = 'block';
        
        // Reset state
        this.questions = [];
        this.answers = [];
        this.difficulty = "medium";
        
        // Update progress bar
        this.updateProgress();
        
        // Get first question
        await this.getNextQuestion();
    }

    async getNextQuestion() {
        try {
            // Show loading screen
            const loadingScreen = document.querySelector('.loading-screen');
            if (!loadingScreen) {
                console.error('Loading screen element not found');
                return;
            }
            loadingScreen.classList.add('active');

            const response = await fetch(`${this.apiBaseUrl}/question`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    age: this.age,
                    difficulty: this.difficulty,
                    previousPerformance: this.answers.length > 0 ? this.answers[this.answers.length - 1].correct : null
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch question: ${response.status}`);
            }

            const questionData = await response.json();
            console.log('Question data received:', questionData);
            
            // Update the question display
            const questionContainer = document.getElementById('question-container');
            if (!questionContainer) {
                throw new Error('Question container not found');
            }
            questionContainer.textContent = questionData.question;
            
            // Clear previous options
            const optionsContainer = document.getElementById('options-container');
            if (!optionsContainer) {
                throw new Error('Options container not found');
            }
            optionsContainer.innerHTML = '';
            
            // Add new options
            questionData.options.forEach((option, index) => {
                const button = document.createElement('button');
                button.className = 'answer-option';
                button.textContent = option;
                button.dataset.index = index;
                
                button.addEventListener('click', () => {
                    // Remove selected class from all buttons
                    document.querySelectorAll('.answer-option').forEach(btn => {
                        btn.classList.remove('selected');
                    });
                    
                    // Add selected class to clicked button
                    button.classList.add('selected');
                    this.selectedAnswer = index;
                    
                    // Enable submit button
                    const submitButton = document.getElementById('submit-answer');
                    if (submitButton) {
                        submitButton.disabled = false;
                    }
                });
                
                optionsContainer.appendChild(button);
            });

            // Update illustration if provided
            const illustrationContainer = document.getElementById('question-illustration');
            if (illustrationContainer && questionData.illustration) {
                illustrationContainer.innerHTML = `<img src="${questionData.illustration}" alt="Question illustration">`;
                illustrationContainer.style.display = 'block';
            } else if (illustrationContainer) {
                illustrationContainer.style.display = 'none';
            }

            // Store the question data
            this.currentQuestion = questionData;

            // Reset selected answer
            this.selectedAnswer = null;
            const submitButton = document.getElementById('submit-answer');
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.classList.remove('hidden');
            }

            // Hide loading screen
            loadingScreen.classList.remove('active');

        } catch (error) {
            console.error('Error fetching question:', error);
            // Show error message to user
            alert('Failed to load question. Please try again.');
            const loadingScreen = document.querySelector('.loading-screen');
            if (loadingScreen) {
                loadingScreen.classList.remove('active');
            }
        }
    }

    async submitAnswer() {
        if (this.selectedAnswer === null) {
            return;
        }

        const answer = this.selectedAnswer;
        const currentQuestion = this.currentQuestion;

        try {
            const response = await fetch(`${this.apiBaseUrl}/check-answer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    question: currentQuestion,
                    answer: answer,
                    age: this.age
                })
            });

            if (!response.ok) {
                throw new Error('Failed to check answer');
            }

            const result = await response.json();

            // Update the difficulty for the next question
            this.difficulty = result.next_difficulty;

            // Store the answer result
            this.answers.push({
                question: currentQuestion,
                answer: answer,
                correct: result.is_correct,
                explanation: result.explanation
            });

            // Update progress
            this.updateProgress();

            // Remove previous correct/incorrect classes
            document.querySelectorAll('.answer-option').forEach(option => {
                option.classList.remove('correct', 'incorrect', 'selected');
            });

            // Get the selected button and the button with the correct answer
            const selectedButton = document.querySelector(`.answer-option[data-index="${answer}"]`);
            const correctButton = document.querySelector(`.answer-option[data-index="${result.correct_answer_index}"]`);

            if (result.is_correct) {
                selectedButton.classList.add('correct');
            } else {
                selectedButton.classList.add('incorrect');
                correctButton.classList.add('correct');
            }

            // Show feedback
            this.showFeedback({
                correct: result.is_correct,
                explanation: result.explanation
            });

            // Hide loading screen
            const loadingScreen = document.querySelector('.loading-screen');
            if (loadingScreen) {
                loadingScreen.classList.remove('active');
            }
        } catch (error) {
            console.error('Error checking answer:', error);
            alert('Failed to check answer. Please try again.');
            const loadingScreen = document.querySelector('.loading-screen');
            if (loadingScreen) {
                loadingScreen.classList.remove('active');
            }
        }
    }

    showFeedback(result) {
        const feedback = document.getElementById('feedback');
        const feedbackText = document.getElementById('answer-feedback');
        
        feedbackText.textContent = result.explanation;
        feedbackText.className = result.correct ? 'correct' : 'incorrect';
        
        feedback.classList.remove('hidden');
        document.getElementById('submit-answer').classList.add('hidden');
        
        // Start countdown for next question
        if (this.answers.length < this.totalQuestions) {
            this.startCountdown();
        } else {
            this.showResults();
        }
    }

    startCountdown() {
        const countdownElement = document.querySelector('.countdown');
        let timeLeft = 5;

        countdownElement.textContent = timeLeft;
        countdownElement.classList.add('active');
        countdownElement.style.display = 'flex';

        const timer = setInterval(() => {
            timeLeft--;
            countdownElement.textContent = timeLeft;

            if (timeLeft <= 0) {
                clearInterval(timer);
                this.nextQuestion();
            }
        }, 1000);

        // Store the timer so we can clear it if needed
        this.currentTimer = timer;
    }

    nextQuestion() {
        // Clear the countdown timer if it exists
        if (this.currentTimer) {
            clearInterval(this.currentTimer);
            this.currentTimer = null;
        }

        const countdownElement = document.querySelector('.countdown');
        countdownElement.classList.remove('active');
        countdownElement.style.display = 'none';

        document.getElementById('feedback').classList.add('hidden');
        document.getElementById('submit-answer').classList.remove('hidden');

        // Get the next question
        this.getNextQuestion();
    }

    updateProgress() {
        const progress = (this.answers.length / this.totalQuestions) * 100;
        document.querySelector('.progress').style.width = `${progress}%`;
    }

    showResults() {
        document.getElementById('assessment').classList.add('hidden');
        document.getElementById('results').classList.remove('hidden');
        
        const correctAnswers = this.answers.filter(a => a.correct).length;
        document.getElementById('correct-answers').textContent = correctAnswers;
        document.getElementById('total-questions').textContent = this.totalQuestions;
    }
}

// Initialize the assessment when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new MathAssessment();
});
