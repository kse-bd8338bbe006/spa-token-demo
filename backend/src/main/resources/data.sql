-- Seed demo notes (only inserted if table is empty)
INSERT INTO notes (id, username, title, content, created_at)
SELECT gen_random_uuid(), 'demo-user', 'Welcome Note',
       'This is a sample note created by the system.', now()
WHERE NOT EXISTS (SELECT 1 FROM notes LIMIT 1);

INSERT INTO notes (id, username, title, content, created_at)
SELECT gen_random_uuid(), 'demo-user', 'API Security Tip',
       'Always validate JWTs on the server side. Never trust the client.', now()
WHERE NOT EXISTS (SELECT 1 FROM notes WHERE username = 'demo-user' AND title = 'API Security Tip');
