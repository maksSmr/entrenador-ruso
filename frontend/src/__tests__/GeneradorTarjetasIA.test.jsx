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

const sugerencia = (palabra) => ({
  palabra,
  transliteracion: `${palabra}-trans`,
  traduccion: `traducción de ${palabra}`,
  ejemplo_ruso: '',
  ejemplo_traduccion: '',
  nota_gramatical: '',
  acento_posicion: null,
});

async function generarDesde(usuario, sugerencias) {
  mockGenerar.mockResolvedValue({ caracteres_procesados: 2100, sugerencias });
  renderGenerador();
  await usuario.upload(screen.getByLabelText(/documento/i), new File(['libro'], 'leccion.pdf'));
  await usuario.click(screen.getByRole('button', { name: /generar sugerencias/i }));
  await screen.findByDisplayValue(sugerencias[0].palabra);
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

  it('guarda las tarjetas de una en una, sin peticiones en paralelo', async () => {
    const usuario = userEvent.setup();
    let resolverPrimera;
    mockCrear
      .mockImplementationOnce(() => new Promise((resolver) => { resolverPrimera = resolver; }))
      .mockResolvedValueOnce({ id: 2 });
    await generarDesde(usuario, [sugerencia('привет'), sugerencia('мир')]);

    await usuario.click(screen.getByRole('button', { name: /guardar tarjetas revisadas/i }));

    await waitFor(() => expect(mockCrear).toHaveBeenCalledTimes(1));
    expect(mockCrear).toHaveBeenCalledTimes(1);
    resolverPrimera({ id: 1 });

    await waitFor(() => expect(mockCrear).toHaveBeenCalledTimes(2));
    expect(mockCrear.mock.calls.map(([, datos]) => datos.palabra)).toEqual(['привет', 'мир']);
    expect(screen.getByRole('status')).toHaveTextContent('Se guardaron 2 tarjetas');
  });

  it('conserva solo las fallidas y permite reintentarlas sin duplicar las guardadas', async () => {
    const usuario = userEvent.setup();
    mockCrear
      .mockResolvedValueOnce({ id: 1 })
      .mockRejectedValueOnce(new Error('fallo temporal'))
      .mockResolvedValueOnce({ id: 3 });
    await generarDesde(usuario, [sugerencia('привет'), sugerencia('мир'), sugerencia('школа')]);

    await usuario.click(screen.getByRole('button', { name: /guardar tarjetas revisadas/i }));

    await waitFor(() => expect(mockCrear).toHaveBeenCalledTimes(3));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('fallo temporal'));
    expect(screen.queryByDisplayValue('привет')).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue('школа')).not.toBeInTheDocument();
    expect(screen.getByDisplayValue('мир')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Se guardaron 2 tarjetas');

    const botonReintentar = screen.getByRole('button', { name: /reintentar tarjetas fallidas/i });
    mockCrear.mockResolvedValue({ id: 4 });
    await usuario.click(botonReintentar);

    await waitFor(() => expect(mockCrear).toHaveBeenCalledTimes(4));
    expect(mockCrear.mock.calls[3][1].palabra).toBe('мир');
    await waitFor(() => expect(screen.queryByDisplayValue('мир')).not.toBeInTheDocument());
    expect(screen.getByRole('status')).toHaveTextContent('Se guardaron 1 tarjeta');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
