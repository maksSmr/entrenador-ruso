import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Repaso from '../paginas/Repaso';
import { listarRepaso } from '../servicios/api';

const mockResponder = jest.fn();
const mockReiniciar = jest.fn();

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
  reiniciarRepaso: (...args) => mockReiniciar(...args),
}));

beforeEach(() => {
  mockReiniciar.mockReset().mockResolvedValue({ reiniciadas: 2 });
});

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

  it('al acabarse las tarjetas ofrece ver las lecciones y reiniciar sin XP', async () => {
    listarRepaso.mockResolvedValueOnce([]);
    renderRepaso();

    expect(await screen.findByText(/todo al día/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ver tarjetas de mis lecciones/i })).toHaveAttribute(
      'href',
      '/curso/1',
    );

    fireEvent.click(screen.getByRole('button', { name: /reiniciar tarjetas \(sin xp\)/i }));

    await waitFor(() => expect(mockReiniciar).toHaveBeenCalledWith('1', 'token-de-prueba'));
  });

  it('una ronda reiniciada avisa de que no suma XP', async () => {
    listarRepaso.mockResolvedValueOnce([
      {
        id: 't1',
        palabra: 'мама',
        transliteracion: 'mama',
        traduccion: 'mamá',
        acento_posicion: 1,
        sin_xp: true,
      },
    ]);
    mockResponder.mockResolvedValueOnce({ caja: 2, sin_xp: true });
    renderRepaso();

    const tarjeta = await screen.findByRole('button', { name: /tarjeta: мама/i });
    fireEvent.keyDown(tarjeta, { key: 'Enter' });
    const botonSi = screen.getByRole('button', { name: 'Lo sabía: subir de caja' });
    await waitFor(() => expect(botonSi).toBeEnabled());
    fireEvent.click(botonSi);

    expect(await screen.findByText(/esta ronda no suma xp/i)).toBeInTheDocument();
  });
});
