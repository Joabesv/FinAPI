import express, { RequestHandler } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const port = 3333;

app.use(express.json());


export interface Customers {
  cpf: number | string,
  id?: string,
  name: string;
  statement: Statement[]
}

interface Statement {
  type: string
  amount: number;
  created_at: Date;
}

const customers: Customers[] = [];

/*
 * cpf - string
 * name - string
 * id - uuid
 * statement - []
 */

// Middleware
const verifyIfExistsAccountCPF: RequestHandler = (req, res, next) => {
  const { cpf } = req.headers;

  const customer = customers.find(customer => customer.cpf === cpf);

  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }

  req.customer = customer;

  return next();
}

function getBalance(statement: Statement[]) {
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

  return res.json(customer.statement);
});

// Deposito
app.post('/deposit', verifyIfExistsAccountCPF, (req, res) => {
  const { description, amount } = req.body;

  const { customer } = req;

  const statementOperation = {
    description,
    amount,
    created_at: new Date(),
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
    created_at: new Date(),
    type: 'debit',
  };

  customer.statement.push(statementOperation);

  return res.status(201).send();
});

// extrato da conta baseado na data inserida
app.get('/statement/date', verifyIfExistsAccountCPF, (req, res) => {
  const { customer } = req;
  const { date } = req.query;

  const dateFormat = new Date(`${date} 00:00`);

  const statement = customer.statement.filter(
    (statement: Statement) =>
      statement.created_at.toDateString() ===
      new Date(dateFormat).toDateString()
  );

  return res.json(statement);
});

// Editando dados da conta do user
app.put('/account', verifyIfExistsAccountCPF, (req, res) => {
  const { name } = req.body;
  const { customer } = req;

  customer.name = name;

  return res.status(204).send();
});

// Mostra os dados da conta
app.get('/account', verifyIfExistsAccountCPF, (req, res) => {
  const { customer } = req;

  return res.json(customer);
});

// Deletar a conta
app.delete('/account', verifyIfExistsAccountCPF, (req, res) => {
  const { customer } = req;
  const tests: any = customers?.findIndex(obj => obj.cpf === customer.cpf)
  customers.splice(tests, 1);
  return res.status(200).json(customers);
});

app.get('/balance', verifyIfExistsAccountCPF, (req, res) => {
  const { customer } = req;

  const balance = getBalance(customer.statement);

  return res.json(balance);
});

app.listen(port, () => {
  console.log(`FinAPI started at http://localhost:${port}!`);
});
export const finApi = app;