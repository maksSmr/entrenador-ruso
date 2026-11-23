import multer from 'multer';
import { ErrorApi } from '../utilidades/errorApi.js';

// 1 MB en memoria: suficiente para 500 filas de vocabulario.
const subida = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024, files: 1 },
  fileFilter: (_req, archivo, aceptar) => {
    const esCsv = archivo.mimetype === 'text/csv'
      || archivo.mimetype === 'application/vnd.ms-excel'
      || archivo.originalname.toLowerCase().endsWith('.csv');
    if (!esCsv) return aceptar(new ErrorApi(400, 'Solo se acepta un archivo .csv', 'archivo_no_csv'));
    return aceptar(null, true);
  },
});

export const subirCsv = subida.single('archivo');
