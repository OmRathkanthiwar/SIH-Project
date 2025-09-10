const scoreDisplay = document.getElementById('score');
const timeLeftDisplay = document.getElementById('time-left');
const operand1Display = document.getElementById('operand1');
const operatorDisplay = document.getElementById('operator');
const operand2Display = document.getElementById('operand2');
const answerInput = document.getElementById('answer');
const startBtn = document.getElementById('start-btn');
const feedbackDisplay = document.getElementById('feedback');
const problemContainer = document.getElementById('problem-container');

let score = 0;
let timeLeft = 60;
let timer;
let correctAnswer;

const operators = ['+', '-', '×'];

function generateProblem() {
    const operator = operators[Math.floor(Math.random() * operators.length)];
    let operand1 = Math.floor(Math.random() * 10) + 1;
    let operand2 = Math.floor(Math.random() * 10) + 1;

    if (operator === '-') {
        if (operand1 < operand2) {
            [operand1, operand2] = [operand2, operand1]; // Swap to avoid negative answers
        }
    }
    
    operand1Display.textContent = operand1;
    operatorDisplay.textContent = operator;
    operand2Display.textContent = operand2;

    switch (operator) {
        case '+':
            correctAnswer = operand1 + operand2;
            break;
        case '-':
            correctAnswer = operand1 - operand2;
            break;
        case '×':
            correctAnswer = operand1 * operand2;
            break;
    }
}

function startGame() {
    score = 0;
    timeLeft = 60;
    scoreDisplay.textContent = score;
    timeLeftDisplay.textContent = timeLeft;
    answerInput.value = '';
    feedbackDisplay.textContent = '';
    
    startBtn.style.display = 'none';
    problemContainer.style.display = 'flex';
    answerInput.focus();

    generateProblem();

    timer = setInterval(() => {
        timeLeft--;
        timeLeftDisplay.textContent = timeLeft;
        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);
}

function endGame() {
    clearInterval(timer);
    feedbackDisplay.textContent = `Game Over! Your final score is ${score}.`;
    startBtn.style.display = 'block';
    startBtn.textContent = 'Play Again';
    problemContainer.style.display = 'none';
}

function checkAnswer() {
    const userAnswer = parseInt(answerInput.value, 10);
    if (userAnswer === correctAnswer) {
        score++;
        scoreDisplay.textContent = score;
        feedbackDisplay.textContent = 'Correct!';
        feedbackDisplay.className = 'correct';
    } else {
        feedbackDisplay.textContent = `Wrong! The answer was ${correctAnswer}.`;
        feedbackDisplay.className = 'incorrect';
    }
    answerInput.value = '';
    generateProblem();
}

startBtn.addEventListener('click', startGame);
answerInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        checkAnswer();
    }
});
