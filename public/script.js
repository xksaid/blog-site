const API = '/api';
const token = localStorage.getItem('token');


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
return res.json();
}


const reg = document.getElementById('register');
if (reg) {
reg.onsubmit = async e => {
e.preventDefault();
await request('/register', 'POST', { username: username.value, password: password.value });
location.href = 'login.html';
};
}

const loginForm = document.getElementById('login');
if (loginForm) {
loginForm.onsubmit = async e => {
e.preventDefault();
const r = await request('/login', 'POST', { username: username.value, password: password.value });
localStorage.setItem('token', r.token);
location.href = 'posts.html';
};
}


async function loadPosts() {
const posts = await request('/posts');
const div = document.getElementById('posts');
if (!div) return;
div.innerHTML = '';
posts.forEach(p => {
const el = document.createElement('div');
el.innerHTML = `<h3>${p.title}</h3><p>${p.content}</p><small>${p.username}</small>`;
div.append(el);
});
}

async function addPost() {
await request('/posts', 'POST', { title: title.value, content: content.value });
title.value = content.value = '';
loadPosts();
}


loadPosts();