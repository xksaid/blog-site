import pkg from 'pg';
const { Pool } = pkg;


export const pool = new Pool({
user: 'postgres', // твой пользователь
password: '1234', // твой пароль
host: 'localhost',
port: 5432,
database: 'blog_site'
});