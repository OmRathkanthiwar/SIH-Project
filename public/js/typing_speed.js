const textDisplay = document.getElementById('text-display');
const textInput = document.getElementById('text-input');
const timerDisplay = document.getElementById('timer');
const wpmDisplay = document.getElementById('wpm');
const accuracyDisplay = document.getElementById('accuracy');
const resetBtn = document.getElementById('reset-btn');

const sentences = [
    "The quick brown fox jumps over the lazy dog.",
    "Never underestimate the power of a good book.",
    "Technology has revolutionized the way we live and work.",
    "The sun always shines brightest after the rain.",
    "Education is the most powerful weapon which you can use to change the world."
];

let timer;
let timeLeft = 60;
let totalCharsTyped = 0;
let correctChars = 0;
let isTyping = false;

function getRandomSentence() {
    return sentences[Math.floor(Math.random() * sentences.length)];
}

function renderNewSentence() {
    const sentence = getRandomSentence();
    textDisplay.innerHTML = '';
    sentence.split('').forEach(char => {
        const charSpan = document.createElement('span');
        charSpan.innerText = char;
        textDisplay.appendChild(charSpan);
    });
    textInput.value = '';
    updateCurrentCharHighlight(0);
}

function updateCurrentCharHighlight(index) {
    const allChars = textDisplay.querySelectorAll('span');
    allChars.forEach((charSpan, i) => {
        charSpan.classList.remove('current');
        if (i === index) {
            charSpan.classList.add('current');
        }
    });
}

function startTimer() {
    isTyping = true;
    timer = setInterval(() => {
        timeLeft--;
        timerDisplay.innerText = timeLeft;
        if (timeLeft === 0) {
            endGame();
        }
        calculateWPM();
    }, 1000);
}

function endGame() {
    clearInterval(timer);
    isTyping = false;
    textInput.disabled = true;
    calculateWPM();
    calculateAccuracy();
}

function resetGame() {
    clearInterval(timer);
    timeLeft = 60;
    totalCharsTyped = 0;
    correctChars = 0;
    isTyping = false;
    
    timerDisplay.innerText = timeLeft;
    wpmDisplay.innerText = 0;
    accuracyDisplay.innerText = 100;
    textInput.disabled = false;
    renderNewSentence();
}

function calculateWPM() {
    const wordsTyped = (correctChars / 5);
    const timeElapsedInMinutes = (60 - timeLeft) / 60;
    if (timeElapsedInMinutes > 0) {
        const wpm = Math.round(wordsTyped / timeElapsedInMinutes);
        wpmDisplay.innerText = wpm;
    }
}

function calculateAccuracy() {
    if (totalCharsTyped > 0) {
        const accuracy = Math.round((correctChars / totalCharsTyped) * 100);
        accuracyDisplay.innerText = accuracy;
    }
}

textInput.addEventListener('input', () => {
    if (!isTyping && timeLeft > 0) {
        startTimer();
    }
    
    const sentenceChars = textDisplay.querySelectorAll('span');
    const inputChars = textInput.value.split('');
    totalCharsTyped = inputChars.length;
    correctChars = 0;

    sentenceChars.forEach((charSpan, index) => {
        const inputChar = inputChars[index];
        if (inputChar == null) {
            charSpan.classList.remove('correct', 'incorrect');
        } else if (inputChar === charSpan.innerText) {
            charSpan.classList.add('correct');
            charSpan.classList.remove('incorrect');
            correctChars++;
        } else {
            charSpan.classList.add('incorrect');
            charSpan.classList.remove('correct');
        }
    });
    
    updateCurrentCharHighlight(inputChars.length);
    calculateAccuracy();

    if (inputChars.length === sentenceChars.length) {
        renderNewSentence();
    }
});

resetBtn.addEventListener('click', resetGame);
renderNewSentence();
