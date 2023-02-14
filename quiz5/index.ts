import * as fs from 'fs';
import fastify from 'fastify';
import fastifyCookie from '@fastify/cookie';
import {fastifySession} from '@fastify/session';

type Role = 'admin' | 'engineer' | 'sales';
type UserId = string;
type SessionId = string;
interface User {
  name: string
  role: Role
  id: UserId
  boss: UserId | null
};
interface UserInput {
  name: string
  role: 'engineer' | 'sales'
};

// Instantiate server
const app = fastify({logger: true});
app.register(fastifyCookie);
app.register(fastifySession, {
  secret: require('crypto').randomBytes(256).toString('base64'),
  cookie: {secure: false},
});

const admin: User = {
  name: 'admin',
  role: 'admin',
  id: 'admin',
  boss: null,
};
const users = new Map<UserId, User>([[admin.id, admin]]); // List of users associated with their ID
const sessions = new Map<SessionId, UserId>(); // List of sessions associated with session ID
const pendingApprovals = new Map<UserId, User>(); // List of users waiting for approval to change their profile

// Get user from session store, or create a new user if it doesn't exist.
const getOrInitUser = (sessionId: string): User => {
  if (!sessions.has(sessionId)) {
    const userId = Math.random().toString(32);
    users.set(userId, {
      name: userId,
      role: 'engineer',
      boss: admin.id,
      id: userId,
    });
    sessions.set(sessionId, userId);
  }

  return users.get(sessions.get(sessionId)!)!;
};

// Serve index page.
app.get('/', async (_, reply) => {
  const html = await fs.promises.readFile('./index.html', 'utf-8');
  reply.type('text/html').send(html);
});

// Serve admin page.
app.get('/admin', async (request, reply) => {
  const user = getOrInitUser(request.session.sessionId);
  const html = await fs.promises.readFile(user.role === 'admin' ? 'flag.html' : 'forbidden.html', 'utf-8');
  const status = user.role === 'admin' ? 200 : 403;
  reply.type('text/html').status(status).send(html);
});

// Get profile of the current user.
app.get('/api/profile', async (request, reply) => {
  const user = getOrInitUser(request.session.sessionId);
  reply.type('application/json').send(user);
});

// Change user profile.
// NOTE: Changing role requires approval from their boss.
app.post('/api/profile', async (request, reply) => {
  const user = getOrInitUser(request.session.sessionId);
  const input = request.body as UserInput;
  let waitingApproval = false;
  if (input.role && input.role !== user.role) { // need approval
    waitingApproval = true;
    pendingApprovals.set(user.id, {
      ...user,
      ...input,
      id: user.id,
    });
  }
  users.set(user.id, {
    ...user,
    ...input,
    id: user.id,
    role: user.role,
  });
  reply.status(200).type('application/json').send({
    waitingApproval,
  });
});

// Approve a request to change user profile
// NOTE: Only the boss of the requester can approve the change.
app.post('/api/approve/:userId', async (request, reply) => {
  const me = getOrInitUser(request.session.sessionId);
  const userId = (request.params as any).userId as string;
  const pendingApproval = pendingApprovals.get(userId);
  if (pendingApproval && pendingApproval.boss === me.id) {
    pendingApprovals.delete(userId);
    users.set(pendingApproval.id, pendingApproval);
    reply.status(200).send();
  } else {
    reply.status(204).send();
  }
});

app.listen({
  host: '0.0.0.0',
  port: 49495,
});