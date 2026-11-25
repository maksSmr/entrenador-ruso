import multer from 'multer';
import { ErrorApi } from '../utilidades/errorApi.js';
import { TAMANO_MAXIMO, extensionArchivo, EXTENSIONES_PERMITIDAS } from '../utilidades/documentos.js';

// El archivo se procesa en memoria: nunca se guarda en disco ni se comparte entre maestros.
const subida = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: TAMANO_MAXIMO, files: 1 },
  fileFilter: (_req, archivo, aceptar) => {
    if (!EXTENSIONES_PERMITIDAS.includes(extensionArchivo(archivo.originalname))) {
      return aceptar(new ErrorApi(400, 'Solo se aceptan archivos .pdf o .docx', 'archivo_no_documento'));
    }
    return aceptar(null, true);
  },
});

export const subirDocumento = subida.single('archivo');
