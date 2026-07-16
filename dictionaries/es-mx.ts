import type { Dict } from "./types";

export const esMX: Dict = {
  meta: {
    title: "VIBI — Conserva el video. Borra solo el ruido.",
    description:
      "IA que elimina solo los sonidos que no quieres — en iOS y Android, y dentro de Adobe Premiere Pro. Separa el audio en voz, fondo y pistas por locutor, y luego silencia el viento, al transeúnte, la voz equivocada — la toma que no puedes volver a grabar se conserva.",
  },

  announcement: {
    badge: "Beta",
    message: "Los pagos todavía no están activos — puedes probar VIBI gratis ahorita mismo.",
    feedbackText: "Mándanos una reseña o tu opinión y te regalamos 5 créditos.",
    feedbackLabel: "Enviar opinión",
    feedbackEmail: "jepark2934@gmail.com",
    feedbackSubject: "Opinión sobre VIBI (por 5 créditos de regalo)",
  },
  nav: {
    appStore: "App Store",
    ios: "iPhone",
    premiere: "Premiere Pro",
    why: "Por qué VIBI",
    features: "Funciones",
    scenario: "Cómo funciona",
    workflow: "Flujo de trabajo",
    docs: "Docs",
  },

  hero: {
    eyebrow: "Separación de audio con IA",
    titleLines: ["Conserva el video.", "Borra solo el ruido."],
    body: "Elige cualquier clip y VIBI separa el audio en voz, fondo y pistas por locutor — para que silencies el viento, al transeúnte o la voz equivocada sin tocar nunca la toma que no puedes volver a grabar.",
    chips: ["Voz", "Fondo", "Por locutor"],
    ctaPrimary: "Descárgalo en iOS",
    ctaAndroid: "Avísame cuando salga Android",
    ctaSecondary: "Instala el panel de Premiere Pro",
    caption: "Apps de iOS y Android en revisión — ya disponible en Adobe Premiere Pro 26+",
  },

  apps: {
    eyebrow: "Dos apps, un solo motor",
    title: "Elige dónde trabajas.",
    body: "La misma separación, la misma cuenta, los mismos créditos. Empieza en tu celular donde grabas y termina en Premiere donde editas — tus créditos te acompañan en los dos.",
    items: [
      {
        kind: "ios",
        eyebrow: "VIBI para iPhone y Android",
        badge: "En revisión de la tienda",
        tagline: "El arreglo rápido, donde grabas.",
        body: "Elige un clip y toda la pista se separa. Divídelo en regiones y silencia, baja o ralentiza solo la parte que te molesta — listo en menos de cinco minutos.",
        points: ["Separación de pistas de todo el clip", "Silencia / baja / ralentiza por región", "Agrega BGM o edita por chat"],
        ctaLabel: "Descárgalo en iOS",
        ctaLabelAndroid: "Avísame cuando salga Android",
      },
      {
        kind: "premiere",
        eyebrow: "VIBI para Premiere Pro",
        badge: "Premiere Pro 26+",
        tagline: "El montaje detallado, en tu editor.",
        body: "Lee la transcripción con código de tiempo y por locutor, reasigna locutores y regenera el audio. Ajusta cada pista con un fader de dB y luego mezcla un .wav limpio de vuelta en tu línea de tiempo.",
        points: ["Edición de transcripción por locutor", "Reasigna locutores, regenera", "Mezcla un .wav en tu secuencia"],
        ctaLabel: "Instala el panel de Premiere Pro",
      },
    ],
  },

  waveform: {
    filename: "interview_03.mov",
    title: "Un clip. Silencia solo lo que te molesta.",
    body: "Separa todo el clip en cada locutor y el fondo, luego elige una región y silencia solo el ruido. Las voces nunca se comprimen — la toma que no puedes volver a grabar se conserva.",
    preview: "Vista previa · 0:42",
    tracks: [
      { name: "Voz 1", subtitle: "Voz 1 — conservada" },
      { name: "Voz 2", subtitle: "Voz 2 — conservada" },
      { name: "Fondo", subtitle: "Fondo — silenciado" },
    ],
  },

  why: {
    eyebrow: "Por qué VIBI",
    titleIntro: "Deja de aplastar toda la pista. Borra ",
    titleEm: "solo lo que te molesta",
    titleOutro: ".",
    body: "La mayoría de los editores tratan el sonido como un solo bloque — eliminas el ruido y te llevas la voz con él. VIBI divide cada clip en voz, fondo y pistas por locutor para que silencies solo las partes que no quieres. El mismo motor en iPhone y en Premiere Pro.",
    legacyHeader: "Otras herramientas",
    vibiHeader: "VIBI",
    rows: [
      { label: "Unidad de sonido", legacy: "1 clip = 1 pista mezclada", vibi: "1 clip = voz / fondo / por locutor" },
      { label: "Eliminar ruido", legacy: "Aplasta todo (la voz también)", vibi: "Silencia solo el fondo — la voz intacta" },
      { label: "Cortar un locutor", legacy: "Imposible", vibi: "Elige a uno de dos en una entrevista" },
      { label: "Si el audio se arruina", legacy: "Vuelve a grabar o tira el clip", vibi: "Conserva la toma, borra solo el audio" },
      { label: "Dónde trabajas", legacy: "Atado a un solo flujo", vibi: "iPhone en la locación · Premiere Pro en la computadora" },
    ],
  },

  features: {
    eyebrow: "Funciones",
    title: "Lo que puedes hacer una vez separado.",
    body: "Ediciones por región, BGM, subtítulos, control a nivel de transcripción — cada herramienta se apoya en la misma separación de voz / fondo / por locutor.",
    items: [
      {
        eyebrow: "Ambas apps",
        title: "Separación por locutor de todo el clip",
        body: "Elige un clip y la IA divide toda la pista en voz, fondo y pistas por locutor — la base sobre la que se construye todo lo demás, idéntica en iPhone y en Premiere Pro.",
      },
      {
        eyebrow: "En iPhone",
        title: "Ajusta por región, sobre la marcha",
        body: "Divide el clip separado en regiones y silencia, baja o ralentiza solo la parte que te molesta. Agrega BGM o graba desde el micrófono, luego exporta y comparte — listo en menos de cinco minutos.",
      },
      {
        eyebrow: "En Premiere Pro",
        title: "Edita desde la transcripción",
        body: "Trabaja desde un guion con código de tiempo y por locutor: reasigna locutores, corrige quién dijo qué, regenera el audio, ajusta cada pista con un fader de dB y luego mezcla un .wav limpio de vuelta en tu línea de tiempo.",
      },
    ],
  },

  scenario: {
    eyebrow: "Cómo funciona",
    title: "Clip de entrevista — una voz limpia, la otra fuera.",
    body: "El momento estaba demasiado bueno para repetirlo, pero un transeúnte arruinó el audio. Con VIBI, recuperarlo toma menos de cinco minutos.",
    beforeTitle: "Antes — a la antigüita",
    afterTitle: "Después — VIBI",
    before: [
      "Regresar a la computadora, abrir la laptop",
      "Pasar el clip a la computadora (5–15 min)",
      "Buscar “cómo quitar una voz de un video”",
      "Probar app tras app, tutorial tras tutorial — sigues atorado",
      "Rendirte; volver a grabar o tirar el clip",
    ],
    after: [
      "Elige el clip de tu galería",
      "Separa toda la pista — voz, fondo, por locutor",
      "Arrastra la región donde se coló el transeúnte",
      "Silencia al locutor que no quieres — el tuyo se queda",
      "Suéltale una BGM si hace falta → exporta → comparte",
    ],
  },

  workflow: {
    eyebrow: "Flujo de trabajo",
    title: "Lo que antes pedía un estudio, ahora en dos apps.",
    body: "Ya sea en tu celular en la locación o metido en Premiere en la computadora — el momento no se te escapa.",
    pcLabel: "A la antigüita",
    vibiLabel: "VIBI",
    rows: [
      { step: "Importar el clip", pc: "Cable / iCloud / AirDrop · 5–15 min", vibi: "Desde tu galería en iPhone, o el panel Proyecto en Premiere" },
      { step: "Borrar un ruido", pc: "EQ + multibanda + cortes manuales — y la voz casi siempre muere con ello", vibi: "Separa y luego silencia la pista o región que no quieres" },
      { step: "Vista previa", pc: "Renderizar y luego reproducir", vibi: "Reproduce al instante — en la línea de tiempo o en el panel" },
      { step: "Publicar", pc: "Exportar → enviar → subir", vibi: "Menú de compartir en el celular, o un .wav limpio de vuelta a tu secuencia" },
    ],
  },

  plugin: {
    panelName: "VIBI: AI Sound Eraser",
    panelHost: "Premiere Pro 26+ · panel UXP",
    sources: ["Archivo", "Proyecto", "Línea de tiempo"],
  },

  cta: {
    title: "Dos formas de entrar. Un solo corte limpio.",
    body: "Empieza en tu celular donde grabas y termina en Premiere donde editas — tu cuenta y tus créditos te acompañan en los dos.",
    primary: "Descárgalo en iOS",
    android: "Avísame cuando salga Android",
    secondary: "Instala el panel de Premiere Pro",
    caption: "iOS y Android en revisión · Premiere Pro 26+ · créditos compartidos entre los dos",
  },

  jsonLd: {
    featureList: [
      "Separa voz, instrumental y sonido de fondo de cualquier video con un toque",
      "Activa y ajusta el volumen de cada pista separada",
      "Agrega música de fondo en un rango personalizado",
      "Edita secciones específicas de la línea de tiempo del video",
      "Previsualiza los cambios antes de exportar el video",
    ],
  },

  footer: {
    tagline: "Conserva el video. Borra solo el ruido — en iPhone y en Premiere Pro.",
    productHeading: "Producto",
    productLinks: [
      { label: "VIBI para iPhone y Android", href: "#app-ios" },
      { label: "VIBI para Premiere Pro", href: "#app-premiere" },
      { label: "Funciones", href: "#features" },
      { label: "Cómo funciona", href: "#scenario" },
      { label: "Docs", href: "/docs" },
    ],
    copyright: "© {year} VIBI · Creado por je0ng3",
    poweredBy: {
      prefix: "Con la tecnología de",
      name: "Perso Dubbing",
      href: "https://perso.ai/dubbing",
    },
    githubLinks: [
      { label: "VIBI", href: "https://github.com/je0ng3/vibi" },
      { label: "VIBI-BFF", href: "https://github.com/je0ng3/vibi-bff" },
    ],
    legalLinks: [
      { label: "Privacidad", href: "/privacy" },
      { label: "Términos", href: "/terms" },
    ],
  },
};
