import { Link } from 'react-router-dom';
import DocumentoTitulo from '../atomos/DocumentoTitulo';
import FormularioLogin from '../organismos/FormularioLogin';

export default function Login() {
  return (
    <>
      <DocumentoTitulo
        titulo="Iniciar sesión · Entrenador de ruso"
        descripcion="Entra en tu cuenta de maestro o alumno para continuar con tus clases de ruso."
      />
      <section className="seccion seccion--estrecha">
        <p className="eyebrow">Bienvenido de nuevo</p>
        <h1>Inicia sesión</h1>
        <p className="texto-suave">Continúa con tus cursos, tarjetas y repaso diario.</p>
        <div className="tarjeta formulario-contenedor">
          <FormularioLogin />
        </div>
        <p className="texto-centro texto-pequeno">
          ¿Aún no tienes cuenta? <Link to="/registro-maestro">Regístrate como maestro</Link> o{' '}
          <Link to="/registro-alumno">como alumno</Link>.
        </p>
      </section>
    </>
  );
}
