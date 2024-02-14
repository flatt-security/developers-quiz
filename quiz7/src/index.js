const app = require('fastify')();
const { randomBytes } = require('crypto');
const { readFileSync } = require('fs');

const FLAG = process.env.FLAG || 'Flatt{DUMMY}';
const FIVE_THOUSAND_CHOU_YEN = 5000000000000000;
const users = {};

app.post('/register', (req) => {
  const id = randomBytes(10).toString('hex') + '-' + req.body.username;
  return users[id] = { id, balance: 10 };
});

app.get('/user/:userId', (req, res) => {
  const user = users[req.params.userId];
  if (!user) return res.code(404).send({ error: 'User not found' });
  if (user.balance > FIVE_THOUSAND_CHOU_YEN) user.secret = FLAG;
  return user;
});

app.post('/transfer', (req, res) => {
  const { fromID, toID } = req.body;
  if (fromID.length < 21 || toID.length < 21)
    return res.code(400).send({ error: 'Invalid request' });

  const from = users[fromID];
  const to = users[toID];
  const amount = parseInt(req.body.amount);
  if (!(from && to && 0 < amount && amount <= from.balance))
    return res.code(400).send({ error: 'Invalid request' });

  to.balance += amount;
  const toName = toID.split('-')[1];
  from.balance -= amount;
  const fromName = fromID.split('-')[1];

  return {
    receipt: `${fromName} -> ${toName} (${amount})`
  };
});

app.get('/', (_, res) => {
  res.type('text/html').send(readFileSync('index.html'));
});

app.listen({ port: 3000, host: '0.0.0.0' })
