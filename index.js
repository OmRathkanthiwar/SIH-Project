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

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Paths to data files
const QUIZZES_PATH = path.join(__dirname, 'data', 'quizzes.json');
const STUDENTS_PATH = path.join(__dirname, 'data', 'students.json');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true })); // Use extended for complex forms
app.use(session({ secret: 'sih-super-secret-key', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

// --- Mock Users ---
const users = [];
const setupMockData = async () => {
    const studentPass = await bcrypt.hash('student123', 10);
    users.push({
        id: 1,
        username: 'priya',
        password: studentPass,
        role: 'student',
        details: { name: "Priya Sharma", grade: 8, adventurePoints: 1450, profilePic: `https://placehold.co/128x128/818cf8/ffffff?text=P`, badges: ['first_quiz'] }
    });
    const teacherPass = await bcrypt.hash('teacher123', 10);
    users.push({
        id: 2,
        username: 'mr.singh',
        password: teacherPass,
        role: 'teacher',
        details: { name: "Mr. Singh", profilePic: `https://placehold.co/128x128/34d399/ffffff?text=S` }
    });
};
setupMockData();

// --- Data Helpers ---
const readData = (filePath) => JSON.parse(fs.readFileSync(filePath));
const writeData = (filePath, data) => fs.writeFileSync(filePath, JSON.stringify(data, null, 2));


// --- Passport Auth ---
passport.use(new LocalStrategy(async (username, password, done) => {
    const user = users.find(u => u.username === username);
    if (!user) return done(null, false);
    if (await bcrypt.compare(password, user.password)) return done(null, user);
    return done(null, false);
}));
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => done(null, users.find(u => u.id === id)));

// --- Middleware ---
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/login');
}

function isTeacher(req, res, next) {
    if (req.isAuthenticated() && req.user.role === 'teacher') return next();
    res.status(403).send("Access Denied");
}

app.use((req, res, next) => {
    res.locals.user = req.user;
    res.locals.currentPath = req.path;
    next();
});

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
};

// --- General Routes ---
app.get('/', (req, res) => res.redirect('/login'));
app.get('/login', (req, res) => res.render('login'));
app.post('/login', passport.authenticate('local', { failureRedirect: '/login' }), (req, res) => {
    if (req.user.role === 'teacher') return res.redirect('/teacher');
    res.redirect('/student');
});
app.get('/logout', (req, res) => { req.logout(() => res.redirect('/login')); });

// --- Student Routes ---
app.get('/student', isAuthenticated, (req, res) => {
    const subjects = [
        { id: 'math', name: "Mathematics", icon: '➗', progress: 65 },
        { id: 'phy', name: "Physics", icon: '⚛️', progress: 40 },
        { id: 'chem', name: "Chemistry", icon: '🧪', progress: 80 },
        { id: 'bio', name: "Biology", icon: '🌱', progress: 55 }
    ];
    res.render('student_dashboard', { subjects, greeting: getGreeting() });
});
app.get('/quizzes', isAuthenticated, (req, res) => res.render('quizzes', { quizzes: readData(QUIZZES_PATH) }));
app.get('/quiz/:id', isAuthenticated, (req, res) => {
    const quiz = readData(QUIZZES_PATH).find(q => q.id === parseInt(req.params.id));
    if (!quiz) return res.status(404).send("Quiz not found");
    res.render('quiz_detail', { quiz });
});
app.post('/quiz/:id/submit', isAuthenticated, (req, res) => {
    const quiz = readData(QUIZZES_PATH).find(q => q.id === parseInt(req.params.id));
    if (!quiz) return res.status(404).send("Quiz not found");
    let score = 0;
    const results = quiz.questions.map((q, index) => {
        const userAnswerIndex = req.body[`q${index}`];
        const correct = parseInt(userAnswerIndex) === q.answer;
        if (correct) score++;
        return {
            question: q.question,
            correctAnswer: q.options[q.answer],
            userAnswer: userAnswerIndex !== undefined ? q.options[userAnswerIndex] : "Not Answered",
            correct
        };
    });
    res.render('quiz_result', { quizId: quiz.id, score, total: quiz.questions.length, results });
});
app.get('/leaderboard', isAuthenticated, (req, res) => res.render('leaderboard', { students: readData(STUDENTS_PATH) }));
app.get('/profile', isAuthenticated, (req, res) => res.render('profile'));
app.get('/ask-ai', isAuthenticated, (req, res) => res.render('ask_ai', { question: null, answer: null }));
app.post('/ask-ai', isAuthenticated, async (req, res) => {
    const { question } = req.body;
    let answer = "Sorry, I couldn't reach the AI server. Try again later.";
    try {
        const completion = await openai.chat.completions.create({
            messages: [{ role: "system", content: "You are a helpful school tutor." }, { role: "user", content: question }],
            model: "gpt-3.5-turbo",
        });
        answer = completion.choices[0].message.content;
    } catch (err) { console.error(err); }
    res.render('ask_ai', { question, answer });
});

// Games Routes
app.get('/games', isAuthenticated, (req, res) => res.render('games_hub'));
app.get('/games/memory', isAuthenticated, (req, res) => res.render('memory_game'));
app.get('/games/math-sprint', isAuthenticated, (req, res) => res.render('math_sprint_game'));
app.get('/games/typing-speed', isAuthenticated, (req, res) => res.render('typing_speed_game'));


// --- Teacher Routes ---
app.get('/teacher', isTeacher, (req, res) => {
    const quizzes = readData(QUIZZES_PATH);
    const students = readData(STUDENTS_PATH);
    res.render('teacher_dashboard', { greeting: getGreeting(), quizzes, students });
});

// Teacher - Student Management
app.get('/teacher/students', isTeacher, (req, res) => {
    res.render('teacher_manage_students', { students: readData(STUDENTS_PATH) });
});
app.post('/teacher/students/add', isTeacher, (req, res) => {
    const students = readData(STUDENTS_PATH);
    const newStudent = {
        name: req.body.name,
        grade: req.body.grade,
        adventurePoints: 0 // New students start with 0 points
    };
    students.push(newStudent);
    writeData(STUDENTS_PATH, students);
    res.redirect('/teacher/students');
});

// Teacher - Quiz Management (CRUD)
app.get('/teacher/quizzes', isTeacher, (req, res) => {
    res.render('teacher_manage_quizzes', { quizzes: readData(QUIZZES_PATH) });
});

app.get('/teacher/quiz/new', isTeacher, (req, res) => {
    res.render('teacher_quiz_form', { isEditing: false, quiz: { title: '', subject: '', questions: [] } });
});

app.post('/teacher/quiz/new', isTeacher, (req, res) => {
    const quizzes = readData(QUIZZES_PATH);
    const questions = req.body.questions || []; // Ensure questions is an array

    const newQuiz = {
        id: quizzes.length > 0 ? Math.max(...quizzes.map(q => q.id)) + 1 : 1,
        title: req.body.title,
        subject: req.body.subject,
        questions: questions.map(q => ({
            question: q.question,
            options: q.options,
            answer: parseInt(q.answer, 10)
        }))
    };
    quizzes.push(newQuiz);
    writeData(QUIZZES_PATH, quizzes);
    res.redirect('/teacher/quizzes');
});

app.get('/teacher/quiz/:id/edit', isTeacher, (req, res) => {
    const quiz = readData(QUIZZES_PATH).find(q => q.id === parseInt(req.params.id));
    if (!quiz) return res.status(404).send("Quiz not found");
    res.render('teacher_quiz_form', { isEditing: true, quiz });
});

app.post('/teacher/quiz/:id/edit', isTeacher, (req, res) => {
    const quizzes = readData(QUIZZES_PATH);
    const quizIndex = quizzes.findIndex(q => q.id === parseInt(req.params.id));
    if (quizIndex === -1) return res.status(404).send("Quiz not found");

    const questions = req.body.questions || []; // Ensure questions is an array

    quizzes[quizIndex] = {
        id: parseInt(req.params.id),
        title: req.body.title,
        subject: req.body.subject,
        questions: questions.map(q => ({
            question: q.question,
            options: q.options,
            answer: parseInt(q.answer, 10)
        }))
    };
    writeData(QUIZZES_PATH, quizzes);
    res.redirect('/teacher/quizzes');
});

app.post('/teacher/quiz/:id/delete', isTeacher, (req, res) => {
    let quizzes = readData(QUIZZES_PATH);
    quizzes = quizzes.filter(q => q.id !== parseInt(req.params.id));
    writeData(QUIZZES_PATH, quizzes);
    res.redirect('/teacher/quizzes');
});


// --- Server ---
app.listen(PORT, () => console.log(`Eduventure running at http://localhost:${PORT}`));

