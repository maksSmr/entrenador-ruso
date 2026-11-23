import { describe, test, expect, jest, beforeEach } from '@jest/globals';

process.env.DATABASE_URL = 'postgresql://prueba:prueba@localhost:5432/prueba';
process.env.JWT_SECRET = 'secreto-de-prueba-largo';

const query = jest.fn();
const release = jest.fn();
const connect = jest.fn(() => ({ query, release }));
jest.unstable_mockModule('../src/config/baseDatos.js', () => ({
  pool: { query, connect, end: jest.fn() },
}));

const { procesarEvento } = await import('../src/servicios/stripe.servicio.js');

beforeEach(() => {
  query.mockReset();
  release.mockReset();
  connect.mockClear();
});

const eventoPago = {
  id: 'evt_123',
  type: 'checkout.session.completed',
  data: { object: { customer: 'cus_ABC', metadata: { maestro_id: '1' } } },
};

describe('webhook de Stripe', () => {
  test('activa el plan pro una sola vez', async () => {
    query
      .mockResolvedValueOnce({ rows: [] }) // BEGIN
      .mockResolvedValueOnce({ rowCount: 1 }) // insert evento
      .mockResolvedValueOnce({ rowCount: 1 }) // update suscripción
      .mockResolvedValueOnce({ rows: [] }); // COMMIT

    const resultado = await procesarEvento(eventoPago);

    expect(resultado).toEqual({ procesado: true });
    expect(query.mock.calls[2][1]).toEqual([1, 'cus_ABC']);
    expect(release).toHaveBeenCalled();
  });

  test('un evento repetido no vuelve a aplicar el cambio', async () => {
    query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rowCount: 0 }) // ya estaba insertado
      .mockResolvedValueOnce({ rows: [] });

    const resultado = await procesarEvento(eventoPago);

    expect(resultado).toEqual({ procesado: false, motivo: 'duplicado' });
    expect(query).toHaveBeenCalledTimes(3);
  });

  test('cancelar la suscripción devuelve al maestro al plan gratis', async () => {
    query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rowCount: 1 })
      .mockResolvedValueOnce({ rowCount: 1 })
      .mockResolvedValueOnce({ rows: [] });

    await procesarEvento({
      id: 'evt_456',
      type: 'customer.subscription.deleted',
      data: { object: { customer: 'cus_ABC' } },
    });

    expect(query.mock.calls[2][1]).toEqual(['cus_ABC']);
    expect(query.mock.calls[2][0]).toContain("plan = 'gratis'");
  });
});
