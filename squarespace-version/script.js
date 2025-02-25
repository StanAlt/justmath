class MathAssessment {
    constructor() {
        this.questions = [];
        this.answers = [];
        this.difficulty = "medium";
        this.totalQuestions = 10;
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

    async getNextQuestion() {
        try {
            // Show loading screen with appropriate message
            this.showLoading('Loading Next Question...');

            const response = await fetch(`${CONFIG.API_URL}/question`, {
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
                throw new Error('Failed to fetch question');
            }

            const questionData = await response.json();
            
            // Update the question display
            document.getElementById('question-text').textContent = questionData.question;
            
            // Clear previous options
            const optionsContainer = document.getElementById('options-container');
            optionsContainer.innerHTML = '';
            
            // Add new options
            questionData.options.forEach((option, index) => {
                const button = document.createElement('button');
                button.className = 'option-button';
                button.textContent = option;
                button.onclick = () => this.selectOption(index);
                optionsContainer.appendChild(button);
            });

            // Update illustration if provided
            const illustrationContainer = document.getElementById('illustration');
            if (questionData.illustration) {
                illustrationContainer.innerHTML = `<img src="${questionData.illustration}" alt="Question illustration">`;
                illustrationContainer.style.display = 'block';
            } else {
                illustrationContainer.style.display = 'none';
            }

            // Store the question data
            this.currentQuestion = questionData;

            // Hide loading screen
            this.hideLoading();

        } catch (error) {
            console.error('Error fetching question:', error);
            // Show error message to user
            document.getElementById('error-message').textContent = 'Failed to load question. Please try again.';
            this.hideLoading();
        }
    }

    // ... rest of the class implementation remains the same ...
}

// Initialize the assessment when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new MathAssessment();
});
