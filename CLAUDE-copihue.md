# CLAUDE.md — Almacén Copihue

## SOBRE MÍ
Soy Victor Alvarez Ojeda, dueño de Almacén Copihue, Bariloche.
NO SOY PROGRAMADOR. Explicame simple, sin jerga.
Si no entendés mi pedido, preguntá antes de asumir.

## REGLA CERO
Antes de tocar código, declarar brevemente:
1. Qué archivo vas a modificar (¿`code.gs`? ¿`multicompra.gs`? ¿qué HTML?)
2. Qué sección exacta
3. Qué NO vas a tocar
4. Si detectás riesgo de romper una Regla de Oro
Esperar mi OK. Después escribir.

## 🛑 REGLA MÁS IMPORTANTE
**NO ROMPER LO QUE YA FUNCIONA.**
PRIMERO PRESERVAR. DESPUÉS MODIFICAR.
NUNCA MODIFICAR POR MODIFICAR.

Una solicitud de cambio NO es autorización para modificar el resto.
Si dudás entre cambiar algo no pedido o conservarlo → CONSERVARLO.

## PRIORIDAD SI HAY CONFLICTO
1. Mi solicitud explícita.
2. Estas Reglas de Oro.
3. Comportamiento funcional existente.
4. Sugerencias o mejoras técnicas de la IA.

Una "mejora técnica" nunca justifica romper una Regla de Oro ni alterar
una función existente que no fue solicitada.

## REGLAS DE ORO
1. `APP_VERSION` entero, +1 por entrega. Nunca v1.2. Cada HTML del
   ecosistema tiene su propia numeración — no comparten versión entre sí.
2. Entregar SIEMPRE 2 archivos idénticos:
   - `[nombre-real].html` (el que se sube a GitHub/Vercel tal cual)
   - `[nombre-real]_v[N]_backup.html` (mismo contenido, para historial)
3. Sin superposición de texto NUNCA.
4. Sin pull-to-refresh (`overscroll-behavior-y: contain`).
5. Nunca salir de la página sin confirmación — atrás de la app, atrás del
   navegador, atrás físico del teléfono, swipe-back, links internos: todos
   pasan por la misma confirmación (`history` + `popstate`).
6. Verde = éxito. Rojo = error. Siempre.
7. La lista principal de productos tiene prioridad de espacio. Contenido
   secundario colapsado por defecto, nunca eliminado.
8. Ediciones del usuario → ícono 💾 mientras hay cambios sin guardar.
9. Autoguardado en localStorage mientras se edita, para no perder trabajo
   si se cierra la pestaña o se corta la conexión. Al reabrir: detectar,
   avisar, dejar recuperar o descartar — nunca pisar en silencio.
10. Un solo botón de refrescar por pantalla — no varios que hagan lo mismo.
11. Mensajes del sistema: centrado > abajo-izquierda > arriba-derecha.
    Nunca tapar información ni controles importantes.
12. Ningún contenedor/modal/panel debe trabar el scroll vertical de la
    página (revisar `overflow`, `height`, `max-height`, `fixed`/`absolute`,
    overlays, scroll anidado).
13. **Nunca usar `confirm()` / `alert()` / `prompt()` nativos del
    navegador para nada importante.** Fallan en silencio en apps instaladas
    en el celular (PWA) y a veces en desktop después de varios diálogos
    seguidos (Chrome los bloquea). Usar siempre un modal propio, mismo
    estilo visual que el resto de la app.
14. Modularizar: `code.gs` no debe seguir creciendo como archivo único.
    Sacar lógica por tema a su propio archivo `.gs` cuando tenga sentido
    (ya en marcha: `multicompra.gs` separado hoy — mismo criterio para lo
    que siga). Beneficio doble: menos riesgo de romper algo no relacionado,
    y cualquier IA necesita leer mucho menos código para tocar un tema
    puntual.
15. No calcular en vivo, en cada carga de página, algo que se puede
    precalcular y cachear (ver v10.18 — rotación y textos de oferta ahora
    van por `CacheService` con trigger de refresco, no en vivo en cada
    `doGet`). Esto crece en gravedad silenciosamente a medida que las
    hojas (Ventas, Historial) se llenan — lo que hoy tarda 1s puede tardar
    8s dentro de unos meses sin que nadie haya tocado el código.

## LOS CIMIENTOS DE COPIHUE

```
CEREBRO (code.gs + archivos satélite)
  multicompra.gs, motorInventario.gs, pedidos_wa.gs,
  Bloque asistente voz.gs, sin_stock.gs, flyer_multicompra.gs
│
├── Lee/escribe
▼
CORAZÓN (planilla "Almacén Copihue - Base de Datos")
  Inventario, Ventas, Historial, FIADOS, Clientes, config_sistema,
  CAJA_MOVIMIENTOS, SALIDAS, EventLog...
│
▼
EXTREMIDADES (HTML — cada una independiente, deploy propio en Vercel)
  Ver lista completa y madura en "INVENTARIO DE EXTREMIDADES" más abajo.

SANGRE (Internet / wifi del local)
  Conecta todo. Si falla, TODO se ve roto aunque el resto esté sano
  (confirmado en carne propia — ver sesión del 13/09/2026).
```

16. **LOS CIMIENTOS PRIMERO:** nunca tocar cerebro (`code.gs` o cualquier
    `.gs` satélite) o corazón (estructura de la planilla) sin backup.
    - Cerebro: copia del `.gs` completo antes de pegar código nuevo.
    - Corazón: copia/respaldo antes de modificar columnas u hojas.
    Si se rompen los cimientos, TODO lo demás se cae con ellos — no hay
    HTML que aguante un `code.gs` roto, porque todos dependen del mismo.

17. **UN CAMBIO EN LOS CIMIENTOS = CONGELAR EXTREMIDADES:** antes de tocar
    cerebro o corazón:
    1. Congelar extremidades (no tocar seba21.html, index.html, etc. en
       paralelo).
    2. Hacer el cambio en los cimientos.
    3. Probar los cimientos SOLOS (pegar la URL del `doGet` directo,
       correr la función desde el editor de Apps Script, mirar Ejecuciones).
    4. Recién ahí descongelar extremidades y probar la app real.
    Tocar todo a la vez es la forma más rápida de no saber qué rompió qué
    (nos pasó hoy: código nuevo + wifi caído al mismo tiempo = horas
    tratando de diferenciar una cosa de la otra).

18. **EL ESTADO DE LOS CIMIENTOS ES EL ESTADO DEL SISTEMA:** antes de
    arrancar cualquier sesión de trabajo, chequear:
    1. ¿Anda el cerebro? → Ejecuciones de Apps Script: ¿responde, y en
       cuánto tiempo?
    2. ¿Late el corazón? → Abrir la planilla: ¿se ven las hojas y los
       datos con normalidad?
    Si los 2 están OK → el sistema está sano, cualquier falla que se vea
    es de otra capa (ver regla 19). Si alguno falla → arreglar cimientos
    primero, no perder tiempo en las extremidades.

19. **ORDEN DE DIAGNÓSTICO cuando "todo se cae de golpe":** de abajo hacia
    arriba, nunca al revés:
    1. Sangre (conexión/wifi — reiniciar router, probar con datos del
       celular).
    2. Cerebro (Ejecuciones de Apps Script — ¿llega y responde?).
    3. Corazón (¿la planilla abre bien, tiene los datos esperados?).
    4. Extremidad (recién acá, mirar el HTML/JS puntual que falla).
    "Se cayeron todas mis apps a la vez" casi nunca es un bug de código
    nuevo en una sola app — apuntar primero a lo compartido (1-2-3).

20. **COPIA VIVA PARA DESCARTAR CÓDIGO (staging):** mantener una copia
    completa del sistema (planilla duplicada + su propio Apps Script + su
    propio deploy en Vercel) donde **no se hacen cambios de prueba** — vive
    congelada, solo se usa para diagnóstico.
    - Si algo falla en producción y la copia viva **también** falla de
      la misma forma → no es el código (nadie tocó nada ahí), es
      infraestructura: wifi, Google, o algo externo. Cortar la búsqueda
      de bugs ahí mismo.
    - Si la copia viva anda bien y solo falla producción → ahí sí es el
      código o un cambio reciente, seguir buscando en producción.
    - Este chequeo va ANTES de gastar horas revisando código (hubiese
      evitado buena parte del diagnóstico del 13/09/2026).

## ARQUITECTURA
Copihue es de un solo local — **no** es multicliente. No hay prefijos,
no hay PIN por cliente, no hay tokens de sesión por usuario externo. El
único "usuario" del sistema son Victor y Seba (operador de mostrador).

Una sola planilla ("Almacén Copihue - Base de Datos") es la fuente única
de verdad. Todas las apps HTML le leen/escriben a través del mismo
`code.gs` (+ archivos satélite del mismo proyecto de Apps Script).

## INVENTARIO DE EXTREMIDADES (confirmado 13/09/2026)

Copihue tiene decenas de archivos `.html` deployados históricamente. La
mayoría son residuos de pruebas. Estas son las **maduras, en uso real,
con historial de bugs reportados y resueltos** — las que importan:

| Archivo | Versión | Para qué |
|---|---|---|
| `seba21.html` | v469 | POS interno — el más activo, el corazón del día a día |
| `sendwa.html` | v117 | Ofertas por WhatsApp |
| `index.html` | — | Catálogo público |
| `copihue-fiado.html` | v33 | Fiados (bug conocido: abono con más de un ticket pendiente) |
| `copihue-reportes.html` | v35 | Reportes de ventas |
| `copihue-ingreso.html` | v20 | Ingreso de mercadería |
| `copihue-finanzas.html` | v22 | Finanzas — sin pendientes conocidos |
| `copihue-flyer.html` | v5.8 | Generador de flyers |
| `copihue-pedidos.html` | v5 | Pedidos a proveedores |
| `copihue-herramientas.html` | — | Panel/dashboard que lista todo el ecosistema |
| `copihue-compras.html` | v2 | Lista de compras |
| `copihue-config-ofertas.html` | v10 | Config de ofertas (bug conocido: horarios desbordados) |
| `copihue-horario.html`, `copihue-fotos.html`, `copihue-publicador.html`, `copihue-dashboard.html` | — | Secundarias, uso menor pero activo |
| `copihue-raspadita.html` | v11 | Juego para clientes |
| `copihue-2x1.html`, `copihue-reposicion.html`, `copihue-flyer-multicompra.html` | v1 | Nuevas — ya nacieron aplicando Reglas de Oro |

### Sospechosos de ser residuos — NO tocar como si fueran "el real" sin confirmar antes conmigo:
- `seba21alma15.html`, `elalmacencopihue.html` — variantes de seba21 con
  cuentas de Google distintas, probablemente copias de prueba de familia.
- `sendwa_v1.html`, `sendwa_v2.html`, `sendwa_v3.html`, `sendwa_a.html`,
  `sendwa_b.html`, `sendwa_c.html`, `sendwav8.html`,
  `sendwadeepseekok.html`, `s_fixed.html`, `z.html`,
  `sendwa_copihue_pro.html` — 11 variantes sueltas sin versión mientras
  el real (`sendwa.html`) ya va por v117.
- `copihue-caratulas.html` — sin relación con el negocio del almacén.

### Extras para clientes — en desarrollo, no son residuo:
- `pacman.html` — juego para clientes en el local (tipo kiosco de espera
  en caja). Plan: sumarle premios reales del almacén, mismo espíritu que
  `copihue-raspadita.html` / `copihue-tragamonedas.html`.

**Antes de asumir que un archivo con nombre parecido es "el real"**, chequear
contra esta tabla o preguntarme.

## STACK
- Frontend: HTML/CSS/JS puro por app, cada una independiente
- Backend: Google Apps Script (multi-archivo: `code.gs` + satélites)
- DB: Google Sheets — planilla única
- Deploy: Vercel desde GitHub `almacen-copihue/almacen-copihue.git`

## NUNCA HAGAS ESTO
- Reorganizar o "modernizar" código que no se pidió tocar.
- Reintroducir código viejo/descartado sin comparar contra por qué se sacó.
- Calcular en vivo en cada carga algo que se puede cachear (regla 15).
- Usar `confirm()`/`alert()` nativo para algo importante (regla 13).
- Crear una implementación nueva de Apps Script por cada prueba — una
  sola implementación activa, se actualiza con "nueva versión".
- Tocar cerebro y extremidades al mismo tiempo (regla 17).
- Asumir que "todo se cayó" es un bug de código antes de chequear wifi y
  Ejecuciones (regla 19).

## FLUJO DE TRABAJO
1. Yo pido en criollo.
2. Vos declarás qué tocás y qué NO (Regla Cero).
3. Yo confirmo.
4. Vos entregás código + backup vNNN, con diff contra el original si el
   cambio es sensible.
5. Yo pruebo.
6. Si falla → volver atrás, no parchear encima.
7. Una cosa por vez, sin excepciones.

## ENTREGA EN DOS VERSIONES — STAGING PRIMERO (desde 13/09/2026)
Para cualquier cambio de código que se vaya a probar antes de ir a
producción:

1. **Versión staging**: mismo cambio, pero con **todas** las constantes
   de URL del backend (`API_URL`, `GAS_URL_FLYER`, y cualquier otra que
   exista — buscar TODAS las que matcheen `_URL` o `script.google.com`,
   no asumir que hay una sola) apuntando a la copia viva. Se le agrega
   además un letrero visible "🚧 MANTENIMIENTO / STAGING" en el frente,
   para que sea imposible confundirla con producción a simple vista.
2. Esa versión se sube al repo de staging (`almacen-copihue-staging`,
   cuenta `victoralvarezojeda`) y se prueba ahí.
3. Una vez confirmado que el cambio funciona bien: se entrega la
   **versión final** — mismo código, URLs apuntando a producción, sin el
   letrero de mantenimiento — recién ahí lista para el repo real
   (`almacen-copihue`, cuenta `javierojedabariloche`).

**Lección del 13/09/2026:** `seba21.html` tenía DOS constantes de URL
distintas apuntando al mismo backend (`API_URL` para todo lo general,
`GAS_URL_FLYER` para la función de Jueves Cervecero) — si solo se
cambia una, esa función queda hablándole a producción por accidente
mientras el resto prueba contra staging. Siempre buscar todas antes de
dar por armada una versión de staging.

## CHANCE LOG — OBLIGATORIO
Registro descriptivo de cada sesión de desarrollo con IA, en su propio
archivo `CHANCE_LOG.md` (no vive dentro de este `CLAUDE.md`, para no
hacerlo crecer sin límite). NO es un changelog técnico de una línea por
cambio — es un registro con contexto y capacidad de recuperación, pensado
para que cualquier IA (o yo mismo dentro de 3 meses) pueda reconstruir
qué pasó, por qué, y cómo deshacerlo si hace falta.

**Cuándo generarlo:** al final de cada sesión de trabajo relevante (no
hace falta para una pregunta suelta de 2 minutos, sí para cualquier
cambio de código, decisión de arquitectura, o diagnóstico largo).

**Estructura obligatoria por sesión:**

```
## SESIÓN N — [quién/qué IA, tema en una frase]

QUÉ: qué se hizo, en una o dos líneas.

POR QUÉ: qué problema motivó el cambio — el síntoma real, no solo "se pidió".

CÓMO: la solución concreta, con suficiente detalle técnico para que otra
IA no tenga que releer todo el código para entenderla.

DÓNDE: archivo(s) y sección/función exacta que se tocó.

PROBLEMA QUE EVITA O RESUELVE: qué se rompe si esto no existe, o qué
bug puntual se corrigió.

SI SE ROMPE: cómo volver atrás — qué backup restaurar, o qué revertir.

PENDIENTE: qué quedó abierto de esta sesión puntual (no es la lista
general del proyecto, solo lo que esta sesión dejó a medio camino).
```

Al cierre de cada día con varias sesiones, agregar además:

```
## PROBLEMAS ABIERTOS AL CIERRE DEL DÍA (fecha)
[lista numerada de todo lo que quedó sin resolver, con el contexto
mínimo para retomarlo sin tener que releer toda la sesión]

## PRÓXIMO PASO (al retomar)
[el primer paso concreto para la próxima sesión, no una lista de deseos]
```

Ver `CHANCE_LOG.md` para el historial completo — ya arranca con una
entrada real (13/09/2026: fix de caché v10.18, separación de
`multicompra.gs`, diagnóstico del apagón por wifi).
