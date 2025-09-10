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

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'sih-super-secret-key', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

// -------------------- Mock Users (With Badges) --------------------
const users = [];
const setupMockData = async () => {
    // Passwords
    const studentPass = await bcrypt.hash('student123', 10);
    const teacherPass = await bcrypt.hash('teacher123', 10);

    // Students
    users.push({id: 1, username: 'arjun', password: studentPass, role: 'student', details: { name: "Arjun Mehta", grade: 10, adventurePoints: 980, badges: ['Quiz Master'] }});
    users.push({id: 2, username: 'riya', password: studentPass, role: 'student', details: { name: "Riya Sharma", grade: 9, adventurePoints: 950, badges: [] }});
    users.push({id: 3, username: 'karan', password: studentPass, role: 'student', details: { name: "Karan Patel", grade: 10, adventurePoints: 940, badges: [] }});
    users.push({id: 4, username: 'simran', password: studentPass, role: 'student', details: { name: "Simran Kaur", grade: 8, adventurePoints: 910, badges: [] }});
    users.push({id: 5, username: 'aman', password: studentPass, role: 'student', details: { name: "Aman Gupta", grade: 11, adventurePoints: 890, badges: ['Top Scorer'] }});
    users.push({id: 6, username: 'neha', password: studentPass, role: 'student', details: { name: "Neha Verma", grade: 9, adventurePoints: 870, badges: [] }});
    users.push({id: 7, username: 'sahil', password: studentPass, role: 'student', details: { name: "Sahil Khan", grade: 10, adventurePoints: 850, badges: [] }});
    users.push({id: 8, username: 'ananya', password: studentPass, role: 'student', details: { name: "Ananya Joshi", grade: 8, adventurePoints: 820, badges: [] }});

    // Teacher
    users.push({
        id: 9, username: 'mr.singh', password: teacherPass, role: 'teacher',
        details: { name: "Mr. Singh", subject: "Science" }
    });
};
setupMockData();

// -------------------- Data Loading Functions --------------------
const loadQuizzes = () => JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'quizzes.json')));
const saveQuizzes = (data) => fs.writeFileSync(path.join(__dirname, 'data', 'quizzes.json'), JSON.stringify(data, null, 2));

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

// -------------------- Translations & Language Middleware --------------------
const translations = {
    en: {
        eduventure: "Eduventure", login: "Login", username: "Username", password: "Password", dashboard: "Dashboard", quizzes: "Quizzes",
        leaderboard: "Leaderboard", aiTutor: "AI Tutor", games: "Games", myProfile: "My Profile", logout: "Logout",
        manageStudents: "Manage Students", manageQuizzes: "Manage Quizzes", addStudent: "Add Student", addNewStudent: "Add New Student",
        name: "Name", grade: "Grade", changeToOdia: "ଓଡ଼ିଆକୁ ବଦଳାନ୍ତୁ", goodMorning: "Good Morning", goodAfternoon: "Good Afternoon",
        goodEvening: "Good Evening", welcomeMessage: "Welcome to Eduventure – your gamified learning platform", yourSubjects: "Your Subjects",
        adventurePoints: "Adventure Points", totalPoints: "Total Points", takeAQuiz: "Take a Quiz", needHelp: "Need Help?",
        askAITutor: "Ask Sikshya Sahayak (AI Tutor)", gamesHub: "Games Hub", gamesDescription: "Choose a game to play and earn adventure points!",
        memoryGame: "Memory Game", memoryGameDesc: "Match the pairs of cards. A fun test for your memory!", mathSprint: "Math Sprint",
        mathSprintDesc: "Solve as many math problems as you can before time runs out!", typingSpeedTest: "Typing Speed Test",
        typingSpeedTestDesc: "Test and improve your typing speed and accuracy.", playNow: "Play Now", availableQuizzes: "Available Quizzes",
        subject: "Subject", takeQuiz: "Take Quiz", askAIQuestion: "Ask Sikshya Sahayak a question...", question: "Question",
        answer: "Answer", ask: "Ask", student: "Student", school: "School", score: "Score", quizTitle: "Quiz Title", quizResult: "Quiz Results",
        yourScore: "Your Score", answerReview: "Answer Review", yourAnswer: "Your Answer:", correctAnswer: "Correct Answer:",
        tryAgain: "Try Again", submit: "Submit", teacherDashboard: "Teacher Dashboard", hello: "Hello", statistics: "Statistics",
        totalStudents: "Total Students", totalQuizzes: "Total Quizzes", recentActivity: "Recent Activity",
        noRecentActivity: "No recent activity to show.", addNewQuiz: "Add New Quiz", actions: "Actions", edit: "Edit",
        delete: "Delete", createQuiz: "Create Quiz", editQuiz: "Edit Quiz", title: "Title", questions: "Questions",
        correctAnswerLabel: "Correct Answer (0-3)", addQuestion: "Add Question", saveChanges: "Save Changes", create: "Create",
        questionTextPlaceholder: "Enter question text", option1Placeholder: "Option 1", option2Placeholder: "Option 2",
        option3Placeholder: "Option 3", option4Placeholder: "Option 4",
        correctAnswerLabelJS: "Correct Answer Index (0 for Option 1, 1 for Option 2, etc.)",
        badges: "Badges", noBadges: "No badges earned yet."
    },
    od: {
        eduventure: "ଏଡୁଭେଞ୍ଚର", login: "ଲଗଇନ୍", username: "ବ୍ୟବହାରକାରୀ ନାମ", password: "ପାସୱାର୍ଡ", dashboard: "ଡ୍ୟାଶବୋର୍ଡ",
        quizzes: "କ୍ୱିଜ୍", leaderboard: "ଲିଡରବୋର୍ଡ", aiTutor: "AI ଶିକ୍ଷକ", games: "ଖେଳ", myProfile: "ମୋର ପ୍ରୋଫାଇଲ୍",
        logout: "ଲଗଆଉଟ୍", manageStudents: "ଛାତ୍ର ପରିଚାଳନା", manageQuizzes: "କ୍ୱିଜ୍ ପରିଚାଳନା", addStudent: "ଛାତ୍ର ଯୋଗ କରନ୍ତୁ",
        addNewStudent: "ନୂଆ ଛାତ୍ର ଯୋଗ କରନ୍ତୁ", name: "ନାମ", grade: "ଶ୍ରେଣୀ", changeToOdia: "Switch to English",
        goodMorning: "ସୁପ୍ରଭାତ", goodAfternoon: "ଶୁଭ ଅପରାହ୍ନ", goodEvening: "ଶୁଭ ସନ୍ଧ୍ୟା",
        welcomeMessage: "ଏଡୁଭେଞ୍ଚରକୁ ସ୍ୱାଗତ – ଆପଣଙ୍କ ଗେମିଫାଏଡ୍ ଶିକ୍ଷଣ ପ୍ଲାଟଫର୍ମ", yourSubjects: "ଆପଣଙ୍କ ବିଷୟଗୁଡ଼ିକ",
        adventurePoints: "ସାହସିକ ପଏଣ୍ଟ", totalPoints: "ମୋଟ ପଏଣ୍ଟ", takeAQuiz: "ଏକ କ୍ୱିଜ୍ ଦିଅନ୍ତୁ", needHelp: "ସାହାଯ୍ୟ ଦରକାର କି?",
        askAITutor: "ଶିକ୍ଷା ସହାୟକ (AI ଶିକ୍ଷକ)ଙ୍କୁ ପଚାରନ୍ତୁ", gamesHub: "ଖେଳ ହବ୍",
        gamesDescription: "ଖେଳିବାକୁ ଏକ ଖେଳ ବାଛନ୍ତୁ ଏବଂ ସାହସିକ ପଏଣ୍ଟ ଅର୍ଜନ କରନ୍ତୁ!", memoryGame: "ମେମୋରୀ ଗେମ୍",
        memoryGameDesc: "କାର୍ଡଗୁଡ଼ିକର ଯୋଡ଼ି ମିଶାନ୍ତୁ। ଆପଣଙ୍କ ସ୍ମୃତି ପାଇଁ ଏକ ମଜାଦାର ପରୀକ୍ଷା!", mathSprint: "ଗଣିତ ସ୍ପ୍ରିଣ୍ଟ",
        mathSprintDesc: "ସମୟ ସରିବା ପୂର୍ବରୁ ଯେତେ ସମ୍ଭବ ଗଣିତ ସମସ୍ୟାର ସମାଧାନ କରନ୍ତୁ!", typingSpeedTest: "ଟାଇପିଂ ସ୍ପିଡ୍ ଟେଷ୍ଟ",
        typingSpeedTestDesc: "ଆପଣଙ୍କ ଟାଇପିଂ ଗତି ଏବଂ ସଠିକତା ପରୀକ୍ଷା କରନ୍ତୁ ଏବଂ ଉନ୍ନତ କରନ୍ତୁ।", playNow: "ବର୍ତ୍ତମାନ ଖେଳନ୍ତୁ",
        availableQuizzes: "ଉପଲବ୍ଧ କ୍ୱିଜ୍", subject: "ବିଷୟ", takeQuiz: "କ୍ୱିଜ୍ ଦିଅନ୍ତୁ",
        askAIQuestion: "ଶିକ୍ଷା ସହାୟକଙ୍କୁ ଏକ ପ୍ରଶ୍ନ ପଚାରନ୍ତୁ...", question: "ପ୍ରଶ୍ନ", answer: "ଉତ୍ତର", ask: "ପଚାରନ୍ତୁ",
        student: "ଛାତ୍ର", school: "ବିଦ୍ୟାଳୟ", score: "ସ୍କୋର", quizTitle: "କ୍ୱିଜ୍ ଶୀର୍ଷକ", quizResult: "କ୍ୱିଜ୍ ଫଳାଫଳ",
        yourScore: "ଆପଣଙ୍କ ସ୍କୋର", answerReview: "ଉତ୍ତର ସମୀକ୍ଷା", yourAnswer: "ଆପଣଙ୍କ ଉତ୍ତର:", correctAnswer: "ସଠିକ୍ ଉତ୍ତର:",
        tryAgain: "ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ", submit: "ଦାଖଲ କରନ୍ତୁ", teacherDashboard: "ଶିକ୍ଷକ ଡ୍ୟାଶବୋର୍ଡ", hello: "ନମସ୍କାର",
        statistics: "ପରିସଂଖ୍ୟାନ", totalStudents: "ମୋଟ ଛାତ୍ର", totalQuizzes: "ମୋଟ କ୍ୱିଜ୍", recentActivity: "ସାମ୍ପ୍ରତିକ କାର୍ଯ୍ୟକଳାପ",
        noRecentActivity: "କୌଣସି ସାମ୍ପ୍ରତିକ କାର୍ଯ୍ୟକଳାପ ନାହିଁ।", addNewQuiz: "ନୂଆ କ୍ୱିଜ୍ ଯୋଗ କରନ୍ତୁ", actions: "କାର୍ଯ୍ୟ",
        edit: "ସମ୍ପାଦନ କରନ୍ତୁ", delete: "ଡିଲିଟ୍ କରନ୍ତୁ", createQuiz: "କ୍ୱିଜ୍ ତିଆରି କରନ୍ତୁ", editQuiz: "କ୍ୱିଜ୍ ସମ୍ପାଦନ କରନ୍ତୁ",
        title: "ଶୀର୍ଷକ", questions: "ପ୍ରଶ୍ନଗୁଡ଼ିକ", correctAnswerLabel: "ସଠିକ୍ ଉତ୍ତର (0-3)", addQuestion: "ପ୍ରଶ୍ନ ଯୋଗ କରନ୍ତୁ",
        saveChanges: "ପରିବର୍ତ୍ତନଗୁଡ଼ିକୁ ସଂରକ୍ଷଣ କରନ୍ତୁ", create: "ତିଆରି କରନ୍ତୁ", questionTextPlaceholder: "ପ୍ରଶ୍ନ ଟେକ୍ସଟ୍ ପ୍ରବେଶ କରନ୍ତୁ",
        option1Placeholder: "ବିକଳ୍ପ 1", option2Placeholder: "ବିକଳ୍ପ 2", option3Placeholder: "ବିକଳ୍ପ 3", option4Placeholder: "ବିକଳ୍ପ 4",
        correctAnswerLabelJS: "ସଠିକ୍ ଉତ୍ତର ସୂଚକାଙ୍କ (ବିକଳ୍ପ 1 ପାଇଁ 0, ବିକଳ୍ପ 2 ପାଇଁ 1, ଇତ୍ୟାଦି)",
        badges: "ବ୍ୟାଜ୍", noBadges: "ଏପର୍ଯ୍ୟନ୍ତ କୌଣସି ବ୍ୟାଜ୍ ଅର୍ଜନ କରାଯାଇ ନାହିଁ।"
    }
};
app.use((req, res, next) => {
    req.session.lang = req.session.lang || 'en';
    const baseLang = translations[req.session.lang];
    const fallbackLang = translations['en'];
    res.locals.t = { ...fallbackLang, ...baseLang };
    res.locals.currentLang = req.session.lang;
    res.locals.user = req.user;
    res.locals.currentPath = req.path;
    next();
});

const getGreeting = (t) => {
    const hour = new Date().getHours();
    if (hour < 12) return t.goodMorning;
    if (hour < 18) return t.goodAfternoon;
    return t.goodEvening;
};

// Routes
app.get('/toggle-lang', (req, res) => {
    req.session.lang = req.session.lang === 'en' ? 'od' : 'en';
    res.redirect('back');
});
app.get('/', (req, res) => res.redirect('/login'));
app.get('/login', (req, res) => res.render('login'));
app.post('/login', passport.authenticate('local', { failureRedirect: '/login' }), (req, res) => {
    if (req.user.role === 'teacher') return res.redirect('/teacher');
    res.redirect('/student');
});
app.get('/logout', (req, res) => { req.logout(() => res.redirect('/login')); });

// Student Routes
app.get('/student', isAuthenticated, (req, res) => {
    const subjects = [
        { id: 'math', name: "Mathematics", icon: '➗', progress: 65 }, { id: 'phy', name: "Physics", icon: '⚛️', progress: 40 },
        { id: 'chem', name: "Chemistry", icon: '🧪', progress: 80 }, { id: 'bio', name: "Biology", icon: '🌱', progress: 55 }
    ];
    res.render('student_dashboard', { greeting: getGreeting(res.locals.t), subjects });
});

app.get('/profile', isAuthenticated, (req, res) => res.render('profile'));

app.get('/ask-ai', isAuthenticated, (req, res) => res.render('ask_ai', { question: null, answer: null }));

app.post('/ask-ai', isAuthenticated, async (req, res) => {
    const { question } = req.body;
    let answer = "";
    try {
        const completion = await openai.chat.completions.create({
            messages: [{ role: "system", content: "You are a helpful school tutor." }, { role: "user", content: question }],
            model: "gpt-3.5-turbo",
        });
        answer = completion.choices[0].message.content;
    } catch (err) {
        console.error(err);
        answer = "Sorry, I couldn't reach the AI server. Try again later.";
    }
    res.render('ask_ai', { question, answer });
});

app.get('/quizzes', isAuthenticated, (req, res) => {
    const quizzes = loadQuizzes();
    res.render('quizzes', { quizzes });
});

app.get('/quiz/:id', isAuthenticated, (req, res) => {
    const quizzes = loadQuizzes();
    const quiz = quizzes.find(q => q.id === parseInt(req.params.id));
    if (!quiz) return res.status(404).send("Quiz not found");
    res.render('quiz_detail', { quiz });
});

app.post('/quiz/:id/submit', isAuthenticated, (req, res) => {
    const quizzes = loadQuizzes();
    const quiz = quizzes.find(q => q.id === parseInt(req.params.id));
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
    res.render('quiz_result', { quiz, score, results });
});

app.get('/games', isAuthenticated, (req, res) => res.render('games_hub'));
app.get('/games/memory', isAuthenticated, (req, res) => res.render('memory_game'));
app.get('/games/math-sprint', isAuthenticated, (req, res) => res.render('math_sprint_game'));
app.get('/games/typing-speed', isAuthenticated, (req, res) => res.render('typing_speed_game'));

app.get('/leaderboard', isAuthenticated, (req, res) => {
    const students = users.filter(u => u.role === 'student').sort((a, b) => b.details.adventurePoints - a.details.adventurePoints);
    res.render('leaderboard', { students });
});

// Teacher Routes
app.get('/teacher', isAuthenticated, (req, res) => {
    const students = users.filter(u => u.role === 'student');
    const quizzes = loadQuizzes();
    res.render('teacher_dashboard', { students, quizzes, greeting: getGreeting(res.locals.t) });
});

app.get('/teacher/students', isAuthenticated, (req, res) => {
    const students = users.filter(u => u.role === 'student');
    res.render('teacher_manage_students', { students });
});

app.post('/teacher/students/add', isAuthenticated, async (req, res) => {
    const { name, grade, username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newStudent = {
        id: users.length + 1,
        username,
        password: hashedPassword,
        role: 'student',
        details: {
            name,
            grade: parseInt(grade),
            adventurePoints: 0,
            badges: [],
            profilePic: `https://placehold.co/128x128/818cf8/ffffff?text=${name.charAt(0)}`
        }
    };
    users.push(newStudent);
    res.redirect('/teacher/students');
});

app.get('/teacher/quizzes', isAuthenticated, (req, res) => {
    const quizzes = loadQuizzes();
    res.render('teacher_manage_quizzes', { quizzes });
});

app.get('/teacher/quiz/new', isAuthenticated, (req, res) => {
    res.render('teacher_quiz_form', {
        quiz: null,
        action: '/teacher/quiz/new',
        submitText: res.locals.t.create
    });
});

app.post('/teacher/quiz/new', isAuthenticated, (req, res) => {
    const quizzes = loadQuizzes();
    const newQuiz = {
        id: quizzes.length > 0 ? Math.max(...quizzes.map(q => q.id)) + 1 : 1,
        title: req.body.title,
        subject: req.body.subject,
        questions: req.body.questions || []
    };
    quizzes.push(newQuiz);
    saveQuizzes(quizzes);
    res.redirect('/teacher/quizzes');
});

app.get('/teacher/quiz/edit/:id', isAuthenticated, (req, res) => {
    const quizzes = loadQuizzes();
    const quiz = quizzes.find(q => q.id === parseInt(req.params.id));
    if (!quiz) return res.status(404).send("Quiz not found");
    res.render('teacher_quiz_form', {
        quiz,
        action: `/teacher/quiz/edit/${quiz.id}`,
        submitText: res.locals.t.saveChanges
    });
});

app.post('/teacher/quiz/edit/:id', isAuthenticated, (req, res) => {
    const quizzes = loadQuizzes();
    const quizIndex = quizzes.findIndex(q => q.id === parseInt(req.params.id));
    if (quizIndex === -1) return res.status(404).send("Quiz not found");

    quizzes[quizIndex] = {
        id: parseInt(req.params.id),
        title: req.body.title,
        subject: req.body.subject,
        questions: req.body.questions || []
    };
    saveQuizzes(quizzes);
    res.redirect('/teacher/quizzes');
});

app.post('/teacher/quiz/delete/:id', isAuthenticated, (req, res) => {
    let quizzes = loadQuizzes();
    quizzes = quizzes.filter(q => q.id !== parseInt(req.params.id));
    saveQuizzes(quizzes);
    res.redirect('/teacher/quizzes');
});

app.listen(PORT, () => console.log(`Eduventure running at http://localhost:${PORT}`));

