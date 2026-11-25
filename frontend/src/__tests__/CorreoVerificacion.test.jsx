import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import FormularioRegistro from '../organismos/FormularioRegistro';
import VerificarCorreo from '../paginas/VerificarCorreo';
import Login from '../paginas/Login';

const mockRegistrar = jest.fn();
const mockVerificar = jest.fn();
const mockLogin = jest.fn();

jest.mock('../hooks/useAutenticacion', () => ({
  useAutenticacion: () => ({
    registrar: (...argumentos) => mockRegistrar(...argumentos),
    login: (...argumentos) => mockLogin(...argumentos),
  }),
}));

jest.mock('../servicios/api', () => ({
  verificarCorreo: (...argumentos) => mockVerificar(...argumentos),
}));

beforeEach(() => {
  mockRegistrar.mockReset().mockImplementation((datos, tipo) => Promise.resolve({
    token: 'jwt-de-prueba',
    usuario: { id: 1, email: datos.email, rol: tipo, email_verificado: true },
  }));
  mockVerificar.mockReset().mockResolvedValue({});
  mockLogin.mockReset();
});

async function completarRegistro(usuario, tipo = 'maestro') {
  await usuario.type(screen.getByLabelText(/nombre completo/i), 'Nueva Alumna');
  await usuario.type(screen.getByLabelText(/correo electrónico/i), 'nueva@ejemplo.es');
  await usuario.type(screen.getByLabelText(/contraseña/i), '12345678');
  if (tipo === 'alumno') {
    await usuario.type(screen.getByLabelText(/código de invitación/i), 'RUSO123');
  }
  await usuario.click(
    screen.getByRole('button', { name: new RegExp(`crear cuenta de ${tipo}`, 'i') }),
  );
}

function renderRegistro(tipo) {
  return render(
    <MemoryRouter initialEntries={[`/registro-${tipo}`]}>
      <Routes>
        <Route path={`/registro-${tipo}`} element={<FormularioRegistro tipo={tipo} />} />
        <Route path="/panel-maestro" element={<p>Panel del maestro</p>} />
        <Route path="/panel-alumno" element={<p>Panel del alumno</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('registro directo sin verificación de correo', () => {
  it('lleva al maestro a su panel justo después de registrarse', async () => {
    const usuario = userEvent.setup();
    renderRegistro('maestro');

    await completarRegistro(usuario, 'maestro');

    expect(await screen.findByText('Panel del maestro')).toBeInTheDocument();
    expect(mockRegistrar).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'nueva@ejemplo.es' }),
      'maestro',
    );
  });

  it('lleva al alumno a su panel sin pasar por revisar correo', async () => {
    const usuario = userEvent.setup();
    renderRegistro('alumno');

    await completarRegistro(usuario, 'alumno');

    expect(await screen.findByText('Panel del alumno')).toBeInTheDocument();
    expect(mockRegistrar).toHaveBeenCalledWith(
      expect.objectContaining({ codigo_invitacion: 'RUSO123' }),
      'alumno',
    );
  });

  it('si el enlace antiguo se verifica, sigue llevando al login', async () => {
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
