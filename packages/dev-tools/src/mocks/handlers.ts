import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/user/balance', () => {
    return HttpResponse.json({ data: { balance: 100 } });
  }),
];
