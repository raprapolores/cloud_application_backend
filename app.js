// app.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Sequelize, DataTypes } = require('sequelize');
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Setup Database Connection
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: 'mysql',
});

// Test Database Connection
sequelize.authenticate()
  .then(() => console.log('Database connected...'))
  .catch((err) => console.error('Error connecting to the database:', err));

// Define Models
const User = sequelize.define('User', {
  username: { type: DataTypes.STRING, allowNull: false, unique: true },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('admin', 'user'), allowNull: false }
});

const Exam = sequelize.define('Exam', {
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT }
});

const SavedExam = sequelize.define('SavedExam', {
  user_id: { type: DataTypes.INTEGER, references: { model: User, key: 'id' }},
  exam_id: { type: DataTypes.INTEGER, references: { model: Exam, key: 'id' }}
});

// Sync Database
sequelize.sync().then(() => console.log('Database tables created...')).catch((err) => console.log(err));

// Middleware for JWT Authentication
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.sendStatus(403);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Routes

// Register Route
app.post('/api/register', async (req, res) => {
  const { username, email, password, role } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const newUser = await User.create({ username, email, password: hashedPassword, role });
    res.json(newUser);
  } catch (err) {
    res.status(400).json({ error: 'Username or Email already exists' });
  }
});

// Login Route
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email } });
  if (user && await bcrypt.compare(password, user.password)) {
    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET);
    res.json({ token });
  } else {
    res.status(400).json({ error: 'Invalid credentials' });
  }
});

// Admin Routes for CRUD Exams
app.post('/api/exams', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
  const { title, description } = req.body;
  const exam = await Exam.create({ title, description });
  res.json(exam);
});

app.get('/api/exams', authenticateToken, async (req, res) => {
  const exams = await Exam.findAll();
  res.json(exams);
});

app.put('/api/exams/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
  const { id } = req.params;
  const { title, description } = req.body;
  const exam = await Exam.findByPk(id);
  if (exam) {
    exam.title = title;
    exam.description = description;
    await exam.save();
    res.json(exam);
  } else {
    res.status(404).json({ message: 'Exam not found' });
  }
});

app.delete('/api/exams/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
  const { id } = req.params;
  const exam = await Exam.findByPk(id);
  if (exam) {
    await exam.destroy();
    res.json({ message: 'Exam deleted successfully' });
  } else {
    res.status(404).json({ message: 'Exam not found' });
  }
});

// Save Exam Results for Users
app.post('/api/save-exam', authenticateToken, async (req, res) => {
  const { examId } = req.body;
  const savedExam = await SavedExam.create({
    user_id: req.user.userId,
    exam_id: examId
  });
  res.json(savedExam);
});

// Get Saved Exams for User
app.get('/api/saved-exams', authenticateToken, async (req, res) => {
  const savedExams = await SavedExam.findAll({
    where: { user_id: req.user.userId },
    include: { model: Exam }
  });
  res.json(savedExams);
});

// Port Listener
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
