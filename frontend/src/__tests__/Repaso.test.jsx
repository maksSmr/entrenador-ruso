import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Repaso from '../paginas/Repaso';

const mockResponder = jest.fn();

jest.mock('../hooks/useAutenticacion', () => ({
  useAutenticacion: () => ({ token: 'token-de-prueba', usuario: { rol: 'alumno' } }),
}));

jest.mock('../servicios/api', () => ({
  listarRepaso: jest.fn(() =>
    Promise.resolve([
      {
        id: 't1',
        palabra: 'мама',
        transliteracion: 'mama',
        traduccion: 'mamá',
        acento_posicion: 1,
      },
    ]),
  ),
  listarMisCursos: jest.fn(() => Promise.resolve([{ id: '1', nombre: 'Ruso A1', idioma: 'Ruso' }])),
  responderRepaso: (...args) => mockResponder(...args),
}));

function renderRepaso() {
  return render(
    <MemoryRouter initialEntries={['/repaso/1']}>
      <Routes>
        <Route path="/repaso/:cursoId" element={<Repaso />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('Tarjeta de repaso', () => {
  it('se voltea con el teclado y envía la respuesta a la API', async () => {
    mockResponder.mockResolvedValueOnce({ caja: 2, proxima_revision: '2026-12-01' });
    renderRepaso();

    const tarjeta = await screen.findByRole('button', { name: /tarjeta: мама/i });
    expect(screen.queryByText('mamá')).not.toBeInTheDocument();

    fireEvent.keyDown(tarjeta, { key: 'Enter' });
    expect(await screen.findByText('mamá')).toBeInTheDocument();

    const botonSi = screen.getByRole('button', { name: 'Lo sabía: subir de caja' });
    await waitFor(() => expect(botonSi).toBeEnabled());
    fireEvent.click(botonSi);

    await waitFor(() =>
      expect(mockResponder).toHaveBeenCalledWith(
        { tarjeta_id: 't1', acerto: true },
        'token-de-prueba',
      ),
    );
    expect(await screen.findByText(/repaso completado/i)).toBeInTheDocument();
  });

  it('también se voltea con Espacio', async () => {
    renderRepaso();
    const tarjeta = await screen.findByRole('button', { name: /tarjeta: мама/i });
    fireEvent.keyDown(tarjeta, { key: ' ' });
    expect(await screen.findByText('mamá')).toBeInTheDocument();
  });
});
