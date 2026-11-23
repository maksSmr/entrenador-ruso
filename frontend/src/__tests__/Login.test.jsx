import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Login from '../paginas/Login';

const mockLogin = jest.fn();

jest.mock('../hooks/useAutenticacion', () => ({
  useAutenticacion: () => ({ login: mockLogin, usuario: null, token: null }),
}));

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>,
  );
}

describe('Formulario de login', () => {
  it('muestra un error si los campos están vacíos y no llama a la API', async () => {
    const usuario = userEvent.setup();
    renderLogin();

    await usuario.click(screen.getByRole('button', { name: /entrar/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Escribe tu correo y tu contraseña');
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('muestra el error del servidor cuando las credenciales son incorrectas', async () => {
    const usuario = userEvent.setup();
    const error = new Error('Credenciales inválidas');
    error.codigo = 'credenciales_invalidas';
    mockLogin.mockRejectedValueOnce(error);
    renderLogin();

    await usuario.type(screen.getByLabelText(/correo electrónico/i), 'maestro@ejemplo.com');
    await usuario.type(screen.getByLabelText(/contraseña/i), 'incorrecta');
    await usuario.click(screen.getByRole('button', { name: /entrar/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos');
    expect(mockLogin).toHaveBeenCalledWith('maestro@ejemplo.com', 'incorrecta');
  });

  it('ofrece reenviar el correo si la cuenta no está verificada', async () => {
    const usuario = userEvent.setup();
    const error = new Error('Correo no verificado');
    error.codigo = 'correo_no_verificado';
    mockLogin.mockRejectedValueOnce(error);
    renderLogin();

    await usuario.type(screen.getByLabelText(/correo electrónico/i), 'alumno@ejemplo.com');
    await usuario.type(screen.getByLabelText(/contraseña/i), 'password123');
    await usuario.click(screen.getByRole('button', { name: /entrar/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('todavía no está verificado');
    expect(screen.getByRole('button', { name: /reenviar correo/i })).toBeInTheDocument();
  });
});
