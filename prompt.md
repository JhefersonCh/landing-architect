# 🧬 Prompt Maestro — Landing Page Prompt Architect

## 🎭 Role

Eres un **Senior Frontend Engineer + Product Architect + UX/UI Designer + Prompt Engineer especializado en generación de Landing Pages con IA**.

Diseñas herramientas donde cada decisión tiene una función clara. Piensas primero en la arquitectura de la experiencia, después en la interfaz y finalmente en la implementación.

Tu objetivo no es producir una aplicación que simplemente "se vea moderna".

Tu objetivo es construir una herramienta que permita transformar:

**contexto de negocio → decisiones de diseño → prompt → ejecución → Landing Page**

La propia especificación que estás ejecutando debe aplicar intrínsecamente las Técnicas 1, 2, 6 y 7.

---

# 🎯 TAREA

Diseña y construye **Landing Page Prompt Architect**, una aplicación web en:

* HTML
* CSS
* JavaScript Vanilla

La aplicación debe permitir:

1. Introducir un tema y los datos fundamentales del proyecto.
2. Seleccionar uno o varios **verticales de negocio**.
3. Seleccionar una o varias **tecnologías de implementación**.
4. Generar un prompt especializado para cada tecnología seleccionada.
5. Generar un prompt combinado cuando existan dos o más tecnologías.
6. Ejecutar un prompt y mostrar el resultado de la Landing Page.
7. Guardar las mejores Landing Pages.
8. Mantener junto a cada Landing Page el prompt exacto que la generó.

La aplicación debe funcionar como un **estudio de ingeniería de prompts para Landing Pages**, no como un simple generador de texto.

---

# 🇪🇸 IDIOMA

Toda la aplicación debe quedar en **español**.

Esto incluye:

* textos de la interfaz: títulos, etiquetas, placeholders, botones y CTAs;
* mensajes de estado, validación, error y confirmación;
* textos de accesibilidad: `aria-label`, `alt`, `title`;
* el atributo `lang="es"` en `index.html` e `iframe.html`;
* los prompts generados, incluidos los encabezados de la plantilla (ROLE → ROL, CONTEXT → CONTEXTO, etc.);
* el copy de las Landing Pages generadas, salvo que el usuario indique otro idioma;
* fechas y números con formato local (`es`).

Los identificadores de código (funciones, variables, claves de estado) pueden mantenerse en inglés.

No mezcles idiomas en la interfaz.

---

# 🌍 CONTEXTO

El usuario es un creador, emprendedor o diseñador que quiere generar Landing Pages con IA, pero rechaza los resultados genéricos y repetitivos producidos por modelos generativos.

La herramienta debe resolver cuatro problemas:

### Problema 1 — Especificidad

El usuario normalmente proporciona información superficial y recibe diseños superficiales.

### Problema 2 — Repetición

El mismo contexto suele producir estructuras visuales muy parecidas entre ejecuciones.

### Problema 3 — Sobrecarga

La IA tiende a añadir elementos que hacen que la Landing Page parezca más completa aunque no aporten valor.

### Problema 4 — Huella de IA

Los resultados pueden contener patrones visuales y textuales fácilmente reconocibles como generación automática.

La aplicación debe atacar explícitamente estos cuatro problemas.

---

# 🧪 TÉCNICA 1 — STRING SEED OF THOUGHT (SSoT)

Antes de tomar decisiones creativas, visuales o estocásticas, **aplica SSoT internamente**.

El mecanismo obligatorio es:

1. Genera internamente una cadena aleatoria compleja.
2. Utiliza esa cadena como semilla.
3. Manipula la cadena para guiar decisiones entre alternativas válidas.
4. Usa esas decisiones para construir la solución final.
5. Produce una única solución coherente.

No utilices SSoT como una etiqueta estética.

No sustituyas SSoT por una referencia visual, una paleta predeterminada o una cadena semántica.

El propósito de SSoT es introducir diversidad controlada en tareas donde existen múltiples soluciones válidas. Sakana describe precisamente el mecanismo como "generar una cadena aleatoria → manipularla → utilizarla para guiar decisiones", y muestra su aplicación tanto para decisiones probabilísticas como para generación diversa.

### Aplicación en la propia aplicación

Cuando diseñes la interfaz de **Landing Page Prompt Architect**, utiliza SSoT para tomar decisiones creativas entre alternativas previamente válidas.

Por ejemplo, puede decidir internamente entre:

* composición editorial o modular,
* navegación horizontal o vertical,
* densidad informativa baja o media,
* contraste alto o moderado,
* estructura hero centrada o asimétrica,
* tratamiento tipográfico A/B/C.

Estas alternativas deben estar limitadas por los requisitos funcionales.

**SSoT nunca puede romper requisitos obligatorios.**

Debe introducir variedad dentro del espacio de soluciones válidas.

### Aplicación en los prompts generados

La misma técnica debe formar parte de cada prompt generado.

Cada prompt debe instruir al modelo ejecutor a:

1. generar internamente una cadena aleatoria;
2. utilizarla como semilla;
3. manipularla para tomar decisiones creativas;
4. usar esas decisiones para construir una solución única;
5. mantener intactos el objetivo, contexto, accesibilidad, requisitos técnicos y restricciones.

Una ejecución diferente del mismo prompt debe poder producir una dirección creativa diferente sin convertirse en una solución incoherente.

### Importante

No expongas la cadena aleatoria ni el razonamiento interno en el resultado final salvo que el usuario solicite explícitamente una explicación del proceso.

No conviertas SSoT en:

```text
random_string → ASCII → mod → configuración fija
```

como requisito universal.

La manipulación de la cadena puede utilizar estrategias como `sum-mod`, hashing u otras transformaciones adecuadas al espacio de decisiones. Estas son estrategias posibles observadas en SSoT, no una única implementación obligatoria.

---

# 🔥 TÉCNICA 2 — PROMPT AMBICIOSO

La aplicación no debe generar prompts anémicos.

No aceptes:

> "Crea una landing moderna para una fintech."

Cada prompt debe construir una especificación rica alrededor del problema real.

Debe considerar, cuando la información esté disponible:

### Usuario

* quién es,
* nivel de conocimiento,
* contexto,
* expectativas,
* frustraciones.

### Mercado

* nivel de sofisticación,
* patrones visuales predominantes,
* nivel de competencia,
* convenciones que conviene romper.

### Psicología

* motivaciones,
* objeciones,
* sesgos cognitivos pertinentes,
* respuesta emocional deseada.

### Conversión

* objetivo principal,
* fricción que debe eliminarse,
* microconversiones,
* CTA,
* momento adecuado para cada CTA.

### Arquitectura

Para cada sección importante define:

* objetivo,
* información,
* función psicológica,
* copy,
* elemento visual,
* CTA,
* relación con la siguiente sección.

### Implementación

Define las restricciones técnicas necesarias para la tecnología seleccionada.

La profundidad debe estar al servicio de la decisión, no del volumen.

El prompt debe ser suficientemente específico para evitar que el modelo ejecutor tenga que inventar decisiones fundamentales. La guía de referencia plantea precisamente esta transición desde una descripción estética superficial hacia psicología, sofisticación del mercado, sesgos cognitivos, microcopy, fricción y restricciones técnicas.

---

# ✂️ TÉCNICA 6 — DISEÑO SUSTRACTIVO

Aplica diseño sustractivo tanto a la **aplicación** como a los **prompts generados**.

Cada elemento debe justificar su existencia.

Antes de añadir cualquier componente pregunta:

> ¿Ayuda a comprender, navegar, confiar, decidir, crear, ejecutar o convertir?

Si no aporta una función clara, elimínalo.

La interfaz debe reducir:

* navegación innecesaria,
* acciones duplicadas,
* campos irrelevantes,
* información repetida,
* decoración sin función,
* animaciones sin propósito,
* paneles que no aportan información nueva,
* estados innecesarios.

La Landing Page generada debe aplicar exactamente el mismo criterio.

### Regla operativa

No añadas elementos para llenar espacio.

No añadas secciones porque sean habituales.

No añadas componentes porque hagan que una interfaz "parezca más completa".

La guía define esta técnica precisamente como la auditoría y eliminación de componentes que no contribuyen a la comprensión o conversión.

---

# 🚫 TÉCNICA 7 — RESTRICCIONES NEGATIVAS

Aplica restricciones negativas tanto a la herramienta como a los prompts generados.

Estas restricciones deben evitar patrones que hagan que el resultado parezca artificial, genérico o excesivamente producido por IA.

### Restricciones de copy

Evita, salvo que el contexto realmente las exija:

* revolucionario
* potenciar
* ecosistema
* innovador
* soluciones integrales
* desbloquear
* sinergia
* seamless
* robusto
* transformador
* siguiente nivel

No sustituyas estas palabras simplemente por sinónimos igualmente vacíos.

El copy debe ser concreto.

### Restricciones visuales

Evita como soluciones predeterminadas:

* degradados púrpuras genéricos,
* Bento Grid,
* glassmorphism ornamental,
* tarjetas en exceso,
* card-in-card,
* sombras flotantes innecesarias,
* bordes redondeados aplicados indiscriminadamente,
* layouts repetitivos,
* imágenes de stock genéricas.

### Restricciones estructurales

Evita:

* navegación innecesariamente compleja,
* carruseles,
* sliders cuando no sean esenciales,
* múltiples CTAs compitiendo por protagonismo,
* secciones redundantes,
* formularios innecesariamente largos.

### Restricciones de autenticidad

Evita:

* copy corporativo vacío,
* imágenes artificialmente perfectas,
* personas con apariencia excesivamente sintética,
* composiciones visuales que parezcan una plantilla automática.

Estas restricciones deben adaptarse al proyecto y no deben copiarse mecánicamente en todos los prompts. La referencia plantea precisamente las restricciones negativas como mecanismo para eliminar rasgos que delatan la generación artificial.

---

# 🧭 MODELO DE DATOS DEL PROYECTO

No mezcles conceptos diferentes.

La aplicación debe distinguir entre:

### Datos del proyecto

* tema,
* producto,
* público,
* oferta,
* objetivo,
* tono,
* competidores.

### Verticales

Ejemplos:

* E-commerce
* SaaS
* Educación
* Salud
* Fintech
* Inmobiliaria

### Tecnologías

Ejemplos:

* HTML
* CSS
* JavaScript
* React
* Vue
* Next.js
* Tailwind CSS
* Bootstrap

Un vertical representa **el contexto de negocio**.

Una tecnología representa **la forma de implementación**.

Ambos deben influir en el prompt final de manera diferente.

---

# 🧩 FLUJO PRINCIPAL

La aplicación debe reducir el recorrido a cinco momentos:

## 1. Setup

Capturar el contexto fundamental.

Campos obligatorios mínimos:

* Tema
* Público objetivo
* Oferta
* Objetivo
* Competidores

Campos opcionales:

* tono,
* referencias visuales,
* propuesta de valor,
* restricciones adicionales.

CTA:

**Continuar**

---

## 2. Contexto y tecnologías

Seleccionar:

* uno o varios verticales,
* una o varias tecnologías.

La selección múltiple debe ser clara.

CTA:

**Generar Prompt**

---

## 3. Generador

Mostrar:

* prompt individual por tecnología,
* prompt combinado cuando haya dos o más tecnologías,
* estructura del prompt,
* restricciones,
* dirección creativa,
* mecanismo SSoT.

Permitir:

* editar,
* copiar,
* regenerar,
* ejecutar.

CTA dominante:


NOTA IMPORTANTE: LOS PROMPTS GENERADOS DEBEN USAR LAS MISMAS TECNICAS DE SSoT QUE ESTAN EN EL ARCHIVO PROMPT.MD

**Ejecutar Prompt**

---

## 4. Ejecutor

Enviar el prompt al proveedor configurado.

Mostrar el resultado en un `iframe` seguro.

Permitir:

* visualizar,
* regenerar,
* guardar.

CTA dominante:

**Guardar en Banco**

---

## 5. Banco

Mostrar:

* miniatura,
* proyecto,
* vertical,
* tecnologías,
* fecha,
* prompt asociado.

Permitir:

* abrir,
* ejecutar nuevamente,
* copiar prompt,
* duplicar,
* eliminar.

---

# 🖥️ IMPLEMENTACIÓN

Entrega:

```text
/index.html
/styles.css
/app.js
/iframe.html
```

### `index.html`

Contiene la aplicación y sus vistas principales.

### `styles.css`

Contiene:

* variables,
* diseño responsive,
* componentes,
* estados,
* accesibilidad.

### `app.js`

Contiene:

* estado,
* generación de prompts,
* lógica SSoT,
* selección de verticales,
* selección de tecnologías,
* combinación,
* ejecución,
* almacenamiento,
* renderizado del banco.

### `iframe.html`

Utilízalo como superficie de preview aislada.

El código generado no debe ejecutarse directamente dentro del contexto principal de la aplicación.

---

# ⚙️ LÓGICA PRINCIPAL

Implementa como mínimo:

```javascript
generatePrompt(project, verticals, technologies)
buildTechnologyPrompt(...)
combineTechnologyPrompts(...)
runPrompt(...)
saveLanding(...)
renderBank(...)
```

SSoT debe formar parte del mecanismo de generación del prompt.

No crees una función `generateSeed()` que simplemente fabrique una semilla y luego trate esa cadena como una configuración estética fija.

La finalidad es que la semilla guíe decisiones estocásticas de generación.

---

# 🤖 PLANTILLA DEL PROMPT GENERADO

Cada prompt producido por la aplicación debe seguir conceptualmente esta estructura:

```text
ROLE

CONTEXT

USER / AUDIENCE

BUSINESS OBJECTIVE

CONVERSION OBJECTIVE

PSYCHOLOGY

MARKET CONTEXT

VISUAL DIRECTION

SSoT DIVERSITY MECHANISM

PAGE ARCHITECTURE

COPY / MICROCOPY

TECHNICAL REQUIREMENTS

SUBTRACTIVE DESIGN

NEGATIVE CONSTRAINTS

QUALITY CRITERIA

FINAL OUTPUT
```

El bloque `SSoT DIVERSITY MECHANISM` debe instruir al modelo ejecutor a generar internamente una cadena aleatoria y manipularla para guiar las decisiones creativas.

No debe convertirse en una lista de opciones que el modelo simplemente escoja de forma arbitraria.

---

# 🔗 PROMPT COMBINADO

Cuando el usuario seleccione dos o más tecnologías:

1. conserva las restricciones individuales de cada tecnología;
2. identifica conflictos;
3. resuelve las incompatibilidades;
4. produce una única arquitectura técnica coherente;
5. genera un único prompt combinado.

No concatenes dos prompts completos.

El resultado debe ser una integración.

---

# 🧪 EJEMPLO

Entrada:

```text
Tema:
Relojería de lujo

Vertical:
E-commerce

Tecnologías:
HTML + CSS + JavaScript

Público:
Compradores interesados en relojes artesanales de edición limitada

Objetivo:
Reservar una pieza

Competidores:
Marcas de relojería de lujo tradicionales
```

El prompt generado debe:

* comprender el mercado de lujo;
* identificar la motivación asociada a exclusividad;
* considerar la objeción de precio;
* definir una arquitectura de conversión;
* aplicar SSoT para introducir una dirección creativa diversa;
* eliminar componentes que distraigan del producto;
* establecer restricciones negativas específicas;
* adaptar la implementación a HTML/CSS/JS.

---

# 🧪 EJEMPLO COMBINADO

Entrada:

```text
Verticales:
E-commerce + Fintech

Tecnologías:
HTML + CSS + JavaScript
```

El sistema no debe producir:

```text
Prompt E-commerce

+

Prompt Fintech
```

Debe sintetizar:

```text
Contexto comercial
+
Confianza financiera
+
Objetivo de conversión
+
Dirección creativa derivada mediante SSoT
+
Arquitectura única
+
Restricciones técnicas coherentes
```

La salida debe ser un único prompt.

---

# 📤 FORMATO DE SALIDA DE TU RESPUESTA

Entrega la implementación siguiendo esta estructura:

```text
# LANDING PAGE PROMPT ARCHITECT

## 0. Decisiones de arquitectura

## 1. Arquitectura de archivos

## 2. Estructura de interfaz

## 3. Sistema de generación de prompts

## 4. Implementación SSoT

## 5. Plantilla de prompt generado

## 6. Ejemplo de ejecución

## 7. Auditoría sustractiva

## 8. Restricciones negativas

## 9. Criterios de aceptación

## 10. Código
```

La auditoría sustractiva debe identificar elementos descartados y explicar por qué no eran necesarios.

---

# ✅ CRITERIOS DE ACEPTACIÓN

La implementación solo es válida si:

### SSoT

* El propio proceso de generación utiliza la mecánica de String Seed of Thought.
* La cadena aleatoria guía decisiones estocásticas.
* Diferentes semillas pueden producir diferentes soluciones.
* Las restricciones obligatorias permanecen constantes.
* SSoT no se reduce a una paleta o configuración determinista.

### Prompt Ambicioso

Cada prompt generado debe contextualizar:

* usuario,
* problema,
* objetivo,
* psicología,
* mercado,
* conversión,
* arquitectura,
* microcopy,
* restricciones técnicas.

### Diseño Sustractivo

Debe existir evidencia de que se eliminaron elementos innecesarios tanto de la aplicación como de los prompts.

### Restricciones Negativas

Cada prompt debe contener restricciones relevantes y específicas para su contexto.

### Funcionalidad

Debe ser posible:

**crear → generar → revisar → ejecutar → visualizar → guardar → volver a ejecutar.**

### Calidad

Si una decisión no contribuye al objetivo del producto, elimínala.

Si un prompt podría utilizarse prácticamente sin cambios para otro negocio, es demasiado genérico.

Si dos ejecuciones de un mismo contexto siempre terminan en la misma dirección creativa, revisa la implementación de SSoT.

---

# PRINCIPIO FINAL

No construyas una herramienta que simplemente tenga cuatro secciones llamadas:

* SSoT
* Ambición
* Diseño sustractivo
* Restricciones negativas

Construye una herramienta donde esas técnicas sean **mecanismos que producen el resultado**.

La aplicación debe demostrar las técnicas mediante su comportamiento.

Los prompts generados deben demostrar las mismas técnicas mediante sus instrucciones.

La relación debe ser:

**Técnicas → comportamiento de la aplicación → generación del prompt → comportamiento del modelo → Landing Page final.**

No expliques las técnicas como teoría cuando puedas convertirlas directamente en una regla operativa.
