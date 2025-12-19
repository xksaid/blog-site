const API = '/api';
const token = localStorage.getItem('token');

function showNotification(text, type = 'success') {
  const n = document.getElementById('notification');
  if (!n) return;

  n.textContent = text;
  n.className = `notification ${type}`;
  n.style.display = 'block';

  setTimeout(() => {
    n.style.display = 'none';
  }, 2500);
}


// загрузка header
fetch('header.html')
.then(r => r.text())
.then(html => {
const h = document.getElementById('header');
if (!h) return;
h.innerHTML = html;


const login = document.getElementById('loginLink');
const register = document.getElementById('registerLink');
const logout = document.getElementById('logoutLink');
const userInfo = document.getElementById('userInfo');


if (token) {
const payload = JSON.parse(atob(token.split('.')[1]));
userInfo.textContent = `👤 ${payload.username || 'User'}`;
userInfo.style.display = 'inline';


login.style.display = 'none';
register.style.display = 'none';
logout.style.display = 'inline';


logout.onclick = () => {
localStorage.removeItem('token');
location.href = 'login.html';
};
}
});


async function request(url, method='GET', body) {
  const res = await fetch(API + url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: token })
    },
    body: body && JSON.stringify(body)
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Ошибка запроса');
  }

  return data;
}

function validatePasswordClient(password) {
  if (password.length < 6) {
    return 'Пароль должен быть не короче 6 символов';
  }
  if (!/\d/.test(password)) {
    return 'Пароль должен содержать хотя бы одну цифру';
  }
  return null;
}


const reg = document.getElementById('register');
if (reg) {
reg.onsubmit = async e => {
  e.preventDefault();

  const passwordError = validatePasswordClient(password.value);
  if (passwordError) {
    showNotification(passwordError, 'error');
    return;
  }

  try {
    await request('/register', 'POST', {
      username: username.value,
      password: password.value
    });

    showNotification('Регистрация прошла успешно ✅');

    setTimeout(() => {
      location.href = 'login.html';
    }, 2000);
  } catch (err) {
    showNotification(err.message, 'error');
  }
};


}


const loginForm = document.getElementById('login');
if (loginForm) {
loginForm.onsubmit = async e => {
  e.preventDefault();

  try {
    const r = await request('/login', 'POST', {
      username: username.value,
      password: password.value
    });

    localStorage.setItem('token', r.token);
    showNotification('Вход выполнен успешно ✅');

    setTimeout(() => {
      location.href = 'posts.html';
    }, 1500);
  } catch {
    showNotification('Неверный логин или пароль', 'error');
  }
};

}

async function toggleLike(postId) {
  if (!token) {
    showNotification('Войдите, чтобы ставить лайки', 'error');
    return;
  }

  await request(`/posts/${postId}/like`, 'POST');
  loadPosts();
}


async function loadPosts() {
const posts = await request('/posts');
const div = document.getElementById('posts');
if (!div) return;
div.innerHTML = '';
posts.forEach(p => {
const el = document.createElement('div');


const canDelete = token && JSON.parse(atob(token.split('.')[1])).role === 'admin';


el.innerHTML = `
<h3>${p.title}</h3>
<p>${p.content}</p>
<small>${p.username}</small>
<div>
    <button onclick="toggleLike(${p.id})">❤️ ${p.likes}</button>
  </div>
${canDelete ? `<br><button onclick="deletePost(${p.id})">Удалить</button>` : ''}
<div class="comments" id="comments-${p.id}"></div>
${token ? `
<input placeholder="Комментарий" id="comment-${p.id}">
<button onclick="addComment(${p.id})">Отправить</button>
` : ''}
`;


div.append(el);
loadComments(p.id);
});
}

async function deletePost(id) {
await request(`/posts/${id}`, 'DELETE');
loadPosts();
}


async function loadComments(postId) {
const comments = await request(`/comments/${postId}`);
const div = document.getElementById(`comments-${postId}`);
div.innerHTML = '';
comments.forEach(c => {
const el = document.createElement('div');
el.innerHTML = `<small><b>${c.username}</b>: ${c.content}</small>`;
div.append(el);
});
}


async function addComment(postId) {
const input = document.getElementById(`comment-${postId}`);
await request(`/comments/${postId}`, 'POST', { content: input.value });
input.value = '';
loadComments(postId);
}


async function addPost() {
await request('/posts', 'POST', { title: title.value, content: content.value });
title.value = content.value = '';
loadPosts();
}


loadPosts();