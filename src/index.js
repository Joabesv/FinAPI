import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const port = 3333;

app.use(express.json());

const customers = [];

/*
 * cpf - string
 * name - string
 * id - uuid
 * statement - []
 */

// Middleware
function verifyIfExistsAccountCPF(req, res, next) {
  const { cpf } = req.headers;

  const customer = customers.find(customer => customer.cpf === cpf);

  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }

  req.customer = customer;

  return next();
}

function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
    if (operation.type === 'credit') {
      return acc + operation.amount;
    }
    return acc - operation.amount;
  }, 0);

  return balance;
}

// Criar a conta e verificar se já existe
app.post('/account', (req, res) => {
  const { cpf, name } = req.body;

  const customerAlreadyExists = customers.some(
    customer => customer.cpf === cpf
  );

  if (customerAlreadyExists) {
    return res.status(400).json({ error: 'Customer already exists' });
  }

  customers.push({
    cpf,
    name,
    id: uuidv4(),
    statement: [],
  });

  return res.status(201).send();
});

// extrato da conta
app.get('/statement', verifyIfExistsAccountCPF, (req, res) => {
  const { customer } = req;
  res.json(customer.statement);
});

// Deposito
app.post('/deposit', verifyIfExistsAccountCPF, (req, res) => {
  const { description, amount } = req.body;

  const { customer } = req;

  const statementOperation = {
    description,
    amount,
    created_at: new Date().toLocaleString('pt-BR'),
    type: 'credit',
  };

  customer.statement.push(statementOperation);

  return res.status(201).send();
});

// Saque
app.post('/withdraw', verifyIfExistsAccountCPF, (req, res) => {
  const { amount } = req.body;
  const { customer } = req;

  const balance = getBalance(customer.statement);

  if (balance < amount) {
    return res.status(400).json({ error: 'Insufficient funds!' });
  }

  const statementOperation = {
    amount,
    created_at: new Date().toLocaleString('pt-BR'),
    type: 'debit',
  };

  customer.statement.push(statementOperation);

  return res.status(201).send();
});

app.listen(port, () => {
  console.log(`FinAPI started at http://localhost:${port}!`);
});
