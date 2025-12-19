import pkg from 'pg';
const { Pool } = pkg;

export const pool = new Pool({
  user: 'postgres',         // как в docker-compose.yml
  password: '1234',     // как в docker-compose.yml
  host: 'localhost',        // контейнер проброшен на локалку
  port: 5432,               // порт контейнера
  database: 'blog_site'     // база из docker-compose.yml
});
