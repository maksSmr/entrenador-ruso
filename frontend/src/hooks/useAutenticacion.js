import { useContext } from 'react';
import { AutenticacionContexto } from '../contexto/AutenticacionContexto';

export function useAutenticacion() {
  const contexto = useContext(AutenticacionContexto);
  if (!contexto) {
    throw new Error('useAutenticacion debe usarse dentro de ProveedorAutenticacion');
  }
  return contexto;
}

export default useAutenticacion;
