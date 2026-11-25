import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CursoAlumno from '../paginas/CursoAlumno';

const mockListarMisCursos = jest.fn();
const mockListarLecciones = jest.fn();
const mockObtenerCurso = jest.fn();

jest.mock('../hooks/useAutenticacion', () => ({
  useAutenticacion: () => ({ token: 'token-de-prueba', usuario: { rol: 'alumno' } }),
}));

jest.mock('../servicios/api', () => ({
  listarMisCursos: (...argumentos) => mockListarMisCursos(...argumentos),
  listarLecciones: (...argumentos) => mockListarLecciones(...argumentos),
  obtenerCurso: (...argumentos) => mockObtenerCurso(...argumentos),
}));

beforeEach(() => {
  mockListarMisCursos.mockReset().mockResolvedValue([{ id: '11', nombre: 'Ruso A1', idioma: 'Ruso' }]);
  mockListarLecciones.mockReset().mockResolvedValue([
    { id: '31', titulo: 'Los saludos', descripcion: ' practise', fecha_asignada: null },
  ]);
  mockObtenerCurso.mockReset();
});

function renderCurso() {
  return render(
    <MemoryRouter initialEntries={['/curso/11']}>
      <Routes>
        <Route path="/curso/:id" element={<CursoAlumno />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('curso del alumno', () => {
  it('usa mis-cursos y nunca la ruta de maestro', async () => {
    renderCurso();

    expect(await screen.findByRole('heading', { name: 'Ruso A1' })).toBeInTheDocument();
    expect(await screen.findByText('Los saludos')).toBeInTheDocument();
    expect(mockListarMisCursos).toHaveBeenCalledWith('token-de-prueba');
    expect(mockListarLecciones).toHaveBeenCalledWith('11', 'token-de-prueba');
    await waitFor(() => expect(mockObtenerCurso).not.toHaveBeenCalled());
    expect(screen.queryByText(/se requiere el rol maestro/i)).not.toBeInTheDocument();
  });
});
