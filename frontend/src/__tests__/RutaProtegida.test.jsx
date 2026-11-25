import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import RutaProtegida from '../rutas/RutaProtegida';

const mockEstado = { token: null, usuario: null, cargando: false };

jest.mock('../hooks/useAutenticacion', () => ({
  useAutenticacion: () => mockEstado,
}));

function renderarRuta() {
  return render(
    <MemoryRouter initialEntries={['/privado']}>
      <Routes>
        <Route path="/login" element={<p>Pantalla de login</p>} />
        <Route
          path="/privado"
          element={
            <RutaProtegida>
              <p>Contenido privado</p>
            </RutaProtegida>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  mockEstado.token = null;
  mockEstado.usuario = null;
  mockEstado.cargando = false;
});

describe('RutaProtegida', () => {
  it('redirige a /login cuando no hay token', () => {
    mockEstado.token = null;
    renderarRuta();

    expect(screen.getByText('Pantalla de login')).toBeInTheDocument();
    expect(screen.queryByText('Contenido privado')).not.toBeInTheDocument();
  });

  it('muestra el contenido cuando hay sesión iniciada', () => {
    mockEstado.token = 'token-de-prueba';
    renderarRuta();

    expect(screen.getByText('Contenido privado')).toBeInTheDocument();
    expect(screen.queryByText('Pantalla de login')).not.toBeInTheDocument();
  });

  it('no bloquea el acceso aunque el usuario traiga email_verificado en falso', () => {
    mockEstado.token = 'token-de-prueba';
    mockEstado.usuario = { rol: 'alumno', email_verificado: false };
    renderarRuta();

    expect(screen.getByText('Contenido privado')).toBeInTheDocument();
    expect(screen.queryByText(/verifica tu correo/i)).not.toBeInTheDocument();
  });

  it('redirige al panel correcto si el rol no coincide', () => {
    mockEstado.token = 'token-de-prueba';
    mockEstado.usuario = { rol: 'alumno' };
    render(
      <MemoryRouter initialEntries={['/privado']}>
        <Routes>
          <Route path="/panel-alumno" element={<p>Panel del alumno</p>} />
          <Route
            path="/privado"
            element={
              <RutaProtegida rol="maestro">
                <p>Solo maestros</p>
              </RutaProtegida>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Panel del alumno')).toBeInTheDocument();
    mockEstado.usuario = null;
  });
});
