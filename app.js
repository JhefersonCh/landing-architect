/*
 * Landing Page Prompt Architect — app.js
 * Estado, generación de prompts (SSoT, Prompt Ambicioso, Diseño Sustractivo,
 * Restricciones Negativas), combinación de tecnologías, ejecución y banco.
 *
 * El archivo se divide en dos partes:
 *   1) Lógica pura (sin DOM) — reutilizable desde Node para verificación.
 *   2) Bootstrap de interfaz, guardado detrás de `typeof document !== 'undefined'`.
 */

/* =========================================================================
 * 0. CONOCIMIENTO ESTRUCTURADO — VERTICALES Y TECNOLOGÍAS
 * ========================================================================= */

const VERTICALS = {
  ecommerce: {
    label: 'E-commerce',
    psychology: {
      motivations: [
        'exclusividad y estatus',
        'conveniencia y ahorro de tiempo',
        'pertenencia a una comunidad de marca',
        'deseo de poseer una pieza limitada',
      ],
      objections: [
        'el precio parece alto frente a alternativas masivas',
        'duda sobre la autenticidad o calidad real del producto',
        'incertidumbre sobre envío, plazos y devoluciones',
      ],
      biases: ['prueba social', 'escasez (unidades limitadas)', 'anclaje de precio'],
    },
    market: {
      sophistication: 'media-alta: el comprador ya comparó varias marcas antes de llegar',
      dominantPatterns: [
        'fotografía de producto a pantalla completa',
        'badges de envío gratis',
        'contador de oferta',
      ],
      conventionsToBreak: ['contador de urgencia artificial', 'pop-up de descuento al entrar a la página'],
    },
    trustSignals: [
      'política de devoluciones explícita',
      'reseñas verificadas de compradores reales',
      'certificado o garantía de autenticidad',
    ],
    negativeConstraints: [
      'no uses countdown de urgencia falsa',
      'no repitas el mismo CTA de compra más de dos veces por pantalla',
      'evitá mostrar el precio tachado sin una razón real',
    ],
  },
  saas: {
    label: 'SaaS',
    psychology: {
      motivations: [
        'ahorro de tiempo operativo',
        'reducir el riesgo de elegir mal una herramienta',
        'quedar bien frente al equipo al proponer la solución',
        'simplificar un proceso hoy manual',
      ],
      objections: [
        'duda sobre la curva de aprendizaje',
        'miedo a migrar datos desde la herramienta actual',
        'costo recurrente no siempre justificado a corto plazo',
      ],
      biases: [
        'prueba social (logos de clientes)',
        'autoridad (métricas o certificaciones)',
        'aversión a la pérdida (costo de no resolver el problema)',
      ],
    },
    market: {
      sophistication: 'alta: la audiencia evalúa varias herramientas B2B en paralelo',
      dominantPatterns: [
        'captura de pantalla de dashboard genérico',
        'sección de logos de clientes',
        'tabla de planes con tres columnas',
      ],
      conventionsToBreak: [
        'comparativa de precios cargada de checkmarks sin contexto',
        'captura de producto sin explicar el flujo real',
      ],
    },
    trustSignals: [
      'casos de uso concretos con resultado medible',
      'integraciones con herramientas conocidas',
      'política de seguridad y datos visible',
    ],
    negativeConstraints: [
      'no muestres un dashboard genérico sin relación con el flujo real del producto',
      'evitá comparar contra la competencia sin datos verificables',
      'no ocultes el precio si el objetivo es autoservicio',
    ],
  },
  educacion: {
    label: 'Educación',
    psychology: {
      motivations: [
        'mejorar una habilidad concreta y aplicable',
        'obtener una certificación o credencial reconocible',
        'avanzar en una carrera o cambiar de rubro',
        'aprender a un ritmo propio',
      ],
      objections: [
        'duda sobre si el contenido es realmente práctico',
        'miedo a no terminar el curso',
        'comparación con alternativas gratuitas',
      ],
      biases: [
        'prueba social (testimonios de egresados)',
        'autoridad del instructor',
        'compromiso y consistencia (avance visible)',
      ],
    },
    market: {
      sophistication: 'media: se compara duración, precio y resultado esperado',
      dominantPatterns: [
        'foto de instructor sonriendo',
        'barra de progreso decorativa',
        'testimonios genéricos en carrusel',
      ],
      conventionsToBreak: [
        'carrusel de testimonios',
        'promesas de resultado sin marco temporal realista',
      ],
    },
    trustSignals: [
      'temario o syllabus visible',
      'resultados o proyectos de egresados',
      'política de reembolso clara',
    ],
    negativeConstraints: [
      'no prometas resultados sin marco temporal realista',
      'evitá testimonios genéricos sin nombre ni contexto verificable',
      'no uses carrusel para mostrar el temario',
    ],
  },
  salud: {
    label: 'Salud',
    psychology: {
      motivations: [
        'recuperar bienestar o resolver un malestar concreto',
        'confiar en un profesional o servicio antes de agendar',
        'conveniencia de acceso (turnos, ubicación, canal)',
        'tranquilidad para uno mismo o un familiar',
      ],
      objections: [
        'duda sobre la idoneidad o las credenciales del profesional',
        'preocupación por la privacidad de datos de salud',
        'costo y cobertura de obra social o seguro',
      ],
      biases: [
        'autoridad (credenciales, matrícula)',
        'prueba social moderada (reseñas verificadas)',
        'reducción de ansiedad mediante claridad de proceso',
      ],
    },
    market: {
      sophistication: 'media: se busca claridad y confianza antes que novedad',
      dominantPatterns: [
        'foto de stock de personal médico sonriendo',
        'iconografía genérica de cruz o corazón',
        'formulario largo de admisión',
      ],
      conventionsToBreak: [
        'foto de stock genérica de personal médico',
        'formulario de contacto excesivamente largo antes de mostrar valor',
      ],
    },
    trustSignals: [
      'credenciales y matrícula visibles',
      'política de privacidad de datos de salud',
      'testimonios verificables, sin explotar el miedo',
    ],
    negativeConstraints: [
      'no uses imágenes de stock genéricas de personal médico',
      'evitá lenguaje que explote el miedo o la urgencia médica',
      'no pidas más datos que los necesarios para agendar un primer contacto',
    ],
  },
  fintech: {
    label: 'Fintech',
    psychology: {
      motivations: [
        'seguridad y control sobre el propio dinero',
        'simplicidad frente a la banca tradicional',
        'ahorro de costos o comisiones',
        'acceso a un producto financiero antes inaccesible',
      ],
      objections: [
        'desconfianza sobre la legitimidad o regulación del servicio',
        'miedo a perder dinero o sufrir un fraude',
        'fricción percibida al migrar desde el banco actual',
      ],
      biases: ['autoridad (regulación, respaldo, seguridad)', 'aversión a la pérdida', 'prueba social cauta'],
    },
    market: {
      sophistication: 'alta: la audiencia ya usa banca digital y compara comisiones y seguridad',
      dominantPatterns: [
        'ilustración abstracta de finanzas',
        'gráficos de crecimiento genéricos',
        'checklist de beneficios sin jerarquía',
      ],
      conventionsToBreak: [
        'ilustración abstracta sin relación con el producto real',
        'promesas de rentabilidad sin respaldo',
      ],
    },
    trustSignals: [
      'información regulatoria y de seguridad explícita',
      'cifrado y protección de datos declarados',
      'transparencia de comisiones',
    ],
    negativeConstraints: [
      'no prometas rentabilidad o resultados financieros sin respaldo',
      'evitá ilustraciones abstractas que no expliquen el producto',
      'no minimices la información regulatoria o de seguridad',
    ],
  },
  inmobiliaria: {
    label: 'Inmobiliaria',
    psychology: {
      motivations: [
        'proyectar cómo sería vivir o invertir en la propiedad',
        'seguridad de la inversión a largo plazo',
        'estatus o mejora de calidad de vida',
        'conveniencia de ubicación o servicios cercanos',
      ],
      objections: [
        'duda sobre el desarrollador o la constructora',
        'incertidumbre sobre los plazos de entrega',
        'presupuesto y condiciones de financiación',
      ],
      biases: [
        'escasez (unidades disponibles)',
        'prueba social (otros compradores o inversores)',
        'anclaje (precio por metro cuadrado)',
      ],
    },
    market: {
      sophistication: 'media-alta: se compara varios desarrollos y ubicaciones',
      dominantPatterns: [
        'render 3D genérico del edificio',
        'planos sin contexto de barrio',
        'formulario de contacto como único CTA',
      ],
      conventionsToBreak: [
        'render genérico sin contexto real del barrio',
        'listado de amenities sin jerarquía de relevancia',
      ],
    },
    trustSignals: [
      'información del desarrollador y obras previas',
      'plazos y etapa de construcción reales',
      'opciones de financiación claras',
    ],
    negativeConstraints: [
      'no muestres unidades limitadas si no es real',
      'evitá renders sin contexto del entorno real',
      'no satures con amenities irrelevantes para el público objetivo',
    ],
  },
  turismo: {
    label: 'Turismo y hospitalidad',
    psychology: {
      motivations: [
        'escapar de la rutina y volver distinto',
        'vivir algo que se pueda contar y mostrar',
        'sentir que el viaje está resuelto sin perder autenticidad',
        'compartir una experiencia con pareja, familia o amigos',
      ],
      objections: [
        'miedo a que la realidad no coincida con las fotos',
        'incertidumbre sobre cancelaciones, cambios y fuerza mayor',
        'duda sobre si el precio total incluye lo prometido o hay costos ocultos',
      ],
      biases: ['prueba social (reseñas de huéspedes)', 'escasez (últimas habitaciones o fechas)', 'efecto de dotación (imaginarse ya allí)'],
    },
    market: {
      sophistication: 'alta: el viajero compara en buscadores y reseñas antes de mirar el sitio propio',
      dominantPatterns: [
        'hero de video con paisaje y buscador de fechas',
        'carrusel de habitaciones con precio "desde"',
        'sello de puntaje de plataformas de reseñas',
      ],
      conventionsToBreak: ['buscador de fechas tapando la foto principal', 'galería de fotos sin contexto de lugar ni de escala'],
    },
    trustSignals: [
      'reseñas fechadas de huéspedes reales con nombre y origen',
      'política de cancelación en lenguaje llano',
      'fotos tomadas en el lugar, con fecha y sin retoque',
    ],
    negativeConstraints: [
      'no uses el atardecer en la playa con copa de champagne como imagen de apertura',
      'evitá las frases "paraíso terrenal", "experiencia inolvidable" y "escapada de ensueño"',
      'no muestres fotos de stock de parejas riendo en una hamaca',
    ],
  },
  gastronomia: {
    label: 'Gastronomía y restaurantes',
    psychology: {
      motivations: [
        'antojo y placer sensorial inmediato',
        'celebrar una ocasión especial en un lugar con carácter',
        'descubrir un sitio que otros todavía no conocen',
        'confiar en que la comida y el servicio no van a defraudar',
      ],
      objections: [
        'duda sobre si vale la pena el precio por persona',
        'incertidumbre sobre disponibilidad de mesa y tiempos de espera',
        'no saber si el menú tiene opciones para restricciones alimentarias',
      ],
      biases: ['prueba social (mesas llenas, reseñas)', 'escasez (cupos y mesas limitadas)', 'efecto de encuadre (menú de degustación como experiencia y no como gasto)'],
    },
    market: {
      sophistication: 'media: el comensal decide por fotos, ubicación y reseñas en pocos segundos',
      dominantPatterns: [
        'foto cenital del plato principal a pantalla completa',
        'menú en PDF descargable',
        'botón flotante de reservar mesa',
      ],
      conventionsToBreak: ['menú como PDF ilegible en celular', 'galería de platos sin nombre, precio ni origen del producto'],
    },
    trustSignals: [
      'menú visible con precios y alérgenos en la misma página',
      'fotos reales del salón y de la cocina en servicio',
      'reservas confirmadas en el momento con horario y cupos a la vista',
    ],
    negativeConstraints: [
      'no uses fotos de stock de platos perfectos e imposiblemente brillantes',
      'evitá "sabor único", "pasión por la cocina" y "sabores que enamoran"',
      'no pongas cubiertos cruzados ni pizarrones de tiza como decoración por defecto',
    ],
  },
  moda: {
    label: 'Moda y belleza',
    psychology: {
      motivations: [
        'expresar identidad y pertenecer a una estética',
        'verse y sentirse bien en una ocasión concreta',
        'acceder a una pieza o rutina que otras personas no tienen',
        'invertir en algo que dure más que una temporada',
      ],
      objections: [
        'no saber cómo le queda o qué talle pedir',
        'duda sobre la calidad real del material o del producto sobre la piel',
        'miedo a que el cambio o la devolución sea engorroso',
      ],
      biases: ['prueba social (comunidad y referentes)', 'escasez (drops y ediciones cortas)', 'efecto halo (una figura o campaña asocia la marca a un ideal)'],
    },
    market: {
      sophistication: 'alta: la audiencia ya recorrió redes, marcas rivales y tendencias antes de llegar',
      dominantPatterns: [
        'lookbook a pantalla completa con modelo en fondo neutro',
        'grilla de producto con hover de segunda foto',
        'banner de temporada con descuento porcentual',
      ],
      conventionsToBreak: ['modelo posando sobre fondo blanco sin ningún contexto', 'banners de descuento con porcentaje gigante que abaratan la marca'],
    },
    trustSignals: [
      'guía de talles con medidas reales y fotos con distintos cuerpos',
      'composición de materiales o ingredientes completa y verificable',
      'reseñas con foto de clientas y clientes reales',
    ],
    negativeConstraints: [
      'no uses modelos de stock con sonrisa de catálogo sobre fondo infinito blanco',
      'evitá "tendencia", "must-have" y "elegancia atemporal" como titulares',
      'no muestres antes y después de belleza con retoque evidente ni promesas de resultados garantizados',
    ],
  },
  arte: {
    label: 'Arte, cultura y portfolio creativo',
    psychology: {
      motivations: [
        'ser visto y reconocido por el criterio propio',
        'conectar con obras que dicen algo sobre quien las mira',
        'apoyar a un autor o espacio cultural con el que se comparte una mirada',
        'coleccionar o programar una visita que tenga sentido',
      ],
      objections: [
        'no entender la obra o el proyecto y sentirse afuera',
        'duda sobre el valor de una obra o entrada frente a su precio',
        'no saber cómo contactar, comprar o proponer una colaboración',
      ],
      biases: ['autoridad (exposiciones, curadores, publicaciones)', 'escasez (tirada limitada, obra única)', 'efecto de mera exposición (ver la obra varias veces antes de decidir)'],
    },
    market: {
      sophistication: 'alta: la audiencia tiene ojo entrenado y detecta la plantilla al instante',
      dominantPatterns: [
        'galería en grilla de miniaturas con lightbox',
        'texto de artista en fuente serif centrada',
        'menú mínimo con Obra, Sobre mí y Contacto',
      ],
      conventionsToBreak: ['grilla uniforme que trata todas las obras con el mismo peso', 'statement de artista en jerga ininteligible'],
    },
    trustSignals: [
      'exposiciones, residencias y publicaciones con fecha y lugar',
      'ficha técnica completa de cada obra (técnica, medidas, año)',
      'menciones o textos críticos de terceros',
    ],
    negativeConstraints: [
      'no uses la galería blanca de museo con marcos flotantes falsos como decoración',
      'evitá "exploro la relación entre" y "a través de mi mirada" en el texto de presentación',
      'no ocultes las obras detrás de animaciones de carga que demoren el primer vistazo',
    ],
  },
  arquitectura: {
    label: 'Arquitectura y construcción',
    psychology: {
      motivations: [
        'ver materializado un espacio pensado para su forma de vivir',
        'que la obra se termine en plazo y presupuesto',
        'sentir que el proyecto está en manos de alguien con criterio',
        'valorizar el inmueble con diseño duradero',
      ],
      objections: [
        'miedo a que la obra se demore y el costo se dispare',
        'duda sobre si el estudio entiende su gusto y su presupuesto',
        'incertidumbre sobre permisos, calidades y cómo se controla la ejecución',
      ],
      biases: ['autoridad (obras terminadas y premios)', 'aversión a la pérdida (sobrecostos y errores irreversibles)', 'prueba social (clientes que habitan lo construido)'],
    },
    market: {
      sophistication: 'alta: el cliente compara estudios por portfolio, proceso y trato antes del primer contacto',
      dominantPatterns: [
        'fotografía de fachada al atardecer a sangre completa',
        'grilla de proyectos con nombre y ubicación',
        'render 3D pulido sin contexto de obra real',
      ],
      conventionsToBreak: ['solo mostrar renders y nunca la obra terminada habitada', 'portfolio sin explicar el proceso ni el problema que resolvió cada proyecto'],
    },
    trustSignals: [
      'obras terminadas con fotos posteriores a la entrega y m² reales',
      'proceso de trabajo por etapas con plazos típicos',
      'matrícula profesional y seguros visibles',
    ],
    negativeConstraints: [
      'no uses renders de living vacío con planta de interior y luz dorada perfecta',
      'evitá "espacios que inspiran", "diseño a tu medida" y "llave en mano" sin explicar qué incluye',
      'no muestres cascos y planos sobre la mesa en foto de stock',
    ],
  },
  'b2b-ia': {
    label: 'Tecnología B2B / IA',
    psychology: {
      motivations: [
        'automatizar trabajo repetitivo y liberar al equipo',
        'no quedarse atrás frente a competidores que ya adoptan IA',
        'justificar la inversión ante dirección con un resultado medible',
        'reducir el riesgo de una integración fallida',
      ],
      objections: [
        'miedo a alucinaciones, sesgos y errores en producción',
        'duda sobre seguridad y destino de los datos corporativos',
        'escepticismo por el exceso de promesas vacías del sector',
      ],
      biases: ['autoridad (casos de uso con métricas y certificaciones)', 'aversión a la pérdida (costo de no automatizar)', 'anclaje (ROI concreto frente al costo del proceso manual)'],
    },
    market: {
      sophistication: 'muy alta: el comprador técnico y el financiero evalúan en paralelo y desconfían del hype',
      dominantPatterns: [
        'degradado violeta-azul con orbes y partículas',
        'demo interactiva o chat de ejemplo en el hero',
        'logos de clientes y diagrama de arquitectura',
      ],
      conventionsToBreak: ['fondo de red neuronal y cerebro luminoso como metáfora de IA', 'claims de "10x" sin caso, cifra base ni metodología'],
    },
    trustSignals: [
      'casos con cliente nombrado, métrica antes y después y plazo de implantación',
      'página de seguridad con certificaciones, residencia de datos y política de entrenamiento',
      'documentación técnica y API públicas',
    ],
    negativeConstraints: [
      'no uses cerebros luminosos, robots blancos ni manos tocando puntos de luz',
      'evitá "revolucionario", "potenciado por IA" y "el futuro es hoy" como titulares',
      'no muestres una demo trucada ni cifras de rendimiento sin fuente',
    ],
  },
  gaming: {
    label: 'Gaming y entretenimiento',
    psychology: {
      motivations: [
        'inmersión y evasión en un mundo con reglas propias',
        'competir y demostrar habilidad',
        'pertenecer a una comunidad con lenguaje compartido',
        'ser de los primeros en probar algo nuevo',
      ],
      objections: [
        'desconfianza por lanzamientos que no cumplen lo prometido',
        'miedo a monetización abusiva (pay to win, loot boxes)',
        'duda sobre si su equipo o su plataforma lo soporta',
      ],
      biases: ['prueba social (jugadores activos, streamers)', 'escasez (acceso anticipado, ediciones limitadas)', 'efecto de dotación (progreso y colección ya invertidos)'],
    },
    market: {
      sophistication: 'muy alta: la audiencia detecta marketing forzado y valora gameplay real sobre trailers',
      dominantPatterns: [
        'trailer cinemático en el hero con botón de wishlist',
        'estética neón sobre fondo negro',
        'capturas de pantalla en carrusel y requisitos de sistema',
      ],
      conventionsToBreak: ['trailer de CGI que no muestra jugabilidad real', 'neón cian y magenta como única identidad visual'],
    },
    trustSignals: [
      'jugabilidad real grabada sin edición',
      'requisitos de sistema y modelo de monetización declarados sin letra chica',
      'voces de la comunidad y de creadores de contenido con enlace verificable',
    ],
    negativeConstraints: [
      'no uses la estética neón cian y magenta sobre negro con glitch como identidad por defecto',
      'evitá "épico", "el juego que estabas esperando" y "una aventura sin precedentes"',
      'no muestres personajes de stock ni arte generado que no pertenezca al juego real',
    ],
  },
  fitness: {
    label: 'Deporte y fitness',
    psychology: {
      motivations: [
        'verse y sentirse mejor con un cambio visible',
        'construir un hábito sostenible y no un esfuerzo puntual',
        'superar un límite personal o un objetivo deportivo concreto',
        'entrenar con un grupo que sostenga la constancia',
      ],
      objections: [
        'miedo a fracasar otra vez y abandonar a las pocas semanas',
        'duda sobre si el método sirve para su nivel, edad o lesiones',
        'desconfianza por promesas de resultados rápidos y milagrosos',
      ],
      biases: ['prueba social (transformaciones y comunidad)', 'compromiso y coherencia (desafíos con fecha y grupo)', 'efecto de encuadre (inversión en salud frente a gasto)'],
    },
    market: {
      sophistication: 'media-alta: la audiencia probó apps, gimnasios y rutinas antes y desconfía de las promesas',
      dominantPatterns: [
        'foto de cuerpo entrenado en contraluz con tipografía enorme',
        'antes y después con contador de días',
        'planes de precio mensual con oferta de prueba gratis',
      ],
      conventionsToBreak: ['antes y después como única prueba de resultados', 'tono militar de "sin excusas" que culpabiliza a quien duda'],
    },
    trustSignals: [
      'credenciales verificables de entrenadoras y entrenadores',
      'clase de prueba o primera semana sin permanencia',
      'testimonios con contexto de nivel inicial, plazo y método',
    ],
    negativeConstraints: [
      'no uses abdominales esculpidos en contraluz ni siluetas corriendo al amanecer de stock',
      'evitá "sin excusas", "transformá tu cuerpo en 30 días" y "tu mejor versión"',
      'no muestres antes y después sin plazo, método ni aclaración del proceso real',
    ],
  },
  profesional: {
    label: 'Servicios profesionales: legal, contable, consultoría',
    psychology: {
      motivations: [
        'resolver un problema complejo con alguien que asuma la responsabilidad',
        'evitar sanciones, pérdidas o errores costosos',
        'sentirse acompañado y entendido en un tema que le genera ansiedad',
        'delegar lo que no domina para enfocarse en su negocio',
      ],
      objections: [
        'no poder evaluar la calidad del servicio antes de contratarlo',
        'miedo a honorarios abiertos o sorpresivos',
        'duda sobre si le van a hablar en jerga incomprensible',
      ],
      biases: ['autoridad (matrícula, trayectoria, casos)', 'aversión a la pérdida (multas y riesgos por no actuar)', 'reciprocidad (primera consulta clara y útil)'],
    },
    market: {
      sophistication: 'media: el cliente elige por referencias y confianza personal más que por comparación técnica',
      dominantPatterns: [
        'foto de equipo en oficina con brazos cruzados',
        'listado de áreas de práctica con íconos',
        'formulario de contacto con promesa de respuesta en 24 horas',
      ],
      conventionsToBreak: ['balanza de la justicia y apretón de manos como imagen', 'listado de servicios sin explicar qué problema resuelve cada uno'],
    },
    trustSignals: [
      'matrícula, especialidad y años de ejercicio visibles',
      'casos o consultas típicas resueltas descriptas sin violar confidencialidad',
      'honorarios orientativos o esquema de cobro explicado antes del contacto',
    ],
    negativeConstraints: [
      'no uses la balanza de la justicia, el martillo, el apretón de manos ni el edificio de vidrio de stock',
      'evitá "soluciones integrales", "compromiso y excelencia" y "asesoramiento a medida"',
      'no muestres fotos de equipo sonriendo con brazos cruzados frente a una sala de reuniones genérica',
    ],
  },
  ong: {
    label: 'ONG y causas sociales',
    psychology: {
      motivations: [
        'sentir que su aporte cambia algo concreto',
        'actuar según los propios valores',
        'formar parte de una comunidad con propósito',
        'ver el efecto de lo que dona o hace',
      ],
      objections: [
        'desconfianza sobre el destino real del dinero',
        'sensación de que un aporte pequeño no cambia nada',
        'fatiga por comunicaciones que apelan a la culpa',
      ],
      biases: ['víctima identificable (una persona concreta antes que estadísticas)', 'prueba social (cuántas personas ya se sumaron)', 'efecto de encuadre (qué logra un monto concreto)'],
    },
    market: {
      sophistication: 'media-alta: el donante recibe muchos pedidos y cada vez pide transparencia y rendición de cuentas',
      dominantPatterns: [
        'foto emotiva de una persona mirando a cámara',
        'botón de donar destacado con montos sugeridos',
        'estadísticas de impacto en números grandes',
      ],
      conventionsToBreak: ['imágenes de sufrimiento explotadas para generar culpa', 'cifras de impacto sin explicar cómo se miden ni quién las audita'],
    },
    trustSignals: [
      'informe anual y balance publicados con acceso directo',
      'desglose de a qué se destina cada peso donado',
      'personas beneficiarias que cuentan su historia con su consentimiento y protagonismo',
    ],
    negativeConstraints: [
      'no uses niños con mirada triste en primer plano ni manos extendidas como imagen de apertura',
      'evitá "juntos podemos cambiar el mundo", "sé el cambio" y "tu granito de arena"',
      'no ocultes el porcentaje de gastos administrativos ni uses un contador de urgencia falso',
    ],
  },
  eventos: {
    label: 'Eventos y experiencias',
    psychology: {
      motivations: [
        'vivir algo irrepetible con otras personas',
        'no perderse lo que todos van a comentar después',
        'conocer gente o hacer contactos valiosos',
        'celebrar una ocasión con un plan sin fallas',
      ],
      objections: [
        'miedo a que el evento no sea como se promociona',
        'duda sobre logística, ubicación, horarios y accesos',
        'incertidumbre sobre reembolsos si se cancela o se posterga',
      ],
      biases: ['escasez (entradas y cupos limitados)', 'FOMO (miedo a quedarse afuera)', 'prueba social (asistentes y ediciones anteriores)'],
    },
    market: {
      sophistication: 'media: la audiencia decide rápido por line-up, fecha y reacciones de otras personas',
      dominantPatterns: [
        'cuenta regresiva a pantalla completa',
        'afiche con line-up en tipografía enorme',
        'botón fijo de comprar entradas con precio por tanda',
      ],
      conventionsToBreak: ['cuenta regresiva como única forma de generar urgencia', 'programa oculto detrás de un PDF o una imagen'],
    },
    trustSignals: [
      'fotos y videos reales de ediciones anteriores',
      'programa, ubicación y accesos detallados antes de comprar',
      'política de reembolso y ticketera oficial visibles',
    ],
    negativeConstraints: [
      'no uses manos en alto con luces de escenario de stock ni confeti como imagen de apertura',
      'evitá "una noche inolvidable", "no te lo pierdas" y "el evento del año"',
      'no pongas un cronómetro de urgencia que se reinicie ni "quedan pocas entradas" sin dato real',
    ],
  },
  automotriz: {
    label: 'Automotriz y movilidad',
    psychology: {
      motivations: [
        'sentir libertad, control y estatus al conducir',
        'una compra racional que dure sin sorpresas mecánicas',
        'reducir costo de uso, consumo y mantenimiento',
        'sentirse seguro con la familia a bordo',
      ],
      objections: [
        'miedo a comprar un vehículo con fallas ocultas o historial dudoso',
        'confusión por precio total, financiación y costos de patente y seguro',
        'incertidumbre sobre servicio posventa, repuestos y valor de reventa',
      ],
      biases: ['anclaje (precio de lista frente a precio final)', 'aversión a la pérdida (depreciación y reparaciones)', 'autoridad (marcas, pruebas y certificaciones)'],
    },
    market: {
      sophistication: 'muy alta: el comprador investigó reseñas, foros y precios de la competencia antes de visitar',
      dominantPatterns: [
        'vehículo de perfil sobre asfalto mojado al atardecer',
        'configurador de versión y color',
        'comparador de fichas técnicas y cuotas de financiación',
      ],
      conventionsToBreak: ['vehículo en carretera vacía como única imagen de marca', 'financiación con cuota destacada y costo total escondido'],
    },
    trustSignals: [
      'historial y revisión mecánica verificables por unidad',
      'precio total con patente, seguro y financiación desglosados',
      'garantía y red de servicio oficial visibles',
    ],
    negativeConstraints: [
      'no uses el auto en ruta desierta al atardecer ni el destello de reflejo sobre carrocería como cliché',
      'evitá "potencia sin límites", "la máquina de tus sueños" y "diseño que impone"',
      'no muestres cuota mensual baja sin aclarar plazo, tasa y costo financiero total',
    ],
  },
  agro: {
    label: 'Agro y agroindustria',
    psychology: {
      motivations: [
        'aumentar rendimiento y rentabilidad por hectárea',
        'reducir la incertidumbre del clima, los precios y las plagas',
        'proteger la continuidad de la empresa familiar',
        'acceder a mercados exigentes con trazabilidad',
      ],
      objections: [
        'desconfianza hacia quien no conoce el campo ni la campaña',
        'duda sobre si la tecnología rinde en su zona y suelo',
        'miedo a compromisos de financiación atados a cosecha',
      ],
      biases: ['prueba social (productores vecinos que ya lo usan)', 'aversión a la pérdida (campaña perdida por decisión tardía)', 'autoridad (ensayos a campo y técnicos reconocidos)'],
    },
    market: {
      sophistication: 'media-alta: el productor decide con datos de lote, pares de confianza y asesor técnico',
      dominantPatterns: [
        'tractor o cosechadora al atardecer sobre campo dorado',
        'catálogo de productos con ficha técnica descargable',
        'mapa de sucursales y distribuidores',
      ],
      conventionsToBreak: ['campo idealizado sin datos de campaña ni de zona', 'catálogo sin resultados reales de ensayos a campo'],
    },
    trustSignals: [
      'ensayos a campo con lote, campaña, zona y resultado',
      'certificaciones de calidad y trazabilidad del producto',
      'técnicos y productores con nombre, zona y superficie',
    ],
    negativeConstraints: [
      'no uses el tractor al atardecer genérico ni la espiga de trigo dorada en contraluz',
      'evitá "del campo a tu mesa" vacío, "tradición y tecnología" y "la fuerza de la tierra"',
      'no muestres granjeros sonrientes de stock ni promesas de rendimiento sin datos de campaña',
    ],
  },
  portfolio: {
    label: 'Portfolio personal / marca personal',
    psychology: {
      motivations: [
        'ser elegido frente a otras personas con perfil parecido',
        'transmitir criterio y personalidad más allá del currículum',
        'atraer el tipo de proyecto o cliente que quiere',
        'construir autoridad y reputación a largo plazo',
      ],
      objections: [
        'quien mira no tiene tiempo y decide en segundos',
        'duda sobre si la persona sabe resolver problemas reales y no solo hacer piezas bonitas',
        'no saber cómo trabajar juntos, con qué tarifa o plazo',
      ],
      biases: ['efecto halo (un proyecto muy fuerte eleva a todos los demás)', 'autoridad (clientes, medios y charlas)', 'prueba social (recomendaciones de colegas y clientes)'],
    },
    market: {
      sophistication: 'muy alta: quienes contratan revisan decenas de portfolios y reconocen las plantillas repetidas',
      dominantPatterns: [
        'nombre gigante con rol debajo y flecha de scroll',
        'grilla de tarjetas de proyecto con hover',
        'sección de habilidades con barras de porcentaje',
      ],
      conventionsToBreak: ['barras de porcentaje de habilidades', 'proyectos listados sin decir el problema, el rol propio ni el resultado'],
    },
    trustSignals: [
      'casos con problema, rol, proceso y resultado medible',
      'clientes, medios o charlas con enlace verificable',
      'recomendaciones firmadas con nombre y cargo',
    ],
    negativeConstraints: [
      'no uses "Hola, soy [nombre], desarrollador/a apasionado/a" como titular ni el emoji de saludo',
      'evitá barras de habilidad con porcentaje y nubes de logos de herramientas sin contexto',
      'no muestres mockups genéricos de laptop y celular con capturas ajenas',
    ],
  },
};

const TECHNOLOGIES = {
  html: {
    label: 'HTML',
    implies: [],
    conflicts: [],
    rules: [
      'Documento único autocontenido (`index.html`), semántico: header, main, section, footer',
      'Sin paso de build; sí se permite cargar librerías por CDN en tiempo de ejecución como mejora progresiva (ver detalle de GSAP/Lenis/three.js en JavaScript)',
    ],
  },
  css: {
    label: 'CSS',
    implies: [],
    conflicts: [],
    rules: [
      'CSS dentro de `<style>` en el mismo documento, sin frameworks de utilidades',
      'Variables CSS (custom properties) para color, tipografía y espaciado',
      'Podés usar animaciones nativas ligadas al scroll (`animation-timeline: view()` o `scroll()`) como alternativa o complemento a JS cuando el eje de Dirección Visual lo pida',
    ],
  },
  javascript: {
    label: 'JavaScript',
    implies: [],
    conflicts: [],
    rules: [
      'JavaScript vanilla embebido en `<script>` como base',
      'Como mejora progresiva para las piezas de scroll-storytelling y 3D pedidas en DIRECCIÓN VISUAL, podés cargar por CDN: GSAP + ScrollTrigger (https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js y https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js), Lenis para scroll suave (https://cdn.jsdelivr.net/npm/lenis@1/dist/lenis.min.js) y/o three.js r128 (https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js, expone el global `THREE`)',
      'El contenido crítico (texto, navegación, CTA) debe seguir siendo legible y usable aunque JavaScript o el CDN fallen (mejora progresiva real, no decorativa)',
    ],
  },
  react: {
    label: 'React',
    implies: [],
    conflicts: ['vue'],
    rules: [
      'Proyecto Vite + React de VARIOS archivos (entrada `index.html` → `src/main.jsx` → `src/App.jsx`), un componente por archivo `.jsx` dentro de `src/components/`; el JSX va SIEMPRE en archivos `.jsx`',
      'Componentes funcionales con hooks; React, ReactDOM, GSAP, Lenis y three.js ya están instalados: importalos desde npm (nada de CDN, esm.sh ni Babel standalone)',
    ],
  },
  vue: {
    label: 'Vue',
    implies: [],
    conflicts: ['react'],
    rules: [
      'Proyecto Vite + Vue 3 de VARIOS archivos (entrada `index.html` → `src/main.js` → `src/App.vue`), un componente por archivo `.vue` dentro de `src/components/`',
      'Composition API con `<script setup>`; Vue, GSAP, Lenis y three.js ya están instalados: importalos desde npm (nada de CDN)',
      'Refs: `.value` SOLO dentro de `<script>`. En el `<template>` Vue los desenvuelve solo: escribí `seleccion.id`, nunca `seleccion.value.id` (con `.value` en el template da `undefined` y la página no renderiza). Inicializá los refs que se leen en el template con un valor válido (nunca `null` si después accedés a sus propiedades) o protegelos con `?.`/`v-if`',
    ],
  },
  nextjs: {
    label: 'Next.js',
    implies: ['react'],
    conflicts: [],
    rules: [
      'Proyecto Next.js REAL con App Router en JavaScript (`app/layout.jsx`, `app/page.jsx`, `app/globals.css`, componentes en `components/*.jsx`); se ejecuta con `next dev`, no se simula',
      'Poné `\'use client\'` en la primera línea de todo archivo que use hooks, eventos, `window`/`document`, GSAP, Lenis o three.js; usá `<img>` común (no `next/image`) y `<a>`/`next/link` para los enlaces',
      'Sin rutas API, server actions, middleware ni `pages/`: sólo páginas del App Router',
    ],
  },
  tailwind: {
    label: 'Tailwind CSS',
    implies: [],
    conflicts: ['bootstrap'],
    rules: [
      'Cargar Tailwind vía CDN (cdn.jsdelivr.net o Play CDN) dentro del único archivo HTML',
      'Usar utilidades de Tailwind como sistema principal; el CSS custom se limita a tokens de marca',
    ],
    // Con React/Vue/Next es un proyecto real: Tailwind v4 ya está instalado por npm.
    frameworkRules: [
      'Tailwind v4 ya está instalado por npm (proyecto real, sin CDN): poné `@import "tailwindcss";` como primera línea del CSS global (Vite: `src/index.css` importado en el punto de entrada; Next: `app/globals.css` importado en `app/layout.jsx`). No hace falta `tailwind.config` ni configurar PostCSS: el entorno ya lo provee',
      'Usar utilidades de Tailwind como sistema principal; los tokens de marca van con `@theme` en el CSS global o como variables CSS',
    ],
  },
  bootstrap: {
    label: 'Bootstrap',
    implies: [],
    conflicts: ['tailwind'],
    rules: [
      'Cargar Bootstrap vía CDN (cdn.jsdelivr.net) dentro del único archivo HTML',
      'Usar el sistema de grid y componentes de Bootstrap como base estructural',
    ],
    frameworkRules: [
      'Bootstrap ya está instalado por npm (proyecto real, sin CDN): `import \'bootstrap/dist/css/bootstrap.min.css\';` en el punto de entrada (Vite) o en `app/layout.jsx` (Next); si necesitás su JS, `import(\'bootstrap/dist/js/bootstrap.bundle.min.js\')` dentro de un efecto de cliente',
      'Usar el sistema de grid y componentes de Bootstrap como base estructural',
    ],
  },
};

/* ---------- Proyectos multi-archivo (React/Vue con Vite, Next.js) ----------
 * Estas tecnologías ya NO se entregan como un único HTML: el modelo devuelve
 * bloques `=== FILE: ruta ===` … `=== END FILE ===` y el servidor los levanta
 * con un dev server real (ver preview-runner.js). Las demás (HTML, CSS, JS,
 * Tailwind, Bootstrap) siguen siendo un único documento autocontenido. */

const PROJECT_FRAMEWORK_LABELS = { nextjs: 'Next.js', react: 'React', vue: 'Vue' };

// Prioridad: Next.js > React > Vue. Devuelve 'nextjs' | 'react' | 'vue' | null.
function frameworkFromTechKeys(keys) {
  const set = new Set(keys || []);
  if (set.has('nextjs')) return 'nextjs';
  if (set.has('react')) return 'react';
  if (set.has('vue')) return 'vue';
  return null;
}

function frameworkFromLabels(labels) {
  const set = new Set(labels || []);
  if (set.has('Next.js')) return 'nextjs';
  if (set.has('React')) return 'react';
  if (set.has('Vue')) return 'vue';
  return null;
}

const FILE_BLOCK_RE = /^[ \t]*=== FILE:[ \t]*(.+?)[ \t]*===[ \t]*\n([\s\S]*?)\n?^[ \t]*=== END FILE ===[ \t]*$/gm;

// Parsea la respuesta del modelo en archivos: devuelve [{ path, content }].
// Tolera cercas de markdown alrededor de todo el texto o de cada archivo.
// Conflictos entre tecnologías, teniendo en cuenta lo que cada una implica
// (Next.js implica React, y React choca con Vue → Next.js choca con Vue).
// Devuelve las claves ya elegidas que bloquean a `key`.
function techClosure(key) {
  const out = new Set([key]);
  const queue = [key];
  while (queue.length) {
    const k = queue.shift();
    ((TECHNOLOGIES[k] && TECHNOLOGIES[k].implies) || []).forEach((i) => { if (!out.has(i)) { out.add(i); queue.push(i); } });
  }
  return out;
}

function techBlockers(key, selected) {
  const mine = techClosure(key);
  return (selected || []).filter((other) => {
    if (other === key) return false;
    const theirs = techClosure(other);
    for (const a of mine) {
      for (const b of theirs) {
        const ca = (TECHNOLOGIES[a] && TECHNOLOGIES[a].conflicts) || [];
        const cb = (TECHNOLOGIES[b] && TECHNOLOGIES[b].conflicts) || [];
        if (ca.indexOf(b) !== -1 || cb.indexOf(a) !== -1) return true;
      }
    }
    return false;
  });
}

// Deja una selección sin conflictos: conserva las primeras elegidas y quita
// las que choquen (para selecciones viejas guardadas o cargadas del Banco).
function sanitizeTechSelection(selected) {
  const out = [];
  (selected || []).forEach((k) => { if (TECHNOLOGIES[k] && !techBlockers(k, out).length) out.push(k); });
  return out;
}

function parseProjectFiles(raw) {
  if (!raw) return [];
  const text = String(raw).replace(/\r\n/g, '\n');
  const files = [];
  const re = new RegExp(FILE_BLOCK_RE.source, 'gm');
  let m = re.exec(text);
  while (m) {
    let content = m[2];
    const fence = content.match(/^\s*```[\w.+-]*[ \t]*\n([\s\S]*?)\n?```\s*$/);
    if (fence) content = fence[1];
    if (!content.endsWith('\n')) content += '\n';
    files.push({ path: m[1].replace(/^[`'"]+|[`'"]+$/g, '').trim(), content });
    m = re.exec(text);
  }
  return files;
}

function looksLikeProjectFiles(raw) {
  return typeof raw === 'string' && /^[ \t]*=== FILE:[ \t]*.+===[ \t]*$/m.test(raw) && /=== END FILE ===/.test(raw);
}

function projectFrameworkDeps(framework) {
  if (framework === 'vue') return 'vue';
  if (framework === 'nextjs') return 'next, react, react-dom';
  return 'react, react-dom';
}

// Reglas de REQUISITOS TÉCNICOS específicas del proyecto multi-archivo.
function buildProjectTechLines(framework) {
  const lines = [
    'Salida multi-archivo (NO un único HTML): cada archivo va en su propio bloque `=== FILE: ruta ===` … `=== END FILE ===`',
    'Dependencias permitidas (ya instaladas por npm, como en un proyecto real): ' + projectFrameworkDeps(framework) + ', gsap (+ `gsap/ScrollTrigger`), lenis, three, tailwindcss (si se pidió Tailwind) y bootstrap (si se pidió Bootstrap). Podés usar cualquier otro paquete npm real si aporta a la página (p. ej. lucide-react, framer-motion, @react-three/fiber): importalo normalmente y se instala solo. Usá nombres de paquetes que existan de verdad (no inventes) y evitá dependencias pesadas si una ya incluida resuelve lo mismo',
    'NADA por CDN en este proyecto (las instrucciones de CDN de otras secciones NO aplican): todo se importa desde npm. `import gsap from \'gsap\'; import { ScrollTrigger } from \'gsap/ScrollTrigger\'; gsap.registerPlugin(ScrollTrigger);`, `import Lenis from \'lenis\'`, `import * as THREE from \'three\'`',
    'Estilos en archivos `.css` propios. Tailwind (si se pidió): `@import "tailwindcss";` al inicio del CSS global; sin `tailwind.config` ni PostCSS (los provee el entorno). Bootstrap (si se pidió): `import \'bootstrap/dist/css/bootstrap.min.css\';` en el punto de entrada o en `app/layout.jsx`',
    'No incluyas `package.json`, `vite.config.*` ni `next.config.*`: los provee el entorno. Rutas relativas dentro del proyecto, sin `..` ni rutas absolutas',
    'Las imágenes se usan con `<img>` (en JSX: `className`, `onError`, etc.)',
  ];
  if (framework === 'nextjs') lines.push('Antes de usar `window`, `document` o three.js/GSAP dentro de un efecto, asegurate de que el componente sea de cliente (`\'use client\'`)');
  return lines;
}

function buildProjectSalidaLines(framework) {
  const lines = [];
  lines.push('Devolvé un PROYECTO de varios archivos, no un documento HTML único. Formato ESTRICTO, un bloque por archivo, sin nada fuera de los bloques:');
  lines.push('');
  lines.push('=== FILE: ruta/relativa/archivo.ext ===');
  lines.push('(contenido completo del archivo)');
  lines.push('=== END FILE ===');
  lines.push('');
  lines.push('Los marcadores `=== FILE: … ===` y `=== END FILE ===` van cada uno en su propia línea. Tu respuesta NO lleva bloques de markdown ni comillas triples, tampoco dentro de los archivos.');
  lines.push('No agregues explicaciones antes ni después. Cada archivo debe estar COMPLETO (nada de "…resto igual" ni marcadores de posición).');
  if (framework === 'nextjs') {
    lines.push('Archivos requeridos (Next.js, App Router en JavaScript): `app/layout.jsx` (importa `./globals.css`, `<html lang="es">`, metadata con `title`), `app/page.jsx`, `app/globals.css` y los componentes que hagan falta en `components/*.jsx`.');
    lines.push('`\'use client\'` como PRIMERA línea de todo archivo con hooks, eventos, GSAP, Lenis, three.js o acceso a `window`/`document`. Sin `next/image`, rutas API, server actions, middleware ni `pages/`.');
  } else if (framework === 'vue') {
    lines.push('Archivos requeridos (Vite + Vue 3): `index.html` (con `<div id="app"></div>` y `<script type="module" src="/src/main.js"></script>`, `<html lang="es">`, `charset`, `viewport`, `title`), `src/main.js`, `src/App.vue`, `src/styles.css` (importado desde `main.js`) y componentes en `src/components/*.vue`.');
  } else {
    lines.push('Archivos requeridos (Vite + React): `index.html` (con `<div id="root"></div>` y `<script type="module" src="/src/main.jsx"></script>`, `<html lang="es">`, `charset`, `viewport`, `title`), `src/main.jsx`, `src/App.jsx`, `src/styles.css` (importado desde `main.jsx`) y componentes en `src/components/*.jsx`. El JSX va SOLO en archivos `.jsx`.');
  }
  lines.push('Solo se aceptan estas dependencias (ya instaladas): ' + projectFrameworkDeps(framework) + ', gsap, lenis, three. No incluyas `package.json` ni archivos de configuración. Rutas relativas, sin `..`.');
  lines.push('Usá español en todo el copy, salvo indicación contraria.');
  return lines;
}

const BANNED_WORDS = [
  'revolucionario',
  'potenciar',
  'ecosistema',
  'innovador',
  'soluciones integrales',
  'desbloquear',
  'sinergia',
  'seamless',
  'robusto',
  'transformador',
  'siguiente nivel',
];

const SECTION_LABELS = {
  hero: 'Hero',
  'problema-solucion': 'Problema / Solución',
  caracteristicas: 'Características / Oferta',
  'prueba-social': 'Prueba social',
  objeciones: 'Objeciones',
  'cta-final': 'Cierre / CTA final',
};

const EXAMPLE_PROJECT = {
  descripcion: 'Taller independiente de relojería artesanal que fabrica series muy limitadas de relojes mecánicos hechos a mano. Los clientes son coleccionistas y compradores exigentes que valoran la pieza única y el proceso de fabricación. Quiero una página sobria y elegante cuyo objetivo sea que reserven una pieza de la próxima serie.',
  tema: 'Relojería de lujo',
  publico: 'Compradores interesados en relojes artesanales de edición limitada',
  oferta: 'Colección de relojes de edición limitada, fabricación artesanal',
  objetivo: 'Reservar una pieza',
  competidores: 'Marcas de relojería de lujo tradicionales',
  tono: '',
  referenciasVisuales: '',
  propuestaValor: '',
  restriccionesAdicionales: '',
};
const EXAMPLE_VERTICALS = ['ecommerce'];
const EXAMPLE_TECHNOLOGIES = ['html', 'css', 'javascript'];

/* =========================================================================
 * 1. SSoT — STRING SEED OF THOUGHT (mecanismo real, no una etiqueta)
 * ========================================================================= */

function generateSeed(length) {
  const len = length || 48;
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let out = '';
  const hasCrypto = typeof crypto !== 'undefined' && crypto && typeof crypto.getRandomValues === 'function';
  if (hasCrypto) {
    const arr = new Uint32Array(len);
    crypto.getRandomValues(arr);
    for (let i = 0; i < len; i++) out += chars[arr[i] % chars.length];
  } else {
    for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

// Hash tipo FNV con una "sal" por dimensión de decisión: permite derivar
// múltiples decisiones independientes de la MISMA cadena semilla.
function rollingHash(str, salt) {
  let h = (2166136261 ^ salt) >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

// sum-mod sobre un tramo distinto de la semilla por cada dimensión de decisión.
function pickIndex(seed, dimensionSalt, modulo) {
  if (!modulo || modulo <= 0) return 0;
  const start = (dimensionSalt * 7) % seed.length;
  const slice = seed.slice(start, start + 12) || seed;
  const sum = slice.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const hashed = rollingHash(slice + String(sum), dimensionSalt);
  return (hashed + sum) % modulo;
}

/* ---- Cadena semilla visible y controlable por el usuario (SSoT) ----
 * La cadena es un hexadecimal de 64 caracteres (32 bytes de crypto). El usuario
 * la ve, la copia, genera otra o pega la suya (16 a 128 hex). Toda la dirección
 * creativa, incluida la paleta, se deriva de ella de forma determinista. */
const SSOT_SEED_STORAGE_KEY = 'lpa_ssot_seed_v1';
const SSOT_SEED_MIN_LEN = 16;
const SSOT_SEED_MAX_LEN = 128;

function generateSsotSeed() {
  const bytes = new Uint8Array(32);
  const hasCrypto = typeof crypto !== 'undefined' && crypto && typeof crypto.getRandomValues === 'function';
  if (hasCrypto) crypto.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  let out = '';
  for (let i = 0; i < bytes.length; i++) out += bytes[i].toString(16).padStart(2, '0');
  return out;
}

function isValidSsotSeed(seed) {
  return typeof seed === 'string' && /^[0-9a-f]+$/.test(seed)
    && seed.length >= SSOT_SEED_MIN_LEN && seed.length <= SSOT_SEED_MAX_LEN;
}

// Tolera lo que se pega desde la vista agrupada (espacios, guiones, ":" y un 0x inicial).
function normalizeSsotSeedInput(raw) {
  return String(raw == null ? '' : raw).trim().replace(/^0x/i, '').replace(/[\s\-:_]+/g, '').toLowerCase();
}

// -> { ok, seed, error } con el error en español listo para mostrar.
function validateSsotSeedInput(raw) {
  const seed = normalizeSsotSeedInput(raw);
  if (!seed) return { ok: false, seed, error: 'Pegá una cadena hexadecimal de 16 a 128 caracteres (0-9 y a-f).' };
  if (!/^[0-9a-f]+$/.test(seed)) return { ok: false, seed, error: 'La cadena solo puede tener caracteres hexadecimales (0-9 y a-f).' };
  if (seed.length < SSOT_SEED_MIN_LEN) return { ok: false, seed, error: `La cadena es demasiado corta: tiene ${seed.length} caracteres y necesita al menos ${SSOT_SEED_MIN_LEN}.` };
  if (seed.length > SSOT_SEED_MAX_LEN) return { ok: false, seed, error: `La cadena es demasiado larga: tiene ${seed.length} caracteres y el máximo es ${SSOT_SEED_MAX_LEN}.` };
  return { ok: true, seed, error: '' };
}

function formatSeedGroups(seed) {
  return (String(seed || '').match(/.{1,8}/g) || []).join(' ');
}

function shortSeed(seed) {
  const s = String(seed || '');
  return s.length > 20 ? `${s.slice(0, 8)}…${s.slice(-8)}` : s;
}

function groupSeed(seed) {
  return (String(seed || '').match(/.{1,8}/g) || []).join(' ');
}

// Semilla visible entera: resumen abreviado que se despliega completo (en
// bloques de 8), con "Copiar" y, opcionalmente, "Usar esta semilla".
// opts: { label, onCopy(seed) → Promise<bool>, onUse(seed), className }
function buildSeedView(seed, opts) {
  const o = opts || {};
  const wrap = document.createElement('div');
  wrap.className = `seed-view ${o.className || ''}`.trim();
  const details = document.createElement('details');
  details.className = 'seed-view__details';
  const summary = document.createElement('summary');
  summary.className = 'seed-view__summary';
  if (o.label) {
    const lab = document.createElement('span');
    lab.className = 'seed-view__label';
    lab.textContent = o.label;
    summary.appendChild(lab);
  }
  const short = document.createElement('code');
  short.className = 'seed-view__short';
  short.textContent = shortSeed(seed);
  summary.appendChild(short);
  const hint = document.createElement('span');
  hint.className = 'seed-view__hint';
  hint.textContent = 'ver completa';
  summary.appendChild(hint);
  details.appendChild(summary);
  const full = document.createElement('code');
  full.className = 'seed-view__full';
  full.textContent = groupSeed(seed);
  full.setAttribute('aria-label', `Cadena semilla completa: ${seed}`);
  details.appendChild(full);
  details.addEventListener('toggle', () => { hint.textContent = details.open ? 'ocultar' : 'ver completa'; });
  wrap.appendChild(details);

  const actions = document.createElement('div');
  actions.className = 'seed-view__actions';
  const status = document.createElement('span');
  status.className = 'seed-view__status';
  status.setAttribute('role', 'status');
  if (o.onCopy) {
    const copy = document.createElement('button');
    copy.type = 'button';
    copy.className = 'btn btn--secondary btn--small';
    copy.textContent = 'Copiar';
    copy.setAttribute('aria-label', 'Copiar la cadena semilla completa');
    copy.addEventListener('click', async () => {
      const ok = await o.onCopy(seed);
      status.textContent = ok ? 'Copiada.' : 'No se pudo copiar.';
      setTimeout(() => { status.textContent = ''; }, 3000);
    });
    actions.appendChild(copy);
  }
  if (o.onUse) {
    const use = document.createElement('button');
    use.type = 'button';
    use.className = 'btn btn--secondary btn--small';
    use.textContent = 'Usar esta semilla';
    use.setAttribute('aria-label', 'Cargar esta cadena semilla en el paso 2');
    use.addEventListener('click', () => { o.onUse(seed); });
    actions.appendChild(use);
  }
  actions.appendChild(status);
  wrap.appendChild(actions);
  return wrap;
}

// Mezcla final de 32 bits (fmix de murmur3): FNV solo deja los bits bajos
// poco mezclados, y acá necesitamos números uniformes en [0, 1).
function mix32(h) {
  let x = h >>> 0;
  x ^= x >>> 16; x = Math.imul(x, 0x85ebca6b) >>> 0;
  x ^= x >>> 13; x = Math.imul(x, 0xc2b2ae35) >>> 0;
  x ^= x >>> 16;
  return x >>> 0;
}

// Número determinista en [0, 1) por (cadena completa, sal).
function seedUnit(seed, salt) {
  return mix32(rollingHash(String(seed), Math.imul(salt, 2654435761) >>> 0)) / 4294967296;
}

/* ---- Color: HSL -> hex, luminancia y contraste WCAG ---- */

function hslToHex(h, s, l) {
  const hh = ((h % 360) + 360) % 360;
  const ss = Math.min(1, Math.max(0, s));
  const ll = Math.min(1, Math.max(0, l));
  const c = (1 - Math.abs(2 * ll - 1)) * ss;
  const x = c * (1 - Math.abs(((hh / 60) % 2) - 1));
  const m = ll - c / 2;
  let r = 0; let g = 0; let b = 0;
  if (hh < 60) { r = c; g = x; } else if (hh < 120) { r = x; g = c; } else if (hh < 180) { g = c; b = x; }
  else if (hh < 240) { g = x; b = c; } else if (hh < 300) { r = x; b = c; } else { r = c; b = x; }
  const to = (v) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`.toUpperCase();
}

function relativeLuminance(hex) {
  const n = parseInt(String(hex).replace('#', ''), 16);
  const lin = (v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
}

function contrastRatio(hexA, hexB) {
  const a = relativeLuminance(hexA); const b = relativeLuminance(hexB);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

const PALETTE_SCHEMES = ['complementario', 'triádico', 'análogo', 'dividido', 'duotono'];
const PALETTE_SAT_BANDS = [
  { name: 'suave', min: 0.32, max: 0.46 },
  { name: 'media', min: 0.5, max: 0.68 },
  { name: 'vívida', min: 0.74, max: 0.92 },
];
const PALETTE_TEXT_TARGET = 7;   // objetivo AAA para texto/fondo (mínimo garantizado: 4.5)
const PALETTE_ACCENT_TARGET = 3.5; // objetivo para acentos/fondo (mínimo garantizado: 3)

function hueName(h) {
  const x = ((h % 360) + 360) % 360;
  if (x < 15 || x >= 345) return 'rojo';
  if (x < 45) return 'naranja';
  if (x < 70) return 'amarillo';
  if (x < 165) return 'verde';
  if (x < 200) return 'turquesa';
  if (x < 250) return 'azul';
  if (x < 290) return 'violeta';
  return 'magenta';
}

const isPurpleBlueHue = (h) => h >= 235 && h <= 300;

// Paleta determinista y pura a partir de la cadena semilla. Esquema, tono
// base, modo claro/oscuro y banda de saturación salen de la cadena; el
// contraste se corrige iterando la luminosidad (texto/fondo >= 7:1 o, si el
// tono no lo permite, el máximo posible >= 4.5; acentos/fondo >= 3:1).
// "monocromo" existe pero sale con baja probabilidad (~5%).
function derivePalette(seed) {
  const s = String(seed == null ? '' : seed);
  const u = (salt) => seedUnit(s, salt);
  const mono = u(60) < 0.05;
  const scheme = mono ? 'monocromo' : PALETTE_SCHEMES[Math.min(PALETTE_SCHEMES.length - 1, Math.floor(u(61) * PALETTE_SCHEMES.length))];
  let hue1 = Math.floor(u(62) * 360);
  // Modo del fondo: claro (35%), oscuro (35%) o COLOR (30%): fondo saturado
  // de luminosidad media (p. ej. rojo, naranja, verde intenso). Antes solo
  // existían claro/oscuro y un fondo rojo era imposible.
  const modeRoll = u(63);
  const mode = mono ? (modeRoll < 0.5 ? 'claro' : 'oscuro') : (modeRoll < 0.35 ? 'claro' : (modeRoll < 0.7 ? 'oscuro' : 'color'));
  const colorBg = mode === 'color';
  const dark = mode === 'oscuro';
  const band = mono
    ? { name: 'neutra', min: 0.04, max: 0.12 }
    : PALETTE_SAT_BANDS[Math.min(2, Math.floor(u(64) * 3))];
  const sat = band.min + u(65) * (band.max - band.min);

  // Evita el look genérico "IA" púrpura->azul: un análogo en 250-290 se corre a cálidos.
  if (scheme === 'análogo' && hue1 >= 250 && hue1 <= 290) hue1 = (hue1 + 130) % 360;
  let offset = 0;
  if (scheme === 'complementario') offset = 180;
  else if (scheme === 'triádico') offset = 120;
  else if (scheme === 'análogo') offset = (u(66) < 0.5 ? 1 : -1) * (28 + u(67) * 20);
  else if (scheme === 'dividido') offset = 150;
  else if (scheme === 'duotono') offset = 60 + u(66) * 40;
  let hue2 = (hue1 + offset + 360) % 360;
  if (!mono && isPurpleBlueHue(hue1) && isPurpleBlueHue(hue2)) hue2 = (hue2 + 150) % 360;

  let bgHue = (scheme === 'duotono' && !colorBg) ? hue2 : hue1;
  // Un fondo violeta/índigo saturado es EL look genérico de IA (la guía lo
  // prohíbe): en modo color se corre a magenta-rojo o a azul-verdoso.
  if (colorBg && isPurpleBlueHue(bgHue)) bgHue = u(71) < 0.5 ? (bgHue + 75) % 360 : (bgHue - 70 + 360) % 360;
  let bgS;
  let bgL;
  if (colorBg) {
    bgS = 0.65 + u(70) * 0.3;            // 65–95%: color de verdad, no un tinte
    bgL = 0.38 + u(68) * 0.17;           // 38–55%: luminosidad media
  } else {
    bgS = mono ? sat : Math.min(dark ? 0.5 : 0.55, sat * (dark ? 0.7 : 0.6));
    bgL = dark ? 0.07 + u(68) * 0.05 : 0.93 + u(68) * 0.045;
  }
  const buildBg = () => ({
    bg: hslToHex(bgHue, bgS, bgL),
    surface: colorBg
      ? hslToHex(bgHue, bgS, Math.max(0, bgL - 0.07))
      : hslToHex(bgHue, bgS * (dark ? 1 : 0.7), dark ? bgL + 0.05 + u(69) * 0.02 : Math.min(0.995, bgL + 0.03)),
  });
  let { bg, surface } = buildBg();

  // Texto: empuja la luminosidad hacia el extremo hasta llegar a 7:1 contra
  // fondo Y superficie. En modo color, el texto va claro u oscuro según cuál
  // contraste más; si aun en el extremo no llega a 4.5, se corre el fondo
  // lo justo en la dirección opuesta al texto.
  const textHue = hue1;
  const tS = mono ? sat : Math.min(colorBg ? 0.25 : 0.4, sat * 0.5);
  const textRatio = (t) => Math.min(contrastRatio(t, bg), contrastRatio(t, surface));
  let lightText = dark;
  if (colorBg) lightText = textRatio(hslToHex(textHue, tS, 0.97)) >= textRatio(hslToHex(textHue, tS, 0.08));
  let tL = lightText ? 0.95 : 0.13;
  let text = hslToHex(textHue, tS, tL);
  while (textRatio(text) < PALETTE_TEXT_TARGET && tL > 0 && tL < 1) {
    tL += lightText ? 0.01 : -0.01;
    text = hslToHex(textHue, tS, Math.min(1, Math.max(0, tL)));
  }
  let guard = 0;
  while (colorBg && textRatio(text) < 4.5 && guard++ < 40) {
    bgL = Math.min(0.9, Math.max(0.08, bgL + (lightText ? -0.01 : 0.01)));
    ({ bg, surface } = buildBg());
  }

  // Acentos: mueven la luminosidad alejándose del fondo hasta el contraste
  // objetivo (en modo color, hacia el mismo lado que el texto).
  const accentUp = colorBg ? lightText : dark;
  const fitAccent = (hue, startL, sSat) => {
    let l = startL;
    let hex = hslToHex(hue, sSat, l);
    while (contrastRatio(hex, bg) < PALETTE_ACCENT_TARGET && l > 0.02 && l < 0.98) {
      l += accentUp ? 0.01 : -0.01;
      hex = hslToHex(hue, sSat, l);
    }
    return hex;
  };
  const aStart = colorBg ? (lightText ? 0.8 : 0.2) : (dark ? 0.62 : 0.44);
  const a2Start = colorBg ? (lightText ? 0.86 : 0.26) : (dark ? 0.72 : 0.54);
  // En modo color el acento principal usa el tono complementario/secundario
  // (el tono base ya es el fondo) y el segundo acento, un tercer tono.
  const accentHueMain = colorBg ? hue2 : hue1;
  const accentHue2 = colorBg ? (hue2 + 40) % 360 : hue2;
  const accent = fitAccent(accentHueMain, aStart, mono ? sat : Math.max(sat, 0.5));
  const accent2 = fitAccent(accentHue2, a2Start, mono ? sat : Math.max(sat * 0.9, 0.45));

  const r2 = (n) => Math.round(n * 100) / 100;
  return {
    bg, surface, text, accent, accent2, scheme, mode,
    name: `${scheme} ${mode}`,
    baseHue: hue1, accentHue: Math.round(accentHueMain), accent2Hue: Math.round(accentHue2), hueName: hueName(hue1),
    saturation: band.name,
    contrast: {
      text: r2(contrastRatio(text, bg)),
      accent: r2(contrastRatio(accent, bg)),
      accent2: r2(contrastRatio(accent2, bg)),
    },
  };
}

// Texto que viaja en el prompt (y del que paletteHexesOf extrae los hex).
function describePalette(p) {
  return `${p.name}: fondo ${p.bg}, superficie ${p.surface}, texto ${p.text}, acento ${p.accent}, acento 2 ${p.accent2}`;
}

// Rubro libre ("Otro…"): viaja por los mismos arrays de claves que los verticales
// listados, con el prefijo 'custom:' (así los helpers puros no cambian de firma).
const CUSTOM_VERTICAL_PREFIX = 'custom:';
const CUSTOM_VERTICAL_MAX = 80;

function cleanCustomVertical(text) {
  return String(text == null ? '' : text).replace(/\s+/g, ' ').trim().slice(0, CUSTOM_VERTICAL_MAX);
}

function withCustomVertical(verticalKeys, customText) {
  const keys = (verticalKeys || []).filter((k) => typeof k === 'string' && k.indexOf(CUSTOM_VERTICAL_PREFIX) !== 0);
  const c = cleanCustomVertical(customText);
  return c ? keys.concat([CUSTOM_VERTICAL_PREFIX + c]) : keys;
}

// Resuelve una clave a su entrada: listada -> conocimiento fijo; 'custom:X' -> pseudo-entrada sin conocimiento.
function resolveVerticalEntry(key) {
  if (typeof key === 'string' && key.indexOf(CUSTOM_VERTICAL_PREFIX) === 0) {
    const label = cleanCustomVertical(key.slice(CUSTOM_VERTICAL_PREFIX.length));
    return label ? { label, custom: true } : null;
  }
  return VERTICALS[key] || null;
}

function customVerticalInstruction(label) {
  return `Rubro declarado por quien encarga: «${label}». Inferí su psicología (motivaciones, objeciones, sesgos), sofisticación de mercado, señales de confianza, convenciones visuales a romper y restricciones negativas propias de ese rubro; no uses los genéricos.`;
}

const NO_VERTICAL_INSTRUCTION = 'No se declaró ningún rubro. Inferí el rubro, la psicología (motivaciones, objeciones, sesgos), la sofisticación de mercado, las señales de confianza, las convenciones visuales a romper y las restricciones negativas propias de ese rubro a partir de los datos del proyecto y de la «Descripción general»; no uses los genéricos.';

function synthesizeVerticals(verticalKeys) {
  const entries = (verticalKeys || []).map(resolveVerticalEntry).filter(Boolean);
  const known = entries.filter((v) => !v.custom);
  const customs = entries.filter((v) => v.custom);
  const mergeUnique = (getter) => {
    const seen = new Set();
    const out = [];
    known.forEach((v) => getter(v).forEach((item) => {
      if (!seen.has(item)) { seen.add(item); out.push(item); }
    }));
    return out;
  };
  const motivations = mergeUnique((v) => v.psychology.motivations);
  const objections = mergeUnique((v) => v.psychology.objections);
  const biases = mergeUnique((v) => v.psychology.biases);
  const dominantPatterns = mergeUnique((v) => v.market.dominantPatterns);
  const conventionsToBreak = mergeUnique((v) => v.market.conventionsToBreak);
  const trustSignals = mergeUnique((v) => v.trustSignals);
  const negativeConstraints = mergeUnique((v) => v.negativeConstraints);
  const sophistication = known.map((v) => v.market.sophistication).join(' | ')
    || (customs.length ? 'a inferir del rubro declarado' : 'sin datos de mercado: inferila del proyecto');
  const labels = entries.map((v) => v.label);
  const synthesisNote = entries.length > 1
    ? `Síntesis multi-vertical: este proyecto integra ${labels.join(' + ')} en un único contexto de negocio (no se tratan como bloques separados).`
    : '';
  const inferenceNotes = customs.map((v) => customVerticalInstruction(v.label));
  if (!entries.length) inferenceNotes.push(NO_VERTICAL_INSTRUCTION);
  return {
    motivations, objections, biases, dominantPatterns, conventionsToBreak,
    trustSignals, negativeConstraints, sophistication, labels, synthesisNote,
    customLabels: customs.map((v) => v.label), inferenceNotes,
  };
}

// Ejes de diseño de alto nivel (ver diagnóstico de "landings todas iguales"):
// cada eje tiene 5-8 alternativas sustanciales, compatibles con cualquier
// vertical. La semilla real (generateSeed) elige entre ellas vía pickIndex,
// así el modelo redactor del meta-prompt YA recibe una dirección concreta en
// vez de tener que "inventar" entropía que no tiene.
const DESIGN_AXES = {
  layoutParadigm: [
    'editorial de formato largo: columna de lectura central angosta, mucho scroll vertical, medios que interrumpen el texto',
    'split-screen persistente: dos columnas fijas (visual + contenido) que se mantienen mientras se scrollea',
    'grid asimétrico tipo revista: bloques de distinto tamaño, sin alinear a una grilla uniforme',
    'manifiesto de una sola columna: texto grande, casi sin imágenes, el ritmo tipográfico como protagonista',
    'catálogo/índice: estructura de lista o tabla navegable, orientada a comparar o encontrar rápido',
    'narrativa por capítulos: secciones numeradas tipo scrollytelling, cada una con su propio remate visual',
    'ficha técnica tipo dashboard: layout de paneles y datos, como una hoja de especificaciones',
    'scrollytelling pineado: una sección queda fija en pantalla mientras su contenido interno cambia con el scroll',
    'capítulos en scroll horizontal: el contenido avanza en X aunque el usuario siga scrolleando en vertical',
    'snapping de pantalla completa: cada sección ocupa el viewport entero y encastra al hacer scroll',
    'collage maximalista: capas superpuestas, tipografía y medios desbordando la grilla a propósito',
    'neo-brutalista: bloques crudos de alto contraste, tipografía enorme, estructura visible sin disimularse',
  ],
  heroArchetype: [
    'declaración tipográfica pura: sin imagen, un titular enorme hace todo el trabajo',
    'imagen a sangre completa (full-bleed) con texto superpuesto mínimo',
    'producto sobre fondo plano, foco total en el objeto o servicio sin contexto adicional',
    'split con datos: mitad copy, mitad cifra o comparación concreta',
    'hero que abre con una pregunta directa al usuario, sin mostrar la oferta todavía',
    'insinuación de configurador interactivo: el hero sugiere que se puede elegir o ajustar algo, aunque sea estático',
  ],
  // paletteFamily ya no es un eje fijo: la paleta sale de derivePalette(seed).
  typePairing: [
    'serif display (Fraunces o Playfair Display) para títulos + grotesk de texto (Inter o Public Sans)',
    'monoespaciada de titulares (Space Mono o JetBrains Mono) + humanista de texto (Source Sans 3)',
    'condensada de impacto (Barlow Condensed) para títulos + serif de lectura (Lora) para el cuerpo',
    'familia variable única (Inter o Work Sans) en todos los pesos, sin segunda familia',
    'slab sólida (Zilla Slab) para títulos + sans neutra (IBM Plex Sans) para el cuerpo',
    'display expresiva (Unbounded o Syne) para títulos + grotesk neutra (Inter o Public Sans) para el cuerpo',
    'geométrica extra bold de impacto (Anton o Rubik Mono One) para titulares + sans limpia (Work Sans) para el cuerpo',
    'Bricolage Grotesque variable en títulos y acentos + serif de lectura (Lora) para el cuerpo',
    'serif itálica expresiva (Playfair Display italic o Fraunces con ejes "wonk"/"opsz" activados) para titulares + monoespaciada técnica (JetBrains Mono) para datos y microcopy',
  ],
  narrativeAngle: [
    'proceso/oficio: cómo se hace, paso a paso',
    'historia de quien está detrás (fundador, equipo, artesano) y por qué',
    'datos y prueba primero: cifras y evidencia antes que discurso',
    'problema → solución clásico',
    'comparación directa frente a la alternativa o competencia',
    'manifiesto: una postura o creencia que sostiene la oferta',
  ],
  imageryTreatment: [
    'detalle macro del producto o servicio',
    'ilustración o diagrama esquemático, no fotografía',
    'solo tipografía, sin imágenes ni iconografía',
    'fotografía documental, sin poses de stock',
    'formas geométricas tipo CSS, sin imágenes reales',
  ],
  motionSignature: [
    'coreografiado por scroll: cada sección dispara su propia animación de entrada, nunca un fade genérico repetido',
    'scroll-linked intenso: parallax multicapa o escala/rotación atada al progreso del scroll, no solo opacidad',
    'hover + cursor-driven: interacciones ricas al pasar el mouse (magnetismo, distorsión, cursor a medida)',
    'cinético continuo: elementos con loop de movimiento propio (marquee, partículas, drift) además de las transiciones por scroll',
  ],
  // Ejes de espectáculo (override explícito de usuario sobre la sobriedad de
  // prompt.md: ver DOCUMENTACION.md "Modo espectáculo"). scrollExperience
  // elige DOS variantes distintas por página (ver buildCreativeDirection).
  scrollExperience: [
    'sección pineada con GSAP ScrollTrigger que scrubbea una línea de tiempo completa mientras el usuario scrollea',
    'galería horizontal que se desplaza en X pero se controla con scroll vertical (horizontal-scroll chapters)',
    'parallax de profundidad con 3 o más planos moviéndose a velocidades distintas',
    'revelado de texto palabra por palabra o línea por línea con máscara (mask reveal), disparado por scroll',
    'canvas de "video por scroll": secuencia de frames o dibujo procedural que avanza según el progreso del scroll',
    'capítulos a pantalla completa con scroll-snapping, una idea por pantalla',
    'animaciones nativas ligadas al scroll vía CSS (`animation-timeline: view()` o `scroll()`), sin JS de scroll',
  ],
  threeD: [
    'escena three.js con un objeto abstracto/low-poly relacionado al tema, que rota con el scroll o con el mouse',
    'tarjetas o paneles con transformaciones 3D en CSS puro (perspective, apilado de tarjetas, paneles que giran)',
    'fondo tipo shader animado en canvas/WebGL (ruido, ondas o gradiente en movimiento continuo)',
    'tarjetas con tilt 3D al mouse y brillo especular (specular highlight) que sigue al cursor',
  ],
  heroSpectacle: [
    'tipografía cinética: letras enormes que se separan, escalan o rotan, o texto partido (split text) animado en el hero',
    'campo de partículas que reacciona al cursor',
    'objeto 3D como protagonista del hero',
    'video o canvas scrubbeado por el scroll como fondo del hero',
    'ilustración SVG animada que se dibuja sola al cargar (stroke-dasharray)',
    'marquee de palabras gigantes en movimiento continuo',
  ],
  microInteractions: [
    'botones magnéticos que se atraen levemente hacia el cursor',
    'cursor personalizado con estela (trail) o mezcla (mix-blend-mode)',
    'distorsión o revelado de imagen al hacer hover',
    'contadores animados que suben hasta el valor final al entrar en el viewport',
    'entradas escalonadas (stagger) en listas y grillas',
  ],
  sectionTransitions: [
    'wipes con clip-path entre secciones consecutivas',
    'inundación de color (color-flood) al pasar de una sección a la siguiente',
    'apilado con solape sticky (sticky overlap stacking) entre secciones',
    'divisores SVG que mutan de forma (morphing) entre secciones',
  ],
  density: [
    'baja / airy (mucho espacio en blanco, pocos elementos por vista)',
    'media (equilibrio entre contenido y espacio)',
    'densa (alta cantidad de información por vista, tipo ficha técnica)',
  ],
  cornerBorderLanguage: [
    'esquinas vivas (0px) y bordes de 1px sólidos',
    'esquinas levemente redondeadas (4-6px), sin sombra',
    'esquinas muy redondeadas (16px o más) solo en elementos puntuales, no en todo',
    'sin bordes visibles: la separación es solo espacio y color',
  ],
  ctaStyle: [
    'botón sólido de alto contraste, esquinas vivas',
    'CTA como texto subrayado o enlace grande, sin botón tradicional',
    'botón con borde (outline), sin relleno',
    'CTA integrado al copy: una frase completa es el elemento clickeable, no una etiqueta corta',
  ],
  sectionArchetypePool: [
    'tabla de especificaciones', 'línea de tiempo', 'comparación directa',
    'preguntas frecuentes', 'galería', 'tira de prueba social continua',
    'pasos de proceso', 'muro de citas o testimonios',
  ],
};

// Eje "paradigma de interacción" (técnica 2 · concepto rector, salt 80): la
// página ES algo del mundo del cliente y tiene su propia forma de navegarse.
// Solo se usa con la técnica 2 activa; sin ella no aparece en ningún prompt.
const INTERACTION_PARADIGMS = [
  { key: 'objeto-interfaz', label: 'Objeto-interfaz', desc: 'la página ES un objeto del rubro; sus partes son las secciones',
    is: 'un objeto emblemático del mundo de «{tema}» (el que el cliente reconocería con los ojos cerrados), y cada sección es una de sus partes', zone: 'parte',
    nav: 'se gira, se abre y se recorre el objeto pieza por pieza (arrastrar, girar una corona/perilla, tocar cada parte para acercarse); el scroll vertical es solo un apoyo secundario',
    sig: 'el objeto entero se despliega o se arma pieza por pieza al entrar, y cada parte se acerca al tocarla' },
  { key: 'juego', label: 'Juego', desc: 'se recorre jugando',
    is: 'un juego ambientado en el mundo de «{tema}», donde cada sección es un nivel o una misión', zone: 'nivel',
    nav: 'se avanza jugando: mover un personaje o cursor, resolver una mecánica corta por nivel y desbloquear el siguiente',
    sig: 'una mecánica jugable en la primera pantalla que enseña la oferta mientras se juega' },
  { key: 'escritorio', label: 'Sistema operativo / escritorio', desc: 'ventanas, íconos, terminal',
    is: 'un escritorio de sistema operativo del mundo de «{tema}», con ventanas, íconos y una terminal, donde cada sección es una aplicación o ventana', zone: 'ventana',
    nav: 'se navega abriendo, arrastrando y cerrando ventanas desde íconos y una barra de tareas, o escribiendo comandos en una terminal',
    sig: 'un arranque del sistema (boot) que termina en el escritorio con la ventana de bienvenida abierta' },
  { key: 'plano-espacio', label: 'Plano o espacio explorable', desc: 'plano arquitectónico, mapa, casa o escena 3D con zoom por ambientes',
    is: 'un plano o espacio explorable de «{tema}» (plano arquitectónico, mapa o escena 3D), donde cada sección es un ambiente o zona', zone: 'ambiente',
    nav: 'se explora el espacio: zoom, paneo y arrastre de cámara, y un toque en cada ambiente hace foco y muestra su contenido',
    sig: 'la cámara vuela del plano completo al ambiente elegido con un zoom continuo' },
  { key: 'instrumento', label: 'Instrumento o máquina', desc: 'consola, tablero, mecanismo que se opera',
    is: 'un instrumento o máquina del mundo de «{tema}» (consola, tablero o mecanismo), donde cada sección es un módulo que se opera', zone: 'módulo',
    nav: 'se opera con controles (perillas, palancas, selectores, sliders) que reconfiguran el instrumento y revelan cada módulo',
    sig: 'un control principal (perilla o palanca) que al accionarse cambia todo el instrumento con respuesta física'},
  { key: 'documento-fisico', label: 'Documento físico', desc: 'expediente, catálogo impreso, mapa que se despliega, libro',
    is: 'un documento físico del mundo de «{tema}» (expediente, catálogo impreso, mapa plegado o libro), donde cada sección es una página, pliegue o ficha', zone: 'pliegue',
    nav: 'se hojea, se despliega y se voltea: arrastrar esquinas, abrir solapas y pasar páginas en lugar de bajar por la página',
    sig: 'el documento se abre o se despliega en 3D revelando su contenido' },
  { key: 'simulacion', label: 'Simulación / laboratorio', desc: 'el producto funcionando en vivo',
    is: 'un laboratorio o simulador de «{tema}» donde el producto funciona en vivo y cada sección es un experimento o escenario', zone: 'escenario',
    nav: 'se experimenta: mover parámetros, elegir escenarios y ver el resultado en vivo; cada escenario abre una sección',
    sig: 'un simulador con controles que muestra el resultado del producto en tiempo real' },
  { key: 'recorrido-decisiones', label: 'Recorrido por decisiones', desc: 'recorrido narrativo por decisiones (no por scroll)',
    is: 'un recorrido narrativo por decisiones ambientado en «{tema}», donde cada sección es una escena que depende de lo que el visitante elige', zone: 'decisión',
    nav: 'se avanza eligiendo: en cada escena el visitante toma una decisión que lleva a la siguiente, sin scroll vertical clásico',
    sig: 'la primera decisión, que plantea el dilema central del visitante y lo mete en la historia' },
];
DESIGN_AXES.interactionParadigm = INTERACTION_PARADIGMS.map((p) => `${p.label}: ${p.desc}`);

function pickFrom(seed, dimensionSalt, options) {
  return options[pickIndex(seed, dimensionSalt, options.length)];
}

// Estructuras de página que sortea la semilla (salt 2). Las 3 primeras son
// las clásicas (hero de apertura, CTA al cierre); el resto rompe la
// convención a propósito: sin hero, hero enterrado a mitad de página, página
// invertida, CTA en el centro… 3 de 9 son clásicas → ~67% de estructuras
// fuera de lo común. Solo se usan claves de SECTION_LABELS.
const SECTION_STRUCTURES = [
  { order: ['hero', 'problema-solucion', 'prueba-social', 'caracteristicas', 'objeciones', 'cta-final'], concepto: 'clásica: hero de apertura, desarrollo y cierre con el CTA principal' },
  { order: ['hero', 'caracteristicas', 'prueba-social', 'problema-solucion', 'objeciones', 'cta-final'], concepto: 'clásica orientada a producto: hero, oferta enseguida y cierre con CTA' },
  { order: ['hero', 'objeciones', 'problema-solucion', 'caracteristicas', 'prueba-social', 'cta-final'], concepto: 'clásica defensiva: hero y, acto seguido, la objeción principal respondida' },
  { order: ['problema-solucion', 'caracteristicas', 'prueba-social', 'objeciones', 'cta-final'], concepto: 'SIN HERO: la página arranca en medio del problema, como si el visitante hubiera llegado tarde a una conversación; no hay portada ni titular de bienvenida, la primera pantalla ya es contenido' },
  { order: ['prueba-social', 'problema-solucion', 'hero', 'caracteristicas', 'objeciones', 'cta-final'], concepto: 'HERO ENTERRADO: abre con evidencia cruda (voces, datos, testimonios) sin presentación; el hero aparece recién en el tercer acto como revelación, a pantalla completa' },
  { order: ['objeciones', 'prueba-social', 'caracteristicas', 'hero', 'cta-final'], concepto: 'CONTRAARGUMENTO PRIMERO: la primera pantalla responde la objeción que el visitante todavía no dijo; el hero llega casi al final como clímax previo al cierre' },
  { order: ['cta-final', 'problema-solucion', 'caracteristicas', 'prueba-social', 'objeciones', 'hero'], concepto: 'INVERTIDA: empieza por la acción (el CTA es lo primero que se ve) y termina en el hero, que funciona como firma o epílogo; el CTA se repite discretamente al final' },
  { order: ['caracteristicas', 'hero', 'objeciones', 'prueba-social', 'problema-solucion', 'cta-final'], concepto: 'PRODUCTO A QUEMARROPA: la oferta sin introducción; el hero interrumpe en el segundo acto como una pausa cinematográfica que corta el scroll' },
  { order: ['problema-solucion', 'hero', 'cta-final', 'objeciones', 'prueba-social', 'caracteristicas'], concepto: 'CIERRE A MITAD DE PÁGINA: el CTA principal está en el centro; todo lo que sigue es profundización para quien todavía duda, en orden decreciente de urgencia' },
];

function sectionStructureOf(order) {
  const key = (order || []).join('|');
  return SECTION_STRUCTURES.find((s) => s.order.join('|') === key) || null;
}

// Texto para el redactor y la plantilla: orden exacto + intención + qué
// hacer con el arquetipo de hero cuando no hay hero o no va primero.
function describeSectionStructure(creativeDirection) {
  const order = (creativeDirection && creativeDirection.sectionOrder) || [];
  const s = sectionStructureOf(order);
  const labels = order.map((k) => SECTION_LABELS[k] || k).join(' → ');
  const lines = [`Estructura de página (orden obligatorio): ${labels}. Intención: ${s ? s.concepto : 'orden sorteado'}.`];
  const heroPos = order.indexOf('hero');
  if (heroPos === -1) {
    lines.push('No hay sección Hero: el arquetipo de hero y el set piece de apertura se aplican a la PRIMERA sección tal como es (no inventes una portada de bienvenida).');
  } else if (heroPos > 0) {
    lines.push(`El Hero NO va primero (posición ${heroPos + 1} de ${order.length}): la página abre sin portada y el hero aparece donde nadie lo espera; tratalo como un momento de ruptura en el scroll.`);
  }
  return lines.join(' ');
}

function buildCreativeDirection(seed, verticalCtx) {
  const motivations = verticalCtx.motivations.length ? verticalCtx.motivations : ['confianza general en la oferta'];
  const leadMotivation = motivations[pickIndex(seed, 1, motivations.length)];

  const sectionOrder = SECTION_STRUCTURES[pickIndex(seed, 2, SECTION_STRUCTURES.length)].order.slice();

  const heroComposition = pickFrom(seed, 3, DESIGN_AXES.heroArchetype);
  const typography = pickFrom(seed, 4, DESIGN_AXES.typePairing);
  const density = pickFrom(seed, 5, DESIGN_AXES.density);

  // El contraste se expresa DENTRO de la paleta derivada (derivePalette).
  // Antes decía "alto (blancos y negros…)": el 50% de las veces contradecía
  // la paleta y el redactor lo resolvía volviéndose monocromo (3 landings
  // seguidas en blanco y negro).
  const contrasts = [
    'alto (máxima separación entre el fondo, el texto y el acento de la paleta derivada; el acento se usa saturado)',
    'moderado (variaciones tonales de la paleta derivada, con el acento reservado para los puntos de acción)',
  ];
  const contrast = contrasts[pickIndex(seed, 6, contrasts.length)];

  const copyVoices = [
    'directa y técnica',
    'cercana y aspiracional, sin exagerar',
    'minimalista y editorial',
  ];
  const copyVoice = copyVoices[pickIndex(seed, 7, copyVoices.length)];

  const vConstraints = verticalCtx.negativeConstraints;
  let emphasizedConstraints = [];
  if (vConstraints.length) {
    const count = Math.min(3, vConstraints.length);
    const startIdx = pickIndex(seed, 8, vConstraints.length);
    for (let i = 0; i < count; i++) emphasizedConstraints.push(vConstraints[(startIdx + i) % vConstraints.length]);
  }

  // Ejes nuevos (fix de diversidad): ver DESIGN_AXES arriba. Salts 30+ para
  // no colisionar con los ya usados (1-8 acá, 20-22 en resolveTechConflicts).
  const layoutParadigm = pickFrom(seed, 30, DESIGN_AXES.layoutParadigm);
  const heroArchetype = heroComposition;
  const palette = derivePalette(seed);
  const paletteFamily = describePalette(palette);
  const typePairing = typography;
  const narrativeAngle = pickFrom(seed, 34, DESIGN_AXES.narrativeAngle);
  const imageryTreatment = pickFrom(seed, 35, DESIGN_AXES.imageryTreatment);
  const motionSignature = pickFrom(seed, 36, DESIGN_AXES.motionSignature);
  const cornerBorderLanguage = pickFrom(seed, 37, DESIGN_AXES.cornerBorderLanguage);
  const ctaStyle = pickFrom(seed, 38, DESIGN_AXES.ctaStyle);
  const sectionArchetypeCount = 1 + pickIndex(seed, 40, 3); // 1..3
  const poolLen = DESIGN_AXES.sectionArchetypePool.length;
  const secStart = pickIndex(seed, 41, poolLen);
  const sectionArchetypes = [];
  for (let i = 0; i < sectionArchetypeCount; i++) {
    sectionArchetypes.push(DESIGN_AXES.sectionArchetypePool[(secStart + i) % poolLen]);
  }

  // Ejes de espectáculo (Modo espectáculo — ver DOCUMENTACION.md). Salts 50+
  // para no colisionar con nada anterior. scrollExperience elige DOS
  // variantes DISTINTAS entre sí (una para un set piece temprano, otra para
  // uno tardío): índice A + offset garantizado no-cero módulo largo.
  const scrollPool = DESIGN_AXES.scrollExperience;
  const scrollIdxA = pickIndex(seed, 50, scrollPool.length);
  const scrollOffset = 1 + pickIndex(seed, 51, scrollPool.length - 1);
  const scrollIdxB = (scrollIdxA + scrollOffset) % scrollPool.length;
  const scrollExperience = [scrollPool[scrollIdxA], scrollPool[scrollIdxB]];
  const threeD = pickFrom(seed, 52, DESIGN_AXES.threeD);
  const heroSpectacle = pickFrom(seed, 53, DESIGN_AXES.heroSpectacle);
  const microInteractions = pickFrom(seed, 54, DESIGN_AXES.microInteractions);
  const sectionTransitions = pickFrom(seed, 55, DESIGN_AXES.sectionTransitions);
  // Técnica 2 (concepto rector): paradigma de interacción sorteado (salt 80).
  const paradigmIdx = pickIndex(seed, 80, INTERACTION_PARADIGMS.length);
  const interactionParadigm = DESIGN_AXES.interactionParadigm[paradigmIdx];
  const interactionParadigmKey = INTERACTION_PARADIGMS[paradigmIdx].key;

  return {
    leadMotivation, sectionOrder, heroComposition, typography, density,
    contrast, copyVoice, emphasizedConstraints,
    layoutParadigm, heroArchetype, paletteFamily, palette, typePairing, narrativeAngle,
    imageryTreatment, motionSignature, cornerBorderLanguage, ctaStyle,
    sectionArchetypes,
    scrollExperience, threeD, heroSpectacle, microInteractions, sectionTransitions,
    interactionParadigm, interactionParadigmKey,
  };
}

/* =========================================================================
 * 2. ARQUITECTURA DE PÁGINA (Prompt Ambicioso + Diseño Sustractivo)
 * ========================================================================= */

function defineSections(project, verticalCtx, creativeDirection) {
  return {
    hero: {
      objetivo: 'Comunicar la oferta y activar la motivación líder en los primeros segundos.',
      informacion: `${project.tema} — ${project.oferta}`,
      funcionPsicologica: `Activar la motivación líder detectada: ${creativeDirection.leadMotivation}.`,
      copy: 'Titular concreto sobre la oferta real; subtítulo que precisa a quién sirve y qué resuelve.',
      elementoVisual: `Composición ${creativeDirection.heroComposition}`,
      cta: 'CTA principal alineado al objetivo de conversión.',
      relacionSiguiente: 'Da el motivo para seguir leyendo: el problema o el beneficio central.',
      animacion: `${creativeDirection.heroSpectacle} — trigger: carga de página (load); con prefers-reduced-motion, versión estática igual de contundente.`,
      mandatory: true,
    },
    'problema-solucion': {
      objetivo: 'Mostrar que se entiende el problema real del usuario antes de listar características.',
      informacion: `Objeciones a atender: ${verticalCtx.objections.slice(0, 2).join('; ') || 'sin objeción crítica identificada'}.`,
      funcionPsicologica: 'Reducir la fricción inicial mostrando comprensión del contexto del usuario.',
      copy: 'Describir el problema en los términos del usuario, no en los términos del producto.',
      elementoVisual: 'Imagen o captura que represente el momento del problema, no el logo.',
      cta: 'Ninguno (sección de comprensión, no de conversión).',
      relacionSiguiente: 'Conecta el problema descrito con las características que lo resuelven.',
      animacion: `${creativeDirection.scrollExperience[0]} — trigger: scroll.`,
      mandatory: verticalCtx.objections.length > 0,
    },
    caracteristicas: {
      objetivo: 'Explicar qué incluye la oferta y por qué resuelve el problema planteado.',
      informacion: `${project.oferta}${project.propuestaValor ? ' — ' + project.propuestaValor : ''}`,
      funcionPsicologica: 'Construir confianza mediante concreción, evitando la lista genérica de features.',
      copy: 'Cada característica enunciada junto al beneficio concreto que produce.',
      elementoVisual: 'Detalle real del producto o servicio, no iconografía decorativa sin relación.',
      cta: 'CTA secundario opcional si el objetivo lo justifica.',
      relacionSiguiente: 'Prepara la validación externa (prueba social) o la resolución de objeciones.',
      animacion: `${creativeDirection.microInteractions} — trigger: hover / entrada en viewport (stagger).`,
      mandatory: true,
    },
    'prueba-social': {
      objetivo: 'Validar externamente la promesa hecha en el hero y en la oferta.',
      informacion: `Señales de confianza disponibles: ${verticalCtx.trustSignals.join('; ') || 'ninguna señal de confianza específica'}.`,
      funcionPsicologica: 'Activar el sesgo de prueba social detectado como relevante en el vertical.',
      copy: 'Cifras o testimonios verificables; nunca genéricos ni anónimos.',
      elementoVisual: 'Elemento de validación real (reseña, logo de cliente, certificación) según el vertical.',
      cta: 'Ninguno.',
      relacionSiguiente: 'Da paso a resolver la objeción restante antes del cierre.',
      animacion: `${creativeDirection.sectionTransitions} — trigger: transición de entrada hacia esta sección.`,
      mandatory: verticalCtx.biases.some((b) => b.indexOf('prueba social') !== -1) && verticalCtx.trustSignals.length > 0,
    },
    objeciones: {
      objetivo: 'Neutralizar la objeción principal antes del cierre.',
      informacion: `Objeción principal: ${verticalCtx.objections[0] || 'sin objeción crítica identificada'}.`,
      funcionPsicologica: 'Reducir la fricción de decisión final.',
      copy: 'Responder la objeción de forma directa, sin minimizarla ni ignorarla.',
      elementoVisual: 'Elemento de respaldo (garantía, política, dato concreto).',
      cta: 'Ninguno.',
      relacionSiguiente: 'Elimina la última barrera antes del CTA final.',
      animacion: `${creativeDirection.scrollExperience[1]} — trigger: scroll.`,
      mandatory: verticalCtx.objections.length > 0,
    },
    'cta-final': {
      objetivo: `Concretar el objetivo de conversión: ${project.objetivo}.`,
      informacion: 'Resumen de la oferta en una frase, sin repetir todo el contenido previo.',
      funcionPsicologica: 'Facilitar la decisión final reduciendo la fricción restante.',
      copy: 'CTA único, específico a la acción esperada (evitar un CTA genérico).',
      elementoVisual: 'Mínimo, sin competir con el CTA.',
      cta: `CTA principal: ${project.objetivo}.`,
      relacionSiguiente: 'Cierre de página; no hay sección siguiente.',
      animacion: 'Micro-interacción en el CTA (magnetismo o glow al hover) — trigger: hover/focus, con estado de foco visible siempre presente.',
      mandatory: true,
    },
  };
}

function buildPageArchitecture(project, verticalCtx, creativeDirection) {
  const defs = defineSections(project, verticalCtx, creativeDirection);
  const included = [];
  const excluded = [];
  creativeDirection.sectionOrder.forEach((key) => {
    const def = defs[key];
    if (!def) return;
    if (def.mandatory) {
      included.push(Object.assign({ key, nombre: SECTION_LABELS[key] }, def));
    } else {
      excluded.push({
        key,
        nombre: SECTION_LABELS[key],
        motivo: 'No hay datos del proyecto que justifiquen esta sección (diseño sustractivo).',
      });
    }
  });
  return { included, excluded };
}

/* =========================================================================
 * 3. RESOLUCIÓN DE CONFLICTOS ENTRE TECNOLOGÍAS (prompt combinado)
 * ========================================================================= */

function describeResolution(primaryKey, secondaryKey) {
  const primary = TECHNOLOGIES[primaryKey].label;
  const secondary = TECHNOLOGIES[secondaryKey].label;
  if (primaryKey === 'tailwind' || secondaryKey === 'tailwind') {
    return `Conflicto entre Tailwind CSS y Bootstrap: ambos definen un sistema de utilidades y componentes propio y no deben convivir como base de estilos. Resolución: ${primary} queda como sistema de estilos único de la página; se descarta ${secondary} para evitar clases y resets contradictorios.`;
  }
  if (primaryKey === 'react' || secondaryKey === 'react') {
    if (primaryKey === 'vue' || secondaryKey === 'vue') {
      return `Conflicto entre React y Vue: son dos frameworks de componentes que no pueden coexistir en el mismo árbol de render. Resolución: la interfaz completa se construye en ${primary}; se descarta ${secondary} para mantener una única arquitectura de componentes.`;
    }
  }
  return `Conflicto entre ${primary} y ${secondary}: se conserva ${primary} y se descarta ${secondary} para mantener una arquitectura técnica única.`;
}

function resolveTechConflicts(technologies, seed) {
  const expanded = new Set(technologies);
  technologies.forEach((t) => {
    const tech = TECHNOLOGIES[t];
    if (tech && tech.implies) tech.implies.forEach((i) => expanded.add(i));
  });
  const list = Array.from(expanded).filter((t) => TECHNOLOGIES[t]);
  const resolutions = [];
  const discarded = new Set();
  const checked = new Set();

  list.forEach((a) => {
    const tech = TECHNOLOGIES[a];
    (tech.conflicts || []).forEach((b) => {
      if (!list.includes(b)) return;
      if (discarded.has(a) || discarded.has(b)) return;
      const pair = [a, b].sort();
      const key = pair.join('|');
      if (checked.has(key)) return;
      checked.add(key);
      const dimSalt = key === 'bootstrap|tailwind' ? 20 : key === 'react|vue' ? 21 : 22;
      const idx = pickIndex(seed, dimSalt, 2);
      const primary = pair[idx];
      const secondary = pair[1 - idx];
      discarded.add(secondary);
      resolutions.push(describeResolution(primary, secondary));
    });
  });

  const finalTechs = list.filter((t) => !discarded.has(t));
  return { finalTechs, resolutions, discarded: Array.from(discarded) };
}

/* =========================================================================
 * 4. BLOQUES DE TEXTO DEL PROMPT (16 encabezados en español)
 * ========================================================================= */

function bulletList(items) {
  return items.map((i) => `- ${i}`).join('\n');
}

function buildRolBlock(techLabels) {
  return `Sos un ingeniero frontend senior especializado en landing pages de alto rendimiento. Implementás en ${techLabels.join(' + ')}. Tu única salida es el documento descrito en SALIDA FINAL: no expliques tu proceso ni agregues comentarios fuera del código, salvo los indicados explícitamente.`;
}

function buildContextoBlock(project, verticalCtx) {
  const lines = [];
  lines.push(`Proyecto: ${project.tema}.`);
  lines.push(`Oferta concreta: ${project.oferta}.`);
  if (project.descripcion) lines.push(`Contexto del proyecto: ${truncateDescripcion(project.descripcion, 400)}`);
  if (project.propuestaValor) lines.push(`Propuesta de valor declarada: ${project.propuestaValor}.`);
  lines.push(`Competencia directa: ${project.competidores}.`);
  if (verticalCtx.synthesisNote) lines.push(verticalCtx.synthesisNote);
  (verticalCtx.inferenceNotes || []).forEach((n) => lines.push(n));
  return lines.join('\n');
}

function buildUsuarioBlock(project, verticalCtx, ambitious) {
  const deep = ambitious !== false; // técnica 2 apagada => bloque conciso
  const lines = [];
  lines.push(`Audiencia: ${project.publico}.`);
  if (deep) lines.push(`Nivel de sofisticación de mercado de esta audiencia: ${verticalCtx.sophistication}.`);
  if (verticalCtx.objections.length) lines.push(`Frustraciones y objeciones esperables: ${(deep ? verticalCtx.objections : verticalCtx.objections.slice(0, 2)).join('; ')}.`);
  if (project.tono) lines.push(`Tono solicitado: ${project.tono}.`);
  return lines.join('\n');
}

function buildObjetivoNegocioBlock(project) {
  return `Objetivo de negocio: ${project.objetivo}. Oferta que lo sostiene: ${project.oferta}.`;
}

function buildObjetivoConversionBlock(project, creativeDirection) {
  const lastKey = creativeDirection.sectionOrder[creativeDirection.sectionOrder.length - 1];
  const lines = [];
  lines.push(`Objetivo principal de conversión: ${project.objetivo}.`);
  lines.push('Fricción a eliminar: cualquier paso, campo o decisión que no sea indispensable para completar ese objetivo.');
  lines.push('Microconversiones válidas antes del CTA final: scroll a la sección de oferta, interacción con el detalle del producto o servicio, lectura de la resolución de la objeción principal.');
  const order = creativeDirection.sectionOrder;
  const ctaPos = order.indexOf('cta-final');
  const ctaWhere = ctaPos === order.length - 1
    ? `al cierre de la página (sección "${SECTION_LABELS[lastKey]}")`
    : `en la sección "${SECTION_LABELS['cta-final']}", posición ${ctaPos + 1} de ${order.length} (la estructura lo ubica ahí a propósito)`;
  const heroRef = order.indexOf('hero') !== -1 ? ', reforzado por un CTA equivalente en el hero' : '';
  lines.push(`Momento del CTA principal: ${ctaWhere}${heroRef}.`);
  lines.push(describeSectionStructure(creativeDirection));
  return lines.join('\n');
}

function deriveEmotionalResponse(creativeDirection) {
  return creativeDirection.contrast.indexOf('alto') === 0
    ? 'confianza firme y decidida, sin urgencia artificial'
    : 'calma y confianza progresiva a medida que se resuelve cada objeción';
}

function buildPsicologiaBlock(verticalCtx, creativeDirection, ambitious) {
  const lines = [];
  lines.push(`Motivación líder de esta ejecución: ${creativeDirection.leadMotivation}.`);
  if (ambitious === false) {
    if (verticalCtx.objections.length) lines.push(`Objeción principal a neutralizar: ${verticalCtx.objections[0]}.`);
    lines.push(`Respuesta emocional deseada: ${deriveEmotionalResponse(creativeDirection)}.`);
    return lines.join('\n');
  }
  const otherMotivations = verticalCtx.motivations.filter((m) => m !== creativeDirection.leadMotivation);
  if (otherMotivations.length) lines.push(`Otras motivaciones relevantes: ${otherMotivations.join('; ')}.`);
  if (verticalCtx.objections.length) lines.push(`Objeciones a neutralizar: ${verticalCtx.objections.join('; ')}.`);
  if (verticalCtx.biases.length) lines.push(`Sesgos cognitivos pertinentes: ${verticalCtx.biases.join('; ')}.`);
  lines.push(`Respuesta emocional deseada: ${deriveEmotionalResponse(creativeDirection)}.`);
  return lines.join('\n');
}

function buildMercadoBlock(verticalCtx, project, ambitious) {
  const lines = [];
  if (ambitious === false) {
    lines.push(`Competencia directa mencionada: ${project.competidores}.`);
    if (verticalCtx.conventionsToBreak.length) lines.push(`Convención a romper: ${verticalCtx.conventionsToBreak[0]}.`);
    return lines.join('\n');
  }
  lines.push(`Sofisticación del mercado: ${verticalCtx.sophistication}.`);
  if (verticalCtx.dominantPatterns.length) lines.push(`Patrones visuales predominantes en la categoría: ${verticalCtx.dominantPatterns.join('; ')}.`);
  lines.push(`Competencia directa mencionada: ${project.competidores}.`);
  if (verticalCtx.conventionsToBreak.length) lines.push(`Convenciones que conviene romper frente a esa competencia: ${verticalCtx.conventionsToBreak.join('; ')}.`);
  return lines.join('\n');
}

// Modo espectáculo (override explícito de usuario sobre prompt.md — ver
// DOCUMENTACION.md): la coreografía de movimiento tiene que quedar explícita
// y concreta (qué anima, trigger, duración/easing, librería, fallback de
// accesibilidad), nunca como una mención vaga de "animaciones sutiles".
function buildCoreografiaMovimientoBlock(creativeDirection) {
  const cd = creativeDirection;
  return [
    'Coreografía de movimiento (una línea por pieza: qué anima · trigger · duración/easing · librería · fallback):',
    `- Firma del hero: ${cd.heroSpectacle}. Carga de página · 0.8-1.4s "power3.out" · GSAP (o CSS puro) · con prefers-reduced-motion, estado final sin animar.`,
    `- Set piece de scroll #1: ${cd.scrollExperience[0]}. Scrubbed por progreso de scroll (no reveal único) · GSAP ScrollTrigger o \`animation-timeline: scroll()/view()\` · legible y en posición final sin motion.`,
    `- Set piece de scroll #2: ${cd.scrollExperience[1]}. Progreso de scroll · misma librería y fallback que #1.`,
    `- Elemento 3D: ${cd.threeD}. Scroll y/o mouse · three.js r128 (global \`THREE\`) o transform 3D en CSS · pausar con IntersectionObserver fuera del viewport, devicePixelRatio ≤ 2 · fallback: composición estática si no hay WebGL o con prefers-reduced-motion.`,
    `- Transición entre secciones: ${cd.sectionTransitions}. Entrada en viewport · 0.4-0.8s, easing suave.`,
    `- Micro-interacciones: ${cd.microInteractions}, sobre todo en los CTA. Hover/focus/scroll · con foco visible por teclado siempre.`,
    'Regla transversal: animar solo `transform` y `opacity`; con `prefers-reduced-motion: reduce` se desactiva todo sin dejar la página vacía o rota.',
  ].join('\n');
}

function buildDireccionVisualBlock(creativeDirection, project) {
  const lines = [];
  lines.push(`Paradigma de layout: ${creativeDirection.layoutParadigm}.`);
  lines.push(`Arquetipo de hero: ${creativeDirection.heroArchetype}.`);
  const pal = creativeDirection.palette;
  if (pal) {
    lines.push(`Paleta (${pal.name}, hex exactos, ya cumplen contraste AA):`);
    lines.push(`- Fondo: ${pal.bg}`);
    lines.push(`- Superficie: ${pal.surface}`);
    lines.push(`- Texto: ${pal.text} (${pal.contrast.text}:1)`);
    lines.push(`- Acento: ${pal.accent} (${pal.contrast.accent}:1)`);
    lines.push(`- Acento 2: ${pal.accent2} (${pal.contrast.accent2}:1)`);
  } else {
    lines.push(`Paleta (fijada por la dirección creativa, no cambiar de familia): ${creativeDirection.paletteFamily}.`);
  }
  lines.push(`Pareja tipográfica: ${creativeDirection.typePairing}.`);
  lines.push(`Densidad informativa: ${creativeDirection.density}.`);
  lines.push(`Contraste: ${creativeDirection.contrast}.`);
  lines.push(`Ángulo narrativo: ${creativeDirection.narrativeAngle}.`);
  lines.push(`Tratamiento de imágenes: ${creativeDirection.imageryTreatment}.`);
  lines.push(`Firma de movimiento: ${creativeDirection.motionSignature}.`);
  lines.push(`Lenguaje de bordes/esquinas: ${creativeDirection.cornerBorderLanguage}.`);
  lines.push(`Estilo de CTA: ${creativeDirection.ctaStyle}.`);
  lines.push(`Voz de copy: ${creativeDirection.copyVoice}.`);
  if (creativeDirection.sectionArchetypes && creativeDirection.sectionArchetypes.length) {
    lines.push(`Bloques narrativos extra (opcionales): ${creativeDirection.sectionArchetypes.join(', ')}.`);
  }
  if (project.referenciasVisuales) lines.push(`Referencia visual aportada por quien encargó el proyecto (usar como tono, no copiar literalmente): ${project.referenciasVisuales}.`);
  lines.push('');
  lines.push('Ambición visual mínima (no negociable, Modo espectáculo): nivel Awwwards, no plantilla. Mínimo: momento de firma en el hero, 2 set pieces de scroll, 1 elemento 3D, 1 transición de sección con carácter y micro-interacciones en los CTA.');
  lines.push('');
  lines.push(buildCoreografiaMovimientoBlock(creativeDirection));
  return lines.join('\n');
}

// Marca literal que queda en el prompt final. NO se reemplaza al escribir o
// generar el prompt: se sustituye recién en cada EJECUCIÓN (executeCurrent),
// por una cadena fresca distinta cada vez -así "Ejecutar"/"Regenerar" varían
// las decisiones abiertas que deja el prompt, en vez de repetir siempre lo
// mismo. Ver DOCUMENTACION.md §4.
const SSOT_TOKEN = '{{SSOT_SEED}}';

function substituteSeedToken(text, seed) {
  return String(text || '').split(SSOT_TOKEN).join(seed);
}

function buildSSoTBlock() {
  return [
    `Tu cadena semilla es exactamente esta; no la reemplaces ni generes otra: ${SSOT_TOKEN}`,
    'Manipulala (suma módulo sobre tramos, hashing, muestreo de caracteres) para decidir entre alternativas SUSTANCIALES que este documento deja abiertas: acentos secundarios, escala tipográfica exacta, micro-composición del hero, tratamiento visual de cada sección, matiz de voz, motivos ilustrativos; no la uses para trivia (bordes, sombras, espaciados). Construí una única solución coherente, no una lista de opciones.',
    'Objetivo, accesibilidad, requisitos técnicos y restricciones permanecen intactos. No expongas la cadena ni tu razonamiento sobre ella.',
  ].join('\n');
}

function buildArquitecturaBlock(included, ambitious) {
  if (ambitious === false) {
    // Técnica 2 apagada: por sección solo lo esencial, en una línea cada uno.
    return included.map((s, i) => (
      `${i + 1}. ${s.nombre}\n`
      + `   - Objetivo: ${s.objetivo}\n`
      + `   - Copy: ${s.copy}\n`
      + `   - Elemento visual: ${s.elementoVisual}\n`
      + `   - Animación / interacción: ${s.animacion || 'reveal por scroll acorde a la Dirección Visual.'}\n`
      + `   - CTA: ${s.cta}`
    )).join('\n\n');
  }
  return included.map((s, i) => (
    `${i + 1}. ${s.nombre}\n`
    + `   - Objetivo: ${s.objetivo}\n`
    + `   - Información: ${s.informacion}\n`
    + `   - Función psicológica: ${s.funcionPsicologica}\n`
    + `   - Copy: ${s.copy}\n`
    + `   - Elemento visual: ${s.elementoVisual}\n`
    + `   - Animación / interacción: ${s.animacion || 'reveal por scroll acorde a la Dirección Visual.'}\n`
    + `   - CTA: ${s.cta}\n`
    + `   - Relación con la siguiente sección: ${s.relacionSiguiente}`
  )).join('\n\n');
}

function buildCopyBlock(creativeDirection, hasRestrictions) {
  return [
    `Voz: ${creativeDirection.copyVoice}.`,
    'Microcopy de botones en imperativo concreto (qué pasa al hacer clic, no una frase motivacional).',
    'Textos de estado (carga, error, confirmación) breves y en español neutro.',
    hasRestrictions === false
      ? 'Evitá relleno corporativo: cada frase debe poder señalarse como verdadera y específica de este proyecto.'
      : 'Evitá relleno corporativo: cada frase debe poder señalarse como verdadera y específica de este proyecto (ver Restricciones Negativas).',
  ].join('\n');
}

// Extras técnicos que aplican SIEMPRE, sin importar la combinación de
// tecnologías: estrategia de imágenes/video con fuente real (diagnóstico:
// las landings previas no tenían fuente de imagen, o hotlinkeaban Unsplash
// que ya no resuelve) y los no-negociables de accesibilidad/performance del
// Modo espectáculo (ver DOCUMENTACION.md).
function buildTecnicoExtrasBlock() {
  return [
    'Imágenes y elementos visuales (obligatorio, con fuente real):',
    bulletList([
      'Fotografías vía `https://loremflickr.com/<ancho>/<alto>/<keywords-en-inglés-separadas-por-coma>?lock=<n>`, con keywords específicas del tema de cada sección (no genéricas); `source.unsplash.com` está caído, no usarlo bajo ningún motivo',
      'Cada `<img>` con `alt` descriptivo, `width`/`height` explícitos, `loading="lazy"` excepto en la imagen del hero, y `onerror` que reemplace la imagen por una ilustración SVG inline de respaldo (nunca un ícono roto)',
      'Sumar también ilustraciones e íconos SVG inline propios (no solo fotos)',
      'Mínimo ~6 elementos visuales entre imágenes e ilustraciones en toda la página: esto es piso, no techo',
    ]),
    '',
    'Video (si aplica):',
    bulletList([
      'Usar un video CC0 estable (https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4) SOLO si encaja temáticamente con el proyecto',
      'Si no encaja, reemplazarlo por una animación procedural en canvas scrubbeada por scroll (no forzar un video que no tenga sentido)',
      'Siempre con `poster`/fallback visible mientras carga o si el video falla',
    ]),
    '',
    'Accesibilidad y performance no negociables:',
    bulletList([
      '`prefers-reduced-motion: reduce` desactiva toda la animación; la página queda estática pero visualmente igual de contundente, nunca vacía o rota',
      'Navegación completa por teclado, con foco visible en todo elemento interactivo (incluidos los que tienen micro-interacciones)',
      'Contraste de texto AA como mínimo',
      'Animar únicamente `transform` y `opacity` (nunca propiedades que disparen layout)',
      '`loading="lazy"` en medios fuera del viewport inicial; sin layout shift al cargar imágenes, fuentes o animaciones',
      'Pausar el render de three.js/canvas cuando el elemento sale del viewport, usando `IntersectionObserver`',
      'Limitar `devicePixelRatio` a un máximo de 2 en cualquier canvas/WebGL',
    ]),
  ].join('\n');
}

// Reglas de una tecnología según si el proyecto es un framework (npm real) o
// un HTML único (CDN).
function techRulesFor(techKey, framework) {
  const t = TECHNOLOGIES[techKey];
  if (!t) return [];
  return (framework && t.frameworkRules) ? t.frameworkRules : t.rules;
}

function buildTecnicoBlockSingle(tech, impliedLabels) {
  const lines = tech.rules.slice();
  if (impliedLabels.length && tech.label === 'Next.js') lines.push('Next.js ya incluye React: componentes funcionales con hooks, importados desde npm.');
  else if (impliedLabels.length) lines.push(`${tech.label} implica el uso de ${impliedLabels.join(', ')}; aplicá también sus reglas.`);
  const framework = frameworkFromLabels([tech.label]);
  if (framework) buildProjectTechLines(framework).forEach((l) => lines.push(l));
  return `${bulletList(lines)}\n\n${buildTecnicoExtrasBlock()}`;
}

function buildTecnicoBlockCombined(finalTechs, resolutions, discarded) {
  const lines = [];
  lines.push('Arquitectura técnica única (no se concatenan prompts por tecnología):');
  const projectFramework = frameworkFromTechKeys(finalTechs);
  finalTechs.forEach((t) => {
    if (t === 'react' && projectFramework === 'nextjs') {
      lines.push('- [React] Next.js ya incluye React: componentes funcionales con hooks, importados desde npm (no hay Vite ni `index.html`)');
      return;
    }
    techRulesFor(t, projectFramework).forEach((r) => lines.push(`- [${TECHNOLOGIES[t].label}] ${r}`));
  });
  if (projectFramework) lines.push('- Al ser un proyecto multi-archivo, las reglas de "documento único", `<script>` embebido y CDN de HTML/CSS/JavaScript no aplican: cada cosa va en su archivo y las librerías se importan desde npm.');
  if (resolutions.length) {
    lines.push('');
    lines.push('Conflictos detectados y resolución aplicada:');
    resolutions.forEach((r) => lines.push(`- ${r}`));
  }
  if (discarded.length) {
    lines.push('');
    lines.push(`Tecnologías descartadas por conflicto: ${discarded.map((t) => TECHNOLOGIES[t].label).join(', ')}.`);
  }
  const framework = frameworkFromTechKeys(finalTechs);
  if (framework) {
    lines.push('');
    lines.push('Formato de entrega (proyecto multi-archivo):');
    buildProjectTechLines(framework).forEach((l) => lines.push(`- ${l}`));
  }
  lines.push('');
  lines.push(buildTecnicoExtrasBlock());
  return lines.join('\n');
}

function buildSustractivoBlock(architecture) {
  const auditQuestion = '¿Ayuda a comprender, navegar, confiar, decidir o convertir?';
  const excludedText = architecture.excluded.length
    ? architecture.excluded.map((e) => `- ${e.nombre}: descartada. ${e.motivo}`).join('\n')
    : '- No se descartó ninguna sección adicional: todas las secciones candidatas tenían justificación con los datos disponibles.';
  return [
    `Antes de construir cada sección o elemento, hacete la pregunta: "${auditQuestion}"`,
    'Si la respuesta es no, no lo incluyas.',
    '',
    `Secciones descartadas en esta especificación y motivo:\n${excludedText}`,
    '',
    'Aplicá el mismo criterio a nivel de elemento: no agregues iconografía decorativa, badges, contadores o textos de relleno que no cumplan una de las funciones anteriores.',
  ].join('\n');
}

function buildRestriccionesBlock(verticalCtx, creativeDirection, project) {
  const parts = [];
  parts.push('Copy — palabras y muletillas a evitar (salvo que el contexto realmente las exija):');
  parts.push(bulletList(BANNED_WORDS));
  parts.push('No reemplaces estas palabras por sinónimos igualmente vacíos: el copy debe ser concreto, no decorativo.');
  parts.push('');
  parts.push('Restricciones visuales (Modo espectáculo: sombras, profundidad, 3D, degradados expresivos y esquinas redondeadas están PERMITIDOS y bienvenidos cuando son una decisión de diseño intencional; lo que sigue son las excepciones concretas que sí se prohíben):');
  parts.push(bulletList([
    'el degradado genérico "IA" púrpura→azul (cualquier otro degradado con intención sí se permite)',
    'sin bento grid',
    'glassmorphism usado como relleno decorativo sin función real (glassmorphism con propósito claro sí se permite)',
    'sin tarjetas en exceso ni card-in-card sin criterio',
    'sombras o esquinas redondeadas aplicadas por default en todo, sin que sea una decisión (si se usan, tienen que notarse elegidas)',
    'sin imágenes de stock genéricas ni de apariencia excesivamente sintética',
  ]));
  parts.push('');
  parts.push('Restricciones estructurales:');
  parts.push(bulletList([
    'sin carruseles ni sliders que auto-roten sin un propósito claro para el contenido',
    'sin múltiples CTAs compitiendo por protagonismo',
    'sin secciones redundantes',
    'sin formularios más largos de lo necesario para el objetivo de conversión',
    'sin animación que oculte contenido o bloquee la lectura',
    'sin scroll-jacking que rompa la navegación por teclado o el botón atrás del navegador',
    'sin layout shift: nada de contenido que salte al terminar de cargar imágenes, fuentes o animaciones',
  ]));
  parts.push('');
  parts.push('Restricciones de autenticidad:');
  parts.push(bulletList([
    'sin copy corporativo vacío',
    'sin imágenes artificialmente perfectas o personas con apariencia excesivamente sintética',
    'sin composición que se perciba como plantilla automática genérica',
  ]));
  if (creativeDirection.emphasizedConstraints.length) {
    parts.push('');
    parts.push(`Restricciones específicas de este proyecto (vertical: ${verticalCtx.labels.join(' + ') || 'general'}):`);
    parts.push(bulletList(creativeDirection.emphasizedConstraints));
  }
  if (project.restriccionesAdicionales) {
    parts.push('');
    parts.push('Restricciones adicionales indicadas por quien encargó el proyecto:');
    parts.push(`- ${project.restriccionesAdicionales}`);
  }
  return parts.join('\n');
}

function buildCriteriosBlock(techniques) {
  const t = normalizeTechniques(techniques);
  const on = (id) => t.indexOf(id) !== -1;
  const items = [
    'Este prompt no debería poder reutilizarse tal cual para otro negocio: si algo es genérico, ajustalo con el contexto dado.',
    'Cada sección incluida en la arquitectura debe tener una razón visible (comprender, navegar, confiar, decidir o convertir).',
  ];
  if (on(7)) items.push('Ninguna palabra de la lista de Restricciones Negativas debe aparecer en el copy final.');
  items.push('El HTML resultante debe ser accesible: contraste suficiente, foco visible, textos alternativos en imágenes, jerarquía de encabezados correcta.');
  if (!on(7)) items.push('No-negociables de seguridad: sin scripts ni recursos de terceros no declarados, sin exponer datos sensibles ni claves, sin `innerHTML` con datos sin escapar.');
  if (on(1)) items.push('El mecanismo SSoT debe aplicarse sin exponer la cadena aleatoria ni el razonamiento interno en el resultado.');
  if (on(3)) items.push('Auditoría de crítico: beneficio principal entendible en menos de 3 segundos, un único CTA dominante, objeciones desmontadas antes de que el usuario las piense.');
  if (on(6)) items.push('Auditoría sustractiva: ningún elemento decorativo sin función; los set pieces de espectáculo que sostienen la retención se conservan.');
  if (on(8)) items.push('El copy final debe leerse como escrito por una persona: ritmo variado, verbos concretos y micro-copy que promete un resultado.');
  items.push('El resultado debe cumplir exactamente los requisitos técnicos de la sección correspondiente.');
  return bulletList(items);
}

function buildSalidaFinalBlock(techLabels, isNextjs) {
  const framework = isNextjs ? 'nextjs' : frameworkFromLabels(techLabels);
  if (framework) {
    const fl = buildProjectSalidaLines(framework);
    fl.splice(fl.length - 1, 0, `Tecnología objetivo: ${techLabels.join(' + ')}.`);
    return fl.join('\n');
  }
  const lines = [];
  lines.push('Devolvé un único documento HTML autocontenido y ejecutable directamente en el navegador (empieza con `<!DOCTYPE html>` y termina en `</html>`).');
  lines.push('No agregues explicaciones antes ni después del código. No uses bloques de markdown ni comillas triples.');
  lines.push(`Tecnología objetivo: ${techLabels.join(' + ')}.`);
  const needsCdn = techLabels.some((l) => ['React', 'Vue', 'Tailwind CSS', 'Bootstrap', 'Next.js'].indexOf(l) !== -1);
  if (needsCdn) {
    lines.push('Cargá cualquier framework o librería mediante `<script>` o `<link>` a un CDN (cdn.jsdelivr.net o unpkg.com) para que el documento funcione de forma autónoma, sin paso de build.');
  }
  if (isNextjs) {
    lines.push('Next.js no puede ejecutarse como archivo único en el navegador: simulá su resultado en React dentro del mismo documento y dejá como comentarios la estructura de archivos que tendría en un proyecto Next.js real.');
  }
  lines.push('Incluí `<html lang="es">`, metadatos básicos (`charset`, `viewport`, `title`) y usá español en todo el copy, salvo indicación contraria.');
  return lines.join('\n');
}

function assemblePrompt(blocks) {
  const order = [
    ['ROL', blocks.rol],
    ['CONTEXTO', blocks.contexto],
    ['CONCEPTO RECTOR', blocks.concepto],
    ['USUARIO / AUDIENCIA', blocks.usuario],
    ['OBJETIVO DE NEGOCIO', blocks.objetivoNegocio],
    ['OBJETIVO DE CONVERSIÓN', blocks.objetivoConversion],
    ['PSICOLOGÍA', blocks.psicologia],
    ['CONTEXTO DE MERCADO', blocks.mercado],
    ['DIRECCIÓN VISUAL', blocks.direccionVisual],
    ['MECANISMO DE DIVERSIDAD SSoT', blocks.ssot],
    ['ARQUITECTURA DE PÁGINA', blocks.arquitectura],
    ['COPY / MICROCOPY', blocks.copy],
    ['RECURSOS VISUALES', blocks.recursos],
    ['REQUISITOS TÉCNICOS', blocks.tecnico],
    ['DISEÑO SUSTRACTIVO', blocks.sustractivo],
    ['RESTRICCIONES NEGATIVAS', blocks.restricciones],
    ['CRITERIOS DE CALIDAD', blocks.criterios],
    ['SALIDA FINAL', blocks.salida],
  ];
  // Un bloque null/undefined/vacío (técnica desactivada) no se emite.
  return order
    .filter(([, body]) => body !== null && body !== undefined && String(body).trim() !== '')
    .map(([title, body]) => `## ${title}\n\n${String(body).trim()}\n`)
    .join('\n');
}

/* =========================================================================
 * 5. FUNCIONES PÚBLICAS REQUERIDAS
 * ========================================================================= */

function buildTechnologyPrompt(project, verticalCtx, architecture, creativeDirection, techKey, techniques, assets, concept) {
  const tech = TECHNOLOGIES[techKey];
  if (!tech) throw new Error(`Tecnología desconocida: ${techKey}`);
  const t = normalizeTechniques(techniques);
  const on = (id) => t.indexOf(id) !== -1;
  const impliedLabels = (tech.implies || []).map((x) => TECHNOLOGIES[x].label);
  const recursos = buildRecursosVisualesBlock(assets, t);
  const cpt = on(2) ? (concept || buildFallbackConcept(project, creativeDirection)) : null;
  const blocks = {
    rol: buildRolBlock([tech.label].concat(impliedLabels)),
    contexto: buildContextoBlock(project, verticalCtx),
    concepto: cpt ? buildConceptoRectorBlock(cpt) : null,
    usuario: buildUsuarioBlock(project, verticalCtx, on(2)),
    objetivoNegocio: buildObjetivoNegocioBlock(project),
    objetivoConversion: buildObjetivoConversionBlock(project, creativeDirection),
    psicologia: buildPsicologiaBlock(verticalCtx, creativeDirection, on(2)),
    mercado: buildMercadoBlock(verticalCtx, project, on(2)),
    direccionVisual: withConceptLead(buildDireccionVisualBlock(creativeDirection, project), cpt, 'La dirección visual viste el concepto rector «{t}»: paleta, tipografía, materiales y movimiento salen del objeto o espacio que la página ES.'),
    ssot: on(1) ? buildSSoTBlock() : null,
    arquitectura: withConceptLead(buildArquitecturaBlock(architecture.included, on(2)), cpt, 'Cada sección es una parte o zona del concepto rector «{t}» (ver el mapeo en CONCEPTO RECTOR). El orden indicado es el orden de descubrimiento o visita, no de scroll vertical.'),
    copy: withConceptLead(buildCopyBlock(creativeDirection, on(7)), cpt, 'El copy habla desde el mundo del concepto rector «{t}» (sus partes, sus gestos, su vocabulario), sin perder claridad ni conversión.'),
    recursos,
    tecnico: withConceptTech(buildTecnicoBlockSingle(tech, impliedLabels), cpt),
    sustractivo: on(6) ? buildSustractivoBlock(architecture) : null,
    restricciones: on(7) ? buildRestriccionesBlock(verticalCtx, creativeDirection, project) : null,
    criterios: buildCriteriosBlock(t),
    salida: buildSalidaFinalBlock([tech.label], techKey === 'nextjs'),
  };
  return {
    tech: techKey,
    label: tech.label,
    text: assemblePrompt(blocks),
    structure: getHeadings(t, { resources: !!recursos }),
    constraints: tech.rules.concat(impliedLabels.length ? [`Implica ${impliedLabels.join(', ')} (requerido por ${tech.label}).`] : []),
  };
}

function combineTechnologyPrompts(project, verticalCtx, architecture, creativeDirection, technologies, seed, techniques, assets, concept) {
  const { finalTechs, resolutions, discarded } = resolveTechConflicts(technologies, seed);
  const techLabels = finalTechs.map((x) => TECHNOLOGIES[x].label);
  const t = normalizeTechniques(techniques);
  const on = (id) => t.indexOf(id) !== -1;
  const recursos = buildRecursosVisualesBlock(assets, t);
  const cpt = on(2) ? (concept || buildFallbackConcept(project, creativeDirection)) : null;
  const blocks = {
    rol: buildRolBlock(techLabels),
    contexto: buildContextoBlock(project, verticalCtx),
    concepto: cpt ? buildConceptoRectorBlock(cpt) : null,
    usuario: buildUsuarioBlock(project, verticalCtx, on(2)),
    objetivoNegocio: buildObjetivoNegocioBlock(project),
    objetivoConversion: buildObjetivoConversionBlock(project, creativeDirection),
    psicologia: buildPsicologiaBlock(verticalCtx, creativeDirection, on(2)),
    mercado: buildMercadoBlock(verticalCtx, project, on(2)),
    direccionVisual: withConceptLead(buildDireccionVisualBlock(creativeDirection, project), cpt, 'La dirección visual viste el concepto rector «{t}»: paleta, tipografía, materiales y movimiento salen del objeto o espacio que la página ES.'),
    ssot: on(1) ? buildSSoTBlock() : null,
    arquitectura: withConceptLead(buildArquitecturaBlock(architecture.included, on(2)), cpt, 'Cada sección es una parte o zona del concepto rector «{t}» (ver el mapeo en CONCEPTO RECTOR). El orden indicado es el orden de descubrimiento o visita, no de scroll vertical.'),
    copy: withConceptLead(buildCopyBlock(creativeDirection, on(7)), cpt, 'El copy habla desde el mundo del concepto rector «{t}» (sus partes, sus gestos, su vocabulario), sin perder claridad ni conversión.'),
    recursos,
    tecnico: withConceptTech(buildTecnicoBlockCombined(finalTechs, resolutions, discarded), cpt),
    sustractivo: on(6) ? buildSustractivoBlock(architecture) : null,
    restricciones: on(7) ? buildRestriccionesBlock(verticalCtx, creativeDirection, project) : null,
    criterios: buildCriteriosBlock(t),
    salida: buildSalidaFinalBlock(techLabels, finalTechs.indexOf('nextjs') !== -1),
  };
  return {
    tech: 'combinado',
    label: `Combinado (${techLabels.join(' + ')})`,
    text: assemblePrompt(blocks),
    structure: getHeadings(t, { resources: !!recursos }),
    constraints: finalTechs.reduce((acc, x) => acc.concat(TECHNOLOGIES[x].rules), []).concat(resolutions),
    resolutions,
    discarded,
  };
}

// opts.seed: cadena semilla del usuario (state.ssotSeed). Solo se usa con la
// técnica 1 activa; sin ella la dirección sale del proyecto (determinista).
function generatePrompt(project, verticals, technologies, techniques, assets, opts) {
  const t = normalizeTechniques(techniques);
  const seed = makeTechniqueSeed(project, verticals, t, opts && opts.seed);
  const verticalCtx = synthesizeVerticals(verticals);
  const creativeDirection = buildCreativeDirection(seed, verticalCtx);
  const architecture = buildPageArchitecture(project, verticalCtx, creativeDirection);
  const concept = t.indexOf(2) !== -1 ? ((opts && opts.concept) || buildFallbackConcept(project, creativeDirection)) : null;
  const perTech = (technologies || []).map((x) => buildTechnologyPrompt(project, verticalCtx, architecture, creativeDirection, x, t, assets, concept));
  let combined = null;
  if ((technologies || []).length >= 2) {
    combined = combineTechnologyPrompts(project, verticalCtx, architecture, creativeDirection, technologies, seed, t, assets, concept);
  }
  return { seed, verticalCtx, creativeDirection, architecture, perTech, combined, techniques: t, concept };
}

// Alias explícito: el generador de plantillas de arriba es el "respaldo" al
// que cae Feature 1 cuando el modelo no está disponible o no pasa la
// validación tras el intento de reparación. Mismo comportamiento, nombre
// que refleja su rol nuevo dentro del flujo.
const generateTemplatePrompt = generatePrompt;

/* =========================================================================
 * 5a. CONCEPTO RECTOR (técnica 2 · Prompt ambicioso)
 * La ambición no es "un color audaz": la PÁGINA MISMA rompe la norma con un
 * concepto rector del mundo del cliente (un reloj, un plano, un juego, un
 * escritorio…) y su propia forma de navegarse. Todo este bloque se usa SOLO
 * con la técnica 2 activa.
 * ========================================================================= */

function paradigmByKey(key) {
  return INTERACTION_PARADIGMS.find((p) => p.key === key) || INTERACTION_PARADIGMS[0];
}

function cleanConceptText(v, max) {
  return String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, max || 700);
}

function capFirst(str) {
  const t = String(str || '');
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
}

function normalizeConceptMapping(m) {
  const out = [];
  const push = (x) => { const t = cleanConceptText(x, 300); if (t) out.push(t); };
  if (Array.isArray(m)) {
    m.forEach((it) => {
      if (it && typeof it === 'object') push(Object.keys(it).map((k) => cleanConceptText(it[k], 200)).filter(Boolean).join(' → '));
      else push(it);
    });
  } else if (m && typeof m === 'object') {
    Object.keys(m).forEach((k) => push(`${k} → ${cleanConceptText(m[k], 200)}`));
  } else if (typeof m === 'string') {
    m.split(/\n|;/).forEach(push);
  }
  return out.slice(0, 10);
}

// Valida y limpia un concepto crudo del modelo. Requiere título y "la página es".
function normalizeConcept(raw, source) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const c = {
    titulo: cleanConceptText(raw.titulo || raw.title, 140),
    paradigma: cleanConceptText(raw.paradigma || raw.paradigm, 120),
    laPaginaEs: cleanConceptText(raw.laPaginaEs || raw.la_pagina_es, 500),
    navegacion: cleanConceptText(raw.navegacion || raw.navegación, 600),
    mapeo: normalizeConceptMapping(raw.mapeo),
    momentoFirma: cleanConceptText(raw.momentoFirma || raw.momento_firma, 500),
    tecnica: cleanConceptText(raw.tecnica || raw.técnica, 600),
    conversion: cleanConceptText(raw.conversion || raw.conversión, 500),
    accesibilidad: cleanConceptText(raw.accesibilidad, 600),
    source: source || 'model',
  };
  if (!c.titulo || !c.laPaginaEs) return null;
  return c;
}

// Parseo robusto de la respuesta de ideación: quita cercas ```, toma desde el
// primer "[" hasta el último "]" (o un objeto suelto) y descarta lo inválido.
// Basura => [] (el llamador cae al concepto determinista).
function parseConcepts(text) {
  const s = String(text || '').replace(/```(?:json)?/gi, '').trim();
  let data = null;
  const a = s.indexOf('[');
  const b = s.lastIndexOf(']');
  if (a !== -1 && b > a) { try { data = JSON.parse(s.slice(a, b + 1)); } catch (e) { data = null; } }
  if (!Array.isArray(data)) {
    const o1 = s.indexOf('{');
    const o2 = s.lastIndexOf('}');
    if (o1 !== -1 && o2 > o1) {
      try {
        const o = JSON.parse(s.slice(o1, o2 + 1));
        data = Array.isArray(o) ? o : (o && Array.isArray(o.conceptos) ? o.conceptos : [o]);
      } catch (e) { data = null; }
    }
  }
  if (!Array.isArray(data)) return [];
  return data.map((x) => normalizeConcept(x, 'model')).filter(Boolean).slice(0, 3);
}

// Concepto determinista ("La página es un/una <objeto del rubro>…") a partir
// del paradigma y el tema. Es el respaldo de la ideación y de la plantilla.
function buildFallbackConcept(project, creativeDirection, paradigmKey) {
  const cd = creativeDirection || {};
  const p = paradigmByKey(paradigmKey || cd.interactionParadigmKey);
  const tema = cleanConceptText(project && project.tema, 120) || 'el proyecto';
  const order = cd.sectionOrder && cd.sectionOrder.length ? cd.sectionOrder : ['hero', 'problema-solucion', 'caracteristicas', 'prueba-social', 'objeciones', 'cta-final'];
  return {
    titulo: `${p.label} · ${tema}`,
    paradigma: p.label,
    laPaginaEs: `La página es ${p.is.replace('{tema}', tema)}.`,
    navegacion: `${capFirst(p.nav)}.`,
    mapeo: order.map((k, i) => `${SECTION_LABELS[k] || k} → ${p.zone} ${i + 1}`),
    momentoFirma: `${capFirst(p.sig)}.`,
    tecnica: 'CSS 3D y transformaciones para las piezas, GSAP para las transiciones y three.js o canvas donde haga falta, dentro de la tecnología objetivo.',
    conversion: 'El CTA principal es un elemento del propio concepto, siempre visible o a lo sumo a 2 interacciones desde cualquier punto.',
    accesibilidad: 'Navegación completa por teclado con foco visible, botón "Vista clásica" / enlace "Saltar al contenido" que muestra las secciones como página lineal legible por lectores de pantalla, y versión estática con prefers-reduced-motion.',
    source: 'fallback',
  };
}

// Siempre devuelve 3 conceptos: los válidos del modelo + respaldos
// deterministas con otros paradigmas (el primero, el sorteado por la semilla).
function resolveConcepts(parsed, project, creativeDirection) {
  const list = (parsed || []).slice(0, 3);
  const cd = creativeDirection || {};
  const start = Math.max(0, INTERACTION_PARADIGMS.findIndex((p) => p.key === cd.interactionParadigmKey));
  const offsets = [0, 3, 5, 1, 2, 4, 6, 7];
  const used = list.map((c) => String(c.paradigma || '').toLowerCase());
  for (let i = 0; i < offsets.length && list.length < 3; i++) {
    const p = INTERACTION_PARADIGMS[(start + offsets[i]) % INTERACTION_PARADIGMS.length];
    if (used.some((u) => u && (u.indexOf(p.key) !== -1 || u.indexOf(p.label.toLowerCase()) !== -1))) continue;
    list.push(buildFallbackConcept(project, cd, p.key));
    used.push(p.label.toLowerCase());
  }
  return list;
}

// Concepto elegido en el paso 2 (antes del prompt): { seed, tema, concepts, index }.
// index -1 = nada elegido. Va atado a la cadena (seed) y al tema; si cambian,
// se conserva pero se marca "de otra cadena/proyecto" y el pipeline no lo usa.
const CONCEPT_PICK_KEY = 'lpa_concept_pick_v1';
const CONCEPT_PICK_MAX = 4; // 3 propuestos + 1 propio
function emptyConceptPick() { return { seed: '', tema: '', concepts: [], index: -1 }; }

function normalizeConceptPick(p) {
  const src = (p && typeof p === 'object') ? p : {};
  const out = emptyConceptPick();
  out.seed = typeof src.seed === 'string' ? src.seed.slice(0, 200) : '';
  out.tema = typeof src.tema === 'string' ? src.tema.slice(0, 200) : '';
  out.concepts = (Array.isArray(src.concepts) ? src.concepts : [])
    .map((c) => normalizeConcept(c, c && (c.source === 'fallback' || c.source === 'user') ? c.source : 'model'))
    .filter(Boolean).slice(0, CONCEPT_PICK_MAX);
  const i = Number(src.index);
  out.index = Number.isInteger(i) && i >= 0 && i < out.concepts.length ? i : -1;
  return out;
}

function loadConceptPick() {
  const raw = safeGetItem(CONCEPT_PICK_KEY);
  if (!raw) return emptyConceptPick();
  try { return normalizeConceptPick(JSON.parse(raw)); } catch (e) { return emptyConceptPick(); }
}
function saveConceptPick(p) { return safeSetItem(CONCEPT_PICK_KEY, JSON.stringify(normalizeConceptPick(p))); }

function chosenConceptOf(pick) {
  return pick && pick.index >= 0 && pick.concepts && pick.concepts[pick.index] ? pick.concepts[pick.index] : null;
}

// Es de otra cadena o de otro proyecto (mismo criterio de tema que el pregen).
function conceptPickIsStale(pick, seed, tema) {
  if (!pick || !pick.concepts || !pick.concepts.length) return false;
  const norm = (x) => String(x || '').trim().toLowerCase();
  return pick.seed !== seed || norm(pick.tema) !== norm(tema);
}

// Resumen corto del concepto para los prompts de imágenes/video y la lista de tomas.
function conceptBriefOf(concept) {
  return concept ? `${concept.titulo}${concept.momentoFirma ? ` — ${concept.momentoFirma}` : ''}`.slice(0, 400) : '';
}

function deriveCreativeDirection(project, verticals, techniques, userSeed) {
  const seed = makeTechniqueSeed(project, verticals, techniques, userSeed);
  return { seed, creativeDirection: buildCreativeDirection(seed, synthesizeVerticals(verticals)) };
}

// Prompt de la etapa "Ideando el concepto…": pide EXACTAMENTE 3 conceptos en
// un array JSON. El primero usa el paradigma sorteado; los otros dos, otros.
function buildConceptIdeationPrompt(project, verticals, technologies, target, creativeDirection) {
  const cd = creativeDirection || {};
  const p = project || {};
  const verticalsData = buildVerticalContextData(verticals);
  const techLabels = (target === 'combined' ? (technologies || []) : [target])
    .map((k) => (TECHNOLOGIES[k] ? TECHNOLOGIES[k].label : k));
  const sorted = paradigmByKey(cd.interactionParadigmKey);
  const others = INTERACTION_PARADIGMS.filter((x) => x.key !== sorted.key);
  const lines = [
    'Sos un director creativo senior. Tu tarea NO es escribir la landing ni un prompt: es IDEAR el CONCEPTO RECTOR de la página. Ambición significa que la PÁGINA MISMA rompe la norma con un concepto tomado del mundo del cliente, no "elegir un color audaz". Ejemplos de la idea: la página de un arquitecto ES un plano o una casa 3D que se recorre; el portafolio de un ingeniero de sistemas ES un juego o una réplica de escritorio; la de una relojería de lujo ES un reloj cuyas partes son los paneles y se navega girando la corona. No todo es scroll hacia abajo.',
    '',
    'PROYECTO:',
    `- Tema: ${p.tema || ''}`,
    `- Público objetivo: ${p.publico || ''}`,
    `- Oferta: ${p.oferta || ''}`,
    `- Objetivo de conversión: ${p.objetivo || ''}`,
    `- Competidores: ${p.competidores || ''}`,
  ];
  if (p.descripcion) lines.push(`- Descripción general: ${truncateDescripcion(p.descripcion, 800)}`);
  if (p.tono) lines.push(`- Tono solicitado: ${p.tono}`);
  if (p.propuestaValor) lines.push(`- Propuesta de valor: ${p.propuestaValor}`);
  if (p.restriccionesAdicionales) lines.push(`- Restricciones adicionales: ${p.restriccionesAdicionales}`);
  lines.push(`- Verticales de negocio: ${verticalsData.map((v) => v.label).join(', ') || '(ninguno)'}`);
  lines.push(`- Tecnología de implementación: ${techLabels.join(' + ') || '(sin definir)'}`);
  lines.push('');
  lines.push('DECISIONES YA TOMADAS (el concepto tiene que convivir con ellas, no contradecirlas):');
  lines.push(`- Paleta: ${cd.paletteFamily || '(a definir)'}`);
  lines.push(`- ${describeSectionStructure(cd)}`);
  lines.push('');
  lines.push(`PARADIGMA SORTEADO (el concepto 1 DEBE usarlo): ${sorted.label}: ${sorted.desc}.`);
  lines.push('OTROS PARADIGMAS POSIBLES (para los conceptos 2 y 3, usá dos DISTINTOS entre sí y distintos del sorteado):');
  lines.push(bulletList(others.map((x) => `${x.label}: ${x.desc}`)));
  lines.push('');
  lines.push('Devolvé EXACTAMENTE 3 conceptos. Los tres tienen que ser específicos de ESTE rubro y este cliente (nada que sirva para cualquier negocio), extraños, memorables y fuera de lo común; si un concepto podría ser de otro rubro, descartalo.');
  lines.push('');
  lines.push('FORMATO (estricto): respondé SOLO un array JSON de 3 objetos, sin texto antes ni después y sin markdown. Cada objeto con estas claves, todas strings salvo "mapeo":');
  lines.push(bulletList([
    '"titulo": nombre corto del concepto',
    '"paradigma": el paradigma usado (uno de los listados)',
    '"laPaginaEs": qué ES la página, en una oración ("La página es un/una …")',
    '"navegacion": cómo se navega (girar, arrastrar, hacer zoom, jugar, abrir ventanas, elegir…). Explícitamente NO scroll vertical simple, salvo como apoyo secundario',
    '"mapeo": array de strings "sección → parte del objeto/espacio que la contiene" (hero, problema, oferta, prueba social, objeciones, cierre, según aplique)',
    '"momentoFirma": la interacción firma, la que se recuerda',
    '"tecnica": enfoque de construcción factible con three.js / GSAP / canvas / CSS 3D dentro de la tecnología seleccionada',
    '"conversion": cómo se llega al CTA en 2 interacciones como máximo',
    '"accesibilidad": navegación por teclado + "vista clásica" / salto al contenido como alternativa + versión estática para prefers-reduced-motion',
  ]));
  return lines.join('\n');
}

// Bloque CONCEPTO RECTOR de la plantilla de respaldo (y resumen del concepto).
function buildConceptoRectorBlock(concept) {
  const c = concept;
  const lines = [
    `Concepto rector: «${c.titulo}»${c.paradigma ? ` (${c.paradigma})` : ''}.`,
    `${c.laPaginaEs}`,
    `Navegación: ${c.navegacion || 'a definir'} El scroll vertical clásico no es el modelo de navegación principal; a lo sumo apoya.`,
  ];
  if (c.mapeo && c.mapeo.length) {
    lines.push('Mapeo de contenido a partes del concepto:');
    lines.push(bulletList(c.mapeo));
  }
  if (c.momentoFirma) lines.push(`Momento firma: ${c.momentoFirma}`);
  if (c.tecnica) lines.push(`Técnica de construcción: ${c.tecnica}`);
  if (c.conversion) lines.push(`Conversión: ${c.conversion}`);
  if (c.accesibilidad) lines.push(`Accesibilidad: ${c.accesibilidad}`);
  lines.push('La página ES el concepto: la dirección visual, la arquitectura de página, el copy y los requisitos técnicos se subordinan a él. Los no negociables se mantienen: CTA alcanzable en 2 interacciones como máximo, teclado completo con foco visible, alternativa "Vista clásica" legible por lectores de pantalla, `prefers-reduced-motion` con versión estática y buen rendimiento.');
  return lines.join('\n');
}

// Línea de REQUISITOS TÉCNICOS (fuera de SALIDA FINAL): materializar la
// navegación y el momento firma del concepto, con la vista clásica de respaldo.
function conceptTechLine(concept) {
  if (!concept) return '';
  return `La implementación tiene que materializar la navegación del concepto rector «${concept.titulo}» y su momento firma${concept.momentoFirma ? ` (${cleanConceptText(concept.momentoFirma, 220)})` : ''}, con la vista clásica lineal (botón "Vista clásica" / salto al contenido) como alternativa accesible.`;
}

function withConceptLead(block, concept, template) {
  if (!concept) return block;
  return `${template.replace('{t}', concept.titulo)}\n\n${String(block).trim()}`;
}

function withConceptTech(block, concept) {
  if (!concept) return block;
  return `${String(block).trim()}\n\n${conceptTechLine(concept)}`;
}

/* =========================================================================
 * 5b. GENERACIÓN DE PROMPT POR MODELO (META-PROMPT)
 * ========================================================================= */

// Encabezados exactos y su orden — única fuente de verdad, reutilizada tanto
// por el generador de plantillas (arriba) como por el meta-prompt y su
// validador (abajo), para que nunca queden desincronizados.
const PROMPT_HEADINGS = [
  'ROL', 'CONTEXTO', 'CONCEPTO RECTOR', 'USUARIO / AUDIENCIA', 'OBJETIVO DE NEGOCIO',
  'OBJETIVO DE CONVERSIÓN', 'PSICOLOGÍA', 'CONTEXTO DE MERCADO', 'DIRECCIÓN VISUAL',
  'MECANISMO DE DIVERSIDAD SSoT', 'ARQUITECTURA DE PÁGINA', 'COPY / MICROCOPY',
  'REQUISITOS TÉCNICOS', 'DISEÑO SUSTRACTIVO', 'RESTRICCIONES NEGATIVAS',
  'CRITERIOS DE CALIDAD', 'SALIDA FINAL',
];

/* -------------------------------------------------------------------------
 * Técnicas seleccionables (Fase C) — las 8 técnicas de la guía, cada una
 * activable por separado. PROMPT_HEADINGS de arriba es la lista COMPLETA
 * (todas activas); el conjunto real de encabezados depende de las técnicas
 * activas y se obtiene siempre con getHeadings(techniques).
 * ------------------------------------------------------------------------- */

const TECHNIQUES = [
  { id: 1, key: 'ssot', name: 'Semillas SSoT', phase: 'Descubrir',
    desc: 'Una cadena aleatoria real fija los ejes de diseño y varía las decisiones menores en cada ejecución. Evita la estética genérica. Apagada: dirección determinista, sin bloque de semilla.' },
  { id: 2, key: 'ambicioso', name: 'Prompt ambicioso · concepto rector', phase: 'Descubrir',
    desc: 'La página ES algo del mundo del cliente (un reloj, un plano, un juego, un escritorio…), con su propia forma de navegarse. Apagada: bloques concisos, sin concepto.' },
  { id: 3, key: 'subagentes', name: 'Subagentes creador y crítico', phase: 'Entregar',
    desc: 'Al ejecutar, un crítico audita la landing (UX, accesibilidad, persuasión) y un creador aplica los arreglos con diff para aceptar; hasta 2 vueltas.' },
  { id: 4, key: 'imagen', name: 'Imágenes generadas', phase: 'Entregar',
    desc: 'Suma el bloque RECURSOS VISUALES con prompts de imagen coherentes con la marca (primero se genera la imagen).' },
  { id: 5, key: 'video', name: 'Video', phase: 'Entregar',
    desc: 'Suma un video protagonista con poster y movimiento guiado por scroll, dentro de RECURSOS VISUALES.' },
  { id: 6, key: 'sustractivo', name: 'Diseño sustractivo', phase: 'Definir',
    desc: 'Audita cada elemento: si no ayuda a comprender, confiar o convertir, se descarta. Apagada: se omite el bloque.' },
  { id: 7, key: 'restricciones', name: 'Restricciones negativas', phase: 'Entregar',
    desc: 'Lista de palabras, rasgos visuales y estructurales que delatan a la IA. Apagada: quedan solo los no-negociables de accesibilidad y seguridad.' },
  { id: 8, key: 'humana', name: 'Reescritura humana', phase: 'Entregar',
    desc: 'Tras ejecutar, reescribe solo el copy y microcopy con voz humana, sin tocar estructura, clases ni scripts. Queda como versión aparte.' },
];

const ALL_TECHNIQUE_IDS = TECHNIQUES.map((t) => t.id);

// undefined/null => todas (compatibilidad con llamadas viejas). Un arreglo
// (incluso vacío) se respeta tal cual, filtrado a ids válidos 1..8, sin
// duplicados y ordenado.
function normalizeTechniques(input) {
  if (input === undefined || input === null) return ALL_TECHNIQUE_IDS.slice();
  const arr = Array.isArray(input) ? input : (input instanceof Set ? Array.from(input) : []);
  const out = [];
  arr.forEach((v) => {
    const n = Number(v);
    if (Number.isInteger(n) && n >= 1 && n <= 8 && out.indexOf(n) === -1) out.push(n);
  });
  return out.sort((a, b) => a - b);
}

function hasTechnique(techniques, id) {
  return normalizeTechniques(techniques).indexOf(id) !== -1;
}

// Encabezados reales del prompt según las técnicas activas:
//  - sin 1: no existe MECANISMO DE DIVERSIDAD SSoT
//  - sin 2: no existe CONCEPTO RECTOR
//  - sin 6: no existe DISEÑO SUSTRACTIVO
//  - sin 7: no existe RESTRICCIONES NEGATIVAS
//  - con 4 o 5 (o recursos reales disponibles, opts.resources): se suma RECURSOS VISUALES
function getHeadings(techniques, opts) {
  const t = normalizeTechniques(techniques);
  const o = opts || {};
  const withResources = t.indexOf(4) !== -1 || t.indexOf(5) !== -1 || !!o.resources;
  const out = [];
  PROMPT_HEADINGS.forEach((h) => {
    if (h === 'MECANISMO DE DIVERSIDAD SSoT' && t.indexOf(1) === -1) return;
    if (h === 'CONCEPTO RECTOR' && t.indexOf(2) === -1) return;
    if (h === 'DISEÑO SUSTRACTIVO' && t.indexOf(6) === -1) return;
    if (h === 'RESTRICCIONES NEGATIVAS' && t.indexOf(7) === -1) return;
    out.push(h);
    if (h === 'COPY / MICROCOPY' && withResources) out.push('RECURSOS VISUALES');
  });
  return out;
}

// Resumen legible ("Todas", "Ninguna", "1, 3, 8") para la UI.
function describeTechniques(techniques) {
  const t = normalizeTechniques(techniques);
  if (t.length === ALL_TECHNIQUE_IDS.length) return 'Todas (1-8)';
  if (!t.length) return 'Ninguna';
  return t.map((id) => `${id}. ${TECHNIQUES[id - 1].name}`).join(' · ');
}

// Cuando la técnica 1 (SSoT) está apagada no hay semilla aleatoria: la
// dirección creativa se deriva de forma determinista del proyecto y los
// verticales (mismo proyecto => misma dirección).
function deriveDeterministicSeed(project, verticals) {
  const p = project || {};
  const base = JSON.stringify([p.tema || '', p.publico || '', p.oferta || '', (verticals || []).slice().sort()]);
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let out = '';
  for (let i = 0; i < 48; i++) out += chars[rollingHash(base, 101 + i) % chars.length];
  return out;
}

const TECHNIQUES_STORAGE_KEY = 'lpa_techniques_v1';

// Técnicas activas persistidas (localStorage con try/catch vía safeGetItem).
// Sin valor guardado o inválido => todas.
function loadTechniquesSetting() {
  const raw = safeGetItem(TECHNIQUES_STORAGE_KEY);
  if (!raw) return ALL_TECHNIQUE_IDS.slice();
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? normalizeTechniques(parsed) : ALL_TECHNIQUE_IDS.slice();
  } catch (e) { return ALL_TECHNIQUE_IDS.slice(); }
}

function saveTechniquesSetting(techniques) {
  safeSetItem(TECHNIQUES_STORAGE_KEY, JSON.stringify(normalizeTechniques(techniques)));
}

// Con la técnica 1: la cadena del usuario (si es válida; si no, una hex nueva).
// Sin ella: semilla derivada del proyecto (mismo proyecto => misma dirección).
function makeTechniqueSeed(project, verticals, techniques, userSeed) {
  if (!hasTechnique(techniques, 1)) return deriveDeterministicSeed(project, verticals);
  const normalized = normalizeSsotSeedInput(userSeed);
  return isValidSsotSeed(normalized) ? normalized : generateSsotSeed();
}

// Cadena persistida (localStorage con try/catch vía safeGetItem/safeSetItem).
function loadSsotSeed() {
  const stored = normalizeSsotSeedInput(safeGetItem(SSOT_SEED_STORAGE_KEY));
  if (isValidSsotSeed(stored)) return stored;
  const fresh = generateSsotSeed();
  safeSetItem(SSOT_SEED_STORAGE_KEY, fresh);
  return fresh;
}

function saveSsotSeed(seed) {
  if (isValidSsotSeed(seed)) safeSetItem(SSOT_SEED_STORAGE_KEY, seed);
}

// Reglas de sinergia entre técnicas: se inyectan al redactor (meta-prompt) y
// al crítico, solo las que aplican a la combinación activa.
function buildSynergyRules(techniques, hasReference) {
  const t = normalizeTechniques(techniques);
  const on = (id) => t.indexOf(id) !== -1;
  const rules = [];
  if (hasReference && on(1)) rules.push('SSoT + Referencia visual: la referencia subida fija el TONO (estilo, paleta, composición y mood) y la semilla varía DENTRO de ese espacio: los ejes de diseño se eligen para que sean coherentes con la referencia, y la semilla decide los detalles menores (tipografía exacta, ritmo, micro-interacciones), nunca un cambio de tono.');
  if (on(1) && on(2)) rules.push('Concepto rector + SSoT: la paleta, la tipografía y los demás ejes de la semilla VISTEN el concepto; no lo reemplazan ni lo diluyen.');
  if (on(2) && on(3)) rules.push('Concepto rector + Subagentes: el crítico audita la usabilidad de la navegación no estándar del concepto (descubribilidad, teclado, vista clásica, CTA en 2 interacciones como máximo) sin llevarla de vuelta a un scroll vertical convencional.');
  if (on(2) && on(6)) rules.push('Concepto rector + Sustractivo: el diseño sustractivo NO elimina la interacción firma ni la navegación propia del concepto; descarta decoración ajena a él, no el concepto.');
  if (on(1) && on(3)) rules.push('SSoT + Subagentes: los ejes derivados de la semilla son ley. El crítico puede pulir su ejecución pero NO cambiarlos ni llevarlos hacia lo genérico, y debe conservar intacta la marca `{{SSOT_SEED}}`.');
  if (on(2) && on(3)) rules.push('Ambicioso + Subagentes: el crítico verifica que cada sección tenga objetivo, copy, elemento visual, animación y CTA concretos, y descarta el relleno.');
  if (on(6)) rules.push('Sustractivo + Espectáculo: la auditoría sustractiva NO elimina los set pieces de scroll, el 3D ni la firma del hero cuando sirven a la retención o a entender la oferta; elimina decoración sin función (badges, contadores de relleno, secciones redundantes). Una pieza de espectáculo sin función se simplifica, no se borra.');
  if (on(1) && (on(4) || on(5))) rules.push('SSoT + Multimedia: el tratamiento de imágenes, la paleta y la firma de movimiento derivados fijan el estilo de los prompts de imagen y video (misma iluminación, ángulo y paleta en todos los activos).');
  if ((on(4) || on(5)) && on(7)) rules.push('Multimedia + Restricciones: los prompts de imagen y video llevan las negativas fotográficas (sin piel perfecta, sin texturas plásticas, sin colores sobresaturados, sin mirar a cámara, sin fondos de oficina genéricos).');
  if (on(5) && on(6)) rules.push('Video + Sustractivo: un único video protagonista; sin videos decorativos adicionales.');
  if (on(7) && on(8)) rules.push('Restricciones + Reescritura humana: la reescritura hereda la lista de palabras y rasgos prohibidos y nunca reintroduce muletillas.');
  if (on(3) && on(8)) rules.push('Crítico + Reescritura humana: los arreglos del crítico (jerarquía, CTA, beneficio sobre característica) se aceptan primero sobre la estructura; la reescritura humana solo cambia el texto visible y respeta esas decisiones.');
  return rules;
}

function escapeRegExp(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildVerticalContextData(verticalKeys) {
  return (verticalKeys || []).map((k) => {
    const v = resolveVerticalEntry(k);
    if (!v) return null;
    if (v.custom) {
      return {
        key: k, label: v.label, custom: true, motivations: [], objections: [], biases: [],
        sophistication: '', dominantPatterns: [], conventionsToBreak: [], trustSignals: [], negativeConstraints: [],
      };
    }
    return {
      key: k,
      label: v.label,
      motivations: v.psychology.motivations,
      objections: v.psychology.objections,
      biases: v.psychology.biases,
      sophistication: v.market.sophistication,
      dominantPatterns: v.market.dominantPatterns,
      conventionsToBreak: v.market.conventionsToBreak,
      trustSignals: v.trustSignals,
      negativeConstraints: v.negativeConstraints,
    };
  }).filter(Boolean);
}

function buildTechContextData(techKeys) {
  const framework = frameworkFromTechKeys(techKeys || []);
  return (techKeys || []).map((k) => {
    const t = TECHNOLOGIES[k];
    if (!t) return null;
    return { key: k, label: t.label, rules: techRulesFor(k, framework), implies: t.implies || [], conflicts: t.conflicts || [] };
  }).filter(Boolean);
}

function formatMetaContextData(project, verticalsData, techData, target) {
  const lines = [];
  lines.push('DATOS DEL PROYECTO (usalos literalmente, no los inventes de nuevo):');
  lines.push(`- Tema: ${project.tema || ''}`);
  lines.push(`- Público objetivo: ${project.publico || ''}`);
  lines.push(`- Oferta: ${project.oferta || ''}`);
  lines.push(`- Objetivo de conversión: ${project.objetivo || ''}`);
  lines.push(`- Competidores: ${project.competidores || ''}`);
  if (project.descripcion) lines.push(`- Descripción general (contexto libre de quien encarga): ${truncateDescripcion(project.descripcion, 2000)} [usala como contexto rico para decidir mensaje y enfoque; no la copies textual en la página]`);
  if (project.tono) lines.push(`- Tono solicitado: ${project.tono}`);
  if (project.referenciasVisuales) lines.push(`- Referencias visuales: ${project.referenciasVisuales}`);
  if (project.propuestaValor) lines.push(`- Propuesta de valor: ${project.propuestaValor}`);
  if (project.restriccionesAdicionales) lines.push(`- Restricciones adicionales indicadas por quien encarga el proyecto: ${project.restriccionesAdicionales}`);
  lines.push('');
  lines.push('VERTICALES DE NEGOCIO SELECCIONADOS (contexto de negocio: psicología, mercado, confianza):');
  verticalsData.forEach((v) => {
    if (v.custom) { lines.push(`- ${v.label} (rubro libre, sin conocimiento predefinido)`); return; }
    lines.push(`- ${v.label}: motivaciones [${v.motivations.join('; ')}] · objeciones [${v.objections.join('; ')}] · sesgos [${v.biases.join('; ')}] · sofisticación de mercado: ${v.sophistication} · convenciones a romper cuando aplique: [${v.conventionsToBreak.join('; ')}] · señales de confianza disponibles: [${v.trustSignals.join('; ')}] · restricciones propias del vertical: [${v.negativeConstraints.join('; ')}]`);
  });
  verticalsData.filter((v) => v.custom).forEach((v) => lines.push(customVerticalInstruction(v.label)));
  if (!verticalsData.length) lines.push(NO_VERTICAL_INSTRUCTION);
  if (verticalsData.length > 1) {
    lines.push(`Hay ${verticalsData.length} verticales seleccionados: SINTETIZALOS en un único contexto de negocio coherente, no los trates como bloques separados.`);
  }
  lines.push('');
  lines.push('TECNOLOGÍAS DE IMPLEMENTACIÓN SELECCIONADAS (forma de implementación, no de negocio):');
  techData.forEach((t) => {
    const implies = t.implies.length ? ` · implica: ${t.implies.join(', ')}` : '';
    const conflicts = t.conflicts.length ? ` · conflictúa con: ${t.conflicts.join(', ')}` : '';
    lines.push(`- ${t.label}: reglas [${t.rules.join('; ')}]${implies}${conflicts}`);
  });
  lines.push('');
  if (target === 'combined') {
    lines.push('MODO: PROMPT COMBINADO. Vas a escribir UN ÚNICO prompt que integre todas las tecnologías listadas arriba (nunca concatenes un prompt por tecnología ni los separes con títulos tipo "Prompt A" / "Prompt B"). Conservá las reglas propias de cada tecnología, detectá los conflictos reales entre ellas (por ejemplo Tailwind CSS vs Bootstrap, o React vs Vue) y resolvelos explícitamente dentro del bloque REQUISITOS TÉCNICOS: indicá qué tecnología se conserva, cuál se descarta y por qué. El resultado tiene que leerse como una única arquitectura técnica coherente.');
  } else {
    const t = TECHNOLOGIES[target];
    lines.push(`MODO: PROMPT INDIVIDUAL para la tecnología "${t ? t.label : target}". No mezcles reglas de tecnologías que no sean ésta o las que implica.`);
  }
  return lines.join('\n');
}

// buildMetaPrompt: arma el prompt que se le manda al modelo para que ESCRIBA
// el prompt final (no la landing). Codifica operativamente las reglas de
// prompt.md: los 16 encabezados exactos y su orden, el mecanismo SSoT
// aplicado dos veces (el propio modelo redactor lo usa para decidir su
// dirección creativa, y además debe instruir al modelo ejecutor a aplicarlo),
// prompt ambicioso, diseño sustractivo, restricciones negativas confinadas a
// su bloque, y las reglas de combinación cuando target === 'combined'.
// Hybrid recomendado (ver diagnóstico de "landings todas iguales"): la app
// deriva ACÁ, con una semilla real (crypto), los ejes de diseño grandes -no
// se le pide al modelo redactor que "invente" una cadena aleatoria, porque un
// LLM no tiene entropía real y colapsa al cliché de la categoría (lujo sin
// más → oscuro+dorado+serif, siempre). El redactor recibe esas decisiones ya
// tomadas y las tiene que ELABORAR con concreción, no reinventar ni cambiar
// de categoría.
function formatDerivedDecisionsBlock(creativeDirection, withParadigm) {
  const cd = creativeDirection;
  return [
    `- Paradigma de layout: ${cd.layoutParadigm}`,
    withParadigm ? `- Paradigma de interacción (concepto rector): ${cd.interactionParadigm}` : null,
    `- Arquetipo de hero: ${cd.heroArchetype}`,
    `- Paleta derivada (5 hex exactos, roles fijos, ya cumplen WCAG AA): ${cd.paletteFamily}`,
    `- REGLA DE PALETA: manda sobre la convención del rubro. Escribí en DIRECCIÓN VISUAL los 5 hex exactos, cada uno con su rol, UNA sola vez (después referenciá los roles, no repitas hex); permitidos tintes/sombras derivados; no la reemplaces ni la vuelvas blanco y negro${cd.palette && cd.palette.scheme === 'monocromo' ? ' salvo por su esquema monocromo (trabajá con peso, escala y textura)' : ''}.`,
    `- Pareja tipográfica: ${cd.typePairing}`,
    `- Densidad informativa: ${cd.density}`,
    `- Contraste: ${cd.contrast}`,
    `- Ángulo narrativo dominante: ${cd.narrativeAngle}`,
    `- Tratamiento de imágenes: ${cd.imageryTreatment}`,
    `- Firma de movimiento: ${cd.motionSignature}`,
    `- Lenguaje de bordes/esquinas: ${cd.cornerBorderLanguage}`,
    `- Estilo de CTA: ${cd.ctaStyle}`,
    `- Voz de copy: ${cd.copyVoice}`,
    `- Motivación líder a activar: ${cd.leadMotivation}`,
    `- ${describeSectionStructure(cd)} Respetá este orden en ARQUITECTURA DE PÁGINA (podés sumar los bloques extra, sin mover el Hero ni el cierre).`,
    cd.sectionArchetypes.length
      ? `- Bloques narrativos extra sugeridos (usalos si el contexto los justifica, repartidos, no todos al final): ${cd.sectionArchetypes.join(', ')}`
      : null,
  ].filter(Boolean).join('\n');
}

// Presupuestos por encabezado (caracteres) que el redactor debe respetar.
const PROMPT_LENGTH_BUDGETS = {
  'CONCEPTO RECTOR': 1500, 'DIRECCIÓN VISUAL': 2500, 'ARQUITECTURA DE PÁGINA': 4000, 'REQUISITOS TÉCNICOS': 2000,
  'RECURSOS VISUALES': 1500, 'RESTRICCIONES NEGATIVAS': 1200, 'CRITERIOS DE CALIDAD': 900,
};
const PROMPT_TOTAL_TARGET = 20000;
const PROMPT_TOTAL_SOFT_LIMIT = 30000;

function buildLengthBudgetLines(headings, hasConcept) {
  const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const items = headings.filter((h) => PROMPT_LENGTH_BUDGETS[h] && (h !== 'CONCEPTO RECTOR' || hasConcept))
    .map((h) => `${h} ≤ ${fmt(PROMPT_LENGTH_BUDGETS[h])}${h === 'ARQUITECTURA DE PÁGINA' ? ' (≤ 90 palabras por sección)' : ''}`);
  return [
    `PRESUPUESTO DE LONGITUD (obligatorio; densidad sin perder especificidad): el prompt completo apunta a ≤ ${fmt(PROMPT_TOTAL_TARGET)} caracteres y nunca supera ${fmt(PROMPT_TOTAL_SOFT_LIMIT)}. Máximos por bloque, en caracteres: ${items.join('; ')}. Los demás bloques, 2 a 6 líneas cada uno.`,
    'Reglas de estilo: listas densas de una línea por ítem, sin prosa de relleno ni introducciones; no repitas en un bloque lo que ya está en otro (referenciá el bloque en vez de copiarlo); no repitas los hex ni las fuentes en cada sección: definilos una vez en DIRECCIÓN VISUAL y después referenciá los roles ("fondo", "acento", "fuente display"). Conservá siempre lo concreto: hex exactos, nombres de fuente, URLs, medidas, triggers y easings.',
    '',
  ];
}

function buildMetaPrompt(project, verticals, technologies, target, techniques, assets, opts) {
  const t = normalizeTechniques(techniques);
  const on = (id) => t.indexOf(id) !== -1;
  const assetsData = normalizeAssets(assets);
  const withResources = on(4) || on(5) || hasAssetsContent(assetsData);
  const headings = getHeadings(t, { resources: withResources });
  const verticalsData = buildVerticalContextData(verticals);
  const techData = buildTechContextData(target === 'combined' ? technologies : [target]);
  const contextData = formatMetaContextData(project, verticalsData, techData, target);
  const headingsList = headings.map((h, i) => `${i + 1}. ${h}`).join('\n');
  const bannedList = bulletList(BANNED_WORDS);
  const tsec = buildMetaTechniqueSections(t, headings, assetsData);

  // Con la técnica 1 (SSoT) activa la semilla es la cadena visible del usuario
  // (opts.seed); sin ella la dirección se deriva de forma determinista del
  // proyecto y los verticales.
  const metaSeed = makeTechniqueSeed(project, verticals, t, opts && opts.seed);
  const verticalCtx = synthesizeVerticals(verticals);
  const creativeDirection = buildCreativeDirection(metaSeed, verticalCtx);
  const derivedDecisions = formatDerivedDecisionsBlock(creativeDirection, on(2));
  // Técnica 2: concepto rector elegido (opts.concept) o, sin ideación previa, el determinista.
  const concept = on(2) ? ((opts && opts.concept) || buildFallbackConcept(project, creativeDirection)) : null;

  const secIntro = [
    'Sos un Prompt Engineer senior especializado en escribir especificaciones de landing pages para que OTRO modelo de IA las ejecute y produzca el HTML final. Tu tarea AHORA es escribir esa especificación (el prompt), no la landing page en sí.',
    '',
    'REGLA DE SALIDA (obligatoria): tu respuesta completa tiene que ser ÚNICAMENTE el texto del prompt final, listo para copiar y pegar. No agregues preámbulo, saludo, explicación de lo que vas a hacer, ni bloques de código ni comillas triples alrededor. La primera línea de tu respuesta ya tiene que ser el primer encabezado.',
    '',
  ];
  const secStructure = [
    'ESTRUCTURA OBLIGATORIA: el prompt que escribas debe tener EXACTAMENTE estos ' + headings.length + ' encabezados, en este orden, cada uno como una línea propia con el formato `## N. ENCABEZADO` (número y encabezado tal como están escritos abajo, en mayúsculas):',
    headingsList,
    tsec.structureNote,
    '',
  ];
  // Presupuesto de longitud: sin él los redactores se van a ~50 000 caracteres
  // (ARQUITECTURA ~11k, DIRECCIÓN VISUAL ~9k) y repiten hex/fuentes en cada bloque.
  const secBudget = buildLengthBudgetLines(headings, !!concept);
  const secDerivedOn = [
    'DECISIONES DERIVADAS DE LA SEMILLA (obligatorio usarlas; no son sugerencias tuyas para inspirarte, son la dirección que tenés que elaborar): el sistema ya generó una cadena aleatoria real y la usó para elegir estos ejes de diseño. Usalos como base del bloque DIRECCIÓN VISUAL (con hex concretos, nombres de fuente reales -Google Fonts o system stacks- y descripción de grilla) y para dar forma al bloque ARQUITECTURA DE PÁGINA (qué bloques narrativos adicionales incorporar y en qué orden). Podés precisar detalles dentro de la misma categoría (un tono exacto de acento, una proporción exacta) pero NO CAMBIES DE CATEGORÍA ni los sustituyas por otra alternativa:',
    derivedDecisions,
    '',
  ];
  const secDerivedOff = [
    ...tsec.ssotOff,
    derivedDecisions,
    '',
    ...tsec.ssotOffTail,
    '',
  ];
  const secCliche = [
    'PROHIBIDO EL CLICHÉ DE CATEGORÍA: un rubro de lujo NO implica automáticamente fondo oscuro + dorado + serif; un rubro tech NO implica automáticamente azul + sans geométrica; etc. Si la paleta o tipografía derivadas arriba coinciden por azar con el cliché típico del rubro, usalas igual (son las que tocaron), pero NO las reemplaces vos por el cliché "porque el rubro lo pide". La dirección visual sale de las decisiones derivadas de arriba, punto.',
    '',
  ];
  const secConcept = !concept ? [] : [
    'CONCEPTO RECTOR (obligatorio; es el corazón de la técnica de prompt ambicioso): la ambición NO es "elegir un color audaz". Es que la PÁGINA MISMA rompa la norma con un concepto rector tomado del mundo del cliente (la página de un arquitecto ES un plano o una casa 3D que se recorre; el portafolio de un ingeniero de sistemas ES un juego o una réplica de escritorio; la de una relojería de lujo ES un reloj cuyas partes son los paneles y se navega girando la corona). El concepto ya fue elegido: elaboralo con profundidad, NO lo reemplaces por otro ni lo diluyas en una landing convencional:',
    buildConceptoRectorBlock(concept),
    'Reglas del concepto rector (obligatorias):',
    bulletList([
      'Escribí el bloque "CONCEPTO RECTOR" (justo después de CONTEXTO) como bloque de primera clase: qué ES la página, cómo se navega (verbos de interacción), el mapeo de las secciones a partes del concepto, el momento firma, la técnica de construcción, la conversión y la accesibilidad. Debe mencionar la navegación y al menos una sección mapeada.',
      'La página ES el concepto; el scroll vertical clásico no es el modelo de navegación principal (puede existir solo como apoyo secundario).',
      'DIRECCIÓN VISUAL, ARQUITECTURA DE PÁGINA, COPY / MICROCOPY y REQUISITOS TÉCNICOS giran alrededor del concepto. En ARQUITECTURA DE PÁGINA las secciones se convierten en partes o zonas del concepto siguiendo el mapeo, y el orden de secciones sorteado arriba es el ORDEN DE DESCUBRIMIENTO o visita (no de scroll).',
      'Mantené toda la profundidad de psicología, mercado y conversión, pero AL SERVICIO del concepto: cada decisión se explica desde él.',
      'No negociables: el CTA principal se alcanza en 2 interacciones como máximo; navegación completa por teclado con foco visible; una "Vista clásica" o salto al contenido, legible por lectores de pantalla, como alternativa; `prefers-reduced-motion` con versión estática; rendimiento cuidado (animar `transform`/`opacity`, pausar canvas/three.js fuera de viewport).',
      'Los set pieces "guiados por scroll" de AMBICIÓN VISUAL se cumplen DENTRO del concepto (por ejemplo, el scroll o el gesto que gira la pieza, avanza la cámara o mueve la aguja); no uses el scroll vertical clásico como estructura de la página.',
      'En REQUISITOS TÉCNICOS (no en SALIDA FINAL) incluí una línea explícita: la implementación tiene que materializar la navegación y el momento firma del concepto, con la vista clásica como alternativa accesible.',
    ]),
    '',
  ];
  const secSsot = [
    'MECANISMO SSoT (String Seed of Thought) — se aplica DOS VECES, no confundas los dos usos:',
    '(a) Las DECISIONES DERIVADAS DE LA SEMILLA de arriba YA SON el resultado de aplicar el mecanismo por vos: no generes tu propia cadena aleatoria para las decisiones grandes, no las reinventes. Tu trabajo es elaborarlas con profundidad y concreción real, no elegir de nuevo.',
    `(b) Dentro del prompt que estás escribiendo, en el bloque "MECANISMO DE DIVERSIDAD SSoT", tenés que instruir al modelo ejecutor (el que va a construir el HTML) a que use una semilla propia para las decisiones MENORES que ese mismo prompt deje abiertas (acentos secundarios de paleta, escala tipográfica exacta, micro-composición del hero, tratamiento visual puntual de cada sección, matiz de voz, motivos ilustrativos - nunca decisiones grandes, esas ya están fijadas arriba). Para eso, tenés que incluir TEXTUALMENTE y SIN MODIFICARLA la marca \`${SSOT_TOKEN}\` en el lugar donde le decís cuál es su cadena semilla (ejemplo: "Tu cadena semilla es exactamente esta: ${SSOT_TOKEN}"). NO reemplaces esa marca por una cadena inventada por vos ni la traduzcas ni la parafrasees: tiene que aparecer tal cual, con las llaves dobles, porque el sistema la sustituye después, en cada ejecución, por una cadena real distinta. Indicale también que la manipule (suma módulo, hashing, muestreo de caracteres u otra transformación) y que no exponga la cadena ni su razonamiento en el resultado. El objetivo, el contexto, la accesibilidad, los requisitos técnicos y las restricciones deben permanecer intactos sea cual sea la cadena recibida.`,
    '',
  ];
  const secAmbitious = [
    'PROMPT AMBICIOSO (obligatorio; no aceptes un prompt anémico tipo "landing moderna para X"): desarrollá con profundidad real, usando los datos del proyecto de más abajo:',
    '- Usuario: quién es, nivel de conocimiento, contexto, expectativas, frustraciones.',
    '- Mercado: sofisticación, patrones visuales predominantes de la categoría, nivel de competencia frente a los competidores mencionados, qué convenciones conviene romper.',
    '- Psicología: motivaciones, objeciones, sesgos cognitivos pertinentes, respuesta emocional deseada.',
    '- Conversión: objetivo principal, fricción a eliminar, microconversiones, CTA y en qué momento de la página va cada uno.',
    '- Arquitectura: para CADA sección importante de la página, definí objetivo, información, función psicológica, copy, elemento visual, animación/interacción (efecto concreto + trigger: load/scroll/hover/cursor) y CTA y relación con la sección siguiente. Esto va en el bloque ARQUITECTURA DE PÁGINA, con ese nivel de detalle por sección pero en formato denso (≤ 90 palabras por sección, un campo por línea, sin repetir hex ni fuentes). El conjunto y orden de secciones NO tiene que ser siempre el mismo listado A-J: partí del paradigma de layout derivado arriba y de los bloques narrativos adicionales sugeridos. Toda esta profundidad va al servicio del CONCEPTO RECTOR.',
    '- Implementación: las restricciones técnicas concretas de la tecnología objetivo.',
    'La profundidad está al servicio de la decisión, no del volumen: nada de relleno.',
    '',
  ];
  const secSpectacle = [
    'AMBICIÓN VISUAL — MODO ESPECTÁCULO (obligatorio; override explícito de quien encarga sobre cualquier sobriedad por defecto): "prompt ambicioso" no es solo profundidad de negocio, es también ambición visual. La landing tiene que sentirse como una pieza de nivel Awwwards, con personalidad propia, nunca como una plantilla genérica prolija. Presupuesto mínimo de espectáculo, no negociable: un momento animado de firma en el hero, al menos DOS set pieces guiados por scroll, al menos UN elemento 3D, al menos UNA transición de sección con carácter, y micro-interacciones en los CTA. En el bloque DIRECCIÓN VISUAL agregá una subsección explícita titulada "Coreografía de movimiento" que detalle en una línea por pieza de movimiento: qué anima, el trigger (load/scroll/hover/cursor), duración y easing aproximados, la librería a usar (GSAP + ScrollTrigger, Lenis, three.js, o `animation-timeline` nativo de CSS) y el fallback de accesibilidad para `prefers-reduced-motion`. Esto es requisito de formato: la subsección "Coreografía de movimiento" tiene que estar presente y ser concreta, no una mención vaga de "animaciones sutiles".',
    '',
  ];
  const secSubtractive = [
    'DISEÑO SUSTRACTIVO (obligatorio): en el bloque DISEÑO SUSTRACTIVO, para cada sección o elemento candidato preguntate "¿ayuda a comprender, navegar, confiar, decidir o convertir?" y si la respuesta es no, no lo incluyas. Mencioná explícitamente qué se descartó y por qué (evidencia de auditoría, no una afirmación genérica).',
    '',
  ];
  const secRestrictions = [
    'RESTRICCIONES NEGATIVAS (obligatorio): en el bloque RESTRICCIONES NEGATIVAS —y SOLO ahí— incluí la lista de palabras de copy prohibidas (salvo que el contexto realmente las exija) y restricciones visuales, estructurales y de autenticidad. Adaptá las restricciones al contexto real del proyecto (no las copies mecánicamente): sumá las que sean específicas de este vertical y de este proyecto. No repitas ni menciones esta lista de palabras en ningún otro bloque del prompt.',
    'Importante sobre las restricciones visuales (Modo espectáculo): NO prohíbas sombras, profundidad, 3D, degradados expresivos ni esquinas redondeadas — están explícitamente permitidos y buscados cuando son una decisión de diseño intencional; prohibirlos contradice el resto del prompt. Lo que sí tenés que prohibir explícitamente: el degradado genérico "IA" púrpura→azul, bento grid, glassmorphism usado como relleno decorativo sin función, imágenes de stock genéricas o de apariencia sintética, carruseles que auto-rotan sin propósito, animación que oculte contenido o bloquee la lectura, scroll-jacking que rompa la navegación por teclado o el botón atrás del navegador, y layout shift.',
    'Palabras de copy prohibidas (base; podés sumar otras específicas del contexto):',
    bannedList,
    '',
  ];
  const secTechnical = [
    'REQUISITOS TÉCNICOS — mejora progresiva y multimedia (obligatorio, dentro del bloque REQUISITOS TÉCNICOS): para CUALQUIER tecnología objetivo, permití explícitamente cargar por CDN, como mejora progresiva, GSAP + ScrollTrigger (https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js y https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js), Lenis (https://cdn.jsdelivr.net/npm/lenis@1/dist/lenis.min.js) y/o three.js r128 (https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js, global `THREE`); el contenido crítico debe seguir siendo legible si el CDN o JavaScript fallan. Exigí también estrategia de imágenes con fuente real: fotos vía `https://loremflickr.com/<ancho>/<alto>/<keywords-en-inglés>?lock=<n>` con keywords específicas por sección (`source.unsplash.com` está caído, prohibido usarlo), cada `<img>` con `alt`, `width`/`height`, `loading="lazy"` salvo en el hero, y `onerror` con fallback a un SVG ilustrativo inline; sumar ilustraciones/íconos SVG propios; mínimo ~6 elementos visuales en toda la página. Para video: un CC0 estable (https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4) solo si el tema lo justifica, si no una animación procedural en canvas scrubbeada por scroll; siempre con `poster`/fallback. Exigí también los no-negociables de accesibilidad/performance: `prefers-reduced-motion` desactiva el movimiento sin dejar la página vacía, navegación por teclado completa con foco visible, contraste AA mínimo, animar solo `transform`/`opacity`, `loading="lazy"` fuera del viewport inicial, pausar three.js/canvas fuera de viewport con `IntersectionObserver`, y `devicePixelRatio` limitado a 2.',
    '',
  ];
  const secOutput = [
    'SALIDA FINAL (el sistema lo escribe por vos): en el bloque SALIDA FINAL escribí solamente una línea provisional ("Formato de salida según la tecnología objetivo."). El sistema reemplaza ese bloque completo, palabra por palabra, por el contrato de salida real de la tecnología (documento HTML único o proyecto multi-archivo con bloques `=== FILE: ruta ===`). No describas ni contradigas el formato de salida en ningún otro bloque, y no menciones bloques de archivos ni marcadores.',
    '',
  ];

  const secFrameworkNote = [
    'NOTA SOBRE FRAMEWORKS: si las reglas de la tecnología objetivo (más abajo, en los datos del proyecto) indican un proyecto multi-archivo (React, Vue o Next.js), las librerías de movimiento (gsap, lenis, three) se importan como dependencias npm dentro del proyecto y NO se cargan por CDN; en ese caso ignorá lo dicho arriba sobre CDN y seguí las reglas de esa tecnología. Para HTML, Tailwind y Bootstrap sin framework rige lo dicho arriba.',
    '',
  ];

  const text = [
    ...secIntro,
    ...secStructure,
    ...secBudget,
    ...(on(1) ? secDerivedOn : secDerivedOff),
    ...secCliche,
    ...(on(1) ? secSsot : []),
    ...secConcept,
    ...(on(2) ? secAmbitious : tsec.ambitiousOff.concat([''])),
    ...secSpectacle,
    ...(on(6) ? secSubtractive : []),
    ...(on(7) ? secRestrictions : tsec.restrictionsOff.concat([''])),
    ...secTechnical,
    ...secFrameworkNote,
    ...(tsec.resources.length ? tsec.resources.concat(['']) : []),
    ...(tsec.critic.length ? tsec.critic.concat(['']) : []),
    ...(tsec.human.length ? tsec.human.concat(['']) : []),
    ...(tsec.synergy.length ? ['SINERGIA ENTRE LAS TÉCNICAS ACTIVAS (obligatorio respetarla al escribir el prompt):', bulletList(tsec.synergy), ''] : []),
    ...(tsec.noTechniques.length ? tsec.noTechniques.concat(['']) : []),
    ...secOutput,
    contextData,
    '',
    'Ahora escribí el prompt completo, empezando directamente por "## 1. ROL".',
  ].join('\n');

  return { text, creativeDirection, seed: metaSeed, headings, techniques: t, resources: withResources, concept };
}

function buildRepairPrompt(previousOutput, violations, techniques, opts) {
  const n = getHeadings(techniques, opts).length;
  return [
    'Tu respuesta anterior no cumple estos requisitos obligatorios:',
    bulletList(violations),
    '',
    `Corregila. Devolvé de nuevo el prompt COMPLETO ya corregido, con los mismos ${n} encabezados en el mismo orden ("## N. ENCABEZADO"), sin preámbulo ni explicaciones sobre qué corregiste, sin bloques de markdown. La respuesta tiene que ser únicamente el prompt corregido de punta a punta.`,
    '',
    'No modifiques el bloque SALIDA FINAL (el sistema lo reemplaza por el contrato de salida real).',
    'Esto fue lo que habías escrito (corregilo; no lo reescribas desde cero salvo que sea imprescindible):',
    previousOutput,
  ].join('\n');
}

// El número del encabezado ("## 9. X") es tolerante: importa el texto y el
// orden, no que el modelo haya numerado exactamente igual.
function findHeadingIndex(text, heading) {
  const escaped = escapeRegExp(heading);
  const re = new RegExp(`^[ \\t]{0,3}#{0,6}[ \\t]*(?:\\d{1,2}[.)][ \\t]*)?${escaped}[ \\t]*$`, 'im');
  const m = re.exec(text);
  return m ? m.index : -1;
}

// Ubica cada uno de los encabezados activos (getHeadings) dentro del texto y
// devuelve, además de sus posiciones, el cuerpo de cada bloque (usado tanto
// por el validador como por el panel "Dirección creativa" para prompts
// generados por modelo).
function extractPromptSections(text, techniques, opts) {
  const raw = String(text || '');
  const headings = getHeadings(techniques, opts);
  const positions = headings.map((h) => ({ heading: h, index: findHeadingIndex(raw, h) }));
  const sections = {};
  positions.forEach((p, i) => {
    if (p.index === -1) return;
    const next = positions.slice(i + 1).find((q) => q.index !== -1);
    const end = next ? next.index : raw.length;
    sections[p.heading] = raw.slice(p.index, end).trim();
  });
  return { positions, sections };
}

// Valida un prompt generado por modelo contra las reglas operativas de
// prompt.md: los encabezados activos presentes y en orden, ninguna palabra
// prohibida fuera de RESTRICCIONES NEGATIVAS (solo si la técnica 7 está
// activa), longitud no trivial, y que mencione datos concretos del proyecto.
// opts: { project, techniques, resources }. Sin `techniques` = todas.
// ¿El prompt habla de ESTE proyecto? Antes exigía la frase exacta del tema o
// del público y fallaba con cualquier paráfrasis ("relojería artesanal de
// lujo", "relojeria" sin tilde). Ahora compara palabras clave normalizadas
// (sin tildes, signos ni palabras vacías): alcanza con la mitad de las del
// tema, o con un tercio de las del tema + público + oferta.
const PROJECT_STOPWORDS = new Set(['para', 'con', 'sin', 'por', 'los', 'las', 'del', 'una', 'uno', 'unos', 'unas', 'que', 'como', 'sus', 'mas', 'muy', 'entre', 'sobre', 'desde', 'hasta', 'este', 'esta', 'estos', 'estas', 'the', 'and', 'for', 'with']);

function projectKeywords(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .split(/[^a-z0-9ñ]+/)
    .filter((w) => w.length >= 3 && !PROJECT_STOPWORDS.has(w));
}

function promptMentionsProject(text, project) {
  const p = project || {};
  const temaWords = projectKeywords(p.tema);
  const allWords = Array.from(new Set(temaWords.concat(projectKeywords(p.publico), projectKeywords(p.oferta))));
  if (!allWords.length) return true; // sin datos del proyecto no hay contra qué comparar
  const haystack = new Set(projectKeywords(text));
  const ratio = (words) => (words.length ? words.filter((w) => haystack.has(w)).length / words.length : 0);
  return ratio(temaWords) >= 0.5 || ratio(allWords) >= 0.34;
}

function paletteHexesOf(creativeDirection) {
  const fam = creativeDirection && creativeDirection.paletteFamily;
  if (!fam) return [];
  return Array.from(new Set((String(fam).match(/#[0-9a-f]{6}\b/gi) || []).map((h) => h.toUpperCase())));
}

function validateGeneratedPrompt(text, opts) {
  const violations = [];
  const raw = String(text || '');
  const trimmed = raw.trim();
  const o = opts || {};
  const t = normalizeTechniques(o.techniques);
  const { positions, sections } = extractPromptSections(raw, t, o);

  let lastIndex = -1;
  let lastHeading = null;
  positions.forEach((p) => {
    if (p.index === -1) {
      violations.push(`Falta el encabezado "${p.heading}".`);
      return;
    }
    if (p.index < lastIndex) {
      violations.push(`El encabezado "${p.heading}" aparece fuera de orden (debería ir después de "${lastHeading}").`);
    }
    lastIndex = p.index;
    lastHeading = p.heading;
  });

  if (t.indexOf(7) !== -1) {
    const RESTRICCIONES = 'RESTRICCIONES NEGATIVAS';
    Object.keys(sections).forEach((heading) => {
      if (heading === RESTRICCIONES) return;
      const body = sections[heading];
      BANNED_WORDS.forEach((word) => {
        const wordRe = new RegExp(`\\b${escapeRegExp(word)}\\b`, 'i');
        if (wordRe.test(body)) violations.push(`"${word}" aparece fuera de RESTRICCIONES NEGATIVAS (en "${heading}").`);
      });
    });
  }

  const MIN_LENGTH = 1200;
  if (trimmed.length < MIN_LENGTH) {
    violations.push(`El prompt es demasiado corto (${trimmed.length} caracteres; se esperaban al menos ${MIN_LENGTH}) para ser un Prompt Ambicioso.`);
  }

  // Fix de diversidad (SSoT real): el bloque MECANISMO DE DIVERSIDAD SSoT
  // tiene que contener la marca literal {{SSOT_SEED}} sin modificar, porque
  // el sistema la sustituye por una semilla fresca en cada ejecución. Solo
  // aplica con la técnica 1 activa.
  if (t.indexOf(1) !== -1) {
    const ssotBody = sections['MECANISMO DE DIVERSIDAD SSoT'] || '';
    if (ssotBody.indexOf(SSOT_TOKEN) === -1) {
      violations.push(`Falta la marca literal "${SSOT_TOKEN}" (sin modificar) dentro del bloque "MECANISMO DE DIVERSIDAD SSoT".`);
    }
  }

  // ¿Respeta la paleta derivada? Al menos 2 de sus hex base tienen que
  // aparecer en DIRECCIÓN VISUAL (la familia "opuesta a la convención" no
  // trae hex fijos y se salta).
  const paletteHexes = paletteHexesOf(o.creativeDirection);
  if (paletteHexes.length >= 2) {
    const dv = (sections['DIRECCIÓN VISUAL'] || '').toUpperCase();
    const used = paletteHexes.filter((h) => dv.indexOf(h) !== -1);
    if (used.length < 2) {
      violations.push(`La DIRECCIÓN VISUAL no usa la paleta derivada de la semilla ("${o.creativeDirection.paletteFamily}"): incluí sus hex exactos (${paletteHexes.join(', ')}) y no la reemplaces por blanco y negro.`);
    }
  }

  const project = o.project || {};
  if (!promptMentionsProject(trimmed, project)) {
    violations.push(`El prompt no menciona datos específicos del proyecto: parece genérico. Tiene que nombrar el tema ("${project.tema || ''}") y el público ("${project.publico || ''}") con esas palabras.`);
  }

  // Técnica 2 (concepto rector): el bloque tiene que existir, ser sustancial,
  // hablar de navegación y mapear al menos una sección.
  if (t.indexOf(2) !== -1 && sections['CONCEPTO RECTOR']) {
    const cr = getSectionBody(sections, 'CONCEPTO RECTOR');
    const norm = cr.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    if (cr.length < 350) {
      violations.push(`El bloque "CONCEPTO RECTOR" es demasiado corto (${cr.length} caracteres; se esperaban al menos 350): tiene que decir qué ES la página, cómo se navega, el mapeo de secciones a partes del concepto y el momento firma.`);
    }
    if (!/naveg|arrastr|gira|rota|zoom|jueg|abr[ei]|explor|toca|clic|elig|hoje|desplieg|oper|recorr/.test(norm)) {
      violations.push('El bloque "CONCEPTO RECTOR" no describe la navegación: indicá cómo se recorre la página (girar, arrastrar, zoom, jugar, abrir, elegir…), sin depender del scroll vertical clásico.');
    }
    if (!/hero|portada|problema|oferta|caracteristicas|prueba social|testimonio|objecion|cierre|cta/.test(norm)) {
      violations.push('El bloque "CONCEPTO RECTOR" no mapea ninguna sección (hero, problema, oferta, prueba social, objeciones, cierre) a una parte del objeto o espacio del concepto.');
    }
  }

  // Modo espectáculo (override de usuario sobre prompt.md — ver
  // DOCUMENTACION.md): aplica SIEMPRE, incluso con 0 técnicas activas.
  const direccionVisualBody = sections['DIRECCIÓN VISUAL'] || '';
  if (!/coreograf[íi]a de movimiento/i.test(direccionVisualBody)) {
    violations.push('Falta la subsección "Coreografía de movimiento" (concreta: qué anima, trigger, easing, librería, fallback de accesibilidad) dentro de "DIRECCIÓN VISUAL".');
  }
  if (!/scroll/i.test(trimmed)) {
    violations.push('El prompt no menciona ninguna experiencia guiada por scroll (Modo espectáculo la exige).');
  }
  if (!/\b3d\b|three\.?js/i.test(trimmed)) {
    violations.push('El prompt no menciona ningún elemento 3D (three.js, CSS 3D o similar), requerido por el Modo espectáculo.');
  }
  if (!/prefers-reduced-motion/i.test(trimmed)) {
    violations.push('El prompt no menciona `prefers-reduced-motion` como fallback de accesibilidad para el movimiento.');
  }

  return { ok: violations.length === 0, violations, sections, positions };
}

// ---- Validaciones SUAVES (una sola reparación conjunta; nunca caen a plantilla) ----

// Sinónimos por sección (texto normalizado: minúsculas, sin tildes).
const SECTION_SYNONYMS = {
  hero: /\b(hero|portada|apertura)\b/,
  'problema-solucion': /(problema|solucion|dolor)/,
  caracteristicas: /(caracteristica|oferta|coleccion|producto|servicio|beneficio)/,
  'prueba-social': /(prueba social|testimonio|resena|opinion|voces|evidencia)/,
  objeciones: /(objecion|pregunta|duda|faq)/,
  'cta-final': /(cierre|cta final|reserv|llamado a la accion|call to action)/,
};

function normalizeForMatch(str) {
  return String(str || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

// Clave de sección de una línea-título (la mención más temprana gana).
function classifySectionLine(line) {
  const norm = normalizeForMatch(line);
  let best = null;
  Object.keys(SECTION_SYNONYMS).forEach((k) => {
    const m = SECTION_SYNONYMS[k].exec(norm);
    if (m && (best === null || m.index < best.index)) best = { key: k, index: m.index };
  });
  return best && best.key;
}

// Secuencia de claves (primera aparición de cada una) en las líneas-título de
// un bloque: "## …", "1. …", "**…**" y, con allowBullets, "- …" (mapeo del concepto).
function extractSectionSequence(body, allowBullets) {
  const seq = [];
  String(body || '').split('\n').forEach((line) => {
    if (line.length > 160) return;
    const isTitle = /^\s{0,3}#{2,6}\s+\S/.test(line) || /^\s{0,3}\d{1,2}[.)]\s+\S/.test(line)
      || /^\s{0,3}(?:[-*•]\s+)?\*\*[^*]+\*\*/.test(line)
      || (allowBullets && /^\s{0,3}[-*•]\s+\S/.test(line));
    if (!isTitle) return;
    const head = line.replace(/^\s*(?:#{2,6}|\d{1,2}[.)]|[-*•])\s*/, '').replace(/\*\*/g, '').slice(0, 70);
    const key = classifySectionLine(head);
    if (key && seq.indexOf(key) === -1) seq.push(key);
  });
  return seq;
}

// ¿ARQUITECTURA DE PÁGINA (y, con la técnica 2, el mapeo del CONCEPTO RECTOR)
// nombra las secciones en el orden sorteado? Tolera bloques extra, nombres de
// partes del concepto y secciones ausentes; sin ≥3 secciones reconocibles no opina.
function validateSectionOrder(text, opts) {
  const o = opts || {};
  const order = (o.creativeDirection && o.creativeDirection.sectionOrder) || [];
  if (order.length < 3) return [];
  const t = normalizeTechniques(o.techniques);
  const { sections } = extractPromptSections(text, t, o);
  const labels = order.map((k) => SECTION_LABELS[k] || k).join(' → ');
  const out = [];
  const check = (seq, where) => {
    const found = seq.filter((k) => order.indexOf(k) !== -1);
    if (found.length < 3) return;
    const expected = order.filter((k) => found.indexOf(k) !== -1);
    if (expected.join('|') === found.join('|')) return;
    const detected = found.map((k) => SECTION_LABELS[k] || k).join(' → ');
    out.push(`El orden de secciones en ${where} no respeta el sorteado (${labels}): se detectó ${detected}. Reordená ${where === 'ARQUITECTURA DE PÁGINA' ? (t.indexOf(2) !== -1 ? 'las secciones (orden de visita del concepto)' : 'las secciones') : 'el mapeo'} según ese orden; los bloques extra pueden intercalarse sin mover esas secciones.`);
  };
  check(extractSectionSequence(getSectionBody(sections, 'ARQUITECTURA DE PÁGINA'), false), 'ARQUITECTURA DE PÁGINA');
  if (t.indexOf(2) !== -1) check(extractSectionSequence(getSectionBody(sections, 'CONCEPTO RECTOR'), true), 'el mapeo de CONCEPTO RECTOR');
  return out;
}

// Longitud: por encima de PROMPT_TOTAL_SOFT_LIMIT pide condensar (sin perder lo concreto).
function validatePromptLength(text) {
  const n = String(text || '').trim().length;
  if (n <= PROMPT_TOTAL_SOFT_LIMIT) return [];
  return [`El prompt mide ${n} caracteres (máximo ${PROMPT_TOTAL_SOFT_LIMIT}; objetivo ≤ ${PROMPT_TOTAL_TARGET}). Condensalo respetando los presupuestos por bloque: listas densas, sin prosa de relleno ni repeticiones de hex/fuentes entre bloques. Conservá todos los encabezados, la marca ${SSOT_TOKEN} (si existe), los hex exactos, las URLs y los datos concretos.`];
}

// Todas las validaciones suaves juntas (una única reparación).
function collectSoftViolations(text, assets, techniques, opts) {
  return validateAssetCoherence(text, assets, techniques)
    .concat(validateSectionOrder(text, Object.assign({}, opts, { techniques })))
    .concat(validatePromptLength(text));
}

// Post-proceso de última instancia (ver constraint D del fix de diversidad):
// si el modelo redactor omitió la marca {{SSOT_SEED}} pese a la instrucción
// explícita, se inserta acá mecánicamente al final del bloque MECANISMO DE
// DIVERSIDAD SSoT. Sin la técnica 1 no hay bloque ni marca: no-op.
function forceInsertSSoTToken(text, techniques, opts) {
  const raw = String(text || '');
  if (!hasTechnique(techniques, 1)) return raw;
  const { positions } = extractPromptSections(raw, techniques, opts);
  const idx = getHeadings(techniques, opts).indexOf('MECANISMO DE DIVERSIDAD SSoT');
  const pos = positions[idx];
  if (!pos || pos.index === -1) return raw;
  const next = positions.slice(idx + 1).find((p) => p.index !== -1);
  const insertAt = next ? next.index : raw.length;
  const insertion = `\nTu cadena semilla para las decisiones menores que este documento deja abiertas es exactamente esta: ${SSOT_TOKEN}\n\n`;
  return raw.slice(0, insertAt) + insertion + raw.slice(insertAt);
}

// Cuerpo de una sección (sin la línea del encabezado).
function getSectionBody(sections, heading) {
  const s = sections && sections[heading];
  if (!s) return '';
  const nl = s.indexOf('\n');
  return nl === -1 ? '' : s.slice(nl + 1).trim();
}

// El contrato de SALIDA FINAL lo escribe la app (buildSalidaFinalBlock), no el
// modelo: define si la ejecución es un HTML único o un proyecto multi-archivo
// (`=== FILE: … ===`) y no puede alterarse. Como es el último encabezado,
// se reemplaza todo desde su línea hasta el final del texto por el bloque
// canónico, conservando la línea de encabezado que escribió el modelo.
function enforceSalidaFinal(text, salidaBody, techniques, opts) {
  const raw = String(text || '');
  if (!salidaBody || !String(salidaBody).trim()) return raw;
  const headings = getHeadings(techniques, opts);
  const idx = findHeadingIndex(raw, 'SALIDA FINAL');
  if (idx === -1 || headings[headings.length - 1] !== 'SALIDA FINAL') return raw;
  const nl = raw.indexOf('\n', idx);
  const headingLine = nl === -1 ? raw.slice(idx) : raw.slice(idx, nl);
  return `${raw.slice(0, idx)}${headingLine}\n\n${String(salidaBody).trim()}\n`;
}

/* -------------------------------------------------------------------------
 * Recursos visuales (técnicas 4/5) y hook de la Fase D
 * ------------------------------------------------------------------------- */

function emptyAssets() {
  return { referenceNotes: '', required: [], photos: [], generated: [], videos: [], notices: [] };
}

function normalizeAssets(assets) {
  const a = Object.assign(emptyAssets(), assets || {});
  ['required', 'photos', 'generated', 'videos', 'notices'].forEach((k) => { if (!Array.isArray(a[k])) a[k] = []; });
  a.referenceNotes = String(a.referenceNotes || '');
  return a;
}

function hasAssetsContent(assets) {
  const a = normalizeAssets(assets);
  return !!(a.referenceNotes.trim() || a.required.length || a.photos.length || a.generated.length || a.videos.length);
}

/* -------------------------------------------------------------------------
 * Fase D — recolección de recursos reales (multimedia)
 *
 * collectAssets(ctx) corre ANTES de que el redactor escriba el prompt y no
 * toca el DOM ni la red por sí misma: recibe sus dependencias en ctx
 * (api.*, llm, setStage, cancelled), así se testea con mocks.
 *   ctx: { project, verticals, techniques, direction, media:{references,required},
 *          origin, frames:{id:[{mime,dataBase64}]}, cache, api:{status,describe,search,generateImage},
 *          llm(prompt) -> {ok,text,error}, setStage(label), cancelled(), log(msg) }
 * Cada etapa falla en blando: se anota un aviso (notices) y se sigue.
 * ------------------------------------------------------------------------- */

const PEXELS_HOME = 'https://www.pexels.com';
const IMAGE_SIZES = { landscape: [1344, 768], square: [1024, 1024], portrait: [768, 1344] };
const PHOTO_NEGATIVES = 'no over-saturated colors, no perfect skin, no plastic textures, no looking at camera, no generic office background, documentary film grain';

function absoluteMediaUrl(url, origin) {
  const u = String(url || '');
  return (u.charAt(0) === '/' && (u.indexOf('/media/') === 0 || u.indexOf('/banco/') === 0)) ? `${origin || ''}${u}` : u;
}

function urlBase(url) {
  return String(url || '').split('?')[0].replace(/^https?:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?(?=\/media\/)/, '');
}

function humanizeAssetName(name) {
  const base = String(name || '').replace(/\.[a-z0-9]{2,5}$/i, '').replace(/[-_]+/g, ' ').trim();
  return base || 'Imagen del proyecto';
}

// JSON tolerante: quita vallas ``` y toma el primer objeto/arreglo balanceado.
function parseJsonLoose(text) {
  const raw = String(text || '').replace(/```(?:json)?/gi, '');
  const start = raw.search(/[[{]/);
  if (start === -1) return null;
  const open = raw[start];
  const close = open === '{' ? '}' : ']';
  const end = raw.lastIndexOf(close);
  if (end <= start) return null;
  try { return JSON.parse(raw.slice(start, end + 1)); } catch (e) { return null; }
}

function briefLines(project) {
  const p = project || {};
  return [
    `Tema: ${p.tema || ''}`, `Público: ${p.publico || ''}`, `Oferta: ${p.oferta || ''}`, `Objetivo: ${p.objetivo || ''}`,
    p.tono ? `Tono: ${p.tono}` : '', p.restriccionesAdicionales ? `Restricciones: ${p.restriccionesAdicionales}` : '',
    p.descripcion ? `Descripción general: ${truncateDescripcion(p.descripcion, 800)}` : '',
  ].filter(Boolean).join('\n');
}

// Descripción libre de Setup: se compacta (espacios) y se corta a `max`.
function truncateDescripcion(text, max) {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
}

/* ---------- Setup: "Completar campos con IA" ---------- */

const SETUP_AI_FIELDS = ['tema', 'publico', 'oferta', 'objetivo', 'competidores', 'tono', 'referenciasVisuales', 'propuestaValor', 'restriccionesAdicionales'];
const SETUP_AI_MIN_CHARS = 30;

function buildSetupFillPrompt(descripcion) {
  return [
    'Sos un estratega de marca. A partir de la descripción libre de un proyecto, completá los datos de un formulario de briefing para una landing page.',
    '',
    'DESCRIPCIÓN:',
    truncateDescripcion(descripcion, 3000),
    '',
    'Devolvé SOLO un objeto JSON (sin explicación, sin vallas de código) con exactamente estas claves, todas con texto en español:',
    '{"tema":"","publico":"","oferta":"","objetivo":"","competidores":"","tono":"","referenciasVisuales":"","propuestaValor":"","restriccionesAdicionales":""}',
    '',
    'Reglas:',
    '- tema: rubro o tema en pocas palabras. publico: quién compra o usa, concreto. oferta: qué se vende o se ofrece. objetivo: la acción de conversión (ej: "Reservar una pieza"). competidores: tipo de competencia directa.',
    '- tono, referenciasVisuales, propuestaValor, restriccionesAdicionales: inferilos solo si la descripción los sugiere.',
    '- Sé concreto y breve (una línea por campo). Inferí lo razonable, pero NUNCA inventes nombres de marca, cifras, precios ni datos que la descripción no implique.',
    '- Si un dato no se puede inferir, dejá el campo como cadena vacía "".',
  ].join('\n');
}

// Devuelve { ok, fields } (solo claves conocidas con texto) o { ok:false, error }.
function parseSetupFillResponse(text) {
  const j = parseJsonLoose(text);
  if (!j || typeof j !== 'object' || Array.isArray(j)) {
    return { ok: false, error: 'La IA no devolvió un JSON válido. Probá de nuevo o completá los campos a mano.' };
  }
  const fields = {};
  SETUP_AI_FIELDS.forEach((f) => {
    const v = j[f];
    if (typeof v === 'string' || typeof v === 'number') {
      const s = String(v).replace(/\s+/g, ' ').trim().slice(0, 400);
      if (s) fields[f] = s;
    }
  });
  if (!Object.keys(fields).length) {
    return { ok: false, error: 'La IA no pudo inferir ningún campo con esa descripción. Sumá más detalle e intentá de nuevo.' };
  }
  return { ok: true, fields };
}

function buildSearchQueriesPrompt({ project, referenceNotes, direction, wantVideo, roles }) {
  return [
    'Sos fotógrafo editorial y director de arte. Necesito búsquedas para un banco de fotos de stock (Pexels) para esta landing page.',
    '',
    briefLines(project),
    direction ? `\nDIRECCIÓN VISUAL (resumen):\n${direction}` : '',
    referenceNotes ? `\nREFERENCIA VISUAL (guía de estilo):\n${referenceNotes}` : '',
    (roles && roles.length) ? `\nYa hay multimedia obligatoria para estos roles (no busques lo mismo): ${roles.join(', ')}.` : '',
    '',
    'Devolvé SOLO un JSON (sin explicación, sin vallas) con esta forma:',
    '{"photos":[{"query":"...","role":"hero|producto|galería|fondo|equipo|otro","orientation":"landscape|portrait|square"}]' + (wantVideo ? ',"videos":[{"query":"..."}]' : '') + '}',
    '',
    'Reglas:',
    '- 4 a 8 búsquedas de fotos, una por sección o rol (hero, producto/oferta, prueba social, galería, fondo, cierre), concretas al tema y al público.',
    '- Las consultas en INGLÉS, 3 a 6 palabras, con sujeto + escena + luz o material (ej: "watchmaker hands macro workshop warm light"). Nada genérico como "business" o "success".',
    '- Evitá logos, texto y personas posando mirando a cámara.',
    wantVideo ? '- 1 o 2 búsquedas de video: movimiento sutil y cinematográfico apto como fondo de hero (sin personas ni texto), en inglés.' : '',
  ].filter((l) => l !== null && l !== undefined).join('\n');
}

// «Sugerir búsqueda» del paso 2: 1 a 3 consultas en inglés con lo que ya se sabe
// del proyecto (datos, concepto, decisiones de la semilla). Devuelve el mismo JSON que parseSearchQueries.
function buildSuggestSearchPrompt({ project, direction, referenceNotes, conceptBrief, video }) {
  return [
    `Sos director de arte. Sugerí de 1 a 3 búsquedas para encontrar ${video ? 'un video' : 'fotos'} de stock en un banco (Pexels/Pixabay) para esta landing page.`,
    '',
    briefLines(project),
    direction ? `\nDIRECCIÓN VISUAL (resumen):\n${direction}` : '',
    referenceNotes ? `\nREFERENCIA VISUAL (guía de estilo):\n${referenceNotes}` : '',
    conceptBrief ? `\nCONCEPTO RECTOR: ${conceptBrief}` : '',
    '',
    'Devolvé SOLO un JSON (sin explicación, sin vallas): {"photos":[{"query":"...","orientation":"landscape|portrait|square"}]}',
    '',
    'Reglas:',
    '- Consultas en INGLÉS, 3 a 6 palabras, con sujeto + escena + luz o material. Nada genérico como "business" o "success".',
    video ? '- Movimiento sutil y cinematográfico apto como fondo de hero, sin personas ni texto.' : '- Evitá logos, texto y personas posando mirando a cámara.',
  ].filter((l) => l !== null && l !== undefined).join('\n');
}

function parseSearchQueries(text) {
  const j = parseJsonLoose(text);
  const arr = Array.isArray(j) ? j : (j && Array.isArray(j.photos) ? j.photos : []);
  const videosRaw = (j && !Array.isArray(j) && Array.isArray(j.videos)) ? j.videos : [];
  const clean = (x) => {
    const it = typeof x === 'string' ? { query: x } : x;
    if (!it || typeof it.query !== 'string' || !it.query.trim()) return null;
    return {
      query: it.query.trim().slice(0, 120),
      role: typeof it.role === 'string' ? it.role.trim().slice(0, 40) : '',
      orientation: ['landscape', 'portrait', 'square'].indexOf(it.orientation) !== -1 ? it.orientation : 'landscape',
    };
  };
  return { photos: arr.map(clean).filter(Boolean).slice(0, 8), videos: videosRaw.map(clean).filter(Boolean).slice(0, 2) };
}

function buildImagePromptsPrompt({ project, referenceNotes, direction, restrictions, conceptBrief }) {
  return [
    'Sos director de arte. Primero se generan las imágenes de la landing y después se maqueta alrededor de ellas. Escribí prompts para un generador de imágenes (FLUX).',
    '',
    briefLines(project),
    direction ? `\nDIRECCIÓN VISUAL (resumen):\n${direction}` : '',
    referenceNotes ? `\nREFERENCIA VISUAL (respetá su estilo, paleta y mood):\n${referenceNotes}` : '',
    conceptBrief ? `\nCONCEPTO RECTOR (los activos lo expresan): ${conceptBrief}` : '',
    '',
    'Devolvé SOLO un JSON (sin explicación, sin vallas): [{"role":"hero|textura|ilustración","aspect":"landscape|square|portrait","prompt":"..."}]',
    '',
    'Reglas:',
    '- 2 a 4 activos: un hero, una textura de fondo o material y, si suma, una ilustración de marca.',
    '- Cada prompt en INGLÉS y concreto: sujeto, materiales, iluminación, lente, encuadre, paleta (hex o nombres) tomada de la dirección visual/referencia.',
    '- Consistencia absoluta entre los activos: misma iluminación, mismo ángulo de cámara, misma paleta.',
    '- Sin texto, sin logos, sin marcas de agua dentro de la imagen.',
    '- El hero debe dejar una zona amplia y calma (espacio negativo) en un lado del encuadre para colocar el titular y el CTA; el sujeto va del lado opuesto.',
    restrictions ? `- Incluí en cada prompt estas negativas fotográficas: ${PHOTO_NEGATIVES}.` : '',
  ].filter(Boolean).join('\n');
}

function parseImagePrompts(text) {
  const j = parseJsonLoose(text);
  const arr = Array.isArray(j) ? j : (j && Array.isArray(j.images) ? j.images : []);
  return arr.map((x) => {
    const it = typeof x === 'string' ? { prompt: x } : x;
    if (!it || typeof it.prompt !== 'string' || it.prompt.trim().length < 12) return null;
    const aspect = IMAGE_SIZES[it.aspect] ? it.aspect : 'landscape';
    return { role: typeof it.role === 'string' ? it.role.trim().slice(0, 40) : '', aspect, width: IMAGE_SIZES[aspect][0], height: IMAGE_SIZES[aspect][1], prompt: it.prompt.trim().slice(0, 800) };
  }).filter(Boolean).slice(0, 4);
}

// Median cut sobre RGBA plano (Uint8ClampedArray | Array): devuelve hasta k hex.
function medianCutPalette(rgba, k) {
  const want = k || 5;
  const px = [];
  for (let i = 0; i + 3 < rgba.length; i += 4) {
    if (rgba[i + 3] < 128) continue;
    px.push([rgba[i], rgba[i + 1], rgba[i + 2]]);
  }
  if (!px.length) return [];
  let boxes = [px];
  const range = (box) => {
    const mn = [255, 255, 255]; const mx = [0, 0, 0];
    box.forEach((p) => { for (let c = 0; c < 3; c++) { if (p[c] < mn[c]) mn[c] = p[c]; if (p[c] > mx[c]) mx[c] = p[c]; } });
    const r = [mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]];
    const ch = r[0] >= r[1] && r[0] >= r[2] ? 0 : (r[1] >= r[2] ? 1 : 2);
    return { ch, size: r[ch] };
  };
  while (boxes.length < want) {
    let bestIdx = -1; let best = 0;
    boxes.forEach((b, i) => { if (b.length < 2) return; const r = range(b); const score = r.size * Math.sqrt(b.length); if (score > best) { best = score; bestIdx = i; } });
    if (bestIdx === -1 || best === 0) break;
    const box = boxes[bestIdx];
    const { ch } = range(box);
    box.sort((a, b) => a[ch] - b[ch]);
    const mid = box.length >> 1;
    boxes.splice(bestIdx, 1, box.slice(0, mid), box.slice(mid));
  }
  boxes = boxes.filter((b) => b.length).sort((a, b) => b.length - a.length);
  const hex = (n) => n.toString(16).padStart(2, '0').toUpperCase();
  const out = [];
  boxes.forEach((b) => {
    const m = [0, 0, 0];
    b.forEach((p) => { m[0] += p[0]; m[1] += p[1]; m[2] += p[2]; });
    const h = `#${hex(Math.round(m[0] / b.length))}${hex(Math.round(m[1] / b.length))}${hex(Math.round(m[2] / b.length))}`;
    if (out.indexOf(h) === -1) out.push(h);
  });
  return out.slice(0, want);
}

function mergePalettes(lists, k) {
  const out = [];
  (lists || []).forEach((l) => (l || []).forEach((h) => { if (out.indexOf(h) === -1) out.push(h); }));
  return out.slice(0, k || 8);
}

function buildReferenceNotes(entries) {
  const lines = [];
  (entries || []).forEach((e) => {
    if (!e) return;
    if (e.description) lines.push(e.description.trim());
    if (e.palette && e.palette.length) lines.push(`Paleta medida en los píxeles${e.name ? ` de "${e.name}"` : ''}: ${e.palette.join(', ')}.`);
  });
  return lines.join('\n');
}

/* ---- Activos generados como REFERENCIA de diseño (técnicas 4 y 5) ---- */

const VIDEO_MOTIONS = ['zoom-in', 'zoom-out', 'pan-left', 'pan-right'];
const HEX6_RE = /^#[0-9a-f]{6}$/i;

function cleanLayoutText(v, max) {
  return String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, max || 120);
}

// Forma común del análisis (Gemini o local): nunca devuelve algo inutilizable.
function normalizeLayoutAnalysis(obj, source) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return null;
  const colors = (Array.isArray(obj.colors) ? obj.colors : []).map((h) => String(h || '').trim()).filter((h) => HEX6_RE.test(h)).map((h) => h.toUpperCase()).slice(0, 5);
  const tone = cleanLayoutText(obj.textTone, 12).toLowerCase();
  const out = {
    colors,
    subject: cleanLayoutText(obj.subject),
    negativeSpace: cleanLayoutText(obj.negativeSpace),
    textTone: (tone === 'claro' || tone === 'oscuro') ? tone : '',
    light: cleanLayoutText(obj.light),
    texture: cleanLayoutText(obj.texture),
    mood: cleanLayoutText(obj.mood),
    bestUse: cleanLayoutText(obj.bestUse, 40),
    source: source || 'gemini',
  };
  if (!out.colors.length && !out.negativeSpace) return null;
  return out;
}

function parseLayoutAnalysis(text, source) {
  return normalizeLayoutAnalysis(parseJsonLoose(text), source || 'gemini');
}

// Análisis local sobre píxeles RGBA (w x h): 5 colores dominantes + grilla 3x3
// de luminancia y detalle (desvío + gradiente) para ubicar el espacio libre.
function analyzeLayoutGrid(rgba, w, h, roleHint) {
  const W = Math.max(1, w | 0); const H = Math.max(1, h | 0);
  const lum = new Float32Array(W * H);
  for (let i = 0, p = 0; i + 3 < rgba.length && p < lum.length; i += 4, p++) {
    lum[p] = (0.2126 * rgba[i] + 0.7152 * rgba[i + 1] + 0.0722 * rgba[i + 2]) / 255;
  }
  const cells = [];
  for (let gy = 0; gy < 3; gy++) {
    for (let gx = 0; gx < 3; gx++) {
      const x0 = Math.floor(gx * W / 3); const x1 = Math.max(x0 + 1, Math.floor((gx + 1) * W / 3));
      const y0 = Math.floor(gy * H / 3); const y1 = Math.max(y0 + 1, Math.floor((gy + 1) * H / 3));
      let sum = 0; let sum2 = 0; let n = 0; let grad = 0; let gn = 0;
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const v = lum[y * W + x];
          sum += v; sum2 += v * v; n++;
          if (x + 1 < x1) { grad += Math.abs(lum[y * W + x + 1] - v); gn++; }
          if (y + 1 < y1) { grad += Math.abs(lum[(y + 1) * W + x] - v); gn++; }
        }
      }
      const mean = n ? sum / n : 0;
      const sd = Math.sqrt(Math.max(0, (n ? sum2 / n : 0) - mean * mean));
      cells.push({ mean, detail: 0.5 * sd + 0.5 * (gn ? grad / gn : 0) });
    }
  }
  const avg = (idx, key) => idx.reduce((a, i) => a + cells[i][key], 0) / idx.length;
  const regions = [
    { label: 'tercio izquierdo', idx: [0, 3, 6] },
    { label: 'centro', idx: [1, 4, 7] },
    { label: 'tercio derecho', idx: [2, 5, 8] },
    { label: 'franja superior', idx: [0, 1, 2] },
    { label: 'franja inferior', idx: [6, 7, 8] },
  ].map((r) => Object.assign(r, { detail: avg(r.idx, 'detail'), mean: avg(r.idx, 'mean') }));
  const free = regions.slice().sort((a, b) => a.detail - b.detail)[0];
  const cols = regions.slice(0, 3).sort((a, b) => b.detail - a.detail)[0];
  const overall = avg([0, 1, 2, 3, 4, 5, 6, 7, 8], 'mean');
  const overallDetail = avg([0, 1, 2, 3, 4, 5, 6, 7, 8], 'detail');
  const tone = free.mean < 0.4 ? 'oscuro' : (free.mean > 0.62 ? 'claro' : 'de tono medio');
  const smooth = free.detail < 0.05 ? ' y liso' : ' con poco detalle';
  const leftMean = avg([0, 3, 6], 'mean'); const rightMean = avg([2, 5, 8], 'mean');
  const topMean = avg([0, 1, 2], 'mean'); const botMean = avg([6, 7, 8], 'mean');
  let light = 'difusa, sin dirección marcada';
  if (Math.abs(leftMean - rightMean) >= 0.08 && Math.abs(leftMean - rightMean) >= Math.abs(topMean - botMean)) light = leftMean > rightMean ? 'viene de la izquierda' : 'viene de la derecha';
  else if (Math.abs(topMean - botMean) >= 0.08) light = topMean > botMean ? 'viene de arriba' : 'viene de abajo';
  const palette = medianCutPalette(rgba, 5);
  const role = String(roleHint || '').toLowerCase();
  return {
    colors: palette,
    subject: `${cols.label} (zona con más detalle)`,
    negativeSpace: `${free.label} ${tone}${smooth}`,
    textTone: free.mean < 0.5 ? 'claro' : 'oscuro',
    light,
    texture: overallDetail < 0.05 ? 'lisa o degradado suave' : (overallDetail < 0.14 ? 'suave, detalle moderado' : 'con mucho detalle'),
    mood: overall < 0.35 ? 'oscuro y sobrio' : (overall > 0.65 ? 'luminoso y aireado' : 'equilibrado'),
    bestUse: /textura|fondo/.test(role) ? 'fondo de sección' : (/ilustraci|acento/.test(role) ? 'acento' : (overallDetail < 0.05 ? 'fondo de sección' : 'hero')),
    source: 'local',
    brightness: Number(overall.toFixed(3)),
    grid: cells.map((c) => Number(c.mean.toFixed(3))),
  };
}

function buildShotListPrompt({ project, referenceNotes, direction, conceptBrief, tema }) {
  return [
    'Sos director de fotografía. Vamos a montar un video corto (6 a 10 s) para el hero de una landing page a partir de fotogramas clave generados con IA y movidos con zoom/paneo. Escribí el plan de tomas.',
    '',
    briefLines(project || { tema }),
    direction ? `\nDIRECCIÓN VISUAL (resumen):\n${direction}` : '',
    referenceNotes ? `\nREFERENCIA VISUAL (respetá su estilo, paleta y mood):\n${referenceNotes}` : '',
    conceptBrief ? `\nCONCEPTO RECTOR (la secuencia lo cuenta): ${conceptBrief}` : '',
    '',
    'Devolvé SOLO un JSON (sin explicación, sin vallas): {"shots":[{"prompt":"...","motion":"zoom-in|zoom-out|pan-left|pan-right"}]}',
    '',
    'Reglas:',
    '- 3 o 4 tomas de la MISMA escena, en orden narrativo: por ejemplo plano general con acercamiento lento, detalle del sujeto, revelación del contexto.',
    '- Cada prompt en INGLÉS y concreto (sujeto, materiales, lente, encuadre) con exactamente la misma iluminación, el mismo horario y la misma paleta en todas las tomas (nombrá la luz y 2 o 3 colores en cada prompt).',
    '- Composición apta para texto: dejá una zona amplia y calma (espacio negativo) en un lado del encuadre. Formato apaisado 16:9.',
    '- Sin personas mirando a cámara, sin texto, sin logos, sin marcas de agua.',
    '- motion: cómo se mueve la cámara sobre ese fotograma (acercamiento, alejamiento, paneo); alterná para dar ritmo.',
  ].filter((l) => l !== null && l !== undefined && l !== false).join('\n');
}

function parseShotList(text) {
  const j = parseJsonLoose(text);
  const arr = Array.isArray(j) ? j : (j && Array.isArray(j.shots) ? j.shots : []);
  return arr.map((x, i) => {
    const it = typeof x === 'string' ? { prompt: x } : x;
    if (!it || typeof it.prompt !== 'string' || it.prompt.trim().length < 12) return null;
    return { prompt: it.prompt.trim().slice(0, 800), motion: VIDEO_MOTIONS.indexOf(it.motion) !== -1 ? it.motion : VIDEO_MOTIONS[i % VIDEO_MOTIONS.length] };
  }).filter(Boolean).slice(0, 4);
}

// Hero generado: la imagen con rol hero o, si no hay, la primera.
function pickHeroGenerated(assets) {
  const a = normalizeAssets(assets);
  return a.generated.find((g) => /hero/i.test(g.role || '')) || a.generated[0] || null;
}

// Validación SUAVE (1 reparación): con técnica 4 y activos generados, el prompt
// debe citar la URL del hero generado y hablar de composición / espacio libre.
function validateAssetCoherence(text, assets, techniques) {
  const t = normalizeTechniques(techniques);
  const hero = pickHeroGenerated(assets);
  if (t.indexOf(4) === -1 || !hero) return [];
  const body = String(text || '');
  const out = [];
  const base = urlBase(hero.url);
  if (base && body.indexOf(base) === -1) out.push(`El prompt no cita la URL exacta de la imagen hero generada (${hero.url}): usala en el hero y en RECURSOS VISUALES.`);
  if (!/espacio libre|espacio negativo|negative space|composici[oó]n/i.test(body)) out.push('El prompt no menciona la composición ni el espacio libre de la imagen hero: indicá dónde van el titular y el CTA dentro de ese espacio libre.');
  return out;
}

function describeLayoutLine(g) {
  const an = g && g.analysis;
  if (!an) return '';
  const bits = [];
  if (an.colors && an.colors.length) bits.push(`colores: ${an.colors.join(', ')}`);
  if (an.subject) bits.push(`sujeto: ${an.subject}`);
  if (an.negativeSpace) bits.push(`espacio libre: ${an.negativeSpace}${an.textTone ? ` (texto ${an.textTone})` : ''}`);
  if (an.light) bits.push(`luz: ${an.light}`);
  if (an.texture) bits.push(`textura: ${an.texture}`);
  if (an.mood) bits.push(`mood: ${an.mood}`);
  if (an.bestUse) bits.push(`mejor uso: ${an.bestUse}`);
  return bits.join(' · ');
}

// Bloque REFERENCIA DESDE LOS ACTIVOS GENERADOS (líneas del prompt).
function buildGeneratedReferenceLines(assets) {
  const a = normalizeAssets(assets);
  if (!a.generated.length) return [];
  const lines = ['REFERENCIA DESDE LOS ACTIVOS GENERADOS (obligatoria: la página se diseña alrededor de los activos generados, no los pega encima):'];
  const measured = a.generated.map((g) => ({ g, line: describeLayoutLine(g) })).filter((x) => x.line);
  a.videos.filter((v) => v.source === 'ffmpeg' && v.analysis).forEach((v) => measured.push({ g: Object.assign({}, v, { role: `${v.role || 'hero'} (póster del video)` }), line: describeLayoutLine(v) }));
  measured.forEach(({ g, line }) => lines.push(`- ${g.role || 'imagen'} · ${g.url} · ${line}`));
  const hero = pickHeroGenerated(a);
  lines.push(bulletList([
    hero ? `Hero: componé el titular, el subtítulo y el CTA DENTRO del espacio libre de la imagen hero (${hero.url}) — decidí la grilla (posición, alineación, ancho de columna) en función de ese espacio libre y poné el sujeto del lado opuesto; no cubras el sujeto con texto. Nombrá explícitamente la composición y el espacio libre en la sección del hero. Un degradado o velo sutil solo si hace falta para contraste AA.` : null,
    'Paleta: conservá los hex de la semilla/dirección visual, pero asigná sus roles (fondo, superficie, acento, texto, énfasis) para que armonicen con los colores medidos de las imágenes; se permiten tintes y sombras derivados con `color-mix(in oklab, …)`. Que el acento del CTA sea el color de mayor contraste frente al espacio libre.',
    'Texturas: cada activo de rol textura/fondo se usa como fondo de sección (`background-image` con `background-size: cover`, velo o `mix-blend-mode` si hace falta), alternando secciones para dar ritmo, sin repetir la del hero.',
    'Ilustración de marca: su estilo (trazo, geometría, peso, paleta) define el estilo de los íconos y ornamentos SVG de toda la página.',
    'Luz: sombras, brillos y degradados de la interfaz respetan la dirección de luz medida; tipografía y radios acompañan el mood de las imágenes.',
  ].filter(Boolean)));
  return lines;
}

// Tope de análisis de visión (multimedia obligatoria + fotos de stock) por generación.
const MAX_MEDIA_ANALYSES = 5;

/* ---- Recursos pre-generados (paso 2, técnicas 4 y 5) ----
 * El panel "Recursos generados" del paso 2 genera (o elige de la biblioteca)
 * imágenes y video ANTES del prompt. collectAssets(ctx.pregen) los usa tal cual
 * y omite la generación propia. Comparten estas piezas con el pipeline, así no
 * hay dos implementaciones de la generación. Todo recibe sus dependencias en `c`
 * (api, llm, setStage, cancelled, log, notice, origin, project...).
 */
const PREGEN_KEY = 'lpa_pregen_v1';
const PREGEN_MAX_ITEMS = 8;

function emptyPregen() { return { tema: '', images: [], videos: [] }; }

function normalizePregen(p) {
  const src = (p && typeof p === 'object') ? p : {};
  const out = emptyPregen();
  out.tema = typeof src.tema === 'string' ? src.tema.slice(0, 200) : '';
  const okUrl = (u) => typeof u === 'string' && /^(?:https?:\/\/[^\s"'<>]+|\/(?:media|banco)\/[^\s"'<>]+)$/.test(u.trim());
  const num = (n) => (Number.isFinite(Number(n)) && Number(n) > 0 ? Number(n) : undefined);
  const clean = (x, video) => {
    if (!x || !okUrl(x.url)) return null;
    const it = {
      id: typeof x.id === 'string' && /^[\w-]{3,40}$/.test(x.id) ? x.id : `p${Math.random().toString(36).slice(2, 10)}`,
      url: x.url.trim(),
      role: typeof x.role === 'string' ? x.role.trim().slice(0, 40) : '',
      alt: typeof x.alt === 'string' ? x.alt.trim().slice(0, 200) : '',
      width: num(x.width), height: num(x.height),
      prompt: typeof x.prompt === 'string' ? x.prompt.slice(0, 800) : '',
      source: typeof x.source === 'string' ? x.source.slice(0, 40) : '',
      origin: x.origin === 'library' ? 'library' : (x.origin === 'stock' ? 'stock' : 'generated'),
    };
    // Créditos del banco de fotos: solo para el panel Recursos (la página no los lleva)
    if (typeof x.credit === 'string' && x.credit.trim()) it.credit = x.credit.trim().slice(0, 160);
    if (typeof x.creditUrl === 'string' && /^https:\/\/[^\s"'<>]+$/.test(x.creditUrl.trim())) it.creditUrl = x.creditUrl.trim().slice(0, 400);
    if (x.analysis && typeof x.analysis === 'object') it.analysis = x.analysis;
    if (video) {
      it.poster = okUrl(x.poster) ? x.poster.trim() : '';
      if (okUrl(x.webm)) it.webm = x.webm.trim();
      it.duration = num(x.duration);
    }
    return it;
  };
  const list = (arr, video) => (Array.isArray(arr) ? arr : []).map((x) => clean(x, video)).filter(Boolean).slice(0, PREGEN_MAX_ITEMS);
  out.images = list(src.images, false);
  out.videos = list(src.videos, true);
  return out;
}

function loadPregen() {
  const raw = safeGetItem(PREGEN_KEY);
  if (!raw) return emptyPregen();
  try { return normalizePregen(JSON.parse(raw)); } catch (e) { return emptyPregen(); }
}
function savePregen(p) { return safeSetItem(PREGEN_KEY, JSON.stringify(normalizePregen(p))); }

// Recursos pre-generados que aplican a las técnicas activas.
function activePregen(pregen, techniques) {
  const p = normalizePregen(pregen);
  const t = normalizeTechniques(techniques);
  return { images: t.indexOf(4) !== -1 ? p.images : [], videos: t.indexOf(5) !== -1 ? p.videos : [] };
}

// Qué servicio usará cada "Generar" según /api/media/status + Configuración.
// -> { images:{ok,label}, videos:{ok,label,mode}, line }
function describeMediaBackends(status, prefs) {
  const s = status || {};
  const p = prefs || {};
  const canStock = !!(s.pexels || s.pixabay);
  const stockName = s.pexels && s.pixabay ? 'Pexels/Pixabay' : (s.pexels ? 'Pexels' : 'Pixabay');
  const images = { ok: false, label: 'no disponible' };
  const videos = { ok: false, label: 'no disponible', mode: p.video || 'generated' };
  if (s.unreachable) {
    images.label = videos.label = 'sin servidor';
  } else {
    if (p.images === 'none') images.label = 'desactivadas en Configuración';
    else if (p.images === 'pollinations') Object.assign(images, { ok: true, label: 'Pollinations' });
    else if (p.images === 'cloudflare' && !s.cloudflare) images.label = 'Cloudflare sin clave';
    else if (s.cloudflare) Object.assign(images, { ok: true, label: 'Cloudflare FLUX' });
    else if (s.pollinations) Object.assign(images, { ok: true, label: 'Pollinations' });
    if (videos.mode === 'none') videos.label = 'desactivado en Configuración';
    else if (videos.mode === 'stock') {
      if (canStock) Object.assign(videos, { ok: true, label: `stock ${stockName}` });
      else videos.label = 'stock sin claves';
    } else if (s.ffmpeg && s.cloudflare) Object.assign(videos, { ok: true, label: 'fotogramas IA + ffmpeg' });
    else if (canStock) Object.assign(videos, { ok: true, label: `stock ${stockName} (respaldo)` });
    else videos.label = 'sin ffmpeg/Cloudflare ni claves de stock';
  }
  const line = (images.ok || videos.ok)
    ? `Imágenes: ${images.label} · Video: ${videos.label}${(images.ok && videos.ok) ? '' : ' · lo no disponible: usá la biblioteca'}`
    : 'Sin API: usá la biblioteca';
  return { images, videos, line };
}

// Convierte un ítem pre-generado en un activo del pool (misma forma que los generados en el pipeline).
function pregenToAsset(p, origin, tema, video) {
  const abs = (u) => absoluteMediaUrl(u, origin);
  const credit = p.credit ? { credit: p.credit, creditUrl: p.creditUrl } : {};
  if (!video && p.origin === 'stock') {
    // Foto de internet elegida ANTES del prompt: se trata como activo generado (la página se diseña alrededor)
    return Object.assign({
      url: abs(p.url), type: 'foto', role: p.role || 'imagen', alt: p.alt || `${p.role || 'Imagen'} para ${tema || 'la marca'}`,
      width: p.width, height: p.height, source: p.source || 'stock', analysis: p.analysis, pregen: true,
    }, credit);
  }
  if (!video) {
    return {
      url: abs(p.url), type: 'imagen generada', role: p.role || 'imagen',
      alt: p.alt || `${p.role || 'Imagen'} para ${tema || 'la marca'}`,
      width: p.width, height: p.height, prompt: p.prompt || undefined, source: p.source || (p.origin === 'library' ? 'biblioteca' : ''),
      analysis: p.analysis, pregen: true,
    };
  }
  return Object.assign({
    url: abs(p.url), poster: abs(p.poster || ''), webm: p.webm ? abs(p.webm) : undefined, type: 'video', role: p.role || 'hero',
    source: p.source || (p.origin === 'library' ? 'biblioteca' : 'ffmpeg'), width: p.width, height: p.height, duration: p.duration,
    alt: p.alt || `Video de fondo de ${tema || 'la marca'}`, analysis: p.analysis, pregen: true,
  }, credit);
}

// Genera UNA imagen. -> { item } | { error }.
async function generateImageItem(c, spec) {
  const g = await c.api.generateImage({ prompt: spec.prompt, width: spec.width, height: spec.height });
  if (g && g.ok && g.data && g.data.url) {
    return {
      item: {
        url: absoluteMediaUrl(g.data.url, c.origin || ''), type: 'imagen generada', role: spec.role || 'imagen',
        alt: `${spec.role || 'Imagen'} generada para ${((c.project && c.project.tema) || 'la marca')}`,
        width: g.data.width, height: g.data.height, prompt: spec.prompt, source: g.data.source,
      },
    };
  }
  return { error: (g && g.error) || 'sin respuesta' };
}

// Video por fotogramas IA + ffmpeg. -> { video } | { why } (motivo del fallo).
async function generateFramesVideo(c, status, referenceNotes) {
  const setStage = c.setStage || (() => {});
  const cancelled = c.cancelled || (() => false);
  const log = c.log || (() => {});
  const api = c.api;
  if (!status.ffmpeg) return { why: 'ffmpeg no está disponible en el servidor' };
  if (!status.cloudflare) return { why: 'Cloudflare no está configurado (faltan CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN en .env)' };
  if (!api.generateVideo) return { why: 'el servidor no soporta el montaje de video' };
  try {
    setStage('Planeando la secuencia de video…');
    const res = await c.llm(buildShotListPrompt({ project: c.project, referenceNotes, direction: c.direction, conceptBrief: c.conceptBrief }));
    const shots = (res && res.ok) ? parseShotList(res.text) : [];
    if (shots.length < 3) return { why: 'el modelo no propuso una secuencia de 3 o 4 tomas utilizable' };
    const frames = [];
    let lastErr = '';
    for (let k = 0; k < shots.length; k++) {
      if (cancelled()) return { why: 'la generación se canceló' };
      setStage(`Generando fotograma ${k + 1}/${shots.length}…`);
      // eslint-disable-next-line no-await-in-loop -- secuencial a propósito: cuota gratuita y consistencia
      const g = await api.generateImage({ prompt: shots[k].prompt, width: 1280, height: 720 });
      if (g && g.ok && g.data && g.data.url) frames.push({ url: g.data.url, motion: shots[k].motion });
      else lastErr = (g && g.error) || 'sin respuesta';
    }
    if (frames.length < 2) return { why: `solo se generaron ${frames.length} de ${shots.length} fotogramas${lastErr ? ` (${lastErr})` : ''}` };
    if (cancelled()) return { why: 'la generación se canceló' };
    setStage('Montando el video…');
    const v = await api.generateVideo({ frames: frames.map((f) => f.url), motion: frames.map((f) => f.motion), durationPerFrame: 2.2, fps: 24, width: 1280, height: 720 });
    if (!(v && v.ok && v.data && v.data.url)) return { why: (v && v.error) || 'sin respuesta del servidor' };
    const origin = c.origin || '';
    return {
      video: {
        url: absoluteMediaUrl(v.data.url, origin), poster: absoluteMediaUrl(v.data.poster || '', origin),
        webm: v.data.webm ? absoluteMediaUrl(v.data.webm, origin) : undefined,
        type: 'video', role: 'hero', source: 'ffmpeg', width: v.data.width, height: v.data.height, duration: v.data.duration,
        alt: `Video de fondo de ${((c.project && c.project.tema) || 'la marca')} (fotogramas generados con IA)`,
      },
    };
  } catch (e) {
    log(`video generado: ${(e && e.message) || e}`);
    return { why: 'ocurrió un error inesperado' };
  }
}

// Video de stock (Pexels/Pixabay). -> { videos: [], notices: [] }
async function searchStockVideos(c, status, videoQueries) {
  const setStage = c.setStage || (() => {});
  const log = c.log || (() => {});
  const origin = c.origin || '';
  const out = { videos: [], notices: [] };
  if (!(status.pexels || status.pixabay)) {
    out.notices.push('Video de stock omitido: no hay PEXELS_API_KEY ni PIXABAY_API_KEY configuradas.');
    return out;
  }
  try {
    setStage('Buscando video…');
    const vq = (videoQueries && videoQueries.length) ? videoQueries : [{ query: `${(c.project && c.project.tema) || 'abstract'} cinematic slow motion`, orientation: 'landscape', role: 'hero' }];
    const found = await c.api.search({ queries: vq.slice(0, 2), type: 'video', perQuery: 1 });
    if (found && found.ok && found.data) {
      (found.data.items || []).slice(0, 2).forEach((it) => {
        out.videos.push(Object.assign({}, it, { url: absoluteMediaUrl(it.url, origin), poster: absoluteMediaUrl(it.poster || '', origin), type: 'video', role: it.role || 'hero' }));
      });
      if (!out.videos.length) out.notices.push('No se encontró un video de stock adecuado.');
    } else {
      out.notices.push(`No se pudo buscar video (${(found && found.error) || 'sin respuesta'}).`);
    }
  } catch (e) {
    log(`video: ${(e && e.message) || e}`);
    out.notices.push('Falló la búsqueda de video; se continúa sin él.');
  }
  return out;
}

// Hosts de imágenes remotas que el servidor acepta en describe.remoteUrls (lista
// cerrada, igual a media.js REMOTE_DESCRIBE_HOSTS). Fotos de Pexels y CDN de Pixabay.
function isDescribableRemote(u) {
  return /^https:\/\/(?:images\.pexels\.com|cdn\.pixabay\.com)\//i.test(String(u || ''));
}

// Analiza (Gemini 'layout' o canvas local) los ítems que aún no tienen análisis.
// targets: [{ item, url, role }]. Muta item.analysis. Devuelve avisos.
async function analyzeGeneratedTargets(targets, c, status) {
  const api = c.api;
  const cancelled = c.cancelled || (() => false);
  const log = c.log || (() => {});
  const notices = [];
  const pending = targets.filter((tg) => !tg.item.analysis);
  if (!pending.length) return notices;
  let geminiFailed = '';
  const gate = visionGate(status, c);
  for (const tg of pending) {
    if (cancelled()) break;
    let an = null;
    try {
      const sameOrigin = !/^https?:\/\//i.test(urlBase(tg.url));
      const body = /^\/media\//.test(urlBase(tg.url)) ? { assetIds: [urlBase(tg.url)], mode: 'layout' }
        : (isDescribableRemote(tg.url) ? { remoteUrls: [tg.url], mode: 'layout' } : null);
      if (gate.on && body) {
        // eslint-disable-next-line no-await-in-loop
        const r = await api.describe(body);
        if (r && r.ok && r.data && r.data.description) an = parseLayoutAnalysis(r.data.description, 'gemini');
        if (!an && !geminiFailed) geminiFailed = (r && r.error) || 'respuesta ilegible';
      }
      // El canvas solo mide imágenes del mismo origen (una remota lo contamina)
      if (!an && api.analyzeLocal && sameOrigin) {
        // eslint-disable-next-line no-await-in-loop
        an = normalizeLayoutAnalysis(await api.analyzeLocal(tg.url, tg.role), 'local');
      }
    } catch (e) { log(`análisis: ${(e && e.message) || e}`); }
    if (an) tg.item.analysis = an;
  }
  if (geminiFailed) notices.push(`El análisis con ${gate.name} falló (${geminiFailed}): se usó el análisis local de colores y espacio libre.`);
  else if (!gate.on && gate.reason) notices.push(`${gate.reason}: se usó el análisis local de colores y espacio libre.`);
  if (!pending.some((tg) => tg.item.analysis)) notices.push('No se pudo analizar la composición de los activos generados: el redactor no tiene su espacio libre medido.');
  return notices;
}

// Recolecta los recursos reales. Ver contrato arriba.
// ctx.pregen ({images, videos}): recursos ya generados/elegidos en el paso 2;
// reemplazan la generación propia de las técnicas 4 y 5 (sin llamadas duplicadas).
async function collectAssets(ctx) {
  const c = ctx || {};
  const assets = emptyAssets();
  const t = normalizeTechniques(c.techniques);
  const on = (id) => t.indexOf(id) !== -1;
  const media = c.media || { references: [], required: [] };
  const origin = c.origin || '';
  const cache = c.cache || {};
  const api = c.api;
  const setStage = c.setStage || (() => {});
  const cancelled = c.cancelled || (() => false);
  const log = c.log || (() => {});
  const notice = (msg) => { if (assets.notices.indexOf(msg) === -1) assets.notices.push(msg); };
  if (!api) return assets;

  let status = { pexels: false, pixabay: false, cloudflare: false, gemini: false, ffmpeg: false };
  try {
    const r = await api.status();
    if (r && r.ok && r.data) status = Object.assign(status, r.data);
  } catch (e) { notice('No se pudo consultar el estado de los servicios de multimedia.'); }

  // a) Referencias -> descripción (Gemini) o paleta local
  const refs = (media.references || []).filter((m) => m && m.url);
  if (refs.length && !cancelled()) {
    try {
      setStage('Analizando referencia…');
      const key = refs.map((r) => r.url).join('|');
      let description = cache.describe && cache.describe[key];
      const gate = visionGate(status, c);
      if (!description && gate.on) {
        const images = refs.filter((r) => r.type !== 'video').map((r) => r.url);
        const frames = [];
        refs.filter((r) => r.type === 'video').forEach((r) => {
          const fr = (c.frames && c.frames[r.id]) || [];
          if (fr.length) fr.forEach((f) => frames.push(f)); else images.push(r.url);
        });
        const res = await api.describe({ assetIds: images.slice(0, 3), frames: frames.slice(0, 8) });
        if (res && res.ok && res.data && res.data.description) {
          description = res.data.description;
          if (cache.describe) cache.describe[key] = description;
          if (res.data.notice) notice(res.data.notice);
        } else {
          notice(`No se pudo describir la referencia con ${gate.name} (${(res && res.error) || 'sin respuesta'}): se usa solo la paleta medida.`);
        }
      } else if (!description) {
        notice(gate.reason ? `${gate.reason}: la referencia se resume solo con su paleta de colores (extraída en el navegador).` : 'Gemini no está configurado: la referencia se resume solo con su paleta de colores (extraída en el navegador).');
      }
      const palette = mergePalettes(refs.map((r) => r.palette), 8);
      assets.referenceNotes = buildReferenceNotes([{ description: description || '', palette, name: refs.length === 1 ? refs[0].name : '' }]);
    } catch (e) {
      log(`referencia: ${(e && e.message) || e}`);
      notice('Falló el análisis de la referencia visual; se continúa sin él.');
    }
  }

  // b) Multimedia obligatoria
  (media.required || []).filter((m) => m && m.url).forEach((m) => {
    assets.required.push({
      url: absoluteMediaUrl(m.url, origin), type: m.type === 'video' ? 'video' : 'imagen', role: m.role || 'otro',
      alt: (m.caption && m.caption.trim()) || humanizeAssetName(m.name), name: m.name || '', source: 'usuario',
      width: m.width, height: m.height,
    });
  });
  if (cancelled()) return assets;

  // c) Fotos reales SIEMPRE (Pexels -> Pixabay) + e) video de stock (técnica 5)
  const canStock = !!(status.pexels || status.pixabay);
  const videoMode = ['generated', 'stock', 'none'].indexOf(c.videoMode) !== -1 ? c.videoMode : 'generated';
  const pre = activePregen(c.pregen, t);
  const preImgs = pre.images;
  const preVids = pre.videos;
  const temaName = (c.project && c.project.tema) || '';
  const wantVideo = on(5) && videoMode !== 'none' && !preVids.length;
  let queries = { photos: [], videos: [] };
  if (!canStock) {
    notice('Fotografía real omitida: no hay PEXELS_API_KEY ni PIXABAY_API_KEY configuradas en el servidor (.env).');
  } else {
    try {
      setStage('Planeando búsquedas de fotos…');
      const roles = assets.required.map((r) => r.role).filter(Boolean);
      const res = await c.llm(buildSearchQueriesPrompt({ project: c.project, referenceNotes: assets.referenceNotes, direction: c.direction, wantVideo, roles }));
      if (res && res.ok) queries = parseSearchQueries(res.text);
      if (!queries.photos.length) {
        // Respaldo determinista si el modelo no devolvió JSON usable
        const tema = ((c.project && c.project.tema) || '').trim();
        if (tema) queries.photos = [{ query: tema, role: 'hero', orientation: 'landscape' }, { query: `${tema} detail`, role: 'galería', orientation: 'landscape' }];
        notice('El modelo no propuso búsquedas utilizables: se usaron búsquedas genéricas a partir del tema.');
      }
      if (cancelled()) return assets;
      setStage('Buscando fotos reales…');
      const found = await api.search({ queries: queries.photos, type: 'photo', perQuery: 2 });
      if (found && found.ok && found.data) {
        const seen = new Set(assets.required.map((r) => urlBase(r.url)));
        // Lo elegido en el paso 2 (internet, biblioteca o generado) ya es un activo: no se duplica
        preImgs.concat(preVids).forEach((p) => { seen.add(urlBase(absoluteMediaUrl(p.url, origin))); });
        (found.data.items || []).forEach((it) => {
          const url = absoluteMediaUrl(it.url, origin);
          if (seen.has(urlBase(url)) || assets.photos.length >= 14) return;
          seen.add(urlBase(url));
          assets.photos.push(Object.assign({}, it, { url, type: 'foto', role: it.role || '' }));
        });
        (found.data.notices || []).forEach((n) => { if (!/^Sin resultados/.test(n)) notice(n); });
      } else {
        notice(`No se pudieron buscar fotos (${(found && found.error) || 'sin respuesta'}).`);
      }
    } catch (e) {
      log(`fotos: ${(e && e.message) || e}`);
      notice('Falló la búsqueda de fotos reales; se continúa sin ellas.');
    }
  }
  if (cancelled()) return assets;

  // d) Técnica 4: imágenes generadas ANTES de escribir el prompt.
  // Con imágenes pre-generadas (paso 2) se usan tal cual y no se genera nada.
  if (preImgs.length) {
    preImgs.forEach((p) => assets.generated.push(pregenToAsset(p, origin, temaName, false)));
  } else if (on(4)) {
    try {
      setStage('Diseñando imágenes a generar…');
      const res = await c.llm(buildImagePromptsPrompt({ project: c.project, referenceNotes: assets.referenceNotes, direction: c.direction, restrictions: on(7), conceptBrief: c.conceptBrief }));
      const prompts = (res && res.ok) ? parseImagePrompts(res.text) : [];
      if (!prompts.length) notice('El modelo no propuso prompts de imagen utilizables: no se generaron imágenes.');
      for (let i = 0; i < prompts.length; i++) {
        if (cancelled()) break;
        setStage(`Generando imagen ${i + 1}/${prompts.length}…`);
        // eslint-disable-next-line no-await-in-loop -- secuencial a propósito: cuota gratuita y consistencia
        const g = await generateImageItem(c, prompts[i]);
        if (g.item) assets.generated.push(g.item);
        else notice(`No se pudo generar la imagen ${i + 1}: ${g.error}`);
      }
    } catch (e) {
      log(`imágenes: ${(e && e.message) || e}`);
      notice('Falló la generación de imágenes; se continúa sin ellas.');
    }
  }
  if (cancelled()) return assets;

  // e) Técnica 5: video GENERADO (fotogramas IA + ffmpeg) con respaldo de stock
  // (o el video pre-generado del paso 2, sin volver a generarlo)
  if (preVids.length) {
    preVids.forEach((p) => assets.videos.push(pregenToAsset(p, origin, temaName, true)));
  } else if (wantVideo) {
    let fallback = videoMode === 'stock';
    if (videoMode === 'generated') {
      const r = await generateFramesVideo(c, status, assets.referenceNotes);
      if (r.video) assets.videos.push(r.video);
      else {
        fallback = true;
        notice(`No se generó el video (${r.why}); ${canStock ? 'se usa un video de stock como respaldo.' : 'y no hay claves de stock para el respaldo.'}`);
      }
    }
    if (fallback && !cancelled()) {
      const s = await searchStockVideos(c, status, queries.videos);
      s.videos.forEach((v) => assets.videos.push(v));
      s.notices.forEach(notice);
    }
  }
  if (cancelled()) return assets;

  // f) Análisis de los activos generados (imágenes + póster del video): base de la maqueta.
  // Solo los que aún no tienen análisis (los pre-generados suelen traerlo).
  const targets = assets.generated.map((g) => ({ item: g, url: g.url, role: g.role }))
    .concat(assets.videos.filter((v) => v.poster && (v.source === 'ffmpeg' || (v.pregen && (/^\/media\//.test(urlBase(v.poster)) || isDescribableRemote(v.poster))))).map((v) => ({ item: v, url: v.poster, role: v.role })));
  if (targets.some((tg) => !tg.item.analysis)) {
    setStage('Analizando activos generados…');
    (await analyzeGeneratedTargets(targets, Object.assign({}, c, { cancelled, log }), status)).forEach(notice);
  }

  // g) Visión sobre la multimedia colocada: obligatorias (subidas) + las mejores
  // fotos de stock, para que el redactor las ubique sabiendo dónde hay espacio
  // libre. Secuencial, tope MAX_MEDIA_ANALYSES por generación y caché por URL.
  if (!cancelled() && (assets.required.some((r) => r.type === 'imagen') || assets.photos.length)) {
    const mediaPath = (u) => { const m = /\/media\/[^?#]+/.exec(String(u || '')); return m ? m[0] : ''; };
    const isPexelsRemote = (u) => /^https:\/\/images\.pexels\.com\//i.test(String(u || ''));
    const roleRank = (r) => { const x = String(r || '').toLowerCase(); return x === 'hero' ? 0 : (x === 'producto' ? 1 : 2); };
    const photoPool = assets.photos.map((x, i) => ({ x, i })).sort((a, b) => (roleRank(a.x.role) - roleRank(b.x.role)) || (a.i - b.i)).map((o) => o.x);
    const reqImgs = assets.required.filter((r) => r.type === 'imagen').sort((a, b) => roleRank(a.role) - roleRank(b.role));
    const photoQuota = Math.min(photoPool.length, reqImgs.length <= 2 ? 3 : 2);
    const picked = reqImgs.slice(0, MAX_MEDIA_ANALYSES - photoQuota).concat(photoPool.slice(0, photoQuota)).slice(0, MAX_MEDIA_ANALYSES);
    const store = cache.describe || null;
    let done = 0;
    let geminiFailed = '';
    let skippedRemote = 0;
    const gate = visionGate(status, c);
    setStage('Analizando la multimedia…');
    for (const item of picked) {
      if (cancelled() || done >= MAX_MEDIA_ANALYSES) break;
      const ckey = `layout|${urlBase(item.url)}`;
      const hit = store && store[ckey];
      if (hit) { item.analysis = hit; continue; }
      let an = null;
      try {
        if (gate.on) {
          const path = mediaPath(item.url);
          const body = path ? { assetIds: [path], mode: 'layout' } : (isPexelsRemote(item.url) ? { remoteUrls: [item.url], mode: 'layout' } : null);
          if (body) {
            done++;
            // eslint-disable-next-line no-await-in-loop
            const r = await api.describe(body);
            if (r && r.ok && r.data && r.data.description) an = parseLayoutAnalysis(r.data.description, 'gemini');
            if (!an && !geminiFailed) geminiFailed = (r && r.error) || 'respuesta ilegible';
          }
        }
        if (!an && api.analyzeLocal) {
          if (mediaPath(item.url) && !isPexelsRemote(item.url)) {
            if (!gate.on) done++;
            // eslint-disable-next-line no-await-in-loop
            an = normalizeLayoutAnalysis(await api.analyzeLocal(item.url, item.role), 'local');
          } else if (!gate.on) skippedRemote++;
        }
      } catch (e) { log(`análisis multimedia: ${(e && e.message) || e}`); }
      if (an) { item.analysis = an; if (store) store[ckey] = an; }
    }
    if (geminiFailed) notice(`El análisis de la multimedia con ${gate.name} falló (${geminiFailed}): se usó el análisis local donde fue posible.`);
    else if (!gate.on && gate.reason) notice(`${gate.reason}: se usó el análisis local donde fue posible.`);
    if (skippedRemote) notice('Las fotos remotas de stock no se analizan sin visión con IA (el navegador no puede medir imágenes de otro origen).');
  }
  return assets;
}

// Lista plana de recursos citables (con su tipo de origen).
function listAssetEntries(assets) {
  const a = normalizeAssets(assets);
  const out = [];
  a.required.forEach((x) => out.push({ group: 'required', item: x }));
  a.generated.forEach((x) => out.push({ group: 'generated', item: x }));
  a.photos.forEach((x) => out.push({ group: 'photos', item: x }));
  a.videos.forEach((x) => out.push({ group: 'videos', item: x }));
  return out;
}

// ¿Cuántos recursos aparecen realmente en el HTML/archivos ejecutados?
// Se compara la URL sin query string (los modelos suelen recortarla).
function assetUsage(assets, text) {
  const body = String(text || '');
  const entries = listAssetEntries(assets);
  const isUsed = (it) => {
    const base = urlBase(it.url);
    return !!base && body.indexOf(base) !== -1;
  };
  const rows = entries.map((e) => ({ group: e.group, item: e.item, used: isUsed(e.item) }));
  const photos = rows.filter((r) => r.group === 'photos');
  const stock = rows.filter((r) => r.used && (r.group === 'photos' || r.group === 'videos') && /pexels/i.test(r.item.source || r.item.credit || ''));
  return {
    total: rows.length,
    used: rows.filter((r) => r.used).length,
    missingRequired: rows.filter((r) => r.group === 'required' && !r.used).map((r) => r.item),
    missingGenerated: rows.filter((r) => r.group === 'generated' && !r.used).map((r) => r.item),
    photosTotal: photos.length,
    photosUsed: photos.filter((r) => r.used).length,
    unusedPhotos: photos.filter((r) => !r.used).map((r) => r.item),
    needsPexelsCredit: false, // la página no exige crédito a Pexels (no va a producción por ahora)
  };
}

function usageNeedsFix(usage) {
  return usage.missingRequired.length > 0 || (usage.photosTotal > 0 && usage.photosUsed === 0);
}

// Instrucción para la pasada de edición IA que inserta lo que faltó.
function buildMissingAssetsInstruction(usage, project) {
  const lines = ['Incorporá a la landing los recursos visuales que faltan, sin cambiar el resto del diseño, la estructura ni los scripts existentes. Usá las URLs EXACTAS de esta lista:'];
  usage.missingRequired.forEach((r) => {
    lines.push(`- OBLIGATORIO · ${r.type === 'video' ? 'video' : 'imagen'} · rol: ${r.role || 'otro'} · URL: ${r.url} · alt: "${r.alt}" (colocalo en el lugar que corresponda a su rol${r.role === 'hero' ? ': en el hero' : ''}).`);
  });
  if (usage.photosTotal > 0 && usage.photosUsed === 0) {
    lines.push('Además la página no usa ninguna de las fotos reales reunidas. Insertá al menos 3 de estas en secciones donde aporten (hero, galería, prueba social), cada `<img>` con `alt` descriptivo, `width`, `height` y `loading="lazy"` salvo el hero:');
    usage.unusedPhotos.slice(0, 6).forEach((p) => lines.push(`- URL: ${p.url} · alt sugerido: "${p.alt || ''}" · crédito: ${p.credit || ''}`));
  }
  if (project && project.tema) lines.push(`Contexto: landing de "${project.tema}".`);
  return lines.join('\n');
}

// Quita del texto (prompt) las líneas que citan la URL de un recurso removido.
function removeAssetFromText(text, url) {
  const base = urlBase(url);
  if (!base) return String(text || '');
  return String(text || '').split('\n').filter((line) => line.indexOf(base) === -1).join('\n');
}

function removeAssetFromAssets(assets, url) {
  const a = normalizeAssets(assets);
  const base = urlBase(url);
  const keep = (x) => urlBase(x && x.url) !== base;
  return Object.assign({}, a, {
    required: a.required.filter(keep), photos: a.photos.filter(keep), generated: a.generated.filter(keep), videos: a.videos.filter(keep),
  });
}

/* Persistencia de la multimedia del Setup (referencias y obligatorias). Los
 * archivos viven en el disco del servidor (media/); en localStorage solo queda
 * la lista con sus URLs, roles, alt y paletas. */
const MEDIA_STORAGE_KEY = 'lpa_media_v1';
const MEDIA_ROLES = ['hero', 'producto', 'galería', 'fondo', 'equipo', 'otro'];

function sanitizeMediaItem(m) {
  if (!m || typeof m !== 'object' || typeof m.url !== 'string' || m.url.indexOf('/media/') !== 0) return null;
  return {
    id: String(m.id || m.url), url: m.url, name: String(m.name || '').slice(0, 120), mime: String(m.mime || ''),
    type: m.type === 'video' ? 'video' : 'image', kind: m.kind === 'reference' ? 'reference' : 'required',
    role: MEDIA_ROLES.indexOf(m.role) !== -1 ? m.role : 'otro', caption: String(m.caption || '').slice(0, 200),
    size: Number(m.size) || 0, width: Number(m.width) || 0, height: Number(m.height) || 0,
    palette: Array.isArray(m.palette) ? m.palette.filter((h) => /^#[0-9A-Fa-f]{6}$/.test(h)).slice(0, 8) : [],
  };
}

function normalizeMedia(media) {
  const src = media || {};
  const clean = (arr, kind) => (Array.isArray(arr) ? arr : []).map((m) => sanitizeMediaItem(Object.assign({}, m, { kind }))).filter(Boolean);
  return { references: clean(src.references, 'reference').slice(0, 3), required: clean(src.required, 'required').slice(0, 12) };
}

function loadMediaSetting() {
  const raw = safeGetItem(MEDIA_STORAGE_KEY);
  if (!raw) return { references: [], required: [] };
  try { return normalizeMedia(JSON.parse(raw)); } catch (e) { return { references: [], required: [] }; }
}

function saveMediaSetting(media) {
  safeSetItem(MEDIA_STORAGE_KEY, JSON.stringify(normalizeMedia(media)));
}

function formatAssetItem(item, fallbackRole, noAnalysis) {
  const it = (typeof item === 'string') ? { url: item } : (item || {});
  const parts = [it.url || '(sin URL)'];
  const role = it.role || fallbackRole;
  if (role) parts.push(role);
  if (it.type && !/^(imagen|foto)$/.test(it.type)) parts.push(it.type);
  if (it.width && it.height) parts.push(`${it.width}x${it.height}`);
  if (it.alt) parts.push(`alt "${it.alt}"`);
  if (it.poster) parts.push(`poster ${it.poster}`);
  if (it.credit) parts.push(`crédito ${it.credit}${it.creditUrl ? ` (${it.creditUrl})` : ''}`);
  else if (it.attribution) parts.push(`atribución ${it.attribution}`);
  else if (it.photographer) parts.push(`foto de ${it.photographer}`);
  const an = noAnalysis ? '' : describeAnalysisCompact(it.analysis, it);
  if (an) parts.push(an);
  return `- ${parts.join(' · ')}`;
}

// Análisis de composición en una línea breve: colores, espacio libre y orientación.
function describeAnalysisCompact(an, item) {
  if (!an) return '';
  const bits = [];
  if (an.colors && an.colors.length) bits.push(an.colors.slice(0, 4).join(' '));
  if (an.subject) bits.push(`sujeto ${an.subject}`);
  if (an.negativeSpace) bits.push(`libre ${an.negativeSpace}${an.textTone ? ` (texto ${an.textTone})` : ''}`);
  const w = Number(item && item.width), h = Number(item && item.height);
  if (w > 0 && h > 0) bits.push(w > h * 1.15 ? 'horizontal' : (h > w * 1.15 ? 'vertical' : 'cuadrada'));
  return bits.length ? `[${bits.join('; ')}]` : '';
}

// Bloque RECURSOS VISUALES del prompt. Devuelve null si no corresponde
// (ni técnicas 4/5 ni recursos reales). Con datos reales (Fase D) lista las
// URLs exactas; con 4/5 activas pero sin URLs, deja instrucciones para
// producir los activos con coherencia de marca.
function buildRecursosVisualesBlock(assets, techniques) {
  const a = normalizeAssets(assets);
  const t = normalizeTechniques(techniques);
  const on = (id) => t.indexOf(id) !== -1;
  const parts = [];

  if (a.referenceNotes.trim()) {
    parts.push('REFERENCIA VISUAL (guía de estilo, paleta y composición; NO se muestra en la página):');
    parts.push(a.referenceNotes.trim());
    parts.push('');
  }
  if (a.required.length) {
    parts.push('OBLIGATORIOS (URL exacta, en su rol, `alt` tal cual; si falta uno la entrega está incompleta):');
    parts.push(a.required.map((r) => formatAssetItem(r)).join('\n'));
    parts.push('');
  }
  if (a.generated.length) {
    parts.push(a.generated.some((g) => g.type === 'foto') ? 'IMÁGENES GENERADAS O ELEGIDAS ANTES DEL PROMPT (URL exacta):' : 'IMÁGENES GENERADAS (URL exacta):');
    parts.push(a.generated.map((r) => formatAssetItem(r, undefined, true)).join('\n'));
    parts.push('');
    parts.push(buildGeneratedReferenceLines(a).join('\n'));
    parts.push('');
  }
  if (a.photos.length) {
    parts.push('FOTOGRAFÍA REAL (URL exacta; `<img>` con `alt`, `width`/`height`, `loading="lazy"` salvo el hero):');
    parts.push(a.photos.map((r) => formatAssetItem(r)).join('\n'));
    parts.push('');
  }
  if (a.videos.length) {
    parts.push('VIDEO (`poster`, `muted`, `playsinline`, `loop`; nunca autoplay con sonido):');
    parts.push(a.videos.map((r) => formatAssetItem(r)).join('\n'));
    parts.push('');
    const genVideo = a.videos.find((v) => v.source === 'ffmpeg');
    if (genVideo) {
      parts.push(`VIDEO GENERADO (fotogramas IA + ffmpeg, mp4 sin audio${genVideo.duration ? `, ~${Math.round(genVideo.duration)} s` : ''}, bucle suave): capa de motion design, no adorno.`);
      parts.push(bulletList([
        `Fondo dinámico del hero: \`<video autoplay muted loop playsinline preload="metadata" poster="${genVideo.poster || '…'}">\` con \`object-fit: cover\` y velo que asegure contraste AA.`,
        'Titular y CTA en el espacio libre del póster; nada compite con el CTA.',
        'Con `prefers-reduced-motion: reduce` solo el `poster`; pausar fuera del viewport (`IntersectionObserver`).',
      ]));
      parts.push('');
    }
  }
  const attributions = []
    .concat(a.photos, a.videos)
    .map((r) => (r && (r.credit || r.attribution || (r.photographer ? `Foto: ${r.photographer}` : ''))) || '')
    .filter(Boolean);
  const hasAny = a.photos.length || a.videos.length || a.generated.length || a.required.length;
  if (hasAny) {
    parts.push(`Uso: URLs tal cual (sin reescribir ni descargar), cada imagen con \`alt\`, repartidas por las secciones; no inventes otras URLs.${a.required.concat(a.photos).some((r) => r && r.analysis) ? ' Los datos entre [corchetes] son medidos: el texto va sobre el espacio libre (con el color de texto indicado), el sujeto del lado opuesto, sin taparlo.' : ''}`); // sin atribución obligatoria en la página (no va a producción por ahora): los créditos quedan en el panel Recursos de la app
    parts.push('');
  }

  if (on(4)) {
    parts.push('Técnica 4 — imagen generada primero (los activos se producen ANTES de maquetar):');
    parts.push(bulletList([
      '2 a 4 activos propios (hero, textura, ilustraciones), cada uno con prompt de imagen en inglés: sujeto, materiales, luz, lente, encuadre, paleta de DIRECCIÓN VISUAL; misma luz, ángulo y paleta entre activos.',
      on(7) ? 'Negativas en cada prompt: no over-saturated colors, no perfect skin, no looking at camera, no plastic textures, no generic office background.' : null,
      'Sin URL provista: ilustración SVG/CSS coherente (nunca ícono roto ni stock genérico) y el prompt como comentario `<!-- prompt-imagen: ... -->`.',
    ].filter(Boolean)));
    parts.push('');
  }
  if (on(5)) {
    parts.push('Técnica 5 — video que guía el ojo al punto de conversión:');
    parts.push(bulletList([
      'Un único video protagonista, sutil, sin personas ni texto, con `poster`; sin URL, animación procedural canvas/CSS scrubbeada por scroll (GSAP ScrollTrigger).',
      'Con `prefers-reduced-motion`, solo el `poster` estático.',
    ]));
    parts.push('');
  }

  if (!parts.length) return null;
  while (parts.length && parts[parts.length - 1] === '') parts.pop();
  return parts.join('\n');
}

/* -------------------------------------------------------------------------
 * Secciones del meta-prompt que dependen de las técnicas activas
 * ------------------------------------------------------------------------- */

function buildMetaTechniqueSections(techniques, headings, assets) {
  const t = normalizeTechniques(techniques);
  const on = (id) => t.indexOf(id) !== -1;
  const a = normalizeAssets(assets);
  const out = {};

  out.omitted = [];
  if (!on(1)) out.omitted.push('MECANISMO DE DIVERSIDAD SSoT');
  if (!on(6)) out.omitted.push('DISEÑO SUSTRACTIVO');
  if (!on(7)) out.omitted.push('RESTRICCIONES NEGATIVAS');

  out.structureNote = out.omitted.length
    ? `Los bloques ${out.omitted.map((h) => `"${h}"`).join(', ')} NO existen en este prompt (su técnica está desactivada): no los escribas ni los menciones. No agregues encabezados de nivel "##" fuera de la lista; las subsecciones van como texto o "###".`
    : 'No agregues encabezados de nivel "##" fuera de la lista; las subsecciones van como texto o "###".';

  out.ssotOff = [
    'DIRECCIÓN VISUAL DETERMINISTA (obligatoria; la técnica de semilla SSoT está desactivada): el sistema derivó, de forma determinista a partir de los datos del proyecto y los verticales, estos ejes de diseño. Son la dirección que tenés que elaborar con concreción (hex concretos, nombres de fuente reales -Google Fonts o system stacks- y descripción de grilla en DIRECCIÓN VISUAL; bloques narrativos en ARQUITECTURA DE PÁGINA). Podés precisar detalles dentro de la misma categoría pero NO cambiarla:',
  ];
  out.ssotOffTail = [
    'Este prompt NO usa mecanismo de semilla: no escribas ningún bloque de semilla ni incluyas la marca `{{SSOT_SEED}}`. Las decisiones menores que queden abiertas, resolvelas vos con criterio y dejalas escritas como una única solución coherente (no como lista de opciones).',
  ];

  out.ambitiousOff = [
    'PROMPT CONCISO (la técnica de prompt ambicioso está desactivada): cada bloque de contexto (USUARIO / AUDIENCIA, OBJETIVOS, PSICOLOGÍA, CONTEXTO DE MERCADO) en 2 a 4 líneas con solo lo decisivo, sin desarrollar teoría. ARQUITECTURA DE PÁGINA sigue siendo por sección pero breve: objetivo, copy, elemento visual, animación/interacción y CTA (una línea cada uno). La brevedad no reduce el nivel del espectáculo visual de la sección siguiente.',
  ];

  out.substractiveOff = [];
  out.restrictionsOff = [
    'RESTRICCIONES NEGATIVAS (técnica desactivada): NO escribas un bloque de restricciones negativas ni listas de palabras prohibidas. Los no-negociables de accesibilidad y seguridad SÍ se mantienen y van en CRITERIOS DE CALIDAD: contraste AA, foco visible y navegación por teclado, `prefers-reduced-motion`, sin scripts ni recursos de terceros no declarados, sin exponer datos sensibles ni claves.',
  ];

  out.resources = [];
  const withResources = headings.indexOf('RECURSOS VISUALES') !== -1;
  if (withResources) {
    out.resources.push('RECURSOS VISUALES (obligatorio): el prompt que escribís tiene que incluir el bloque "RECURSOS VISUALES" (después de COPY / MICROCOPY).');
    if (hasAssetsContent(a)) {
      out.resources.push('El sistema ya reunió estos recursos reales. Copiá LITERALMENTE cada URL en ese bloque (sin inventar ni modificar URLs) y exigí que el ejecutor use exactamente esas URLs, con la referencia visual como guía para DIRECCIÓN VISUAL (nunca como contenido de la página):');
      out.resources.push(buildRecursosVisualesBlock(a, []) || '');
    }
    if (on(4)) {
      out.resources.push(`Técnica 4 (imágenes generadas): en ese bloque escribí 2 a 4 prompts de imagen en inglés (sujeto, materiales, iluminación, lente, encuadre, paleta tomada de tu DIRECCIÓN VISUAL), con consistencia total de iluminación y ángulo entre ellos${on(7) ? ', y con las negativas fotográficas (no over-saturated colors, no perfect skin, no looking at camera, no plastic textures, no generic office background)' : ''}. Indicá que, si el ejecutor no tiene URL para un activo, lo resuelva con una ilustración SVG/CSS coherente con la marca y deje el prompt en un comentario HTML.`);
    }
    if (a.generated.length) {
      out.resources.push('REGLA DE DISEÑO (obligatoria): la página se diseña alrededor de los activos generados, no los pega encima. Copiá el bloque "REFERENCIA DESDE LOS ACTIVOS GENERADOS" y trabajalo en DIRECCIÓN VISUAL y ARQUITECTURA DE PÁGINA: el hero coloca titular y CTA en el espacio libre de la imagen hero (nombrá la composición y el espacio libre), la paleta de la semilla se conserva pero sus roles se reparten para armonizar con los colores medidos de las imágenes, las texturas son fondos de sección y la ilustración de marca define el estilo de los íconos.');
    }
    if (on(5)) {
      out.resources.push('Técnica 5 (video): en ese bloque exigí un único video protagonista con `poster`, `muted`, `playsinline`, `loop`, sin personas ni texto, y movimiento guiado por scroll si la firma de movimiento lo pide; sin URL provista, una animación procedural en canvas/CSS con el mismo propósito. Con `prefers-reduced-motion` se muestra el `poster` estático.');
    }
  }

  out.critic = on(3)
    ? ['SUBAGENTES (técnica activa): la landing resultante va a ser auditada por un agente crítico (UX, accesibilidad, persuasión/CRO). Escribí el prompt para que pase esa auditoría a la primera: beneficio principal entendible en menos de 3 segundos, un único CTA dominante, objeciones desmontadas antes de que el usuario las piense, contraste AA, foco visible. En CRITERIOS DE CALIDAD incluí esos criterios como checklist verificable.']
    : [];

  out.human = on(8)
    ? ['REDACCIÓN HUMANA (técnica activa): tras ejecutar, el copy será reescrito con voz humana. Por eso, en COPY / MICROCOPY escribí la voz y el ritmo deseados (frases de longitud variable, verbos concretos, micro-copy que reduce ansiedad o promete un beneficio inmediato, por ejemplo "Obtené tu plan gratuito en 30 segundos" en lugar de "Registrarse") y pedí que el copy final se lea como escrito por una persona, no por una plantilla.']
    : [];

  out.synergy = buildSynergyRules(t, !!a.referenceNotes.trim());

  out.noTechniques = t.length === 0
    ? ['SIN TÉCNICAS ADICIONALES: aun así el prompt tiene que ser un prompt espectáculo sólido -dirección visual concreta con hex y fuentes reales, arquitectura por sección con animación y CTA, Coreografía de movimiento completa y requisitos técnicos-, y cerrar con los no-negociables de accesibilidad en CRITERIOS DE CALIDAD.']
    : [];

  return out;
}

// Parsea una lista de sugerencias "N. [CATEGORÍA] problema :: corrección".
function parseSuggestionList(text) {
  const items = [];
  String(text || '').split('\n').forEach((line) => {
    const m = /^\s*(?:\d+[.)]|[-*•])\s*(?:\[([^\]]+)\]\s*)?(.+?)\s*$/.exec(line);
    if (!m) return;
    const body = m[2];
    if (/^(veredicto|problemas?|sugerencias?)\b/i.test(body)) return;
    const idx = body.indexOf('::');
    const issue = (idx === -1 ? body : body.slice(0, idx)).trim();
    const fix = idx === -1 ? '' : body.slice(idx + 2).trim();
    if (!issue) return;
    items.push({ category: (m[1] || 'General').trim(), issue, fix });
  });
  return items;
}

/* -------------------------------------------------------------------------
 * Técnica 3 (post-ejecución) — crítico CRO sobre la landing ejecutada
 * ------------------------------------------------------------------------- */

// Achica el HTML para la revisión: vacía scripts/estilos/SVG y recorta data
// URIs, de modo que el crítico vea estructura y copy sin gastar tokens.
function compactHtmlForReview(html, maxChars) {
  const limit = maxChars || 60000;
  let s = String(html || '');
  s = s.replace(/<script\b([^>]*)>[\s\S]*?<\/script>/gi, (all, attrs) => `<script${attrs}>/* … */</script>`);
  s = s.replace(/<style\b([^>]*)>[\s\S]*?<\/style>/gi, (all, attrs) => `<style${attrs}>/* … */</style>`);
  s = s.replace(/<svg\b([^>]*)>[\s\S]*?<\/svg>/gi, (all, attrs) => `<svg${attrs}>…</svg>`);
  s = s.replace(/data:[a-z]+\/[a-z0-9.+-]+;base64,[A-Za-z0-9+/=]{40,}/gi, 'data:…');
  if (s.length > limit) s = `${s.slice(0, limit)}\n<!-- … recortado … -->`;
  return s;
}

const CRITIC_MAX_ROUNDS = 2;
const CRITIC_AREAS = ['UX', 'Accesibilidad', 'Persuasión', 'Conversión'];
const CRITIC_PRIORITIES = ['alta', 'media', 'baja'];

function buildCriticAuditPrompt(opts) {
  const o = opts || {};
  const lines = [];
  lines.push(o.projectView
    ? 'Actuás como AGENTE CRÍTICO en un bucle creador/crítico. Auditá la LANDING, que es un proyecto multi-archivo (se muestra el listado de archivos y el código JSX/Vue/CSS de los relevantes) bajo criterios de UX, accesibilidad y persuasión.'
    : 'Actuás como AGENTE CRÍTICO en un bucle creador/crítico. Auditá la LANDING (HTML abreviado: scripts, estilos y SVG vaciados) bajo criterios de UX, accesibilidad y persuasión.');
  lines.push('');
  lines.push('Criterios:');
  lines.push(bulletList([
    'UX: puntos de fricción, jerarquía visual, beneficio principal entendible en menos de 3 segundos.',
    'Accesibilidad: contraste AA, foco visible, textos alternativos, jerarquía de encabezados, formularios con etiquetas, `prefers-reduced-motion`.',
    'Persuasión: titulares con beneficio sobre característica, prueba social creíble, objeciones desmontadas.',
    'Conversión: un CTA dominante con micro-copy concreto, formularios cortos, elementos que distraen.',
  ]));
  lines.push('');
  lines.push(`Proyecto: ${(o.project && o.project.tema) || ''}. Público: ${(o.project && o.project.publico) || ''}. Objetivo de conversión: ${(o.project && o.project.objetivo) || ''}.`);
  const rules = [o.projectView
    ? 'Cada arreglo debe poder ejecutarse como un cambio puntual sobre el código (qué archivo/componente y qué cambia). Podés sugerir paquetes npm reales si resuelven el problema mejor (se instalan solos).'
    : 'Cada arreglo debe poder ejecutarse como un cambio puntual sobre el HTML (qué elemento y qué cambia).'];
  if (hasTechnique(o.techniques, 6)) rules.push('No sugieras eliminar los set pieces de scroll, el 3D ni la firma del hero si sirven a la retención.');
  if (hasTechnique(o.techniques, 7)) rules.push('No sugieras palabras ni rasgos de la lista de restricciones negativas del proyecto.');
  lines.push('');
  lines.push('Reglas:');
  lines.push(bulletList(rules));
  lines.push('');
  lines.push(`FORMATO (estricto): respondé SOLO un array JSON, sin texto antes ni después, sin markdown, máximo ${o.maxItems || 8} ítems, strings cortos (una frase), SIN código reescrito:`);
  lines.push('[{"area":"UX|Accesibilidad|Persuasión|Conversión","problema":"...","arreglo":"...","prioridad":"alta|media|baja"}]');
  lines.push('Si la landing ya está muy bien, devolvé [].');
  lines.push('');
  if (o.projectView) {
    lines.push('PROYECTO:');
    lines.push(o.projectView);
    return lines.join('\n');
  }
  lines.push('HTML:');
  lines.push('```html');
  lines.push(compactHtmlForReview(o.html, 40000));
  lines.push('```');
  return lines.join('\n');
}

function normalizeCriticItem(x) {
  if (!x || typeof x !== 'object') return null;
  const problema = String(x.problema || x.problem || x.issue || '').trim();
  const arreglo = String(x.arreglo || x.fix || '').trim();
  if (!problema && !arreglo) return null;
  const areaRaw = String(x.area || x.category || '').trim();
  const area = CRITIC_AREAS.find((a) => a.toLowerCase() === areaRaw.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '') || a.toLowerCase() === areaRaw.toLowerCase())
    || CRITIC_AREAS.find((a) => areaRaw && a.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().startsWith(areaRaw.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().slice(0, 3)))
    || (areaRaw || 'UX');
  const prioRaw = String(x.prioridad || x.priority || '').toLowerCase().trim();
  const prioridad = CRITIC_PRIORITIES.indexOf(prioRaw) !== -1 ? prioRaw : 'media';
  return { area, problema, arreglo, prioridad };
}

// Parseo robusto: JSON (con o sin fences, con texto alrededor) y, si falla,
// líneas con viñetas "N. [ÁREA] problema :: arreglo".
function parseCriticItems(raw, max) {
  const limit = max || 8;
  let text = String(raw || '').replace(/\r/g, '');
  text = text.replace(/```[a-zA-Z]*\s*/g, '').replace(/```/g, '');
  const a = text.indexOf('[');
  const b = text.lastIndexOf(']');
  if (a !== -1 && b > a) {
    try {
      const arr = JSON.parse(text.slice(a, b + 1));
      if (Array.isArray(arr)) return arr.map(normalizeCriticItem).filter(Boolean).slice(0, limit);
    } catch (e) { /* cae al fallback por viñetas */ }
  }
  return parseSuggestionList(text)
    .filter((s) => !/^\[?\s*\{/.test(s.issue))
    .map((s) => normalizeCriticItem({ area: s.category, problema: s.issue, arreglo: s.fix, prioridad: 'media' }))
    .filter(Boolean).slice(0, limit);
}

function buildCriticApplyInstruction(items) {
  const lines = (items || []).map((s, i) => `${i + 1}. [${s.area}] ${s.problema}${s.arreglo ? ` — Arreglo: ${s.arreglo}` : ''}`);
  return `Aplicá estos arreglos del crítico (UX, accesibilidad, persuasión), con cambios mínimos y puntuales sobre lo existente, sin tocar lo que no mencionan:\n${lines.join('\n')}`;
}

/* -------------------------------------------------------------------------
 * Técnica 8 (post-ejecución) — reescritura humana del copy
 * ------------------------------------------------------------------------- */

function buildHumanRewritePrompt(opts) {
  const o = opts || {};
  const lines = [];
  lines.push('Sos un redactor humano senior (copywriter con oficio). Tenés el HTML de una landing page ya construida: la arquitectura es correcta pero el texto suena a plantilla de IA. Tu trabajo es reescribir SOLO el texto visible para inyectarle voz de marca, ritmo y matices culturales.');
  lines.push('');
  lines.push('Qué reescribir: títulos, subtítulos, párrafos, listas, botones, etiquetas, microcopy, textos de estado, y los atributos de texto (`alt`, `aria-label`, `title`, `placeholder`, `<title>`, `meta description`).');
  lines.push('Cómo:');
  lines.push(bulletList([
    'Narrativa antes que catálogo: contá el problema y el alivio, con emoción concreta, antes de enumerar características.',
    'Micro-copy que reduce ansiedad o promete un beneficio inmediato (ejemplo: "Obtené tu plan gratuito en 30 segundos" en lugar de "Registrarse"; nada de "Enviar" ni "Saber más" pelados).',
    'Ritmo humano: frases de longitud variable, verbos concretos, un dato específico por afirmación, ligeramente autocrítico cuando encaje; como un experto hablando con un colega en un café.',
    `Tono del proyecto: ${(o.project && o.project.tono) || 'el que ya tiene la página'}. Español neutro y consistente con el resto.`,
    'Longitud parecida al texto original (±25%) para no romper el layout.',
  ]));
  lines.push('');
  lines.push('Qué NO tocar, bajo ningún concepto (se verifica automáticamente y, si algo cambia, se descarta todo tu trabajo):');
  lines.push(bulletList([
    'Ninguna etiqueta HTML: misma cantidad de elementos de cada tipo, mismo orden, ninguno agregado ni quitado.',
    'Clases, ids, atributos `data-*`, estilos (`<style>` y `style=""`), scripts (`<script>`), URLs (`href`, `src`), y comentarios.',
    'Datos que no son copy: números de contacto reales, precios, nombres propios de personas reales, URLs.',
  ]));
  if (o.restrictions) {
    lines.push('');
    lines.push('Restricciones negativas del proyecto (la reescritura las respeta y nunca reintroduce esas muletillas):');
    lines.push(o.restrictions);
  }
  lines.push('');
  lines.push('Devolvé el documento HTML COMPLETO, empezando en `<!DOCTYPE html>` y terminando en `</html>`. Sin explicaciones antes ni después, sin bloques de markdown.');
  lines.push('');
  lines.push('HTML actual:');
  lines.push('```html');
  lines.push(o.html || '');
  lines.push('```');
  return lines.join('\n');
}

function stripCommentsAndCode(html) {
  return String(html || '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '<script></script>')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '<style></style>');
}

// Cuenta etiquetas de apertura por nombre (ignora comentarios y el contenido
// de <script>/<style>).
function countHtmlTags(html) {
  const counts = {};
  const re = /<([a-zA-Z][a-zA-Z0-9-]*)\b/g;
  const src = stripCommentsAndCode(html);
  let m = re.exec(src);
  while (m) {
    const name = m[1].toLowerCase();
    counts[name] = (counts[name] || 0) + 1;
    m = re.exec(src);
  }
  return counts;
}

function extractCodeBodies(html) {
  const bodies = [];
  const re = /<(script|style)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  const src = String(html || '').replace(/<!--[\s\S]*?-->/g, '');
  let m = re.exec(src);
  while (m) { bodies.push(m[2].trim()); m = re.exec(src); }
  return bodies;
}

// Verifica que la reescritura humana conserva la estructura: mismos conteos
// de etiquetas y mismos scripts/estilos. Devuelve { ok, reasons, before, after }.
function verifyRewriteStructure(original, rewritten) {
  const a = countHtmlTags(original);
  const b = countHtmlTags(rewritten);
  const reasons = [];
  Object.keys(Object.assign({}, a, b)).sort().forEach((k) => {
    if ((a[k] || 0) !== (b[k] || 0)) reasons.push(`<${k}>: ${a[k] || 0} → ${b[k] || 0}`);
  });
  const ca = extractCodeBodies(original);
  const cb = extractCodeBodies(rewritten);
  if (ca.length !== cb.length || ca.some((body, i) => body !== cb[i])) reasons.push('los scripts o estilos cambiaron');
  const sum = (o) => Object.keys(o).reduce((n, k) => n + o[k], 0);
  return { ok: reasons.length === 0, reasons, before: sum(a), after: sum(b) };
}

/* -------------------------------------------------------------------------
 * Proyectos multi-archivo (Next / React / Vue): vista compacta para el LLM,
 * edición con IA por archivos, crítico, reescritura humana e inspector.
 * Todo lo de esta sección es puro (sin DOM) para poder testearlo en Node.
 * ------------------------------------------------------------------------- */

const PROJECT_VIEW_MAX_CHARS = 40000;
const PROJECT_VIEW_MAX_PER_FILE = 14000;
const PROJECT_ALLOWED_DEPS = ['react', 'react-dom', 'vue', 'next', 'gsap', 'lenis', 'three', 'tailwindcss', 'bootstrap'];
const PROJECT_VERSION_CAP = 10;
const PROJECT_TEXT_EXT_RE = /\.(jsx?|mjs|tsx?|vue|css|html)$/i;
const PROJECT_SKIP_RE = /(^|\/)(package(-lock)?\.json|npm-shrinkwrap\.json|yarn\.lock|pnpm-lock\.yaml|node_modules\/|\.vite-cache\/|__lpa_inspector)/i;
const PROJECT_BASE_EXTS = ['.js', '.jsx', '.mjs', '.css', '.json', '.html', '.vue', '.svg', '.txt', '.md'];
const PROJECT_RESERVED_ROOT_RE = /^(package(-lock)?\.json|vite\.config\.[cm]?[jt]s|next\.config\.[cm]?[jt]s|postcss\.config\.[cm]?[jt]s|tailwind\.config\.[cm]?[jt]s|jsconfig\.json|tsconfig\.json|next-env\.d\.ts|npm-shrinkwrap\.json|yarn\.lock|pnpm-lock\.yaml)$/i;

// Menor número = más relevante para entender/editar la landing.
function projectFilePriority(filePath) {
  const l = String(filePath).toLowerCase();
  if (/^(src\/)?app\/page\.[a-z]+$/.test(l)) return 0;
  if (/(^|\/)app\.(jsx|tsx|vue|js)$/.test(l)) return 1;
  if (/\.(jsx|tsx|vue)$/.test(l) && /(^|\/)(components?|sections?|views?|blocks?)\//.test(l)) return 2;
  if (/^(src\/)?app\/layout\.[a-z]+$/.test(l)) return 3;
  if (/(^|\/)(globals?|index|style|styles|main|app)\.css$/.test(l)) return 4;
  if (/\.(jsx|tsx|vue)$/.test(l)) return 5;
  if (l === 'index.html') return 6;
  if (/(^|\/)main\.(jsx|js|tsx|ts)$/.test(l)) return 7;
  if (/\.css$/.test(l)) return 8;
  if (/\.(js|mjs|ts|tsx)$/.test(l)) return 9;
  return 10;
}

// Vista compacta del proyecto: listado de archivos con tamaños + contenido de
// los relevantes (JSX/Vue/CSS/HTML), cada uno recortado a un presupuesto y
// con un total <= maxChars. Los lockfiles, binarios y json no se muestran.
// opts: { maxChars, maxPerFile, include(path) -> bool } (include filtra qué
// contenidos se muestran; el listado siempre incluye todo).
// Devuelve { text, listing, included:[{path,chars,total,truncated}], truncatedPaths, omittedPaths, chars }.
function buildProjectView(files, opts) {
  const o = opts || {};
  const maxChars = o.maxChars || PROJECT_VIEW_MAX_CHARS;
  const perFile = o.maxPerFile || PROJECT_VIEW_MAX_PER_FILE;
  const src = files || {};
  const paths = Object.keys(src).filter((p) => !PROJECT_SKIP_RE.test(p));
  const byPriority = paths.slice().sort((a, b) => (projectFilePriority(a) - projectFilePriority(b)) || a.localeCompare(b));
  const listing = byPriority.map((p) => `- ${p} (${String(src[p]).length} caracteres)`).join('\n');
  let remaining = maxChars - listing.length - 60;
  const included = [];
  const omittedPaths = [];
  const blocks = [];
  byPriority.forEach((p) => {
    if (!PROJECT_TEXT_EXT_RE.test(p) || (typeof o.include === 'function' && !o.include(p))) return;
    const content = String(src[p]);
    const overhead = p.length + 60;
    if (remaining < overhead + 200) { omittedPaths.push(p); return; }
    const cap = Math.min(perFile, remaining - overhead);
    const truncated = content.length > cap;
    let body = truncated ? content.slice(0, cap) : content;
    if (truncated) body += /\.(html|vue)$/i.test(p) ? '\n<!-- … recortado … -->' : '\n/* … recortado … */';
    const block = `----- ${p} (${content.length} caracteres${truncated ? `, RECORTADO a ${cap}` : ''}) -----\n${body}\n`;
    remaining -= block.length;
    blocks.push(block);
    included.push({ path: p, chars: body.length, total: content.length, truncated });
  });
  const text = `Archivos del proyecto:\n${listing}\n\nContenido de los archivos relevantes:\n${blocks.join('\n')}${omittedPaths.length ? `\n(Sin contenido por presupuesto: ${omittedPaths.join(', ')})\n` : ''}`;
  return {
    text, listing, included, omittedPaths,
    truncatedPaths: included.filter((f) => f.truncated).map((f) => f.path),
    chars: text.length,
  };
}

// Archivos cuyo contenido NO se mostró completo: la IA no puede devolverlos.
function projectViewBlockedPaths(view) {
  return (view.truncatedPaths || []).concat(view.omittedPaths || []);
}

// Especificadores de import/require/import() de un archivo de código.
function scanProjectImports(source) {
  const specs = [];
  const src = String(source || '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
  const res = [/\bimport\s*(?:[\w*${}\s,]*?\s*from\s*)?["']([^"']+)["']/g, /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g, /\brequire\s*\(\s*["']([^"']+)["']\s*\)/g, /\bexport\s+[^;'"]*?\bfrom\s*["']([^"']+)["']/g];
  res.forEach((re) => { let m = re.exec(src); while (m) { specs.push(m[1]); m = re.exec(src); } });
  return specs;
}

// Devuelve '' si la ruta es aceptable para escribir en el proyecto, o un
// mensaje en español. Refleja las reglas de preview-runner.js (el servidor
// valida de nuevo y sus errores se muestran igual).
function validateProjectEditPath(filePath, technology) {
  if (typeof filePath !== 'string' || !filePath.trim()) return 'ruta vacía';
  const raw = filePath.trim();
  if (raw.indexOf('\0') !== -1 || raw.indexOf('\\') !== -1) return 'ruta inválida';
  if (raw.startsWith('/') || /^[A-Za-z]:/.test(raw) || raw.startsWith('~')) return 'ruta absoluta no permitida';
  const segs = raw.split('/');
  for (let i = 0; i < segs.length; i++) {
    if (!segs[i] || segs[i] === '.' || segs[i] === '..') return 'ruta con "..", "." o segmentos vacíos';
    if (!/^[A-Za-z0-9_\-.()[\]@]+$/.test(segs[i])) return `segmento inválido "${segs[i]}"`;
  }
  if (segs.length === 1 && PROJECT_RESERVED_ROOT_RE.test(raw)) return 'archivo de configuración reservado (lo provee el entorno)';
  const ext = (raw.match(/\.[A-Za-z0-9]+$/) || [''])[0].toLowerCase();
  const isNext = technology === 'nextjs' || technology === 'next';
  const allowed = PROJECT_BASE_EXTS.concat(isNext ? [] : ['.ts', '.tsx']);
  if (allowed.indexOf(ext) === -1) return `extensión no permitida (${ext || 'sin extensión'})`;
  if (isNext && (/(^|\/)(route|middleware|instrumentation)\.[a-z]+$/i.test(raw) || /^(src\/)?pages\//.test(raw) || /(^|\/)api\//.test(raw))) return 'Next.js: no se permiten rutas API, pages/, middleware ni instrumentation';
  return '';
}

// '' si los imports externos son paquetes npm válidos. Ya no hay lista
// cerrada: cualquier paquete npm se instala bajo demanda en la vista previa;
// sólo se rechazan módulos internos de Node y nombres inválidos.
const NODE_BUILTIN_NAMES = ['assert', 'buffer', 'child_process', 'cluster', 'crypto', 'dgram', 'dns', 'fs', 'http', 'http2', 'https', 'inspector', 'module', 'net', 'os', 'path', 'perf_hooks', 'process', 'readline', 'repl', 'stream', 'tls', 'tty', 'url', 'util', 'v8', 'vm', 'worker_threads', 'zlib'];
function validateProjectImports(filePath, content) {
  if (!/\.(jsx?|mjs|tsx?|vue|html)$/i.test(filePath)) return '';
  const specs = scanProjectImports(content);
  for (let i = 0; i < specs.length; i++) {
    const s = specs[i];
    if (s.startsWith('.') || s.startsWith('/') || /^(https?:)?\/\//i.test(s) || /^data:/.test(s)) continue;
    if (/^node:/.test(s)) return `"${s}" es un módulo interno de Node, no una librería de la página`;
    const parts = s.split('/');
    const pkg = s.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
    if (NODE_BUILTIN_NAMES.indexOf(pkg) !== -1) return `"${s}" es un módulo interno de Node, no una librería de la página`;
    if (!/^(?:@[a-z0-9][a-z0-9._~-]*\/)?[a-z0-9][a-z0-9._~-]*$/.test(pkg)) return `nombre de paquete inválido "${s}"`;
  }
  return '';
}

const PROJECT_PLACEHOLDER_RE = /(?:\.{3}|…)\s*(?:sin cambios|resto del|el resto|rest of|unchanged|existing code|código existente|igual que antes)|^\s*(?:\/\/|\/\*|\{\/\*|<!--)\s*(?:\.{3}|…)\s*(?:\*\/\}?|-->)?\s*$/im;

// Interpreta la respuesta del LLM (bloques === FILE: ruta === … === END FILE ===)
// contra los archivos actuales. Devuelve
//   { changes:[{path,content,old,isNew}], rejected:[{path,reason}], unchanged:[path], parsed:n }
// opts: { technology, blockedPaths:[rutas no mostradas completas], allowNew (true), maxNew (8) }
function parseProjectEditResponse(raw, currentFiles, opts) {
  const o = opts || {};
  const cur = currentFiles || {};
  const blocked = new Set(o.blockedPaths || []);
  const maxNew = o.maxNew === undefined ? 8 : o.maxNew;
  const parsed = parseProjectFiles(normalizeProjectFilesText(raw));
  const last = new Map();
  parsed.forEach((f) => { last.set(f.path.replace(/^\.\//, ''), f.content); });
  const changes = [];
  const rejected = [];
  const unchanged = [];
  let newCount = 0;
  last.forEach((content, p) => {
    const err = validateProjectEditPath(p, o.technology);
    if (err) { rejected.push({ path: p, reason: err }); return; }
    const exists = Object.prototype.hasOwnProperty.call(cur, p);
    if (blocked.has(p)) { rejected.push({ path: p, reason: 'no se le mostró completo a la IA (recortado); editalo a mano o pedí un cambio más acotado' }); return; }
    if (!exists && o.allowNew === false) { rejected.push({ path: p, reason: 'archivo nuevo no permitido en esta pasada' }); return; }
    if (!content.trim()) { rejected.push({ path: p, reason: 'contenido vacío' }); return; }
    if (PROJECT_PLACEHOLDER_RE.test(content) && !(exists && PROJECT_PLACEHOLDER_RE.test(cur[p]))) { rejected.push({ path: p, reason: 'contenido incompleto (la IA dejó un marcador tipo "resto sin cambios")' }); return; }
    const impErr = validateProjectImports(p, content);
    if (impErr) { rejected.push({ path: p, reason: impErr }); return; }
    if (exists && String(cur[p]).replace(/\r\n/g, '\n').trimEnd() === content.trimEnd()) { unchanged.push(p); return; }
    if (!exists) {
      if (newCount >= maxNew) { rejected.push({ path: p, reason: `demasiados archivos nuevos (máx. ${maxNew})` }); return; }
      newCount++;
    }
    changes.push({ path: p, content, old: exists ? cur[p] : '', isNew: !exists });
  });
  return { changes, rejected, unchanged, parsed: parsed.length };
}

// Diff por archivo (reusa diffLines). Devuelve { files:[{path,isNew,added,removed,approximate}], added, removed }.
function diffProjectChanges(changes) {
  const files = (changes || []).map((c) => {
    const d = diffLines(c.old || '', c.content);
    return { path: c.path, isNew: !!c.isNew, added: d.added, removed: d.removed, approximate: !!d.approximate };
  });
  return { files, added: files.reduce((n, f) => n + f.added, 0), removed: files.reduce((n, f) => n + f.removed, 0) };
}

// Escribe cada cambio en el workspace del dev server (PUT .../file => HMR).
// fetchFn inyectable para tests. Devuelve
//   { applied:[paths], failed:[{path,error}], gone:bool }  (gone = 404: la preview ya no existe)
async function putProjectFiles(fetchFn, apiBase, previewId, changes) {
  const applied = [];
  const failed = [];
  let gone = false;
  for (let i = 0; i < changes.length; i++) {
    const c = changes[i];
    let r = null;
    try {
      // eslint-disable-next-line no-await-in-loop
      r = await fetchFn(`${apiBase}/${encodeURIComponent(previewId)}/file`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ path: c.path, content: c.content }),
      });
    } catch (e) { failed.push({ path: c.path, error: 'sin conexión con el servidor' }); continue; }
    if (r.status === 404) { gone = true; break; }
    if (!r.ok) {
      // eslint-disable-next-line no-await-in-loop
      const data = await r.json().catch(() => ({}));
      failed.push({ path: c.path, error: (data && data.error) || `error ${r.status}` });
      continue;
    }
    applied.push(c.path);
  }
  return { applied, failed, gone };
}

const PROJECT_TECH_LABELS = { nextjs: 'Next.js (App Router, JavaScript)', react: 'React con Vite', vue: 'Vue 3 con Vite' };

function buildProjectEditPrompt(opts) {
  const o = opts || {};
  const lines = [];
  lines.push(`Sos un ingeniero frontend senior. Tenés un proyecto multi-archivo ya generado (${PROJECT_TECH_LABELS[o.technology] || 'proyecto web'}, una landing page) y tenés que aplicarle UN cambio pedido por quien lo está editando.`);
  lines.push('');
  lines.push(`Cambio pedido: ${o.instruction || ''}`);
  lines.push('');
  lines.push(`Alcance del cambio: ${o.selectedFragment
    ? 'aplicá el cambio SOLO en el fragmento seleccionado (abajo) y lo estrictamente necesario para que funcione.'
    : 'el cambio puede afectar varios archivos si el pedido lo requiere, pero no introduzcas cambios que no fueron pedidos.'}`);
  if (o.selectedFragment) {
    lines.push('');
    lines.push(`Fragmento seleccionado${o.selectedFile ? ` (en ${o.selectedFile})` : ''}:`);
    lines.push('```');
    lines.push(o.selectedFragment);
    lines.push('```');
  }
  if (o.negativeConstraints) {
    lines.push('');
    lines.push('Restricciones negativas del prompt original (seguí respetándolas):');
    lines.push(o.negativeConstraints);
  }
  lines.push('');
  lines.push('Reglas obligatorias:');
  lines.push(bulletList([
    'Devolvé SOLO los archivos que cambian, cada uno con su contenido COMPLETO y actualizado, en bloques `=== FILE: ruta ===` … `=== END FILE ===` (la ruta tal como figura en el listado). Los archivos que no cambian NO se devuelven.',
    'No devuelvas archivos marcados como RECORTADO ni los que no muestran contenido: no los viste completos.',
    `Dependencias ya instaladas: ${PROJECT_ALLOWED_DEPS.join(', ')}. Podés importar otros paquetes npm reales si hacen falta (se instalan solos); no inventes nombres.`,
    'No toques `package.json`, `vite.config.*`, `next.config.*` ni lockfiles. Sin rutas absolutas ni `..`.',
    'Mantené intacto todo lo que no esté relacionado con el cambio: estructura, componentes, props, clases, imports, copy, estilos, animaciones.',
    'Mantené el copy en español. No agregues secciones ni animación decorativa que el cambio no pidió.',
    'Sin explicaciones antes ni después, sin bloques de markdown ni comillas triples. Si no hay nada que cambiar, respondé exactamente SIN CAMBIOS.',
  ]));
  lines.push('');
  lines.push(o.viewText || '');
  return lines.join('\n');
}

// Extrae las líneas `import …` (incluye imports multilínea) normalizadas.
function projectImportLines(content) {
  const out = [];
  const re = /^[ \t]*import\s*["'][^"']+["']|^[ \t]*import\b[^'";]*?\bfrom\s*["'][^"']+["']/gm;
  let m = re.exec(String(content || ''));
  while (m) { out.push(m[0].replace(/\s+/g, ' ').trim()); m = re.exec(String(content || '')); }
  return out;
}

// Cuenta aproximada de etiquetas JSX/template: `<` seguido de letra, sin
// contar comparaciones tipo `i<n` (precedido por identificador o `)`/`]`).
function countProjectTags(content) {
  const m = String(content || '').match(/(^|[^\w$)\]])<[A-Za-z]/g);
  return m ? m.length : 0;
}

function projectClassValues(content) {
  const out = [];
  const re = /\b(?:className|class)\s*=\s*(?:"([^"]*)"|'([^']*)'|\{\s*`([^`]*)`\s*\}|\{\s*"([^"]*)"\s*\}|\{\s*'([^']*)'\s*\})/g;
  let m = re.exec(String(content || ''));
  while (m) { out.push(String(m[1] || m[2] || m[3] || m[4] || m[5] || '').replace(/\s+/g, ' ').trim()); m = re.exec(String(content || '')); }
  return out;
}

// Chequeo estructural de UN archivo reescrito: mismos imports, misma cantidad
// de etiquetas, mismas clases y un largo razonable. { ok, reasons, before, after }.
function verifyProjectRewriteFile(oldContent, newContent) {
  const reasons = [];
  const ia = projectImportLines(oldContent);
  const ib = projectImportLines(newContent);
  if (ia.length !== ib.length || ia.some((l, i) => l !== ib[i])) reasons.push('los imports cambiaron');
  const ta = countProjectTags(oldContent);
  const tb = countProjectTags(newContent);
  if (ta !== tb) reasons.push(`etiquetas: ${ta} → ${tb}`);
  const ca = projectClassValues(oldContent);
  const cb = projectClassValues(newContent);
  if (ca.length !== cb.length || ca.some((v, i) => v !== cb[i])) reasons.push('las clases (className/class) cambiaron');
  const ratio = String(newContent).length / Math.max(1, String(oldContent).length);
  if (ratio < 0.6 || ratio > 1.6) reasons.push(`el largo cambió demasiado (${Math.round(ratio * 100)}%)`);
  return { ok: reasons.length === 0, reasons, before: ta, after: tb };
}

// Aplica el chequeo a cada archivo devuelto: los que fallan se descartan con
// aviso; los que pasan quedan como cambios. Devuelve
//   { changes, discarded:[{path,reasons}], rejected, unchanged, tags }
function filterProjectRewrite(raw, currentFiles, opts) {
  const parsed = parseProjectEditResponse(raw, currentFiles, Object.assign({}, opts, { allowNew: false }));
  const changes = [];
  const discarded = [];
  let tags = 0;
  parsed.changes.forEach((c) => {
    const v = verifyProjectRewriteFile(c.old, c.content);
    if (v.ok) { changes.push(c); tags += v.after; } else discarded.push({ path: c.path, reasons: v.reasons });
  });
  return { changes, discarded, rejected: parsed.rejected, unchanged: parsed.unchanged, tags };
}

function buildProjectRewritePrompt(opts) {
  const o = opts || {};
  const lines = [];
  lines.push('Sos un redactor humano senior (copywriter con oficio). Tenés el código de una landing page multi-archivo ya construida (componentes JSX/Vue): la arquitectura es correcta pero el texto suena a plantilla de IA. Tu trabajo es reescribir SOLO el texto visible para inyectarle voz de marca, ritmo y matices culturales.');
  lines.push('');
  lines.push('Qué reescribir: títulos, subtítulos, párrafos, listas, botones, etiquetas, microcopy y textos de estado que se ven en pantalla (texto dentro del JSX / template, strings de arreglos de datos que se muestran, y atributos de texto como `alt`, `aria-label`, `title`, `placeholder`).');
  lines.push('Cómo:');
  lines.push(bulletList([
    'Narrativa antes que catálogo: contá el problema y el alivio, con emoción concreta, antes de enumerar características.',
    'Micro-copy que reduce ansiedad o promete un beneficio inmediato (ejemplo: "Obtené tu plan gratuito en 30 segundos" en lugar de "Registrarse"; nada de "Enviar" ni "Saber más" pelados).',
    'Ritmo humano: frases de longitud variable, verbos concretos, un dato específico por afirmación; como un experto hablando con un colega en un café.',
    `Tono del proyecto: ${(o.project && o.project.tono) || 'el que ya tiene la página'}. Español neutro y consistente con el resto.`,
    'Longitud parecida al texto original (±25%) para no romper el layout.',
  ]));
  lines.push('');
  lines.push('Qué NO tocar, bajo ningún concepto (se verifica por archivo y, si algo cambia, se descarta TODO lo que devolviste para ese archivo):');
  lines.push(bulletList([
    'Componentes, props, hooks, lógica, `key`, líneas `import`, nombres de variables y funciones.',
    'Etiquetas JSX/HTML: misma cantidad, mismo orden, ninguna agregada ni quitada. Clases (`className`/`class`), ids, `data-*`, estilos, URLs (`href`, `src`).',
    'Archivos CSS (no los devuelvas), números de contacto reales, precios, nombres propios de personas reales.',
  ]));
  if (o.restrictions) {
    lines.push('');
    lines.push('Restricciones negativas del proyecto (la reescritura las respeta y nunca reintroduce esas muletillas):');
    lines.push(o.restrictions);
  }
  lines.push('');
  lines.push('Formato de salida: devolvé SOLO los archivos donde cambiaste texto, cada uno COMPLETO, en bloques `=== FILE: ruta ===` … `=== END FILE ===` (ruta tal como figura en el listado). No devuelvas los que no cambian ni los marcados como RECORTADO. Sin explicaciones ni markdown.');
  lines.push('');
  lines.push(o.viewText || '');
  return lines.join('\n');
}

// ---- Inspector de dev-server previews (postMessage entre orígenes) ----

// ¿El mensaje viene del iframe del proyecto Y de su origen (127.0.0.1:<puerto>)?
function isTrustedInspectMessage(ev, frameWindow, previewUrl) {
  if (!ev || !frameWindow || ev.source !== frameWindow) return false;
  let origin;
  try { origin = new URL(previewUrl).origin; } catch (e) { return false; }
  if (!origin || origin === 'null' || ev.origin !== origin) return false;
  const d = ev.data;
  return !!d && typeof d === 'object' && (d.type === 'lpa:inspect-result' || d.type === 'lpa:inspector-ready');
}

function normalizeInspectPayload(d) {
  const src = (d && d.payload && typeof d.payload === 'object') ? d.payload : (d || {});
  const str = (v, n) => (typeof v === 'string' ? v.slice(0, n) : '');
  return {
    tag: str(src.tag, 40).toLowerCase(),
    id: str(src.id, 120),
    classes: Array.isArray(src.classes) ? src.classes.filter((c) => typeof c === 'string').slice(0, 20).map((c) => c.slice(0, 80)) : [],
    textSnippet: str(src.textSnippet, 120),
    ownText: str(src.ownText, 120),
  };
}

// Ubica en los archivos del proyecto el elemento inspeccionado. Devuelve
// { path, index, line, strategy } o null. `order` fija el orden de búsqueda.
function locateInProject(files, info, order) {
  const meta = info || {};
  const cand = (order || Object.keys(files || {})).filter((p) => /\.(jsx?|tsx?|mjs|vue|html)$/i.test(p) && typeof (files || {})[p] === 'string');
  const result = (p, idx, strategy) => ({ path: p, index: idx, line: files[p].slice(0, idx).split('\n').length, strategy });
  const openTagStart = (src, idx) => { const lt = src.lastIndexOf('<', idx); return lt !== -1 && idx - lt < 600 ? lt : idx; };
  const tag = String(meta.tag || '').toLowerCase();
  const classes = (meta.classes || []).filter(Boolean);

  if (meta.id) {
    const re = new RegExp(`\\bid\\s*=\\s*(?:["']|\\{\\s*["'\`])${escapeRegExp(meta.id)}["'\`]`);
    for (const p of cand) { const m = re.exec(files[p]); if (m) return result(p, openTagStart(files[p], m.index), 'id'); }
  }
  if (classes.length) {
    const attrRe = /\b(?:className|class)\s*=\s*(?:"([^"]*)"|'([^']*)'|\{\s*`([^`]*)`\s*\}|\{\s*"([^"]*)"\s*\}|\{\s*'([^']*)'\s*\})/g;
    const scan = (needAll, needTag) => {
      for (const p of cand) {
        const src = files[p];
        attrRe.lastIndex = 0;
        let m = attrRe.exec(src);
        while (m) {
          const tokens = String(m[1] || m[2] || m[3] || m[4] || m[5] || '').split(/\s+/).filter(Boolean);
          const ok = needAll ? classes.every((c) => tokens.indexOf(c) !== -1) : tokens.indexOf(classes[0]) !== -1;
          if (ok) {
            const start = openTagStart(src, m.index);
            const nm = /^<([A-Za-z][\w.-]*)/.exec(src.slice(start, start + 60));
            if (!needTag || (nm && nm[1].toLowerCase() === tag)) return result(p, start, needTag ? 'tag+class' : (needAll ? 'class' : 'class-first'));
          }
          m = attrRe.exec(src);
        }
      }
      return null;
    };
    const hit = scan(true, true) || scan(true, false);
    if (hit) return hit;
  }
  const texts = [];
  [meta.ownText, meta.textSnippet].forEach((t) => {
    const s = String(t || '').replace(/\s+/g, ' ').trim();
    if (s.length < 4) return;
    texts.push(s.slice(0, 40));
    if (s.length > 20) texts.push(s.slice(0, 20));
    const w = s.split(' ').slice(0, 3).join(' ');
    if (w.length >= 4) texts.push(w);
  });
  for (const t of texts) {
    for (const p of cand) {
      const idx = files[p].indexOf(t);
      if (idx !== -1) return result(p, idx, 'text');
    }
  }
  if (classes.length) {
    const hit = (() => {
      for (const p of cand) { const idx = files[p].indexOf(classes[0]); if (idx !== -1) return result(p, idx, 'class-first'); }
      return null;
    })();
    if (hit) return hit;
  }
  if (tag) {
    const re = new RegExp(`<${escapeRegExp(tag)}\\b`, 'i');
    for (const p of cand) { const m = re.exec(files[p]); if (m) return result(p, m.index, 'tag'); }
  }
  return null;
}

// Snapshot de versiones para proyectos (tope 10) sin mutar el arreglo recibido.
function pushProjectVersion(versions, files, partial) {
  const v = Object.assign({ id: 'v' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8), date: new Date().toISOString() }, partial, { files: Object.assign({}, files) });
  const out = [v].concat(versions || []);
  if (out.length > PROJECT_VERSION_CAP) out.length = PROJECT_VERSION_CAP;
  return out;
}

// Qué archivos hay que reescribir para volver a un snapshot.
function diffProjectSnapshot(currentFiles, snapshotFiles) {
  const cur = currentFiles || {};
  return Object.keys(snapshotFiles || {}).filter((p) => cur[p] !== snapshotFiles[p]).map((p) => ({ path: p, content: snapshotFiles[p], old: cur[p] || '', isNew: !Object.prototype.hasOwnProperty.call(cur, p) }));
}

/* =========================================================================
 * 6. EJECUCIÓN CONTRA UN PROVEEDOR
 * ========================================================================= */

function extractHtml(raw) {
  if (!raw) return '';
  let text = String(raw).trim();
  const fenceMatch = text.match(/```(?:html)?\s*([\s\S]*?)```/i);
  if (fenceMatch) text = fenceMatch[1].trim();
  const docTypeIdx = text.search(/<!DOCTYPE html>/i);
  const htmlIdx = text.search(/<html[\s>]/i);
  const startIdx = docTypeIdx >= 0 ? docTypeIdx : htmlIdx;
  if (startIdx < 0) return '';
  const lower = text.toLowerCase();
  const endIdx = lower.lastIndexOf('</html>');
  const end = endIdx >= 0 ? endIdx + '</html>'.length : text.length;
  return text.slice(startIdx, end);
}

// Como extractHtml, pero para respuestas de texto plano (el meta-prompt, la
// reparación, etc.): sólo pela comillas triples/backticks si el modelo las
// agregó igual pese a que se le pidió que no lo hiciera.
function extractPlainText(raw) {
  if (!raw) return '';
  let text = String(raw).trim();
  const fenceMatch = text.match(/^```[a-z]*\s*([\s\S]*?)```$/i);
  if (fenceMatch) text = fenceMatch[1].trim();
  return text;
}

// Respuestas multi-archivo (React/Vue con Vite, Next.js): conserva sólo los
// bloques `=== FILE: ruta ===` … `=== END FILE ===` (descarta preámbulo y
// cercas de markdown sueltas). Devuelve '' si no hay ninguno.
// Los modelos no siempre respetan el formato exacto de los bloques. Esto
// convierte las variantes más comunes al formato canónico
// `=== FILE: ruta ===` … `=== END FILE ===`:
//  - marcadores decorados (**…**, `…`, ### …, "--- FILE: x ---", "FILE: x");
//  - cierre olvidado (se cierra en el próximo FILE o al final);
//  - markdown: una línea con la ruta (### app/page.jsx, **app/page.jsx**,
//    `app/page.jsx`, "Archivo: app/page.jsx") seguida de un bloque ``` …```,
//    o un bloque ``` cuya primera línea es un comentario con la ruta.
const PROJECT_PATH_RE = /([A-Za-z0-9_.\-/]+\/[A-Za-z0-9_.\-]+\.(?:jsx?|tsx?|mjs|css|html|vue|json|md)|[A-Za-z0-9_.\-]+\.(?:jsx?|tsx?|mjs|css|vue))/;

function normalizeProjectFilesText(raw) {
  if (!raw) return '';
  const text = String(raw).replace(/\r\n/g, '\n');
  const lines = text.split('\n');
  const stripDeco = (l) => l.replace(/^[\s#>*`_]+/, '').replace(/[\s*`_]+$/, '');
  const startRe = /^(?:={2,}|-{2,})?\s*(?:FILE|ARCHIVO)\s*:\s*(.+?)\s*(?:={2,}|-{2,})?$/i;
  const endRe = /^(?:={2,}|-{2,})\s*END(?:\s+(?:FILE|ARCHIVO))?\s*(?:={2,}|-{2,})?$/i;

  // 1) Marcadores FILE (canónicos o decorados)
  if (lines.some((l) => startRe.test(stripDeco(l)))) {
    const out = [];
    let open = false;
    lines.forEach((l) => {
      const d = stripDeco(l);
      const sm = d.match(startRe);
      if (sm) {
        if (open) out.push('=== END FILE ===');
        out.push(`=== FILE: ${sm[1].replace(/^[`'"]+|[`'"]+$/g, '').trim()} ===`);
        open = true;
        return;
      }
      if (endRe.test(d)) {
        if (open) out.push('=== END FILE ===');
        open = false;
        return;
      }
      if (open) out.push(l);
    });
    if (open) out.push('=== END FILE ===');
    return out.join('\n');
  }

  // 2) Markdown: ruta en la línea previa (o como comentario inicial) + bloque ```
  const out = [];
  let lastPath = null;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const fence = l.match(/^\s*```[\w.+-]*\s*$/);
    if (!fence) {
      const pm = stripDeco(l).match(PROJECT_PATH_RE);
      if (pm && stripDeco(l).length < 160) lastPath = pm[1];
      else if (l.trim()) lastPath = lastPath && /^[\s#>*`]/.test(l) ? lastPath : lastPath;
      continue;
    }
    const body = [];
    let j = i + 1;
    while (j < lines.length && !/^\s*```\s*$/.test(lines[j])) body.push(lines[j++]);
    let path = lastPath;
    if (body.length) {
      const cm = body[0].match(/^\s*(?:\/\/|\/\*|<!--|#)\s*(?:FILE|ARCHIVO)?\s*:?\s*([A-Za-z0-9_.\-/]+\.[a-z]+)\s*(?:\*\/|-->)?\s*$/i);
      if (cm && PROJECT_PATH_RE.test(cm[1])) { path = cm[1]; body.shift(); }
    }
    if (path) {
      out.push(`=== FILE: ${path} ===`, body.join('\n'), '=== END FILE ===');
      lastPath = null;
    }
    i = j;
  }
  return out.join('\n');
}

function extractProjectFilesText(raw) {
  if (!raw) return '';
  const text = normalizeProjectFilesText(raw);
  if (!looksLikeProjectFiles(text)) return '';
  const start = text.search(/^[ \t]*=== FILE:/m);
  const endMarker = '=== END FILE ===';
  const end = text.lastIndexOf(endMarker);
  return text.slice(start, end + endMarker.length).trim();
}

// ¿El prompt pide un proyecto multi-archivo? (lo dice su SALIDA FINAL)
function promptWantsProjectFiles(promptText) {
  return typeof promptText === 'string' && /=== FILE:/.test(promptText) && /=== END FILE ===/.test(promptText);
}

// Deduce la tecnología del proyecto ('nextjs' | 'vue' | 'react') a partir de
// las rutas de los archivos que devolvió el modelo.
function detectProjectTechnology(filePaths) {
  const paths = filePaths || [];
  if (paths.some((p) => /^(src\/)?app\/page\.[a-z]+$/i.test(p))) return 'nextjs';
  if (paths.some((p) => /\.vue$/i.test(p))) return 'vue';
  return 'react';
}

// Extrae texto de un `content` de respuesta que puede venir como string
// simple o como array de bloques `{ type: 'text', text: '...' }` (Anthropic
// y varias implementaciones compatibles con OpenAI usan ambas formas).
function extractMessageText(content) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content.map((block) => (typeof block === 'string' ? block : (block && block.text) || '')).join('\n');
  }
  return '';
}

// Arma la petición (url + headers + cuerpo) para el proveedor configurado,
// sin ejecutarla: así el mismo objeto sirve tanto para `fetch` directo como
// para reenviarlo al proxy local (`/api/proxy`) cuando el navegador bloquea
// la llamada por CORS.
const OPENAI_COMPAT_MAX_TOKENS = 128000;
const OPENAI_COMPAT_MAX_TOKENS_STEPS = [128000, 65536, 32768, 8192];

// Control del razonamiento (DeepSeek: thinking.type enabled|disabled y
// reasoning_effort none|low|high|max). 'auto' no manda nada: decide el
// proveedor. Si el proveedor rechaza estos campos (400), runPrompt reintenta
// una vez sin ellos (providerConfig.reasoningUnsupported).
function reasoningParams(providerConfig) {
  const r = providerConfig && providerConfig.reasoning;
  if (!r || r === 'auto' || providerConfig.reasoningUnsupported) return {};
  if (r === 'none') return { thinking: { type: 'disabled' } };
  return { thinking: { type: 'enabled' }, reasoning_effort: r };
}

function openaiCompatMaxTokens(providerConfig) {
  return providerConfig.maxTokensOverride || OPENAI_COMPAT_MAX_TOKENS;
}

function buildProviderRequest(providerConfig, promptText) {
  if (providerConfig.type === 'anthropic') {
    if (!providerConfig.apiKey) return { error: 'Falta la clave de API de Anthropic.' };
    return {
      url: 'https://api.anthropic.com/v1/messages',
      headers: {
        'content-type': 'application/json',
        'x-api-key': providerConfig.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: {
        model: providerConfig.model || 'claude-sonnet-5',
        max_tokens: providerConfig.maxTokens || 16000,
        messages: [{ role: 'user', content: promptText }],
      },
      extract: (data) => extractMessageText((data && data.content) || []),
    };
  }
  if (providerConfig.type === 'openai-compatible') {
    if (!providerConfig.baseUrl || !providerConfig.apiKey) {
      return { error: 'Faltan datos del proveedor compatible con OpenAI (URL base y/o clave).' };
    }
    return {
      url: providerConfig.baseUrl.replace(/\/$/, '') + '/chat/completions',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${providerConfig.apiKey}`,
      },
      body: {
        model: providerConfig.model,
        messages: [{ role: 'user', content: promptText }],
        // Sin max_tokens varios proveedores cortan la landing a la mitad. En
        // modelos que razonan (p. ej. deepseek-flash) los tokens de
        // razonamiento cuentan dentro de max_tokens, por eso el valor es alto.
        // Se ignora el maxTokens guardado en configs viejas (16000/32000); si
        // el modelo rechaza el valor, runPrompt baja escalonadamente.
        max_tokens: openaiCompatMaxTokens(providerConfig),
        ...reasoningParams(providerConfig),
      },
      extract: (data) => {
        const choice = data && data.choices && data.choices[0];
        const content = choice && choice.message ? choice.message.content : '';
        return extractMessageText(content);
      },
    };
  }
  return { error: 'Proveedor no reconocido.' };
}

/* ---- Streaming (SSE) ----
 * Parser SSE tolerante (líneas partidas entre chunks, CRLF/CR, comentarios
 * ":", eventos multi-línea `data:`) + acumulador para los dos dialectos que
 * usa la app: OpenAI-compatible (choices[0].delta.content, y
 * delta.reasoning_content en modelos que razonan como DeepSeek) y Anthropic
 * (content_block_delta / text_delta / thinking_delta, message_delta). Lo usan
 * el cliente (runPrompt) y server.js (/api/proxy, para armar el log). */
function createSseParser(onEvent) {
  let buf = '';
  let dataLines = [];
  let eventName = '';
  const dispatch = () => {
    if (dataLines.length || eventName) onEvent({ event: eventName || 'message', data: dataLines.join('\n') });
    dataLines = [];
    eventName = '';
  };
  const handleLine = (l) => {
    if (l === '') { dispatch(); return; }
    if (l.charCodeAt(0) === 58) return; // comentario / keep-alive
    const i = l.indexOf(':');
    const field = i < 0 ? l : l.slice(0, i);
    let value = i < 0 ? '' : l.slice(i + 1);
    if (value.charAt(0) === ' ') value = value.slice(1);
    if (field === 'data') dataLines.push(value);
    else if (field === 'event') eventName = value;
  };
  return {
    feed(chunk) {
      buf += String(chunk);
      const re = /\r\n|\n|\r/g;
      let start = 0;
      let m;
      while ((m = re.exec(buf))) {
        if (m[0] === '\r' && m.index === buf.length - 1) break; // podría ser la mitad de un \r\n
        handleLine(buf.slice(start, m.index));
        start = m.index + m[0].length;
      }
      buf = buf.slice(start);
    },
    flush() {
      if (buf) { handleLine(buf); buf = ''; }
      dispatch();
    },
  };
}

function createStreamAccumulator() {
  const acc = { text: '', reasoning: '', finish: null, stopReason: null, usage: null, done: false, error: null, events: 0 };
  const parser = createSseParser((ev) => {
    const d = ev.data;
    if (!d) return;
    if (d.trim() === '[DONE]') { acc.done = true; return; }
    let j;
    try { j = JSON.parse(d); } catch (e) { return; }
    if (!j || typeof j !== 'object') return;
    acc.events++;
    if (ev.event === 'error' || j.type === 'error' || (j.error && !j.choices)) {
      const err = j.error || j;
      acc.error = (typeof err === 'string' ? err : (err.message || JSON.stringify(err))).slice(0, 400);
      return;
    }
    const ch = j.choices && j.choices[0];
    if (ch) {
      const delta = ch.delta || {};
      if (typeof delta.content === 'string') acc.text += delta.content;
      else if (Array.isArray(delta.content)) acc.text += delta.content.map((p) => (p && typeof p.text === 'string' ? p.text : '')).join('');
      const r = delta.reasoning_content || delta.reasoning;
      if (typeof r === 'string') acc.reasoning += r;
      if (ch.finish_reason) acc.finish = ch.finish_reason;
    }
    if (j.usage) acc.usage = Object.assign({}, acc.usage, j.usage);
    switch (j.type) {
      case 'content_block_delta':
        if (j.delta && j.delta.type === 'text_delta' && typeof j.delta.text === 'string') acc.text += j.delta.text;
        else if (j.delta && j.delta.type === 'thinking_delta' && typeof j.delta.thinking === 'string') acc.reasoning += j.delta.thinking;
        break;
      case 'message_start':
        if (j.message && j.message.usage) acc.usage = Object.assign({}, acc.usage, j.message.usage);
        break;
      case 'message_delta':
        if (j.delta && j.delta.stop_reason) acc.stopReason = j.delta.stop_reason;
        break;
      case 'message_stop':
        acc.done = true;
        break;
      default:
    }
  });
  acc.feed = (s) => parser.feed(s);
  acc.flush = () => parser.flush();
  acc.truncated = () => acc.finish === 'length' || acc.stopReason === 'max_tokens';
  return acc;
}

// Lee una Response con cuerpo SSE hasta el final alimentando `acc`; llama a
// onDelta(textoAcumulado, {reasoningChars}) tras cada chunk de red.
async function consumeSseResponse(res, acc, onDelta) {
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  const notify = () => { if (typeof onDelta === 'function') { try { onDelta(acc.text, { reasoningChars: acc.reasoning.length }); } catch (e) { /* la UI no debe cortar el stream */ } } };
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    acc.feed(decoder.decode(value, { stream: true }));
    notify();
  }
  acc.feed(decoder.decode());
  acc.flush();
  notify();
  return acc;
}

// Lector de NDJSON (un objeto JSON por línea) para /api/opencode/complete
// con stream:true. Devuelve las líneas parseadas vía onObj.
async function consumeNdjsonResponse(res, onObj) {
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  const handle = (line) => {
    const t = line.trim();
    if (!t) return;
    let o;
    try { o = JSON.parse(t); } catch (e) { return; }
    onObj(o);
  };
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let i;
    while ((i = buf.indexOf('\n')) >= 0) { handle(buf.slice(0, i)); buf = buf.slice(i + 1); }
  }
  buf += decoder.decode();
  handle(buf);
}

/* ---- Ayudas puras de la UI de streaming (testeables sin DOM) ---- */
const STREAM_TICK_MS = 800;

// HTML parcial renderizable a partir del texto acumulado, o null si todavía no
// hay `<body`. Recorta prólogo (markdown/prosa), un <script> sin cerrar y una
// etiqueta cortada al final: el navegador cierra el resto solo.
function partialPreviewHtml(text) {
  let t = String(text || '');
  if (!/<body[\s>]/i.test(t)) return null;
  const m = t.search(/<!doctype\s+html|<html[\s>]/i);
  if (m > 0) t = t.slice(m);
  else if (m < 0) {
    const h = t.search(/<head[\s>]|<body[\s>]/i);
    t = '<!DOCTYPE html>' + t.slice(h);
  }
  const lower = t.toLowerCase();
  const ls = lower.lastIndexOf('<script');
  if (ls >= 0 && ls > lower.lastIndexOf('</script')) t = t.slice(0, ls);
  const lt = t.lastIndexOf('<');
  if (lt > t.lastIndexOf('>')) t = t.slice(0, lt);
  return t;
}

// Throttle: hay que refrescar si pasó el intervalo Y el texto creció.
// view = { lastAt, lastLen } (lo actualiza quien renderiza).
function shouldStreamTick(view, now, len, intervalMs) {
  return (now - view.lastAt) >= (intervalMs || STREAM_TICK_MS) && len > view.lastLen;
}

// Archivos que ya asomaron en un stream multi-archivo: marcadores
// `=== FILE: ruta ===`; `size` = caracteres desde el marcador hasta el
// siguiente marcador / `=== END FILE ===` (o el final si sigue abierto).
function parseStreamFileList(text) {
  const raw = String(text || '');
  const files = [];
  const re = /^[ \t]*=== FILE:[ \t]*(.+?)[ \t]*===[ \t]*$/gm;
  const marks = [];
  let m;
  while ((m = re.exec(raw))) marks.push({ path: m[1].replace(/^[`'"]+|[`'"]+$/g, ''), start: m.index + m[0].length, at: m.index });
  for (let i = 0; i < marks.length; i++) {
    const end = i + 1 < marks.length ? marks[i + 1].at : raw.length;
    const body = raw.slice(marks[i].start, end);
    const endIdx = body.search(/^[ \t]*=== END FILE ===/m);
    const closed = endIdx >= 0;
    files.push({ path: marks[i].path, size: (closed ? body.slice(0, endIdx) : body).replace(/^\r?\n/, '').replace(/\r?\n$/, '').length, closed });
  }
  return files;
}

function formatStreamStatus(i) {
  const secs = Math.floor((i.elapsedMs || 0) / 1000);
  const clock = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
  const nf = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const chars = i.chars || 0;
  const rc = i.reasoningChars || 0;
  if (!chars) {
    return rc > 0
      ? `Razonando… (${nf(rc)} caracteres) · ${clock}`
      : `Esperando la primera respuesta del modelo… · ${clock}`;
  }
  let msg = `Generando… ${nf(chars)} caracteres (~${nf(Math.round(chars / 4))} tokens) · ${clock}`;
  if (rc > 0) msg += ` · razonó ${nf(rc)} caracteres`;
  const files = i.files || [];
  if (files.length) {
    const shown = files.slice(-6).map((f) => `${f.path} (${f.size >= 1024 ? (f.size / 1024).toFixed(1) + ' KB' : f.size + ' B'}${f.closed ? '' : ', escribiendo…'})`);
    msg += ` · Archivos (${files.length}): ${files.length > 6 ? '… ' : ''}${shown.join(', ')}`;
  }
  if (i.partialShown) msg += ' · vista previa parcial';
  return msg;
}

const PROXY_ENDPOINT = '/api/proxy';
const OPENCODE_RUN_ENDPOINT = '/api/opencode/run';

// El proveedor "OpenCode local" no llama a una API externa: le pide al
// servidor (server.js) que ejecute el CLI de OpenCode instalado en la
// máquina, con un modelo gratuito. Nunca puede ir por `fetch` directo (no
// existe tal API pública), siempre pasa por el mismo origen.
async function runOpencodeLocal(providerConfig, promptText) {
  if (!providerConfig.model) {
    return { ok: false, error: 'Elegí un modelo de OpenCode en "Configuración" antes de ejecutar.' };
  }
  try {
    const res = await fetch(OPENCODE_RUN_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ prompt: promptText, model: providerConfig.model }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const detail = data.stderr ? ` (detalle: ${String(data.stderr).slice(-300)})` : '';
      return { ok: false, error: (data.error || `Error de OpenCode (${res.status}).`) + detail, attempts: data.attempts || [] };
    }
    const html = extractHtml(data.html || '');
    if (!html) return { ok: false, error: 'OpenCode no generó un documento HTML reconocible.', attempts: data.attempts || [] };
    return { ok: true, html, model: data.model, attempts: data.attempts || [] };
  } catch (e) {
    return {
      ok: false,
      error: 'No se pudo conectar con el proxy local de OpenCode. Verificá que `node server.js` esté corriendo en http://localhost:3000.',
    };
  }
}

// opts.expect: 'html' (por defecto, ejecutar una landing), 'text' (generar
// o reparar un prompt) o 'files' (proyecto multi-archivo: devuelve `text` con
// los bloques `=== FILE: ruta ===`).
async function runPrompt(providerConfig, promptText, opts) {
  const expect = (opts && opts.expect) || 'html';
  if (!providerConfig || !providerConfig.type) {
    return { ok: false, error: 'No hay un proveedor configurado. Configurá uno en "Configuración".' };
  }
  if (typeof fetch !== 'function') {
    return { ok: false, error: 'Este entorno no tiene disponible `fetch` para ejecutar el prompt.' };
  }

  const hasLocation = typeof location !== 'undefined';
  if (hasLocation && location.protocol === 'file:') {
    return {
      ok: false,
      error: 'Abrí la app con `node server.js` y entrá a http://localhost:3000; este proveedor no permite llamadas directas desde el navegador.',
    };
  }

  if (providerConfig.type === 'opencode-local') {
    return runOpencodeLocal(providerConfig, promptText);
  }

  // Cuando la app corre servida por http(s) (server.js), enrutamos siempre
  // a través del proxy local: mismo origen, sin problemas de CORS, y un
  // único camino de código tanto para Anthropic como para el proveedor
  // compatible con OpenAI (opción más simple y consistente).
  const useProxy = hasLocation && (location.protocol === 'http:' || location.protocol === 'https:');

  const request = buildProviderRequest(providerConfig, promptText);
  if (request.error) return { ok: false, error: request.error };

  const wantStream = !!(opts && opts.stream) && !(opts && opts.noStream);
  const signal = (opts && opts.signal) || undefined;
  try {
    let res;
    if (wantStream) request.body = Object.assign({}, request.body, { stream: true });
    if (useProxy) {
      res = await fetch(PROXY_ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url: request.url, headers: request.headers, body: request.body, stream: wantStream }),
        signal,
      });
    } else {
      res = await fetch(request.url, {
        method: 'POST',
        headers: request.headers,
        body: JSON.stringify(request.body),
        signal,
      });
    }

    if (!res.ok) {
      const t = await res.text().catch(() => '');
      if (res.status === 400 && /max_tokens/i.test(t) && providerConfig.type === 'openai-compatible') {
        const current = openaiCompatMaxTokens(providerConfig);
        const next = OPENAI_COMPAT_MAX_TOKENS_STEPS.find((v) => v < current);
        if (next) return runPrompt(Object.assign({}, providerConfig, { maxTokensOverride: next }), promptText, opts);
      }
      // El proveedor no acepta `thinking` / `reasoning_effort`: un reintento sin ellos.
      if (res.status === 400 && /thinking|reasoning/i.test(t) && providerConfig.type === 'openai-compatible'
        && Object.keys(reasoningParams(providerConfig)).length) {
        if (typeof console !== 'undefined') console.warn('[razonamiento] el proveedor rechazó el ajuste de razonamiento; se reintenta sin él:', t.slice(0, 200));
        return runPrompt(Object.assign({}, providerConfig, { reasoningUnsupported: true }), promptText, opts);
      }
      // Respaldo: el proveedor rechaza `stream` -> un reintento sin streaming.
      if (wantStream && /stream/i.test(t)) {
        return runPrompt(providerConfig, promptText, Object.assign({}, opts, { noStream: true }));
      }
      let detail = t;
      try { detail = JSON.stringify(JSON.parse(t)); } catch (e) { /* no era JSON, se usa el texto tal cual */ }
      return { ok: false, error: `Error del proveedor (${res.status}): ${detail || 'sin detalle'}` };
    }

    let raw;
    let truncated;
    const isSse = /text\/event-stream/i.test((res.headers && res.headers.get && res.headers.get('content-type')) || '');
    if (wantStream && isSse && res.body && typeof res.body.getReader === 'function') {
      const acc = createStreamAccumulator();
      await consumeSseResponse(res, acc, opts && opts.onDelta);
      if (acc.error && !acc.text) return { ok: false, error: `Error del proveedor (streaming): ${acc.error}` };
      raw = acc.text;
      // Un stream cortado sin finish_reason/[DONE] se trata como truncado.
      truncated = acc.truncated() || (!acc.finish && !acc.stopReason && !acc.done);
    } else {
      // Sin streaming (o el proveedor/proxy ignoró `stream` y devolvió JSON): igual que siempre.
      const data = await res.json();
      raw = request.extract(data);
      const finish = data && data.choices && data.choices[0] && data.choices[0].finish_reason;
      truncated = finish === 'length' || (data && data.stop_reason === 'max_tokens');
    }
    if (expect === 'text') {
      const text = extractPlainText(raw);
      if (!text) return { ok: false, error: 'El modelo devolvió una respuesta vacía.' };
      return { ok: true, text, model: providerConfig.model, truncated };
    }
    if (expect === 'files') {
      if (truncated) {
        return { ok: false, error: 'El modelo cortó la respuesta por límite de tokens antes de terminar los archivos del proyecto. Probá de nuevo o usá un modelo con más salida.' };
      }
      const filesText = extractProjectFilesText(raw);
      if (!filesText) {
        // Respaldo: el modelo devolvió un HTML único en vez del proyecto.
        const fallbackHtml = extractHtml(raw);
        if (fallbackHtml) return { ok: true, text: '', html: fallbackHtml, htmlFallback: true, model: providerConfig.model };
        const preview = String(raw || '').replace(/\s+/g, ' ').trim().slice(0, 220);
        return { ok: false, error: `La respuesta del modelo no contenía archivos de proyecto reconocibles (bloques \`=== FILE: ruta ===\`). Inicio de la respuesta: «${preview || '(vacía)'}»`, raw };
      }
      return { ok: true, text: filesText, model: providerConfig.model };
    }
    if (truncated) {
      const used = providerConfig.type === 'openai-compatible' ? openaiCompatMaxTokens(providerConfig) : (providerConfig.maxTokens || 16000);
      return { ok: false, error: `El modelo cortó la respuesta por límite de tokens (max_tokens=${used}). Si el modelo razona antes de responder, ese razonamiento también consume tokens: probá de nuevo o usá un modelo con más salida.` };
    }
    const html = extractHtml(raw);
    if (!html) return { ok: false, error: 'La respuesta del modelo no contenía un documento HTML reconocible.' };
    return { ok: true, html, model: providerConfig.model };
  } catch (e) {
    if (e && e.name === 'AbortError') return { ok: false, cancelled: true, error: 'Ejecución cancelada por el usuario.' };
    if (e && e.name === 'TypeError') {
      return {
        ok: false,
        error: 'No se pudo conectar con el proveedor (posible bloqueo de CORS del navegador). Si abriste la app con file://, iniciá `node server.js` y entrá a http://localhost:3000: las llamadas se enrutan a través de un proxy local que evita el bloqueo.',
      };
    }
    return { ok: false, error: 'No se pudo conectar con el proveedor. Verificá la clave, la URL y tu conexión.' };
  }
}

/* =========================================================================
 * 6b. ESTUDIO — EDICIÓN ASISTIDA POR IA, DIFF Y CLICK-TO-CODE
 * ========================================================================= */

// Arma el pedido de edición puntual sobre una landing ya generada: instruye
// mantener todo lo demás intacto, respetar las restricciones negativas del
// prompt original y devolver el documento completo (nunca un fragmento).
function buildEditPrompt(opts) {
  const o = opts || {};
  const lines = [];
  lines.push('Sos un ingeniero frontend senior. Tenés un documento HTML autocontenido ya generado (una landing page) y tenés que aplicarle UN cambio puntual pedido por quien lo está editando.');
  lines.push('');
  lines.push(`Cambio pedido: ${o.instruction || ''}`);
  lines.push('');
  lines.push(`Alcance del cambio: ${o.scope === 'selection'
    ? 'aplicá el cambio SOLO en el fragmento seleccionado (mostrado abajo); no toques el resto del documento salvo que sea imprescindible para que el cambio funcione.'
    : 'el cambio puede afectar el documento completo si el pedido lo requiere, pero no introduzcas cambios que no fueron pedidos.'}`);
  if (o.selectedFragment) {
    lines.push('');
    lines.push('Fragmento seleccionado (referencia de dónde aplicar el cambio):');
    lines.push('```html');
    lines.push(o.selectedFragment);
    lines.push('```');
  }
  if (o.negativeConstraints) {
    lines.push('');
    lines.push('Restricciones negativas del prompt original que generó esta landing (seguí respetándolas):');
    lines.push(o.negativeConstraints);
  }
  lines.push('');
  lines.push('Reglas obligatorias:');
  lines.push('- Mantené intacto todo lo que no esté relacionado con el cambio pedido: estructura, copy, estilos, scripts.');
  lines.push('- Mantené el copy en español.');
  lines.push('- No agregues secciones, componentes ni animación decorativa nuevos que no pidió el cambio.');
  lines.push('- Devolvé el documento HTML COMPLETO y actualizado, autocontenido, empezando en `<!DOCTYPE html>` y terminando en `</html>`.');
  lines.push('- No agregues explicaciones antes ni después del código. No uses bloques de markdown ni comillas triples.');
  lines.push('');
  lines.push('Documento HTML actual completo:');
  lines.push('```html');
  lines.push(o.fullHtml || '');
  lines.push('```');
  return lines.join('\n');
}

// Diff de líneas simple (LCS) para el resumen "líneas agregadas/eliminadas"
// tras una edición con IA. Con documentos muy grandes (n*m fuera de rango
// razonable para la DP) cae a un conteo aproximado por conjuntos en vez de
// calcular la subsecuencia común más larga exacta.
function diffLines(oldText, newText) {
  const a = String(oldText || '').split('\n');
  const b = String(newText || '').split('\n');
  const n = a.length;
  const m = b.length;

  if (n * m > 4000000) {
    const setA = new Set(a);
    const setB = new Set(b);
    const added = b.filter((l) => !setA.has(l)).length;
    const removed = a.filter((l) => !setB.has(l)).length;
    return { added, removed, approximate: true, ops: [] };
  }

  const dp = new Array(n + 1);
  for (let i = 0; i <= n; i++) dp[i] = new Uint32Array(m + 1);
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const ops = [];
  let i = 0;
  let j = 0;
  let added = 0;
  let removed = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) { ops.push({ type: 'equal', line: a[i] }); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { ops.push({ type: 'remove', line: a[i] }); removed++; i++; }
    else { ops.push({ type: 'add', line: b[j] }); added++; j++; }
  }
  while (i < n) { ops.push({ type: 'remove', line: a[i] }); removed++; i++; }
  while (j < m) { ops.push({ type: 'add', line: b[j] }); added++; j++; }

  return { added, removed, approximate: false, ops };
}

// Click-to-code: dado el snapshot del DOM clickeado en la preview (tag, id,
// clases, texto, prefijo de outerHTML), ubica la mejor posición aproximada
// en el HTML fuente. Estrategia en cascada porque el outerHTML serializado
// por el navegador rara vez coincide byte a byte con el HTML autoría: se
// intenta por id (más confiable), luego por prefijo literal de outerHTML,
// luego por tag+clase, luego por tag solo, y por último por fragmento de
// texto visible. Devuelve null si ninguna estrategia encuentra nada.
function locateInSource(sourceText, info) {
  const src = String(sourceText || '');
  const meta = info || {};

  const toResult = (idx, strategy) => {
    if (idx == null || idx < 0) return null;
    const before = src.slice(0, idx);
    const line = before.split('\n').length; // 1-based
    return { index: idx, line, strategy };
  };

  if (meta.id) {
    const re = new RegExp(`id=["']${escapeRegExp(meta.id)}["']`);
    const m = re.exec(src);
    if (m) return toResult(m.index, 'id');
  }
  if (meta.outerHTMLPrefix) {
    const idx = src.indexOf(meta.outerHTMLPrefix);
    if (idx !== -1) return toResult(idx, 'outerHTML');
  }
  if (meta.tag && meta.classes && meta.classes.length) {
    const firstClass = meta.classes[0];
    const re = new RegExp(`<${escapeRegExp(meta.tag)}\\b[^>]*class=["'][^"']*\\b${escapeRegExp(firstClass)}\\b[^"']*["']`, 'i');
    const m = re.exec(src);
    if (m) return toResult(m.index, 'tag+class');
  }
  if (meta.textSnippet && meta.textSnippet.trim().length > 2) {
    const snippet = meta.textSnippet.trim().slice(0, 40);
    const idx = src.indexOf(snippet);
    if (idx !== -1) return toResult(idx, 'text');
  }
  if (meta.tag) {
    const re = new RegExp(`<${escapeRegExp(meta.tag)}\\b`, 'i');
    const m = re.exec(src);
    if (m) return toResult(m.index, 'tag');
  }
  return null;
}

// Script inyectado SOLO en el HTML que se manda a la preview (nunca en el
// código guardado/editado): habilita Alt+clic (o el modo "Inspeccionar"
// activado desde afuera) para identificar el elemento clickeado y avisarle
// al padre. Corre dentro del iframe sandboxeado sin allow-same-origin, así
// que nunca toca el contexto principal de la app.
const INSPECTOR_SCRIPT = '\n<script>(function(){'
  + 'var inspecting=false,lastEl=null,prevOutline="";'
  + 'window.addEventListener("message",function(ev){var d=ev.data;if(!d||d.type!=="lpa:inspect-toggle")return;inspecting=!!d.enabled;});'
  + 'document.addEventListener("click",function(ev){'
  + 'if(!(ev.altKey||inspecting))return;'
  + 'var el=ev.target;if(!el||el===document.documentElement||el===document.body)return;'
  + 'ev.preventDefault();ev.stopPropagation();'
  + 'if(lastEl)lastEl.style.outline=prevOutline;'
  + 'prevOutline=el.style.outline;el.style.outline="2px solid #1f3a6f";lastEl=el;'
  + 'var classes=(el.className&&typeof el.className==="string")?el.className.trim().split(/\\s+/).filter(Boolean):[];'
  + 'var outer="";try{outer=el.outerHTML.slice(0,160);}catch(e){}'
  + 'var text=(el.textContent||"").trim().slice(0,80);'
  + 'try{window.parent.postMessage({type:"lpa:inspect-result",payload:{tag:el.tagName.toLowerCase(),id:el.id||"",classes:classes,textSnippet:text,outerHTMLPrefix:outer}},"*");}catch(e){}'
  + '},true);'
  + '})();</script>\n';

function injectInspector(html) {
  const src = String(html || '');
  if (!src) return src;
  if (/<\/body>/i.test(src)) return src.replace(/<\/body>/i, INSPECTOR_SCRIPT + '</body>');
  return src + INSPECTOR_SCRIPT;
}

/* ---- Consola del Estudio: captura de errores/logs de la preview ----
 * El script vive en console-capture.js (clásico en el navegador, CommonJS en
 * Node). Se inyecta SOLO en la copia que va a la preview. */
const CONSOLE_CAPTURE_LIB = (typeof globalThis !== 'undefined' && globalThis.LPA_CONSOLE_CAPTURE)
  || (typeof require === 'function' ? (() => { try { return require('./console-capture.js'); } catch (e) { return null; } })() : null);

function buildConsoleScript(cfg) {
  return CONSOLE_CAPTURE_LIB ? CONSOLE_CAPTURE_LIB.buildConsoleCaptureScript(cfg) : '';
}

// Inserta <script>…</script> como PRIMER elemento de <head>, en la MISMA
// línea que la etiqueta (sin saltos) para que los números de línea del
// código original no se corran. Devuelve { html, info } con
// info = { line, col, len } (línea 1-based y columna 0-based donde se insertó
// y largo insertado) para corregir columnas en esa única línea; info null si
// no se inyectó nada.
function injectConsoleCaptureInfo(html, script) {
  const src = String(html || '');
  if (!src || !script) return { html: src, info: null };
  const tag = '<script>' + script.replace(/<\/(script)/gi, '<\\/$1') + '</script>';
  const insideComment = (idx) => src.lastIndexOf('<!--', idx) > src.lastIndexOf('-->', idx);
  let at = -1;
  const tryRe = (re) => {
    const g = new RegExp(re.source, 'gi');
    let m;
    while ((m = g.exec(src))) { if (!insideComment(m.index)) { at = m.index + m[0].length; return true; } }
    return false;
  };
  if (!tryRe(/<head(?:\s[^>]*)?>/) && !tryRe(/<html(?:\s[^>]*)?>/) && !tryRe(/<!doctype[^>]*>/)) at = 0;
  const before = src.slice(0, at);
  const nl = before.lastIndexOf('\n');
  return {
    html: before + tag + src.slice(at),
    info: { line: before.split('\n').length, col: at - (nl + 1), len: tag.length },
  };
}

function injectConsoleCapture(html, script) { return injectConsoleCaptureInfo(html, script).html; }

// Mapea una posición reportada por la preview a la del código ORIGINAL: las
// líneas no cambian (el script va en la misma línea); en la línea de
// inserción, lo que quedó después del script se corrió `len` columnas.
function mapConsoleLocation(info, line, col) {
  if (!info || !line || line !== info.line || !col) return { line, col };
  return { line, col: col > info.col + info.len ? col - info.len : col };
}

// Mensaje de la consola desde la preview. Con previewUrl (dev server) se
// exige además el ORIGEN del proyecto; sin él (srcdoc anidado, origen opaco)
// alcanza con que la fuente sea el iframe de la preview.
function isTrustedConsoleMessage(ev, frameWindow, previewUrl) {
  if (!ev || !frameWindow || ev.source !== frameWindow) return false;
  const d = ev.data;
  if (!d || typeof d !== 'object' || d.type !== 'lpa:console') return false;
  if (previewUrl) {
    let origin;
    try { origin = new URL(previewUrl).origin; } catch (e) { return false; }
    if (!origin || origin === 'null' || ev.origin !== origin) return false;
  }
  return true;
}

const CONSOLE_LEVELS = ['log', 'info', 'warn', 'error', 'debug'];

// Sanea un mensaje crudo de la preview (viene de código generado por un
// modelo: nada se asume). Devuelve null si no es un mensaje de consola.
function normalizeConsoleEntry(d) {
  if (!d || typeof d !== 'object') return null;
  const str = (v, n) => (typeof v === 'string' ? v.slice(0, n) : '');
  const int = (v) => (Number.isFinite(v) && v > 0 ? Math.floor(v) : 0);
  const level = CONSOLE_LEVELS.indexOf(d.level) !== -1 ? d.level : (d.level === 'heartbeat' ? 'heartbeat' : null);
  if (!level) return null;
  return {
    level,
    message: str(d.message, 4096),
    source: str(d.source, 600),
    line: int(d.line),
    col: int(d.col),
    stack: str(d.stack, 4096),
    ts: Number.isFinite(d.ts) ? d.ts : Date.now(),
    kind: str(d.kind, 20),
    tag: str(d.tag, 20),
    empty: d.empty === true,
  };
}

// Mapea una URL/ruta de script del navegador a un archivo del proyecto
// (mejor esfuerzo): /src/App.jsx?t=123 (Vite), webpack-internal:///(app-pages-browser)/./app/page.jsx,
// webpack://_N_E/./app/page.jsx, /@fs/…/src/App.jsx, /_next/static/chunks/app/page.js.
function resolveConsoleSource(source, filePaths) {
  const paths = Array.from(filePaths || []);
  if (!source || !paths.length) return null;
  let s = String(source);
  if (/^webpack(?:-internal)?:\/\//i.test(s)) s = s.replace(/^webpack(?:-internal)?:\/\/+/i, '').replace(/^[^/]+\/\.\//, '');
  let pathname = s;
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) { try { pathname = new URL(s).pathname; } catch (e) { /* queda tal cual */ } }
  pathname = pathname.split('?')[0].split('#')[0];
  try { pathname = decodeURIComponent(pathname); } catch (e) { /* queda tal cual */ }
  pathname = pathname.replace(/^\/?_next\/static\/chunks\//, '').replace(/^(\.\/|\/)+/, '');
  const has = (p) => paths.indexOf(p) !== -1;
  const swapExt = (p) => {
    const m = p.match(/^(.*)\.(jsx?|tsx?|mjs|vue)$/i);
    if (!m) return [p];
    return [p].concat(['jsx', 'js', 'tsx', 'ts', 'mjs', 'vue'].filter((e) => e !== m[2].toLowerCase()).map((e) => `${m[1]}.${e}`));
  };
  const candidates = swapExt(pathname);
  for (const c of candidates) if (has(c)) return c;
  for (const c of candidates) {
    const hit = paths.find((p) => c.endsWith('/' + p) || p.endsWith('/' + c));
    if (hit) return hit;
  }
  const base = pathname.split('/').pop();
  if (base && /\.[a-z0-9]+$/i.test(base)) {
    const same = paths.filter((p) => swapExt(base).some((b) => p === b || p.endsWith('/' + b)));
    if (same.length === 1) return same[0];
  }
  return null;
}

// Rango [start, end) (índices de carácter) de la línea `line` (1-based).
function lineRangeOf(text, line) {
  const src = String(text || '');
  const lines = src.split('\n');
  const n = Math.min(Math.max(1, line | 0), lines.length);
  let start = 0;
  for (let i = 0; i < n - 1; i++) start += lines[i].length + 1;
  return { start, end: start + lines[n - 1].length, line: n };
}

// Fragmento numerado de ±radius líneas alrededor de `line`; marca la línea.
function extractCodeExcerpt(text, line, radius) {
  const lines = String(text || '').split('\n');
  if (!line || line < 1 || !lines.length) return '';
  const r = radius == null ? 8 : radius;
  const target = Math.min(line, lines.length);
  const from = Math.max(1, target - r);
  const to = Math.min(lines.length, target + r);
  const width = String(to).length;
  const out = [];
  for (let i = from; i <= to; i++) {
    out.push(`${i === target ? '>' : ' '} ${String(i).padStart(width)} | ${lines[i - 1].slice(0, 240)}`);
  }
  return out.join('\n');
}

function consoleCounts(entries) {
  const c = { error: 0, warn: 0, log: 0 };
  (entries || []).forEach((e) => {
    if (e.level === 'error') c.error++;
    else if (e.level === 'warn') c.warn++;
    else if (CONSOLE_LEVELS.indexOf(e.level) !== -1) c.log++;
  });
  return c;
}

function formatConsoleClock(ts) {
  const d = new Date(ts);
  const p = (n, w) => String(n).padStart(w || 2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

// Agrupa mensajes repetidos (mismo nivel, texto y ubicación) dentro de cada
// ejecución (los separadores cortan el grupo): devuelve [{ entry, last, count }]
// en orden de primera aparición; `last` es la última repetición (hora).
function groupConsoleEntries(entries) {
  const out = [];
  let index = new Map();
  (entries || []).forEach((e) => {
    if (e.level === 'separator') { out.push({ entry: e, last: e, count: 1 }); index = new Map(); return; }
    const k = [e.level, e.message, e.source || '', e.line || 0, e.col || 0].join('\u0001');
    const g = index.get(k);
    if (g) { g.count += 1; g.last = e; return; }
    const ng = { entry: e, last: e, count: 1 };
    index.set(k, ng);
    out.push(ng);
  });
  return out;
}

// Búsqueda de texto libre (sin distinguir mayúsculas) en mensaje, origen y stack.
function consoleMatchesSearch(e, query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return true;
  if (e.level === 'separator') return false;
  return [e.message, e.source, e.stack].some((t) => typeof t === 'string' && t.toLowerCase().indexOf(q) !== -1);
}

// Nivel de una línea de salida del dev server (texto plano, sin ANSI).
function classifyServerLine(text, stream) {
  const t = String(text || '');
  if (/\b(error|err!|failed|exception|cannot find|unresolved)\b|✘|\[vite\] .*server error/i.test(t)) return 'error';
  if (/\bwarn(ing)?\b/i.test(t)) return 'warn';
  return stream === 'system' ? 'info' : 'log';
}

// Quita secuencias ANSI (colores) de un texto.
function stripConsoleAnsi(s) {
  return String(s == null ? '' : s).replace(/\u001b\[[0-9;?]*[ -/]*[@-~]/g, '');
}

function formatConsoleEntryText(e, where) {
  if (e.level === 'separator') return e.message || '— nueva ejecución —';
  const loc = where || (e.line ? `${e.source || 'código'}:${e.line}${e.col ? ':' + e.col : ''}` : e.source);
  return `[${formatConsoleClock(e.ts)}] ${String(e.level).toUpperCase()} ${e.message}${loc ? ` (${loc})` : ''}${e.stack ? '\n' + e.stack.split('\n').map((l) => '    ' + l.trim()).join('\n') : ''}`;
}

// Instrucción para el flujo de edición con IA. items = [{ entry, where, file, line, excerpt }].
function buildConsoleFixInstruction(items) {
  const list = (items || []).filter((it) => it && it.entry);
  if (!list.length) return '';
  const one = list.length === 1;
  const out = [`Corregí ${one ? 'el error' : `los ${list.length} errores`} que tiró la página al ejecutarse en el navegador (Consola). Hacé el cambio mínimo necesario y no toques nada que no esté relacionado.`];
  list.forEach((it, i) => {
    const e = it.entry;
    out.push('');
    out.push(`${one ? 'Error' : `Error ${i + 1}`} (${e.level}): ${e.message}`);
    const loc = it.where || (e.line ? `${e.source || 'código'}:${e.line}${e.col ? ':' + e.col : ''}` : e.source);
    if (loc) out.push(`Ubicación: ${loc}${it.file && loc.indexOf(it.file) === -1 ? ` (archivo ${it.file})` : ''}`);
    if (e.stack) out.push(`Stack:\n${e.stack.split('\n').slice(0, 4).map((l) => '  ' + l.trim().slice(0, 200)).join('\n')}`);
    if (it.excerpt) out.push(`Código alrededor de la línea ${it.line}${it.file ? ` de ${it.file}` : ''} (> marca la línea):\n${it.excerpt}`);
  });
  return out.join('\n');
}

/* =========================================================================
 * 7. ALMACENAMIENTO (localStorage envuelto en try/catch)
 * ========================================================================= */

const BANK_KEY = 'lpa_bank_v1'; // legado: el Banco ahora vive en disco (banco/<id>/, ver server.js /api/banco). Esta clave sólo se usa como respaldo de sólo lectura cuando no hay servidor (file://) y como origen para la migración a disco.
const BANK_MIGRATED_KEY = 'lpa_bank_migrated_v1';
const PROVIDER_KEY = 'lpa_provider_v1';

function safeGetItem(key) {
  try { return (typeof localStorage !== 'undefined') ? localStorage.getItem(key) : null; }
  catch (e) { return null; }
}
function safeSetItem(key, value) {
  try { if (typeof localStorage === 'undefined') return false; localStorage.setItem(key, value); return true; }
  catch (e) { return false; }
}
function safeRemoveItem(key) {
  try { if (typeof localStorage !== 'undefined') localStorage.removeItem(key); } catch (e) { /* no-op */ }
}

function loadBank() {
  const raw = safeGetItem(BANK_KEY);
  if (!raw) return [];
  try { const parsed = JSON.parse(raw); return Array.isArray(parsed) ? parsed : []; }
  catch (e) { return []; }
}

function persistBank(bank) {
  const ok = safeSetItem(BANK_KEY, JSON.stringify(bank));
  if (!ok) {
    return { ok: false, message: 'No se pudo guardar: se alcanzó el límite de almacenamiento del navegador. Eliminá alguna landing guardada e intentá de nuevo.' };
  }
  return { ok: true };
}

function loadProviderConfig() {
  const raw = safeGetItem(PROVIDER_KEY);
  const fallback = { type: 'anthropic', apiKey: '', model: 'claude-sonnet-5', baseUrl: '', maxTokens: 16000 };
  if (!raw) return fallback;
  try { return Object.assign(fallback, JSON.parse(raw)); } catch (e) { return fallback; }
}
function persistProviderConfig(cfg) { safeSetItem(PROVIDER_KEY, JSON.stringify(cfg)); }

// Crítico (técnica 3): proveedor propio opcional. `useSame` (por defecto true)
// hace que la auditoría use el mismo proveedor que el generador.
const CRITIC_PROVIDER_KEY = 'lpa_critic_provider_v1';
function loadCriticProviderConfig() {
  const fallback = { useSame: true, type: 'anthropic', apiKey: '', model: 'claude-sonnet-5', baseUrl: '', maxTokens: 16000 };
  const raw = safeGetItem(CRITIC_PROVIDER_KEY);
  if (!raw) return fallback;
  try { return Object.assign(fallback, JSON.parse(raw)); } catch (e) { return fallback; }
}
function persistCriticProviderConfig(cfg) { safeSetItem(CRITIC_PROVIDER_KEY, JSON.stringify(cfg)); }
// Devuelve el proveedor efectivo para un rol ('critic' usa el propio si !useSame).
function resolveProviderForRole(role, generator, critic) {
  if (role === 'critic' && critic && critic.useSame === false && critic.type) return critic;
  return generator;
}
// El proveedor está listo para usarse (mínimo para intentar una llamada).
function isProviderConfigured(p) {
  if (!p || !p.type) return false;
  if (p.type === 'anthropic') return !!(p.apiKey && p.apiKey.trim());
  if (p.type === 'opencode-local') return !!p.model;
  return !!(p.baseUrl && p.model);
}

// Preferencias de multimedia (Configuración): sólo se guardan las elegidas
// explícitamente; sin elección, el servidor usa su orden por defecto.
const MEDIA_PREFS_KEY = 'lpa_media_prefs_v1';
const MEDIA_PREF_OPTIONS = {
  images: [['cloudflare', 'Cloudflare FLUX (recomendado)'], ['pollinations', 'Pollinations'], ['none', 'Desactivado']],
  stock: [['pexels', 'Pexels (recomendado)'], ['pixabay', 'Pixabay'], ['none', 'Desactivado']],
  vision: [['gemini', 'Gemini'], ['openai-compatible', 'Compatible con OpenAI (DeepSeek u otro)'], ['anthropic', 'Anthropic'], ['none', 'Solo paleta local']],
  video: [['generated', 'Generado (fotogramas IA + ffmpeg) (recomendado)'], ['stock', 'Stock (Pexels/Pixabay)'], ['none', 'Desactivado']],
};
function loadMediaPrefs() {
  const raw = safeGetItem(MEDIA_PREFS_KEY);
  const out = {};
  if (!raw) return out;
  try {
    const parsed = JSON.parse(raw) || {};
    Object.keys(MEDIA_PREF_OPTIONS).forEach((k) => {
      if (MEDIA_PREF_OPTIONS[k].some((o) => o[0] === parsed[k])) out[k] = parsed[k];
    });
    const vc = normalizeVisionCfg(parsed.visionCfg);
    if (vc) out.visionCfg = vc;
  } catch (e) { /* preferencias corruptas: se ignoran */ }
  return out;
}

/* Visión con IA elegible (Configuración). visionCfg = { useGenerator?, baseUrl, apiKey, model }
 * vive en el mismo localStorage de las preferencias (como la clave del generador):
 * nunca se guarda en el servidor. `useGenerator` ausente = automático (se usan las
 * credenciales del generador si su tipo coincide). */
const VISION_DEFAULT_MODELS = { 'openai-compatible': 'deepseek-flash', anthropic: 'claude-sonnet-5' };
function normalizeVisionCfg(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  const out = { baseUrl: str(raw.baseUrl, 300), apiKey: str(raw.apiKey, 400), model: str(raw.model, 120) };
  if (typeof raw.useGenerator === 'boolean') out.useGenerator = raw.useGenerator;
  return out;
}
// Resuelve qué proveedor de visión usar. -> { kind, label, ready, reason?, vision? }
//  ready: true/false para openai-compatible/anthropic; null para gemini (depende de /api/media/status).
function resolveVisionConfig(prefs, provider) {
  const p = prefs || {};
  const kind = p.vision || 'gemini';
  if (kind === 'none') return { kind, label: 'solo paleta local', ready: false };
  if (kind === 'gemini') return { kind, label: 'Gemini', ready: null, vision: { kind: 'gemini' } };
  const gen = provider || {};
  const own = p.visionCfg || {};
  const matches = gen.type === kind;
  const useGen = typeof own.useGenerator === 'boolean' ? own.useGenerator : matches;
  const src = useGen ? (matches ? gen : {}) : own;
  const baseUrl = kind === 'anthropic' ? '' : String(src.baseUrl || '').trim();
  const apiKey = String(src.apiKey || '').trim();
  const model = String(own.model || '').trim() || VISION_DEFAULT_MODELS[kind];
  const human = kind === 'anthropic' ? 'Anthropic' : (/deepseek/i.test(baseUrl) ? 'DeepSeek' : 'el proveedor compatible con OpenAI');
  const label = `${human} (${model})`;
  let reason = '';
  if (useGen && !matches) reason = `el generador no es ${kind === 'anthropic' ? 'Anthropic' : 'compatible con OpenAI'}: cargá credenciales propias para la visión en Configuración`;
  else if (kind !== 'anthropic' && !baseUrl) reason = 'falta la URL base del proveedor de visión en Configuración';
  else if (!apiKey) reason = `falta la clave de API de ${human} para la visión en Configuración`;
  if (reason) return { kind, label, human, ready: false, reason: `Visión con ${human}: ${reason}` };
  // El razonamiento del generador también aplica a la visión (DeepSeek): analizar colores y espacio libre casi no se beneficia de razonar.
  const reasoning = (useGen && kind === 'openai-compatible' && src.reasoning) ? src.reasoning : undefined;
  return { kind, label, human, ready: true, vision: { kind, baseUrl: baseUrl || undefined, apiKey, model, reasoning } };
}
// Agrega `vision` (proveedor elegido) al cuerpo de /api/media/describe.
function applyVisionConfig(body, cfg) {
  const b = Object.assign({}, body);
  if (cfg && cfg.ready !== false && cfg.vision && b.vision === undefined) b.vision = cfg.vision;
  return b;
}
// ¿Se puede usar visión con IA? `c.vision` (resolveVisionConfig) es opcional: sin él rige Gemini.
function visionGate(status, c) {
  const v = c && c.vision;
  const st = status || {};
  if (!v || v.kind === 'gemini') return { on: !!st.gemini, name: 'Gemini', reason: '' };
  if (v.kind === 'none') return { on: false, name: 'la visión con IA', reason: '' };
  return { on: !!v.ready, name: v.human || v.label, reason: v.reason || '' };
}
function saveMediaPrefs(prefs) { safeSetItem(MEDIA_PREFS_KEY, JSON.stringify(prefs || {})); }

// Claves de servicios de multimedia (Configuración): sólo en este navegador,
// mismo modelo de confianza que las claves de los LLM. Viajan por pedido en
// body.keys; el servidor cae al .env si falta alguna.
const MEDIA_KEYS_KEY = 'lpa_media_keys_v1';
const MEDIA_KEY_FIELDS = ['pexels', 'pixabay', 'cloudflareAccountId', 'cloudflareToken', 'gemini', 'pollinations'];
function normalizeMediaKeys(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object') return out;
  MEDIA_KEY_FIELDS.forEach((k) => {
    const v = typeof raw[k] === 'string' ? raw[k].trim() : '';
    if (v && v.length <= 512 && !/[\u0000-\u001f\u007f]/.test(v)) out[k] = v;
  });
  return out;
}
function loadMediaKeys() {
  const raw = safeGetItem(MEDIA_KEYS_KEY);
  if (!raw) return {};
  try { return normalizeMediaKeys(JSON.parse(raw)); } catch (e) { return {}; }
}
function saveMediaKeys(keys) {
  const clean = normalizeMediaKeys(keys);
  if (!Object.keys(clean).length) { safeRemoveItem(MEDIA_KEYS_KEY); return clean; }
  safeSetItem(MEDIA_KEYS_KEY, JSON.stringify(clean));
  return clean;
}
// Agrega `keys` (sólo las no vacías) al cuerpo del pedido; sin claves no agrega nada.
function attachMediaKeys(body, keys) {
  const b = Object.assign({}, body);
  const k = normalizeMediaKeys(keys);
  if (Object.keys(k).length) b.keys = k;
  return b;
}
// Une el estado del servidor (.env) con las claves locales. Cada servicio:
// source 'browser' | 'server' | 'none'. No expone valores.
function mergeMediaStatus(server, keys) {
  const s = Object.assign({}, server || {});
  const k = normalizeMediaKeys(keys);
  const local = {
    pexels: !!k.pexels, pixabay: !!k.pixabay, cloudflare: !!(k.cloudflareAccountId && k.cloudflareToken),
    gemini: !!k.gemini, pollinations: !!k.pollinations,
  };
  const sources = {};
  ['pexels', 'pixabay', 'cloudflare', 'gemini'].forEach((n) => {
    sources[n] = local[n] ? 'browser' : (s[n] ? 'server' : 'none');
    s[n] = !!(s[n] || local[n]);
  });
  sources.pollinations = local.pollinations ? 'browser' : 'none';
  s.sources = sources;
  return s;
}
// Agrega `provider` al cuerpo del pedido si el usuario eligió algo (kind: images|stock|vision).
function applyMediaPref(body, kind, prefs) {
  const b = Object.assign({}, body);
  if (b.provider === undefined && prefs && prefs[kind]) b.provider = prefs[kind];
  return b;
}

/* ---------- Borradores (Generador y Estudio): edición protegida (Feature 3) ----------
 * Dos almacenes separados en localStorage, cada uno acotado en cantidad de
 * entradas (LRU por `updatedAt`) para no competir por la cuota con el Banco:
 *   - lpa_prompt_draft_v1: borrador del prompt editado a mano en el
 *     Generador, agrupado por un hash del contexto (proyecto + verticales +
 *     tecnologías) y, dentro de cada contexto, por pestaña (tabKey).
 *   - lpa_studio_draft_v1: borrador del código editado a mano en el Estudio,
 *     indexado por id de ejecución/Banco (sólo el último por id).
 */
const PROMPT_DRAFT_KEY = 'lpa_prompt_draft_v1';
const PROMPT_DRAFT_CAP = 10;
const STUDIO_DRAFT_KEY = 'lpa_studio_draft_v1';
const STUDIO_DRAFT_CAP = 5;

// Contador monotónico para desempatar el orden LRU cuando dos borradores se
// guardan dentro del mismo milisegundo (Date.now() no alcanza para eso):
// `seq` crece siempre, a diferencia de `updatedAt`, que sólo se guarda para
// referencia/depuración.
let draftSeqCounter = 0;

// Hash determinístico (no criptográfico, reutiliza el FNV de rollingHash con
// una sal fija para no colisionar con los usos de semilla creativa) para
// scopear el borrador del prompt al contexto exacto que lo generó.
function computePromptDraftContextKey(project, verticals, technologies, techniques) {
  const base = {
    project: project || {},
    verticals: (verticals || []).slice().sort(),
    technologies: (technologies || []).slice().sort(),
  };
  // Las técnicas cambian la forma del prompt: forman parte del contexto del borrador.
  if (techniques !== undefined && techniques !== null) base.techniques = normalizeTechniques(techniques);
  const payload = JSON.stringify(base);
  return rollingHash(payload, 911).toString(36);
}

function loadDraftStore(key) {
  const raw = safeGetItem(key);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : {};
  } catch (e) { return {}; }
}

function persistDraftStore(key, store, cap) {
  const capped = Object.entries(store)
    .sort((a, b) => (b[1].seq || 0) - (a[1].seq || 0))
    .slice(0, cap)
    .reduce((acc, [k, v]) => { acc[k] = v; return acc; }, {});
  safeSetItem(key, JSON.stringify(capped));
  return capped;
}

function savePromptDraft(contextKey, tab, text) {
  if (!contextKey || !tab) return;
  const store = loadDraftStore(PROMPT_DRAFT_KEY);
  const ctx = store[contextKey] || { tabs: {}, updatedAt: 0 };
  ctx.tabs[tab] = text;
  ctx.updatedAt = Date.now();
  ctx.seq = ++draftSeqCounter;
  store[contextKey] = ctx;
  persistDraftStore(PROMPT_DRAFT_KEY, store, PROMPT_DRAFT_CAP);
}

function loadPromptDraft(contextKey, tab) {
  if (!contextKey || !tab) return null;
  const store = loadDraftStore(PROMPT_DRAFT_KEY);
  const ctx = store[contextKey];
  if (!ctx || !ctx.tabs || !Object.prototype.hasOwnProperty.call(ctx.tabs, tab)) return null;
  return ctx.tabs[tab];
}

// Sin `tab`, borra el contexto completo (todas las pestañas): se usa al
// guardar en el Banco, donde el borrador ya cumplió su función.
function clearPromptDraft(contextKey, tab) {
  if (!contextKey) return;
  const store = loadDraftStore(PROMPT_DRAFT_KEY);
  const ctx = store[contextKey];
  if (!ctx) return;
  if (tab) {
    delete ctx.tabs[tab];
    if (!Object.keys(ctx.tabs).length) delete store[contextKey];
  } else {
    delete store[contextKey];
  }
  persistDraftStore(PROMPT_DRAFT_KEY, store, PROMPT_DRAFT_CAP);
}

function saveStudioDraft(id, html) {
  if (!id) return;
  const store = loadDraftStore(STUDIO_DRAFT_KEY);
  store[id] = { html, updatedAt: Date.now(), seq: ++draftSeqCounter };
  persistDraftStore(STUDIO_DRAFT_KEY, store, STUDIO_DRAFT_CAP);
}

function loadStudioDraft(id) {
  if (!id) return null;
  const store = loadDraftStore(STUDIO_DRAFT_KEY);
  return store[id] || null;
}

function clearStudioDraft(id) {
  if (!id) return;
  const store = loadDraftStore(STUDIO_DRAFT_KEY);
  if (!store[id]) return;
  delete store[id];
  persistDraftStore(STUDIO_DRAFT_KEY, store, STUDIO_DRAFT_CAP);
}

// Comparación pura de "sucio" (usada tanto por el Estudio como por tests):
// true cuando el HTML actual del editor difiere del último baseline
// guardado (última versión guardada, o el HTML recién generado/cargado).
function isHtmlDirty(currentHtml, baselineHtml) {
  return typeof currentHtml === 'string' && currentHtml !== baselineHtml;
}

function saveLanding(entry) {
  const bank = loadBank();
  const record = {
    id: entry.id || (Date.now().toString(36) + Math.random().toString(36).slice(2, 8)),
    proyecto: entry.proyecto,
    verticals: entry.verticals || [],
    customVertical: entry.customVertical || '',
    technologies: entry.technologies || [],
    fecha: entry.fecha || new Date().toISOString(),
    prompt: entry.prompt || '',
    html: entry.html || '',
    versions: (entry.versions || []).slice(0, 10), // tope: respeta cuota de localStorage (Estudio, Feature 2)
  };
  bank.unshift(record);
  const result = persistBank(bank);
  if (!result.ok) return result;
  return { ok: true, record, bank };
}

function duplicateLanding(id) {
  const bank = loadBank();
  const original = bank.find((b) => b.id === id);
  if (!original) return { ok: false, message: 'No se encontró la landing a duplicar.' };
  const copy = Object.assign({}, original, {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    proyecto: `${original.proyecto} (copia)`,
    fecha: new Date().toISOString(),
  });
  bank.unshift(copy);
  const result = persistBank(bank);
  if (!result.ok) return result;
  return { ok: true, record: copy, bank };
}

function deleteLanding(id) {
  const bank = loadBank().filter((b) => b.id !== id);
  const result = persistBank(bank);
  if (!result.ok) return result;
  return { ok: true, bank };
}

/* =========================================================================
 * 8. RENDERIZADO DEL BANCO (no-op fuera del navegador)
 * ========================================================================= */

// Normaliza dos formas de entrada posibles a una única forma de vista:
//   - Entrada "servidor" (GET /api/banco, banco/<id>/ en disco): trae
//     `folder` ("banco/<id>"), `tema` (string) y NO trae `html`/`prompt`
//     completos (se cargan al vuelo con handlers.onLoadPrompt y la miniatura
//     apunta a /banco/<id>/index.html vía iframe `src`).
//   - Entrada "legado" (localStorage 'lpa_bank_v1', sólo lectura sin
//     servidor): trae `proyecto` (string, es el tema), `html` y `prompt`
//     completos inline; la miniatura usa `srcdoc`.
function normalizeBankEntry(entry) {
  if (entry && entry.folder) {
    return {
      title: entry.tema || 'Proyecto sin nombre',
      verticals: entry.verticals || [],
      customVertical: entry.customVertical || '',
      technologies: entry.technologies || [],
      date: entry.createdAt || entry.updatedAt || new Date().toISOString(),
      promptPreview: null,
      thumbSrc: `/${entry.folder}/index.html`,
      thumbHtml: null,
      folderPath: entry.folder,
      ssotSeed: entry.ssotSeed || '',
    };
  }
  return {
    title: (entry && entry.proyecto) || 'Proyecto sin nombre',
    verticals: (entry && entry.verticals) || [],
    customVertical: (entry && entry.customVertical) || '',
    technologies: (entry && entry.technologies) || [],
    date: (entry && entry.fecha) || new Date().toISOString(),
    promptPreview: (entry && entry.prompt) || '',
    thumbSrc: null,
    thumbHtml: (entry && entry.html) || '',
    folderPath: null,
    ssotSeed: '',
  };
}

function renderBank(bank, container, handlers) {
  if (typeof document === 'undefined') return;
  const list = bank || loadBank();
  const el = container || document.getElementById('bank-grid');
  const emptyEl = document.getElementById('bank-empty');
  if (!el) return;
  el.textContent = '';
  if (emptyEl) emptyEl.hidden = list.length > 0;
  const fmt = new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' });

  list.forEach((entry) => {
    const vm = normalizeBankEntry(entry);
    const card = document.createElement('article');
    card.className = 'bank-card';

    const thumbWrap = document.createElement('div');
    thumbWrap.className = 'bank-card__thumb';
    const thumbFrame = document.createElement('iframe');
    thumbFrame.setAttribute('sandbox', 'allow-scripts');
    thumbFrame.setAttribute('title', `Miniatura de ${vm.title}`);
    thumbFrame.setAttribute('tabindex', '-1');
    thumbFrame.setAttribute('loading', 'lazy');
    if (vm.thumbSrc) thumbFrame.setAttribute('src', vm.thumbSrc);
    else thumbFrame.srcdoc = vm.thumbHtml || '<p>Sin contenido</p>';
    thumbWrap.appendChild(thumbFrame);
    card.appendChild(thumbWrap);

    const body = document.createElement('div');
    body.className = 'bank-card__body';

    const title = document.createElement('h3');
    title.className = 'bank-card__title';
    title.textContent = vm.title;
    body.appendChild(title);

    const meta = document.createElement('p');
    meta.className = 'bank-card__meta';
    const verticalLabels = vm.verticals.map((v) => (VERTICALS[v] ? VERTICALS[v].label : v));
    if (vm.customVertical) verticalLabels.push(vm.customVertical);
    const techLabels = vm.technologies.map((t) => (TECHNOLOGIES[t] ? TECHNOLOGIES[t].label : t));
    meta.textContent = `${verticalLabels.join(', ') || 'sin vertical'} · ${techLabels.join(' + ') || 'sin tecnología'} · ${fmt.format(new Date(vm.date))}`;
    body.appendChild(meta);

    if (vm.ssotSeed) {
      body.appendChild(buildSeedView(vm.ssotSeed, {
        label: 'Semilla:',
        className: 'bank-card__seed',
        onCopy: handlers && handlers.onCopySeed ? (seed) => handlers.onCopySeed(seed) : null,
        onUse: handlers && handlers.onUseSeed ? (seed) => handlers.onUseSeed(seed) : null,
      }));
    }

    if (vm.folderPath) {
      const pathEl = document.createElement('p');
      pathEl.className = 'bank-card__path';
      pathEl.textContent = vm.folderPath;
      body.appendChild(pathEl);
    }

    const details = document.createElement('details');
    details.className = 'bank-card__prompt';
    const summary = document.createElement('summary');
    summary.textContent = 'Prompt asociado';
    const pre = document.createElement('pre');
    pre.textContent = vm.promptPreview == null ? 'Cargando…' : vm.promptPreview;
    details.appendChild(summary);
    details.appendChild(pre);
    if (vm.promptPreview == null && handlers && handlers.onLoadPrompt) {
      let loaded = false;
      details.addEventListener('toggle', () => {
        if (!details.open || loaded) return;
        loaded = true;
        Promise.resolve(handlers.onLoadPrompt(entry))
          .then((text) => { pre.textContent = text || '(sin prompt)'; })
          .catch(() => { pre.textContent = 'No se pudo cargar el prompt.'; });
      });
    }
    body.appendChild(details);

    const actions = document.createElement('div');
    actions.className = 'bank-card__actions';

    const makeBtn = (text, cls, onClick) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `btn ${cls || 'btn--secondary'}`;
      btn.textContent = text;
      btn.addEventListener('click', () => onClick(entry));
      return btn;
    };

    if (handlers && handlers.onOpen) actions.appendChild(makeBtn('Abrir', 'btn--secondary', handlers.onOpen));
    if (handlers && handlers.onEdit) actions.appendChild(makeBtn('Editar', 'btn--secondary', handlers.onEdit));
    if (handlers && handlers.onRerun) actions.appendChild(makeBtn('Ejecutar nuevamente', 'btn--secondary', handlers.onRerun));
    if (handlers && handlers.onCopyPrompt) actions.appendChild(makeBtn('Copiar prompt', 'btn--secondary', handlers.onCopyPrompt));
    if (handlers && handlers.onDuplicate) actions.appendChild(makeBtn('Duplicar', 'btn--secondary', handlers.onDuplicate));
    if (vm.folderPath) {
      const openLink = document.createElement('a');
      openLink.className = 'btn btn--secondary';
      openLink.href = vm.thumbSrc;
      openLink.target = '_blank';
      openLink.rel = 'noopener';
      openLink.textContent = 'Abrir en pestaña nueva';
      actions.appendChild(openLink);
    }
    if (handlers && handlers.onDelete) actions.appendChild(makeBtn('Eliminar', 'btn--danger', handlers.onDelete));

    body.appendChild(actions);
    card.appendChild(body);
    el.appendChild(card);
  });
}

/* =========================================================================
 * 9. EXPORTACIÓN PARA NODE (verificación sin DOM)
 * ========================================================================= */

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    VERTICALS, TECHNOLOGIES, BANNED_WORDS, SECTION_LABELS,
    EXAMPLE_PROJECT, EXAMPLE_VERTICALS, EXAMPLE_TECHNOLOGIES,
    generateSeed, pickIndex, rollingHash,
    generateSsotSeed, isValidSsotSeed, normalizeSsotSeedInput, validateSsotSeedInput, formatSeedGroups, shortSeed,
    loadSsotSeed, saveSsotSeed, SSOT_SEED_STORAGE_KEY, derivePalette, describePalette, contrastRatio, hslToHex, PALETTE_SCHEMES, paletteHexesOf,
    synthesizeVerticals, buildVerticalContextData, withCustomVertical, cleanCustomVertical, customVerticalInstruction, CUSTOM_VERTICAL_MAX, buildCreativeDirection, buildPageArchitecture,
    resolveTechConflicts,
    buildTechnologyPrompt, combineTechnologyPrompts, generatePrompt, generateTemplatePrompt,
    extractHtml, extractPlainText, runPrompt, createSseParser, createStreamAccumulator, partialPreviewHtml, shouldStreamTick, parseStreamFileList, formatStreamStatus, STREAM_TICK_MS, extractMessageText, buildProviderRequest, runOpencodeLocal,
    loadBank, persistBank, saveLanding, duplicateLanding, deleteLanding,
    loadProviderConfig, persistProviderConfig,
    loadCriticProviderConfig, persistCriticProviderConfig, resolveProviderForRole, isProviderConfigured,
    loadMediaPrefs, saveMediaPrefs, applyMediaPref, MEDIA_PREF_OPTIONS,
    loadMediaKeys, saveMediaKeys, attachMediaKeys, mergeMediaStatus, normalizeMediaKeys, MEDIA_KEYS_KEY,
    resolveVisionConfig, applyVisionConfig, visionGate, normalizeVisionCfg,
    renderBank, normalizeBankEntry,
    buildSetupFillPrompt, parseSetupFillResponse, truncateDescripcion, briefLines,
    computePromptDraftContextKey, savePromptDraft, loadPromptDraft, clearPromptDraft,
    saveStudioDraft, loadStudioDraft, clearStudioDraft, isHtmlDirty,
    PROMPT_HEADINGS, buildMetaPrompt, buildRepairPrompt, validateGeneratedPrompt, extractPromptSections,
    TECHNIQUES, ALL_TECHNIQUE_IDS, normalizeTechniques, hasTechnique, getHeadings, describeTechniques,
    deriveDeterministicSeed, makeTechniqueSeed, buildSynergyRules, loadTechniquesSetting, saveTechniquesSetting,
    emptyAssets, normalizeAssets, hasAssetsContent, collectAssets, buildRecursosVisualesBlock,
    describeMediaBackends, emptyPregen, normalizePregen, loadPregen, savePregen, activePregen, pregenToAsset, generateImageItem, generateFramesVideo, buildSuggestSearchPrompt, isDescribableRemote, searchStockVideos, analyzeGeneratedTargets, PREGEN_KEY, PREGEN_MAX_ITEMS,
    absoluteMediaUrl, parseJsonLoose, buildSearchQueriesPrompt, parseSearchQueries, buildImagePromptsPrompt, parseImagePrompts,
    normalizeLayoutAnalysis, parseLayoutAnalysis, analyzeLayoutGrid, buildShotListPrompt, parseShotList, pickHeroGenerated,
    validateAssetCoherence, buildGeneratedReferenceLines, validateSectionOrder, validatePromptLength, collectSoftViolations,
    buildLengthBudgetLines, PROMPT_LENGTH_BUDGETS, MAX_MEDIA_ANALYSES, extractSectionSequence,
    medianCutPalette, mergePalettes, buildReferenceNotes, listAssetEntries, assetUsage, usageNeedsFix,
    buildMissingAssetsInstruction, removeAssetFromText, removeAssetFromAssets, normalizeMedia, loadMediaSetting, saveMediaSetting, sanitizeMediaItem, MEDIA_ROLES,
    getSectionBody, enforceSalidaFinal,
    CRITIC_MAX_ROUNDS, parseSuggestionList,
    compactHtmlForReview, buildCriticAuditPrompt, parseCriticItems, buildCriticApplyInstruction,
    buildHumanRewritePrompt, countHtmlTags, verifyRewriteStructure,
    buildEditPrompt, diffLines, locateInSource, injectInspector,
    buildConsoleScript, injectConsoleCapture, injectConsoleCaptureInfo, mapConsoleLocation, isTrustedConsoleMessage, normalizeConsoleEntry,
    resolveConsoleSource, lineRangeOf, extractCodeExcerpt, consoleCounts, formatConsoleEntryText, buildConsoleFixInstruction,
    formatConsoleClock, groupConsoleEntries, consoleMatchesSearch, classifyServerLine, stripConsoleAnsi,
    PROJECT_VIEW_MAX_CHARS, PROJECT_ALLOWED_DEPS, PROJECT_VERSION_CAP, projectFilePriority, buildProjectView, projectViewBlockedPaths,
    scanProjectImports, validateProjectEditPath, validateProjectImports, parseProjectEditResponse, diffProjectChanges, putProjectFiles,
    buildProjectEditPrompt, projectImportLines, countProjectTags, projectClassValues, verifyProjectRewriteFile, filterProjectRewrite,
    buildProjectRewritePrompt, isTrustedInspectMessage, normalizeInspectPayload, locateInProject, pushProjectVersion, diffProjectSnapshot,
    DESIGN_AXES, SSOT_TOKEN, substituteSeedToken, forceInsertSSoTToken,
    frameworkFromTechKeys, frameworkFromLabels, parseProjectFiles, looksLikeProjectFiles,
    extractProjectFilesText, normalizeProjectFilesText, promptWantsProjectFiles, detectProjectTechnology,
    techBlockers, sanitizeTechSelection, reasoningParams, buildSeedView, groupSeed,
    INTERACTION_PARADIGMS, parseConcepts, buildFallbackConcept, resolveConcepts, normalizeConcept,
    buildConceptIdeationPrompt, buildConceptoRectorBlock, conceptTechLine, deriveCreativeDirection,
    CONCEPT_PICK_KEY, emptyConceptPick, normalizeConceptPick, loadConceptPick, saveConceptPick, chosenConceptOf, conceptPickIsStale, conceptBriefOf,
  };
}

/* =========================================================================
 * 10. BOOTSTRAP DE INTERFAZ (solo en navegador)
 * ========================================================================= */

if (typeof document !== 'undefined') {
  (function initApp() {
    const state = {
      step: 'setup',
      project: {},
      verticals: [],
      customVertical: '',        // rubro libre ("Otro…"), texto crudo del input
      customVerticalOn: false,   // chip "Otro…" seleccionado
      technologies: [],
      techniques: loadTechniquesSetting(), // técnicas activas (Fase C): persistidas en localStorage
      ssotSeed: loadSsotSeed(),  // cadena semilla SSoT (hex): visible, editable y persistida ('lpa_ssot_seed_v1')
      media: loadMediaSetting(), // Fase D: { references: [], required: [] } subidas al servidor (media/)
      mediaBusy: 0,              // subidas en curso (bloquea continuar mientras haya alguna)
      assetsCache: {},           // clave de contexto -> recursos reunidos (se reusan entre pestañas)
      describeCache: {},         // referencia(s) -> descripción de Gemini
      conceptPick: loadConceptPick(), // concepto rector elegido en el paso 2 ('lpa_concept_pick_v1')
      pregen: loadPregen(),      // imágenes/video generados (o elegidos) en el paso 2, ANTES del prompt ('lpa_pregen_v1')
      genEpoch: 0,               // +1 en cada "Generar Prompt": invalida assetsCache
      resetEpoch: 0,             // +1 en cada "Limpiar todo": descarta resultados de generaciones que seguían en curso
      genTechniques: null,      // snapshot de state.techniques al pulsar "Generar Prompt"
      postExec: null,           // estado de las pasadas posteriores a la ejecución (técnicas 3 y 8)
      templateGeneration: null, // generatePrompt(...) de plantilla: base para Dirección creativa y respaldo
      modelPrompts: {},         // tabKey -> { status:'loading'|'done', source:'model'|'template', text, ... }
      activeTab: null,
      edits: {},
      provider: loadProviderConfig(),
      criticProvider: loadCriticProviderConfig(),
      mediaPrefs: loadMediaPrefs(),
      bank: [], // se carga async al iniciar (ver renderBankView): server (disco) o legado (localStorage) según disponibilidad
      execution: null,
      openedFromBank: null,
      pendingVersions: null,    // versiones a restaurar al abrir/editar una landing del Banco
      editor: null,             // wrapper de createEditor()
      versions: [],
      inspecting: false,
      inspectedElement: null,
      aiEditCandidate: null,
      previewDebounceTimer: null,
      studioBaseline: null,      // último HTML "guardado" (versión guardada o generado): referencia para detectar Estudio sucio
      draftNoticeTab: null,      // tabKey cuyo prompt-textarea muestra el aviso "se restauró tu borrador"
      promptEditDebounceTimer: null,
      studioDraftDebounceTimer: null,
      studioView: 'preview',     // "preview" | "code": qué panel del Estudio se ve cuando no está Dividido
      consoleModal: {            // modal flotante de la Consola (Navegador / Servidor)
        open: false, view: 'browser', search: '', autoScroll: true, rect: null, lastFocus: null,
        pollTimer: null, polling: false, pollMs: 1000, pulseTimer: null,
      },
      consoleLog: {              // Consola del Estudio (errores/logs de la preview)
        entries: [], filter: 'all', run: '', inst: null, awaiting: false, inject: null,
        empty: false, lastHint: '', renderTimer: null, seq: 0, runSeq: 0,
      },
      splitMode: false,          // Dividir: ambos paneles lado a lado
      studioSplitRatio: 50,      // % de ancho del panel de código en modo Dividir
      studioHeightPx: null,      // altura actual del Estudio en px (persistida)
    };

    const VERTICAL_KEYS = Object.keys(VERTICALS);
    const TECH_KEYS = Object.keys(TECHNOLOGIES);
    const STEP_ORDER = ['setup', 'contexto', 'generador', 'ejecutor'];
    const OPENCODE_META_MODEL_FALLBACK = 'opencode/muse-spark-1.3-contributor-free';

    const els = {};

    function cacheElements() {
      els.stepButtons = document.querySelectorAll('.steps__button');
      els.bankLink = document.getElementById('bank-nav-link');
      els.views = document.querySelectorAll('.view');

      els.formSetup = document.getElementById('form-setup');
      els.btnLoadExample = document.getElementById('btn-load-example');
      els.mediaRefList = document.getElementById('media-ref-list');
      els.mediaReqList = document.getElementById('media-req-list');
      els.providerMediaChip = document.getElementById('provider-media-chip');
      els.mediaKeysSaved = document.getElementById('mk-saved');
      els.assetsPanel = document.getElementById('assets-panel');
      els.assetsPanelSummary = document.getElementById('assets-panel-summary');
      els.assetsGrid = document.getElementById('assets-grid');
      els.assetsNotices = document.getElementById('assets-notices');

      els.groupVerticals = document.getElementById('group-verticals');
      els.verticalOtroWrap = document.getElementById('vertical-otro-wrap');
      els.inputVerticalOtro = document.getElementById('input-vertical-otro');
      els.errVerticalOtro = document.getElementById('err-vertical-otro');
      els.groupTechnologies = document.getElementById('group-technologies');
      els.errContexto = document.getElementById('err-contexto');
      els.btnGenerate = document.getElementById('btn-generate');
      els.groupTechniques = document.getElementById('group-techniques');
      els.ssotPanel = document.getElementById('ssot-panel');
      els.conceptPickPanel = document.getElementById('concept-pick-panel');
      ['ideate', 'cancel', 'own', 'more', 'own-save'].forEach((id) => { els[`btnConcept${id.replace(/(^|-)(\w)/g, (m, a, b) => b.toUpperCase())}`] = document.getElementById(`btn-concept-${id}`); });
      ['pick-status', 'pick-note', 'pick-list', 'own-form', 'own-title', 'own-is', 'own-nav', 'own-error'].forEach((id) => { els[`concept${id.replace(/(^|-)(\w)/g, (m, a, b) => b.toUpperCase())}`] = document.getElementById(`concept-${id}`); });
      ['panel', 'backend', 'note', 'images-block', 'images-progress', 'images-grid', 'videos-block', 'videos-progress', 'videos-grid',
        'library', 'library-title', 'library-status', 'library-grid', 'library-role'].forEach((id) => {
        els[`pregen${id.replace(/(^|-)(\w)/g, (m, a, b) => b.toUpperCase())}`] = document.getElementById(`pregen-${id}`);
      });
      els.btnPregenImage = document.getElementById('btn-pregen-image');
      els.btnPregenImageLib = document.getElementById('btn-pregen-image-lib');
      els.btnPregenVideo = document.getElementById('btn-pregen-video');
      els.btnPregenVideoLib = document.getElementById('btn-pregen-video-lib');
      els.btnPregenImageWeb = document.getElementById('btn-pregen-image-web');
      els.btnPregenVideoWeb = document.getElementById('btn-pregen-video-web');
      els.pregenWeb = document.getElementById('pregen-web');
      els.btnPregenLibraryClose = document.getElementById('btn-pregen-library-close');
      els.btnPregenLibraryAdd = document.getElementById('btn-pregen-library-add');
      els.ssotSeedDisplay = document.getElementById('ssot-seed-display');
      els.btnSsotNew = document.getElementById('btn-ssot-new');
      els.btnSsotCopy = document.getElementById('btn-ssot-copy');
      els.btnSsotApply = document.getElementById('btn-ssot-apply');
      els.ssotSeedInput = document.getElementById('ssot-seed-input');
      els.ssotSeedError = document.getElementById('ssot-seed-error');
      els.ssotActionStatus = document.getElementById('ssot-action-status');
      els.ssotPreviewSummary = document.getElementById('ssot-preview-summary');
      els.ssotSwatches = document.getElementById('ssot-swatches');
      els.ssotDecisions = document.getElementById('ssot-decisions');
      els.ejecutorSeedHint = document.getElementById('ejecutor-seed-hint');
      els.btnTechAll = document.getElementById('btn-tech-all');
      els.btnTechNone = document.getElementById('btn-tech-none');
      els.techniquesSummary = document.getElementById('techniques-summary');

      els.creativeDirection = document.getElementById('creative-direction');
      els.conceptPanel = document.getElementById('concept-panel');
      els.promptTabs = document.getElementById('prompt-tabs');
      els.promptGenStatus = document.getElementById('prompt-gen-status');
      els.promptStructure = document.getElementById('prompt-structure');
      els.promptConstraints = document.getElementById('prompt-constraints');
      els.promptTextarea = document.getElementById('prompt-textarea');
      els.promptDraftNotice = document.getElementById('prompt-draft-notice');
      els.btnDiscardDraft = document.getElementById('btn-discard-draft');
      els.promptEditStatus = document.getElementById('prompt-edit-status');
      els.btnCopyPrompt = document.getElementById('btn-copy-prompt');
      els.btnRegenerate = document.getElementById('btn-regenerate');
      els.btnCancelGenerate = document.getElementById('btn-cancel-generate');
      els.btnExecute = document.getElementById('btn-execute');
      els.promptCopyStatus = document.getElementById('prompt-copy-status');

      els.btnProviderConfig = document.getElementById('btn-provider-config');
      els.providerSummary = document.getElementById('provider-summary');
      els.btnOpenWindow = document.getElementById('btn-open-window');
      els.btnCancelExecute = document.getElementById('btn-cancel-execute');
      els.ejecutorStatus = document.getElementById('ejecutor-status');
      els.previewFrame = document.getElementById('preview-frame');
      els.previewWrap = document.getElementById('preview-wrap');
      els.btnRerun = document.getElementById('btn-rerun');
      els.btnSaveBank = document.getElementById('btn-save-bank');

      els.studioTabsButtons = document.querySelectorAll('.studio-tabs__btn');
      els.btnToggleCode = document.getElementById('btn-toggle-code');
      els.btnSplitToggle = document.getElementById('btn-split-toggle');
      els.studioSplitter = document.getElementById('studio-splitter');
      els.studioVresize = document.getElementById('studio-vresize');
      els.studio = document.getElementById('studio');
      els.studioEditorPane = document.getElementById('studio-editor-pane');
      els.studioPreviewPane = document.getElementById('studio-preview-pane');
      els.widthButtons = document.querySelectorAll('.studio__width-btn');
      els.editorContainer = document.getElementById('editor-container');
      els.studioDraftNotice = document.getElementById('studio-draft-notice');
      els.btnDiscardStudioDraft = document.getElementById('btn-discard-studio-draft');
      els.btnInspectToggle = document.getElementById('btn-inspect-toggle');
      els.btnSaveVersion = document.getElementById('btn-save-version');
      els.btnCopyHtml = document.getElementById('btn-copy-html');
      els.btnDownloadHtml = document.getElementById('btn-download-html');
      els.previewProjectFrame = document.getElementById('preview-project-frame');
      els.studioFileSelect = document.getElementById('studio-file-select');
      els.studioFileLabel = document.getElementById('studio-file-label');
      els.ejecutorLog = document.getElementById('ejecutor-log');
      els.consoleList = document.getElementById('console-list');
      els.consoleSummary = document.getElementById('console-summary');
      els.consoleBadgeErrors = document.getElementById('console-badge-errors');
      els.consoleBadgeWarns = document.getElementById('console-badge-warns');
      els.consoleFilters = document.querySelectorAll('[data-console-filter]');
      els.consoleModal = document.getElementById('console-modal');
      els.consoleModalHeader = document.getElementById('console-modal-header');
      els.consoleViewBrowser = document.getElementById('console-view-browser');
      els.consoleViewServer = document.getElementById('console-view-server');
      els.consoleServerBar = document.getElementById('console-server-bar');
      els.consoleServerPill = document.getElementById('console-server-pill');
      els.consoleServerWhere = document.getElementById('console-server-where');
      els.consoleServerList = document.getElementById('console-server-list');
      els.consoleSearch = document.getElementById('console-search');
      els.consoleResize = document.getElementById('console-resize');
      els.btnConsoleToggle = document.getElementById('btn-console-toggle');
      els.btnConsoleClose = document.getElementById('btn-console-close');
      els.btnConsoleAutoscroll = document.getElementById('btn-console-autoscroll');
      els.btnServerStop = document.getElementById('btn-server-stop');
      els.btnServerStart = document.getElementById('btn-server-start');
      els.btnServerRestart = document.getElementById('btn-server-restart');
      els.previewServerStopped = document.getElementById('preview-server-stopped');
      els.btnPreviewStart = document.getElementById('btn-preview-start');
      els.btnConsoleClear = document.getElementById('btn-console-clear');
      els.btnConsoleCopy = document.getElementById('btn-console-copy');
      els.btnConsoleFixAll = document.getElementById('btn-console-fix-all');

      els.aiInstruction = document.getElementById('ai-instruction');
      els.aiScope = document.getElementById('ai-scope');
      els.btnAiEdit = document.getElementById('btn-ai-edit');
      els.btnCancelAiEdit = document.getElementById('btn-cancel-ai-edit');
      els.aiEditStatus = document.getElementById('ai-edit-status');
      els.aiEditDiff = document.getElementById('ai-edit-diff');
      els.aiEditDiffSummary = document.getElementById('ai-edit-diff-summary');
      els.aiEditFiles = document.getElementById('ai-edit-files');
      els.btnAiEditAccept = document.getElementById('btn-ai-edit-accept');
      els.btnAiEditDiscard = document.getElementById('btn-ai-edit-discard');
      els.versionsList = document.getElementById('versions-list');
      els.aiEditPanel = document.getElementById('ai-edit-panel');
      els.postExecPanel = document.getElementById('post-exec-panel');
      els.postExecStatus = document.getElementById('post-exec-status');
      els.croReview = document.getElementById('cro-review');
      els.croSummary = document.getElementById('cro-summary');
      els.croList = document.getElementById('cro-list');
      els.btnCroApply = document.getElementById('btn-cro-apply');
      els.btnCroRound2 = document.getElementById('btn-cro-round2');
      els.rewriteReview = document.getElementById('rewrite-review');
      els.rewriteSummary = document.getElementById('rewrite-summary');
      els.btnRewriteUse = document.getElementById('btn-rewrite-use');
      els.btnCancelPostExec = document.getElementById('btn-cancel-post-exec');

      els.bankGrid = document.getElementById('bank-grid');
      els.bankEmpty = document.getElementById('bank-empty');
      els.bankNotice = document.getElementById('bank-notice');
      els.bankMigrate = document.getElementById('bank-migrate');

      els.dialogConfirm = document.getElementById('dialog-confirm');
      els.dialogConfirmTitle = document.getElementById('dialog-confirm-title');
      els.dialogConfirmMessage = document.getElementById('dialog-confirm-message');
      els.dialogConfirmActions = document.getElementById('dialog-confirm-actions');

      els.formProvider = document.getElementById('form-provider');
      els.formCritic = document.getElementById('form-critic-provider');
      els.genForm = getProviderFormRefs('');
      els.criticForm = getProviderFormRefs('critic-');
      els.criticSame = document.getElementById('critic-same');
      els.criticOwn = document.getElementById('critic-own');
      els.providerSaved = document.getElementById('provider-saved');
      els.criticSaved = document.getElementById('critic-saved');
      els.setupProviderNotice = document.getElementById('setup-provider-notice');
      els.setupProviderNoticeBtn = document.getElementById('setup-provider-notice-btn');
      els.mediaPrefImages = document.getElementById('media-pref-images');
      els.mediaPrefStock = document.getElementById('media-pref-stock');
      els.mediaPrefVision = document.getElementById('media-pref-vision');
      els.visionCfg = document.getElementById('vision-cfg');
      els.visionUseGen = document.getElementById('vision-use-generator');
      els.visionOwn = document.getElementById('vision-own');
      els.visionOwnUrlField = document.getElementById('vision-own-url-field');
      els.visionBaseUrl = document.getElementById('vision-base-url');
      els.visionApiKey = document.getElementById('vision-api-key');
      els.visionModel = document.getElementById('vision-model');
      els.visionModelNote = document.getElementById('vision-model-note');
      els.visionCfgStatus = document.getElementById('vision-cfg-status');
      els.mediaPrefVideo = document.getElementById('media-pref-video');
    }

    /* ---------- OpenCode: endpoint genérico + cola + cancelación ---------- */

    function generateClientRunId() {
      return 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
    }

    // Wrapper del lado del cliente para POST /api/opencode/complete (Feature
    // 1/2): usado para generar el meta-prompt, repararlo, y para pedirle un
    // cambio a la IA sobre el HTML del Estudio. Nunca pasa por /api/proxy:
    // siempre mismo origen (server.js sirve la app y este endpoint).
    async function runOpencodeComplete({ prompt, model, expect, runId, stream, onDelta, signal, onModel }) {
      if (typeof location === 'undefined' || location.protocol === 'file:') {
        return { ok: false, error: 'Esta función requiere `node server.js` (no funciona abriendo la app con file://).' };
      }
      try {
        const res = await fetch('/api/opencode/complete', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ prompt, model, expect, runId, stream: !!stream }),
          signal,
        });
        const isNdjson = /ndjson/i.test(res.headers.get('content-type') || '');
        if (stream && res.ok && isNdjson && res.body && typeof res.body.getReader === 'function') {
          // NDJSON: start · attempt · delta (texto acumulado) · restart · done | error.
          let final = null;
          let text = '';
          await consumeNdjsonResponse(res, (o) => {
            if (o.type === 'delta') {
              text = typeof o.text === 'string' ? o.text : text;
              if (onDelta) { try { onDelta(text, { reasoningChars: 0 }); } catch (e) { /* UI */ } }
            } else if (o.type === 'restart') {
              text = '';
              if (onDelta) { try { onDelta('', { reasoningChars: 0, restart: true, model: o.model }); } catch (e) { /* UI */ } }
            } else if (o.type === 'attempt') {
              if (onModel) { try { onModel(o.model); } catch (e) { /* UI */ } }
            } else if (o.type === 'done' || o.type === 'error') {
              final = o;
            }
          });
          if (!final) return { ok: false, error: 'Se cortó la conexión con `node server.js` antes de terminar la respuesta.' };
          if (final.type === 'error') {
            return { ok: false, error: final.error || `Error de OpenCode (${final.status || 'stream'}).`, attempts: final.attempts || [], cancelled: final.status === 499 };
          }
          return { ok: true, text: final.text, html: final.html, model: final.model, attempts: final.attempts || [], runId: final.runId };
        }
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          return { ok: false, error: data.error || `Error de OpenCode (${res.status}).`, attempts: data.attempts || [], cancelled: res.status === 499 };
        }
        return { ok: true, text: data.text, html: data.html, model: data.model, attempts: data.attempts || [], runId: data.runId };
      } catch (e) {
        if (e && e.name === 'AbortError') return { ok: false, cancelled: true, error: 'Ejecución cancelada por el usuario.' };
        return { ok: false, error: 'No se pudo conectar con `node server.js`. Verificá que esté corriendo en http://localhost:3000.' };
      }
    }

    // Generar/reparar el prompt y editar con IA usan el proveedor que el
    // usuario configuró (antes siempre iban a OpenCode). Si el proveedor
    // externo falla, se reintenta con OpenCode local y se anota en attempts.
    async function runLLM({ prompt, expect, runId, role }) {
      const cfg = resolveProviderForRole(role, state.provider, state.criticProvider);
      if (cfg.type === 'opencode-local') {
        return runOpencodeComplete({ prompt, model: getOpencodeModelForMeta(cfg), expect, runId });
      }
      const external = await runPrompt(cfg, prompt, { expect });
      if (external.ok) {
        return Object.assign({}, external, { attempts: [{ model: cfg.model, status: 'ok' }] });
      }
      const fallback = await runOpencodeComplete({ prompt, model: OPENCODE_META_MODEL_FALLBACK, expect, runId });
      const attempts = [{ model: cfg.model, status: 'error', error: external.error }].concat(fallback.attempts || []);
      if (fallback.ok) return Object.assign({}, fallback, { attempts });
      return { ok: false, error: `${external.error} (respaldo OpenCode: ${fallback.error})`, attempts };
    }

    async function cancelOpencodeRun(runId) {
      if (!runId) return;
      try {
        await fetch('/api/opencode/cancel', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ runId }),
        });
      } catch (e) { /* no-op: si no se pudo avisar, el fallback igual llega cuando el server responda */ }
    }

    function getOpencodeModelForMeta(cfg) {
      const p = cfg || state.provider;
      return (p.type === 'opencode-local' && p.model) ? p.model : OPENCODE_META_MODEL_FALLBACK;
    }

    function showView(name) {
      state.step = name;
      els.views.forEach((v) => { v.hidden = v.dataset.view !== name; });
      els.stepButtons.forEach((b) => {
        const isCurrent = b.dataset.goto === name;
        if (isCurrent) b.setAttribute('aria-current', 'step');
        else b.removeAttribute('aria-current');
      });
      const main = document.getElementById('main');
      if (main) main.scrollTop = 0;
      if (name === 'contexto' && els.pregenPanel) {
        renderConceptPickPanel();
        renderPregenPanel();
        if (state.techniques.some((x) => x === 4 || x === 5)) fetchMediaStatus(true).then(() => renderPregenPanel()).catch(() => {});
      }
    }

    function goto(name) {
      if (STEP_ORDER.indexOf(name) === -1 && name !== 'banco' && name !== 'config') return;
      showView(name);
    }

    /* ---------- Diálogo de confirmación genérico (edición protegida) ----------
     * Reemplaza confirm()/alert() para los avisos de Regenerar / reemplazar
     * Estudio / prompt con problemas: usa el <dialog> nativo #dialog-confirm
     * (mismo patrón visual que los diálogos) con botones de acción
     * arbitrarios. Devuelve una Promise con el `id` de la acción elegida, o
     * `null` si se canceló (botón Cancelar, Escape, o clic en el backdrop).
     * Si el navegador no soporta <dialog>.showModal, cae a window.confirm()
     * (sólo dos opciones: la primera acción no-cancel, o null).
     */
    function showConfirmDialog(opts) {
      const dlg = els.dialogConfirm;
      if (!dlg || typeof dlg.showModal !== 'function') {
        const ok = window.confirm(opts.title ? `${opts.title}\n\n${opts.message}` : opts.message);
        if (!ok) return Promise.resolve(null);
        const primary = (opts.actions || []).find((a) => a.id !== 'cancel') || (opts.actions || [])[0];
        return Promise.resolve(primary ? primary.id : null);
      }
      return new Promise((resolve) => {
        els.dialogConfirmTitle.textContent = opts.title || '';
        els.dialogConfirmTitle.hidden = !opts.title;
        els.dialogConfirmMessage.textContent = opts.message || '';
        els.dialogConfirmActions.textContent = '';
        let settled = false;
        const finish = (id) => {
          if (settled) return;
          settled = true;
          dlg.removeEventListener('cancel', onCancel);
          dlg.close();
          resolve(id);
        };
        const onCancel = (event) => { event.preventDefault(); finish(null); };
        dlg.addEventListener('cancel', onCancel);
        let autofocusBtn = null;
        (opts.actions || []).forEach((action) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = `btn ${action.variant || 'btn--secondary'}`;
          btn.textContent = action.label;
          btn.addEventListener('click', () => finish(action.id));
          if (action.autofocus) autofocusBtn = btn;
          els.dialogConfirmActions.appendChild(btn);
        });
        dlg.showModal();
        (autofocusBtn || els.dialogConfirmActions.firstElementChild || dlg).focus();
      });
    }

    /* ---------- Multimedia real (Fase D): API, subidas, paletas ---------- */

    const MEDIA_API = '/api/media';
    const MEDIA_LIMITS = { image: 10 * 1024 * 1024, video: 60 * 1024 * 1024 };
    const MEDIA_ACCEPT = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'video/mp4', 'video/webm'];
    const mediaFrames = {};      // id -> [{mime, dataBase64}] (fotogramas de videos; solo memoria)
    const mediaPreviews = {};    // id -> object URL local (vista previa inmediata)
    const mediaPending = [];     // ítems en subida o con error (no se persisten)
    let mediaStatusCache = null;
    let mediaServerStatus = null; // respuesta cruda de /api/media/status (sin claves del navegador)

    function formatBytes(n) {
      if (n >= 1048576) return `${(n / 1048576).toFixed(1)} MB`;
      return `${Math.max(1, Math.round(n / 1024))} KB`;
    }

    function mediaSessionId() {
      let id = safeGetItem('lpa_media_session');
      if (!id || !/^[a-z0-9_-]{6,40}$/.test(id)) {
        id = `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
        safeSetItem('lpa_media_session', id);
      }
      return id;
    }

    async function mediaFetch(path, body, method) {
      try {
        const res = await fetch(`${MEDIA_API}${path}`, {
          method: method || (body === undefined ? 'GET' : 'POST'),
          headers: body === undefined ? undefined : { 'content-type': 'application/json' },
          body: body === undefined ? undefined : JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return { ok: false, error: data.error || `Error del servidor (${res.status}).` };
        return { ok: true, data };
      } catch (e) {
        return { ok: false, error: 'No se pudo conectar con `node server.js`.' };
      }
    }

    const mediaApi = {
      status: () => mediaFetch('/status'),
      describe: (body) => mediaFetch('/describe', attachMediaKeys(applyVisionConfig(applyMediaPref(body, 'vision', state.mediaPrefs), resolveVisionConfig(state.mediaPrefs, state.provider)), loadMediaKeys())),
      search: (body) => mediaFetch('/search', attachMediaKeys(applyMediaPref(body, 'stock', state.mediaPrefs), loadMediaKeys())),
      generateImage: (body) => mediaFetch('/generate-image', attachMediaKeys(applyMediaPref(Object.assign({ session: 'generated' }, body), 'images', state.mediaPrefs), loadMediaKeys())),
      generateVideo: (body) => mediaFetch('/generate-video', attachMediaKeys(body, loadMediaKeys())),
      analyzeLocal: (url, role) => analyzeImageLocal(url, role),
    };

    // Análisis local de un activo generado (misma forma que el de Gemini): carga
    // la imagen same-origin en un <canvas> pequeño y mide colores y espacio libre.
    function analyzeImageLocal(url, role) {
      return new Promise((resolve) => {
        const img = new Image();
        const timer = setTimeout(() => resolve(null), 15000);
        img.onload = () => {
          clearTimeout(timer);
          try {
            const w = 96;
            const h = Math.max(1, Math.round((img.naturalHeight / Math.max(1, img.naturalWidth)) * w));
            const cv = document.createElement('canvas');
            cv.width = w; cv.height = h;
            const ctx = cv.getContext('2d', { willReadFrequently: true });
            ctx.drawImage(img, 0, 0, w, h);
            resolve(analyzeLayoutGrid(ctx.getImageData(0, 0, w, h).data, w, h, role));
          } catch (e) { resolve(null); }
        };
        img.onerror = () => { clearTimeout(timer); resolve(null); };
        img.src = urlBase(url) || url; // ruta /media/… del mismo origen (sin canvas contaminado)
      });
    }

    async function fetchMediaStatus(force) {
      if (mediaStatusCache && !force) return mediaStatusCache;
      const r = await mediaApi.status();
      mediaServerStatus = (r.ok && r.data) ? r.data : { pexels: false, pixabay: false, cloudflare: false, gemini: false, pollinations: false, ffmpeg: false, unreachable: true };
      mediaStatusCache = mergeMediaStatus(mediaServerStatus, loadMediaKeys());
      return mediaStatusCache;
    }

    function renderMediaStatusChip(el, status) {
      if (!el) return;
      el.textContent = '';
      if (status.unreachable) { el.textContent = 'Servicios de multimedia: no se pudo consultar (¿está corriendo node server.js?).'; return; }
      el.appendChild(document.createTextNode('Servicios de multimedia: '));
      const SRC = { browser: 'clave del navegador', server: 'clave del servidor (.env)', none: 'sin configurar' };
      const src = status.sources || {};
      [['pexels', 'Pexels (fotos y video)'], ['pixabay', 'Pixabay (respaldo)'], ['cloudflare', 'Cloudflare (imágenes IA)'], ['gemini', 'Gemini (describe referencias y activos)']].forEach(([k, label]) => {
        const chip = document.createElement('span');
        chip.className = `chip ${status[k] ? 'chip--on' : 'chip--off'}`;
        chip.dataset.service = k;
        chip.dataset.source = src[k] || (status[k] ? 'server' : 'none');
        chip.textContent = `${label}: ${SRC[chip.dataset.source]}`;
        el.appendChild(chip);
      });
      const pchip = document.createElement('span');
      pchip.className = 'chip chip--on';
      pchip.dataset.service = 'pollinations';
      pchip.dataset.source = src.pollinations || 'none';
      pchip.textContent = `Pollinations (imágenes IA): ${src.pollinations === 'browser' ? 'clave del navegador' : 'sin clave (nivel gratuito)'}`;
      el.appendChild(pchip);
      const fchip = document.createElement('span');
      fchip.className = `chip ${status.ffmpeg ? 'chip--on' : 'chip--off'}`;
      fchip.textContent = `ffmpeg (montaje de video): ${status.ffmpeg ? 'sí' : 'no'}`;
      el.appendChild(fchip);
      const vis = resolveVisionConfig(state.mediaPrefs, state.provider);
      const vchip = document.createElement('span');
      const vOk = vis.kind === 'gemini' ? !!status.gemini : !!vis.ready;
      vchip.className = `chip ${vOk ? 'chip--on' : 'chip--off'}`;
      vchip.dataset.vision = vis.kind;
      vchip.textContent = `Visión elegida: ${vis.label}${vOk ? '' : (vis.kind === 'none' ? '' : ' (no disponible)')}`;
      el.appendChild(vchip);
    }

    async function refreshMediaStatusChips(force) {
      const st = await fetchMediaStatus(force);
      renderMediaStatusChip(els.providerMediaChip, st);
    }

    /* Claves de servicios de multimedia (Configuración → Multimedia). */
    function mediaKeyInputs() { return Array.from(document.querySelectorAll('#media-keys input[data-mk]')); }
    function renderMediaKeys() {
      const keys = loadMediaKeys();
      mediaKeyInputs().forEach((inp) => { if (document.activeElement !== inp) inp.value = keys[inp.dataset.mk] || ''; });
    }
    function applyMediaKeysChange(msg) {
      if (mediaServerStatus) mediaStatusCache = mergeMediaStatus(mediaServerStatus, loadMediaKeys());
      renderMediaStatusChip(els.providerMediaChip, mediaStatusCache || { unreachable: false, sources: {} });
      if (typeof renderPregenPanel === 'function') renderPregenPanel();
      if (els.mediaKeysSaved) els.mediaKeysSaved.textContent = msg;
    }
    function onSaveMediaKeys() {
      const raw = {};
      mediaKeyInputs().forEach((inp) => { raw[inp.dataset.mk] = inp.value; });
      const saved = saveMediaKeys(raw);
      const n = Object.keys(saved).length;
      applyMediaKeysChange(n ? `Guardado: ${n} clave${n === 1 ? '' : 's'} en este navegador.` : 'Sin claves locales: se usan las del servidor (.env), si existen.');
      renderMediaKeys();
    }
    function onClearMediaKeys() {
      saveMediaKeys({});
      mediaKeyInputs().forEach((inp) => { inp.value = ''; });
      applyMediaKeysChange('Claves del navegador borradas.');
    }

    function fileToBase64(file) {
      return new Promise((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => { const s = String(fr.result || ''); resolve(s.slice(s.indexOf(',') + 1)); };
        fr.onerror = () => reject(new Error('No se pudo leer el archivo.'));
        fr.readAsDataURL(file);
      });
    }

    // POST con progreso real (fetch no expone el progreso de subida).
    function uploadJson(body, onProgress) {
      return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${MEDIA_API}/upload`);
        xhr.setRequestHeader('content-type', 'application/json');
        xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(e.loaded / e.total); };
        xhr.onload = () => {
          let data = {};
          try { data = JSON.parse(xhr.responseText || '{}'); } catch (e) { /* respuesta no JSON */ }
          if (xhr.status >= 200 && xhr.status < 300) resolve({ ok: true, data });
          else resolve({ ok: false, error: data.error || `Error del servidor (${xhr.status}).` });
        };
        xhr.onerror = () => resolve({ ok: false, error: 'No se pudo conectar con `node server.js`.' });
        xhr.send(JSON.stringify(body));
      });
    }

    function canvasPalette(source, sw, sh) {
      const maxW = 96;
      const scale = Math.min(1, maxW / Math.max(1, sw));
      const w = Math.max(1, Math.round(sw * scale));
      const h = Math.max(1, Math.round(sh * scale));
      const cv = document.createElement('canvas');
      cv.width = w; cv.height = h;
      const ctx = cv.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(source, 0, 0, w, h);
      return Array.from(ctx.getImageData(0, 0, w, h).data);
    }

    function loadImageElement(objectUrl) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        const guard = setTimeout(() => reject(new Error('imagen sin respuesta')), 6000); // AVIF/GIF raros: no bloquear la subida
        img.onload = () => { clearTimeout(guard); resolve(img); };
        img.onerror = () => { clearTimeout(guard); reject(new Error('imagen no decodificable')); };
        img.src = objectUrl;
      });
    }

    async function extractImageInfo(file, objectUrl) {
      try {
        const img = await loadImageElement(objectUrl);
        const px = canvasPalette(img, img.naturalWidth, img.naturalHeight);
        return { palette: medianCutPalette(px, 5), width: img.naturalWidth, height: img.naturalHeight, frames: [] };
      } catch (e) {
        return { palette: [], width: 0, height: 0, frames: [] };
      }
    }

    // 4 fotogramas (10/35/60/85 % de la duración) para paleta + Gemini.
    function extractVideoInfo(file, objectUrl) {
      return new Promise((resolve) => {
        const fail = () => resolve({ palette: [], width: 0, height: 0, frames: [] });
        const v = document.createElement('video');
        v.muted = true; v.playsInline = true; v.preload = 'auto'; v.crossOrigin = 'anonymous';
        const hardTimeout = setTimeout(fail, 20000);
        const seekTo = (t) => new Promise((res) => {
          const timer = setTimeout(res, 5000);
          v.onseeked = () => { clearTimeout(timer); res(); };
          v.currentTime = t;
        });
        v.onerror = () => { clearTimeout(hardTimeout); fail(); };
        v.onloadedmetadata = async () => {
          try {
            const dur = v.duration && isFinite(v.duration) ? v.duration : 0;
            const times = dur ? [0.1, 0.35, 0.6, 0.85].map((f) => f * dur) : [0];
            const frames = []; const pooled = [];
            for (const t of times) {
              // eslint-disable-next-line no-await-in-loop
              await seekTo(t);
              if (!v.videoWidth) continue;
              const cv = document.createElement('canvas');
              const w = Math.min(480, v.videoWidth);
              cv.width = w; cv.height = Math.round(v.videoHeight * (w / v.videoWidth));
              cv.getContext('2d').drawImage(v, 0, 0, cv.width, cv.height);
              frames.push({ mime: 'image/jpeg', dataBase64: cv.toDataURL('image/jpeg', 0.8).split(',')[1] });
              pooled.push.apply(pooled, canvasPalette(cv, cv.width, cv.height));
            }
            clearTimeout(hardTimeout);
            resolve({ palette: medianCutPalette(pooled, 5), width: v.videoWidth, height: v.videoHeight, frames });
          } catch (e) { clearTimeout(hardTimeout); fail(); }
        };
        v.src = objectUrl;
      });
    }

    function persistMedia() {
      saveMediaSetting(state.media);
    }

    function setMediaError(kind, msg) {
      const el = document.getElementById(kind === 'reference' ? 'err-media-ref' : 'err-media-req');
      if (el) el.textContent = msg || '';
    }

    async function addMediaFiles(fileList, kind) {
      const list = kind === 'reference' ? state.media.references : state.media.required;
      const max = kind === 'reference' ? 3 : 12;
      const files = Array.from(fileList || []);
      setMediaError(kind, '');
      for (const file of files) {
        const inflight = mediaPending.filter((p) => p.kind === kind && !p.error).length;
        if (list.length + inflight >= max) { setMediaError(kind, `Máximo ${max} archivo${max === 1 ? '' : 's'} en este campo.`); break; }
        const mime = (file.type || '').toLowerCase();
        const type = mime.indexOf('video/') === 0 ? 'video' : 'image';
        if (MEDIA_ACCEPT.indexOf(mime) === -1) { setMediaError(kind, `"${file.name}": formato no permitido (usá JPG, PNG, WebP, GIF, AVIF, MP4 o WebM).`); continue; }
        if (file.size > MEDIA_LIMITS[type]) { setMediaError(kind, `"${file.name}" supera el límite (${type === 'video' ? '60 MB para videos' : '10 MB para imágenes'}).`); continue; }
        const pend = { id: `p${Date.now()}${Math.random().toString(36).slice(2, 6)}`, kind, name: file.name, type, size: file.size, progress: 0, pending: true, previewUrl: URL.createObjectURL(file) };
        mediaPending.push(pend);
        state.mediaBusy++;
        renderMediaLists();
        // eslint-disable-next-line no-await-in-loop -- una por vez: no saturar el servidor local
        await processMediaFile(file, pend, kind, mime, type);
        state.mediaBusy = Math.max(0, state.mediaBusy - 1);
        renderMediaLists();
        if (pend.dropped) break;
      }
    }

    async function processMediaFile(file, pend, kind, mime, type) {
      try {
        const [b64, info] = await Promise.all([
          fileToBase64(file),
          type === 'video' ? extractVideoInfo(file, pend.previewUrl) : extractImageInfo(file, pend.previewUrl),
        ]);
        const up = await uploadJson({ name: file.name, mime, dataBase64: b64, kind, session: mediaSessionId() }, (f) => { pend.progress = f; renderMediaLists(); });
        if (!up.ok) { pend.pending = false; pend.error = up.error; return; }
        if (pend.dropped) return; // "Limpiar todo" corrió durante la subida: no se re-agrega (el archivo queda en disco)
        const d = up.data;
        const item = sanitizeMediaItem({
          id: d.id, url: d.url, name: file.name, mime: d.mime, type: d.type, kind, role: kind === 'required' ? 'otro' : '',
          caption: '', size: d.size, width: info.width, height: info.height, palette: info.palette,
        });
        if (!item) { pend.pending = false; pend.error = 'El servidor devolvió una URL inesperada.'; return; }
        mediaFrames[item.id] = info.frames;
        mediaPreviews[item.id] = pend.previewUrl;
        (kind === 'reference' ? state.media.references : state.media.required).push(item);
        mediaPending.splice(mediaPending.indexOf(pend), 1);
        persistMedia();
      } catch (e) {
        pend.pending = false; pend.error = (e && e.message) || 'No se pudo subir el archivo.';
      }
    }

    function removeMediaItem(kind, id) {
      const key = kind === 'reference' ? 'references' : 'required';
      state.media[key] = state.media[key].filter((m) => m.id !== id);
      delete mediaFrames[id];
      persistMedia();
      renderMediaLists();
    }

    function buildMediaThumb(m) {
      const src = mediaPreviews[m.id] || m.previewUrl || m.url;
      let el;
      if (m.type === 'video') {
        el = document.createElement('video');
        el.muted = true; el.preload = 'metadata'; el.playsInline = true;
        el.src = src;
      } else {
        el = document.createElement('img');
        el.src = src; el.alt = '';
      }
      el.className = 'media-item__thumb';
      return el;
    }

    function renderMediaLists() {
      [['reference', els.mediaRefList], ['required', els.mediaReqList]].forEach(([kind, ul]) => {
        if (!ul) return;
        ul.textContent = '';
        const done = kind === 'reference' ? state.media.references : state.media.required;
        done.concat(mediaPending.filter((p) => p.kind === kind)).forEach((m) => {
          const li = document.createElement('li');
          li.className = 'media-item';
          li.appendChild(buildMediaThumb(m));
          const body = document.createElement('div');
          body.className = 'media-item__body';
          const name = document.createElement('span');
          name.className = 'media-item__name';
          name.textContent = m.name || '(sin nombre)';
          body.appendChild(name);
          const meta = document.createElement('span');
          meta.className = 'media-item__meta';
          meta.textContent = `${m.type === 'video' ? 'video' : 'imagen'} · ${formatBytes(m.size || 0)}${m.width ? ` · ${m.width}×${m.height}` : ''}`;
          body.appendChild(meta);
          if (m.pending) {
            const pr = document.createElement('progress');
            pr.max = 1; pr.value = m.progress || 0;
            pr.setAttribute('aria-label', `Subiendo ${m.name}`);
            body.appendChild(pr);
          } else if (m.error) {
            const er = document.createElement('span');
            er.className = 'media-item__error';
            er.textContent = m.error;
            body.appendChild(er);
          } else {
            if (m.palette && m.palette.length) {
              const sw = document.createElement('span');
              sw.className = 'media-item__swatches';
              sw.setAttribute('aria-label', `Paleta extraída: ${m.palette.join(', ')}`);
              m.palette.forEach((h) => {
                const c = document.createElement('span');
                c.className = 'media-item__swatch';
                c.style.background = h; c.title = h;
                sw.appendChild(c);
              });
              body.appendChild(sw);
            }
            if (kind === 'required') {
              const row = document.createElement('div');
              row.className = 'media-item__row';
              const sel = document.createElement('select');
              sel.setAttribute('aria-label', `Rol de ${m.name}`);
              MEDIA_ROLES.forEach((r) => { const o = document.createElement('option'); o.value = r; o.textContent = r; sel.appendChild(o); });
              sel.value = m.role || 'otro';
              sel.addEventListener('change', () => { m.role = sel.value; persistMedia(); });
              const cap = document.createElement('input');
              cap.type = 'text'; cap.placeholder = 'Texto alternativo / pie (opcional)'; cap.value = m.caption || '';
              cap.setAttribute('aria-label', `Texto alternativo de ${m.name}`);
              cap.addEventListener('input', () => { m.caption = cap.value.slice(0, 200); persistMedia(); });
              row.appendChild(sel); row.appendChild(cap);
              body.appendChild(row);
            }
          }
          li.appendChild(body);
          const rm = document.createElement('button');
          rm.type = 'button'; rm.className = 'btn btn--link'; rm.textContent = 'Quitar';
          rm.setAttribute('aria-label', `Quitar ${m.name}`);
          rm.addEventListener('click', () => {
            if (m.pending || m.error) {
              mediaPending.splice(mediaPending.indexOf(m), 1);
              renderMediaLists();
            } else removeMediaItem(kind, m.id);
          });
          li.appendChild(rm);
          ul.appendChild(li);
        });
      });
    }

    function bindDropzone(zone, input, kind) {
      if (!zone || !input) return;
      const open = () => input.click();
      zone.addEventListener('click', open);
      zone.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
      ['dragenter', 'dragover'].forEach((ev) => zone.addEventListener(ev, (e) => { e.preventDefault(); zone.classList.add('is-over'); }));
      ['dragleave', 'drop'].forEach((ev) => zone.addEventListener(ev, (e) => { e.preventDefault(); zone.classList.remove('is-over'); }));
      zone.addEventListener('drop', (e) => { if (e.dataTransfer && e.dataTransfer.files) addMediaFiles(e.dataTransfer.files, kind); });
      input.addEventListener('change', () => { addMediaFiles(input.files, kind); input.value = ''; });
    }

    /* ---------- Setup ---------- */

    const REQUIRED_FIELDS = ['tema', 'publico', 'oferta', 'objetivo', 'competidores'];
    const OPTIONAL_FIELDS = ['descripcion', 'tono', 'referenciasVisuales', 'propuestaValor', 'restriccionesAdicionales'];

    function clearSetupErrors() {
      REQUIRED_FIELDS.forEach((f) => {
        const errEl = document.getElementById(`err-${f}`);
        if (errEl) errEl.textContent = '';
      });
    }

    function fillSetupForm(project) {
      REQUIRED_FIELDS.concat(OPTIONAL_FIELDS).forEach((f) => {
        const input = els.formSetup.elements[f];
        if (input) input.value = project[f] || '';
      });
      if (project.media) { state.media = normalizeMedia(project.media); persistMedia(); renderMediaLists(); }
    }

    function readSetupForm() {
      const data = {};
      REQUIRED_FIELDS.concat(OPTIONAL_FIELDS).forEach((f) => {
        const input = els.formSetup.elements[f];
        data[f] = input ? input.value.trim() : '';
      });
      data.media = normalizeMedia(state.media); // Fase D: referencias y multimedia obligatoria ya subidas
      return data;
    }

    function validateSetup(data) {
      clearSetupErrors();
      let valid = true;
      REQUIRED_FIELDS.forEach((f) => {
        if (!data[f]) {
          const errEl = document.getElementById(`err-${f}`);
          if (errEl) errEl.textContent = 'Este campo es obligatorio.';
          valid = false;
        }
      });
      return valid;
    }

    function onSetupSubmit(event) {
      event.preventDefault();
      if (state.mediaBusy > 0) { setMediaError('required', 'Esperá a que terminen las subidas antes de continuar.'); return; }
      const data = readSetupForm();
      if (!validateSetup(data)) return;
      state.project = data;
      goto('contexto');
    }

    /* ---------- Setup: completar campos con IA ---------- */

    const aiFill = { runId: null, busy: false, timer: null, cancelled: false };

    function setupField(f) { return els.formSetup.elements[f]; }

    function refreshAiFillButton() {
      const btn = document.getElementById('btn-ai-fill');
      const ta = setupField('descripcion');
      if (!btn || !ta) return;
      const len = ta.value.trim().length;
      const ok = len >= SETUP_AI_MIN_CHARS && !aiFill.busy;
      btn.disabled = !ok;
      btn.setAttribute('aria-disabled', String(!ok));
      const status = document.getElementById('ai-fill-status');
      if (!aiFill.busy && status && !status.dataset.sticky) {
        status.textContent = len && len < SETUP_AI_MIN_CHARS ? `Escribí al menos ${SETUP_AI_MIN_CHARS} caracteres para usar la IA (van ${len}).` : '';
      }
    }

    function setAiFillStatus(text, sticky) {
      const status = document.getElementById('ai-fill-status');
      if (!status) return;
      status.textContent = text;
      if (sticky) status.dataset.sticky = '1'; else delete status.dataset.sticky;
    }

    function clearAiSuggestion(f) {
      const el = document.getElementById(`ai-sug-${f}`);
      if (el) el.remove();
    }

    function showAiSuggestion(f, value) {
      const input = setupField(f);
      if (!input) return;
      clearAiSuggestion(f);
      const box = document.createElement('div');
      box.className = 'ai-suggestion';
      box.id = `ai-sug-${f}`;
      const txt = document.createElement('span');
      txt.className = 'ai-suggestion__text';
      txt.textContent = `Sugerencia de la IA: ${value}`;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn--link btn--small';
      btn.textContent = 'Usar sugerencia';
      btn.addEventListener('click', () => {
        input.value = value;
        clearAiSuggestion(f);
        flashAiField(input);
        const err = document.getElementById(`err-${f}`);
        if (err) err.textContent = '';
        input.focus();
      });
      box.appendChild(txt);
      box.appendChild(btn);
      const control = input.closest('.field-row__control') || input.parentNode;
      control.appendChild(box);
    }

    function flashAiField(input) {
      input.classList.add('is-ai-filled');
      setTimeout(() => input.classList.remove('is-ai-filled'), 2500);
    }

    function applyAiFill(fields) {
      let filled = 0;
      let suggested = 0;
      Object.keys(fields).forEach((f) => {
        const input = setupField(f);
        if (!input) return;
        const value = fields[f];
        if (!input.value.trim()) {
          input.value = value;
          clearAiSuggestion(f);
          flashAiField(input);
          const err = document.getElementById(`err-${f}`);
          if (err) err.textContent = '';
          filled++;
        } else if (input.value.trim() !== value) {
          showAiSuggestion(f, value);
          suggested++;
        }
      });
      return { filled, suggested };
    }

    function stopAiFillUi() {
      aiFill.busy = false;
      if (aiFill.timer) { clearInterval(aiFill.timer); aiFill.timer = null; }
      const cancel = document.getElementById('btn-ai-fill-cancel');
      if (cancel) cancel.hidden = true;
      refreshAiFillButton();
    }

    async function onAiFillClick() {
      if (aiFill.busy) return;
      const ta = setupField('descripcion');
      const descripcion = ta ? ta.value.trim() : '';
      if (descripcion.length < SETUP_AI_MIN_CHARS) { refreshAiFillButton(); return; }
      aiFill.busy = true;
      aiFill.cancelled = false;
      aiFill.runId = generateClientRunId();
      const runId = aiFill.runId;
      const started = Date.now();
      const cancel = document.getElementById('btn-ai-fill-cancel');
      if (cancel) cancel.hidden = false;
      const tick = () => setAiFillStatus(`Completando… ${Math.round((Date.now() - started) / 1000)}s`, true);
      tick();
      aiFill.timer = setInterval(tick, 1000);
      refreshAiFillButton();
      let res;
      try {
        res = await runLLM({ prompt: buildSetupFillPrompt(descripcion), expect: 'text', runId });
      } catch (e) {
        res = { ok: false, error: (e && e.message) || 'Error inesperado.' };
      }
      if (aiFill.runId !== runId) return; // otra ejecución tomó el control
      stopAiFillUi();
      if (aiFill.cancelled || (res && res.cancelled)) { setAiFillStatus('Cancelado.', true); return; }
      if (!res || !res.ok) { setAiFillStatus(`No se pudo completar: ${(res && res.error) || 'error desconocido'}`, true); return; }
      const parsed = parseSetupFillResponse(res.text);
      if (!parsed.ok) { setAiFillStatus(parsed.error, true); return; }
      const { filled, suggested } = applyAiFill(parsed.fields);
      setAiFillStatus(`Listo: ${filled} ${filled === 1 ? 'campo completado' : 'campos completados'}, ${suggested} ${suggested === 1 ? 'sugerencia' : 'sugerencias'}.`, true);
    }

    function onAiFillCancel() {
      if (!aiFill.busy) return;
      aiFill.cancelled = true;
      const runId = aiFill.runId;
      aiFill.runId = null;
      cancelOpencodeRun(runId);
      stopAiFillUi();
      setAiFillStatus('Cancelado.', true);
    }

    function onLoadExample() {
      fillSetupForm(EXAMPLE_PROJECT);
      document.querySelectorAll('.ai-suggestion').forEach((n) => n.remove());
      setAiFillStatus('', false);
      refreshAiFillButton();
      clearSetupErrors();
      state.verticals = EXAMPLE_VERTICALS.slice();
      state.customVertical = '';
      state.customVerticalOn = false;
      state.technologies = EXAMPLE_TECHNOLOGIES.slice();
      renderChipGroups();
    }

    /* ---------- Contexto y tecnologías ---------- */

    function renderChipGroup(container, entries, selected, groupName) {
      container.textContent = '';
      entries.forEach(([key, label]) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'chip';
        btn.setAttribute('role', 'checkbox');
        const isChecked = selected.indexOf(key) !== -1;
        btn.setAttribute('aria-checked', String(isChecked));
        if (isChecked) btn.classList.add('chip--selected');
        btn.textContent = label;
        btn.dataset.key = key;
        btn.dataset.group = groupName;
        // Tecnologías incompatibles con lo ya elegido: se deshabilitan con el
        // motivo visible (antes se podía elegir Vue + Next.js y el conflicto
        // recién se "resolvía" dentro del prompt).
        const blockers = (groupName === 'technologies' && !isChecked) ? techBlockers(key, selected) : [];
        if (blockers.length) {
          const names = blockers.map((b) => TECHNOLOGIES[b].label).join(' y ');
          btn.classList.add('chip--blocked');
          btn.setAttribute('aria-disabled', 'true');
          btn.title = `${label} no se puede combinar con ${names}`;
          const note = document.createElement('span');
          note.className = 'chip__note';
          note.textContent = `incompatible con ${names}`;
          btn.appendChild(note);
        }
        btn.addEventListener('click', () => {
          if (btn.getAttribute('aria-disabled') === 'true') {
            if (els.errContexto) {
              const msg = `Tocaste ${label}: no se puede combinar con ${blockers.map((b) => TECHNOLOGIES[b].label).join(' y ')}. Quitá esa tecnología primero.`;
              els.errContexto.textContent = msg;
              // Se borra solo: es un aviso del último clic, no un error pendiente.
              setTimeout(() => { if (els.errContexto.textContent === msg) els.errContexto.textContent = ''; }, 6000);
            }
            return;
          }
          toggleChip(groupName, key, btn);
        });
        container.appendChild(btn);
      });
    }

    function toggleChip(groupName, key) {
      const arr = groupName === 'verticals' ? state.verticals : state.technologies;
      const idx = arr.indexOf(key);
      if (idx === -1) {
        if (groupName === 'technologies' && techBlockers(key, arr).length) return;
        arr.push(key);
      } else {
        arr.splice(idx, 1);
      }
      if (els.errContexto && groupName === 'technologies') els.errContexto.textContent = '';
      renderChipGroups();
    }

    // Verticales que viajan al prompt: listados + rubro libre (si el chip "Otro…" está activo y tiene texto).
    function effectiveVerticals() {
      return withCustomVertical(state.verticals, state.customVerticalOn ? state.customVertical : '');
    }

    function renderVerticalOtro() {
      if (!els.groupVerticals) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chip chip--otro';
      btn.setAttribute('role', 'checkbox');
      btn.setAttribute('aria-checked', String(state.customVerticalOn));
      if (state.customVerticalOn) btn.classList.add('chip--selected');
      btn.dataset.key = 'otro';
      btn.dataset.group = 'verticals';
      btn.textContent = 'Otro…';
      btn.addEventListener('click', () => {
        state.customVerticalOn = !state.customVerticalOn;
        if (els.errVerticalOtro) els.errVerticalOtro.textContent = '';
        renderChipGroups();
        if (state.customVerticalOn && els.inputVerticalOtro) els.inputVerticalOtro.focus();
      });
      els.groupVerticals.appendChild(btn);
      if (els.verticalOtroWrap) els.verticalOtroWrap.hidden = !state.customVerticalOn;
      if (els.inputVerticalOtro && els.inputVerticalOtro.value !== state.customVertical) els.inputVerticalOtro.value = state.customVertical;
    }

    function onVerticalOtroInput() {
      state.customVertical = els.inputVerticalOtro.value.slice(0, CUSTOM_VERTICAL_MAX);
      if (cleanCustomVertical(state.customVertical) && els.errVerticalOtro) els.errVerticalOtro.textContent = '';
    }

    function renderChipGroups() {
      // Selecciones viejas (localStorage/Banco) con tecnologías incompatibles:
      // se conservan las primeras y se avisa qué se quitó.
      const clean = sanitizeTechSelection(state.technologies);
      if (clean.length !== state.technologies.length) {
        const removed = state.technologies.filter((k) => clean.indexOf(k) === -1).map((k) => (TECHNOLOGIES[k] ? TECHNOLOGIES[k].label : k));
        state.technologies.splice(0, state.technologies.length, ...clean);
        if (els.errContexto) els.errContexto.textContent = `Se quitó ${removed.join(' y ')} porque es incompatible con otra tecnología elegida.`;
      }
      renderChipGroup(
        els.groupVerticals,
        VERTICAL_KEYS.map((k) => [k, VERTICALS[k].label]),
        state.verticals,
        'verticals',
      );
      renderVerticalOtro();
      renderChipGroup(
        els.groupTechnologies,
        TECH_KEYS.map((k) => [k, TECHNOLOGIES[k].label]),
        state.technologies,
        'technologies',
      );
      renderTechniques();
    }

    /* ---------- Técnicas seleccionables (Fase C): UI del paso 2 ---------- */

    function setTechniques(ids) {
      state.techniques = normalizeTechniques(ids);
      saveTechniquesSetting(state.techniques);
      renderTechniques();
    }

    function toggleTechnique(id) {
      const has = state.techniques.indexOf(id) !== -1;
      setTechniques(has ? state.techniques.filter((x) => x !== id) : state.techniques.concat([id]));
    }

    function makeSpan(className, text) {
      const s = document.createElement('span');
      s.className = className;
      s.textContent = text;
      return s;
    }

    // Se construye una sola vez y después se sincroniza en el lugar: así el
    // foco del teclado no se pierde al activar/desactivar una técnica.
    function renderTechniques() {
      const container = els.groupTechniques;
      if (!container) return;
      if (container.children.length !== TECHNIQUES.length) {
        container.textContent = '';
        TECHNIQUES.forEach((tq) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'technique';
          btn.setAttribute('role', 'switch');
          btn.setAttribute('aria-describedby', `technique-desc-${tq.id}`);
          btn.dataset.technique = String(tq.id);
          const body = document.createElement('span');
          body.className = 'technique__body';
          body.appendChild(makeSpan('technique__name', tq.name));
          body.appendChild(makeSpan('technique__phase', tq.phase));
          const desc = makeSpan('technique__desc', tq.desc);
          desc.id = `technique-desc-${tq.id}`;
          body.appendChild(desc);
          btn.appendChild(makeSpan('technique__num', String(tq.id)));
          btn.appendChild(body);
          btn.appendChild(makeSpan('technique__state', ''));
          btn.addEventListener('click', () => toggleTechnique(tq.id));
          container.appendChild(btn);
        });
      }
      Array.prototype.forEach.call(container.children, (btn) => {
        const id = Number(btn.dataset.technique);
        const isOn = state.techniques.indexOf(id) !== -1;
        btn.setAttribute('aria-checked', String(isOn));
        btn.classList.toggle('technique--on', isOn);
        btn.querySelector('.technique__state').textContent = isOn ? 'Activa' : 'Apagada';
      });
      const all = state.techniques.length === TECHNIQUES.length;
      const none = state.techniques.length === 0;
      if (els.btnTechAll) { els.btnTechAll.setAttribute('aria-pressed', String(all)); els.btnTechAll.classList.toggle('is-active', all); }
      if (els.btnTechNone) { els.btnTechNone.setAttribute('aria-pressed', String(none)); els.btnTechNone.classList.toggle('is-active', none); }
      if (els.techniquesSummary) els.techniquesSummary.textContent = `Técnicas activas: ${describeTechniques(state.techniques)}. Se aplican al generar el prompt.`;
      renderSsotPanel();
      renderConceptPickPanel();
      renderPregenPanel();
    }

    /* ---------- Cadena semilla (SSoT): panel visible y controlable (paso 2) ---------- */

    async function copyText(text) {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          const ta = document.createElement('textarea');
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          const ok = document.execCommand('copy');
          document.body.removeChild(ta);
          if (!ok) return false;
        }
        return true;
      } catch (e) { return false; }
    }

    function setSsotSeed(seed) {
      state.ssotSeed = seed;
      saveSsotSeed(seed);
      renderSsotPanel();
      renderConceptPickPanel(); // refresca el aviso "de otra cadena"
      if (state.templateGeneration) renderDirectionPanel(); // refresca el aviso "la cadena cambió"
    }

    // Muestras de la paleta (fondo, superficie, texto, acento, acento 2). Los
    // colores se asignan por CSSOM, no por atributo style.
    function buildPaletteSwatchList(palette, className, withDetails) {
      const ul = document.createElement('ul');
      ul.className = className;
      const rows = [
        ['Fondo', palette.bg, 'base de la página'],
        ['Superficie', palette.surface, 'tarjetas y paneles'],
        ['Texto', palette.text, `${palette.contrast.text}:1 sobre el fondo`],
        ['Acento', palette.accent, `${palette.contrast.accent}:1 sobre el fondo`],
        ['Acento 2', palette.accent2, `${palette.contrast.accent2}:1 sobre el fondo`],
      ];
      rows.forEach(([role, hex, note]) => {
        const li = document.createElement('li');
        li.className = 'swatch';
        const chip = document.createElement('span');
        chip.className = 'swatch__chip';
        chip.style.backgroundColor = hex;
        chip.setAttribute('role', 'img');
        chip.setAttribute('aria-label', `${role} ${hex}`);
        li.appendChild(chip);
        const info = document.createElement('span');
        info.className = 'swatch__info';
        info.appendChild(makeSpan('swatch__role', role));
        const code = document.createElement('code');
        code.className = 'swatch__hex';
        code.textContent = hex;
        info.appendChild(code);
        if (withDetails) info.appendChild(makeSpan('swatch__note', note));
        li.appendChild(info);
        ul.appendChild(li);
      });
      return ul;
    }

    // Vista previa 100% local: la misma buildCreativeDirection que usa la
    // generación, sin llamar a ningún modelo. Misma cadena => mismas decisiones.
    function renderSsotPreview() {
      if (!els.ssotSwatches || !els.ssotDecisions) return;
      const cd = buildCreativeDirection(state.ssotSeed, synthesizeVerticals(effectiveVerticals()));
      const p = cd.palette;
      els.ssotSwatches.textContent = '';
      els.ssotSwatches.appendChild(buildPaletteSwatchList(p, 'swatch-list', true));
      els.ssotDecisions.textContent = '';
      [
        ['Esquema de paleta', `${p.name} · tono base ${p.baseHue}° (${p.hueName}) · saturación ${p.saturation}`],
        ['Pareja tipográfica', cd.typePairing],
        ['Paradigma de layout', cd.layoutParadigm],
        ['Paradigma de interacción (solo con técnica 2)', cd.interactionParadigm],
        ['Arquetipo de hero', cd.heroArchetype],
        ['3D', cd.threeD],
        ['Experiencias de scroll', cd.scrollExperience.join(' | ')],
        ['Densidad informativa', cd.density],
      ].forEach(([k, v]) => {
        const dt = document.createElement('dt'); dt.textContent = k;
        const dd = document.createElement('dd'); dd.textContent = v;
        els.ssotDecisions.appendChild(dt); els.ssotDecisions.appendChild(dd);
      });
      if (els.ssotPreviewSummary) {
        els.ssotPreviewSummary.textContent = `Vista previa actualizada: paleta ${p.name}, texto sobre fondo ${p.contrast.text}:1.`;
      }
    }

    // El panel existe solo con la técnica 1 (SSoT) activa.
    function renderSsotPanel() {
      if (!els.ssotPanel) return;
      const on = state.techniques.indexOf(1) !== -1;
      els.ssotPanel.hidden = !on;
      if (!on) return;
      els.ssotSeedDisplay.textContent = formatSeedGroups(state.ssotSeed);
      renderSsotPreview();
    }

    /* ---------- Concepto rector elegido ANTES del prompt (paso 2, técnica 2) ----------
     * Idea 3 conceptos (una llamada), se elige uno (o se escribe uno propio) y se
     * guarda en state.conceptPick ('lpa_concept_pick_v1'). runTechniquePipeline lo usa
     * sin ideación ni llamada extra, y el panel de recursos (4/5) lo toma como brief.
     */

    const conceptPickState = { busy: false, runId: null, cancelled: false, timer: null, started: 0, status: '', statusError: false, ownOpen: false, editing: -1, ownError: '' };

    function currentConceptKey() {
      let seed = '';
      try { seed = deriveCreativeDirection(state.project || {}, effectiveVerticals(), state.techniques, state.ssotSeed).seed; } catch (e) { seed = ''; }
      return { seed, tema: (state.project && state.project.tema) || '' };
    }
    function conceptPickStale() {
      const k = currentConceptKey();
      return conceptPickIsStale(state.conceptPick, k.seed, k.tema);
    }
    function persistConceptPick() { saveConceptPick(state.conceptPick); }
    function setConceptPickStatus(text, isError) {
      conceptPickState.status = text || '';
      conceptPickState.statusError = !!isError;
      if (els.conceptPickStatus) {
        els.conceptPickStatus.textContent = conceptPickState.status;
        els.conceptPickStatus.classList.toggle('pregen-note--warn', !!isError);
      }
    }

    // Elegir re-ata la elección a la cadena y el proyecto actuales (aunque viniera de otra).
    function chooseConcept(i) {
      const pk = state.conceptPick;
      if (!pk.concepts[i]) return;
      const k = currentConceptKey();
      pk.seed = k.seed; pk.tema = k.tema; pk.index = i;
      conceptPickState.editing = -1;
      persistConceptPick();
      renderConceptPickPanel();
    }

    async function onConceptIdeate() {
      const st = conceptPickState;
      if (st.busy || state.techniques.indexOf(2) === -1) return;
      if (!isProviderConfigured(state.provider)) { renderConceptPickPanel(); return; }
      st.busy = true; st.cancelled = false; st.editing = -1;
      st.runId = generateClientRunId();
      const runId = st.runId;
      st.started = Date.now();
      const tick = () => setConceptPickStatus(`Ideando el concepto… ${Math.round((Date.now() - st.started) / 1000)}s`, false);
      tick();
      st.timer = setInterval(tick, 1000);
      renderConceptPickPanel();
      const d = deriveCreativeDirection(state.project || {}, effectiveVerticals(), state.techniques, state.ssotSeed);
      const target = state.technologies.length > 1 ? 'combined' : (state.technologies[0] || 'combined');
      let res;
      try {
        res = await runLLM({
          prompt: buildConceptIdeationPrompt(state.project || {}, effectiveVerticals(), state.technologies, target, d.creativeDirection),
          expect: 'text', runId,
        });
      } catch (e) { res = { ok: false, error: (e && e.message) || 'Error inesperado.' }; }
      if (st.runId !== runId) return; // Cancelar ya cortó esta ejecución
      st.busy = false; st.runId = null;
      if (st.timer) { clearInterval(st.timer); st.timer = null; }
      if (st.cancelled || (res && res.cancelled)) { setConceptPickStatus('Cancelado.', false); renderConceptPickPanel(); return; }
      const parsed = res && res.ok ? parseConcepts(res.text) : [];
      const concepts = resolveConcepts(parsed, state.project || {}, d.creativeDirection);
      state.conceptPick = { seed: d.seed, tema: (state.project && state.project.tema) || '', concepts, index: 0 };
      persistConceptPick();
      setConceptPickStatus(res && res.ok && parsed.length ? `Listo: ${parsed.length} concepto${parsed.length === 1 ? '' : 's'} de la IA.` : `La IA no devolvió conceptos válidos${res && res.error ? ` (${res.error})` : ''}: se muestran conceptos base sin IA.`, !(res && res.ok && parsed.length));
      renderConceptPickPanel();
    }

    function onConceptCancel() {
      const st = conceptPickState;
      if (!st.busy) return;
      st.cancelled = true;
      const runId = st.runId;
      st.runId = null; st.busy = false;
      if (st.timer) { clearInterval(st.timer); st.timer = null; }
      cancelOpencodeRun(runId);
      setConceptPickStatus('Cancelado.', false);
      renderConceptPickPanel();
    }

    function onConceptOwnToggle() {
      conceptPickState.ownOpen = !conceptPickState.ownOpen;
      conceptPickState.ownError = '';
      renderConceptPickPanel();
      if (conceptPickState.ownOpen && els.conceptOwnTitle) els.conceptOwnTitle.focus();
    }

    function onConceptOwnSubmit(ev) {
      ev.preventDefault();
      const titulo = cleanConceptText(els.conceptOwnTitle.value, 140);
      const laPaginaEs = cleanConceptText(els.conceptOwnIs.value, 500);
      const navegacion = cleanConceptText(els.conceptOwnNav.value, 600);
      if (!titulo || !laPaginaEs) {
        conceptPickState.ownError = 'Completá al menos el título y qué ES la página.';
        renderConceptPickPanel();
        return;
      }
      const k = currentConceptKey();
      const cd = deriveCreativeDirection(state.project || {}, effectiveVerticals(), state.techniques, state.ssotSeed).creativeDirection;
      const base = buildFallbackConcept(state.project || {}, cd);
      const own = Object.assign(base, { titulo, paradigma: 'Propio', laPaginaEs, source: 'user' });
      if (navegacion) own.navegacion = navegacion;
      const pk = state.conceptPick;
      const stale = conceptPickIsStale(pk, k.seed, k.tema);
      const keep = stale ? [] : pk.concepts.filter((c) => c.source !== 'user');
      state.conceptPick = { seed: k.seed, tema: k.tema, concepts: keep.concat(own), index: keep.length };
      persistConceptPick();
      conceptPickState.ownOpen = false; conceptPickState.ownError = '';
      els.conceptOwnTitle.value = ''; els.conceptOwnIs.value = ''; els.conceptOwnNav.value = '';
      setConceptPickStatus('Concepto propio elegido.', false);
      renderConceptPickPanel();
    }

    function buildConceptPickCard(c, i, chosen, stale) {
      const li = document.createElement('li');
      li.className = `concept-card${chosen ? ' concept-card--chosen' : ''}`;
      if (chosen) li.setAttribute('aria-current', 'true');
      const head = document.createElement('div');
      head.className = 'concept-card__head';
      const h4 = document.createElement('h4');
      h4.className = 'concept-card__title';
      h4.textContent = c.titulo;
      head.appendChild(h4);
      if (c.paradigma) head.appendChild(makeSpan('concept-card__badge', c.paradigma));
      if (c.source === 'fallback') head.appendChild(makeSpan('concept-card__badge concept-card__badge--soft', 'Base sin IA'));
      if (c.source === 'user') head.appendChild(makeSpan('concept-card__badge concept-card__badge--soft', 'Propio'));
      if (chosen) head.appendChild(makeSpan('concept-card__badge concept-card__badge--active', 'Elegido'));
      if (stale) head.appendChild(makeSpan('concept-card__badge concept-card__badge--soft', 'De otra cadena/proyecto'));
      li.appendChild(head);
      const editing = conceptPickState.editing === i && chosen;
      if (editing) {
        const form = document.createElement('div');
        form.className = 'concept-card__edit';
        const mk = (label, val) => {
          const l = document.createElement('label');
          l.textContent = label;
          const inp = document.createElement('input');
          inp.type = 'text';
          inp.value = val || '';
          l.appendChild(inp);
          form.appendChild(l);
          return inp;
        };
        const isInp = mk('La página es', c.laPaginaEs);
        const navInp = mk('Navegación', c.navegacion);
        const row = document.createElement('div');
        row.className = 'concept-card__actions';
        const save = document.createElement('button');
        save.type = 'button'; save.className = 'btn btn--primary btn--small'; save.textContent = 'Guardar';
        save.addEventListener('click', () => {
          const a = cleanConceptText(isInp.value, 500);
          if (a) c.laPaginaEs = a;
          c.navegacion = cleanConceptText(navInp.value, 600);
          conceptPickState.editing = -1;
          persistConceptPick();
          renderConceptPickPanel();
        });
        const cancel = document.createElement('button');
        cancel.type = 'button'; cancel.className = 'btn btn--secondary btn--small'; cancel.textContent = 'Cancelar edición';
        cancel.addEventListener('click', () => { conceptPickState.editing = -1; renderConceptPickPanel(); });
        row.appendChild(save); row.appendChild(cancel);
        form.appendChild(row);
        li.appendChild(form);
        return li;
      }
      const map = (c.mapeo || []).slice(0, 3).join(' · ') + ((c.mapeo || []).length > 3 ? ' …' : '');
      [['La página es', c.laPaginaEs], ['Navegación', c.navegacion], ['Momento firma', c.momentoFirma], ['Mapeo', map]].forEach(([k, v]) => {
        if (!v) return;
        const p = document.createElement('p');
        p.className = 'concept-card__row';
        p.appendChild(makeSpan('concept-card__label', `${k}: `));
        p.appendChild(document.createTextNode(v));
        li.appendChild(p);
      });
      const row = document.createElement('div');
      row.className = 'concept-card__actions';
      if (!chosen || stale) {
        const btn = document.createElement('button');
        btn.type = 'button'; btn.className = 'btn btn--secondary btn--small'; btn.textContent = 'Elegir este';
        btn.setAttribute('aria-label', `Elegir este concepto: ${c.titulo}`);
        btn.addEventListener('click', () => chooseConcept(i));
        row.appendChild(btn);
      }
      if (chosen && !stale) {
        const ed = document.createElement('button');
        ed.type = 'button'; ed.className = 'btn btn--secondary btn--small'; ed.textContent = 'Editar';
        ed.addEventListener('click', () => { conceptPickState.editing = i; renderConceptPickPanel(); });
        row.appendChild(ed);
      }
      li.appendChild(row);
      return li;
    }

    // El panel existe solo con la técnica 2 (concepto rector) activa.
    function renderConceptPickPanel() {
      const panel = els.conceptPickPanel;
      if (!panel) return;
      const on = state.techniques.indexOf(2) !== -1;
      panel.hidden = !on;
      if (!on) return;
      const st = conceptPickState;
      const pk = state.conceptPick;
      const configured = isProviderConfigured(state.provider);
      const stale = conceptPickStale();
      const chosen = chosenConceptOf(pk);
      els.btnConceptIdeate.disabled = st.busy || !configured;
      els.btnConceptIdeate.title = configured ? '' : 'Configurá un proveedor de IA (Configuración) para idear conceptos.';
      els.btnConceptMore.disabled = st.busy || !configured;
      els.btnConceptCancel.hidden = !st.busy;
      els.btnConceptOwn.setAttribute('aria-expanded', String(st.ownOpen));
      els.conceptOwnForm.hidden = !st.ownOpen;
      els.conceptOwnError.textContent = st.ownError;
      els.conceptPickStatus.textContent = st.status;
      els.conceptPickStatus.classList.toggle('pregen-note--warn', st.statusError);
      let note = '';
      let warn = false;
      if (!configured) { note = 'Sin proveedor de IA configurado: no se puede idear (podés escribir tu propio concepto).'; warn = true; }
      if (pk.concepts.length && stale) {
        note = `${note ? `${note} ` : ''}Estos conceptos son de otra cadena o de otro proyecto («${pk.tema}»): no se usan en el prompt hasta que elijas uno de nuevo.`;
        warn = true;
      } else if (chosen) {
        note = `${note ? `${note} ` : ''}El prompt se armará con «${chosen.titulo}», sin volver a idear el concepto ni regenerar al cambiarlo en el Generador.`;
      } else if (!note) {
        note = 'Elegí el concepto antes para no regenerar el prompt. Si no, se ideará dentro de la generación como hasta ahora.';
      } else {
        note += ' Elegí el concepto antes para no regenerar el prompt.';
      }
      els.conceptPickNote.textContent = note;
      els.conceptPickNote.classList.toggle('pregen-note--warn', warn);
      els.conceptPickList.textContent = '';
      pk.concepts.forEach((c, i) => els.conceptPickList.appendChild(buildConceptPickCard(c, i, i === pk.index, stale)));
      els.btnConceptMore.hidden = !pk.concepts.length;
    }

    /* ---------- Recursos generados ANTES del prompt (paso 2, técnicas 4 y 5) ----------
     * Genera imágenes/video (o los elige de la biblioteca) desde el paso 2 y los
     * guarda en state.pregen ('lpa_pregen_v1'). runTechniquePipeline los usa tal
     * cual (collectAssets ctx.pregen) sin volver a generar.
     */

    const pregenState = { busy: false, run: null, epoch: 0, llmRunId: null, statusRequested: false, libKind: 'image', libItems: [], libSelected: new Set(), libTrigger: null, analyzing: new Set() };

    const pregenTema = () => ((state.project && state.project.tema) || '').trim();
    const sameTema = (a, b) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
    function pregenCount() { return state.pregen.images.length + state.pregen.videos.length; }
    function pregenIsStale() { return pregenCount() > 0 && !!state.pregen.tema && !sameTema(state.pregen.tema, pregenTema()); }

    function pregenPersist() {
      state.pregen.tema = pregenCount() ? (state.pregen.tema || pregenTema()) : '';
      savePregen(state.pregen);
    }

    // Antes de sumar recursos nuevos: si los guardados son de otro proyecto, se descartan.
    function pregenFresh() {
      if (pregenIsStale()) state.pregen = emptyPregen();
      state.pregen.tema = pregenTema();
    }

    function newPregenId() { return `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`; }

    // activo devuelto por generateImageItem/generateFramesVideo/stock -> ítem persistible (URL relativa a /media)
    function toPregenItem(asset, video, origin) {
      // Remotas (internet) se guardan tal cual; las locales, sin origen ni query
      const rel = (u) => (u ? (/^https?:\/\/(?!127\.0\.0\.1|localhost)/i.test(u) ? u : (urlBase(u) || u)) : '');
      const it = {
        id: newPregenId(), url: rel(asset.url), role: asset.role || (video ? 'hero' : 'imagen'), alt: asset.alt || '',
        width: asset.width, height: asset.height, prompt: asset.prompt || '', source: asset.source || '', origin: origin || 'generated',
        analysis: asset.analysis,
      };
      if (asset.credit) { it.credit = asset.credit; if (asset.creditUrl) it.creditUrl = asset.creditUrl; }
      if (video) { it.poster = rel(asset.poster); if (asset.webm) it.webm = rel(asset.webm); it.duration = asset.duration; }
      return it;
    }

    function pregenReferenceNotes() {
      const cached = Object.keys(state.assetsCache).map((k) => state.assetsCache[k] && state.assetsCache[k].referenceNotes).find(Boolean);
      if (cached) return cached;
      try {
        const m = normalizeMedia((state.project && state.project.media) || state.media);
        const refs = m.references.filter((r) => r && r.palette && r.palette.length);
        if (refs.length) return buildReferenceNotes([{ description: '', palette: mergePalettes(refs.map((r) => r.palette), 8), name: refs.length === 1 ? refs[0].name : '' }]);
      } catch (e) { /* sin referencia */ }
      return '';
    }

    // Decisiones que ya se conocen en el paso 2 (semilla): paleta, tipografía, layout, paradigma (técnica 2).
    function pregenDirection() {
      let cd = null;
      try { cd = deriveCreativeDirection(state.project || {}, effectiveVerticals(), state.techniques, state.ssotSeed).creativeDirection; } catch (e) { cd = null; }
      if (!cd) return '';
      const lines = [summarizeDirectionForAssets({ creativeDirection: cd })];
      const hexes = paletteHexesOf(cd);
      if (hexes.length) lines.push(`- paleta (hex): ${hexes.join(', ')}`);
      if (state.techniques.indexOf(2) !== -1 && cd.interactionParadigm) lines.push(`- paradigma de interacción: ${cd.interactionParadigm}`);
      return lines.filter(Boolean).join('\n');
    }

    // Concepto rector elegido en el paso 2 (vigente y con técnica 2): los activos lo expresan.
    function pregenConceptBrief() {
      if (state.techniques.indexOf(2) === -1) return '';
      const c = chosenConceptOf(state.conceptPick);
      return c && !conceptPickStale() ? conceptBriefOf(c) : '';
    }

    function makePregenCtx(setStage) {
      const runId = generateClientRunId();
      const ctxEpoch = pregenState.epoch;
      pregenState.llmRunId = runId;
      return {
        project: state.project || {}, direction: pregenDirection(), referenceNotes: pregenReferenceNotes(),
        origin: '', api: mediaApi, conceptBrief: pregenConceptBrief(), vision: resolveVisionConfig(state.mediaPrefs, state.provider),
        llm: (prompt) => runLLM({ prompt, expect: 'text', runId }),
        setStage: setStage || (() => {}), cancelled: () => ctxEpoch !== pregenState.epoch, log: (m) => console.log(`[pregen] ${m}`),
      };
    }

    function setPregenProgress(kind, text, isError) {
      const el = kind === 'video' ? els.pregenVideosProgress : els.pregenImagesProgress;
      if (!el) return;
      el.textContent = text || '';
      el.classList.toggle('pregen-note--warn', !!isError);
    }

    function pregenSwatches(an) {
      const wrap = document.createElement('div');
      if (an.colors && an.colors.length) {
        const sw = document.createElement('span');
        sw.className = 'pregen-card__swatches';
        an.colors.forEach((hex) => {
          const dot = document.createElement('span');
          dot.className = 'pregen-card__swatch';
          dot.style.backgroundColor = hex;
          dot.title = hex;
          dot.setAttribute('role', 'img');
          dot.setAttribute('aria-label', `Color ${hex}`);
          sw.appendChild(dot);
        });
        wrap.appendChild(sw);
      }
      if (an.negativeSpace) {
        const fr = document.createElement('span');
        fr.className = 'pregen-card__free';
        fr.textContent = `espacio libre: ${an.negativeSpace}${an.source === 'local' ? ' (análisis local)' : ''}`;
        wrap.appendChild(fr);
      }
      return wrap;
    }

    function pregenCard(kind, item, index) {
      const video = kind === 'video';
      const li = document.createElement('li');
      li.className = 'pregen-card';
      li.dataset.id = item.id;
      if (video) {
        const v = document.createElement('video');
        v.className = 'pregen-card__media';
        v.muted = true; v.loop = true; v.controls = true; v.playsInline = true;
        v.setAttribute('muted', ''); v.setAttribute('loop', ''); v.setAttribute('playsinline', ''); v.setAttribute('controls', '');
        v.preload = 'metadata';
        if (item.poster) v.poster = item.poster;
        v.src = item.url;
        li.appendChild(v);
      } else {
        const img = document.createElement('img');
        img.className = 'pregen-card__media'; img.loading = 'lazy'; img.alt = item.alt || `Imagen ${index + 1}`; img.src = item.url;
        li.appendChild(img);
      }
      const tag = document.createElement('span');
      tag.className = 'pregen-card__tag';
      tag.textContent = `${item.role || (video ? 'hero' : 'imagen')} · ${item.origin === 'library' ? 'biblioteca' : (item.source || 'generado')}`;
      const badge = document.createElement('span');
      badge.className = `pregen-card__badge pregen-card__badge--${item.origin === 'stock' ? 'web' : (item.origin === 'library' ? 'lib' : 'ai')}`;
      badge.textContent = item.origin === 'stock' ? 'Internet' : (item.origin === 'library' ? 'Biblioteca' : 'IA');
      li.appendChild(badge);
      li.appendChild(tag);
      if (item.analysis) li.appendChild(pregenSwatches(item.analysis));
      else if (item.origin === 'stock') {
        const na = document.createElement('span');
        na.className = 'pregen-card__free';
        na.textContent = pregenState.analyzing.has(item.id) ? 'Analizando composición…' : 'sin análisis (visión no disponible)';
        li.appendChild(na);
      }
      let edit = null;
      if (!video && item.prompt && item.origin === 'generated') {
        edit = document.createElement('input');
        edit.type = 'text'; edit.className = 'pregen-card__edit'; edit.value = item.prompt; edit.maxLength = 800;
        edit.setAttribute('aria-label', `Prompt de la imagen ${index + 1} (editable antes de regenerar)`);
        li.appendChild(edit);
      }
      const row = document.createElement('div');
      row.className = 'pregen-card__row';
      if (item.origin === 'generated') {
        const rg = document.createElement('button');
        rg.type = 'button'; rg.className = 'btn btn--secondary'; rg.textContent = 'Regenerar'; rg.dataset.action = 'regen';
        rg.disabled = pregenState.busy;
        rg.addEventListener('click', () => (video ? onPregenVideo() : onPregenRegenImage(item.id, edit ? edit.value : '')));
        row.appendChild(rg);
      }
      const rm = document.createElement('button');
      rm.type = 'button'; rm.className = 'btn btn--link'; rm.textContent = 'Quitar'; rm.dataset.action = 'remove';
      rm.setAttribute('aria-label', `Quitar ${video ? 'video' : 'imagen'} ${item.role || index + 1}`);
      rm.disabled = pregenState.busy;
      rm.addEventListener('click', () => onPregenRemove(kind, item.id));
      row.appendChild(rm);
      li.appendChild(row);
      return li;
    }

    function pregenPending(text) {
      const li = document.createElement('li');
      li.className = 'pregen-card pregen-card--pending';
      const box = document.createElement('div');
      box.className = 'pregen-card__media';
      box.textContent = text;
      li.appendChild(box);
      return li;
    }

    function renderPregenPanel() {
      if (!els.pregenPanel) return;
      const has4 = state.techniques.indexOf(4) !== -1;
      const has5 = state.techniques.indexOf(5) !== -1;
      els.pregenPanel.hidden = !(has4 || has5);
      if (els.pregenPanel.hidden) return;
      els.pregenImagesBlock.hidden = !has4;
      els.pregenVideosBlock.hidden = !has5;
      const status = mediaStatusCache;
      if (!status && !pregenState.statusRequested) {
        pregenState.statusRequested = true;
        fetchMediaStatus().then(() => renderPregenPanel()).catch(() => {});
      }
      const be = describeMediaBackends(status || { unreachable: true }, state.mediaPrefs);
      els.pregenBackend.textContent = status ? be.line : 'Consultando los servicios de multimedia…';
      const busy = pregenState.busy;
      els.btnPregenImage.disabled = busy || !be.images.ok;
      els.btnPregenVideo.disabled = busy || !be.videos.ok;
      els.btnPregenImage.title = be.images.ok ? '' : `Imágenes: ${be.images.label}. Elegí de la biblioteca.`;
      els.btnPregenVideo.title = be.videos.ok ? '' : `Video: ${be.videos.label}. Elegí de la biblioteca.`;
      els.btnPregenImageLib.disabled = busy;
      els.btnPregenVideoLib.disabled = busy;

      // Nota: de otro proyecto / sugerencia / resumen
      const missing = [];
      if (has4 && !state.pregen.images.length) missing.push('imágenes');
      if (has5 && !state.pregen.videos.length) missing.push('video');
      let note = '';
      let warn = false;
      if (pregenIsStale()) {
        note = `Estos recursos son de otro proyecto («${state.pregen.tema}»). Se descartan al generar nuevos; quitalos o usalos igual.`;
        warn = true;
      } else if (missing.length) {
        note = `Podés generarlos antes para verlos y elegir (${missing.join(' y ')}). Si no, se generan dentro del prompt como hasta ahora.`;
      } else {
        const a = has4 ? state.pregen.images.length : 0;
        const b = has5 ? state.pregen.videos.length : 0;
        note = `El prompt se armará con ${[a ? `${a} imagen${a === 1 ? '' : 'es'}` : '', b ? `${b} video${b === 1 ? '' : 's'}` : ''].filter(Boolean).join(' y ')} ya generad${a + b === 1 && !a ? 'o' : 'as'}.`;
      }
      els.pregenNote.textContent = note;
      els.pregenNote.classList.toggle('pregen-note--warn', warn);

      const run = pregenState.run;
      els.pregenImagesGrid.textContent = '';
      state.pregen.images.forEach((it, i) => {
        if (run && run.regenId === it.id) els.pregenImagesGrid.appendChild(pregenPending('Regenerando…'));
        else els.pregenImagesGrid.appendChild(pregenCard('image', it, i));
      });
      if (run && run.kind === 'images') {
        for (let k = run.added; k < run.total; k++) els.pregenImagesGrid.appendChild(pregenPending(k === run.added ? `Generando ${k + 1}/${run.total}…` : 'En cola'));
      }
      els.pregenVideosGrid.textContent = '';
      state.pregen.videos.forEach((it, i) => {
        if (run && run.kind === 'video') els.pregenVideosGrid.appendChild(pregenPending('Regenerando…'));
        else els.pregenVideosGrid.appendChild(pregenCard('video', it, i));
      });
      if (run && run.kind === 'video' && !state.pregen.videos.length) els.pregenVideosGrid.appendChild(pregenPending('Generando…'));
      updatePregenSearchControls();
    }

    function pregenBackendOrExplain(kind) {
      const be = describeMediaBackends(mediaStatusCache || { unreachable: true }, state.mediaPrefs);
      const b = kind === 'video' ? be.videos : be.images;
      if (!b.ok) setPregenProgress(kind, `${kind === 'video' ? 'Video' : 'Imágenes'}: ${b.label}. Elegí de la biblioteca.`, true);
      return b.ok;
    }

    async function onPregenImages() {
      if (pregenState.busy) return;
      const status = await fetchMediaStatus();
      if (!pregenBackendOrExplain('image')) { renderPregenPanel(); return; }
      pregenState.busy = true;
      pregenState.run = { kind: 'images', total: 0, added: 0 };
      const ep = pregenState.epoch;
      const gone = () => ep !== pregenState.epoch; // "Limpiar todo" corrió mientras se generaba
      setPregenProgress('image', 'Diseñando imágenes a generar…');
      renderPregenPanel();
      const errors = [];
      try {
        const c = makePregenCtx((l) => setPregenProgress('image', l));
        const res = await c.llm(buildImagePromptsPrompt({ project: c.project, referenceNotes: c.referenceNotes, direction: c.direction, restrictions: state.techniques.indexOf(7) !== -1, conceptBrief: c.conceptBrief }));
        if (gone()) return;
        const prompts = (res && res.ok) ? parseImagePrompts(res.text) : [];
        if (!prompts.length) {
          setPregenProgress('image', `El modelo no propuso prompts de imagen utilizables${res && !res.ok && res.error ? ` (${res.error})` : ''}. Probá de nuevo o elegí de la biblioteca.`, true);
          return;
        }
        pregenFresh();
        state.pregen.images = state.pregen.images.filter((x) => x.origin !== 'generated');
        pregenState.run.total = prompts.length;
        for (let i = 0; i < prompts.length; i++) {
          setPregenProgress('image', `Generando imagen ${i + 1}/${prompts.length}…`);
          renderPregenPanel();
          // eslint-disable-next-line no-await-in-loop -- secuencial: cuota gratuita y consistencia
          const g = await generateImageItem(c, prompts[i]);
          if (gone()) return;
          if (g.item) {
            setPregenProgress('image', `Analizando imagen ${i + 1}/${prompts.length}…`);
            const it = toPregenItem(g.item, false, 'generated');
            // eslint-disable-next-line no-await-in-loop
            await analyzeGeneratedTargets([{ item: it, url: it.url, role: it.role }], c, status);
            if (gone()) return;
            if (state.pregen.images.length < PREGEN_MAX_ITEMS) state.pregen.images.push(it);
          } else errors.push(`imagen ${i + 1}: ${g.error}`);
          pregenState.run.added = i + 1;
          pregenPersist();
        }
        setPregenProgress('image', errors.length ? `Listo, con fallos (${errors.join('; ')}).` : `Listo: ${prompts.length} imágenes.`, errors.length > 0);
      } catch (e) {
        if (!gone()) setPregenProgress('image', `No se pudieron generar las imágenes: ${(e && e.message) || e}`, true);
      } finally {
        if (!gone()) {
          pregenState.busy = false; pregenState.run = null;
          pregenPersist();
          renderPregenPanel();
        }
      }
    }

    async function onPregenRegenImage(id, editedPrompt) {
      if (pregenState.busy) return;
      const it = state.pregen.images.find((x) => x.id === id);
      if (!it) return;
      const prompt = String(editedPrompt || it.prompt || '').trim();
      if (prompt.length < 12) { setPregenProgress('image', 'El prompt de esta imagen es muy corto para regenerar.', true); return; }
      const status = await fetchMediaStatus();
      if (!pregenBackendOrExplain('image')) { renderPregenPanel(); return; }
      pregenState.busy = true;
      pregenState.run = { kind: 'images', total: 0, added: 0, regenId: id };
      const ep = pregenState.epoch;
      const gone = () => ep !== pregenState.epoch;
      setPregenProgress('image', 'Regenerando imagen…');
      renderPregenPanel();
      try {
        const c = makePregenCtx();
        const g = await generateImageItem(c, { prompt, role: it.role, width: it.width || IMAGE_SIZES.landscape[0], height: it.height || IMAGE_SIZES.landscape[1] });
        if (gone()) return;
        if (g.item) {
          const fresh = toPregenItem(g.item, false, 'generated');
          fresh.id = it.id;
          await analyzeGeneratedTargets([{ item: fresh, url: fresh.url, role: fresh.role }], c, status);
          if (gone()) return;
          const idx = state.pregen.images.findIndex((x) => x.id === id);
          if (idx !== -1) state.pregen.images[idx] = fresh;
          setPregenProgress('image', 'Imagen regenerada.');
        } else setPregenProgress('image', `No se pudo regenerar: ${g.error}`, true);
      } catch (e) {
        if (!gone()) setPregenProgress('image', `No se pudo regenerar: ${(e && e.message) || e}`, true);
      } finally {
        if (!gone()) {
          pregenState.busy = false; pregenState.run = null;
          pregenPersist();
          renderPregenPanel();
        }
      }
    }

    async function onPregenVideo() {
      if (pregenState.busy) return;
      const status = await fetchMediaStatus();
      if (!pregenBackendOrExplain('video')) { renderPregenPanel(); return; }
      pregenState.busy = true;
      pregenState.run = { kind: 'video', total: 1, added: 0 };
      const ep = pregenState.epoch;
      const gone = () => ep !== pregenState.epoch;
      setPregenProgress('video', 'Preparando el video…');
      renderPregenPanel();
      try {
        const c = makePregenCtx((l) => setPregenProgress('video', l));
        const mode = state.mediaPrefs.video || 'generated';
        let video = null;
        const notices = [];
        if (mode === 'generated') {
          const r = await generateFramesVideo(c, status, c.referenceNotes);
          if (r.video) video = r.video;
          else notices.push(`No se generó el video (${r.why}); se usa un video de stock como respaldo.`);
        }
        if (!video) {
          const s = await searchStockVideos(c, status, []);
          if (s.videos[0]) video = s.videos[0];
          s.notices.forEach((n) => notices.push(n));
        }
        if (gone()) return;
        if (!video) {
          setPregenProgress('video', notices.join(' ') || 'No se pudo obtener un video.', true);
          return;
        }
        const it = toPregenItem(video, true, 'generated');
        if (it.poster && /^\/media\//.test(it.poster)) {
          setPregenProgress('video', 'Analizando el póster…');
          await analyzeGeneratedTargets([{ item: it, url: it.poster, role: it.role }], c, status);
        }
        if (gone()) return;
        pregenFresh();
        state.pregen.videos = state.pregen.videos.filter((x) => x.origin !== 'generated').concat(it).slice(-PREGEN_MAX_ITEMS);
        setPregenProgress('video', notices.length ? notices.join(' ') : 'Video listo.', false);
      } catch (e) {
        if (!gone()) setPregenProgress('video', `No se pudo generar el video: ${(e && e.message) || e}`, true);
      } finally {
        if (!gone()) {
          pregenState.busy = false; pregenState.run = null;
          pregenPersist();
          renderPregenPanel();
        }
      }
    }

    function onPregenRemove(kind, id) {
      if (pregenState.busy) return;
      const key = kind === 'video' ? 'videos' : 'images';
      state.pregen[key] = state.pregen[key].filter((x) => x.id !== id);
      pregenPersist();
      setPregenProgress(kind, '');
      renderPregenPanel();
    }

    /* ----- Biblioteca (siempre disponible; única vía sin APIs) ----- */

    function closePregenLibrary() {
      if (!els.pregenLibrary || els.pregenLibrary.hidden) return;
      els.pregenLibrary.hidden = true;
      const back = pregenState.libTrigger;
      pregenState.libTrigger = null;
      if (back && typeof back.focus === 'function') back.focus();
    }

    function refreshLibraryAddButton() {
      const n = pregenState.libSelected.size;
      els.btnPregenLibraryAdd.disabled = n === 0;
      els.btnPregenLibraryAdd.textContent = n ? `Usar seleccionados (${n})` : 'Usar seleccionados';
    }

    async function openPregenLibrary(kind, trigger) {
      if (!els.pregenLibrary) return;
      pregenState.libKind = kind;
      pregenState.libItems = [];
      pregenState.libSelected = new Set();
      pregenState.libTrigger = trigger || null;
      els.pregenLibraryTitle.textContent = kind === 'video' ? 'Biblioteca de videos' : 'Biblioteca de imágenes';
      els.pregenLibraryRole.textContent = '';
      MEDIA_ROLES.forEach((r) => { const o = document.createElement('option'); o.value = r; o.textContent = r; els.pregenLibraryRole.appendChild(o); });
      els.pregenLibraryRole.value = 'hero';
      els.pregenLibraryGrid.textContent = '';
      els.pregenLibraryStatus.textContent = 'Cargando la biblioteca…';
      refreshLibraryAddButton();
      els.pregenLibrary.hidden = false;
      if (els.btnPregenLibraryClose) els.btnPregenLibraryClose.focus();
      const r = await mediaFetch(`/library?type=${kind === 'video' ? 'video' : 'image'}`);
      if (!r.ok) { els.pregenLibraryStatus.textContent = r.error; return; }
      const items = Array.isArray(r.data.items) ? r.data.items : [];
      pregenState.libItems = items;
      if (!items.length) { els.pregenLibraryStatus.textContent = kind === 'video' ? 'Todavía no hay videos en la biblioteca.' : 'Todavía no hay imágenes en la biblioteca.'; return; }
      els.pregenLibraryStatus.textContent = `${items.length}${r.data.total > items.length ? ` de ${r.data.total}` : ''} archivo${items.length === 1 ? '' : 's'}, los más nuevos primero. Tocá para elegir.`;
      items.forEach((it, i) => {
        const li = document.createElement('li');
        li.className = 'pregen-library-item';
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.setAttribute('aria-pressed', 'false');
        btn.dataset.index = String(i);
        btn.setAttribute('aria-label', `${it.name} (${it.label || it.origin})`);
        let media;
        if (kind === 'video' && !it.poster) {
          media = document.createElement('video');
          media.muted = true; media.preload = 'metadata'; media.src = it.url;
        } else {
          media = document.createElement('img');
          media.loading = 'lazy'; media.alt = ''; media.src = kind === 'video' ? it.poster : it.url;
        }
        btn.appendChild(media);
        btn.appendChild(makeSpan('', `${it.label || it.origin} · ${it.name}`));
        btn.addEventListener('click', () => {
          const on = !pregenState.libSelected.has(i);
          if (on) pregenState.libSelected.add(i); else pregenState.libSelected.delete(i);
          btn.setAttribute('aria-pressed', String(on));
          refreshLibraryAddButton();
        });
        li.appendChild(btn);
        els.pregenLibraryGrid.appendChild(li);
      });
    }

    async function onPregenLibraryAdd() {
      const kind = pregenState.libKind;
      const key = kind === 'video' ? 'videos' : 'images';
      const role = els.pregenLibraryRole.value || 'hero';
      const chosen = Array.from(pregenState.libSelected).sort((a, b) => a - b).map((i) => pregenState.libItems[i]).filter(Boolean);
      if (!chosen.length) return;
      pregenFresh();
      const have = new Set(state.pregen[key].map((x) => urlBase(x.url)));
      const added = [];
      chosen.forEach((f) => {
        if (have.has(urlBase(f.url)) || state.pregen[key].length >= PREGEN_MAX_ITEMS) return;
        const it = toPregenItem({ url: f.url, poster: f.poster || '', role, alt: `${role} de la biblioteca (${f.name})`, source: 'biblioteca' }, kind === 'video', 'library');
        state.pregen[key].push(it);
        added.push(it);
      });
      pregenPersist();
      closePregenLibrary();
      setPregenProgress(kind === 'video' ? 'video' : 'image', added.length ? `${added.length} de la biblioteca agregad${added.length === 1 ? 'o' : 'os'}.` : `No se agregó nada (duplicados o tope de ${PREGEN_MAX_ITEMS}).`);
      renderPregenPanel();
      // Análisis de composición en segundo plano (local o Gemini): no bloquea la UI
      const targets = added.map((it) => ({ item: it, url: kind === 'video' ? it.poster : it.url, role: it.role })).filter((tg) => tg.url && /^\/(media|banco)\//.test(tg.url));
      if (targets.length) {
        try {
          const status = await fetchMediaStatus();
          await analyzeGeneratedTargets(targets, makePregenCtx(), status);
          pregenPersist();
          renderPregenPanel();
        } catch (e) { /* el análisis es opcional */ }
      }
    }

    /* ----- Buscar en internet (modal; Pexels / Pixabay según Configuración) -----
     * Muestra de a 3 resultados grandes; las elegidas persisten al paginar ("Otras 3").
     * Lo agregado entra a state.pregen con origin 'stock' y se analiza igual que lo
     * generado; los créditos se guardan para el panel Recursos (no van a la página). */

    const WEB_PAGE = 3;
    const WEB_MAX = 12;
    const web = {
      kind: 'images', items: [], requested: 0, exhausted: false, offset: 0, loading: false, suggesting: false,
      message: '', selected: new Map(), suggestions: [], trigger: null, cache: new Map(), key: '',
    };
    const webEl = (id) => document.getElementById(`pregen-web-${id}`);
    const webBtn = (id) => document.getElementById(`btn-pregen-web-${id}`);
    const webOrient = () => { const r = document.querySelector('input[name="pregen-web-orient"]:checked'); return r ? r.value : 'landscape'; };

    // ¿Hay un servicio de stock utilizable según el estado del servidor, las claves del navegador y Configuración?
    function pregenStockAvailability() {
      const st = mediaStatusCache;
      if (!st) return { ok: false, hint: 'Consultando los servicios de multimedia…' };
      if (st.unreachable) return { ok: false, hint: 'No se pudo consultar node server.js: la búsqueda en internet no está disponible.' };
      const pref = state.mediaPrefs && state.mediaPrefs.stock;
      if (pref === 'none') return { ok: false, hint: 'La búsqueda de stock está desactivada en Configuración.' };
      const ok = pref === 'pexels' ? !!st.pexels : (pref === 'pixabay' ? !!st.pixabay : !!(st.pexels || st.pixabay));
      return ok ? { ok: true, hint: '' } : { ok: false, hint: 'Cargá la clave de Pexels o Pixabay en Configuración' };
    }

    function isWebDialogOpen() { const d = els.pregenWeb; return !!d && (d.open === true || d.hasAttribute('open')); }

    // Botones del panel + estado del modal
    function updatePregenSearchControls() {
      const av = pregenStockAvailability();
      [['image', els.btnPregenImageWeb], ['video', els.btnPregenVideoWeb]].forEach(([, btn]) => {
        if (!btn) return;
        btn.disabled = !av.ok || pregenState.busy;
        btn.title = av.ok ? '' : av.hint;
      });
      if (!isWebDialogOpen()) return;
      const working = web.loading || web.suggesting;
      const q = webEl('q');
      q.disabled = !av.ok;
      webBtn('search').disabled = !av.ok || working;
      webBtn('suggest').disabled = !av.ok || working;
      document.querySelectorAll('input[name="pregen-web-orient"]').forEach((r) => { r.disabled = !av.ok; });
      webEl('status').textContent = av.ok ? web.message : av.hint;
      webEl('status').classList.toggle('pregen-note--warn', !av.ok);
      const n = web.selected.size;
      webEl('count').textContent = `${n} elegida${n === 1 ? '' : 's'}`;
      webBtn('add').disabled = n === 0 || pregenState.busy || working;
      const hasMore = web.items.length > web.offset + WEB_PAGE || (!web.exhausted && web.items.length > 0);
      webEl('pager').hidden = !web.items.length;
      webBtn('more').disabled = working || !hasMore;
    }

    function fmtDuration(sec) {
      const s = Math.round(Number(sec));
      return s > 0 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : '';
    }

    function defaultWebRole() {
      const used = Array.from(web.selected.values()).map((x) => x.role);
      return used.indexOf('hero') === -1 ? 'hero' : 'galería';
    }

    function renderWebCards(focusIndex) {
      const list = webEl('results');
      list.textContent = '';
      list.classList.toggle('pregen-web__cards--video', web.kind === 'videos');
      if (web.loading) {
        for (let i = 0; i < WEB_PAGE; i++) {
          const sk = document.createElement('li');
          sk.className = 'pregen-web__card pregen-web__card--skeleton';
          sk.setAttribute('aria-hidden', 'true');
          list.appendChild(sk);
        }
        updatePregenSearchControls();
        return;
      }
      const video = web.kind === 'videos';
      const page = web.items.slice(web.offset, web.offset + WEB_PAGE);
      page.forEach((it, i) => {
        const sel = web.selected.get(it.url);
        const li = document.createElement('li');
        li.className = `pregen-web__card${sel ? ' pregen-web__card--on' : ''}`;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'pregen-web__toggle';
        btn.dataset.index = String(i);
        btn.setAttribute('aria-pressed', sel ? 'true' : 'false');
        btn.setAttribute('aria-label', `${video ? 'Video' : 'Imagen'} ${web.offset + i + 1}${it.alt ? `: ${it.alt}` : ''}${it.credit ? `. ${it.credit}` : ''}`);
        let media;
        if (video) {
          media = document.createElement('video');
          media.muted = true; media.loop = true; media.playsInline = true; media.preload = 'none';
          media.setAttribute('muted', ''); media.setAttribute('playsinline', '');
          if (it.poster) media.poster = it.poster;
          media.src = it.url;
          const play = () => { try { const p = media.play(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* sin vista previa */ } };
          const stop = () => { try { media.pause(); } catch (e) { /* nada */ } };
          btn.addEventListener('mouseenter', play); btn.addEventListener('focus', play);
          btn.addEventListener('mouseleave', stop); btn.addEventListener('blur', stop);
        } else {
          media = document.createElement('img');
          media.setAttribute('loading', 'lazy'); media.alt = ''; media.src = it.url;
        }
        media.className = 'pregen-web__media';
        btn.appendChild(media);
        const dur = video ? fmtDuration(it.duration) : '';
        if (dur) btn.appendChild(makeSpan('pregen-web__duration', dur));
        btn.appendChild(makeSpan('pregen-web__check', sel ? '✓ Me quedo con esta' : 'Tocá para elegir'));
        btn.addEventListener('click', () => {
          if (web.selected.has(it.url)) web.selected.delete(it.url);
          else web.selected.set(it.url, { it, role: defaultWebRole() });
          renderWebCards(i);
        });
        btn.addEventListener('keydown', (e) => {
          const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
          if (!step) return;
          e.preventDefault();
          const next = list.querySelectorAll('.pregen-web__toggle')[i + step];
          if (next) next.focus();
        });
        li.appendChild(btn);
        li.appendChild(makeSpan('pregen-web__meta', [it.source || '', it.credit || ''].filter(Boolean).join(' · ')));
        if (sel) {
          const role = document.createElement('select');
          role.className = 'pregen-web__role';
          role.setAttribute('aria-label', `Rol de la ${video ? 'video' : 'imagen'} elegida ${web.offset + i + 1}`);
          MEDIA_ROLES.forEach((r) => { const o = document.createElement('option'); o.value = r; o.textContent = r; role.appendChild(o); });
          role.value = sel.role;
          role.addEventListener('change', () => { sel.role = role.value; });
          li.appendChild(role);
        }
        list.appendChild(li);
      });
      if (focusIndex !== undefined) {
        const f = list.querySelectorAll('.pregen-web__toggle')[focusIndex];
        if (f) f.focus();
      }
      updatePregenSearchControls();
    }

    // Garantiza `need` resultados en web.items. Pide WEB_MAX de una sola vez
    // (antes pedía 3, 6, 9… y re-descargaba lo ya visto en cada "Otras 3"):
    // la paginación se sirve de lo descargado, sin nuevos pedidos a la API.
    async function webEnsure(need, q, orientation) {
      if (web.items.length >= need || web.exhausted) return;
      const perQuery = WEB_MAX;
      let r;
      try {
        r = await mediaApi.search({ queries: [{ query: q, orientation }], type: web.kind === 'videos' ? 'video' : 'photo', perQuery });
      } catch (e) { r = { ok: false, error: 'La búsqueda falló.' }; }
      if (!r || !r.ok) { web.error = (r && r.error) || 'La búsqueda falló.'; return; }
      const items = (Array.isArray(r.data.items) ? r.data.items : [])
        .filter((it) => it && typeof it.url === 'string' && /^(?:https:\/\/|\/media\/)/.test(it.url)).slice(0, WEB_MAX);
      web.notice = (Array.isArray(r.data.notices) ? r.data.notices : []).find(Boolean) || '';
      web.items = items;
      web.requested = perQuery;
      web.exhausted = items.length < perQuery || perQuery >= WEB_MAX;
      web.cache.set(web.key, { items, requested: perQuery, exhausted: web.exhausted });
    }

    async function onWebSearch() {
      if (web.loading || !pregenStockAvailability().ok) return;
      const q = webEl('q').value.trim();
      if (!q) { web.message = 'Escribí qué querés buscar.'; updatePregenSearchControls(); webEl('q').focus(); return; }
      const orientation = webOrient();
      web.key = `${web.kind}|${q.toLowerCase()}|${orientation}`;
      const hit = web.cache.get(web.key);
      web.items = hit ? hit.items : []; web.requested = hit ? hit.requested : 0; web.exhausted = hit ? hit.exhausted : false;
      web.offset = 0; web.error = ''; web.notice = '';
      web.loading = true; web.message = 'Buscando en internet…';
      renderWebCards();
      await webEnsure(WEB_PAGE, q, orientation);
      web.loading = false;
      const n = web.items.slice(0, WEB_PAGE).length;
      web.message = web.error ? web.error : (n ? `${n} resultado${n === 1 ? '' : 's'}. Tocá los que te sirvan y elegí su rol.` : (web.notice || `Sin resultados para «${q}». Probá otras palabras.`));
      renderWebCards();
    }

    async function onWebMore() {
      if (web.loading) return;
      const q = webEl('q').value.trim() || web.key.split('|')[1] || '';
      const next = web.offset + WEB_PAGE;
      if (web.items.length < next + 1) {
        web.loading = true; web.message = 'Buscando más…';
        renderWebCards();
        await webEnsure(next + WEB_PAGE, q, webOrient());
        web.loading = false;
      }
      if (web.items.length > next) {
        web.offset = next;
        const n = web.items.slice(next, next + WEB_PAGE).length;
        web.message = `${n} resultado${n === 1 ? '' : 's'} más. Lo que elegiste se mantiene.`;
      } else {
        web.exhausted = true;
        web.message = web.error || 'No hay más resultados para esta búsqueda.';
      }
      renderWebCards(0);
    }

    function onWebNew() {
      web.items = []; web.offset = 0; web.exhausted = false; web.message = '';
      webEl('results').textContent = '';
      webEl('q').focus(); webEl('q').select();
      updatePregenSearchControls();
    }

    function openPregenWeb(kind, trigger) {
      if (!els.pregenWeb || !pregenStockAvailability().ok) return;
      web.kind = kind === 'video' ? 'videos' : 'images';
      web.trigger = trigger || null;
      web.items = []; web.offset = 0; web.exhausted = false; web.loading = false; web.suggesting = false;
      web.message = ''; web.selected = new Map(); web.suggestions = []; web.error = '';
      webEl('title').textContent = web.kind === 'videos' ? 'Buscar videos en internet' : 'Buscar imágenes en internet';
      webEl('q').value = '';
      webEl('suggestions').textContent = '';
      webEl('results').textContent = '';
      const first = document.querySelector('input[name="pregen-web-orient"][value="landscape"]');
      if (first) first.checked = true;
      if (typeof els.pregenWeb.showModal === 'function') els.pregenWeb.showModal(); else els.pregenWeb.setAttribute('open', '');
      updatePregenSearchControls();
      webEl('q').focus();
    }

    function closePregenWeb() {
      if (!isWebDialogOpen()) return;
      if (typeof els.pregenWeb.close === 'function') els.pregenWeb.close(); else els.pregenWeb.removeAttribute('open');
      const back = web.trigger;
      web.trigger = null;
      if (back && typeof back.focus === 'function') back.focus();
    }

    function onWebKeydown(e) {
      if (e.key === 'Escape') { e.preventDefault(); closePregenWeb(); return; }
      if (e.key !== 'Tab') return;
      // Trampa de foco (el <dialog> modal ya la da; esto cubre navegadores sin showModal)
      const f = Array.from(els.pregenWeb.querySelectorAll('button, input, select')).filter((x) => !x.disabled && !x.hidden && !x.closest('[hidden]'));
      if (!f.length) return;
      const first = f[0]; const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }

    // Una sola llamada al LLM, solo al tocar «Sugerir búsqueda».
    async function onWebSuggest() {
      if (web.loading || web.suggesting || !pregenStockAvailability().ok) return;
      web.suggesting = true; web.message = 'Pensando búsquedas…';
      updatePregenSearchControls();
      let qs = [];
      let err = '';
      try {
        const c = makePregenCtx();
        const res = await c.llm(buildSuggestSearchPrompt({ project: c.project, direction: c.direction, referenceNotes: c.referenceNotes, conceptBrief: c.conceptBrief, video: web.kind === 'videos' }));
        if (res && res.ok) qs = parseSearchQueries(res.text).photos.slice(0, 3);
        else err = (res && res.error) || '';
      } catch (e) { err = (e && e.message) || ''; }
      web.suggesting = false;
      web.suggestions = qs;
      const box = webEl('suggestions');
      box.textContent = '';
      qs.forEach((sg) => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'btn btn--link pregen-search__chip'; b.textContent = sg.query;
        b.addEventListener('click', () => {
          webEl('q').value = sg.query;
          const r = document.querySelector(`input[name="pregen-web-orient"][value="${sg.orientation}"]`);
          if (r) r.checked = true;
          webEl('q').focus();
        });
        box.appendChild(b);
      });
      if (qs.length) {
        webEl('q').value = qs[0].query;
        const r = document.querySelector(`input[name="pregen-web-orient"][value="${qs[0].orientation}"]`);
        if (r) r.checked = true;
        web.message = `Sugerencia lista${qs.length > 1 ? ` (${qs.length} opciones abajo)` : ''}: tocá «Buscar».`;
      } else web.message = `El modelo no propuso búsquedas utilizables${err ? ` (${err})` : ''}. Escribí la tuya.`;
      updatePregenSearchControls();
    }

    async function onWebAdd() {
      if (pregenState.busy || !web.selected.size) return;
      const video = web.kind === 'videos';
      const key = video ? 'videos' : 'images';
      const chosen = Array.from(web.selected.values());
      closePregenWeb();
      pregenFresh();
      const have = new Set(state.pregen[key].map((x) => urlBase(x.url)));
      const added = [];
      chosen.forEach(({ it, role }) => {
        if (have.has(urlBase(it.url)) || state.pregen[key].length >= PREGEN_MAX_ITEMS) return;
        have.add(urlBase(it.url));
        const item = toPregenItem({
          url: it.url, poster: it.poster || '', role, alt: it.alt || '', width: it.width, height: it.height, duration: it.duration,
          source: it.source || 'stock', credit: it.credit, creditUrl: it.creditUrl,
        }, video, 'stock');
        state.pregen[key].push(item);
        added.push(item);
      });
      web.selected = new Map();
      pregenPersist();
      const kindName = video ? 'video' : 'image';
      setPregenProgress(kindName, added.length ? `${added.length} de internet agregad${added.length === 1 ? 'o' : 'os'}; analizando su composición…` : `No se agregó nada (duplicados o tope de ${PREGEN_MAX_ITEMS}).`);
      const targets = added.map((it) => ({ item: it, url: video ? it.poster : it.url, role: it.role })).filter((tg) => tg.url);
      targets.forEach((tg) => pregenState.analyzing.add(tg.item.id));
      renderPregenPanel();
      if (!added.length) return;
      if (!targets.length) { setPregenProgress(kindName, `${added.length} agregado${added.length === 1 ? '' : 's'} sin póster: sin análisis de composición.`); return; }
      try {
        const status = await fetchMediaStatus();
        await analyzeGeneratedTargets(targets, makePregenCtx(), status);
      } catch (e) { /* el análisis es opcional */ }
      targets.forEach((tg) => pregenState.analyzing.delete(tg.item.id));
      pregenPersist();
      setPregenProgress(kindName, `${added.length} de internet agregad${added.length === 1 ? 'o' : 'os'}.`);
      renderPregenPanel();
    }

    function onSsotNew() {
      els.ssotSeedError.textContent = '';
      els.ssotSeedInput.removeAttribute('aria-invalid');
      els.ssotSeedInput.value = '';
      setSsotSeed(generateSsotSeed());
      els.ssotActionStatus.textContent = 'Se generó una cadena nueva.';
    }

    async function onSsotCopy() {
      const ok = await copyText(state.ssotSeed);
      els.ssotActionStatus.textContent = ok ? 'Cadena copiada al portapapeles.' : 'No se pudo copiar. Seleccioná la cadena y copiala a mano.';
    }

    function onSsotApply() {
      const res = validateSsotSeedInput(els.ssotSeedInput.value);
      els.ssotActionStatus.textContent = '';
      if (!res.ok) {
        els.ssotSeedError.textContent = res.error;
        els.ssotSeedInput.setAttribute('aria-invalid', 'true');
        return;
      }
      els.ssotSeedError.textContent = '';
      els.ssotSeedInput.removeAttribute('aria-invalid');
      els.ssotSeedInput.value = '';
      setSsotSeed(res.seed);
      els.ssotActionStatus.textContent = 'Se aplicó tu cadena.';
    }

    function onGenerateClick() {
      els.errContexto.textContent = '';
      if (els.errVerticalOtro) els.errVerticalOtro.textContent = '';
      if (state.customVerticalOn && !cleanCustomVertical(state.customVertical)) {
        els.errVerticalOtro.textContent = 'Escribí tu rubro o desactivá «Otro…».';
        els.inputVerticalOtro.focus();
        return;
      }
      if (!state.technologies.length) {
        els.errContexto.textContent = 'Elegí al menos una tecnología para continuar.';
        return;
      }
      const conflicting = state.technologies.filter((k) => techBlockers(k, state.technologies).length);
      if (conflicting.length) {
        els.errContexto.textContent = `Hay tecnologías incompatibles entre sí (${conflicting.map((k) => TECHNOLOGIES[k].label).join(', ')}). Dejá solo una de cada grupo.`;
        return;
      }
      state.genTechniques = state.techniques.slice();
      state.genEpoch++; // recursos nuevos (búsqueda/generación) para esta tanda de prompts
      state.assetsCache = {};
      state.templateGeneration = generateTemplatePrompt(state.project, effectiveVerticals(), state.technologies, state.genTechniques, undefined, { seed: state.ssotSeed });
      state.modelPrompts = {};
      state.edits = {};
      const tabs = getTabList();
      state.activeTab = tabs[tabs.length - 1].tech; // combinado si hay ≥2 tecnologías, si no la única
      renderGenerador();
      goto('generador');
      ensureTabGenerated(state.activeTab, false);
    }

    /* ---------- Generador: generación de prompt POR MODELO (Feature 1) ---------- */

    // Lista de pestañas SIN generar texto todavía (lazy): una por tecnología
    // + "combinado" si hay ≥2. El texto real se pide recién cuando se abre
    // la pestaña (ensureTabGenerated), y se cachea por tabKey.
    function getTabList() {
      const tabs = state.technologies.map((t) => ({ tech: t, label: TECHNOLOGIES[t] ? TECHNOLOGIES[t].label : t }));
      if (state.technologies.length >= 2) {
        tabs.push({ tech: 'combinado', label: `Combinado (${state.technologies.map((t) => TECHNOLOGIES[t].label).join(' + ')})` });
      }
      return tabs;
    }

    function getTemplateEntry(tabKey) {
      if (!state.templateGeneration) return null;
      if (tabKey === 'combinado') return state.templateGeneration.combined;
      return state.templateGeneration.perTech.find((p) => p.tech === tabKey);
    }

    function extractConstraintsFromValidation(validation, techniques) {
      if (!hasTechnique(techniques, 7)) return ['Sin restricciones negativas (técnica 7 desactivada): rigen solo los no-negociables de accesibilidad y seguridad.'];
      const block = validation.sections['RESTRICCIONES NEGATIVAS'] || '';
      const lines = block.split('\n').map((l) => l.trim()).filter((l) => l.indexOf('- ') === 0).map((l) => l.slice(2).trim());
      return lines.length ? lines : ['(ver bloque RESTRICCIONES NEGATIVAS del prompt generado)'];
    }

    let genTimerHandle = null;
    function startGenElapsedTimer() {
      if (genTimerHandle) return;
      genTimerHandle = setInterval(() => {
        const entry = state.modelPrompts[state.activeTab];
        if (entry && entry.status === 'loading') renderPromptPanel();
      }, 1000);
    }
    function stopGenElapsedTimerIfIdle() {
      const anyLoading = Object.keys(state.modelPrompts).some((k) => state.modelPrompts[k] && state.modelPrompts[k].status === 'loading');
      if (!anyLoading && genTimerHandle) { clearInterval(genTimerHandle); genTimerHandle = null; }
    }

    // Opciones de validación de una pestaña: las técnicas con las que se
    // generó ese prompt definen qué encabezados y reglas se exigen.
    function getValidationOpts(tabKey) {
      const entry = state.modelPrompts[tabKey];
      return {
        project: state.project,
        techniques: entry && entry.techniques ? entry.techniques : (state.genTechniques || state.techniques),
        resources: !!(entry && entry.resources),
      };
    }

    // Reconstruye la plantilla de respaldo de una pestaña con recursos reales
    // (Fase D) sin tirar la dirección creativa ya derivada.
    function rebuildTemplateEntry(tabKey, techniques, assets, concept) {
      const g = state.templateGeneration;
      if (!g) return null;
      if (tabKey === 'combinado') {
        return combineTechnologyPrompts(state.project, g.verticalCtx, g.architecture, g.creativeDirection, state.technologies, g.seed, techniques, assets, concept);
      }
      return buildTechnologyPrompt(state.project, g.verticalCtx, g.architecture, g.creativeDirection, tabKey, techniques, assets, concept);
    }

    function getAssetsCacheKey(techniques) {
      const m = normalizeMedia((state.project && state.project.media) || state.media);
      const ids = m.references.concat(m.required).map((x) => `${x.id}:${x.role}:${x.caption}`).join(',');
      const pre = activePregen(state.pregen, techniques);
      const preIds = pre.images.concat(pre.videos).map((x) => x.id).join(',');
      return `${state.genEpoch}|${(state.project && state.project.tema) || ''}|${techniques.join('')}|${state.mediaPrefs.video || 'generated'}|${ids}|${preIds}`;
    }

    // Resumen corto de la dirección visual (ejes derivados) para orientar
    // búsquedas de fotos y prompts de imagen.
    function summarizeDirectionForAssets(g) {
      const cd = g && g.creativeDirection;
      if (!cd) return '';
      return ['paletteFamily', 'imageryTreatment', 'typePairing', 'contrast', 'motionSignature', 'heroArchetype', 'layoutParadigm', 'narrativeAngle']
        .filter((k) => typeof cd[k] === 'string' && cd[k])
        .map((k) => `- ${k}: ${cd[k]}`).join('\n');
    }

    // Pipeline de generación del prompt por técnicas (fases de la guía):
    //   Descubrir  -> recursos (hook Fase D) + redactor con 1 SSoT / 2 Ambicioso
    //   Definir    -> validación/reparación + 6 sustractivo (en el meta-prompt)
    //   Entregar   -> 4/5 recursos visuales y 7 restricciones (en el meta-prompt);
    //                 3 crítico de la landing (bucle creador/crítico) y 8 reescritura humana son post-ejecución (onExecutionDone)
    // Cada etapa usa su propio runId, así Cancelar corta la que esté en curso.
    async function runTechniquePipeline(ctx) {
      const { tabKey, techniques, startedAt } = ctx;
      const entry = state.modelPrompts[tabKey];
      const t = normalizeTechniques(techniques);
      const on = (id) => t.indexOf(id) !== -1;
      let templateEntry = ctx.templateEntry;

      const stageEnd = () => {
        if (entry.stage) entry.stagesDone.push(entry.stageLabel);
      };
      const setStage = (phase, label) => {
        stageEnd();
        entry.stageLabel = label.replace(/…$/, '');
        entry.stage = `${phase} · ${label}`;
        entry.stageStartedAt = Date.now();
        entry.runId = generateClientRunId();
        if (tabKey === state.activeTab) renderPromptPanel();
      };
      const cancelled = () => entry.cancelRequested === true;

      // ---- Descubrir: concepto rector (solo técnica 2) ----
      // Una llamada al modelo propone 3 conceptos (el 1º con el paradigma
      // sorteado); sigue solo con el elegido (por defecto el 1º). Con
      // ctx.concepts ("Usar este concepto") se salta la ideación.
      let concepts = null;
      let conceptIndex = 0;
      if (on(2)) {
        const pickDir = deriveCreativeDirection(state.project, effectiveVerticals(), t, ctx.seed);
        const pick = state.conceptPick;
        const pickUsable = !ctx.reideate && chosenConceptOf(pick) && !conceptPickIsStale(pick, pickDir.seed, state.project && state.project.tema);
        if (Array.isArray(ctx.concepts) && ctx.concepts.length) {
          concepts = ctx.concepts;
          conceptIndex = Math.min(Math.max(Number(ctx.conceptIndex) || 0, 0), concepts.length - 1);
        } else if (pickUsable) {
          // Elegido en el paso 2: sin etapa de ideación ni llamada extra.
          concepts = pick.concepts;
          conceptIndex = pick.index;
        } else if (!cancelled()) {
          setStage('Descubrir', 'Ideando el concepto…');
          const ideationCd = deriveCreativeDirection(state.project, effectiveVerticals(), t, ctx.seed).creativeDirection;
          let parsed = [];
          try {
            const res = await runLLM({
              prompt: buildConceptIdeationPrompt(state.project, effectiveVerticals(), state.technologies, tabKey === 'combinado' ? 'combined' : tabKey, ideationCd),
              expect: 'text', runId: entry.runId,
            });
            if (res && res.ok) parsed = parseConcepts(res.text);
          } catch (e) { parsed = []; }
          concepts = resolveConcepts(parsed, state.project, ideationCd);
        }
      }
      const concept = concepts ? concepts[conceptIndex] : null;
      const conceptBrief = conceptBriefOf(concept);

      // ---- Descubrir: recursos reales (Fase D) ----
      // Referencia visual, multimedia obligatoria, fotos de stock (siempre),
      // imágenes generadas (técnica 4) y video (técnica 5). Cada etapa falla en
      // blando; el resultado se reusa entre pestañas de la misma generación.
      let assets = emptyAssets();
      const assetsKey = getAssetsCacheKey(t);
      if (state.assetsCache[assetsKey]) {
        assets = normalizeAssets(JSON.parse(JSON.stringify(state.assetsCache[assetsKey])));
      } else {
        try {
          assets = normalizeAssets(await collectAssets({
            project: state.project, verticals: effectiveVerticals(), techniques: t,
            direction: summarizeDirectionForAssets(state.templateGeneration),
            media: normalizeMedia((state.project && state.project.media) || state.media),
            origin: (typeof location !== 'undefined' && location.origin && location.origin !== 'null') ? location.origin : '',
            frames: mediaFrames, cache: { describe: state.describeCache },
            api: mediaApi, videoMode: state.mediaPrefs.video || 'generated', conceptBrief,
            vision: resolveVisionConfig(state.mediaPrefs, state.provider),
            pregen: JSON.parse(JSON.stringify(activePregen(state.pregen, t))), // generados antes del prompt (paso 2)
            llm: (prompt) => runLLM({ prompt, expect: 'text', runId: entry.runId }),
            setStage: (label) => setStage('Descubrir', label),
            cancelled,
            log: (m) => console.log(`[assets] ${m}`),
          }));
          if (!cancelled()) state.assetsCache[assetsKey] = JSON.parse(JSON.stringify(assets));
        } catch (e) {
          entry.assetsError = (e && e.message) || 'No se pudieron reunir recursos.';
        }
      }

      const withResources = on(4) || on(5) || hasAssetsContent(assets);
      const valOpts = { project: state.project, techniques: t, resources: withResources };
      if (hasAssetsContent(assets) || concept) {
        templateEntry = rebuildTemplateEntry(tabKey, t, assets, concept) || templateEntry;
      }

      const common = {
        tech: tabKey, label: templateEntry.label, techniques: t, resources: withResources, assets,
        headings: getHeadings(t, { resources: withResources }),
      };
      if (concept) { common.concepts = concepts; common.conceptIndex = conceptIndex; }
      const toTemplateFallback = (reason) => Object.assign({
        status: 'done', source: 'template', text: templateEntry.text,
        structure: templateEntry.structure, constraints: templateEntry.constraints,
        fallbackReason: reason, elapsedMs: Date.now() - startedAt,
      }, common);

      if (cancelled()) return toTemplateFallback('la generación con IA se canceló.');

      // ---- Descubrir: redactor ----
      setStage('Descubrir', 'Escribiendo el prompt…');
      const target = tabKey === 'combinado' ? 'combined' : tabKey;
      const metaPromptResult = buildMetaPrompt(state.project, effectiveVerticals(), state.technologies, target, t, assets, { seed: ctx.seed, concept });
      valOpts.creativeDirection = metaPromptResult.creativeDirection; // para validar que respete la paleta sorteada

      // Si el único problema es que falta la marca {{SSOT_SEED}} verbatim,
      // no vale la pena gastar un round-trip completo de reparación: se
      // inserta mecánicamente (forceInsertSSoTToken) y se revalida.
      const onlyMissingToken = (v) => v.violations.length === 1 && v.violations[0].indexOf(SSOT_TOKEN) !== -1;
      // El contrato de SALIDA FINAL lo fija la app (HTML único o proyecto
      // multi-archivo): se reimpone tras cada salida del modelo.
      const salidaBody = getSectionBody(extractPromptSections(templateEntry.text, t, valOpts).sections, 'SALIDA FINAL');
      const validate = (txt) => {
        let text = enforceSalidaFinal(txt, salidaBody, t, valOpts);
        let v = validateGeneratedPrompt(text, valOpts);
        if (!v.ok && onlyMissingToken(v)) {
          text = forceInsertSSoTToken(text, t, valOpts);
          v = validateGeneratedPrompt(text, valOpts);
        }
        return { text, validation: v };
      };

      const first = await runLLM({ prompt: metaPromptResult.text, expect: 'text', runId: entry.runId });
      if (!first.ok) return toTemplateFallback(first.error || 'OpenCode no está disponible.');

      let { text, validation } = validate(first.text);
      let usedModel = first.model;

      // ---- Definir: reparación de formato ----
      if (!validation.ok) {
        setStage('Definir', 'Corrigiendo el formato…');
        const repaired = await runLLM({ prompt: buildRepairPrompt(text, validation.violations, t, valOpts), expect: 'text', runId: entry.runId });
        if (!repaired.ok) return toTemplateFallback(`no se pudo reparar el prompt generado por el modelo (${repaired.error || 'error desconocido'}).`);
        const r2 = validate(repaired.text);
        if (!r2.validation.ok) return toTemplateFallback(`el modelo no cumplió el formato exigido ni tras un intento de reparación (${r2.validation.violations[0]}).`);
        text = r2.text; validation = r2.validation; usedModel = repaired.model;
      }

      // ---- Definir: coherencia con los activos, orden de secciones y longitud (validación SUAVE, 1 reparación conjunta) ----
      const coherence = collectSoftViolations(text, assets, t, valOpts);
      if (coherence.length && !cancelled()) {
        setStage('Definir', 'Ajustando el prompt…');
        const fix = await runLLM({ prompt: buildRepairPrompt(text, coherence, t, valOpts), expect: 'text', runId: entry.runId });
        if (fix.ok) {
          const r3 = validate(fix.text);
          if (r3.validation.ok) { text = r3.text; validation = r3.validation; usedModel = fix.model; }
        }
      }

      return Object.assign({
        status: 'done', source: 'model', text, model: usedModel, validation,
        structure: common.headings.slice(),
        constraints: extractConstraintsFromValidation(validation, t),
        elapsedMs: Date.now() - startedAt,
        creativeDirection: metaPromptResult.creativeDirection, seed: metaPromptResult.seed,
      }, common);
    }

    // Pide (o repara, o cae a la plantilla) el prompt de UNA pestaña. Nunca
    // genera las demás: generación perezosa por pestaña, con caché — ver
    // constraints de Feature 1 en las instrucciones del cambio.
    // extra (opcional): { concepts, conceptIndex } salta la ideación y usa ese concepto; { reideate } ignora el concepto elegido en el paso 2 y vuelve a idear.
    async function ensureTabGenerated(tabKey, force, extra) {
      if (!force && state.modelPrompts[tabKey]) {
        if (tabKey === state.activeTab) renderGenerador();
        return;
      }
      const templateEntry = getTemplateEntry(tabKey);
      if (!templateEntry) return;

      const techniques = normalizeTechniques(state.genTechniques || state.techniques);
      // Cadena con la que se armó la dirección de esta generación (con la técnica 1).
      const genSeed = hasTechnique(techniques, 1) && state.templateGeneration ? state.templateGeneration.seed : null;
      const startedAt = Date.now();
      state.modelPrompts[tabKey] = {
        status: 'loading', startedAt, label: templateEntry.label, runId: generateClientRunId(),
        techniques, stage: '', stageLabel: '', stagesDone: [], cancelRequested: false,
      };
      if (tabKey === state.activeTab) renderGenerador();
      startGenElapsedTimer();
      const resetEp = state.resetEpoch;

      let finalEntry;
      try {
        finalEntry = await runTechniquePipeline({
          tabKey, techniques, startedAt, templateEntry, seed: genSeed,
          concepts: extra && extra.concepts, conceptIndex: extra && extra.conceptIndex, reideate: !!(extra && extra.reideate),
        });
      } catch (e) {
        finalEntry = {
          status: 'done', source: 'template', tech: tabKey, label: templateEntry.label,
          text: templateEntry.text, structure: templateEntry.structure, constraints: templateEntry.constraints,
          fallbackReason: `error inesperado en el pipeline (${(e && e.message) || e}).`, elapsedMs: Date.now() - startedAt,
          techniques, resources: false, headings: getHeadings(techniques),
        };
      }

      if (state.resetEpoch !== resetEp) return; // "Limpiar todo" corrió mientras se generaba: se descarta el resultado
      finalEntry.ssotSeed = genSeed; // se sustituye en {{SSOT_SEED}} al ejecutar y se guarda en el Banco
      state.modelPrompts[tabKey] = finalEntry;
      // "Otros 3 conceptos" desde el Generador: los nuevos pasan a ser la elección del paso 2.
      if (extra && extra.reideate && Array.isArray(finalEntry.concepts) && finalEntry.concepts.length) {
        try {
          const d = deriveCreativeDirection(state.project, effectiveVerticals(), techniques, genSeed);
          state.conceptPick = { seed: d.seed, tema: (state.project && state.project.tema) || '', concepts: finalEntry.concepts, index: finalEntry.conceptIndex || 0 };
          saveConceptPick(state.conceptPick);
          renderConceptPickPanel();
        } catch (e) { /* no-op */ }
      }

      // Borrador restaurado (Feature 3): si esta pestaña no tiene ediciones
      // todavía (primera vez que se genera en esta sesión) y existe un
      // borrador guardado en localStorage para el mismo contexto (proyecto +
      // verticales + tecnologías + técnicas) que difiere del texto recién
      // generado, se aplica como edición y se marca para mostrar el aviso de
      // "se restauró tu borrador" la próxima vez que se renderice el panel.
      if (!Object.prototype.hasOwnProperty.call(state.edits, tabKey)) {
        const draftText = loadPromptDraft(getPromptDraftContextKey(), tabKey);
        if (draftText != null && draftText !== finalEntry.text) {
          state.edits[tabKey] = draftText;
          state.draftNoticeTab = tabKey;
        }
      }

      stopGenElapsedTimerIfIdle();
      if (tabKey === state.activeTab) renderGenerador();
    }

    function getPromptDraftContextKey() {
      return computePromptDraftContextKey(state.project, effectiveVerticals(), state.technologies, state.genTechniques || undefined);
    }

    // Muestra compactas las decisiones grandes derivadas de la semilla real
    // (fix de diversidad): la cadena cruda queda colapsada bajo "Detalles
    // técnicos", nunca a la vista de entrada.
    function appendDerivedDecisionsDL(container, cd, seed, techniques) {
      const techs = techniques || state.genTechniques || state.techniques;
      const dl = document.createElement('dl');
      [
        ['Paradigma de layout', cd.layoutParadigm],
        hasTechnique(techs, 2) ? ['Paradigma de interacción', cd.interactionParadigm] : null,
        ['Arquetipo de hero', cd.heroArchetype],
        ['Paleta', cd.paletteFamily],
        ['Pareja tipográfica', cd.typePairing],
        ['Densidad', cd.density],
        ['Contraste', cd.contrast],
        ['Ángulo narrativo', cd.narrativeAngle],
        ['Tratamiento de imágenes', cd.imageryTreatment],
        ['Firma de movimiento', cd.motionSignature],
        ['Bordes/esquinas', cd.cornerBorderLanguage],
        ['Estilo de CTA', cd.ctaStyle],
        ['Voz de copy', cd.copyVoice],
        ['Motivación líder', cd.leadMotivation],
        ['Orden de secciones (base)', cd.sectionOrder.map((k) => SECTION_LABELS[k]).join(' → ')],
        ['Bloques narrativos adicionales', (cd.sectionArchetypes || []).join(', ') || '(ninguno)'],
      ].filter(Boolean).forEach(([k, v]) => {
        const dt = document.createElement('dt'); dt.textContent = k;
        const dd = document.createElement('dd'); dd.textContent = v;
        dl.appendChild(dt); dl.appendChild(dd);
      });
      container.appendChild(dl);
      if (seed) {
        const details = document.createElement('details');
        details.className = 'direction-seed-details';
        const summary = document.createElement('summary');
        summary.textContent = 'Detalles técnicos (semilla cruda)';
        details.appendChild(summary);
        const code = document.createElement('code');
        code.textContent = seed;
        details.appendChild(code);
        container.appendChild(details);
      }
    }

    // Cadena semilla (forma corta, copiable), aviso de cadena cambiada y paleta
    // de la dirección creativa de este prompt.
    function appendSeedAndPalette(container, entry, cd) {
      const wrap = document.createElement('div');
      wrap.className = 'direction-seed';
      if (entry.ssotSeed) {
        wrap.appendChild(buildSeedView(entry.ssotSeed, {
          label: 'Cadena semilla:',
          className: 'direction-seed__row',
          onCopy: (seed) => copyText(seed),
        }));
        if (state.ssotSeed !== entry.ssotSeed) {
          const stale = document.createElement('p');
          stale.className = 'direction-seed__stale';
          stale.setAttribute('role', 'status');
          stale.textContent = 'La cadena cambió desde que se generó este prompt — Regenerar para aplicarla.';
          wrap.appendChild(stale);
        }
      }
      if (cd && cd.palette) wrap.appendChild(buildPaletteSwatchList(cd.palette, 'swatch-list swatch-list--inline', false));
      container.appendChild(wrap);
    }

    // Técnicas activas de este prompt.
    function appendTechniqueInfo(container, entry) {
      const techs = entry.techniques || state.genTechniques || state.techniques;
      const p = document.createElement('p');
      p.className = 'view__hint direction-techniques';
      p.textContent = `Técnicas activas: ${describeTechniques(techs)}.`;
      container.appendChild(p);
    }

    function renderDirectionPanel() {
      els.creativeDirection.textContent = '';
      const entry = state.modelPrompts[state.activeTab];
      const title = document.createElement('h3');

      if (!entry || entry.status === 'loading') {
        title.textContent = 'Dirección creativa';
        els.creativeDirection.appendChild(title);
        const p = document.createElement('p');
        p.className = 'view__hint';
        p.textContent = 'Se muestra cuando termine la generación de esta pestaña.';
        els.creativeDirection.appendChild(p);
        return;
      }

      if (entry.source === 'model') {
        title.textContent = 'Dirección creativa (prompt generado por modelo)';
        els.creativeDirection.appendChild(title);
        const note = document.createElement('p');
        note.className = 'view__hint';
        const ssotOn = hasTechnique(entry.techniques, 1);
        note.textContent = ssotOn
          ? `Generado con ${entry.model} en ${(entry.elapsedMs / 1000).toFixed(1)}s. Mecanismo SSoT: la app derivó de tu cadena semilla (paso 2) estas decisiones grandes, paleta incluida (el modelo las elabora, no las inventa), y el prompt generado instruye al modelo ejecutor a usar esa misma cadena para sus decisiones menores (ver bloque generado abajo). La misma cadena da siempre la misma dirección; para otra, generá una nueva cadena en el paso 2.`
          : `Generado con ${entry.model} en ${(entry.elapsedMs / 1000).toFixed(1)}s. La técnica SSoT está desactivada: estas decisiones grandes se derivan de forma determinista del proyecto y los verticales (mismo proyecto, misma dirección) y el prompt no incluye semilla.`;
        els.creativeDirection.appendChild(note);
        appendTechniqueInfo(els.creativeDirection, entry);
        if (entry.creativeDirection) {
          appendSeedAndPalette(els.creativeDirection, entry, entry.creativeDirection);
          appendDerivedDecisionsDL(els.creativeDirection, entry.creativeDirection, entry.seed, entry.techniques);
        }
        const blocks = [
          ['Bloque SSoT generado', entry.validation.sections['MECANISMO DE DIVERSIDAD SSoT']],
          ['Bloque de restricciones negativas generado', entry.validation.sections['RESTRICCIONES NEGATIVAS']],
        ];
        blocks.forEach(([label, text]) => {
          if (!text) return;
          const h4 = document.createElement('h4'); h4.textContent = label;
          const pre = document.createElement('pre'); pre.className = 'direction-pre'; pre.textContent = text;
          els.creativeDirection.appendChild(h4);
          els.creativeDirection.appendChild(pre);
        });
        return;
      }

      title.textContent = 'Dirección creativa (plantilla de respaldo)';
      els.creativeDirection.appendChild(title);
      const reasonP = document.createElement('p');
      reasonP.className = 'status status--error';
      reasonP.textContent = `Prompt generado con plantilla de respaldo: ${entry.fallbackReason || 'motivo no especificado'}`;
      els.creativeDirection.appendChild(reasonP);
      appendTechniqueInfo(els.creativeDirection, entry);
      const cd = state.templateGeneration.creativeDirection;
      appendSeedAndPalette(els.creativeDirection, entry, cd);
      appendDerivedDecisionsDL(els.creativeDirection, cd, state.templateGeneration.seed, entry.techniques);
    }

    // Un prompt cuenta como "editado a mano" cuando state.edits tiene una
    // entrada para esa pestaña Y difiere del texto recién generado (si sólo
    // difiere porque todavía no se generó nada, no cuenta).
    function isTabManuallyEdited(tabKey) {
      const entry = state.modelPrompts[tabKey];
      return !!entry && Object.prototype.hasOwnProperty.call(state.edits, tabKey) && state.edits[tabKey] !== entry.text;
    }

    function renderTabs() {
      els.promptTabs.textContent = '';
      getTabList().forEach((entry) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'tab';
        btn.setAttribute('role', 'tab');
        const selected = state.activeTab === entry.tech;
        btn.setAttribute('aria-selected', String(selected));
        if (selected) btn.classList.add('tab--active');
        btn.textContent = entry.label + (isTabManuallyEdited(entry.tech) ? ' · editado a mano' : '');
        btn.addEventListener('click', () => {
          state.activeTab = entry.tech;
          renderTabs();
          renderDirectionPanel();
          renderConceptPanel();
          renderPromptPanel();
          ensureTabGenerated(entry.tech, false);
        });
        els.promptTabs.appendChild(btn);
      });
    }

    function renderPromptPanel() {
      const tabKey = state.activeTab;
      const entry = state.modelPrompts[tabKey];

      // Sin nada generado (p. ej. tras "Limpiar todo"): estado vacío, no "Generando…".
      if (!entry && !state.templateGeneration) {
        els.promptGenStatus.textContent = 'Todavía no generaste ningún prompt.';
        els.promptGenStatus.classList.remove('status--loading', 'status--error');
        els.btnCancelGenerate.hidden = true;
        els.promptTextarea.value = '';
        els.promptTextarea.disabled = true;
        els.btnExecute.disabled = true;
        els.btnRegenerate.disabled = true;
        els.promptStructure.textContent = '';
        els.promptConstraints.textContent = '';
        if (els.promptEditStatus) els.promptEditStatus.textContent = '';
        if (els.promptDraftNotice) els.promptDraftNotice.hidden = true;
        if (els.assetsPanel) els.assetsPanel.hidden = true;
        return;
      }

      if (!entry || entry.status === 'loading') {
        const elapsed = entry ? Math.round((Date.now() - entry.startedAt) / 1000) : 0;
        if (entry && entry.stage) {
          const stageElapsed = Math.round((Date.now() - (entry.stageStartedAt || entry.startedAt)) / 1000);
          const done = (entry.stagesDone || []).map((s) => `${s} ✓`).join(' › ');
          els.promptGenStatus.textContent = `${entry.stage} ${stageElapsed}s · total ${elapsed}s${done ? ` — ${done}` : ''}`;
        } else {
          els.promptGenStatus.textContent = `Generando el prompt con IA… ${elapsed}s`;
        }
        els.promptGenStatus.classList.add('status--loading');
        els.promptGenStatus.classList.remove('status--error');
        els.btnCancelGenerate.hidden = false;
        els.promptTextarea.value = '';
        els.promptTextarea.disabled = true;
        els.btnExecute.disabled = true;
        els.btnRegenerate.disabled = true;
        els.promptStructure.textContent = '';
        els.promptConstraints.textContent = '';
        if (els.promptEditStatus) els.promptEditStatus.textContent = '';
        if (els.promptDraftNotice) els.promptDraftNotice.hidden = true;
        if (els.assetsPanel) els.assetsPanel.hidden = true;
        return;
      }

      els.promptTextarea.disabled = false;
      els.btnExecute.disabled = false;
      els.btnRegenerate.disabled = false;
      els.btnCancelGenerate.hidden = true;
      els.promptGenStatus.classList.remove('status--loading');

      if (entry.source === 'model') {
        els.promptGenStatus.textContent = `Generado con modelo ${entry.model} en ${(entry.elapsedMs / 1000).toFixed(1)}s.`;
        els.promptGenStatus.classList.remove('status--error');
      } else {
        els.promptGenStatus.textContent = `Prompt generado con plantilla de respaldo: ${entry.fallbackReason || 'motivo no especificado'}`;
        els.promptGenStatus.classList.add('status--error');
      }

      const text = Object.prototype.hasOwnProperty.call(state.edits, tabKey) ? state.edits[tabKey] : entry.text;
      els.promptTextarea.value = text;

      els.promptStructure.textContent = '';
      const structTitle = document.createElement('h4');
      structTitle.textContent = 'Estructura del prompt';
      els.promptStructure.appendChild(structTitle);
      const ul = document.createElement('ul');
      (entry.structure || []).forEach((h) => {
        const li = document.createElement('li');
        li.textContent = h;
        ul.appendChild(li);
      });
      els.promptStructure.appendChild(ul);

      els.promptConstraints.textContent = '';
      const consTitle = document.createElement('h4');
      consTitle.textContent = 'Restricciones técnicas aplicadas';
      els.promptConstraints.appendChild(consTitle);
      const ul2 = document.createElement('ul');
      (entry.constraints || []).forEach((c) => {
        const li = document.createElement('li');
        li.textContent = c;
        ul2.appendChild(li);
      });
      els.promptConstraints.appendChild(ul2);

      renderPromptEditStatus();
      renderPromptDraftNotice();
      renderAssetsPanel(entry);
    }

    /* ---------- Panel "Recursos" del Generador (Fase D) ---------- */

    const ASSET_GROUP_LABELS = { required: 'Obligatorio', generated: 'Generada (IA)', photos: 'Foto real', videos: 'Video' };

    function renderAssetsPanel(entry) {
      if (!els.assetsPanel) return;
      const assets = normalizeAssets(entry && entry.assets);
      const items = listAssetEntries(assets);
      const notices = assets.notices.slice();
      if (entry && entry.assetsError) notices.push(entry.assetsError);
      els.assetsPanel.hidden = !items.length && !notices.length && !assets.referenceNotes;
      if (els.assetsPanel.hidden) return;
      els.assetsPanelSummary.textContent = `Recursos (${items.length}${assets.referenceNotes ? ' + referencia' : ''})`;
      if (entry && !entry.assetsPanelOpened) { entry.assetsPanelOpened = true; els.assetsPanel.open = items.length > 0; }
      els.assetsGrid.textContent = '';
      items.forEach(({ group, item }) => {
        const li = document.createElement('li');
        li.className = 'asset-card';
        const thumbSrc = item.type === 'video' ? (item.poster || '') : item.url;
        if (thumbSrc) {
          const img = document.createElement('img');
          img.className = 'asset-card__thumb'; img.loading = 'lazy'; img.alt = item.alt || ''; img.src = thumbSrc;
          li.appendChild(img);
        } else {
          const ph = document.createElement('div');
          ph.className = 'asset-card__thumb';
          li.appendChild(ph);
        }
        const tag = document.createElement('span');
        tag.className = 'asset-card__tag';
        tag.textContent = `${ASSET_GROUP_LABELS[group] || group}${item.role ? ` · ${item.role}` : ''}${item.pregen ? (item.type === 'foto' || item.source === 'pexels' || item.source === 'pixabay' ? ' · elegido antes del prompt' : ' · generado antes del prompt') : ''}`;
        li.appendChild(tag);
        if (item.analysis) {
          const an = item.analysis;
          if (an.colors && an.colors.length) {
            const sw = document.createElement('span');
            sw.className = 'asset-card__swatches';
            an.colors.forEach((hex) => {
              const dot = document.createElement('span');
              dot.className = 'asset-card__swatch';
              dot.style.backgroundColor = hex;
              dot.title = hex;
              dot.setAttribute('role', 'img');
              dot.setAttribute('aria-label', `Color ${hex}`);
              sw.appendChild(dot);
            });
            li.appendChild(sw);
          }
          if (an.negativeSpace) {
            const fr = document.createElement('span');
            fr.className = 'asset-card__free';
            fr.textContent = `espacio libre: ${an.negativeSpace}${an.source === 'local' ? ' (análisis local)' : ''}`;
            li.appendChild(fr);
          }
        }
        if (item.credit) {
          const cr = document.createElement('span');
          cr.className = 'asset-card__credit';
          if (/^https:\/\//.test(item.creditUrl || '')) {
            const a = document.createElement('a');
            a.href = item.creditUrl; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = item.credit;
            cr.appendChild(a);
          } else cr.textContent = item.credit;
          li.appendChild(cr);
        }
        const rm = document.createElement('button');
        rm.type = 'button'; rm.className = 'btn btn--link'; rm.textContent = 'Quitar';
        rm.setAttribute('aria-label', `Quitar recurso ${item.alt || item.url}`);
        rm.addEventListener('click', () => onRemoveAsset(item.url));
        li.appendChild(rm);
        els.assetsGrid.appendChild(li);
      });
      els.assetsNotices.textContent = '';
      notices.forEach((n) => { const li = document.createElement('li'); li.textContent = n; els.assetsNotices.appendChild(li); });
    }

    // Quita un recurso del pool y de las líneas del prompt que lo citan
    // (el bloque RECURSOS VISUALES lista una URL por línea).
    function onRemoveAsset(url) {
      const tabKey = state.activeTab;
      const entry = state.modelPrompts[tabKey];
      if (!entry || entry.status === 'loading') return;
      entry.assets = removeAssetFromAssets(entry.assets, url);
      entry.text = removeAssetFromText(entry.text, url);
      if (Object.prototype.hasOwnProperty.call(state.edits, tabKey)) state.edits[tabKey] = removeAssetFromText(state.edits[tabKey], url);
      renderPromptPanel();
      renderTabs();
    }

    // Estado inline bajo el textarea (Feature 3): "Editado a mano" +
    // problemas detectados por validateGeneratedPrompt sobre el texto
    // editado. No bloquea nada acá, sólo informa (el bloqueo/confirmación
    // vive en onExecuteClick).
    function renderPromptEditStatus() {
      if (!els.promptEditStatus) return;
      const tabKey = state.activeTab;
      if (!isTabManuallyEdited(tabKey)) {
        els.promptEditStatus.textContent = '';
        els.promptEditStatus.classList.remove('status--error');
        return;
      }
      const validation = validateGeneratedPrompt(state.edits[tabKey], getValidationOpts(tabKey));
      if (validation.ok) {
        els.promptEditStatus.textContent = 'Editado a mano.';
        els.promptEditStatus.classList.remove('status--error');
      } else {
        const n = validation.violations.length;
        els.promptEditStatus.textContent = `Editado a mano — ${n} problema${n === 1 ? '' : 's'}: ${validation.violations.join(' ')}`;
        els.promptEditStatus.classList.add('status--error');
      }
    }

    function renderPromptDraftNotice() {
      if (!els.promptDraftNotice) return;
      els.promptDraftNotice.hidden = state.draftNoticeTab !== state.activeTab;
    }

    function onDiscardPromptDraft() {
      const tabKey = state.activeTab;
      delete state.edits[tabKey];
      clearPromptDraft(getPromptDraftContextKey(), tabKey);
      state.draftNoticeTab = null;
      renderPromptPanel();
      renderTabs();
    }

    function renderGenerador() {
      renderTabs();
      renderDirectionPanel();
      renderConceptPanel();
      renderPromptPanel();
    }

    /* ---------- Panel "Conceptos" (técnica 2 · concepto rector) ---------- */

    function renderConceptPanel() {
      const box = els.conceptPanel;
      if (!box) return;
      const entry = state.modelPrompts[state.activeTab];
      const techs = entry && entry.techniques ? entry.techniques : (state.genTechniques || state.techniques);
      const show = !!entry && entry.status === 'done' && hasTechnique(techs, 2) && Array.isArray(entry.concepts) && entry.concepts.length > 0;
      box.hidden = !show;
      box.textContent = '';
      if (!show) return;
      const title = document.createElement('h3');
      title.textContent = 'Conceptos';
      box.appendChild(title);
      const hint = document.createElement('p');
      hint.className = 'view__hint';
      hint.textContent = 'La página ES un concepto del mundo del cliente, con su propia forma de navegarse. Este prompt usa el concepto activo; cambiar a otro regenera solo este prompt. Lo ideal es elegirlo antes, en el paso 2.';
      box.appendChild(hint);
      const link = document.createElement('button');
      link.type = 'button';
      link.className = 'btn btn--link concept-link';
      link.textContent = 'Elegir en el paso 2';
      link.addEventListener('click', () => {
        goto('contexto');
        if (els.conceptPickPanel && typeof els.conceptPickPanel.scrollIntoView === 'function') els.conceptPickPanel.scrollIntoView({ block: 'start' });
      });
      box.appendChild(link);
      const list = document.createElement('ul');
      list.className = 'concept-list';
      entry.concepts.forEach((c, i) => {
        const active = i === entry.conceptIndex;
        const li = document.createElement('li');
        li.className = `concept-card${active ? ' concept-card--active' : ''}`;
        if (active) li.setAttribute('aria-current', 'true');
        const head = document.createElement('div');
        head.className = 'concept-card__head';
        const h4 = document.createElement('h4');
        h4.className = 'concept-card__title';
        h4.textContent = c.titulo;
        head.appendChild(h4);
        if (c.paradigma) head.appendChild(makeSpan('concept-card__badge', c.paradigma));
        if (c.source === 'fallback') head.appendChild(makeSpan('concept-card__badge concept-card__badge--soft', 'Base sin IA'));
        if (active) head.appendChild(makeSpan('concept-card__badge concept-card__badge--active', 'Activo'));
        li.appendChild(head);
        [['La página es', c.laPaginaEs], ['Navegación', c.navegacion], ['Momento firma', c.momentoFirma]].forEach(([k, v]) => {
          if (!v) return;
          const p = document.createElement('p');
          p.className = 'concept-card__row';
          p.appendChild(makeSpan('concept-card__label', `${k}: `));
          p.appendChild(document.createTextNode(v));
          li.appendChild(p);
        });
        if (!active) {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'btn btn--secondary btn--small';
          btn.textContent = 'Cambiar a este (regenera el prompt)';
          btn.setAttribute('aria-label', `Cambiar a este concepto y regenerar el prompt: ${c.titulo}`);
          btn.addEventListener('click', () => onUseConcept(i));
          li.appendChild(btn);
        }
        list.appendChild(li);
      });
      box.appendChild(list);
      const more = document.createElement('button');
      more.type = 'button';
      more.className = 'btn btn--secondary btn--small';
      more.textContent = 'Otros 3 conceptos';
      more.addEventListener('click', onReideateConcepts);
      box.appendChild(more);
    }

    async function confirmDiscardEditsForConcept(tab) {
      if (isTabManuallyEdited(tab)) {
        const action = await showConfirmDialog({
          title: 'Cambios manuales sin guardar',
          message: 'Tenés cambios manuales en este prompt. Cambiar de concepto los descarta. ¿Continuar?',
          actions: [
            { id: 'continue', label: 'Continuar', variant: 'btn--primary' },
            { id: 'cancel', label: 'Cancelar', variant: 'btn--secondary', autofocus: true },
          ],
        });
        if (action !== 'continue') return false;
      }
      delete state.edits[tab];
      clearPromptDraft(getPromptDraftContextKey(), tab);
      if (state.draftNoticeTab === tab) state.draftNoticeTab = null;
      return true;
    }

    // "Usar este concepto": regenera SOLO el prompt de la pestaña activa con
    // ese concepto, sin volver a ideación (los recursos salen de la caché).
    async function onUseConcept(index) {
      const tab = state.activeTab;
      const entry = state.modelPrompts[tab];
      if (!entry || entry.status !== 'done' || !Array.isArray(entry.concepts) || !entry.concepts[index]) return;
      if (!(await confirmDiscardEditsForConcept(tab))) return;
      // Mantiene alineada la elección del paso 2 si este concepto está entre sus opciones.
      const pk = state.conceptPick;
      const j = pk.concepts.findIndex((x) => x.titulo === entry.concepts[index].titulo);
      if (j >= 0 && pk.index !== j) { pk.index = j; saveConceptPick(pk); renderConceptPickPanel(); }
      ensureTabGenerated(tab, true, { concepts: entry.concepts, conceptIndex: index });
    }

    // "Otros 3 conceptos": vuelve a correr la ideación y el prompt de esta pestaña.
    async function onReideateConcepts() {
      const tab = state.activeTab;
      const entry = state.modelPrompts[tab];
      if (!entry || entry.status !== 'done') return;
      if (!(await confirmDiscardEditsForConcept(tab))) return;
      ensureTabGenerated(tab, true, { reideate: true });
    }

    function onPromptEdit() {
      const tab = state.activeTab;
      const text = els.promptTextarea.value;
      state.edits[tab] = text;
      if (state.draftNoticeTab === tab) state.draftNoticeTab = null; // se editó más: ya no es "el borrador restaurado" tal cual
      if (els.promptDraftNotice) els.promptDraftNotice.hidden = true;
      if (state.promptEditDebounceTimer) clearTimeout(state.promptEditDebounceTimer);
      state.promptEditDebounceTimer = setTimeout(() => {
        savePromptDraft(getPromptDraftContextKey(), tab, text);
        if (tab === state.activeTab) {
          renderPromptEditStatus();
          renderTabs();
        }
      }, 500);
    }

    async function onRegenerate() {
      const tab = state.activeTab;
      if (isTabManuallyEdited(tab)) {
        const action = await showConfirmDialog({
          title: 'Cambios manuales sin guardar',
          message: 'Tenés cambios manuales en este prompt. Regenerar los descarta. ¿Continuar?',
          actions: [
            { id: 'continue', label: 'Continuar', variant: 'btn--primary' },
            { id: 'cancel', label: 'Cancelar', variant: 'btn--secondary', autofocus: true },
          ],
        });
        if (action !== 'continue') return;
      }
      delete state.edits[tab];
      clearPromptDraft(getPromptDraftContextKey(), tab);
      if (state.draftNoticeTab === tab) state.draftNoticeTab = null;
      // Regenerar aplica la cadena ACTUAL (si cambió desde la última generación).
      state.templateGeneration = generateTemplatePrompt(state.project, effectiveVerticals(), state.technologies, state.genTechniques || state.techniques, undefined, { seed: state.ssotSeed });
      ensureTabGenerated(tab, true);
    }

    function onCancelGenerate() {
      const entry = state.modelPrompts[state.activeTab];
      if (entry && entry.status === 'loading') {
        entry.cancelRequested = true; // el pipeline lo consulta entre etapas
        cancelOpencodeRun(entry.runId);
      }
    }

    async function onCopyPrompt() {
      const text = els.promptTextarea.value;
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          const ta = document.createElement('textarea');
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
        }
        els.promptCopyStatus.textContent = 'Prompt copiado al portapapeles.';
      } catch (e) {
        els.promptCopyStatus.textContent = 'No se pudo copiar el prompt. Copialo manualmente.';
      }
    }

    async function onExecuteClick() {
      const entry = state.modelPrompts[state.activeTab];
      if (!entry || entry.status === 'loading') return;
      const text = els.promptTextarea.value;

      // Prompts editados a mano no se re-validan solos (Feature 3): se
      // revalida acá, justo antes de ejecutar, y si hay problemas se pide
      // confirmación explícita (no bloquea: el usuario puede ejecutar igual).
      const validation = validateGeneratedPrompt(text, getValidationOpts(state.activeTab));
      if (!validation.ok) {
        const n = validation.violations.length;
        const action = await showConfirmDialog({
          title: 'El prompt tiene problemas',
          message: `El prompt tiene ${n} problema${n === 1 ? '' : 's'}: ${validation.violations.join(' ')} ¿Ejecutar igual?`,
          actions: [
            { id: 'run', label: 'Ejecutar igual', variant: 'btn--primary' },
            { id: 'cancel', label: 'Cancelar', variant: 'btn--secondary', autofocus: true },
          ],
        });
        if (action !== 'run') return;
      }

      // Si el Estudio tiene una ejecución previa con cambios sin guardar,
      // ejecutar este prompt la reemplaza silenciosamente (Feature 2): se
      // ofrece guardar versión, descartar, o cancelar antes de seguir.
      const proceed = await confirmReplaceStudio();
      if (!proceed) return;

      state.execution = {
        label: entry.label,
        promptTemplate: text, // conserva {{SSOT_SEED}} sin sustituir: cada ejecución la reemplaza con la MISMA cadena
        ssotSeed: entry.ssotSeed || null, // cadena con la que se generó este prompt
        concept: entry.concepts && entry.concepts[entry.conceptIndex] ? { titulo: entry.concepts[entry.conceptIndex].titulo, laPaginaEs: entry.concepts[entry.conceptIndex].laPaginaEs, paradigma: entry.concepts[entry.conceptIndex].paradigma || '' } : null, // concepto rector (técnica 2) para el Banco
        promptUsed: text,
        techniques: entry.techniques ? entry.techniques.slice() : undefined, // técnicas con que se generó el prompt (pasadas posteriores)
        resources: !!entry.resources,
        assets: entry.assets ? normalizeAssets(entry.assets) : null, // Fase D: para verificar el uso tras ejecutar
        status: 'idle',
        html: '',
        editorInited: false,
      };
      state.openedFromBank = null;
      state.pendingVersions = null;
      renderEjecutor();
      goto('ejecutor');
      executeCurrent();
    }

    /* ---------- Ejecutor ---------- */

    function describeProviderShort(p) {
      if (p.type === 'anthropic') return `Anthropic · modelo ${p.model || 'claude-sonnet-5'}`;
      if (p.type === 'opencode-local') return `OpenCode local (CLI) · modelo ${p.model || 'sin elegir'}`;
      return `compatible con OpenAI · ${p.model ? p.model + ' · ' : ''}${p.baseUrl || 'sin URL configurada'}`;
    }

    function updateProviderSummary() {
      const gen = describeProviderShort(state.provider);
      const crit = resolveProviderForRole('critic', state.provider, state.criticProvider);
      let text = `Generador: ${gen}`;
      if (crit !== state.provider) text += ` · Crítico: ${describeProviderShort(crit)}`;
      if (els.providerSummary) els.providerSummary.textContent = text; // el resumen del Ejecutor se quitó
      updateSetupProviderNotice();
    }

    function updateSetupProviderNotice() {
      if (els.setupProviderNotice) els.setupProviderNotice.hidden = isProviderConfigured(state.provider);
    }

    const OPENCODE_ATTEMPT_LABELS = {
      ok: 'respondió',
      timeout: 'sin respuesta completa (timeout)',
      stall: 'sin respuesta (colgado)',
      'sin-html': 'respondió sin HTML válido',
      error: 'error',
    };

    // Arma el resumen en español de los intentos de OpenCode local (fallback
    // entre modelos gratis): "Intentos: nemotron... sin respuesta (colgado,
    // 45s); mimo... respondió (12s)." Se muestra siempre que haya más de un
    // intento o el único intento haya fallado, para que el usuario entienda
    // qué pasó sin tener que abrir la consola.
    function formatOpencodeAttempts(attempts) {
      if (!Array.isArray(attempts) || attempts.length === 0) return '';
      const parts = attempts.map((a) => {
        const label = OPENCODE_ATTEMPT_LABELS[a.status] || a.status || 'desconocido';
        const secs = typeof a.ms === 'number' ? ` (${Math.round(a.ms / 1000)}s)` : '';
        return `${a.model} → ${label}${secs}`;
      });
      return ` Intentos: ${parts.join('; ')}.`;
    }

    // El iframe de preview (iframe.html) se carga una sola vez; después cada
    // render viaja por postMessage. Mientras carga, sólo se guarda el último
    // HTML pedido y se envía al terminar la carga.
    function sendHtmlToPreview(html) {
      const frame = els.previewFrame;
      if (!frame) return;
      state.pendingPreviewHtml = html;
      const send = () => {
        try {
          frame.contentWindow.postMessage({ type: 'render', html: state.pendingPreviewHtml }, '*');
        } catch (e) { /* no-op */ }
      };
      if (frame.dataset.loaded === 'true') {
        send();
        return;
      }
      if (frame.dataset.loading === 'true') return;
      frame.dataset.loading = 'true';
      frame.addEventListener('load', () => {
        frame.dataset.loaded = 'true';
        delete frame.dataset.loading;
        send();
      }, { once: true });
      if (!frame.getAttribute('src')) frame.setAttribute('src', 'iframe.html');
    }

    /* ---------- Proyectos multi-archivo: preview con dev server real ----------
     * React/Vue (Vite) y Next.js no se previsualizan con srcdoc: el servidor
     * (preview-runner.js) levanta un dev server en 127.0.0.1:<puerto> y el
     * Estudio lo muestra en #preview-project-frame. Es OTRO origen (otro
     * puerto) que esta app, así que sus scripts nunca ven el localStorage
     * donde viven las claves de API. Por eso el iframe puede llevar
     * `allow-same-origin` (necesario para HMR/módulos ES/cookies de Next):
     * significa "conservá tu propio origen", jamás el de la app. */

    const PROJECT_API = '/api/preview-project';
    const PROJECT_ENTRY_ORDER = ['app/page.jsx', 'src/app/page.jsx', 'app/layout.jsx', 'src/App.jsx', 'src/App.vue', 'index.html', 'src/main.jsx', 'src/main.js'];
    const projectSleep = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

    function isProjectExecution() {
      return !!(state.execution && state.execution.project);
    }

    function makeProjectState(filesObj, technology) {
      const files = Object.assign({}, filesObj);
      const rank = (name) => { const i = PROJECT_ENTRY_ORDER.indexOf(name); return i === -1 ? 999 : i; };
      const order = Object.keys(files).sort((a, b) => (rank(a) - rank(b)) || a.localeCompare(b));
      return {
        technology: technology || detectProjectTechnology(order),
        files, order, current: order[0] || '',
        previewId: null, url: null, previewStatus: 'launching', message: '', error: null,
        logsTail: [], dirty: false, dirtyPaths: new Set(), launchToken: 0, warning: null,
        writeTimer: null, relaunchTimer: null,
        serverLines: [], serverSeq: 0, serverStatus: 'installing', serverBusy: false, // Consola > Servidor
      };
    }

    function modeForPath(filePath) {
      const ext = (String(filePath).match(/\.([a-z0-9]+)$/i) || [])[1] || '';
      switch (ext.toLowerCase()) {
        case 'js': case 'jsx': case 'mjs': case 'ts': case 'tsx': return { name: 'javascript', jsx: true };
        case 'json': return { name: 'javascript', json: true };
        case 'css': return 'css';
        case 'svg': return 'xml';
        default: return 'htmlmixed'; // html, vue, md, txt
      }
    }

    function stopProjectPreview(previewId) {
      if (!previewId) return;
      fetch(`${PROJECT_API}/${encodeURIComponent(previewId)}/stop`, { method: 'POST', keepalive: true }).catch(() => {});
    }

    function showPreviewFrame(kind) {
      if (els.previewFrame) els.previewFrame.hidden = kind === 'project';
      if (els.previewProjectFrame) els.previewProjectFrame.hidden = kind !== 'project';
    }

    function setProjectPreviewFrame(pj) {
      const frame = els.previewProjectFrame;
      if (!frame) return;
      if (pj && pj.previewStatus === 'ready' && pj.url) {
        if (frame.getAttribute('src') !== pj.url) {
          consoleClear(true);
          state.consoleLog.awaiting = true;
          frame.setAttribute('src', pj.url);
        }
      } else if (frame.getAttribute('src') && frame.getAttribute('src') !== 'about:blank') {
        frame.setAttribute('src', 'about:blank');
      }
    }

    function renderProjectLog() {
      if (!els.ejecutorLog) return;
      const pj = state.execution && state.execution.project;
      const lines = pj && pj.previewStatus !== 'ready' ? pj.logsTail : [];
      els.ejecutorLog.hidden = !lines || lines.length === 0;
      if (!els.ejecutorLog.hidden) els.ejecutorLog.textContent = lines.join('\n');
    }

    // Restaura la UI del Estudio al modo HTML único (srcdoc).
    function resetProjectUi() {
      showPreviewFrame('html');
      setProjectPreviewFrame(null);
      if (els.studioFileSelect) els.studioFileSelect.hidden = true;
      if (els.studioFileLabel) els.studioFileLabel.hidden = true;
      if (els.btnDownloadHtml) els.btnDownloadHtml.hidden = false;
      if (els.btnInspectToggle) els.btnInspectToggle.disabled = false;
      if (els.btnSaveVersion) els.btnSaveVersion.disabled = false;
      if (els.ejecutorLog) els.ejecutorLog.hidden = true;
    }

    function renderProjectFileSelect(pj) {
      const sel = els.studioFileSelect;
      if (!sel) return;
      sel.textContent = '';
      pj.order.forEach((name) => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        sel.appendChild(opt);
      });
      sel.value = pj.current;
      sel.hidden = false;
      if (els.studioFileLabel) els.studioFileLabel.hidden = false;
    }

    function selectProjectFile(filePath) {
      const pj = state.execution && state.execution.project;
      if (!pj || !Object.prototype.hasOwnProperty.call(pj.files, filePath) || !state.editor) return;
      pj.current = filePath;
      state.editor.setValue(pj.files[filePath]);
      if (state.editor.setMode) state.editor.setMode(modeForPath(filePath));
      refreshEditor();
    }

    function initEditorForProject(exec) {
      const pj = exec.project;
      const value = pj.files[pj.current] || '';
      if (!state.editor) {
        state.editor = createEditor(els.editorContainer, { value, onChange: onEditorChange });
      } else {
        state.editor.setValue(value);
      }
      if (state.editor.setMode) state.editor.setMode(modeForPath(pj.current));
      state.studioBaseline = value;
      // Versiones de proyecto = snapshots del mapa de archivos (tope 10).
      state.versions = pushProjectVersion([], pj.files, { source: 'generado' });
      renderVersions();
      renderProjectFileSelect(pj);
      showPreviewFrame('project');
      if (els.btnDownloadHtml) els.btnDownloadHtml.hidden = true;
      if (els.btnInspectToggle) els.btnInspectToggle.disabled = false;
      if (els.btnSaveVersion) els.btnSaveVersion.disabled = false;
      renderStudioDraftNotice(false);
      consoleClear(false);
      setStudioView('preview');
    }

    // Copia el estado que devuelve el servidor al estado del proyecto.
    function applyProjectView(exec, view) {
      const pj = exec.project;
      pj.logsTail = view.logsTail || [];
      pj.error = view.error || null;
      if (view.status === 'ready') {
        pj.previewStatus = 'ready';
        pj.url = view.url;
        pj.message = 'Vista previa lista.';
      } else if (view.status === 'error' || view.status === 'stopped') {
        pj.previewStatus = 'error';
        pj.message = view.status === 'stopped' ? 'El servidor de la vista previa se cerró.' : (view.message || `Error de compilación: ${pj.error || 'sin detalle'}`);
      } else {
        pj.previewStatus = 'launching';
        pj.serverStatus = view.status === 'starting' ? 'starting' : 'installing';
        pj.message = view.status === 'installing'
          ? 'Instalando dependencias… (la primera vez puede tardar unos minutos)'
          : (pj.technology === 'nextjs' ? 'Levantando Next…' : 'Levantando Vite…');
      }
      renderEjecutor();
    }

    // Envía el proyecto al servidor y espera (polling) a que el dev server
    // responda. Si la ejecución ya estaba en 'loading' (primer lanzamiento)
    // la pasa a 'done' al terminar, con o sin error de compilación: en ambos
    // casos el Estudio se abre para poder leer/editar el código.
    async function launchProjectPreview(exec) {
      const pj = exec.project;
      const token = ++pj.launchToken;
      const stale = () => token !== pj.launchToken || state.execution !== exec;
      const oldId = pj.previewId;
      if (pj.relaunchTimer) { clearTimeout(pj.relaunchTimer); pj.relaunchTimer = null; }
      if (oldId) stopProjectPreview(oldId);
      pj.previewId = null;
      pj.url = null;
      pj.previewStatus = 'launching';
      pj.error = null;
      pj.warning = null;
      pj.logsTail = [];
      pj.dirtyPaths.clear();
      pj.serverStatus = 'installing';
      if (pj.serverLines.length) pushServerSeparator(pj);
      pj.message = 'Enviando el proyecto al servidor de vista previa…';
      renderEjecutor();
      try {
        const res = await fetch(PROJECT_API, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ technology: pj.technology, files: pj.files }),
        });
        const data = await res.json().catch(() => ({}));
        if (stale()) { if (data.previewId) stopProjectPreview(data.previewId); return; }
        if (!res.ok) {
          const err = new Error(data.error || `Error del servidor (${res.status}).`);
          err.rejected = res.status === 400;
          throw err;
        }
        adoptProjectPreviewId(pj, data.previewId);
        if (!(await followProjectView(exec, data, stale))) return;
      } catch (e) {
        if (stale()) return;
        pj.previewStatus = 'error';
        pj.error = e.message || String(e);
        pj.message = e.rejected ? `Proyecto rechazado: ${pj.error}` : `Error de compilación: ${pj.error}`;
      }
      if (exec.status === 'loading') exec.status = 'done';
      renderEjecutor();
      // Ediciones hechas mientras levantaba: se empujan ahora.
      if (pj.previewStatus === 'ready' && pj.dirtyPaths.size) flushProjectWrites(exec);
    }

    function scheduleProjectRelaunch(exec) {
      const pj = exec.project;
      if (pj.relaunchTimer) clearTimeout(pj.relaunchTimer);
      pj.relaunchTimer = setTimeout(() => { pj.relaunchTimer = null; if (state.execution === exec) launchProjectPreview(exec); }, 1500);
    }

    // Guardar en el Estudio = reescribir el archivo en el workspace del
    // servidor; el dev server aplica HMR. Con la preview en error, el
    // cambio relanza el proyecto completo.
    async function flushProjectWrites(exec) {
      const pj = exec.project;
      if (pj.writeTimer) { clearTimeout(pj.writeTimer); pj.writeTimer = null; }
      if (pj.previewStatus === 'error') { pj.dirtyPaths.clear(); scheduleProjectRelaunch(exec); return; }
      if (pj.previewStatus !== 'ready' || !pj.previewId) return; // se empuja al terminar de levantar
      const paths = Array.from(pj.dirtyPaths);
      pj.dirtyPaths.clear();
      for (const filePath of paths) {
        // eslint-disable-next-line no-await-in-loop
        const r = await fetch(`${PROJECT_API}/${encodeURIComponent(pj.previewId)}/file`, {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ path: filePath, content: pj.files[filePath] }),
        }).catch(() => null);
        if (!r) return;
        if (r.status === 404) { launchProjectPreview(exec); return; }
        if (!r.ok) {
          // eslint-disable-next-line no-await-in-loop
          const data = await r.json().catch(() => ({}));
          pj.warning = `No se aplicó ${filePath} en la vista previa: ${data.error || 'error ' + r.status}`;
          renderEjecutor();
          return;
        }
      }
      if (pj.warning) { pj.warning = null; renderEjecutor(); }
    }

    function onProjectEditorChange(value) {
      const exec = state.execution;
      const pj = exec.project;
      pj.files[pj.current] = value;
      pj.dirty = true;
      pj.dirtyPaths.add(pj.current);
      if (pj.writeTimer) clearTimeout(pj.writeTimer);
      pj.writeTimer = setTimeout(() => flushProjectWrites(exec), 600);
    }

    // El TTL del servidor es de 20 min de inactividad: mientras el Estudio
    // tiene un proyecto abierto se hace un ping cada 4 min; si el servidor
    // ya lo cerró (404) se relanza solo.
    function startProjectKeepAlive() {
      setInterval(async () => {
        const exec = state.execution;
        const pj = exec && exec.project;
        if (!pj || pj.previewStatus !== 'ready' || !pj.previewId) return;
        try {
          const r = await fetch(`${PROJECT_API}/${encodeURIComponent(pj.previewId)}/status`);
          if (r.status === 404 && state.execution === exec) launchProjectPreview(exec);
        } catch (e) { /* servidor caído: no hay nada que hacer acá */ }
      }, 4 * 60 * 1000);
      window.addEventListener('pagehide', () => {
        const pj = state.execution && state.execution.project;
        if (pj && pj.previewId && navigator.sendBeacon) navigator.sendBeacon(`${PROJECT_API}/${encodeURIComponent(pj.previewId)}/stop`);
      });
    }

    // Abre una entrada multi-archivo del Banco en el Estudio: relanza el
    // dev server con los archivos guardados en banco/<id>/project/.
    function openProjectFromBank(full) {
      const project = makeProjectState(full.files || {}, full.meta.technology);
      state.execution = {
        label: full.meta.tema, promptUsed: full.prompt, status: 'loading', html: '',
        editorInited: false, project, ssotSeed: full.meta.ssotSeed || null,
      };
      state.openedFromBank = full.meta.id;
      state.pendingVersions = null;
      goto('ejecutor');
      renderEjecutor();
      launchProjectPreview(state.execution);
    }

    /* ---------- Proyectos: edición IA por archivos, inspector, versiones ----------
     * La IA devuelve sólo los archivos que cambian (bloques `=== FILE ===`);
     * el Estudio muestra un diff por archivo y, al aceptar, escribe cada uno
     * con PUT .../file (HMR). Las versiones son snapshots del mapa de archivos.
     * El inspector vive en el workspace del dev server (ver preview-runner.js)
     * y habla con la app por postMessage; acá se valida el origen. */

    function projectPreviewOrigin(pj) {
      try { return pj && pj.url ? new URL(pj.url).origin : null; } catch (e) { return null; }
    }

    function postToProjectFrame(msg) {
      const pj = state.execution && state.execution.project;
      const frame = els.previewProjectFrame;
      const origin = projectPreviewOrigin(pj);
      if (!frame || !frame.contentWindow || !origin || pj.previewStatus !== 'ready') return;
      try { frame.contentWindow.postMessage(msg, origin); } catch (e) { /* iframe recargando */ }
    }

    // El inspector del iframe aprende el origen de la app de este mensaje
    // (nunca está hardcodeado) y recién entonces le contesta.
    function syncProjectInspector() {
      postToProjectFrame({ type: 'lpa:hello' });
      postToProjectFrame({ type: 'lpa:inspect-toggle', enabled: !!state.inspecting });
    }

    function onProjectInspectResult(data) {
      const pj = state.execution && state.execution.project;
      if (!pj || !state.editor) return;
      const payload = normalizeInspectPayload(data);
      const loc = locateInProject(pj.files, payload, pj.order);
      state.inspectedElement = { payload, loc, file: loc ? loc.path : null };
      if (!state.splitMode) setStudioView('code');
      if (loc) {
        if (loc.path !== pj.current) {
          selectProjectFile(loc.path);
          if (els.studioFileSelect) els.studioFileSelect.value = loc.path;
        }
        refreshEditor();
        const src = pj.files[loc.path];
        const gt = src.indexOf('>', loc.index);
        const end = Math.min(src.length, gt !== -1 && gt - loc.index < 300 ? gt + 1 : loc.index + 40);
        state.editor.scrollToLine(loc.line);
        if (typeof state.editor.selectRange === 'function') state.editor.selectRange(loc.index, end);
        els.aiEditStatus.textContent = `Elemento localizado: <${payload.tag}>${payload.id ? ' #' + payload.id : ''} en ${loc.path} (línea ${loc.line}, estrategia: ${loc.strategy}). Alcance sugerido: "Selección actual".`;
        els.aiEditStatus.classList.remove('status--error');
        els.aiScope.value = 'selection';
      } else {
        refreshEditor();
        els.aiEditStatus.textContent = `No se pudo ubicar automáticamente <${payload.tag}> en los archivos del proyecto. Buscalo a mano en el código o usá el alcance "Documento completo".`;
        els.aiEditStatus.classList.add('status--error');
      }
    }

    function addProjectVersion(partial) {
      const pj = state.execution && state.execution.project;
      if (!pj) return;
      state.versions = pushProjectVersion(state.versions, pj.files, partial);
      renderVersions();
    }

    // Aplica cambios {path,content,old,isNew} al proyecto: escribe cada archivo
    // en el dev server (HMR) y actualiza el estado del Estudio. Los archivos
    // cuyo contenido cambió desde que se pidió el cambio se omiten (conflicto)
    // salvo opts.force (restaurar versión). Devuelve { applied, failed, conflicts }.
    async function applyProjectChanges(exec, changes, opts) {
      const pj = exec.project;
      const force = !!(opts && opts.force);
      const conflicts = [];
      const toApply = [];
      changes.forEach((c) => {
        if (!force && !c.isNew && pj.files[c.path] !== c.old) conflicts.push(c.path);
        else toApply.push(c);
      });
      let applied = [];
      let failed = [];
      let gone = false;
      if (toApply.length && pj.previewStatus === 'ready' && pj.previewId) {
        const r = await putProjectFiles((u, i) => fetch(u, i), PROJECT_API, pj.previewId, toApply);
        applied = r.applied;
        failed = r.failed;
        gone = r.gone;
        if (gone) applied = toApply.map((c) => c.path); // la preview se cerró: se relanza con el estado nuevo
      } else {
        applied = toApply.map((c) => c.path); // se empuja al terminar de levantar / relanzar
        applied.forEach((p) => pj.dirtyPaths.add(p));
      }
      let addedNew = false;
      toApply.forEach((c) => {
        if (applied.indexOf(c.path) === -1) return;
        if (!Object.prototype.hasOwnProperty.call(pj.files, c.path)) addedNew = true;
        pj.files[c.path] = c.content;
      });
      if (addedNew) {
        const rank = (name) => { const i = PROJECT_ENTRY_ORDER.indexOf(name); return i === -1 ? 999 : i; };
        pj.order = Object.keys(pj.files).sort((a, b) => (rank(a) - rank(b)) || a.localeCompare(b));
        renderProjectFileSelect(pj);
      }
      if (applied.length) {
        pj.dirty = true;
        if (applied.indexOf(pj.current) !== -1 && state.editor) state.editor.setValue(pj.files[pj.current]);
      }
      if (gone) launchProjectPreview(exec);
      else if (pj.dirtyPaths.size) flushProjectWrites(exec);
      return { applied, failed, conflicts };
    }

    function describeProjectApply(res) {
      let msg = res.applied.length ? `Cambio aplicado en ${res.applied.length} archivo${res.applied.length === 1 ? '' : 's'}.` : 'No se aplicó ningún archivo.';
      if (res.failed.length) msg += ` El servidor rechazó: ${res.failed.map((f) => `${f.path} (${f.error})`).join('; ')}.`;
      if (res.conflicts.length) msg += ` Se omitieron por haber cambiado mientras tanto: ${res.conflicts.join(', ')}.`;
      return msg;
    }

    async function restoreProjectVersion(v) {
      const exec = state.execution;
      const pj = exec && exec.project;
      if (!pj || !v.files) return;
      const changes = diffProjectSnapshot(pj.files, v.files);
      if (!changes.length) {
        els.ejecutorStatus.textContent = 'La versión ya coincide con el proyecto actual.';
        return;
      }
      const res = await applyProjectChanges(exec, changes, { force: true });
      const extra = Object.keys(pj.files).filter((p) => !Object.prototype.hasOwnProperty.call(v.files, p));
      els.ejecutorStatus.textContent = `Versión restaurada: ${res.applied.length} archivo${res.applied.length === 1 ? '' : 's'} reescrito${res.applied.length === 1 ? '' : 's'}.`
        + (res.failed.length ? ` El servidor rechazó: ${res.failed.map((f) => `${f.path} (${f.error})`).join('; ')}.` : '')
        + (extra.length ? ` Se conservan los archivos agregados después: ${extra.join(', ')}.` : '');
      els.ejecutorStatus.classList.toggle('status--error', res.failed.length > 0);
    }

    function renderProjectAiDiff(candidate) {
      const diff = diffProjectChanges(candidate.changes);
      els.aiEditDiffSummary.textContent = `${diff.files.length} archivo${diff.files.length === 1 ? '' : 's'}: ${diff.added} líneas agregadas, ${diff.removed} eliminadas.`;
      if (els.aiEditFiles) {
        els.aiEditFiles.textContent = '';
        diff.files.forEach((f) => {
          const li = document.createElement('li');
          li.textContent = `${f.isNew ? '+ nuevo ' : '~ '}${f.path}: +${f.added} −${f.removed}${f.approximate ? ' (estimado)' : ''}`;
          els.aiEditFiles.appendChild(li);
        });
        els.aiEditFiles.hidden = !diff.files.length;
      }
      els.aiEditDiff.hidden = false;
    }

    // Edición IA de un proyecto multi-archivo. Devuelve { ok, error?, candidate? }.
    async function runProjectAiEdit(tag) {
      const exec = state.execution;
      const pj = exec && exec.project;
      const instruction = els.aiInstruction.value.trim();
      const fail = (msg) => {
        els.aiEditStatus.textContent = msg;
        els.aiEditStatus.classList.add('status--error');
        return { ok: false, error: msg };
      };
      if (!pj) return fail('No hay proyecto abierto.');
      if (!instruction) return fail('Escribí qué cambio querés pedirle a la IA.');
      let selectedFragment = null;
      if (els.aiScope.value === 'selection') {
        const sel = state.editor && state.editor.getSelection();
        if (sel && sel.trim()) selectedFragment = sel;
        else if (state.inspectedElement && state.inspectedElement.loc && state.inspectedElement.file && pj.files[state.inspectedElement.file]) {
          selectedFragment = pj.files[state.inspectedElement.file].slice(state.inspectedElement.loc.index, state.inspectedElement.loc.index + 400);
        }
        if (!selectedFragment) return fail('No hay selección: seleccioná texto en el editor, usá "Inspeccionar" sobre la preview, o cambiá el alcance a "Documento completo".');
      }
      const negativeConstraints = extractPromptSections(exec.promptUsed || '', exec.techniques, { resources: !!exec.resources }).sections['RESTRICCIONES NEGATIVAS'] || '';
      const view = buildProjectView(pj.files);
      const editPrompt = buildProjectEditPrompt({
        instruction, technology: pj.technology, viewText: view.text, negativeConstraints,
        selectedFragment, selectedFile: selectedFragment ? (state.editor && state.editor.getSelection() && state.editor.getSelection().trim() ? pj.current : state.inspectedElement && state.inspectedElement.file) : '',
      });
      const runId = generateClientRunId();
      state.aiEditRunId = runId;
      els.btnAiEdit.disabled = true;
      els.btnCancelAiEdit.hidden = false;
      els.aiEditStatus.classList.remove('status--error');
      const startedAt = Date.now();
      els.aiEditStatus.textContent = 'Aplicando el cambio con IA… 0s';
      const timer = setInterval(() => { els.aiEditStatus.textContent = `Aplicando el cambio con IA… ${Math.round((Date.now() - startedAt) / 1000)}s`; }, 1000);
      let result;
      try { result = await runLLM({ prompt: editPrompt, expect: 'files', runId }); } finally {
        clearInterval(timer);
        els.btnCancelAiEdit.hidden = true;
        els.btnAiEdit.disabled = false;
        state.aiEditRunId = null;
      }
      if (state.execution !== exec || exec.project !== pj) return { ok: false, error: 'La ejecución cambió mientras la IA respondía.' };
      if (!result.ok) return fail(result.error || 'La IA no respondió.');
      const text = result.text || result.html || '';
      if (/^\s*SIN CAMBIOS\.?\s*$/i.test(text)) return fail('La IA respondió que no hay nada que cambiar.');
      const parsed = parseProjectEditResponse(text, pj.files, { technology: pj.technology, blockedPaths: projectViewBlockedPaths(view) });
      if (!parsed.changes.length) {
        const why = parsed.rejected.length ? ` Descartados: ${parsed.rejected.map((r) => `${r.path} (${r.reason})`).join('; ')}.` : '';
        return fail(`${parsed.parsed ? 'La IA no propuso cambios aplicables.' : 'La IA no devolvió archivos en el formato `=== FILE: ruta ===`.'}${why}`);
      }
      state.aiEditCandidate = { project: true, changes: parsed.changes, instruction, tag: tag || '' };
      const elapsedS = ((Date.now() - startedAt) / 1000).toFixed(1);
      els.aiEditStatus.textContent = `Cambio listo (modelo ${result.model}, ${elapsedS}s). Revisá el diff por archivo y elegí Aceptar o Descartar.`
        + (parsed.rejected.length ? ` Se descartaron: ${parsed.rejected.map((r) => `${r.path} (${r.reason})`).join('; ')}.` : '');
      renderProjectAiDiff(state.aiEditCandidate);
      return { ok: true, candidate: state.aiEditCandidate };
    }

    async function onProjectAiEditAccept() {
      const cand = state.aiEditCandidate;
      const exec = state.execution;
      if (!cand || !exec || !exec.project) return;
      els.btnAiEditAccept.disabled = true;
      let res;
      try { res = await applyProjectChanges(exec, cand.changes); } finally { els.btnAiEditAccept.disabled = false; }
      if (state.aiEditCandidate !== cand) return; // descartado / reemplazado mientras tanto
      state.aiEditCandidate = null;
      els.aiEditDiff.hidden = true;
      if (els.aiEditFiles) els.aiEditFiles.hidden = true;
      if (res.applied.length) {
        els.aiInstruction.value = '';
        addProjectVersion({ source: 'ia', instruction: cand.instruction });
      }
      els.aiEditStatus.textContent = describeProjectApply(res) + (res.applied.length ? ' Guardado como nueva versión.' : '');
      els.aiEditStatus.classList.toggle('status--error', !res.applied.length || res.failed.length > 0);
      markCreatorDecision(cand.tag, res.applied.length ? 'accepted' : 'discarded');
    }

    /* ---------- Estudio: editor, click-to-code, IA, versiones ---------- */

    // API mínima común entre CodeMirror 5 y el respaldo <textarea>: si el
    // CDN de CodeMirror no cargó (offline, red bloqueada), el Estudio sigue
    // funcionando igual con esta interfaz de reemplazo.
    function createEditor(container, opts) {
      const initial = (opts && opts.value) || '';
      const onChangeCb = (opts && opts.onChange) || function () {};

      if (typeof window.CodeMirror === 'function') {
        container.textContent = '';
        const cm = window.CodeMirror(container, {
          value: initial,
          mode: 'htmlmixed',
          lineNumbers: true,
          lineWrapping: true,
          autoCloseTags: true,
          viewportMargin: 500,
        });
        let suppress = false;
        cm.on('change', () => { if (!suppress) onChangeCb(cm.getValue()); });
        return {
          kind: 'codemirror',
          getValue: () => cm.getValue(),
          setValue: (v) => { suppress = true; cm.setValue(v || ''); suppress = false; },
          onChange: (cb) => cm.on('change', () => cb(cm.getValue())),
          getSelection: () => cm.getSelection(),
          replaceSelection: (text) => cm.replaceSelection(text),
          scrollToLine: (line) => {
            const l = Math.max(0, line - 1);
            cm.scrollIntoView({ line: l, ch: 0 }, 100);
            cm.setCursor({ line: l, ch: 0 });
          },
          selectRange: (start, end) => {
            const from = cm.posFromIndex(start);
            const to = cm.posFromIndex(end);
            cm.setSelection(from, to);
            cm.scrollIntoView(from, 100);
          },
          focus: () => cm.focus(),
          refresh: () => cm.refresh(),
          setMode: (mode) => cm.setOption('mode', mode),
          setReadOnly: (v) => cm.setOption('readOnly', v ? true : false),
          scrollToEnd: () => { const h = cm.getScrollInfo().height; cm.scrollTo(null, h); },
        };
      }

      container.textContent = '';
      const ta = document.createElement('textarea');
      ta.className = 'studio__editor-fallback';
      ta.spellcheck = false;
      ta.value = initial;
      container.appendChild(ta);
      ta.addEventListener('input', () => onChangeCb(ta.value));
      return {
        kind: 'textarea',
        getValue: () => ta.value,
        setValue: (v) => { ta.value = v || ''; },
        onChange: (cb) => ta.addEventListener('input', () => cb(ta.value)),
        getSelection: () => ta.value.slice(ta.selectionStart, ta.selectionEnd),
        replaceSelection: (text) => {
          const s = ta.selectionStart;
          const e = ta.selectionEnd;
          ta.value = ta.value.slice(0, s) + text + ta.value.slice(e);
          ta.selectionStart = ta.selectionEnd = s + text.length;
        },
        scrollToLine: (line) => {
          const lines = ta.value.split('\n');
          const idx = lines.slice(0, Math.max(0, line - 1)).join('\n').length;
          ta.focus();
          ta.setSelectionRange(idx, idx);
        },
        selectRange: (start, end) => {
          ta.focus();
          ta.setSelectionRange(start, end);
        },
        focus: () => ta.focus(),
        refresh: () => {},
        setMode: () => {},
        setReadOnly: (v) => { ta.readOnly = !!v; },
        scrollToEnd: () => { ta.scrollTop = ta.scrollHeight; },
      };
    }

    function schedulePreviewUpdate() {
      if (state.previewDebounceTimer) clearTimeout(state.previewDebounceTimer);
      state.previewDebounceTimer = setTimeout(() => {
        const html = state.editor ? state.editor.getValue() : '';
        renderPreviewHtml(html);
      }, 400);
    }

    // Id que scopea el borrador del Estudio en localStorage (Feature 5): la
    // entrada del Banco si esta ejecución vino de ahí / ya se guardó, si no
    // el runId de la ejecución en curso (sobrevive sólo dentro de la misma
    // sesión: al recargar la página se recupera cuando se reabre la misma
    // landing del Banco, que es el caso documentado).
    function getStudioDraftId() {
      if (state.openedFromBank) return state.openedFromBank;
      return (state.execution && state.execution.runId) || null;
    }

    function onEditorChange(value) {
      if (isProjectExecution()) { onProjectEditorChange(value); return; }
      if (state.execution) state.execution.html = value;
      schedulePreviewUpdate();
      if (els.studioDraftNotice && !els.studioDraftNotice.hidden) els.studioDraftNotice.hidden = true;
      if (state.studioDraftDebounceTimer) clearTimeout(state.studioDraftDebounceTimer);
      state.studioDraftDebounceTimer = setTimeout(() => {
        const id = getStudioDraftId();
        if (id) saveStudioDraft(id, value);
      }, 500);
    }

    function makeVersionId() {
      return 'v' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    }

    function renderVersions() {
      if (!els.versionsList) return;
      els.versionsList.textContent = '';
      const fmt = new Intl.DateTimeFormat('es', { dateStyle: 'short', timeStyle: 'short' });
      const SOURCE_LABELS = { ia: 'IA', manual: 'Manual', generado: 'Generado', humana: 'Reescritura humana' };
      state.versions.forEach((v) => {
        const li = document.createElement('li');
        li.className = 'versions-list__item';
        const label = document.createElement('span');
        label.textContent = `${SOURCE_LABELS[v.source] || v.source} · ${fmt.format(new Date(v.date))}${v.files ? ` · ${Object.keys(v.files).length} archivos` : ''}${v.instruction ? ` · "${v.instruction}"` : ''}`;
        li.appendChild(label);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn--secondary';
        btn.textContent = 'Restaurar';
        btn.addEventListener('click', () => {
          if (v.files) { restoreProjectVersion(v); return; }
          if (!state.editor) return;
          state.editor.setValue(v.html);
          if (state.execution) state.execution.html = v.html;
          state.studioBaseline = v.html;
          schedulePreviewUpdate();
        });
        li.appendChild(btn);
        els.versionsList.appendChild(li);
      });
    }

    function addVersion(partial) {
      const version = Object.assign({ id: makeVersionId(), date: new Date().toISOString() }, partial);
      state.versions.unshift(version);
      if (state.versions.length > 10) state.versions.length = 10; // tope: respeta cuota de localStorage al guardar en Banco
      if (typeof version.html === 'string') state.studioBaseline = version.html; // guardar versión = ya no está "sucio"
      renderVersions();
    }

    function renderStudioDraftNotice(show) {
      if (!els.studioDraftNotice) return;
      els.studioDraftNotice.hidden = !show;
    }

    function onDiscardStudioDraft() {
      const id = getStudioDraftId();
      clearStudioDraft(id);
      if (state.editor) {
        state.editor.setValue(state.studioBaseline || '');
        if (state.execution) state.execution.html = state.studioBaseline || '';
        schedulePreviewUpdate();
      }
      renderStudioDraftNotice(false);
    }

    // Inicializa (o reemplaza) el editor con el HTML de una ejecución nueva.
    // Sólo se llama UNA vez por objeto `execution` (ver exec.editorInited en
    // renderEjecutor): así no se pisan ediciones del usuario en cada
    // re-render.
    //
    // Feature 5: si hay un borrador de Estudio guardado en localStorage para
    // este id (ejecución/Banco) y difiere del HTML recibido, se restaura ese
    // borrador en el editor (no el HTML "oficial") y se avisa con
    // #studio-draft-notice. El baseline (para detectar "sucio", Feature 2)
    // queda en el HTML oficial recibido, no en el borrador restaurado: así
    // el borrador restaurado cuenta correctamente como cambio sin guardar.
    function initEditorForExecution(html, opts) {
      const o = opts || {};
      resetProjectUi();
      if (state.editor && state.editor.setMode) state.editor.setMode('htmlmixed');
      const draftId = getStudioDraftId();
      const draft = draftId ? loadStudioDraft(draftId) : null;
      const restored = !!(draft && typeof draft.html === 'string' && draft.html !== html);
      const value = restored ? draft.html : html;
      if (!state.editor) {
        state.editor = createEditor(els.editorContainer, { value, onChange: onEditorChange });
      } else {
        state.editor.setValue(value);
      }
      state.studioBaseline = html;
      if (state.execution) state.execution.html = value;
      state.versions = (o.versions && o.versions.length) ? o.versions.slice() : [{ id: makeVersionId(), source: o.initialSource || 'generado', html, date: new Date().toISOString() }];
      renderVersions();
      consoleClear(false);
      renderPreviewHtml(value);
      renderStudioDraftNotice(restored);
      setStudioView('preview'); // Feature 1: tras ejecutar, se ve la preview; el código queda oculto hasta pedirlo
    }

    function isStudioDirty() {
      if (isProjectExecution()) return state.execution.status === 'done' && !!state.execution.project.dirty;
      return !!(state.editor && state.execution && state.execution.status === 'done' && isHtmlDirty(state.editor.getValue(), state.studioBaseline));
    }

    // Antes de reemplazar el HTML del Estudio (re-ejecutar / ejecutar de
    // nuevo / "Ejecutar nuevamente" desde el Banco), si hay cambios sin
    // guardar se pregunta qué hacer. Devuelve true si es seguro continuar.
    async function confirmReplaceStudio() {
      if (!isStudioDirty()) return true;
      if (isProjectExecution()) {
        const choice = await showConfirmDialog({
          title: 'Cambios sin guardar en el proyecto',
          message: 'Editaste archivos del proyecto y no los guardaste en el Banco. Si continuás, se van a reemplazar.',
          actions: [
            { id: 'discard', label: 'Descartar cambios', variant: 'btn--secondary' },
            { id: 'cancel', label: 'Cancelar', variant: 'btn--secondary', autofocus: true },
          ],
        });
        return choice === 'discard';
      }
      const action = await showConfirmDialog({
        title: 'Cambios sin guardar en el Estudio',
        message: 'Tenés cambios sin guardar en el código del Estudio. Si continuás, se van a reemplazar.',
        actions: [
          { id: 'save', label: 'Guardar versión y continuar', variant: 'btn--primary' },
          { id: 'discard', label: 'Descartar cambios', variant: 'btn--secondary' },
          { id: 'cancel', label: 'Cancelar', variant: 'btn--secondary', autofocus: true },
        ],
      });
      if (action === 'save') {
        addVersion({ source: 'manual', html: state.editor.getValue() });
        return true;
      }
      return action === 'discard';
    }

    function renderSeedHint() {
      if (!els.ejecutorSeedHint) return;
      const seed = state.execution && state.execution.ssotSeed;
      els.ejecutorSeedHint.hidden = !seed;
      if (!seed) { els.ejecutorSeedHint.textContent = ''; return; }
      els.ejecutorSeedHint.textContent = `Cadena semilla de esta ejecución: ${shortSeed(seed)}. Regenerar repite la misma dirección. Para otra dirección, generá una nueva cadena en el paso 2.`;
    }

    function renderEjecutor() {
      renderEjecutorMain();
      syncConsoleChrome();
      renderServerBar();
    }

    function renderEjecutorMain() {
      updateProviderSummary();
      renderSeedHint();
      renderProjectLog();
      const exec = state.execution;
      if (!exec) {
        els.ejecutorStatus.textContent = 'Todavía no ejecutaste ningún prompt.';
        els.btnSaveBank.disabled = true;
        els.btnCancelExecute.hidden = true;
        return;
      }
      if (exec.status === 'loading') {
        els.ejecutorStatus.textContent = exec.stream
          ? formatStreamStatus(Object.assign({ elapsedMs: Date.now() - exec.stream.startedAt }, exec.stream))
          : exec.project
          ? (exec.project.message || 'Preparando la vista previa del proyecto…')
          : (state.provider.type === 'opencode-local'
            ? 'OpenCode está generando la landing… puede tardar hasta unos minutos; si el modelo elegido no responde, se prueba automáticamente con otro modelo gratis.'
            : 'Generando la landing page… esto puede tardar unos segundos.');
        els.ejecutorStatus.classList.remove('status--error');
        els.ejecutorStatus.classList.add('status--loading');
        els.btnSaveBank.disabled = true;
        els.btnCancelExecute.hidden = !!exec.project || !(exec.abort || state.provider.type === 'opencode-local');
      } else if (exec.status === 'error') {
        els.ejecutorStatus.textContent = (exec.error || 'Ocurrió un error al ejecutar el prompt.') + formatOpencodeAttempts(exec.attempts);
        els.ejecutorStatus.classList.remove('status--loading');
        els.ejecutorStatus.classList.add('status--error');
        els.btnSaveBank.disabled = true;
        els.btnCancelExecute.hidden = true;
      } else if (exec.status === 'done') {
        const pj = exec.project;
        if (pj) {
          const isErr = pj.previewStatus === 'error';
          const base = (isErr || pj.previewStatus === 'stopped') ? pj.message
            : (pj.previewStatus === 'launching' ? pj.message
              : `Proyecto ${TECHNOLOGIES[pj.technology] ? TECHNOLOGIES[pj.technology].label : pj.technology} generado con ${exec.label}. Vista previa en el servidor de desarrollo local.`);
          els.ejecutorStatus.textContent = base + (pj.warning ? ` ${pj.warning}` : '') + formatOpencodeAttempts(exec.attempts)
            + (isErr ? ' Editá el código para reintentar: la vista previa se relanza sola.' : '') + formatAssetsUsage(exec);
          els.ejecutorStatus.classList.toggle('status--error', isErr || !!pj.warning);
          els.ejecutorStatus.classList.toggle('status--loading', pj.previewStatus === 'launching');
          setProjectPreviewFrame(pj);
        } else {
          els.ejecutorStatus.textContent = `Landing generada con ${exec.label}.` + formatOpencodeAttempts(exec.attempts) + formatAssetsUsage(exec);
          els.ejecutorStatus.classList.remove('status--loading', 'status--error');
        }
        const consoleHint = consoleHintText();
        state.consoleLog.lastHint = consoleHint;
        if (consoleHint) {
          els.ejecutorStatus.textContent += ' ' + consoleHint;
          els.ejecutorStatus.classList.add('status--error');
        }
        els.btnSaveBank.disabled = false;
        els.btnCancelExecute.hidden = true;
        if (!exec.editorInited) {
          exec.editorInited = true;
          const versions = state.pendingVersions;
          state.pendingVersions = null;
          if (pj) initEditorForProject(exec);
          else initEditorForExecution(exec.html, { versions, initialSource: 'generado' });
        }
      } else {
        els.ejecutorStatus.textContent = '';
        els.btnSaveBank.disabled = true;
        els.btnCancelExecute.hidden = true;
      }
    }

    // UI de streaming de la ejecución: contador + tiempo en #ejecutor-status,
    // vista previa parcial throttled (HTML único), texto en vivo en el editor
    // (sólo lectura mientras dura) y lista de archivos (multi-archivo).
    function createExecutionStream(exec, wantsFiles) {
      const info = { startedAt: Date.now(), chars: 0, reasoningChars: 0, files: [], partialShown: false };
      const view = { lastAt: 0, lastLen: 0 };
      const wrap = document.getElementById('preview-wrap');
      let stopped = false;
      const paint = () => {
        if (stopped || !els.ejecutorStatus) return;
        els.ejecutorStatus.textContent = formatStreamStatus(Object.assign({ elapsedMs: Date.now() - info.startedAt }, info));
      };
      const timer = setInterval(paint, 500);
      function onDelta(text, meta) {
        if (stopped) return;
        const m = meta || {};
        if (m.restart) { // el server cambió de modelo: se descarta el parcial anterior
          view.lastAt = 0; view.lastLen = 0; info.partialShown = false; info.files = [];
          if (state.editor && !wantsFiles) state.editor.setValue('');
        }
        info.chars = text.length;
        info.reasoningChars = m.reasoningChars || 0;
        const now = Date.now();
        if (!shouldStreamTick(view, now, text.length, STREAM_TICK_MS)) return;
        view.lastAt = now;
        view.lastLen = text.length;
        if (wantsFiles) { info.files = parseStreamFileList(text); return; }
        try {
          if (!state.editor) state.editor = createEditor(els.editorContainer, { value: text, onChange: onEditorChange });
          else state.editor.setValue(text);
          if (state.editor.setReadOnly) state.editor.setReadOnly(true);
          if (state.editor.scrollToEnd) state.editor.scrollToEnd();
          const html = partialPreviewHtml(text);
          if (html) {
            sendHtmlToPreview(html);
            info.partialShown = true;
            if (wrap) wrap.setAttribute('data-streaming', 'true');
          }
        } catch (e) { /* la vista en vivo nunca debe romper la ejecución */ }
      }
      function stop() {
        stopped = true;
        clearInterval(timer);
        if (wrap) wrap.removeAttribute('data-streaming');
        if (state.editor && state.editor.setReadOnly) state.editor.setReadOnly(false);
      }
      return { info, onDelta, stop };
    }

    async function executeCurrent() {
      const exec = state.execution;
      // {{SSOT_SEED}} se sustituye por la MISMA cadena con la que se generó el
      // prompt (exec.ssotSeed, la que el usuario ve y controla), a partir de la
      // plantilla original. "Regenerar" repite la dirección (el modelo puede
      // variar su salida); para otra dirección se genera otra cadena en el
      // paso 2. Si no hay marca (prompt viejo o editado a mano sin ella), es un no-op.
      const templateSource = exec.promptTemplate || exec.promptUsed;
      exec.promptUsed = substituteSeedToken(templateSource, exec.ssotSeed || state.ssotSeed);
      exec.status = 'loading';
      exec.runId = generateClientRunId();
      cancelPostExecPasses(); // Fase C: una ejecución nueva invalida las pasadas posteriores anteriores
      // Proyecto multi-archivo (React/Vue con Vite, Next.js): el prompt pide
      // bloques `=== FILE: … ===`; se pide al backend el texto CRUDO (expect
      // 'files') para que extractHtml no los destruya. Una re-ejecución
      // descarta el dev server anterior.
      const wantsFiles = promptWantsProjectFiles(exec.promptUsed);
      if (exec.project) {
        if (exec.project.previewId) stopProjectPreview(exec.project.previewId);
        exec.project.launchToken++;
        exec.project = null;
      }
      // Streaming (por defecto): la landing se ve armándose en vivo. Cancelar
      // aborta el fetch (el server aborta el upstream / mata opencode).
      const abortCtl = (typeof AbortController === 'function') ? new AbortController() : null;
      exec.abort = abortCtl;
      const streamUi = createExecutionStream(exec, wantsFiles);
      exec.stream = streamUi.info;
      renderEjecutor();
      let result;
      try {
        result = (state.provider.type === 'opencode-local')
          ? await runOpencodeComplete({ prompt: exec.promptUsed, model: state.provider.model, expect: wantsFiles ? 'files' : 'html', runId: exec.runId, stream: true, onDelta: streamUi.onDelta, signal: abortCtl && abortCtl.signal })
          : await runPrompt(state.provider, exec.promptUsed, { expect: wantsFiles ? 'files' : 'html', stream: true, onDelta: streamUi.onDelta, signal: abortCtl && abortCtl.signal });
      } finally {
        streamUi.stop();
        exec.abort = null;
        exec.stream = null;
      }
      if (result.ok && wantsFiles && !result.text && result.html) {
        // El modelo devolvió un HTML único: se muestra igual, con aviso.
        exec.status = 'done';
        exec.html = result.html;
        exec.attempts = (result.attempts || []).concat([{ model: result.model || state.provider.model, status: 'aviso', error: 'El modelo devolvió un HTML único en lugar del proyecto multi-archivo; se muestra como HTML (sin servidor de desarrollo).' }]);
        renderEjecutor();
        onExecutionDone(exec);
        return;
      }
      if (result.ok && wantsFiles) {
        const parsed = parseProjectFiles(normalizeProjectFilesText(result.text));
        if (!parsed.length) {
          exec.status = 'error';
          exec.error = 'El modelo no devolvió archivos en el formato `=== FILE: ruta ===`.';
          exec.attempts = result.attempts || [];
          renderEjecutor();
          return;
        }
        const fileMap = {};
        parsed.forEach((f) => { fileMap[f.path] = f.content; });
        exec.html = '';
        exec.attempts = result.attempts || [];
        exec.project = makeProjectState(fileMap, detectProjectTechnology(Object.keys(fileMap)));
        exec.project.message = 'Preparando la vista previa del proyecto…';
        renderEjecutor();
        await launchProjectPreview(exec); // pasa exec.status a 'done' al terminar (también si hay error de compilación)
        onExecutionDone(exec); // Fase C: limpia el panel y avisa que las pasadas posteriores se omiten
        return;
      }
      if (result.ok) {
        exec.status = 'done';
        exec.html = result.html;
        exec.attempts = result.attempts || [];
      } else {
        exec.status = 'error';
        exec.error = result.error;
        exec.attempts = result.attempts || [];
      }
      renderEjecutor();
      onExecutionDone(exec); // Fase C: pasadas posteriores (técnicas 3 y 8); no bloquea
    }

    /* ---------- Pasadas posteriores a la ejecución (técnicas 3 y 8) ----------
     * onExecutionDone(exec) se llama al terminar executeCurrent. Secuencia
     * (nunca dos ediciones a la vez): arreglo de recursos (si hace falta) ->
     * técnica 3: crítico audita la LANDING (JSON de arreglos) -> creador aplica
     * los arreglos marcados con el flujo de edición IA (diff + Aceptar /
     * Descartar) -> técnica 8: reescritura humana sobre el HTML resultante.
     * Tras aceptar, "Segunda vuelta del crítico" repite crítico+creador (máx.
     * CRITIC_MAX_ROUNDS). Se omiten con salidas multi-archivo (Fase B).
     */
    let postExecSeq = 0;

    function isSingleHtmlExec(exec) {
      if (!exec || exec.status !== 'done') return false;
      if (exec.multiFile || exec.project) return false; // Fase B: proyecto multi-archivo (exec.html vacío)
      if (Array.isArray(exec.files) && exec.files.length) return false;
      if (exec.files && typeof exec.files === 'object' && !Array.isArray(exec.files) && Object.keys(exec.files).length) return false;
      return typeof exec.html === 'string' && /<html[\s>]/i.test(exec.html);
    }

    // Técnicas 3 y 8: HTML único, o proyecto multi-archivo que compiló (las
    // pasadas leen y reescriben archivos vía la edición IA de proyectos).
    function canRunPostExecPasses(exec) {
      if (isSingleHtmlExec(exec)) return true;
      return !!(exec && exec.status === 'done' && exec.project && exec.project.previewStatus !== 'error' && Object.keys(exec.project.files).length);
    }

    // Invalida las pasadas en curso (si las hay) y limpia el panel.
    function cancelPostExecPasses() {
      postExecSeq++;
      if (state.postExec && state.postExec.busy) cancelOpencodeRun(state.postExec.runId);
      resolveAiEditDecision('cancelled');
      resetPostExec();
      renderPostExecPanel();
    }

    function resetPostExec() {
      state.postExec = { busy: false, stage: '', note: '', cro: null, rewrite: null, runId: null };
    }

    // Fase D: verifica que las URLs reunidas (obligatorias, fotos, generadas,
    // video) aparezcan en el resultado. Si falta algo obligatorio (o no se usó
    // ninguna foto) en un HTML único, se dispara la pasada de edición IA
    // existente (con diff para aceptar); en multi-archivo solo se avisa.
    function getExecutionText(exec) {
      if (exec.project && exec.project.files) return Object.keys(exec.project.files).map((k) => exec.project.files[k]).join('\n');
      return state.editor ? state.editor.getValue() : (exec.html || '');
    }

    function formatAssetsUsage(exec) {
      const u = exec && exec.assetsReport;
      if (!u || !u.total) return '';
      let msg = ` Recursos usados: ${u.used}/${u.total}.`;
      if (u.missingRequired.length) msg += ` Faltan ${u.missingRequired.length} obligatorio${u.missingRequired.length === 1 ? '' : 's'}.`;
      if (u.needsPexelsCredit) msg += ' Falta el crédito a Pexels en el footer.';
      return msg;
    }

    async function verifyAssetsUsage(exec) {
      exec.assetsReport = null;
      if (!exec.assets || !listAssetEntries(exec.assets).length) return;
      const usage = assetUsage(exec.assets, getExecutionText(exec));
      exec.assetsReport = usage;
      renderEjecutor();
      const single = isSingleHtmlExec(exec);
      if (!usageNeedsFix(usage)) return;
      const names = usage.missingRequired.map((r) => `${r.role || 'otro'} (${r.name || r.url})`).join(', ');
      if (!single) {
        state.postExec.note = `${usage.missingRequired.length ? `Faltan recursos obligatorios: ${names}. ` : ''}${usage.photosTotal && !usage.photosUsed ? 'No se usó ninguna foto real. ' : ''}En proyectos multi-archivo no se corrige automáticamente: agregalos a mano en el código.`;
        renderPostExecPanel();
        return;
      }
      if (exec.assetsFixRequested || !els.aiInstruction || !els.aiScope) return;
      exec.assetsFixRequested = true;
      state.postExec.note = `${usage.missingRequired.length ? `Faltan recursos obligatorios: ${names}. ` : 'No se usó ninguna foto real. '}Se pidió a la IA insertarlos: revisá el resumen en "Pedile un cambio a la IA" y aceptá o descartá.`;
      renderPostExecPanel();
      els.aiInstruction.value = buildMissingAssetsInstruction(usage, state.project);
      els.aiScope.value = 'document';
      if (els.aiEditPanel && els.aiEditPanel.scrollIntoView) els.aiEditPanel.scrollIntoView({ block: 'nearest' });
      await runAiEdit('assets');
    }

    // Espera a que el usuario acepte o descarte el candidato de edición IA
    // pendiente (si lo hay). Así nunca corren dos pasadas de edición a la vez.
    let aiEditWaiters = [];
    function waitAiEditDecision() {
      if (!state.aiEditCandidate) return Promise.resolve('none');
      return new Promise((resolve) => { aiEditWaiters.push(resolve); });
    }
    function resolveAiEditDecision(kind) {
      const ws = aiEditWaiters;
      aiEditWaiters = [];
      ws.forEach((r) => r(kind));
    }

    async function onExecutionDone(exec) {
      const token = ++postExecSeq;
      resolveAiEditDecision('superseded');
      resetPostExec();
      renderPostExecPanel();
      if (!exec || exec.status !== 'done') return;
      const alive = () => token === postExecSeq && state.execution === exec;
      await verifyAssetsUsage(exec); // Fase D: ¿aparecen las URLs de los recursos reunidos? (puede generar un candidato)
      const t = normalizeTechniques(exec.techniques !== undefined ? exec.techniques : state.techniques);
      const wantsCro = t.indexOf(3) !== -1;
      const wantsRewrite = t.indexOf(8) !== -1;
      if (!wantsCro && !wantsRewrite) return;
      if (!canRunPostExecPasses(exec)) {
        const why = exec.project
          ? 'La vista previa del proyecto tiene un error de compilación: se omiten el crítico y la reescritura humana hasta que compile (editá el código y volvé a ejecutar).'
          : 'Las pasadas posteriores (crítico y reescritura humana) requieren un HTML único o un proyecto multi-archivo.';
        state.postExec.note = `${state.postExec.note ? `${state.postExec.note} ` : ''}${why}`;
        renderPostExecPanel();
        return;
      }
      try {
        if (state.aiEditCandidate) { // arreglo de recursos pendiente: primero se resuelve
          state.postExec.note = `${state.postExec.note ? `${state.postExec.note} ` : ''}Después de aceptar o descartar ese cambio siguen las demás pasadas.`;
          renderPostExecPanel();
          await waitAiEditDecision();
          if (!alive()) return;
        }
        state.postExec.busy = true;
        if (wantsCro) {
          await runCriticRound(exec, t, alive, 1);
          if (!alive()) return;
          await waitCreatorDecision(alive);
        }
        if (wantsRewrite && alive()) {
          state.postExec.busy = true;
          await runHumanRewrite(exec, t, alive);
        }
      } catch (e) {
        if (alive()) state.postExec.note = `Error en las pasadas posteriores: ${(e && e.message) || e}`;
      }
      if (alive()) {
        state.postExec.busy = false;
        state.postExec.stage = '';
        renderPostExecPanel();
      }
    }

    // Si el creador dejó un diff pendiente, libera "busy" y espera Aceptar/Descartar.
    async function waitCreatorDecision(alive) {
      const pe = state.postExec;
      if (!pe.cro || pe.cro.creator !== 'ready') return;
      pe.busy = false;
      pe.stage = '';
      pe.note = 'Revisá el diff en "Pedile un cambio a la IA" y elegí Aceptar o Descartar.';
      renderPostExecPanel();
      await waitAiEditDecision();
      if (!alive()) return;
      pe.note = '';
    }

    function setPostExecStage(text) {
      state.postExec.stage = text;
      state.postExec.runId = generateClientRunId();
      renderPostExecPanel();
    }

    // Etapa con contador de segundos: "Crítico auditando la landing… 12s".
    function startPostExecTimer(label, newRunId) {
      const pe = state.postExec;
      const t0 = Date.now();
      const paint = () => { pe.stage = `${label}… ${Math.round((Date.now() - t0) / 1000)}s`; renderPostExecPanel(); };
      if (newRunId) pe.runId = generateClientRunId();
      paint();
      const timer = setInterval(paint, 1000);
      return () => clearInterval(timer);
    }

    // a) Crítico audita la landing -> b) lista -> c) creador automático.
    async function runCriticRound(exec, techniques, alive, round) {
      const pe = state.postExec;
      const startedAt = Date.now();
      pe.busy = true;
      pe.note = '';
      pe.cro = { status: 'loading', round, items: [], creator: 'idle' };
      const stop = startPostExecTimer(`Crítico auditando la landing (Vuelta ${round}/${CRITIC_MAX_ROUNDS})`, true);
      const html = exec.project ? '' : (state.editor ? state.editor.getValue() : exec.html);
      const projectView = exec.project ? buildProjectView(exec.project.files).text : '';
      let res;
      try {
        res = await runLLM({
          prompt: buildCriticAuditPrompt({ html, projectView, project: state.project, techniques }),
          expect: 'text', runId: pe.runId, role: 'critic',
        });
      } finally { stop(); }
      if (!alive()) return;
      if (!res.ok) { pe.cro = { status: 'error', round, error: res.error, items: [], creator: 'idle' }; return; }
      const items = parseCriticItems(res.text).map((it) => Object.assign({ selected: it.prioridad !== 'baja' }, it));
      const looksEmpty = /^\s*(```[a-z]*\s*)?\[\s*\]/i.test(res.text) || /VEREDICTO\s*:\s*\**\s*OK/i.test(res.text);
      pe.cro = { status: 'done', round, items, ok: !items.length && looksEmpty, empty: !items.length && !looksEmpty, creator: 'idle', model: res.model, elapsedMs: Date.now() - startedAt };
      if (items.some((it) => it.selected)) await runCreatorPass(exec, alive);
    }

    // c) Creador: arma la instrucción con los ítems marcados y reutiliza el
    // flujo de edición IA (candidato + diff + Aceptar/Descartar).
    async function runCreatorPass(exec, alive) {
      const pe = state.postExec;
      const cro = pe.cro;
      const picked = cro.items.filter((it) => it.selected);
      if (!picked.length) return;
      cro.creator = 'running';
      cro.creatorError = '';
      pe.busy = true;
      els.aiInstruction.value = buildCriticApplyInstruction(picked);
      els.aiScope.value = 'document';
      const stop = startPostExecTimer(`Creador aplicando ${picked.length} arreglo${picked.length === 1 ? '' : 's'}`, false);
      let r;
      try { r = await runAiEdit('critic'); } finally { stop(); }
      if (!alive()) return;
      if (r && r.ok) {
        cro.creator = 'ready';
        pe.stage = 'Revisá el diff';
        if (els.aiEditPanel && els.aiEditPanel.scrollIntoView) els.aiEditPanel.scrollIntoView({ block: 'nearest' });
      } else {
        cro.creator = 'error';
        cro.creatorError = (r && r.error) || 'El creador no devolvió un HTML válido.';
        pe.stage = '';
      }
    }

    async function runHumanRewrite(exec, techniques, alive) {
      const pe = state.postExec;
      const startedAt = Date.now();
      pe.rewrite = { status: 'loading' };
      setPostExecStage('Reescritura humana del copy…');
      const base = exec.project ? '' : (state.editor ? state.editor.getValue() : exec.html);
      let restrictions = '';
      if (techniques.indexOf(7) !== -1) {
        const sec = extractPromptSections(exec.promptUsed || '', exec.techniques, { resources: exec.resources }).sections['RESTRICCIONES NEGATIVAS'];
        restrictions = sec || `Palabras a evitar:\n${bulletList(BANNED_WORDS)}`;
      }
      if (exec.project) { await runProjectHumanRewrite(exec, restrictions, alive, startedAt); return; }
      const res = await runLLM({
        prompt: buildHumanRewritePrompt({ html: base, project: state.project, restrictions }),
        expect: 'html', runId: pe.runId,
      });
      if (!alive()) return;
      if (!res.ok || !res.html) { pe.rewrite = { status: 'error', error: res.error || 'La IA no devolvió un HTML válido.' }; return; }
      const check = verifyRewriteStructure(base, res.html);
      if (!check.ok) {
        pe.rewrite = { status: 'rejected', reasons: check.reasons, before: check.before, after: check.after };
        return;
      }
      if (res.html === base) { pe.rewrite = { status: 'unchanged' }; return; }
      const diff = diffLines(base, res.html);
      // addVersion() fija el baseline del Estudio al HTML de la versión; acá
      // el editor sigue mostrando el original, así que se conserva el
      // baseline previo para no marcar el Estudio como "sucio" por error.
      const prevBaseline = state.studioBaseline;
      addVersion({ source: 'humana', instruction: 'Reescritura humana', html: res.html });
      state.studioBaseline = prevBaseline;
      pe.rewrite = { status: 'done', html: res.html, added: diff.added, removed: diff.removed, tags: check.after, model: res.model, elapsedMs: Date.now() - startedAt };
    }

    // Técnica 8 en proyectos: la IA devuelve sólo los archivos con copy
    // reescrito; cada uno se verifica (mismos imports, mismas etiquetas y
    // clases) y los que alteran la estructura se descartan con aviso. Nada se
    // escribe hasta que el usuario pulsa "Aplicar la reescritura".
    async function runProjectHumanRewrite(exec, restrictions, alive, startedAt) {
      const pe = state.postExec;
      const pj = exec.project;
      const view = buildProjectView(pj.files, { include: (p) => !/\.css$/i.test(p) });
      const res = await runLLM({
        prompt: buildProjectRewritePrompt({ viewText: view.text, project: state.project, restrictions }),
        expect: 'files', runId: pe.runId,
      });
      if (!alive()) return;
      if (!res.ok || !(res.text || res.html)) { pe.rewrite = { status: 'error', error: res.error || 'La IA no devolvió archivos en el formato `=== FILE: ruta ===`.' }; return; }
      const out = filterProjectRewrite(res.text || res.html, pj.files, { technology: pj.technology, blockedPaths: projectViewBlockedPaths(view) });
      const discarded = out.discarded.map((d) => `${d.path} (${d.reasons.slice(0, 3).join(', ')})`).concat(out.rejected.map((r) => `${r.path} (${r.reason})`));
      if (!out.changes.length) {
        pe.rewrite = discarded.length
          ? { status: 'rejected', project: true, reasons: discarded, before: 0, after: 0 }
          : { status: 'unchanged' };
        return;
      }
      const diff = diffProjectChanges(out.changes);
      pe.rewrite = { status: 'done', project: true, changes: out.changes, files: out.changes.map((c) => c.path), discarded, added: diff.added, removed: diff.removed, tags: out.tags, model: res.model, elapsedMs: Date.now() - startedAt };
    }

    function onCancelPostExec() {
      const pe = state.postExec;
      if (!pe || !pe.busy) return;
      postExecSeq++; // invalida las pasadas en curso
      cancelOpencodeRun(pe.runId);
      if (state.aiEditRunId) cancelOpencodeRun(state.aiEditRunId);
      resolveAiEditDecision('cancelled');
      pe.busy = false;
      pe.stage = '';
      pe.note = 'Pasadas posteriores canceladas.';
      if (pe.cro && pe.cro.status === 'loading') pe.cro = null;
      else if (pe.cro && pe.cro.creator === 'running') pe.cro.creator = 'error';
      if (pe.rewrite && pe.rewrite.status === 'loading') pe.rewrite = null;
      renderPostExecPanel();
    }

    // "Rehacer arreglos": vuelve a correr SOLO el creador con la selección actual.
    async function onCroApplyClick() {
      const pe = state.postExec;
      const cro = pe && pe.cro;
      const exec = state.execution;
      if (!cro || cro.status !== 'done' || pe.busy || !exec) return;
      if (!cro.items.some((s) => s.selected)) {
        els.postExecStatus.textContent = 'Marcá al menos un arreglo para aplicar.';
        els.postExecStatus.classList.add('status--error');
        return;
      }
      const token = ++postExecSeq;
      const alive = () => token === postExecSeq && state.execution === exec;
      resolveAiEditDecision('superseded');
      state.aiEditCandidate = null;
      if (els.aiEditDiff) els.aiEditDiff.hidden = true;
      await runCreatorPass(exec, alive);
      if (!alive()) return;
      pe.busy = false;
      pe.note = cro.creator === 'ready' ? 'Revisá el diff en "Pedile un cambio a la IA" y elegí Aceptar o Descartar.' : '';
      renderPostExecPanel();
    }

    // "Segunda vuelta del crítico": repite crítico + creador sobre el HTML aceptado.
    async function onCroRound2Click() {
      const pe = state.postExec;
      const cro = pe && pe.cro;
      const exec = state.execution;
      if (!cro || pe.busy || !exec || cro.creator !== 'accepted' || cro.round >= CRITIC_MAX_ROUNDS) return;
      const t = normalizeTechniques(exec.techniques !== undefined ? exec.techniques : state.techniques);
      const token = ++postExecSeq;
      const alive = () => token === postExecSeq && state.execution === exec;
      const wantsRewrite = t.indexOf(8) !== -1;
      if (wantsRewrite) pe.rewrite = null; // quedaría obsoleta: se rehace sobre el HTML nuevo
      await runCriticRound(exec, t, alive, cro.round + 1);
      if (!alive()) return;
      await waitCreatorDecision(alive);
      if (wantsRewrite && alive()) {
        pe.busy = true;
        await runHumanRewrite(exec, t, alive);
      }
      if (alive()) { pe.busy = false; pe.stage = ''; renderPostExecPanel(); }
    }

    async function onRewriteUseClick() {
      const rw = state.postExec && state.postExec.rewrite;
      if (rw && rw.status === 'done' && rw.project && state.execution && state.execution.project) {
        els.btnRewriteUse.disabled = true;
        let res;
        try { res = await applyProjectChanges(state.execution, rw.changes); } finally { els.btnRewriteUse.disabled = false; }
        if (res.applied.length) { rw.used = true; addProjectVersion({ source: 'humana', instruction: 'Reescritura humana' }); }
        els.postExecStatus.textContent = describeProjectApply(res) + (res.applied.length ? ' Guardada como versión "Reescritura humana".' : '');
        els.postExecStatus.classList.toggle('status--error', !res.applied.length || res.failed.length > 0);
        renderPostExecPanel();
        return;
      }
      if (!rw || rw.status !== 'done' || !state.editor) return;
      state.editor.setValue(rw.html);
      if (state.execution) state.execution.html = rw.html;
      schedulePreviewUpdate();
      els.postExecStatus.textContent = 'Reescritura humana cargada en el Estudio. Guardala como versión o seguí editando.';
      els.postExecStatus.classList.remove('status--error');
    }

    function renderPostExecPanel() {
      if (!els.postExecPanel) return;
      const pe = state.postExec;
      const hasContent = !!(pe && (pe.busy || pe.note || pe.cro || pe.rewrite));
      els.postExecPanel.hidden = !hasContent;
      if (!hasContent) {
        els.postExecStatus.textContent = '';
        els.croSummary.textContent = '';
        els.croList.textContent = '';
        els.rewriteSummary.textContent = '';
        els.croReview.hidden = true;
        els.rewriteReview.hidden = true;
        els.btnCancelPostExec.hidden = true;
        return;
      }

      els.btnCancelPostExec.hidden = !pe.busy;
      els.postExecStatus.classList.remove('status--error');
      els.postExecStatus.classList.toggle('status--loading', !!pe.busy);
      els.postExecStatus.textContent = pe.busy ? pe.stage : (pe.note || '');

      // ---- Crítico de la landing (técnica 3) ----
      const cro = pe.cro;
      els.croReview.hidden = !cro || cro.status === 'loading';
      els.croList.textContent = '';
      els.btnCroApply.hidden = true;
      if (els.btnCroRound2) els.btnCroRound2.hidden = true;
      els.croSummary.textContent = '';
      els.croSummary.classList.remove('status--error');
      if (cro && cro.status === 'error') {
        els.croSummary.textContent = `El crítico no pudo responder: ${cro.error}`;
        els.croSummary.classList.add('status--error');
      } else if (cro && cro.status === 'done') {
        const head = `Vuelta ${cro.round}/${CRITIC_MAX_ROUNDS}`;
        if (cro.ok) {
          els.croSummary.textContent = `${head}: el crítico no encontró mejoras relevantes.`;
        } else if (cro.empty) {
          els.croSummary.textContent = `${head}: el crítico respondió, pero sin arreglos en un formato reconocible.`;
        } else {
          const creatorText = {
            idle: 'Marcá los arreglos y pulsá "Rehacer arreglos".',
            running: 'El creador está aplicando los arreglos marcados…',
            ready: 'El creador dejó un diff: aceptalo o descartalo.',
            accepted: 'Arreglos aceptados y guardados como versión.',
            discarded: 'Diff descartado. Podés cambiar la selección y pulsar "Rehacer arreglos".',
            error: `El creador falló: ${cro.creatorError || 'sin detalle'}. Podés reintentar con "Rehacer arreglos".`,
          }[cro.creator] || '';
          els.croSummary.textContent = `${head} · ${cro.items.length} arreglo(s) (modelo ${cro.model || '—'}, ${(cro.elapsedMs / 1000).toFixed(1)}s). ${creatorText}`;
          if (cro.creator === 'error') els.croSummary.classList.add('status--error');
          els.btnCroApply.hidden = pe.busy || cro.creator === 'accepted';
          if (els.btnCroRound2) els.btnCroRound2.hidden = !(cro.creator === 'accepted' && cro.round < CRITIC_MAX_ROUNDS && !pe.busy);
          cro.items.forEach((s, i) => {
            const li = document.createElement('li');
            const label = document.createElement('label');
            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.checked = s.selected;
            cb.disabled = !!pe.busy || cro.creator === 'accepted';
            cb.addEventListener('change', () => { cro.items[i].selected = cb.checked; });
            label.appendChild(cb);
            const area = document.createElement('strong');
            area.className = 'cro-area';
            area.textContent = ` [${s.area}] `;
            label.appendChild(area);
            const prio = document.createElement('em');
            prio.className = `cro-prio cro-prio--${s.prioridad}`;
            prio.textContent = `${s.prioridad} · `;
            label.appendChild(prio);
            label.appendChild(document.createTextNode(s.problema + (s.arreglo ? ` → ${s.arreglo}` : '')));
            li.appendChild(label);
            els.croList.appendChild(li);
          });
        }
      }

      // ---- Reescritura humana ----
      const rw = pe.rewrite;
      els.rewriteReview.hidden = !rw || rw.status === 'loading';
      els.btnRewriteUse.hidden = true;
      els.rewriteSummary.classList.remove('status--error');
      if (els.btnRewriteUse) els.btnRewriteUse.textContent = rw && rw.project ? 'Aplicar la reescritura al proyecto' : 'Ver la reescritura en el Estudio';
      if (rw && rw.status === 'done' && rw.project) {
        els.rewriteSummary.textContent = `Reescritura humana lista (modelo ${rw.model || '—'}, ${(rw.elapsedMs / 1000).toFixed(1)}s): ${rw.files.length} archivo${rw.files.length === 1 ? '' : 's'} con copy nuevo (${rw.files.join(', ')}), imports, clases y ${rw.tags} etiquetas verificados por archivo; ${rw.added} líneas nuevas y ${rw.removed} eliminadas.`
          + (rw.discarded.length ? ` Aviso: se descartó lo de ${rw.discarded.join('; ')}.` : '')
          + (rw.used ? ' Aplicada al proyecto y guardada como versión.' : ' Todavía no se escribió nada: pulsá "Aplicar la reescritura al proyecto".');
        els.rewriteSummary.classList.toggle('status--error', !!rw.discarded.length);
        els.btnRewriteUse.hidden = !!rw.used;
      } else if (rw && rw.status === 'rejected' && rw.project) {
        els.rewriteSummary.textContent = `Aviso: se descartó la reescritura humana en todos los archivos (${rw.reasons.slice(0, 4).join('; ')}). El proyecto no se tocó.`;
        els.rewriteSummary.classList.add('status--error');
      } else if (rw && rw.status === 'done') {
        els.rewriteSummary.textContent = `Reescritura humana lista (modelo ${rw.model || '—'}, ${(rw.elapsedMs / 1000).toFixed(1)}s): estructura verificada (${rw.tags} etiquetas, scripts y estilos idénticos), ${rw.added} líneas nuevas y ${rw.removed} eliminadas. Quedó guardada como versión "Reescritura humana".`;
        els.btnRewriteUse.hidden = false;
      } else if (rw && rw.status === 'rejected') {
        els.rewriteSummary.textContent = `Aviso: se descartó la reescritura humana porque alteró la estructura (${rw.reasons.slice(0, 4).join('; ')}). El HTML original no se tocó.`;
        els.rewriteSummary.classList.add('status--error');
      } else if (rw && rw.status === 'unchanged') {
        els.rewriteSummary.textContent = 'La reescritura humana no cambió nada en el texto.';
      } else if (rw && rw.status === 'error') {
        els.rewriteSummary.textContent = `No se pudo hacer la reescritura humana: ${rw.error}`;
        els.rewriteSummary.classList.add('status--error');
      } else {
        els.rewriteSummary.textContent = '';
      }
    }

    async function onRerunClick() {
      if (!state.execution) return;
      const proceed = await confirmReplaceStudio();
      if (!proceed) return;
      state.execution.editorInited = false;
      executeCurrent();
    }

    function onCancelExecute() {
      if (state.execution && state.execution.status === 'loading') {
        if (state.execution.abort) { try { state.execution.abort.abort(); } catch (e) { /* ya abortado */ } }
        if (state.execution.runId) cancelOpencodeRun(state.execution.runId);
      }
    }

    async function onSaveBankClick() {
      if (!state.execution || state.execution.status !== 'done') return;
      if (!isServerAvailable()) {
        els.ejecutorStatus.textContent = 'El Banco en disco requiere ejecutar "node server.js" (no funciona con file://).';
        els.ejecutorStatus.classList.add('status--error');
        return;
      }
      const pjSave = state.execution.project;
      const html = pjSave ? '' : (state.editor ? state.editor.getValue() : state.execution.html);
      const draftIdBeforeSave = getStudioDraftId();
      els.btnSaveBank.disabled = true;
      // Si la landing vino del Banco (Abrir/Editar), "Guardar en Banco"
      // actualiza esa misma entrada en disco (PUT); si no, crea una nueva
      // (POST). "Ejecutar nuevamente" resetea openedFromBank a null porque
      // es contenido nuevo generado por IA.
      const result = state.openedFromBank
        ? await updateBankEntry(state.openedFromBank, Object.assign(pjSave ? { files: pjSave.files } : { html, versions: state.versions }, state.execution.ssotSeed ? { ssotSeed: state.execution.ssotSeed } : {}))
        : await createBankEntry(pjSave ? {
          project: state.project,
          verticals: state.verticals.slice(),
          customVertical: state.customVerticalOn ? cleanCustomVertical(state.customVertical) : '',
          technologies: state.technologies.slice(),
          techniques: (state.execution.techniques || state.techniques).slice(),
          ssotSeed: state.execution.ssotSeed || '',
          concept: state.execution.concept || undefined,
          prompt: state.execution.promptUsed,
          files: pjSave.files,
          technology: pjSave.technology,
          model: state.provider.model || '',
          provider: state.provider.type || '',
        } : {
          project: state.project,
          verticals: state.verticals.slice(),
          customVertical: state.customVerticalOn ? cleanCustomVertical(state.customVertical) : '',
          technologies: state.technologies.slice(),
          techniques: (state.execution.techniques || state.techniques).slice(),
          ssotSeed: state.execution.ssotSeed || '',
          concept: state.execution.concept || undefined,
          prompt: state.execution.promptUsed,
          html,
          model: state.provider.model || '',
          provider: state.provider.type || '',
          versions: state.versions,
        });
      els.btnSaveBank.disabled = false;
      if (!result.ok) {
        els.ejecutorStatus.textContent = result.message;
        els.ejecutorStatus.classList.add('status--error');
        return;
      }
      const wasUpdate = !!state.openedFromBank;
      state.openedFromBank = result.entry.meta.id;
      if (pjSave) pjSave.dirty = false;
      state.studioBaseline = html; // ya quedó guardado: deja de estar "sucio"
      clearStudioDraft(draftIdBeforeSave);
      clearPromptDraft(getPromptDraftContextKey());
      await loadServerBankAndRender();
      els.ejecutorStatus.textContent = wasUpdate ? 'Landing actualizada en el Banco.' : 'Landing guardada en el Banco.';
      els.ejecutorStatus.classList.remove('status--error');
    }

    /* ---------- Consola del Estudio ----------
     * Muestra lo que tira la página generada: console.*, errores de ventana
     * (incl. recursos que no cargan) y promesas rechazadas. El script de
     * captura (console-capture.js) se inyecta SOLO en la copia que va a la
     * preview; los mensajes llegan por postMessage ('lpa:console') y se
     * validan acá (HTML único: event.source === #preview-frame y `run` actual;
     * dev server: además event.origin === origen de la preview). */

    const CONSOLE_MAX_ENTRIES = 500;

    // HTML único → preview con inspector + captura de la consola. La captura
    // queda como primer elemento de <head> (misma línea: no corre líneas).
    function renderPreviewHtml(html) {
      const c = state.consoleLog;
      c.runSeq += 1;
      c.run = `r${c.runSeq}${Date.now().toString(36)}`;
      c.awaiting = true;
      c.inst = null;
      consoleClear(true);
      const inj = injectConsoleCaptureInfo(injectInspector(html), buildConsoleScript({ mode: 'srcdoc', run: c.run }));
      c.inject = inj.info;
      sendHtmlToPreview(inj.html);
    }

    // Limpia (nueva ejecución). Con separador si había mensajes; sin él,
    // cuando se abre otro proyecto/ejecución o el usuario toca "Limpiar".
    function consoleClear(withSeparator) {
      const c = state.consoleLog;
      const had = c.entries.some((e) => e.level !== 'separator');
      c.entries = (withSeparator && had) ? [{ id: ++c.seq, level: 'separator', message: `— nueva ejecución ${formatConsoleClock(Date.now())} —`, ts: Date.now() }] : [];
      c.empty = false;
      refreshConsoleUi();
    }

    function consoleErrorEntries() {
      return state.consoleLog.entries.filter((e) => e.level === 'error');
    }

    function consoleHintText() {
      const n = consoleErrorEntries().length;
      if (!n || !state.consoleLog.empty) return '';
      return `La página tiró ${n} ${n === 1 ? 'error' : 'errores'}: abrí la Consola.`;
    }

    function onConsoleMessage(data, kind) {
      const c = state.consoleLog;
      if (!data || data.type !== 'lpa:console') return;
      if (kind === 'html' && data.run !== c.run) return; // mensaje de una ejecución anterior
      const inst = typeof data.inst === 'string' ? data.inst.slice(0, 40) : null;
      if (inst && c.inst !== inst) {
        if (c.inst !== null && !c.awaiting) consoleClear(true); // la página se recargó sola
        c.inst = inst;
        c.awaiting = false;
        c.empty = false;
      }
      const e = normalizeConsoleEntry(data);
      if (!e) return;
      if (e.level === 'heartbeat') {
        if (e.message === 'load' || e.message === 'settled') c.empty = e.empty;
        refreshConsoleUi();
        return;
      }
      if (kind === 'html' && e.line) {
        const m = mapConsoleLocation(c.inject, e.line, e.col);
        e.line = m.line;
        e.col = m.col;
      }
      e.id = ++c.seq;
      c.entries.push(e);
      if (c.entries.length > CONSOLE_MAX_ENTRIES) c.entries.splice(0, c.entries.length - CONSOLE_MAX_ENTRIES);
      refreshConsoleUi();
      if (e.level === 'error') pulseConsoleToggle();
    }

    function setConsoleFilter(filter) {
      state.consoleLog.filter = ['all', 'error', 'warn', 'log'].indexOf(filter) !== -1 ? filter : 'all';
      els.consoleFilters.forEach((b) => {
        const on = b.dataset.consoleFilter === state.consoleLog.filter;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', String(on));
      });
      renderConsole();
      renderServerLog();
    }

    function consoleMatchesFilter(e, filter) {
      if (e.level === 'separator' || filter === 'all') return true;
      if (filter === 'log') return e.level !== 'error' && e.level !== 'warn';
      return e.level === filter;
    }

    // ¿A qué código apunta el mensaje? { path|null, line, col, label } o null.
    function consoleResolveLocation(e) {
      if (!e || !e.line) return null;
      const pj = state.execution && state.execution.project;
      if (pj) {
        const p = resolveConsoleSource(e.source, pj.order);
        return p ? { path: p, line: e.line, col: e.col, label: `${p}:${e.line}${e.col ? ':' + e.col : ''}` } : null;
      }
      if (e.source && !/^(about:|blob:|data:)/i.test(e.source)) return null; // script externo: no es nuestro código
      return { path: null, line: e.line, col: e.col, label: `HTML:${e.line}${e.col ? ':' + e.col : ''}` };
    }

    function consoleLocationLabel(e) {
      const loc = consoleResolveLocation(e);
      if (loc) return loc.label;
      if (e.source) {
        const tail = e.source.length > 70 ? '…' + e.source.slice(-67) : e.source;
        return e.line ? `${tail}:${e.line}${e.col ? ':' + e.col : ''}` : tail;
      }
      return '';
    }

    function revealConsoleLocation(loc) {
      if (!loc || !state.editor) return;
      const pj = state.execution && state.execution.project;
      if (pj && loc.path) {
        if (loc.path !== pj.current) {
          selectProjectFile(loc.path);
          if (els.studioFileSelect) els.studioFileSelect.value = loc.path;
        }
      }
      setStudioView('code'); // la consola es un modal flotante: sigue abierta mientras se mira el código
      refreshEditor();
      const src = state.editor.getValue();
      const r = lineRangeOf(src, loc.line);
      state.editor.scrollToLine(r.line);
      if (typeof state.editor.selectRange === 'function') state.editor.selectRange(r.start, r.end);
    }

    function consoleCodeFor(e) {
      const loc = consoleResolveLocation(e);
      const pj = state.execution && state.execution.project;
      let src = '';
      let file = '';
      if (pj) {
        file = loc ? loc.path : '';
        src = file ? pj.files[file] : '';
      } else if (loc && state.editor) {
        file = 'index.html';
        src = state.editor.getValue();
      }
      return { loc, file, excerpt: loc ? extractCodeExcerpt(src, loc.line, 8) : '' };
    }

    // "Arreglar con IA": arma la instrucción (mensaje + ubicación + ±8 líneas)
    // y dispara el flujo de edición existente (diff con Aceptar / Descartar).
    function fixConsoleEntries(list) {
      const seen = new Set();
      const errors = (list || []).filter((e) => {
        const k = `${e.message}|${e.source}|${e.line}`;
        if (e.level !== 'error' || seen.has(k)) return false;
        seen.add(k);
        return true;
      }).slice(0, 10);
      if (!errors.length) return null;
      if (!state.editor || !state.execution || state.execution.status !== 'done') {
        els.aiEditStatus.textContent = 'Todavía no hay código para arreglar.';
        els.aiEditStatus.classList.add('status--error');
        return null;
      }
      if (els.btnAiEdit.disabled) return null; // ya hay un cambio en curso
      const items = errors.map((e) => {
        const ctx = consoleCodeFor(e);
        return { entry: e, where: ctx.loc ? ctx.loc.label : consoleLocationLabel(e), file: ctx.file, line: ctx.loc ? ctx.loc.line : 0, excerpt: ctx.excerpt };
      });
      els.aiInstruction.value = buildConsoleFixInstruction(items);
      els.aiScope.value = 'document';
      if (els.aiEditDiff) els.aiEditDiff.hidden = true;
      const panel = document.getElementById('ai-edit-panel');
      if (panel && typeof panel.scrollIntoView === 'function') { try { panel.scrollIntoView({ block: 'nearest' }); } catch (err) { /* no-op */ } }
      return runAiEdit('console');
    }

    async function onConsoleCopy() {
      const m = state.consoleModal;
      const text = consoleVisibleEntries(consoleViewEntries()).map((e) => formatConsoleEntryText(e, e.level === 'separator' ? '' : consoleLocationLabel(e))).join('\n');
      if (!text) { els.consoleSummary.textContent = 'No hay nada para copiar.'; return; }
      try {
        await navigator.clipboard.writeText(text);
        els.consoleSummary.textContent = m.view === 'server' ? 'Salida del servidor copiada al portapapeles.' : 'Consola copiada al portapapeles.';
      } catch (err) {
        els.consoleSummary.textContent = 'No se pudo copiar la consola.';
      }
    }

    function scheduleConsoleRender() {
      const c = state.consoleLog;
      if (c.renderTimer) return;
      c.renderTimer = setTimeout(() => { c.renderTimer = null; renderConsole(); }, 40);
    }

    function updateConsoleSummary() {
      if (!els.consoleSummary) return;
      const m = state.consoleModal;
      const counts = consoleCounts(consoleViewEntries());
      const total = counts.error + counts.warn + counts.log;
      const pre = m.view === 'server' ? 'Servidor: ' : '';
      els.consoleSummary.textContent = total === 0 ? (m.view === 'server' ? 'Sin salida del servidor.' : 'Sin mensajes.')
        : `${pre}${counts.error} error${counts.error === 1 ? '' : 'es'}, ${counts.warn} advertencia${counts.warn === 1 ? '' : 's'}, ${counts.log} log${counts.log === 1 ? '' : 's'}.`;
      if (els.btnConsoleFixAll) els.btnConsoleFixAll.hidden = counts.error === 0;
    }

    // Contadores (badges del botón + resumen accesible) al instante; la lista
    // con un pequeño retardo para agrupar ráfagas de mensajes.
    function refreshConsoleUi() {
      const c = state.consoleLog;
      const counts = consoleCounts(c.entries);
      if (els.consoleBadgeErrors) {
        els.consoleBadgeErrors.hidden = counts.error === 0;
        els.consoleBadgeErrors.textContent = String(counts.error);
        els.consoleBadgeErrors.title = `${counts.error} error${counts.error === 1 ? '' : 'es'}`;
      }
      if (els.consoleBadgeWarns) {
        els.consoleBadgeWarns.hidden = counts.warn === 0;
        els.consoleBadgeWarns.textContent = String(counts.warn);
        els.consoleBadgeWarns.title = `${counts.warn} advertencia${counts.warn === 1 ? '' : 's'}`;
      }
      if (els.btnConsoleToggle) {
        els.btnConsoleToggle.setAttribute('aria-label', `Consola: ${counts.error} error${counts.error === 1 ? '' : 'es'}, ${counts.warn} advertencia${counts.warn === 1 ? '' : 's'}`);
      }
      updateConsoleSummary();
      scheduleConsoleRender();
      const hint = consoleHintText();
      if (hint !== c.lastHint && state.execution && state.execution.status === 'done') renderEjecutor();
    }

    /* ---- lista de mensajes (terminal) ---- */

    function consoleProject() {
      return (state.execution && state.execution.project) || null;
    }

    // Mensajes de la vista activa del modal.
    function consoleViewEntries() {
      const pj = consoleProject();
      return (state.consoleModal.view === 'server' && pj) ? pj.serverLines : state.consoleLog.entries;
    }

    function consoleVisibleEntries(entries) {
      const c = state.consoleLog;
      const q = state.consoleModal.search;
      return entries.filter((e) => consoleMatchesFilter(e, c.filter) && consoleMatchesSearch(e, q));
    }

    function buildConsoleRow(g, isServer) {
      const ICONS = { error: '✖', warn: '▲', info: 'ℹ', log: '›', debug: '›' };
      const LEVEL_LABELS = { error: 'Error', warn: 'Advertencia', info: 'Info', log: 'Log', debug: 'Debug' };
      const e = g.entry;
      const li = document.createElement('li');
      if (e.level === 'separator') {
        li.className = 'console__sep';
        li.setAttribute('role', 'separator');
        li.textContent = e.message;
        return li;
      }
      li.className = `console__entry console__entry--${e.level}${isServer ? ' console__entry--server' : ''}`;
      li.dataset.level = e.level;
      if (g.count > 1) li.dataset.count = String(g.count);
      const time = document.createElement('time');
      time.className = 'console__time';
      time.textContent = formatConsoleClock(g.last.ts);
      time.dateTime = new Date(g.last.ts).toISOString();
      const icon = document.createElement('span');
      icon.className = 'console__icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = ICONS[e.level] || '›';
      const body = document.createElement('div');
      body.className = 'console__body';
      const sr = document.createElement('span');
      sr.className = 'sr-only';
      sr.textContent = `${LEVEL_LABELS[e.level] || e.level}: `;
      const msg = document.createElement('span');
      msg.className = 'console__msg';
      msg.textContent = e.message;
      body.appendChild(sr);
      body.appendChild(msg);
      if (g.count > 1) {
        const cnt = document.createElement('span');
        cnt.className = 'console__count';
        cnt.textContent = `×${g.count}`;
        cnt.title = `Se repitió ${g.count} veces`;
        cnt.setAttribute('aria-label', `repetido ${g.count} veces`);
        body.appendChild(cnt);
      }
      const loc = consoleResolveLocation(e);
      const label = consoleLocationLabel(e);
      const fixable = e.level === 'error';
      if (label || fixable) {
        const meta = document.createElement('div');
        meta.className = 'console__meta';
        if (label) {
          const where = document.createElement(loc ? 'button' : 'span');
          where.className = 'console__loc' + (loc ? ' btn--link' : '');
          where.textContent = label;
          if (loc) {
            where.type = 'button';
            where.title = 'Ir a esta línea en el código';
            where.addEventListener('click', () => revealConsoleLocation(loc));
          }
          meta.appendChild(where);
        }
        if (fixable) {
          const fix = document.createElement('button');
          fix.type = 'button';
          fix.className = 'console__fix';
          fix.textContent = 'Arreglar con IA';
          fix.addEventListener('click', () => fixConsoleEntries([e]));
          meta.appendChild(fix);
        }
        body.appendChild(meta);
      }
      if (e.stack) {
        const det = document.createElement('details');
        det.className = 'console__stack';
        const sum = document.createElement('summary');
        sum.textContent = 'Stack';
        const pre = document.createElement('pre');
        pre.textContent = e.stack;
        det.appendChild(sum);
        det.appendChild(pre);
        body.appendChild(det);
      }
      li.appendChild(time);
      li.appendChild(icon);
      li.appendChild(body);
      return li;
    }

    function fillConsoleList(list, entries, isServer) {
      const m = state.consoleModal;
      const prevTop = list.scrollTop;
      list.textContent = '';
      const visible = consoleVisibleEntries(entries);
      if (!visible.length) {
        const li = document.createElement('li');
        li.className = 'console__empty';
        li.textContent = entries.length ? 'Ningún mensaje con este filtro.'
          : (isServer ? 'Sin salida del servidor todavía. Acá ves lo que imprime Vite / Next al compilar.' : 'Sin mensajes. Acá aparecen los errores y logs de la página generada.');
        list.appendChild(li);
        return;
      }
      groupConsoleEntries(visible).forEach((g) => list.appendChild(buildConsoleRow(g, isServer)));
      list.scrollTop = m.autoScroll ? list.scrollHeight : prevTop;
    }

    function renderConsole() {
      const c = state.consoleLog;
      const m = state.consoleModal;
      if (c.renderTimer) { clearTimeout(c.renderTimer); c.renderTimer = null; }
      if (!els.consoleList || !m.open || m.view !== 'browser') return;
      fillConsoleList(els.consoleList, c.entries, false);
    }

    function renderServerLog() {
      const m = state.consoleModal;
      const pj = consoleProject();
      if (!els.consoleServerList || !m.open || m.view !== 'server' || !pj) return;
      fillConsoleList(els.consoleServerList, pj.serverLines, true);
      updateConsoleSummary();
    }

    /* ---- modal: abrir / cerrar / vistas ---- */

    const CONSOLE_MODAL_KEY = 'lpa_console_modal_v1';
    const CONSOLE_MODAL_MIN_W = 320;
    const CONSOLE_MODAL_MIN_H = 200;
    const SERVER_LOG_MAX = 1000;

    function consoleIsMobile() {
      return window.innerWidth <= 640;
    }

    function clampConsoleRect(r) {
      const vw = Math.max(window.innerWidth || 0, 320);
      const vh = Math.max(window.innerHeight || 0, 240);
      const w = Math.round(Math.min(Math.max(Number(r.w) || 0, CONSOLE_MODAL_MIN_W), vw));
      const h = Math.round(Math.min(Math.max(Number(r.h) || 0, CONSOLE_MODAL_MIN_H), vh));
      const x = Math.round(Math.min(Math.max(Number(r.x) || 0, 0), vw - w));
      const y = Math.round(Math.min(Math.max(Number(r.y) || 0, 0), vh - h));
      return { x, y, w, h };
    }

    function defaultConsoleRect() {
      const vw = Math.max(window.innerWidth || 0, 320);
      const vh = Math.max(window.innerHeight || 0, 240);
      const w = Math.min(560, vw - 32);
      const h = Math.min(380, Math.round(vh * 0.55));
      return clampConsoleRect({ x: vw - w - 16, y: vh - h - 16, w, h });
    }

    function loadConsoleRect() {
      const raw = safeGetItem(CONSOLE_MODAL_KEY);
      if (raw) {
        try {
          const r = JSON.parse(raw);
          if (r && ['x', 'y', 'w', 'h'].every((k) => Number.isFinite(r[k]))) return clampConsoleRect(r);
        } catch (e) { /* cae al valor por defecto */ }
      }
      return defaultConsoleRect();
    }

    function saveConsoleRect() {
      const r = state.consoleModal.rect;
      if (r) safeSetItem(CONSOLE_MODAL_KEY, JSON.stringify(r));
    }

    function applyConsoleRect() {
      const el = els.consoleModal;
      const m = state.consoleModal;
      if (!el) return;
      if (consoleIsMobile()) { // hoja inferior a todo el ancho (ver CSS)
        ['left', 'top', 'width', 'height'].forEach((k) => { el.style[k] = ''; });
        el.classList.add('is-sheet');
        return;
      }
      el.classList.remove('is-sheet');
      if (!m.rect) m.rect = loadConsoleRect();
      m.rect = clampConsoleRect(m.rect);
      el.style.left = m.rect.x + 'px';
      el.style.top = m.rect.y + 'px';
      el.style.width = m.rect.w + 'px';
      el.style.height = m.rect.h + 'px';
    }

    function consoleAvailable() {
      const exec = state.execution;
      return !!exec && (exec.project ? true : exec.status === 'done');
    }

    function openConsoleModal() {
      const m = state.consoleModal;
      if (!els.consoleModal || !consoleAvailable()) return;
      m.open = true;
      m.lastFocus = document.activeElement;
      els.consoleModal.hidden = false;
      if (els.btnConsoleToggle) {
        els.btnConsoleToggle.setAttribute('aria-expanded', 'true');
        els.btnConsoleToggle.classList.remove('is-pulse');
      }
      applyConsoleRect();
      applyConsoleView();
      try { els.consoleModal.focus({ preventScroll: true }); } catch (e) { /* no-op */ }
    }

    function closeConsoleModal(restoreFocus) {
      const m = state.consoleModal;
      if (!els.consoleModal) return;
      m.open = false;
      els.consoleModal.hidden = true;
      stopServerPolling();
      if (els.btnConsoleToggle) els.btnConsoleToggle.setAttribute('aria-expanded', 'false');
      if (restoreFocus !== false && els.btnConsoleToggle && !els.btnConsoleToggle.hidden) {
        try { els.btnConsoleToggle.focus({ preventScroll: true }); } catch (e) { /* no-op */ }
      }
    }

    function toggleConsoleModal() {
      if (state.consoleModal.open) closeConsoleModal(true); else openConsoleModal();
    }

    function pulseConsoleToggle() {
      const m = state.consoleModal;
      if (m.open || !els.btnConsoleToggle || els.btnConsoleToggle.hidden) return;
      els.btnConsoleToggle.classList.remove('is-pulse');
      void els.btnConsoleToggle.offsetWidth; // reinicia la animación (se muestra una sola vez por error nuevo)
      els.btnConsoleToggle.classList.add('is-pulse');
      if (m.pulseTimer) clearTimeout(m.pulseTimer);
      m.pulseTimer = setTimeout(() => { m.pulseTimer = null; if (els.btnConsoleToggle) els.btnConsoleToggle.classList.remove('is-pulse'); }, 1400);
    }

    // Botón flotante (sólo con una preview) y vistas disponibles.
    function syncConsoleChrome() {
      const m = state.consoleModal;
      const avail = consoleAvailable();
      if (els.btnConsoleToggle) els.btnConsoleToggle.hidden = !avail;
      if (!avail && m.open) closeConsoleModal(false);
      const pj = consoleProject();
      if (els.consoleViewServer) els.consoleViewServer.hidden = !pj;
      if (!pj && m.view === 'server') m.view = 'browser';
      if (els.previewServerStopped) els.previewServerStopped.hidden = !(pj && pj.previewStatus === 'stopped');
      if (m.open) applyConsoleView();
    }

    function setConsoleView(view) {
      const m = state.consoleModal;
      m.view = (view === 'server' && consoleProject()) ? 'server' : 'browser';
      applyConsoleView();
    }

    function applyConsoleView() {
      const m = state.consoleModal;
      const pj = consoleProject();
      if (m.view === 'server' && !pj) m.view = 'browser';
      const isServer = m.view === 'server';
      [els.consoleViewBrowser, els.consoleViewServer].forEach((b) => {
        if (!b) return;
        const on = b.dataset.consoleView === m.view;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-selected', String(on));
        b.tabIndex = on ? 0 : -1;
      });
      if (els.consoleList) els.consoleList.hidden = isServer;
      if (els.consoleServerList) els.consoleServerList.hidden = !isServer;
      renderServerBar();
      updateConsoleSummary();
      renderConsole();
      renderServerLog();
      syncServerPolling();
    }

    function onConsoleViewKeydown(event) {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      const tabs = [els.consoleViewBrowser, els.consoleViewServer].filter((b) => b && !b.hidden);
      if (tabs.length < 2) return;
      event.preventDefault();
      const next = tabs[(tabs.indexOf(event.currentTarget) + 1) % tabs.length];
      next.focus();
      setConsoleView(next.dataset.consoleView);
    }

    function setConsoleSearch(value) {
      state.consoleModal.search = String(value || '').slice(0, 200);
      renderConsole();
      renderServerLog();
    }

    function setConsoleAutoScroll(on) {
      const m = state.consoleModal;
      m.autoScroll = !!on;
      if (els.btnConsoleAutoscroll) els.btnConsoleAutoscroll.setAttribute('aria-pressed', String(m.autoScroll));
      if (m.autoScroll) { renderConsole(); renderServerLog(); }
    }

    function onConsoleClear() {
      const pj = consoleProject();
      if (state.consoleModal.view === 'server' && pj) {
        pj.serverLines = []; // serverSeq no se toca: lo limpiado no vuelve en el próximo sondeo
        renderServerLog();
        updateConsoleSummary();
        return;
      }
      consoleClear(false);
    }

    function onConsoleFixAll() {
      fixConsoleEntries(consoleViewEntries().filter((e) => e.level === 'error'));
    }

    /* ---- arrastrar y redimensionar (pointer events) ---- */

    function startConsoleDrag(event, mode) {
      const m = state.consoleModal;
      if (!els.consoleModal || consoleIsMobile() || (event.button != null && event.button > 0)) return;
      if (mode === 'move' && event.target && event.target.closest && event.target.closest('button, input, a')) return;
      event.preventDefault();
      if (!m.rect) m.rect = loadConsoleRect();
      const start = { px: event.clientX, py: event.clientY, r: Object.assign({}, m.rect) };
      const handle = mode === 'move' ? els.consoleModalHeader : els.consoleResize;
      try { if (handle.setPointerCapture && event.pointerId != null) handle.setPointerCapture(event.pointerId); } catch (e) { /* no-op */ }
      const onMove = (ev) => {
        const dx = ev.clientX - start.px;
        const dy = ev.clientY - start.py;
        m.rect = mode === 'move'
          ? clampConsoleRect({ x: start.r.x + dx, y: start.r.y + dy, w: start.r.w, h: start.r.h })
          : clampConsoleRect({ x: start.r.x, y: start.r.y, w: Math.min(start.r.w + dx, window.innerWidth - start.r.x), h: Math.min(start.r.h + dy, window.innerHeight - start.r.y) });
        applyConsoleRect();
      };
      const onUp = () => {
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
        document.removeEventListener('pointercancel', onUp);
        saveConsoleRect();
      };
      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
      document.addEventListener('pointercancel', onUp);
    }

    function onConsoleResizeKeydown(event) {
      const step = event.shiftKey ? 60 : 20;
      const m = state.consoleModal;
      if (consoleIsMobile() || !m.rect) return;
      const d = { ArrowRight: [step, 0], ArrowLeft: [-step, 0], ArrowDown: [0, step], ArrowUp: [0, -step] }[event.key];
      if (!d) return;
      event.preventDefault();
      m.rect = clampConsoleRect({ x: m.rect.x, y: m.rect.y, w: m.rect.w + d[0], h: m.rect.h + d[1] });
      applyConsoleRect();
      saveConsoleRect();
    }

    function onConsoleModalKeydown(event) {
      if (event.key !== 'Escape' || !state.consoleModal.open) return;
      const t = event.target;
      if (els.consoleModal.contains(t) || t === els.btnConsoleToggle) {
        event.preventDefault();
        closeConsoleModal(true);
      }
    }

    /* ---- vista "Servidor": salida del dev server + controles ---- */

    function projectServerState(pj) {
      if (pj.previewStatus === 'ready') return 'ready';
      if (pj.previewStatus === 'stopped') return 'stopped';
      if (pj.previewStatus === 'error') return 'error';
      return pj.serverStatus === 'starting' ? 'starting' : 'installing';
    }

    const SERVER_STATE_LABELS = { stopped: 'Detenido', installing: 'Instalando', starting: 'Compilando', ready: 'Listo', error: 'Error' };

    function renderServerBar() {
      const m = state.consoleModal;
      const pj = consoleProject();
      const show = !!pj && m.view === 'server';
      if (els.consoleServerBar) els.consoleServerBar.hidden = !show;
      if (!show) return;
      const st = projectServerState(pj);
      els.consoleServerPill.textContent = SERVER_STATE_LABELS[st];
      els.consoleServerPill.className = `cmodal__pill cmodal__pill--${st}`;
      let where = '';
      if (st === 'ready' && pj.url) {
        let port = '';
        try { port = new URL(pj.url).port; } catch (e) { /* sin puerto */ }
        where = port ? `puerto ${port} · ${pj.url}` : pj.url;
      } else if (st === 'installing' || st === 'starting') where = pj.message || '';
      else if (st === 'error') where = pj.error ? String(pj.error).slice(0, 120) : '';
      els.consoleServerWhere.textContent = where;
      els.consoleServerWhere.title = where;
      const busy = !!pj.serverBusy;
      els.btnServerStop.disabled = busy || !(st === 'installing' || st === 'starting' || st === 'ready');
      els.btnServerStart.disabled = busy || !(st === 'stopped' || st === 'error');
      els.btnServerRestart.disabled = busy;
      if (els.btnPreviewStart) els.btnPreviewStart.disabled = busy;
    }

    function pushServerSeparator(pj) {
      pj.serverLines.push({ id: ++state.consoleLog.seq, level: 'separator', message: `— nueva ejecución ${formatConsoleClock(Date.now())} —`, ts: Date.now() });
      if (pj.serverLines.length > SERVER_LOG_MAX) pj.serverLines.splice(0, pj.serverLines.length - SERVER_LOG_MAX);
    }

    // Una línea cruda del servidor → mensaje de consola. Si menciona un archivo
    // del proyecto (src/App.jsx:12:3) queda con ubicación clickeable y, si es
    // un error, arreglable con IA.
    function serverLineToEntry(pj, l) {
      const text = stripConsoleAnsi(l.text).slice(0, 500);
      const stream = l.stream === 'stdout' || l.stream === 'stderr' ? l.stream : 'system';
      const e = { id: ++state.consoleLog.seq, seq: l.seq, level: classifyServerLine(text, stream), message: text, source: '', line: 0, col: 0, stack: '', ts: Number.isFinite(l.ts) ? l.ts : Date.now(), stream };
      const m = text.match(/([^\s()'"<>:]+\.(?:jsx?|tsx?|mjs|vue|css|html)):(\d+)(?::(\d+))?/i);
      if (m && pj) {
        const p = resolveConsoleSource(m[1], pj.order);
        if (p) { e.source = p; e.line = Number(m[2]); e.col = m[3] ? Number(m[3]) : 0; }
      }
      return e;
    }

    function ingestServerLogs(pj, data) {
      if (!data || !Array.isArray(data.lines)) return;
      data.lines.forEach((l) => {
        if (!l || !Number.isSafeInteger(l.seq) || l.seq <= pj.serverSeq || typeof l.text !== 'string') return;
        pj.serverSeq = l.seq;
        pj.serverLines.push(serverLineToEntry(pj, l));
      });
      if (Number.isSafeInteger(data.seq) && data.seq > pj.serverSeq) pj.serverSeq = data.seq;
      if (pj.serverLines.length > SERVER_LOG_MAX) pj.serverLines.splice(0, pj.serverLines.length - SERVER_LOG_MAX);
    }

    function serverPollWanted() {
      const m = state.consoleModal;
      const pj = consoleProject();
      return m.open && m.view === 'server' && !!pj && !!pj.previewId;
    }

    async function pollServerLogs() {
      const m = state.consoleModal;
      m.pollTimer = null;
      if (!serverPollWanted() || m.polling) return;
      const exec = state.execution;
      const pj = exec.project;
      const id = pj.previewId;
      m.polling = true;
      try {
        const r = await fetch(`${PROJECT_API}/${encodeURIComponent(id)}/logs?since=${pj.serverSeq}`);
        if (pj.previewId === id) {
          if (r.status === 404) {
            // El servidor ya no conoce este preview (venció o lo desalojaron).
            pj.previewId = null;
            if (pj.previewStatus === 'ready' || pj.previewStatus === 'launching') markProjectStopped(exec, 'La vista previa venció en el servidor. Usá «Iniciar» para volver a levantarla.');
          } else if (r.ok) {
            const data = await r.json().catch(() => null);
            if (data && pj.previewId === id) {
              ingestServerLogs(pj, data);
              if (pj.previewStatus === 'launching' && (data.status === 'installing' || data.status === 'starting')) pj.serverStatus = data.status;
              if (data.status === 'stopped' && pj.previewStatus === 'ready') markProjectStopped(exec, 'El servidor de la vista previa terminó. Usá «Iniciar» para volver a levantarlo.');
              renderServerLog();
              renderServerBar();
            }
          }
        }
      } catch (err) { /* servidor caído: se reintenta en el próximo ciclo */ }
      m.polling = false;
      if (serverPollWanted() && !m.pollTimer) m.pollTimer = setTimeout(pollServerLogs, m.pollMs);
    }

    function syncServerPolling() {
      const m = state.consoleModal;
      if (!serverPollWanted()) { stopServerPolling(); return; }
      if (!m.pollTimer && !m.polling) m.pollTimer = setTimeout(pollServerLogs, 0);
    }

    function stopServerPolling() {
      const m = state.consoleModal;
      if (m.pollTimer) { clearTimeout(m.pollTimer); m.pollTimer = null; }
    }

    // Preview detenido (a mano, o porque el servidor terminó/venció): el iframe
    // queda en blanco y aparece el cartel "Servidor detenido — Iniciar".
    function markProjectStopped(exec, message) {
      const pj = exec.project;
      pj.previewStatus = 'stopped';
      pj.url = null;
      pj.error = null;
      pj.warning = null;
      pj.message = message;
      if (exec.status === 'loading') exec.status = 'done';
      renderEjecutor();
    }

    async function haltProjectServer(exec) {
      const pj = exec.project;
      pj.launchToken += 1; // corta el seguimiento de un arranque en curso
      if (pj.relaunchTimer) { clearTimeout(pj.relaunchTimer); pj.relaunchTimer = null; }
      if (pj.writeTimer) { clearTimeout(pj.writeTimer); pj.writeTimer = null; }
      if (pj.previewId) {
        try {
          const r = await fetch(`${PROJECT_API}/${encodeURIComponent(pj.previewId)}/halt`, { method: 'POST' });
          if (r.status === 404) pj.previewId = null;
        } catch (err) { /* sin servidor: igual se marca detenido */ }
      }
      markProjectStopped(exec, 'Servidor detenido. Usá «Iniciar» para volver a levantarlo.');
    }

    // Iniciar / Reiniciar: el MISMO id (y por lo tanto el mismo Estudio) con los
    // archivos actuales. Si el servidor ya no lo tiene, crea uno nuevo (id nuevo).
    async function startProjectServer(exec, action) {
      const pj = exec.project;
      if (!pj.previewId) { pj.serverBusy = false; renderServerBar(); await launchProjectPreview(exec); return; }
      const token = ++pj.launchToken;
      const stale = () => token !== pj.launchToken || state.execution !== exec;
      if (pj.relaunchTimer) { clearTimeout(pj.relaunchTimer); pj.relaunchTimer = null; }
      if (pj.writeTimer) { clearTimeout(pj.writeTimer); pj.writeTimer = null; }
      pj.dirtyPaths.clear(); // los archivos actuales viajan en el propio pedido
      pj.previewStatus = 'launching';
      pj.serverStatus = 'installing';
      pj.url = null;
      pj.error = null;
      pj.warning = null;
      pj.message = action === 'restart' ? 'Reiniciando el servidor de desarrollo…' : 'Iniciando el servidor de desarrollo…';
      pushServerSeparator(pj);
      renderEjecutor();
      try {
        const res = await fetch(`${PROJECT_API}/${encodeURIComponent(pj.previewId)}/${action}`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ technology: pj.technology, files: pj.files }),
        });
        const data = await res.json().catch(() => ({}));
        pj.serverBusy = false; // el pedido ya volvió: durante el arranque se puede Detener
        renderServerBar();
        if (stale()) return;
        if (!res.ok) {
          const err = new Error(data.error || `Error del servidor (${res.status}).`);
          err.rejected = res.status === 400;
          throw err;
        }
        adoptProjectPreviewId(pj, data.previewId);
        if (!(await followProjectView(exec, data, stale))) return;
      } catch (e) {
        pj.serverBusy = false;
        if (stale()) return;
        pj.previewStatus = 'error';
        pj.error = e.message || String(e);
        pj.message = e.rejected ? `Proyecto rechazado: ${pj.error}` : `Error de compilación: ${pj.error}`;
      }
      if (exec.status === 'loading') exec.status = 'done';
      renderEjecutor();
      syncServerPolling();
    }

    async function projectServerAction(action) {
      const exec = state.execution;
      const pj = exec && exec.project;
      if (!pj || pj.serverBusy) return;
      pj.serverBusy = true;
      renderServerBar();
      try {
        if (action === 'halt') await haltProjectServer(exec);
        else await startProjectServer(exec, action);
      } finally {
        if (action === 'halt') pj.serverBusy = false; // start/restart la liberan apenas responde el servidor
        renderServerBar();
        syncServerPolling();
      }
    }

    function adoptProjectPreviewId(pj, id) {
      if (pj.previewId !== id) pj.serverSeq = 0; // otro preview = otro log, con su propia secuencia
      pj.previewId = id;
    }

    // Sigue (por /status) un arranque en curso hasta ready / error. Devuelve
    // false si quedó obsoleto (otra acción lo reemplazó).
    async function followProjectView(exec, first, stale) {
      const pj = exec.project;
      let view = first;
      while (view.status === 'installing' || view.status === 'starting') {
        applyProjectView(exec, view);
        // eslint-disable-next-line no-await-in-loop
        await projectSleep(1000);
        if (stale()) return false;
        // eslint-disable-next-line no-await-in-loop
        const r = await fetch(`${PROJECT_API}/${encodeURIComponent(pj.previewId)}/status`);
        if (r.status === 404) throw new Error('La vista previa se cerró antes de terminar de levantar.');
        // eslint-disable-next-line no-await-in-loop
        view = await r.json();
      }
      if (stale()) return false;
      applyProjectView(exec, view);
      return true;
    }

    /* ---------- Click-to-code: mensajes de la preview ---------- */

    function onInspectResult(payload) {
      if (!state.editor) return;
      if (!state.splitMode) setStudioView('code'); // Feature 5: inspeccionar revela el editor automáticamente
      refreshEditor();
      state.inspectedElement = { payload };
      const source = state.editor.getValue();
      const loc = locateInSource(source, payload);
      state.inspectedElement.loc = loc;
      if (loc) {
        const endGuess = loc.index + (payload.outerHTMLPrefix ? payload.outerHTMLPrefix.length : 20);
        state.editor.scrollToLine(loc.line);
        if (typeof state.editor.selectRange === 'function') {
          state.editor.selectRange(loc.index, Math.min(source.length, endGuess));
        }
        els.aiEditStatus.textContent = `Elemento localizado: <${payload.tag}>${payload.id ? ' #' + payload.id : ''} (línea ${loc.line}, estrategia: ${loc.strategy}). Alcance sugerido: "Selección actual".`;
        els.aiEditStatus.classList.remove('status--error');
        els.aiScope.value = 'selection';
      } else {
        els.aiEditStatus.textContent = `No se pudo ubicar automáticamente <${payload.tag}> en el código fuente. Podés seleccionarlo a mano en el editor, o usar el alcance "Documento completo".`;
        els.aiEditStatus.classList.add('status--error');
      }
    }

    function onInspectToggleClick() {
      state.inspecting = !state.inspecting;
      els.btnInspectToggle.setAttribute('aria-pressed', String(state.inspecting));
      els.btnInspectToggle.classList.toggle('is-active', state.inspecting);
      if (isProjectExecution()) { syncProjectInspector(); return; } // dev server: otro origen, va por postMessage
      if (els.previewFrame && els.previewFrame.contentWindow) {
        try { els.previewFrame.contentWindow.postMessage({ type: 'lpa:inspect-toggle', enabled: state.inspecting }, '*'); } catch (e) { /* no-op */ }
      }
    }

    /* ---------- Estudio: edición asistida por IA ---------- */

    function onAiEditClick() { return runAiEdit(); }

    // Devuelve { ok, error?, candidate? }; tag marca el origen del candidato ('critic', 'assets').
    async function runAiEdit(tag) {
      if (isProjectExecution()) return runProjectAiEdit(tag);
      const instruction = els.aiInstruction.value.trim();
      if (!instruction) {
        els.aiEditStatus.textContent = 'Escribí qué cambio querés pedirle a la IA.';
        els.aiEditStatus.classList.add('status--error');
        return { ok: false, error: els.aiEditStatus.textContent };
      }
      if (!state.editor) return { ok: false, error: 'Sin editor.' };
      const fullHtml = state.editor.getValue();
      const scope = els.aiScope.value;
      let selectedFragment = null;
      if (scope === 'selection') {
        const sel = state.editor.getSelection();
        selectedFragment = (sel && sel.trim())
          ? sel
          : (state.inspectedElement && state.inspectedElement.payload ? state.inspectedElement.payload.outerHTMLPrefix : null);
        if (!selectedFragment) {
          els.aiEditStatus.textContent = 'No hay selección: seleccioná texto en el editor, usá "Inspeccionar" sobre la preview, o cambiá el alcance a "Documento completo".';
          els.aiEditStatus.classList.add('status--error');
          return;
        }
      }
      const negativeConstraints = extractPromptSections(state.execution ? state.execution.promptUsed : '', state.execution ? state.execution.techniques : undefined, { resources: !!(state.execution && state.execution.resources) }).sections['RESTRICCIONES NEGATIVAS'] || '';
      const editPrompt = buildEditPrompt({ instruction, fullHtml, selectedFragment, scope, negativeConstraints });

      const runId = generateClientRunId();
      state.aiEditRunId = runId;
      els.btnAiEdit.disabled = true;
      els.btnCancelAiEdit.hidden = false;
      els.aiEditStatus.classList.remove('status--error');
      const startedAt = Date.now();
      els.aiEditStatus.textContent = 'Aplicando el cambio con IA… 0s';
      const timer = setInterval(() => {
        els.aiEditStatus.textContent = `Aplicando el cambio con IA… ${Math.round((Date.now() - startedAt) / 1000)}s`;
      }, 1000);

      const result = await runLLM({ prompt: editPrompt, expect: 'html', runId });

      clearInterval(timer);
      els.btnCancelAiEdit.hidden = true;
      els.btnAiEdit.disabled = false;
      state.aiEditRunId = null;

      if (!result.ok || !result.html) {
        els.aiEditStatus.textContent = result.error || 'La IA no devolvió un HTML válido.';
        els.aiEditStatus.classList.add('status--error');
        return { ok: false, error: els.aiEditStatus.textContent };
      }

      const diff = diffLines(fullHtml, result.html);
      if (els.aiEditFiles) els.aiEditFiles.hidden = true;
      state.aiEditCandidate = { html: result.html, instruction, tag: tag || '' };
      const elapsedS = ((Date.now() - startedAt) / 1000).toFixed(1);
      els.aiEditStatus.textContent = `Cambio listo (modelo ${result.model}, ${elapsedS}s). Revisá el resumen y elegí Aceptar o Descartar.`;
      els.aiEditDiffSummary.textContent = diff.approximate
        ? `~${diff.added} líneas agregadas, ~${diff.removed} eliminadas (estimado).`
        : `${diff.added} líneas agregadas, ${diff.removed} eliminadas.`;
      els.aiEditDiff.hidden = false;
      return { ok: true, candidate: state.aiEditCandidate };
    }

    function onCancelAiEdit() {
      if (state.aiEditRunId) cancelOpencodeRun(state.aiEditRunId);
    }

    function onAiEditAccept() {
      if (state.aiEditCandidate && state.aiEditCandidate.project) { onProjectAiEditAccept(); return; }
      if (!state.aiEditCandidate || !state.editor) return;
      const { html, instruction, tag } = state.aiEditCandidate;
      state.editor.setValue(html);
      if (state.execution) state.execution.html = html;
      addVersion({ source: 'ia', instruction, html });
      schedulePreviewUpdate();
      state.aiEditCandidate = null;
      els.aiEditDiff.hidden = true;
      els.aiInstruction.value = '';
      els.aiEditStatus.textContent = 'Cambio aplicado y guardado como nueva versión.';
      els.aiEditStatus.classList.remove('status--error');
      markCreatorDecision(tag, 'accepted');
    }

    function onAiEditDiscard() {
      const tag = state.aiEditCandidate && state.aiEditCandidate.tag;
      state.aiEditCandidate = null;
      els.aiEditDiff.hidden = true;
      if (els.aiEditFiles) els.aiEditFiles.hidden = true;
      els.aiEditStatus.textContent = 'Cambio descartado.';
      markCreatorDecision(tag, 'discarded');
    }

    function markCreatorDecision(tag, kind) {
      const cro = state.postExec && state.postExec.cro;
      if (tag === 'critic' && cro && cro.status === 'done') {
        cro.creator = kind;
        renderPostExecPanel();
      }
      resolveAiEditDecision(kind);
    }

    function onSaveVersionManual() {
      if (isProjectExecution()) {
        addProjectVersion({ source: 'manual' });
        els.ejecutorStatus.textContent = 'Versión del proyecto guardada.';
        els.ejecutorStatus.classList.remove('status--error');
        return;
      }
      if (!state.editor) return;
      addVersion({ source: 'manual', html: state.editor.getValue() });
      els.ejecutorStatus.textContent = 'Versión guardada.';
      els.ejecutorStatus.classList.remove('status--error');
    }

    function onDownloadHtml() {
      if (!state.editor) return;
      const html = state.editor.getValue();
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const slugSource = (state.project && state.project.tema) || (state.execution && state.execution.label) || 'landing';
      const slug = String(slugSource).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'landing';
      a.href = url;
      a.download = `landing-${slug}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    async function onCopyHtml() {
      if (!state.editor) return;
      try {
        await navigator.clipboard.writeText(state.editor.getValue());
        els.ejecutorStatus.textContent = 'Código copiado al portapapeles.';
        els.ejecutorStatus.classList.remove('status--error');
      } catch (e) {
        els.ejecutorStatus.textContent = 'No se pudo copiar el código.';
        els.ejecutorStatus.classList.add('status--error');
      }
    }

    /* ---------- Estudio: presets de ancho ---------- */

    function onWidthPresetClick(btn) {
      const width = btn.dataset.width;
      if (els.previewWrap) els.previewWrap.dataset.width = width;
      els.widthButtons.forEach((b) => {
        const active = b === btn;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-pressed', String(active));
      });
    }

    /* ---------- Estudio: tabs Vista previa/Código, Dividir, resize ----------
     * Layout persistido en localStorage (try/catch vía safeGetItem/safeSetItem):
     * qué tab está activa no se persiste (cada ejecución nueva arranca en
     * "preview", ver initEditorForExecution), pero sí si el modo Dividir
     * estaba activo, el ratio del splitter y la altura del Estudio.
     */
    const STUDIO_LAYOUT_KEY = 'lpa_studio_layout_v1';

    function loadStudioLayout() {
      const raw = safeGetItem(STUDIO_LAYOUT_KEY);
      if (!raw) return {};
      try {
        const parsed = JSON.parse(raw);
        return (parsed && typeof parsed === 'object') ? parsed : {};
      } catch (e) { return {}; }
    }

    function saveStudioLayout(patch) {
      safeSetItem(STUDIO_LAYOUT_KEY, JSON.stringify(Object.assign(loadStudioLayout(), patch)));
    }

    function refreshEditor() {
      if (state.editor && typeof state.editor.refresh === 'function') state.editor.refresh();
    }

    // Vista activa del Estudio: "preview" (por defecto) o "code". El editor
    // arranca oculto (Feature 1): sólo se ve en la tab Código, al activar
    // Dividir, o al inspeccionar un elemento desde la preview (Feature 5).
    function setStudioView(view) {
      state.studioView = view === 'code' ? 'code' : 'preview';
      if (els.studio) els.studio.dataset.view = state.studioView;
      els.studioTabsButtons.forEach((b) => {
        const active = b.dataset.studioTab === state.studioView;
        b.setAttribute('aria-selected', String(active));
        b.tabIndex = active ? 0 : -1;
      });
      if (els.btnToggleCode) {
        const showingCode = state.studioView === 'code';
        els.btnToggleCode.textContent = showingCode ? 'Ocultar código' : 'Mostrar código';
        els.btnToggleCode.setAttribute('aria-expanded', String(showingCode));
      }
      if (state.studioView === 'code' || state.splitMode) refreshEditor();
    }

    function applySplitRatio(ratio) {
      const r = Math.min(80, Math.max(20, Math.round(ratio)));
      state.studioSplitRatio = r;
      if (els.studioEditorPane) els.studioEditorPane.style.flexBasis = r + '%';
      if (els.studioPreviewPane) els.studioPreviewPane.style.flexBasis = (100 - r) + '%';
      if (els.studioSplitter) els.studioSplitter.setAttribute('aria-valuenow', String(r));
    }

    // Dividir: además de la tab activa, muestra ambos paneles lado a lado
    // con un splitter arrastrable (pointer events + flechas de teclado).
    function setSplitMode(active) {
      state.splitMode = !!active;
      if (els.studio) els.studio.dataset.split = String(state.splitMode);
      if (els.btnSplitToggle) els.btnSplitToggle.setAttribute('aria-pressed', String(state.splitMode));
      if (els.studioSplitter) els.studioSplitter.hidden = !state.splitMode;
      if (els.btnToggleCode) els.btnToggleCode.hidden = state.splitMode;
      if (state.splitMode) {
        applySplitRatio(state.studioSplitRatio);
      } else {
        // En modo tabs .studio es columna: un flex-basis en % heredado del
        // split se aplicaría a la altura y dejaría el panel a la mitad.
        if (els.studioEditorPane) els.studioEditorPane.style.flexBasis = '';
        if (els.studioPreviewPane) els.studioPreviewPane.style.flexBasis = '';
      }
      refreshEditor();
      saveStudioLayout({ split: state.splitMode });
    }

    function onStudioTabClick(btn) {
      setStudioView(btn.dataset.studioTab);
    }

    // Tablist accesible: flechas izquierda/derecha mueven el foco y activan
    // la tab (patrón estándar de "automatic activation").
    function onStudioTabKeydown(event) {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      const buttons = Array.from(els.studioTabsButtons);
      const idx = buttons.indexOf(event.currentTarget);
      if (idx === -1) return;
      const nextIdx = event.key === 'ArrowLeft' ? (idx - 1 + buttons.length) % buttons.length : (idx + 1) % buttons.length;
      const next = buttons[nextIdx];
      next.focus();
      setStudioView(next.dataset.studioTab);
    }

    function onToggleCodeClick() {
      setStudioView(state.studioView === 'code' ? 'preview' : 'code');
    }

    function onSplitToggleClick() {
      setSplitMode(!state.splitMode);
    }

    function onSplitterPointerDown(event) {
      if (!els.studio) return;
      event.preventDefault();
      const rect = els.studio.getBoundingClientRect();
      const move = (e) => {
        const pct = ((e.clientX - rect.left) / rect.width) * 100;
        applySplitRatio(pct);
      };
      const up = () => {
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', up);
        saveStudioLayout({ ratio: state.studioSplitRatio });
        refreshEditor();
      };
      document.addEventListener('pointermove', move);
      document.addEventListener('pointerup', up);
    }

    function onSplitterKeydown(event) {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      applySplitRatio(state.studioSplitRatio + (event.key === 'ArrowLeft' ? -2 : 2));
      saveStudioLayout({ ratio: state.studioSplitRatio });
      refreshEditor();
    }

    // Altura del Estudio (Feature 2): arranca en 70vh (--studio-h), un handle
    // debajo del panel la redimensiona en píxeles y persiste el valor.
    function applyStudioHeight(px) {
      const min = 240;
      const max = Math.max(min, Math.round(window.innerHeight * 0.9));
      const clamped = Math.min(max, Math.max(min, Math.round(px)));
      state.studioHeightPx = clamped;
      if (els.studio) els.studio.style.setProperty('--studio-h', clamped + 'px');
      if (els.studioVresize) els.studioVresize.setAttribute('aria-valuenow', String(Math.round((clamped / max) * 100)));
    }

    function onVresizePointerDown(event) {
      if (!els.studio) return;
      event.preventDefault();
      const startY = event.clientY;
      const startHeight = els.studio.getBoundingClientRect().height;
      const move = (e) => applyStudioHeight(startHeight + (e.clientY - startY));
      const up = () => {
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', up);
        saveStudioLayout({ heightPx: state.studioHeightPx });
        refreshEditor();
      };
      document.addEventListener('pointermove', move);
      document.addEventListener('pointerup', up);
    }

    function onVresizeKeydown(event) {
      if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
      event.preventDefault();
      const current = state.studioHeightPx || (els.studio ? els.studio.getBoundingClientRect().height : 480);
      applyStudioHeight(current + (event.key === 'ArrowUp' ? -24 : 24));
      saveStudioLayout({ heightPx: state.studioHeightPx });
      refreshEditor();
    }

    // Restaura el layout persistido (Dividir/ratio/altura) al iniciar la app.
    function initStudioLayout() {
      if (els.studioEditorPane) els.studioEditorPane.hidden = false;
      if (els.studioPreviewPane) els.studioPreviewPane.hidden = false;
      const layout = loadStudioLayout();
      state.studioSplitRatio = (typeof layout.ratio === 'number' && layout.ratio >= 20 && layout.ratio <= 80) ? layout.ratio : 50;
      applyStudioHeight(typeof layout.heightPx === 'number' ? layout.heightPx : Math.round(window.innerHeight * 0.7));
      setStudioView('preview');
      setSplitMode(!!layout.split);
    }

    // Abrir en ventana nueva (Feature 3): el HTML (posiblemente sin guardar)
    // se manda al servidor, que lo sirve por GET /preview/<id> en un origen
    // opaco (Content-Security-Policy: sandbox) para que NUNCA comparta el
    // origen de esta app (donde vive el localStorage con claves de API).
    async function onOpenWindowClick() {
      const pj = state.execution && state.execution.project;
      if (pj) {
        // Proyecto multi-archivo: la ventana nueva apunta directo al dev server
        // (127.0.0.1:<puerto>), que ya es un origen distinto al de esta app.
        if (pj.previewStatus === 'ready' && pj.url) {
          window.open(pj.url, '_blank', 'noopener');
        } else {
          els.ejecutorStatus.textContent = 'La vista previa del proyecto todavía no está lista.';
          els.ejecutorStatus.classList.add('status--error');
        }
        return;
      }
      const html = state.editor ? state.editor.getValue() : ((state.execution && state.execution.html) || '');
      if (!html) {
        els.ejecutorStatus.textContent = 'Todavía no hay código para abrir.';
        els.ejecutorStatus.classList.add('status--error');
        return;
      }
      if (!isServerAvailable()) {
        alert('Abrir en ventana nueva requiere ejecutar "node server.js" (no funciona con file://).');
        return;
      }
      try {
        const res = await fetch('/api/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ html }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.url) throw new Error(data.error || 'No se pudo generar la vista previa.');
        window.open(data.url, '_blank', 'noopener');
      } catch (e) {
        alert(`No se pudo abrir la vista previa en una ventana nueva: ${e.message || e}`);
      }
    }

    /* ---------- Banco: cliente REST sobre /api/banco (persistencia en disco) ---------- */

    const BANCO_API = '/api/banco';
    const bankFullCache = {}; // id -> respuesta completa de GET /api/banco/:id (evita refetch en la misma sesión)

    function isServerAvailable() {
      return typeof location !== 'undefined' && location.protocol !== 'file:';
    }

    async function bancoFetchJson(url, opts) {
      const res = await fetch(url, opts);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Error del servidor (${res.status}).`);
      return data;
    }

    function fetchBankList() {
      return bancoFetchJson(BANCO_API).then((data) => data.entries || []);
    }

    async function fetchBankEntry(id) {
      if (bankFullCache[id]) return bankFullCache[id];
      const data = await bancoFetchJson(`${BANCO_API}/${encodeURIComponent(id)}`);
      bankFullCache[id] = data;
      return data;
    }

    async function createBankEntry(payload) {
      try {
        const data = await bancoFetchJson(BANCO_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        bankFullCache[data.meta.id] = data;
        return { ok: true, entry: data };
      } catch (e) {
        return { ok: false, message: e.message || 'No se pudo guardar la landing en el Banco.' };
      }
    }

    async function updateBankEntry(id, payload) {
      try {
        const data = await bancoFetchJson(`${BANCO_API}/${encodeURIComponent(id)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        bankFullCache[id] = data;
        return { ok: true, entry: data };
      } catch (e) {
        return { ok: false, message: e.message || 'No se pudo actualizar la landing en el Banco.' };
      }
    }

    async function duplicateBankEntry(id) {
      try {
        const data = await bancoFetchJson(`${BANCO_API}/${encodeURIComponent(id)}/duplicate`, { method: 'POST' });
        bankFullCache[data.meta.id] = data;
        return { ok: true, entry: data };
      } catch (e) {
        return { ok: false, message: e.message || 'No se pudo duplicar la landing.' };
      }
    }

    async function deleteBankEntry(id) {
      try {
        await bancoFetchJson(`${BANCO_API}/${encodeURIComponent(id)}`, { method: 'DELETE' });
        delete bankFullCache[id];
        return { ok: true };
      } catch (e) {
        return { ok: false, message: e.message || 'No se pudo eliminar la landing.' };
      }
    }

    /* ---------- Banco: vista ---------- */

    // Handlers cuando el Banco vive en disco (servidor disponible): las
    // acciones que necesitan el HTML/prompt completo lo piden al vuelo con
    // fetchBankEntry (la lista de GET /api/banco es liviana, sólo meta.json).
    const serverBankHandlers = {
      onCopySeed: (seed) => copyText(seed),
      onUseSeed: (seed) => {
        setSsotSeed(seed);
        goto('contexto');
        const panel = document.getElementById('ssot-panel');
        if (panel && panel.scrollIntoView) panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
      },
      // "Abrir": ve la landing tal cual quedó guardada en disco, en una
      // pestaña nueva y sin origen compartido con esta app (Feature 4). No
      // entra al Estudio: para editar está "Editar", más abajo.
      onOpen: async (entry) => {
        if (entry.multiFile) {
          // Proyectos multi-archivo: no hay HTML estático que abrir; se relanza
          // el dev server y se ve la preview real en el Estudio.
          try {
            const full = await fetchBankEntry(entry.id);
            openProjectFromBank(full);
          } catch (e) { alert(`No se pudo abrir el proyecto: ${e.message}`); }
          return;
        }
        window.open(`/banco/${encodeURIComponent(entry.id)}/index.html`, '_blank', 'noopener');
      },
      onEdit: async (entry) => {
        try {
          const full = await fetchBankEntry(entry.id);
          if (full.meta.multiFile) { openProjectFromBank(full); return; }
          state.execution = { label: full.meta.tema, promptUsed: full.prompt, status: 'done', html: full.html, editorInited: false, ssotSeed: full.meta.ssotSeed || null };
          state.openedFromBank = full.meta.id;
          state.pendingVersions = (full.versions && full.versions.length) ? full.versions : null;
          goto('ejecutor');
          renderEjecutor();
        } catch (e) { alert(`No se pudo abrir la landing para editar: ${e.message}`); }
      },
      onRerun: async (entry) => {
        const proceed = await confirmReplaceStudio();
        if (!proceed) return;
        try {
          const full = await fetchBankEntry(entry.id);
          state.execution = { label: full.meta.tema, promptUsed: full.prompt, status: 'idle', html: '', editorInited: false, ssotSeed: full.meta.ssotSeed || null };
          state.openedFromBank = null;
          state.pendingVersions = null;
          goto('ejecutor');
          renderEjecutor();
          executeCurrent();
        } catch (e) { alert(`No se pudo re-ejecutar: ${e.message}`); }
      },
      onCopyPrompt: async (entry) => {
        try {
          const full = await fetchBankEntry(entry.id);
          await navigator.clipboard.writeText(full.prompt);
        } catch (e) { /* no-op */ }
      },
      onLoadPrompt: async (entry) => {
        const full = await fetchBankEntry(entry.id);
        return full.prompt;
      },
      onDuplicate: async (entry) => {
        const result = await duplicateBankEntry(entry.id);
        if (result.ok) await loadServerBankAndRender();
        else alert(result.message);
      },
      onDelete: async (entry) => {
        const confirmed = window.confirm(`¿Eliminar "${entry.tema}" del Banco? Esto borra la carpeta banco/${entry.id} del disco y no se puede deshacer.`);
        if (!confirmed) return;
        const result = await deleteBankEntry(entry.id);
        if (result.ok) await loadServerBankAndRender();
        else alert(result.message);
      },
    };

    // Handlers de sólo lectura para cuando no hay servidor (file://) o no se
    // pudo contactar: se navega el respaldo de localStorage tal cual estaba,
    // sin duplicar/eliminar/editar (esas mutaciones requieren disco).
    const legacyBankHandlers = {
      onCopySeed: (seed) => copyText(seed),
      onUseSeed: (seed) => {
        setSsotSeed(seed);
        goto('contexto');
        const panel = document.getElementById('ssot-panel');
        if (panel && panel.scrollIntoView) panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
      },
      onOpen: (entry) => {
        state.execution = { label: entry.proyecto, promptUsed: entry.prompt, status: 'done', html: entry.html, editorInited: false };
        state.openedFromBank = null; // sin id de servidor: "Guardar en Banco" crea una entrada nueva en disco cuando haya servidor
        state.pendingVersions = (entry.versions && entry.versions.length) ? entry.versions : null;
        goto('ejecutor');
        renderEjecutor();
      },
      onCopyPrompt: async (entry) => {
        try { await navigator.clipboard.writeText(entry.prompt); } catch (e) { /* no-op */ }
      },
    };

    function maybeShowMigrationOffer() {
      if (!els.bankMigrate) return;
      const legacy = loadBank();
      const migrated = safeGetItem(BANK_MIGRATED_KEY);
      if (legacy.length && !migrated) {
        els.bankMigrate.hidden = false;
        els.bankMigrate.textContent = `Importar ${legacy.length} diseño${legacy.length === 1 ? '' : 's'} guardado${legacy.length === 1 ? '' : 's'} en el navegador al disco`;
      } else {
        els.bankMigrate.hidden = true;
      }
    }

    async function loadServerBankAndRender() {
      try {
        state.bank = await fetchBankList();
        if (els.bankNotice) els.bankNotice.hidden = true;
        renderBank(state.bank, els.bankGrid, serverBankHandlers);
        maybeShowMigrationOffer();
      } catch (e) {
        if (els.bankNotice) {
          els.bankNotice.hidden = false;
          els.bankNotice.textContent = 'No se pudo conectar con el servidor del Banco (¿está corriendo "node server.js"?). Mostrando el respaldo guardado en este navegador, sólo lectura.';
        }
        if (els.bankMigrate) els.bankMigrate.hidden = true;
        state.bank = loadBank();
        renderBank(state.bank, els.bankGrid, legacyBankHandlers);
      }
    }

    async function migrateLocalBankToServer() {
      const legacy = loadBank();
      if (!legacy.length) return;
      const confirmed = window.confirm(`¿Importar ${legacy.length} landing(s) guardadas en este navegador al disco? Se mantienen también en el navegador.`);
      if (!confirmed) return;
      els.bankMigrate.disabled = true;
      els.bankMigrate.textContent = 'Importando…';
      let ok = 0;
      let fail = 0;
      for (const entry of legacy) {
        // eslint-disable-next-line no-await-in-loop -- import secuencial, intencional (no saturar el servidor local)
        const result = await createBankEntry({
          project: { tema: entry.proyecto },
          verticals: entry.verticals || [],
          technologies: entry.technologies || [],
          prompt: entry.prompt || '',
          html: entry.html || '',
          model: '',
          provider: '',
          versions: entry.versions || [],
        });
        if (result.ok) ok++; else fail++;
      }
      safeSetItem(BANK_MIGRATED_KEY, '1');
      els.bankMigrate.disabled = false;
      await loadServerBankAndRender();
      alert(`Importación completa: ${ok} landing(s) importadas al disco${fail ? `, ${fail} fallaron` : ''}.`);
    }

    async function renderBankView() {
      if (!isServerAvailable()) {
        if (els.bankNotice) {
          els.bankNotice.hidden = false;
          els.bankNotice.textContent = 'El Banco en disco requiere ejecutar "node server.js" (no funciona abriendo la app con file://). Mostrando el respaldo guardado en este navegador, sólo lectura.';
        }
        if (els.bankMigrate) els.bankMigrate.hidden = true;
        state.bank = loadBank();
        renderBank(state.bank, els.bankGrid, legacyBankHandlers);
        return;
      }
      await loadServerBankAndRender();
    }

    /* ---------- Configuración (proveedores, crítico, multimedia) ---------- */

    let opencodeModelsCache = null;

    // Referencias a un juego de campos de proveedor. prefix '' = generador;
    // 'critic-' = crítico (mismos campos, ids con prefijo).
    function getProviderFormRefs(prefix) {
      const g = (id) => document.getElementById(prefix + id);
      return {
        select: g('provider-select'),
        fieldsAnthropic: g('provider-fields-anthropic'),
        fieldsOpenAI: g('provider-fields-openai'),
        fieldsOpencode: g('provider-fields-opencode'),
        anthropicKey: g('anthropic-key'),
        anthropicModel: g('anthropic-model'),
        openaiBaseUrl: g('openai-base-url'),
        openaiModel: g('openai-model'),
        openaiKey: g('openai-key'),
        openaiReasoning: g('openai-reasoning'),
        opencodeModel: g('opencode-model'),
        opencodeHint: g('opencode-hint'),
        opencodeRefresh: g('opencode-refresh-models'),
        testBtn: g('provider-test'),
        testResult: g('provider-test-result'),
      };
    }

    async function loadOpencodeModelsIntoSelect(f, preferredId, forceRefresh) {
      const selectEl = f.opencodeModel;
      const hintEl = f.opencodeHint;
      if (!selectEl) return;
      if (typeof location === 'undefined' || location.protocol === 'file:') {
        selectEl.innerHTML = '';
        selectEl.disabled = true;
        if (hintEl) hintEl.textContent = 'Este proveedor requiere `node server.js` (no funciona abriendo la app con file://).';
        return;
      }
      selectEl.disabled = true;
      if (f.opencodeRefresh) f.opencodeRefresh.disabled = true;
      if (hintEl) hintEl.textContent = 'Cargando modelos de OpenCode…';
      try {
        if (forceRefresh || !opencodeModelsCache) {
          const res = await fetch(`/api/opencode/models${forceRefresh ? '?refresh=1' : ''}`);
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data.error || 'No se pudieron listar los modelos de OpenCode.');
          opencodeModelsCache = data.models || [];
        }
        // Orden: recomendado (confirmado funcionando) → resto de gratis →
        // pagos. No se prueba cada modelo en cada carga (ver server.js): el
        // fallback automático de la ejecución se encarga si el elegido falla.
        const recommended = opencodeModelsCache.filter((m) => m.free && m.recommended);
        const otherFree = opencodeModelsCache.filter((m) => m.free && !m.recommended);
        const rest = opencodeModelsCache.filter((m) => !m.free);
        const ordered = recommended.concat(otherFree, rest);
        selectEl.innerHTML = '';
        ordered.forEach((m) => {
          const opt = document.createElement('option');
          opt.value = m.id;
          let suffix = '';
          if (m.free) suffix = m.recommended ? ' (gratis, recomendado)' : ' (gratis)';
          opt.textContent = `${m.id}${suffix}`;
          selectEl.appendChild(opt);
        });
        const fallback = recommended[0] || otherFree[0] || ordered[0];
        const toSelect = preferredId && ordered.some((m) => m.id === preferredId) ? preferredId : (fallback ? fallback.id : '');
        if (toSelect) selectEl.value = toSelect;
        selectEl.disabled = ordered.length === 0;
        if (hintEl) {
          hintEl.textContent = recommended.length
            ? 'Se recomienda el modelo marcado "recomendado" (confirmado funcionando); si falla, la ejecución prueba otros gratis automáticamente.'
            : 'No hay un modelo recomendado marcado; si el elegido falla, la ejecución prueba otros gratis automáticamente.';
        }
      } catch (e) {
        selectEl.innerHTML = '';
        selectEl.disabled = true;
        if (hintEl) hintEl.textContent = e.message || 'No se pudieron cargar los modelos de OpenCode.';
      } finally {
        if (f.opencodeRefresh) f.opencodeRefresh.disabled = false;
      }
    }

    function fillProviderForm(f, p) {
      f.select.value = p.type;
      f.anthropicKey.value = p.apiKey && p.type === 'anthropic' ? p.apiKey : '';
      f.anthropicModel.value = p.model && p.type === 'anthropic' ? p.model : 'claude-sonnet-5';
      f.openaiBaseUrl.value = p.type === 'openai-compatible' ? (p.baseUrl || '') : '';
      f.openaiModel.value = p.type === 'openai-compatible' ? (p.model || '') : '';
      f.openaiKey.value = p.type === 'openai-compatible' ? (p.apiKey || '') : '';
      if (f.openaiReasoning) f.openaiReasoning.value = (p.type === 'openai-compatible' && p.reasoning) ? p.reasoning : 'auto';
      toggleProviderFields(f);
      if (p.type === 'opencode-local') loadOpencodeModelsIntoSelect(f, p.model || null);
    }

    function toggleProviderFields(f) {
      const value = f.select.value;
      f.fieldsAnthropic.hidden = value !== 'anthropic';
      f.fieldsOpenAI.hidden = value !== 'openai-compatible';
      if (f.fieldsOpencode) f.fieldsOpencode.hidden = value !== 'opencode-local';
    }

    function readProviderForm(f) {
      const type = f.select.value;
      if (type === 'anthropic') {
        return { type, apiKey: f.anthropicKey.value.trim(), model: f.anthropicModel.value.trim() || 'claude-sonnet-5', baseUrl: '', maxTokens: 16000 };
      }
      if (type === 'opencode-local') {
        return { type, apiKey: '', model: f.opencodeModel ? f.opencodeModel.value : '', baseUrl: '', maxTokens: 16000 };
      }
      return { type, apiKey: f.openaiKey.value.trim(), model: f.openaiModel.value.trim(), baseUrl: f.openaiBaseUrl.value.trim(), maxTokens: 32000, reasoning: f.openaiReasoning ? f.openaiReasoning.value : 'auto' };
    }

    function onProviderSelectChange(f, current) {
      toggleProviderFields(f);
      if (f.select.value === 'opencode-local') {
        loadOpencodeModelsIntoSelect(f, current && current.type === 'opencode-local' ? current.model : null);
      }
    }

    function flashSaved(el, text) {
      if (!el) return;
      el.textContent = text;
      setTimeout(() => { if (el.textContent === text) el.textContent = ''; }, 4000);
    }

    function onProviderSubmit(event) {
      event.preventDefault();
      const cfg = readProviderForm(els.genForm);
      state.provider = cfg;
      persistProviderConfig(cfg);
      updateProviderSummary();
      flashSaved(els.providerSaved, 'Generador guardado.');
    }

    function onCriticSubmit(event) {
      event.preventDefault();
      const cfg = Object.assign({ useSame: false }, readProviderForm(els.criticForm));
      state.criticProvider = cfg;
      persistCriticProviderConfig(cfg);
      updateProviderSummary();
      flashSaved(els.criticSaved, 'Crítico guardado.');
    }

    function onCriticSameChange() {
      const useSame = els.criticSame.checked;
      els.criticOwn.hidden = useSame;
      // Se conserva el resto de la config del crítico al alternar.
      const cfg = Object.assign({}, state.criticProvider, { useSame });
      if (!useSame) Object.assign(cfg, readProviderForm(els.criticForm));
      state.criticProvider = cfg;
      persistCriticProviderConfig(cfg);
      updateProviderSummary();
      flashSaved(els.criticSaved, useSame ? 'El crítico usa el mismo modelo que el generador.' : 'Configurá el modelo del crítico y guardalo.');
    }

    function fillCriticForm() {
      const c = state.criticProvider;
      els.criticSame.checked = c.useSame !== false;
      els.criticOwn.hidden = els.criticSame.checked;
      fillProviderForm(els.criticForm, c);
    }

    // Prueba una conexión con un prompt mínimo y muestra latencia o error.
    async function testProviderConnection(f) {
      const cfg = readProviderForm(f);
      if (!f.testResult) return;
      f.testBtn.disabled = true;
      f.testResult.className = 'config-test';
      f.testResult.textContent = 'Probando…';
      const started = Date.now();
      let res;
      try {
        const prompt = 'Respondé únicamente con la palabra: ok';
        res = cfg.type === 'opencode-local'
          ? await runOpencodeComplete({ prompt, model: cfg.model || OPENCODE_META_MODEL_FALLBACK, expect: 'text' })
          : await runPrompt(cfg, prompt, { expect: 'text' });
      } catch (e) {
        res = { ok: false, error: (e && e.message) || 'Error inesperado.' };
      }
      const ms = Date.now() - started;
      if (res && res.ok) {
        f.testResult.className = 'config-test config-test--ok';
        f.testResult.textContent = `Conexión OK · ${ms} ms${res.model ? ' · ' + res.model : ''}`;
      } else {
        f.testResult.className = 'config-test config-test--err';
        f.testResult.textContent = `Error tras ${ms} ms: ${(res && res.error) || 'sin respuesta'}`;
      }
      f.testBtn.disabled = false;
    }

    function bindProviderForm(f, getCurrent) {
      f.select.addEventListener('change', () => onProviderSelectChange(f, getCurrent()));
      if (f.opencodeRefresh) {
        f.opencodeRefresh.addEventListener('click', () => {
          loadOpencodeModelsIntoSelect(f, f.opencodeModel ? f.opencodeModel.value : null, true);
        });
      }
      if (f.testBtn) f.testBtn.addEventListener('click', () => testProviderConnection(f));
    }

    /* Preferencias de multimedia: chips tipo radio; se guardan al elegir. */

    function renderMediaPrefs() {
      const targets = { images: els.mediaPrefImages, stock: els.mediaPrefStock, vision: els.mediaPrefVision, video: els.mediaPrefVideo };
      Object.keys(targets).forEach((kind) => {
        const el = targets[kind];
        if (!el) return;
        const options = MEDIA_PREF_OPTIONS[kind];
        const current = state.mediaPrefs[kind] || options[0][0]; // sin elección explícita: el recomendado/por defecto
        el.textContent = '';
        options.forEach(([value, label]) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'chip';
          btn.setAttribute('role', 'radio');
          btn.setAttribute('aria-checked', String(value === current));
          btn.dataset.value = value;
          btn.textContent = label;
          btn.addEventListener('click', () => {
            state.mediaPrefs = Object.assign({}, state.mediaPrefs, { [kind]: value });
            saveMediaPrefs(state.mediaPrefs);
            renderMediaPrefs();
            renderPregenPanel();
            if (mediaStatusCache) refreshMediaStatusChips(false);
            const again = el.querySelector(`[data-value="${value}"]`);
            if (again) again.focus();
          });
          el.appendChild(btn);
        });
      });
      renderVisionCfg();
    }

    // Sub-formulario del proveedor de visión (sólo para openai-compatible / anthropic).
    function renderVisionCfg() {
      if (!els.visionCfg) return;
      const kind = state.mediaPrefs.vision || 'gemini';
      const show = kind === 'openai-compatible' || kind === 'anthropic';
      els.visionCfg.hidden = !show;
      if (!show) return;
      const own = state.mediaPrefs.visionCfg || {};
      const matches = state.provider && state.provider.type === kind;
      const useGen = typeof own.useGenerator === 'boolean' ? own.useGenerator : !!matches;
      els.visionUseGen.checked = useGen;
      els.visionOwn.hidden = useGen;
      els.visionOwnUrlField.hidden = kind === 'anthropic';
      if (document.activeElement !== els.visionBaseUrl) els.visionBaseUrl.value = own.baseUrl || '';
      if (document.activeElement !== els.visionApiKey) els.visionApiKey.value = own.apiKey || '';
      if (document.activeElement !== els.visionModel) els.visionModel.value = own.model || '';
      els.visionModel.placeholder = VISION_DEFAULT_MODELS[kind];
      els.visionModelNote.hidden = kind !== 'openai-compatible';
      const r = resolveVisionConfig(state.mediaPrefs, state.provider);
      els.visionCfgStatus.textContent = r.ready ? `Visión elegida: ${r.label}.` : `${r.reason || 'Configuración incompleta'}. Mientras tanto se usa el análisis local.`;
    }

    function onVisionCfgInput() {
      const prev = state.mediaPrefs.visionCfg || {};
      const cfg = normalizeVisionCfg({
        useGenerator: els.visionUseGen.checked,
        baseUrl: els.visionBaseUrl.value, apiKey: els.visionApiKey.value, model: els.visionModel.value,
      }) || prev;
      state.mediaPrefs = Object.assign({}, state.mediaPrefs, { visionCfg: cfg });
      saveMediaPrefs(state.mediaPrefs);
      renderVisionCfg();
      if (typeof refreshMediaStatusChips === 'function' && isServerAvailable()) refreshMediaStatusChips(false);
    }

    function openConfigView() {
      goto('config');
      if (isServerAvailable()) refreshMediaStatusChips(true);
    }

    /* ---------- Enlace de eventos ---------- */


    /* ---------- Limpiar todo: vacía SOLO el trabajo en pantalla ----------
     * No toca: Banco (disco/servidor), archivos de media/, server/.env,
     * Configuración (proveedores, claves de media 'lpa_media_keys_v1',
     * preferencias 'lpa_media_prefs_v1', visión), la cadena SSoT
     * ('lpa_ssot_seed_v1') ni la disposición de la UI. Tampoco hace ningún
     * pedido al servidor salvo cancelar lo que estuviera en curso y detener
     * el servidor de desarrollo de la preview actual (limpieza local).
     * Claves de localStorage que se BORRAN (datos de trabajo):
     */
    const RESET_WORKING_KEYS = [MEDIA_STORAGE_KEY, TECHNIQUES_STORAGE_KEY, CONCEPT_PICK_KEY, PREGEN_KEY, PROMPT_DRAFT_KEY, STUDIO_DRAFT_KEY];

    let toastTimer = null;
    function showToast(message) {
      const el = document.getElementById('toast');
      if (!el) return;
      el.textContent = message;
      el.hidden = false;
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(() => { el.hidden = true; toastTimer = null; }, 6000);
    }

    async function onResetAllClick() {
      const action = await showConfirmDialog({
        title: 'Limpiar todo',
        message: [
          'Se va a vaciar lo que está cargado en pantalla para empezar de cero:',
          '• Setup: campos, descripción, sugerencias de IA y multimedia elegida.',
          '• Paso 2: verticales, rubro propio, tecnologías, técnicas (vuelven a «todas»), concepto elegido y recursos generados o buscados.',
          '• Generador: prompts, ediciones, dirección creativa y borradores.',
          '• Ejecutor y Estudio: ejecución, código, vista previa, versiones, consola y cambios propuestos por la IA. Se cancela lo que esté en curso.',
          '',
          'Se conserva: el Banco, los archivos subidos en media/, la Configuración (proveedores y claves), las preferencias de multimedia y la cadena semilla.',
          'Esta acción no se puede deshacer.',
        ].join('\n'),
        actions: [
          { id: 'reset', label: 'Limpiar todo', variant: 'btn--primary' },
          { id: 'cancel', label: 'Cancelar', variant: 'btn--secondary', autofocus: true },
        ],
      });
      if (action !== 'reset') return;
      resetAllWorkingData();
    }

    function resetAllWorkingData() {
      state.resetEpoch++;

      // 1) Cancelar lo que esté en curso (rutas de cancelación existentes).
      if (aiFill.busy) onAiFillCancel();
      if (conceptPickState.busy) onConceptCancel();
      if (pregenState.busy && pregenState.llmRunId) cancelOpencodeRun(pregenState.llmRunId);
      pregenState.epoch++;
      pregenState.busy = false; pregenState.run = null; pregenState.llmRunId = null;
      Object.keys(state.modelPrompts).forEach((k) => {
        const e = state.modelPrompts[k];
        if (e && e.status === 'loading') { e.cancelRequested = true; cancelOpencodeRun(e.runId); }
      });
      const exec = state.execution;
      if (exec && exec.status === 'loading') onCancelExecute();
      if (state.aiEditRunId) cancelOpencodeRun(state.aiEditRunId);
      state.aiEditRunId = null;
      cancelPostExecPasses();
      if (exec && exec.project) {
        const pj = exec.project;
        pj.launchToken += 1;
        if (pj.relaunchTimer) { clearTimeout(pj.relaunchTimer); pj.relaunchTimer = null; }
        if (pj.writeTimer) { clearTimeout(pj.writeTimer); pj.writeTimer = null; }
        if (pj.previewId) stopProjectPreview(pj.previewId);
      }
      [state.previewDebounceTimer, state.promptEditDebounceTimer, state.studioDraftDebounceTimer].forEach((t) => { if (t) clearTimeout(t); });
      state.previewDebounceTimer = null; state.promptEditDebounceTimer = null; state.studioDraftDebounceTimer = null;
      mediaPending.forEach((p) => { p.dropped = true; });
      mediaPending.length = 0;

      // 2) Estado en memoria.
      state.project = {};
      state.verticals = [];
      state.customVertical = '';
      state.customVerticalOn = false;
      state.technologies = [];
      state.techniques = ALL_TECHNIQUE_IDS.slice();
      state.media = { references: [], required: [] };
      state.mediaBusy = 0;
      state.assetsCache = {};
      state.describeCache = {};
      state.conceptPick = emptyConceptPick();
      state.pregen = emptyPregen();
      state.genEpoch++;
      state.genTechniques = null;
      state.postExec = null;
      state.templateGeneration = null;
      state.modelPrompts = {};
      state.activeTab = null;
      state.edits = {};
      state.execution = null;
      state.openedFromBank = null;
      state.pendingVersions = null;
      state.versions = [];
      state.inspecting = false;
      state.inspectedElement = null;
      state.aiEditCandidate = null;
      state.studioBaseline = null;
      state.draftNoticeTab = null;
      state.pendingPreviewHtml = '';
      Object.keys(mediaFrames).forEach((k) => { delete mediaFrames[k]; });
      Object.keys(mediaPreviews).forEach((k) => {
        try { if (typeof URL !== 'undefined' && URL.revokeObjectURL) URL.revokeObjectURL(mediaPreviews[k]); } catch (e) { /* no-op */ }
        delete mediaPreviews[k];
      });

      // 3) localStorage: sólo datos de trabajo (ver RESET_WORKING_KEYS).
      RESET_WORKING_KEYS.forEach((k) => safeRemoveItem(k));

      // 4) Paneles y modales auxiliares.
      Object.assign(conceptPickState, { busy: false, runId: null, cancelled: false, started: 0, status: '', statusError: false, ownOpen: false, editing: -1, ownError: '' });
      if (conceptPickState.timer) { clearInterval(conceptPickState.timer); conceptPickState.timer = null; }
      [els.conceptOwnTitle, els.conceptOwnIs, els.conceptOwnNav].forEach((i) => { if (i) i.value = ''; });
      web.trigger = null;
      closePregenWeb();
      Object.assign(web, { items: [], offset: 0, exhausted: false, loading: false, suggesting: false, message: '', selected: new Map(), suggestions: [], error: '', key: '' });
      web.cache.clear();
      closePregenLibrary();
      Object.assign(pregenState, { libItems: [], libSelected: new Set(), libTrigger: null });
      setPregenProgress('image', '');
      setPregenProgress('video', '');

      // 5) Setup: formulario, sugerencias IA, errores y dropzones.
      fillSetupForm({});
      document.querySelectorAll('.ai-suggestion').forEach((n) => n.remove());
      setAiFillStatus('', false);
      refreshAiFillButton();
      clearSetupErrors();
      setMediaError('reference', '');
      setMediaError('required', '');
      ['media-ref-input', 'media-req-input'].forEach((id) => { const i = document.getElementById(id); if (i) i.value = ''; });
      if (els.inputVerticalOtro) els.inputVerticalOtro.value = '';
      if (els.errVerticalOtro) els.errVerticalOtro.textContent = '';
      if (els.errContexto) els.errContexto.textContent = '';
      renderMediaLists();

      // 6) Estudio: editor, vista previa, consola, versiones y paneles de IA.
      if (state.editor) state.editor.setValue('');
      [state.previewDebounceTimer, state.studioDraftDebounceTimer].forEach((t) => { if (t) clearTimeout(t); });
      state.previewDebounceTimer = null; state.studioDraftDebounceTimer = null;
      resetProjectUi();
      if (els.previewFrame && els.previewFrame.dataset.loaded === 'true') sendHtmlToPreview('');
      const c = state.consoleLog;
      c.run = ''; c.inst = null; c.awaiting = false; c.inject = null; c.empty = false; c.lastHint = '';
      consoleClear(false);
      if (els.btnInspectToggle) { els.btnInspectToggle.setAttribute('aria-pressed', 'false'); els.btnInspectToggle.classList.remove('is-active'); }
      if (els.aiEditDiff) els.aiEditDiff.hidden = true;
      if (els.aiEditFiles) els.aiEditFiles.hidden = true;
      if (els.aiEditStatus) { els.aiEditStatus.textContent = ''; els.aiEditStatus.classList.remove('status--error'); }
      if (els.aiInstruction) els.aiInstruction.value = '';
      if (els.studioDraftNotice) els.studioDraftNotice.hidden = true;
      if (els.promptCopyStatus) els.promptCopyStatus.textContent = '';
      resetPostExec();
      renderPostExecPanel();
      renderVersions();
      setStudioView('preview');

      // 7) Re-render de todo (la cadena SSoT se conserva y se vuelve a pintar).
      renderChipGroups();
      renderConceptPickPanel();
      renderPregenPanel();
      renderGenerador();
      renderEjecutor();
      stopGenElapsedTimerIfIdle();

      // 8) Volver al Setup, enfocar el primer campo y avisar.
      goto('setup');
      const first = els.formSetup && els.formSetup.elements.descripcion;
      if (first) first.focus();
      showToast('Listo: se limpió el proyecto en pantalla (Banco y Configuración intactos)');
    }

    function bindEvents() {
      els.stepButtons.forEach((b) => b.addEventListener('click', () => goto(b.dataset.goto)));
      const mkSave = document.getElementById('mk-save');
      const mkClear = document.getElementById('mk-clear');
      const mkShow = document.getElementById('mk-show');
      if (mkSave) mkSave.addEventListener('click', onSaveMediaKeys);
      if (mkClear) mkClear.addEventListener('click', onClearMediaKeys);
      if (mkShow) mkShow.addEventListener('change', () => mediaKeyInputs().forEach((inp) => { inp.type = mkShow.checked ? 'text' : 'password'; }));
      [els.visionUseGen, els.visionBaseUrl, els.visionApiKey, els.visionModel].forEach((el) => {
        if (el) el.addEventListener(el === els.visionUseGen ? 'change' : 'input', onVisionCfgInput);
      });
      if (els.bankLink) els.bankLink.addEventListener('click', () => goto('banco'));
      if (els.bankMigrate) els.bankMigrate.addEventListener('click', migrateLocalBankToServer);

      els.formSetup.addEventListener('submit', onSetupSubmit);
      bindDropzone(document.getElementById('dropzone-ref'), document.getElementById('media-ref-input'), 'reference');
      bindDropzone(document.getElementById('dropzone-req'), document.getElementById('media-req-input'), 'required');
      els.btnLoadExample.addEventListener('click', onLoadExample);
      ['fab-clear-all'].forEach((id) => {
        const b = document.getElementById(id);
        if (b) b.addEventListener('click', onResetAllClick);
      });
      const aiBtn = document.getElementById('btn-ai-fill');
      if (aiBtn) {
        aiBtn.addEventListener('click', onAiFillClick);
        document.getElementById('btn-ai-fill-cancel').addEventListener('click', onAiFillCancel);
        setupField('descripcion').addEventListener('input', () => { setAiFillStatus('', false); refreshAiFillButton(); });
        refreshAiFillButton();
      }

      els.btnGenerate.addEventListener('click', onGenerateClick);
      if (els.inputVerticalOtro) els.inputVerticalOtro.addEventListener('input', onVerticalOtroInput);
      if (els.btnTechAll) els.btnTechAll.addEventListener('click', () => setTechniques(ALL_TECHNIQUE_IDS));
      if (els.btnSsotNew) els.btnSsotNew.addEventListener('click', onSsotNew);
      if (els.btnConceptIdeate) els.btnConceptIdeate.addEventListener('click', onConceptIdeate);
      if (els.btnConceptMore) els.btnConceptMore.addEventListener('click', onConceptIdeate);
      if (els.btnConceptCancel) els.btnConceptCancel.addEventListener('click', onConceptCancel);
      if (els.btnConceptOwn) els.btnConceptOwn.addEventListener('click', onConceptOwnToggle);
      if (els.conceptOwnForm) els.conceptOwnForm.addEventListener('submit', onConceptOwnSubmit);
      if (els.btnSsotCopy) els.btnSsotCopy.addEventListener('click', onSsotCopy);
      if (els.btnSsotApply) els.btnSsotApply.addEventListener('click', onSsotApply);
      if (els.btnPregenImage) els.btnPregenImage.addEventListener('click', onPregenImages);
      if (els.btnPregenVideo) els.btnPregenVideo.addEventListener('click', onPregenVideo);
      if (els.btnPregenImageLib) els.btnPregenImageLib.addEventListener('click', () => openPregenLibrary('image', els.btnPregenImageLib));
      if (els.btnPregenVideoLib) els.btnPregenVideoLib.addEventListener('click', () => openPregenLibrary('video', els.btnPregenVideoLib));
      if (els.btnPregenImageWeb) els.btnPregenImageWeb.addEventListener('click', () => openPregenWeb('image', els.btnPregenImageWeb));
      if (els.btnPregenVideoWeb) els.btnPregenVideoWeb.addEventListener('click', () => openPregenWeb('video', els.btnPregenVideoWeb));
      if (els.pregenWeb) {
        els.pregenWeb.addEventListener('keydown', onWebKeydown);
        els.pregenWeb.addEventListener('cancel', (e) => { e.preventDefault(); closePregenWeb(); });
        els.pregenWeb.addEventListener('click', (e) => { if (e.target === els.pregenWeb) closePregenWeb(); });
        webBtn('search').addEventListener('click', onWebSearch);
        webBtn('suggest').addEventListener('click', onWebSuggest);
        webBtn('more').addEventListener('click', onWebMore);
        webBtn('new').addEventListener('click', onWebNew);
        webBtn('add').addEventListener('click', onWebAdd);
        webBtn('cancel').addEventListener('click', closePregenWeb);
        webBtn('close').addEventListener('click', closePregenWeb);
        webEl('q').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); onWebSearch(); } });
      }
      if (els.btnPregenLibraryClose) els.btnPregenLibraryClose.addEventListener('click', closePregenLibrary);
      if (els.btnPregenLibraryAdd) els.btnPregenLibraryAdd.addEventListener('click', onPregenLibraryAdd);
      if (els.pregenLibrary) {
        els.pregenLibrary.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.preventDefault(); closePregenLibrary(); } });
        els.pregenLibrary.addEventListener('click', (e) => { if (e.target === els.pregenLibrary) closePregenLibrary(); });
      }
      if (els.ssotSeedInput) {
        els.ssotSeedInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); onSsotApply(); } });
        els.ssotSeedInput.addEventListener('input', () => { els.ssotSeedError.textContent = ''; els.ssotSeedInput.removeAttribute('aria-invalid'); });
      }
      if (els.btnTechNone) els.btnTechNone.addEventListener('click', () => setTechniques([]));
      if (els.btnCroApply) els.btnCroApply.addEventListener('click', onCroApplyClick);
      if (els.btnCroRound2) els.btnCroRound2.addEventListener('click', onCroRound2Click);
      if (els.btnRewriteUse) els.btnRewriteUse.addEventListener('click', onRewriteUseClick);
      if (els.btnCancelPostExec) els.btnCancelPostExec.addEventListener('click', onCancelPostExec);

      els.promptTextarea.addEventListener('input', onPromptEdit);
      if (els.btnDiscardDraft) els.btnDiscardDraft.addEventListener('click', onDiscardPromptDraft);
      els.btnCopyPrompt.addEventListener('click', onCopyPrompt);
      els.btnRegenerate.addEventListener('click', onRegenerate);
      els.btnCancelGenerate.addEventListener('click', onCancelGenerate);
      els.btnExecute.addEventListener('click', onExecuteClick);

      if (els.btnProviderConfig) els.btnProviderConfig.addEventListener('click', openConfigView); // el atajo del Ejecutor se quitó; queda por si vuelve
      if (els.setupProviderNoticeBtn) els.setupProviderNoticeBtn.addEventListener('click', openConfigView);
      bindProviderForm(els.genForm, () => state.provider);
      bindProviderForm(els.criticForm, () => state.criticProvider);
      els.formProvider.addEventListener('submit', onProviderSubmit);
      els.formCritic.addEventListener('submit', onCriticSubmit);
      els.criticSame.addEventListener('change', onCriticSameChange);
      els.stepButtons.forEach((b) => { if (b.dataset.goto === 'config') b.addEventListener('click', () => { if (isServerAvailable()) refreshMediaStatusChips(true); }); });

      els.btnRerun.addEventListener('click', onRerunClick);
      els.btnCancelExecute.addEventListener('click', onCancelExecute);
      els.btnSaveBank.addEventListener('click', onSaveBankClick);
      if (els.btnOpenWindow) els.btnOpenWindow.addEventListener('click', onOpenWindowClick);

      if (els.btnDiscardStudioDraft) els.btnDiscardStudioDraft.addEventListener('click', onDiscardStudioDraft);
      els.btnInspectToggle.addEventListener('click', onInspectToggleClick);
      els.btnSaveVersion.addEventListener('click', onSaveVersionManual);
      els.btnCopyHtml.addEventListener('click', onCopyHtml);
      els.btnDownloadHtml.addEventListener('click', onDownloadHtml);
      if (els.studioFileSelect) els.studioFileSelect.addEventListener('change', () => selectProjectFile(els.studioFileSelect.value));
      startProjectKeepAlive();
      els.widthButtons.forEach((b) => b.addEventListener('click', () => onWidthPresetClick(b)));
      els.studioTabsButtons.forEach((b) => {
        b.addEventListener('click', () => onStudioTabClick(b));
        b.addEventListener('keydown', onStudioTabKeydown);
      });
      if (els.btnToggleCode) els.btnToggleCode.addEventListener('click', onToggleCodeClick);
      if (els.btnSplitToggle) els.btnSplitToggle.addEventListener('click', onSplitToggleClick);
      if (els.studioSplitter) {
        els.studioSplitter.addEventListener('pointerdown', onSplitterPointerDown);
        els.studioSplitter.addEventListener('keydown', onSplitterKeydown);
      }
      if (els.studioVresize) {
        els.studioVresize.addEventListener('pointerdown', onVresizePointerDown);
        els.studioVresize.addEventListener('keydown', onVresizeKeydown);
      }

      if (els.previewProjectFrame) els.previewProjectFrame.addEventListener('load', syncProjectInspector);
      els.consoleFilters.forEach((b) => b.addEventListener('click', () => setConsoleFilter(b.dataset.consoleFilter)));
      if (els.btnConsoleClear) els.btnConsoleClear.addEventListener('click', onConsoleClear);
      if (els.btnConsoleCopy) els.btnConsoleCopy.addEventListener('click', onConsoleCopy);
      if (els.btnConsoleFixAll) els.btnConsoleFixAll.addEventListener('click', onConsoleFixAll);
      if (els.btnConsoleToggle) els.btnConsoleToggle.addEventListener('click', toggleConsoleModal);
      if (els.btnConsoleClose) els.btnConsoleClose.addEventListener('click', () => closeConsoleModal(true));
      if (els.consoleSearch) els.consoleSearch.addEventListener('input', () => setConsoleSearch(els.consoleSearch.value));
      if (els.btnConsoleAutoscroll) els.btnConsoleAutoscroll.addEventListener('click', () => setConsoleAutoScroll(!state.consoleModal.autoScroll));
      [els.consoleViewBrowser, els.consoleViewServer].forEach((b) => {
        if (!b) return;
        b.addEventListener('click', () => setConsoleView(b.dataset.consoleView));
        b.addEventListener('keydown', onConsoleViewKeydown);
      });
      if (els.btnServerStop) els.btnServerStop.addEventListener('click', () => projectServerAction('halt'));
      if (els.btnServerStart) els.btnServerStart.addEventListener('click', () => projectServerAction('start'));
      if (els.btnServerRestart) els.btnServerRestart.addEventListener('click', () => projectServerAction('restart'));
      if (els.btnPreviewStart) els.btnPreviewStart.addEventListener('click', () => projectServerAction('start'));
      if (els.consoleModalHeader) els.consoleModalHeader.addEventListener('pointerdown', (ev) => startConsoleDrag(ev, 'move'));
      if (els.consoleResize) {
        els.consoleResize.addEventListener('pointerdown', (ev) => startConsoleDrag(ev, 'resize'));
        els.consoleResize.addEventListener('keydown', onConsoleResizeKeydown);
      }
      if (els.consoleModal) els.consoleModal.addEventListener('keydown', onConsoleModalKeydown);
      document.addEventListener('keydown', (ev) => { if (ev.target === els.btnConsoleToggle) onConsoleModalKeydown(ev); });
      window.addEventListener('resize', () => { if (state.consoleModal.open) applyConsoleRect(); });
      els.btnAiEdit.addEventListener('click', onAiEditClick);
      els.btnCancelAiEdit.addEventListener('click', onCancelAiEdit);
      els.btnAiEditAccept.addEventListener('click', onAiEditAccept);
      els.btnAiEditDiscard.addEventListener('click', onAiEditDiscard);

      // Click-to-code: sólo se acepta el mensaje si viene efectivamente de
      // nuestro propio #preview-frame (namespace "lpa:" + chequeo de
      // event.source), nunca de cualquier ventana que le escriba a esta.
      window.addEventListener('message', (event) => {
        // Previews de proyecto (dev server en otro origen 127.0.0.1:<puerto>):
        // sólo se acepta el mensaje del iframe del proyecto Y de su origen.
        const pjMsg = state.execution && state.execution.project;
        if (pjMsg && els.previewProjectFrame && isTrustedConsoleMessage(event, els.previewProjectFrame.contentWindow, pjMsg.url)) {
          onConsoleMessage(event.data, 'project');
          return;
        }
        if (pjMsg && els.previewProjectFrame && isTrustedInspectMessage(event, els.previewProjectFrame.contentWindow, pjMsg.url)) {
          if (event.data.type === 'lpa:inspector-ready') syncProjectInspector();
          else onProjectInspectResult(event.data);
          return;
        }
        if (!els.previewFrame || event.source !== els.previewFrame.contentWindow) return;
        const data = event.data;
        if (!data || typeof data.type !== 'string' || data.type.indexOf('lpa:') !== 0) return;
        if (data.type === 'lpa:inspect-result') onInspectResult(data.payload);
        else if (data.type === 'lpa:console' && !pjMsg) onConsoleMessage(data, 'html');
      });

      document.addEventListener('keydown', (event) => {
        const isSave = (event.ctrlKey || event.metaKey) && (event.key === 's' || event.key === 'S');
        if (isSave && state.step === 'ejecutor' && state.editor) {
          event.preventDefault();
          onSaveVersionManual();
        }
      });

      // Avisa al salir/recargar si hay ediciones de prompt o de código del
      // Estudio que todavía no se guardaron en ningún lado (Feature 2/4/5).
      window.addEventListener('beforeunload', (event) => {
        if (hasUnsavedPromptEdits() || isStudioDirty()) {
          event.preventDefault();
          event.returnValue = '';
        }
      });
    }

    function hasUnsavedPromptEdits() {
      return Object.keys(state.edits).some((tab) => {
        const entry = state.modelPrompts[tab];
        return entry && state.edits[tab] !== entry.text;
      });
    }

    function init() {
      cacheElements();
      bindEvents();
      initStudioLayout();
      renderChipGroups();
      fillProviderForm(els.genForm, state.provider);
      fillCriticForm();
      renderMediaPrefs();
      renderMediaKeys();
      updateProviderSummary();
      renderMediaLists();
      if (isServerAvailable()) refreshMediaStatusChips(false);
      renderBankView();
      showView('setup');
      // Ganchos de verificación: solo con ?debug en la URL (o en los tests con
      // jsdom), para no exponer el estado interno en el uso normal.
      const debugEnabled = (typeof location !== 'undefined' && /[?&]debug\b/.test(location.search || ''))
        || (typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent || ''));
      if (debugEnabled) window.__lpaDebug = { runLLM, state, testProviderConnection, mediaApi };
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }());
}
