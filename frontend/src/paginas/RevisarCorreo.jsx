import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import DocumentoTitulo from '../atomos/DocumentoTitulo';
import Boton from '../atomos/Boton';
import Campo from '../atomos/Campo';
import ReenvioVerificacion from '../organismos/ReenvioVerificacion';

/** Pantalla a la que llega el usuario justo después de crear su cuenta. */
export default function RevisarCorreo() {
  const [parametros] = useSearchParams();
  const [email, setEmail] = useState(parametros.get('email') || '');
  const [correo, setCorreo] = useState(parametros.get('email') || '');

  return (
    <>
      <DocumentoTitulo
        titulo="Revisa tu correo · Entrenador de ruso"
        descripcion="Activa tu cuenta abriendo el enlace que te hemos enviado por correo."
      />
      <section className="seccion seccion--estrecha">
        <p className="eyebrow">Último paso</p>
        <h1>Revisa tu correo</h1>
        <div className="tarjeta" role="status" aria-live="polite">
          {correo ? (
            <>
              <h2>Te enviamos un enlace</h2>
              <p>
                Ábrelo en <strong>{correo}</strong> para activar tu cuenta. Revisa también la carpeta de spam
                si no te aparece.
              </p>
              <p className="texto-suave texto-pequeno">
                Cuando confirmes el enlace, te llevaremos automáticamente a iniciar sesión.
              </p>
              <ReenvioVerificacion email={correo} />
              <div className="fila-acciones">
                <Link className="enlace-boton" to="/login">
                  Ya verifiqué mi correo: iniciar sesión
                </Link>
                <Link className="enlace-sutil" to="/verificar-correo">
                  Solicitar otro enlace
                </Link>
              </div>
            </>
          ) : (
            <>
              <h2>Escribe tu correo</h2>
              <p>No traemos una dirección en el enlace. Escríbela y te enviaremos uno nuevo.</p>
              <form
                className="formulario"
                onSubmit={(evento) => {
                  evento.preventDefault();
                  if (email.trim()) setCorreo(email.trim());
                }}
              >
                <Campo
                  id="revisar-correo-email"
                  etiqueta="Correo electrónico"
                  tipo="email"
                  valor={email}
                  onChange={setEmail}
                  autoComplete="email"
                  requerido
                />
                <Boton type="submit">Continuar</Boton>
              </form>
            </>
          )}
        </div>
      </section>
    </>
  );
}
