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

app.get('/statement', (req, res) => {
  const { cpf } = req.headers;

  const customer = customers.find(customer => customer.cpf === cpf);

  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }

  return res.json(customer.statement);
});

app.listen(port, () => {
  console.log(`FinAPI started at http://localhost:${port}!`);
});
