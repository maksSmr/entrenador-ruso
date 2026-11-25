import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AccesoEstudioAlumno from '../organismos/AccesoEstudioAlumno';
import Encabezado from '../organismos/Encabezado';
import Estudiar from '../paginas/Estudiar';

const mockListar = jest.fn();

jest.mock('../hooks/useAutenticacion', () => ({
  useAutenticacion: () => ({
    token: 'token-de-prueba',
    usuario: { rol: 'alumno', nombre: 'Lucía' },
    autenticado: true,
    cerrarSesion: jest.fn(),
  }),
}));

jest.mock('../servicios/api', () => ({
  listarMisCursos: (...argumentos) => mockListar(...argumentos),
}));

beforeEach(() => {
  mockListar.mockReset().mockResolvedValue([
    { id: '11', nombre: 'Ruso A1', idioma: 'Ruso' },
    { id: '12', nombre: 'Ruso A2', idioma: 'Ruso', pendientes: 3 },
  ]);
});

function renderConRouter(componente) {
  return render(<MemoryRouter>{componente}</MemoryRouter>);
}

describe('entrada de estudio del alumno', () => {
  it('muestra enlaces reales para abrir cada curso y repasar', async () => {
    renderConRouter(<Estudiar />);

    expect(await screen.findByRole('heading', { name: /ruso a1/i })).toBeInTheDocument();
    const abrir = await screen.findAllByRole('link', { name: /abrir curso/i });
    expect(abrir).toHaveLength(2);
    expect(abrir[0]).toHaveAttribute('href', '/curso/11');
    expect(screen.getAllByRole('link', { name: /repasar hoy/i })[0]).toHaveAttribute('href', '/repaso/11');
  });

  it('invita a unirse con un código cuando no hay cursos', async () => {
    mockListar.mockResolvedValue([]);
    renderConRouter(<Estudiar />);

    expect(await screen.findByText(/todavía no estás en ningún curso/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /unirme con un código/i })).toHaveAttribute(
      'href',
      '/registro-alumno',
    );
  });

  it('ofrece Estudiar en el menú del alumno', () => {
    renderConRouter(<Encabezado />);

    expect(screen.getByRole('link', { name: 'Estudiar' })).toHaveAttribute('href', '/estudiar');
    expect(screen.getByRole('link', { name: 'Mi panel' })).toHaveAttribute('href', '/panel-alumno');
  });

  it('añade un acceso al estudio desde el panel', () => {
    renderConRouter(<AccesoEstudioAlumno />);

    expect(screen.getByRole('link', { name: /ir a mis cursos/i })).toHaveAttribute('href', '/estudiar');
  });
});
