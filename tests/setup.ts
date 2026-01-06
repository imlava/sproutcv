import { beforeAll, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';

const server = setupServer(
  rest.post('/api/pdf-extract', (req, res, ctx) => {
    return res(ctx.status(500), ctx.json({ error: 'Failed to extract text from PDF.' }));
  }),
  rest.post('/api/analyze', (req, res, ctx) => {
    return res(ctx.status(500), ctx.json({ error: 'Failed to analyze with AI.' }));
  }),
  rest.get('/api/payment-status', (req, res, ctx) => {
    return res(ctx.status(404), ctx.json({ error: 'Status check error.' }));
  })
);

beforeAll(() => server.listen());
afterAll(() => server.close());