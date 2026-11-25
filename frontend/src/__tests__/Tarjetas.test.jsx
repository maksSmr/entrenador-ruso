import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Tarjetas from '../paginas/Tarjetas';

const mockListar = jest.fn();
const mockResponder = jest.fn();

jest.mock('../hooks/useAutenticacion', () => ({
  useAutenticacion: () => ({ token: 'token-de-prueba', usuario: { rol: 'alumno' } }),
}));

jest.mock('../servicios/api', () => ({
  listarTarjetas: (...argumentos) => mockListar(...argumentos),
  responderRepaso: (...argumentos) => mockResponder(...argumentos),
}));

const tarjetas = [
  {
    id: 't1',
    palabra: 'мама',
    transliteracion: 'mama',
    traduccion: 'mamá',
    acento_posicion: 1,
  },
  {
    id: 't2',
    palabra: 'папа',
    transliteracion: 'papa',
    traduccion: 'papá',
    acento_posicion: 1,
  },
];

beforeEach(() => {
  mockListar.mockReset().mockResolvedValue(tarjetas);
  mockResponder.mockReset().mockResolvedValue({ caja: 2, proxima_revision: '2026-12-01' });
});

function renderTarjetas(ruta = '/lecciones/7/tarjetas') {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path="/lecciones/:id/tarjetas" element={<Tarjetas />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('práctica de todas las tarjetas de la lección', () => {
  it('muestra todas las tarjetas y permite iniciar la práctica con un clic', async () => {
    renderTarjetas();

    expect(await screen.findByText('мама')).toBeInTheDocument();
    expect(screen.getByText('папа')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /practicar todas las tarjetas/i }));

    expect(await screen.findByRole('button', { name: /tarjeta: мама/i })).toBeInTheDocument();
    expect(screen.getByText(/tarjeta 1 de 2/i)).toBeInTheDocument();
  });

  it('registra aciertos y fallos y muestra el resumen al terminar', async () => {
    renderTarjetas('/lecciones/7/tarjetas?practica=1');

    const primera = await screen.findByRole('button', { name: /tarjeta: мама/i });
    fireEvent.keyDown(primera, { key: 'Enter' });
    const botonSi = screen.getByRole('button', { name: 'Lo sabía: subir de caja' });
    await waitFor(() => expect(botonSi).toBeEnabled());
    fireEvent.click(botonSi);

    await waitFor(() =>
      expect(mockResponder).toHaveBeenCalledWith({ tarjeta_id: 't1', acerto: true }, 'token-de-prueba'),
    );

    const segunda = await screen.findByRole('button', { name: /tarjeta: папа/i });
    fireEvent.keyDown(segunda, { key: 'Enter' });
    const botonNo = screen.getByRole('button', { name: 'No lo sabía: volver a la caja 1' });
    await waitFor(() => expect(botonNo).toBeEnabled());
    fireEvent.click(botonNo);

    await waitFor(() =>
      expect(mockResponder).toHaveBeenCalledWith({ tarjeta_id: 't2', acerto: false }, 'token-de-prueba'),
    );
    expect(await screen.findByText(/práctica completada/i)).toBeInTheDocument();
    expect(screen.getByText(/acertaste 1 de 2 tarjetas\. fallaste 1/i)).toBeInTheDocument();
  });

  it('muestra el XP ganado al acertar una tarjeta', async () => {
    mockResponder.mockResolvedValue({ caja: 2, xp_ganado: 10 });

    renderTarjetas('/lecciones/7/tarjetas?practica=1');

    const primera = await screen.findByRole('button', { name: /tarjeta: мама/i });
    fireEvent.keyDown(primera, { key: 'Enter' });
    const botonSi = screen.getByRole('button', { name: 'Lo sabía: subir de caja' });
    await waitFor(() => expect(botonSi).toBeEnabled());
    fireEvent.click(botonSi);

    expect(await screen.findByText(/\+10 XP/)).toBeInTheDocument();
  });
});
