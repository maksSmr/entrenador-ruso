import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Quiz from '../paginas/Quiz';

const mockResultado = jest.fn();

jest.mock('../hooks/useAutenticacion', () => ({
  useAutenticacion: () => ({ token: 'token-de-prueba', usuario: { rol: 'alumno' } }),
}));

jest.mock('../servicios/api', () => ({
  obtenerQuiz: jest.fn(() =>
    Promise.resolve([
      {
        tipo: 'significado',
        tarjeta_id: 't1',
        enunciado: '¿Qué significa «мама»?',
        pista: 'Familia',
        opciones: ['mamá', 'libro', 'agua'],
        respuesta_correcta: 'mamá',
      },
    ]),
  ),
  enviarResultadoQuiz: (...args) => mockResultado(...args),
}));

function renderQuiz() {
  return render(
    <MemoryRouter initialEntries={['/quiz/7']}>
      <Routes>
        <Route path="/quiz/:leccionId" element={<Quiz />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('Pregunta de quiz', () => {
  it('muestra retroalimentación inmediata con la respuesta correcta y el XP final', async () => {
    const usuario = userEvent.setup();
    mockResultado.mockResolvedValueOnce({ xp_ganado: 10, xp_total: 110, racha: 3, nivel: 2 });
    renderQuiz();

    expect(await screen.findByText('¿Qué significa «мама»?')).toBeInTheDocument();

    await usuario.click(screen.getByRole('button', { name: /libro/i }));
    expect(await screen.findByText(/la respuesta correcta es: mamá/i)).toBeInTheDocument();
    expect(screen.getByText(/incorrecto/i)).toBeInTheDocument();

    await usuario.click(screen.getByRole('button', { name: /ver resultado/i }));
    await waitFor(() => expect(mockResultado).toHaveBeenCalled());
    expect(await screen.findByText(/xp ganados: 10/i)).toBeInTheDocument();
  });

  it('reconoce la respuesta correcta', async () => {
    const usuario = userEvent.setup();
    mockResultado.mockResolvedValueOnce({ xp_ganado: 20, nivel: 2 });
    renderQuiz();

    await usuario.click(await screen.findByRole('button', { name: /mamá/i }));
    expect(await screen.findByText(/¡correcto!/i)).toBeInTheDocument();
  });
});
