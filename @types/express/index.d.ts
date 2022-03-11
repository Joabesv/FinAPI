import { Customers } from "../../src/main";

declare global{
  namespace Express {
      interface Request {
          customer: Customers
      }
  }
}
