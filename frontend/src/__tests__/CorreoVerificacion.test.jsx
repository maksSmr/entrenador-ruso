import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import FormularioRegistro from '../organismos/FormularioRegistro';
import RevisarCorreo from '../paginas/RevisarCorreo';
import VerificarCorreo from '../paginas/VerificarCorreo';
import Login from '../paginas/Login';

const mockRegistrar = jest.fn();
const mockVerificar = jest.fn();
const mockReenviar = jest.fn();

jest.mock('../hooks/useAutenticacion', () => ({
  useAutenticacion: () => ({ registrar: (...argumentos) => mockRegistrar(...argumentos), login: jest.fn() }),
}));

jest.mock('../servicios/api', () => ({
  reenviarVerificacion: (...argumentos) => mockReenviar(...argumentos),
  verificarCorreo: (...argumentos) => mockVerificar(...argumentos),
}));

beforeEach(() => {
  mockRegistrar.mockReset().mockResolvedValue({ usuario: { email: 'nueva@ejemplo.es' } });
  mockVerificar.mockReset().mockResolvedValue({});
  mockReenviar.mockReset().mockResolvedValue({});
});

function Ubicacion() {
  const ubicacion = useLocation();
  return <span data-testid="ruta">{ubicacion.pathname + ubicacion.search}</span>;
}

async function completarRegistro(usuario) {
  await usuario.type(screen.getByLabelText(/nombre completo/i), 'Nueva Alumna');
  await usuario.type(screen.getByLabelText(/correo electrónico/i), 'nueva@ejemplo.es');
  await usuario.type(screen.getByLabelText(/contraseña/i), '12345678');
  await usuario.click(screen.getByRole('button', { name: /crear cuenta de maestro/i }));
}

describe('flujo de verificación de correo', () => {
  it('después de registrarse lleva a la página de revisar correo', async () => {
    const usuario = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/registro-maestro']}>
        <Routes>
          <Route path="/registro-maestro" element={<FormularioRegistro tipo="maestro" />} />
          <Route
            path="/revisar-correo"
            element={
              <>
                <Ubicacion />
                <RevisarCorreo />
              </>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    await completarRegistro(usuario);

    expect(await screen.findByRole('heading', { name: 'Revisa tu correo' })).toBeInTheDocument();
    expect(screen.getByTestId('ruta')).toHaveTextContent(
      '/revisar-correo?email=nueva%40ejemplo.es',
    );
    expect(screen.getByText(/nueva@ejemplo\.es/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ya verifiqué mi correo/i })).toHaveAttribute('href', '/login');
  });

  it('al verificar el enlace muestra el éxito y va al login automáticamente', async () => {
    render(
      <MemoryRouter initialEntries={['/verificar-correo?token=abc123']}>
        <Routes>
          <Route path="/verificar-correo" element={<VerificarCorreo />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText(/correo verificado/i)).toBeInTheDocument();
    expect(mockVerificar).toHaveBeenCalledWith('abc123');

    expect(
      await screen.findByRole('heading', { name: /inicia sesión/i }, { timeout: 5000 }),
    ).toBeInTheDocument();
    expect(screen.getByText(/correo verificado\. ya puedes entrar/i)).toBeInTheDocument();
  });
});
