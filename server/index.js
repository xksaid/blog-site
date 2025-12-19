import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import { pool } from './db.js';


const app = express();
const SECRET = 'SECRET_KEY';


app.use(cors());
app.use(express.json());
app.use(express.static('../public'));

function auth(req, res, next) {
const token = req.headers.authorization;
if (!token) return res.sendStatus(401);
try {
req.user = jwt.verify(token, SECRET);
next();
} catch {
res.sendStatus(403);
}
}

function validatePassword(password) {
  if (password.length < 6) {
    return 'Пароль должен быть не короче 6 символов';
  }
  if (!/\d/.test(password)) {
    return 'Пароль должен содержать хотя бы одну цифру';
  }
  return null;
}


app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;

  const passwordError = validatePassword(password);
  if (passwordError) {
    return res.status(400).json({ message: passwordError });
  }

  const exists = await pool.query(
    'SELECT 1 FROM users WHERE username = $1',
    [username]
  );

  if (exists.rows.length > 0) {
    return res.status(409).json({
      message: 'Пользователь с таким именем уже существует'
    });
  }

  const hash = await bcrypt.hash(password, 10);

  await pool.query(
    'INSERT INTO users (username, password) VALUES ($1,$2)',
    [username, hash]
  );

  res.status(201).json({ message: 'User registered' });
});


app.post('/api/posts/:id/like', auth, async (req, res) => {
  const postId = req.params.id;

  const exists = await pool.query(
    'SELECT 1 FROM likes WHERE user_id=$1 AND post_id=$2',
    [req.user.id, postId]
  );

  if (exists.rows.length > 0) {
    // убираем лайк
    await pool.query(
      'DELETE FROM likes WHERE user_id=$1 AND post_id=$2',
      [req.user.id, postId]
    );
    return res.json({ liked: false });
  }

  // ставим лайк
  await pool.query(
    'INSERT INTO likes (user_id, post_id) VALUES ($1,$2)',
    [req.user.id, postId]
  );

  res.json({ liked: true });
});



app.post('/api/login', async (req, res) => {
const { rows } = await pool.query('SELECT * FROM users WHERE username=$1', [req.body.username]);
if (!rows[0]) return res.sendStatus(401);
const ok = await bcrypt.compare(req.body.password, rows[0].password);
if (!ok) return res.sendStatus(401);
const token = jwt.sign({ id: rows[0].id, username: rows[0].username, role: rows[0].role }, SECRET);
res.json({ token });
});


app.get('/api/posts', async (req, res) => {
const { rows } = await pool.query(
`SELECT 
  posts.*,
  users.username,
  COUNT(likes.post_id) AS likes
FROM posts
JOIN users ON users.id = posts.user_id
LEFT JOIN likes ON likes.post_id = posts.id
GROUP BY posts.id, users.username
ORDER BY posts.created_at DESC`
);
res.json(rows);
});


app.get('/api/comments/:postId', async (req, res) => {
const { rows } = await pool.query(
`SELECT comments.*, users.username
FROM comments JOIN users ON users.id = comments.user_id
WHERE post_id=$1 ORDER BY created_at`,
[req.params.postId]
);
res.json(rows);
});

app.post('/api/posts', auth, async (req, res) => {
await pool.query(
'INSERT INTO posts (user_id, title, content) VALUES ($1,$2,$3)',
[req.user.id, req.body.title, req.body.content]
);
res.sendStatus(201);
});

app.delete('/api/posts/:id', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.sendStatus(403);
  }

  await pool.query(
    'DELETE FROM posts WHERE id=$1',
    [req.params.id]
  );

  res.sendStatus(200);
});



app.post('/api/comments/:postId', auth, async (req, res) => {
await pool.query(
'INSERT INTO comments (post_id, user_id, content) VALUES ($1,$2,$3)',
[req.params.postId, req.user.id, req.body.content]
);
res.sendStatus(201);
});

app.listen(3000);