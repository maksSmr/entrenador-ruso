import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GeneradorTarjetasIA from '../organismos/GeneradorTarjetasIA';

const mockGenerar = jest.fn();
const mockCrear = jest.fn();
const mockGuardadas = jest.fn();

jest.mock('../servicios/api', () => ({
  generarTarjetasIA: (...argumentos) => mockGenerar(...argumentos),
  crearTarjeta: (...argumentos) => mockCrear(...argumentos),
}));

beforeEach(() => {
  mockGenerar.mockReset();
  mockCrear.mockReset();
  mockGuardadas.mockReset();
});

function renderGenerador() {
  return render(
    <GeneradorTarjetasIA leccionId={7} token="token-de-prueba" onGuardadas={mockGuardadas} />,
  );
}

describe('generador de tarjetas con IA', () => {
  it('muestra las sugerencias y las guarda solo tras revisión', async () => {
    const usuario = userEvent.setup();
    mockGenerar.mockResolvedValue({
      caracteres_procesados: 2100,
      sugerencias: [{
        palabra: 'привет',
        transliteracion: 'privet',
        traduccion: 'hola',
        ejemplo_ruso: 'Привет, Анна!',
        ejemplo_traduccion: '¡Hola, Ana!',
        nota_gramatical: 'Saludo informal',
        acento_posicion: 2,
      }],
    });
    mockCrear.mockResolvedValue({ id: 1 });
    mockGuardadas.mockResolvedValue();
    renderGenerador();

    const archivo = new File(['contenido del libro'], 'leccion.pdf', { type: 'application/pdf' });
    await usuario.upload(screen.getByLabelText(/documento/i), archivo);
    await usuario.click(screen.getByRole('button', { name: /generar sugerencias/i }));

    expect(await screen.findByDisplayValue('привет')).toBeInTheDocument();
    expect(mockGenerar).toHaveBeenCalledWith(7, archivo, 'token-de-prueba');

    const campoTraduccion = screen.getByDisplayValue('hola');
    await usuario.clear(campoTraduccion);
    await usuario.type(campoTraduccion, 'saludo');
    await usuario.click(screen.getByRole('button', { name: /guardar tarjetas revisadas/i }));

    await waitFor(() => expect(mockCrear).toHaveBeenCalledTimes(1));
    expect(mockCrear).toHaveBeenCalledWith(7, expect.objectContaining({
      palabra: 'привет',
      traduccion: 'saludo',
      nota_gramatical: 'Saludo informal',
    }), 'token-de-prueba');
    expect(mockGuardadas).toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent('Se guardaron 1 tarjeta');
  });

  it('rechaza un archivo que no sea PDF ni DOCX antes de llamar a la API', async () => {
    const usuario = userEvent.setup();
    renderGenerador();

    fireEvent.change(screen.getByLabelText(/documento/i), {
      target: { files: [new File(['texto'], 'apunte.txt')] },
    });
    expect(await screen.findByRole('alert')).toHaveTextContent('Solo se aceptan archivos .pdf o .docx');
    expect(screen.getByRole('button', { name: /generar sugerencias/i })).toBeDisabled();
    expect(mockGenerar).not.toHaveBeenCalled();
  });
});
