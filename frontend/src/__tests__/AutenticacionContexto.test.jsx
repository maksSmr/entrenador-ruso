import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProveedorAutenticacion } from '../contexto/AutenticacionContexto';
import { useAutenticacion } from '../hooks/useAutenticacion';

const mockRegistrarAlumno = jest.fn();
const mockRegistrarMaestro = jest.fn();

jest.mock('../servicios/api', () => ({
  registrarAlumno: (...argumentos) => mockRegistrarAlumno(...argumentos),
  registrarMaestro: (...argumentos) => mockRegistrarMaestro(...argumentos),
  yo: jest.fn(),
  login: jest.fn(),
}));

function Consumidor() {
  const { registrar, token, usuario } = useAutenticacion();

  return (
    <div>
      <span data-testid="token">{token || 'sin-token'}</span>
      <span data-testid="rol">{usuario?.rol || 'sin-usuario'}</span>
      <button
        type="button"
        onClick={() => registrar(
          { nombre: 'Lucía', email: 'lucia@ejemplo.es', contrasena: '12345678', codigo_invitacion: 'RUSO123' },
          'alumno',
        )}
      >
        Registrar alumno
      </button>
    </div>
  );
}

beforeEach(() => {
  localStorage.clear();
  mockRegistrarAlumno.mockReset().mockResolvedValue({
    token: 'jwt-del-alta',
    usuario: { id: 3, rol: 'alumno', email: 'lucia@ejemplo.es', email_verificado: true },
  });
  mockRegistrarMaestro.mockReset();
});

describe('ProveedorAutenticacion', () => {
  it('guarda el JWT y el usuario que devuelve el registro', async () => {
    const usuario = userEvent.setup();
    render(
      <ProveedorAutenticacion>
        <Consumidor />
      </ProveedorAutenticacion>,
    );

    await usuario.click(screen.getByRole('button', { name: /registrar alumno/i }));

    expect(await screen.findByTestId('token')).toHaveTextContent('jwt-del-alta');
    expect(screen.getByTestId('rol')).toHaveTextContent('alumno');
    expect(localStorage.getItem('token')).toBe('jwt-del-alta');
    expect(mockRegistrarAlumno).toHaveBeenCalledTimes(1);
  });
});
