import 'dotenv/config';
import express from 'express';
import path from 'path';
import session from 'express-session';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';
import OpenAI from "openai";
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Initialize OpenAI with the API key from .env
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));
app.use(session({ secret: 'sih-super-secret-key', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

// -------------------- Mock Users --------------------
const users = [];
const setupMockData = async () => {
    const studentPass = await bcrypt.hash('student123', 10);
    users.push({
        id: 1,
        username: 'priya',
        password: studentPass,
        role: 'student',
        details: {
            name: "Priya Sharma",
            grade: 8,
            adventurePoints: 1450,
            profilePic: `https://placehold.co/128x128/818cf8/ffffff?text=P`,
            badges: ['first_quiz']
        }
    });
};
setupMockData();

// -------------------- Subjects --------------------
const subjects = [
    { id: 'math', name: "Mathematics", icon: '➗', progress: 65 },
    { id: 'phy', name: "Physics", icon: '⚛️', progress: 40 },
    { id: 'chem', name: "Chemistry", icon: '🧪', progress: 80 },
    { id: 'bio', name: "Biology", icon: '🌱', progress: 55 }
];

// -------------------- Passport Auth --------------------
passport.use(new LocalStrategy(async (username, password, done) => {
    const user = users.find(u => u.username === username);
    if (!user) return done(null, false);
    if (await bcrypt.compare(password, user.password)) return done(null, user);
    return done(null, false);
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => done(null, users.find(u => u.id === id)));

function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/login');
}

// -------------------- Greeting --------------------
const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
};

// -------------------- Middleware --------------------
app.use((req, res, next) => { res.locals.user = req.user; res.locals.currentPath = req.path; next(); });

// -------------------- Routes --------------------
app.get('/', (req, res) => res.redirect('/login'));
app.get('/login', (req, res) => res.render('login'));
app.post('/login', passport.authenticate('local', { failureRedirect: '/login' }), (req, res) => {
    if (req.user.role === 'student') {
        res.redirect('/student');
    } else if (req.user.role === 'teacher') {
        res.redirect('/teacher');
    } else {
        res.redirect('/login');
    }
});
app.get('/logout', (req, res) => { req.logout(() => res.redirect('/login')); });

app.get('/student', isAuthenticated, (req, res) => {
    res.render('student_dashboard', { subjects, greeting: getGreeting() });
});

// AI Tutor Routes
app.get('/ask-ai', isAuthenticated, (req, res) => {
    res.render('ask_ai', { question: null, answer: null });
});

app.post('/ask-ai', isAuthenticated, async (req, res) => {
    const { question } = req.body;
    let answer = "";
    try {
        const completion = await openai.chat.completions.create({
            messages: [{ role: "system", content: "You are a helpful school tutor named Sikshya Sahayak." }, { role: "user", content: question }],
            model: "gpt-3.5-turbo",
        });
        answer = completion.choices[0].message.content;
    } catch (err) {
        console.error("OpenAI API Error:", err);
        answer = "Sorry, I couldn't reach the AI server. Please check your API key.";
    }
    res.render('ask_ai', { question, answer });
});

// Quizzes Routes
app.get('/quizzes', isAuthenticated, (req, res) => {
    const quizzes = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "quizzes.json")));
    res.render('quizzes', { quizzes });
});

app.get('/quiz/:id', isAuthenticated, (req, res) => {
    const quizzes = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'quizzes.json')));
    const quiz = quizzes.find(q => q.id === parseInt(req.params.id));
    if (!quiz) return res.status(404).send("Quiz not found");
    res.render('quiz_detail', { quiz });
});

app.post('/quiz/:id/submit', isAuthenticated, (req, res) => {
    const quizzes = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'quizzes.json')));
    const quiz = quizzes.find(q => q.id === parseInt(req.params.id));
    if (!quiz) return res.status(404).send("Quiz not found");
    let score = 0;
    const results = quiz.questions.map((q, index) => {
        const userAnswerIndex = req.body[`q${index}`];
        const correct = parseInt(userAnswerIndex) === q.answer;
        if (correct) score++;
        return {
            question: q.question,
            userAnswer: q.options[userAnswerIndex] || "Not Answered",
            correctAnswer: q.options[q.answer],
            correct
        };
    });
    res.render('quiz_result', { score, total: quiz.questions.length, results, quizId: quiz.id });
});

// Leaderboard, Profile, etc.
app.get('/leaderboard', isAuthenticated, (req, res) => {
    const students = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'students.json')));
    res.render('leaderboard', { students: students.sort((a, b) => b.adventurePoints - a.adventurePoints) });
});

app.get('/profile', isAuthenticated, (req, res) => res.render('profile'));

// -------------------- Games Routes --------------------
app.get('/games', isAuthenticated, (req, res) => {
    res.render('games_hub');
});

app.get('/games/memory', isAuthenticated, (req, res) => {
    res.render('memory_game');
});

app.get('/games/math-sprint', isAuthenticated, (req, res) => {
    res.render('math_sprint_game');
});

app.get('/games/typing-speed', isAuthenticated, (req, res) => {
    res.render('typing_speed_game');
});

app.listen(PORT, () => console.log(`Eduventure running at http://localhost:${PORT}`));

