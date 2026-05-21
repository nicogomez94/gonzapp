import { Link } from 'react-router-dom';

const TERMS_SECTIONS = [
  {
    id: 'objeto',
    title: '1. Objeto del sitio',
    paragraphs: [
      'AutoZona es una plataforma web destinada a la exhibición y publicación de clasificados de vehículos para la compraventa entre particulares y/o concesionarios.',
      'También permite la promoción, asesoramiento e intermediación de servicios de gestoría automotor, como trámites registrales, transferencias e informes de dominio. Estos servicios requieren aceptación previa y tienen honorarios no incluidos en los planes presentados en el sitio.',
      'El área de gestoría puede aceptar o no la realización de un trámite según la documentación que oportunamente se presente del vehículo.',
    ],
  },
  {
    id: 'capacidad',
    title: '2. Capacidad para contratar',
    paragraphs: [
      'El uso del sitio está reservado únicamente para personas que tengan capacidad legal para contratar, mayores de 18 años en la República Argentina.',
      'Los actos que los menores realicen en el sitio serán responsabilidad de sus padres, tutores o encargados.',
    ],
  },
  {
    id: 'publicaciones',
    title: '3. Publicación de vehículos',
    paragraphs: [
      'Los usuarios que publiquen vehículos en la sección de clasificados se comprometen a que toda la información provista, como marca, modelo, año, kilometraje, estado legal, precio y fotografías, sea real, exacta y actualizada.',
      'AutoZona no es propietaria de los vehículos publicados por los usuarios ni participa en las negociaciones de compraventa. Por lo tanto, no se responsabiliza por la veracidad de los anuncios ni por los vicios redhibitorios o defectos que pudieran presentar los vehículos.',
      'Queda terminantemente prohibido publicar vehículos de procedencia ilícita, sin la documentación correspondiente o que infrinjan derechos de terceros. AutoZona se reserva el derecho de dar de baja cualquier publicación sin previo aviso.',
    ],
  },
  {
    id: 'gestoria',
    title: '4. Servicios de gestoría automotor',
    paragraphs: [
      'Las solicitudes de gestoría iniciadas a través de la web, como pedidos de informes o presupuestos de transferencia, constituyen un inicio de contacto comercial.',
      'El usuario es responsable de proveer toda la documentación requerida por los gestores de AutoZona de manera clara, legal y oportuna para llevar a cabo los trámites correspondientes ante la Dirección Nacional de los Registros Nacionales de la Propiedad del Automotor (DNRPA).',
    ],
  },
  {
    id: 'propiedad-intelectual',
    title: '5. Propiedad intelectual',
    paragraphs: [
      'Todos los contenidos del sitio, incluyendo logos, textos, gráficos, diseños, interfaces de usuario, códigos fuente y software, están protegidos por las leyes de propiedad intelectual de la República Argentina y tratados internacionales.',
      'Queda prohibida su reproducción, distribución o modificación sin autorización expresa y por escrito de AutoZona.',
    ],
  },
  {
    id: 'privacidad',
    title: '6. Protección de datos personales',
    paragraphs: [
      'Los datos personales recabados a través de formularios de contacto, registro de usuarios o consultas de gestoría serán tratados de conformidad con la Ley N° 25.326 de Protección de Datos Personales de Argentina.',
      'AutoZona se compromete a no vender, ceder ni compartir los datos con terceros sin el consentimiento del titular, salvo requerimiento judicial.',
      'El usuario tiene derecho a acceder, rectificar o solicitar la supresión de sus datos en cualquier momento.',
    ],
  },
  {
    id: 'responsabilidad',
    title: '7. Limitación de responsabilidad',
    paragraphs: [
      'AutoZona realiza los mayores esfuerzos para mantener el sitio libre de errores y virus; sin embargo, no garantiza la disponibilidad permanente ni la infalibilidad del sistema.',
      'AutoZona no se responsabiliza por daños derivados del uso del sitio, caídas del sistema o conductas fraudulentas de terceros que utilicen la plataforma de clasificados.',
    ],
  },
  {
    id: 'modificaciones',
    title: '8. Modificaciones de los términos y condiciones',
    paragraphs: [
      'AutoZona se reserva el derecho de modificar estos términos y condiciones en cualquier momento, como así también el precio de planes y servicios que los mismos incluyen, y su vigencia.',
      'Las modificaciones serán vigentes a partir de su publicación en el sitio. El uso continuo del sitio tras dichos cambios implica la aceptación de los nuevos términos.',
    ],
  },
  {
    id: 'jurisdiccion',
    title: '9. Ley aplicable y jurisdicción',
    paragraphs: [
      'Estos términos y condiciones se rigen por las leyes de la República Argentina.',
      'Para cualquier controversia derivada del uso del sitio o de los servicios prestados, las partes se someten a la jurisdicción de los Tribunales Ordinarios competentes correspondientes al domicilio legal de AutoZona.',
    ],
  },
];

const PLAN_TERMS = [
  {
    name: 'Plan básico',
    text: 'Plan de 30 días que incluye publicación de 6 imágenes, descripción del vehículo y botón de contacto por WhatsApp para consulta directa con la persona que realiza la publicación.',
  },
  {
    name: 'Plan intermedio',
    text: 'Plan de 30 días que incluye publicación de 8 imágenes, descripción del vehículo y botón de contacto por WhatsApp para consulta directa. También incluye informe de dominio del vehículo ofrecido, que se entregará al propietario e interesado en la compra a modo informativo. Esta acción generará la colocación de la insignia “Documentación verificada” en las imágenes de la publicación, siempre que coincida la titularidad registral del vehículo con la persona que realiza la publicación.',
  },
  {
    name: 'Plan premium',
    text: 'Plan de 30 días que incluye publicación de 10 imágenes, descripción del vehículo, botón de contacto directo, informe completo de dominio histórico, inhibiciones, prendas, denuncias y medidas judiciales, infracciones de tránsito, deudas impositivas, entre otros datos suministrados por la plataforma DataCar. Este plan también incluye un 15% de descuento en honorarios de gestoría para trámites de transferencia, aplicable solo en caso de realizar la transferencia con un gestor o mandatario de AutoZona exclusivamente.',
  },
];

export default function TerminosPage() {
  return (
    <main className="legal-page">
      <section className="legal-hero">
        <div className="container">
          <div className="breadcrumb">
            <Link to="/">Inicio</Link>
            <i className="fa-solid fa-chevron-right" />
            <span>Términos y condiciones</span>
          </div>
          <div className="legal-hero-grid">
            <div>
              <div className="section-tag">Información legal</div>
              <h1>Términos y condiciones de uso de AutoZona</h1>
              <p>
                Al acceder, navegar o utilizar AutoZona, el usuario acepta haber leído, entendido y acordado estar sujeto a estas condiciones de uso.
              </p>
            </div>
            <aside className="legal-note">
              <i className="fa-solid fa-file-contract" />
              <span>Si no estás de acuerdo con estos términos, por favor abstenete de utilizar el sitio.</span>
            </aside>
          </div>
        </div>
      </section>

      <section className="section legal-content-section">
        <div className="container legal-layout">
          <aside className="legal-index">
            <span>Contenido</span>
            <a href="#objeto">Objeto del sitio</a>
            <a href="#publicaciones">Publicaciones</a>
            <a href="#gestoria">Gestoría</a>
            <a href="#privacidad">Datos personales</a>
            <a href="#planes">Planes habilitados</a>
          </aside>

          <article className="legal-document">
            {TERMS_SECTIONS.map(section => (
              <section key={section.id} id={section.id} className="legal-block">
                <h2>{section.title}</h2>
                {section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
              </section>
            ))}

            <section id="planes" className="legal-block">
              <h2>10. Planes habilitados</h2>
              <p>
                El sitio ofrece tres tipos de planes de contratación para la publicación de 1 (una) unidad por plan. Los mismos tienen una vigencia de 30 días de publicación activa.
              </p>
              <div className="legal-plans">
                {PLAN_TERMS.map(plan => (
                  <div key={plan.name} className="legal-plan-item">
                    <h3>{plan.name}</h3>
                    <p>{plan.text}</p>
                  </div>
                ))}
              </div>
            </section>
          </article>
        </div>
      </section>
    </main>
  );
}
