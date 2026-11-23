import { Link } from 'react-router-dom';
import DocumentoTitulo from '../atomos/DocumentoTitulo';

export default function PagoExitoso() {
  return (
    <>
      <DocumentoTitulo
        titulo="Pago completado · Entrenador de ruso"
        descripcion="Tu suscripción se ha actualizado correctamente."
      />
      <section className="seccion seccion--estrecha estado">
        <h1>🎉 ¡Pago completado!</h1>
        <p className="texto-suave">Tu plan ya está activo. Puedes volver a tu panel para seguir trabajando.</p>
        <div className="fila-acciones">
          <Link className="boton boton--primario" to="/maestro">
            Ir al panel del maestro
          </Link>
          <Link className="enlace-boton" to="/maestro/plan">
            Ver mi plan
          </Link>
        </div>
      </section>
    </>
  );
}
