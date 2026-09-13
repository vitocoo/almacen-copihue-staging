# CHANCE LOG — Almacén Copihue

Registro descriptivo de cada sesión de desarrollo con IA.
Formato detallado en `CLAUDE.md` → sección "CHANCE LOG — OBLIGATORIO".

Propósito:
- Permitir reconstruir decisiones y funciones complejas desde cero.
- Documentar errores blindados (nunca más sufrir el mismo problema).
- Dejar contexto para futuras IAs y para mí mismo en 3 meses.

═══════════════════════════════════════════════════
CHANCE LOG — 13/09/2026 — SESIÓN COMPLETA DEL DÍA
═══════════════════════════════════════════════════

## SESIÓN 1 — CLAUDE (fix de caché — code.gs v10.18)

QUÉ: `doGet` dejó de calcular rotación de productos y textos de oferta en
vivo en cada carga. Ahora lee de `CacheService`, refrescado por un trigger
periódico nuevo (`refrescarCacheRotacionYOfertas`).

POR QUÉ: `doGet` tardaba entre 6 y 18 segundos (confirmado en el panel de
Ejecuciones de Apps Script). La causa: `calcularRotacionAuto()` escaneaba
las hojas Ventas e Historial completas en cada carga, más
`getTextoOfertaPersonalizada_()`/`getTextoOfertaSimple_()` reabriendo la
planilla cada una por separado. Con las hojas creciendo día a día, esto
empujó el tiempo de respuesta por encima del timeout del cliente —
"la app no responde" aunque Google mostrara la ejecución como Completada.

CÓMO: se agregaron `_cachePut_`/`_cacheGet_` (helpers genéricos sobre
`CacheService.getScriptCache()`) y `refrescarCacheRotacionYOfertas()`
(function nueva, pensada para correr como trigger de tiempo cada 5-10
min). `doGet` ahora intenta leer del caché primero; si está vacío o
falla, cae al cálculo en vivo de siempre — cero cambio de comportamiento
si el trigger nunca corrió, solo más rápido cuando hay caché disponible.

DÓNDE: `code.gs` — bloque nuevo antes de `calcularRotacionAuto()`, y las
3 líneas de `doGet` que llamaban a `calcularRotacionAuto()` /
`getTextoOfertaPersonalizada_()` / `getTextoOfertaSimple_()`.

PROBLEMA QUE EVITA O RESUELVE: `doGet` lento en todas las apps del
ecosistema (todas dependen del mismo backend) a medida que Ventas/
Historial crecen.

SI SE ROMPE: el fallback a cálculo en vivo es automático — si el trigger
falla o no está agregado, el sistema sigue funcionando exactamente igual
que antes de este cambio, solo sin la mejora de velocidad.

PENDIENTE: agregar el trigger `refrescarCacheRotacionYOfertas` en
Activadores (Apps Script) — sin eso, el fix queda inerte. **Estado al
cierre de la sesión: agregado y confirmado por Victor.**

───────────────────────────────────────────────────

## SESIÓN 2 — CLAUDE (separación de multicompra.gs — v11.0)

QUÉ: toda la lógica de multicompra (validación/blindaje, lectura para la
vidriera de ofertas, lectura completa para auditoría, editor rápido desde
"Ajustar producto") se sacó de `code.gs` a un archivo nuevo,
`multicompra.gs`, dentro del mismo proyecto de Apps Script.

POR QUÉ: `code.gs` tiene 6000+ líneas. Cada vez que hay un pedido sobre
multicompra, revisar/tocar ese archivo entero es lento, caro en tokens
para cualquier IA, y aumenta el riesgo de tocar algo no relacionado.
Sienta precedente para seguir modularizando (Regla de Oro 14).

CÓMO: se extrajeron tal cual (mismo comportamiento, verificado con tests)
`_validarMulticompra_`, `getMulticompraTodas`, y se armaron 3 helpers
nuevos para los bloques que vivían incrustados dentro de funciones más
grandes: `_calcularMulticompraOfertas_(ss)` (extraído de
`calcularOfertas()`), `_resolverColumnasMulticompra_(headerMCList)` +
`_evaluarMulticompraFila_(fila, colsMC, precioBase, nombreProducto)`
(extraídos del loop de productos en `doGet`), y
`_ajustarMulticompraProducto_(sheetInventario, filaProducto, datosInv,
datos)` (extraído de `ajustarProducto()`). `code.gs` ahora llama a estos
helpers en el mismo lugar exacto donde antes estaba el código inline.

DÓNDE: `code.gs` (removido) → `multicompra.gs` (nuevo). Afecta
`calcularOfertas()`, `doGet()`, `ajustarProducto()`.

PROBLEMA QUE EVITA O RESUELVE: `code.gs` gigante y monolítico — primer
paso concreto de modularización real, no solo la intención.

SI SE ROMPE: `codegs_v11.0_backup.txt` y `multicompra_v11.0_backup.txt`
tienen el estado completo verificado de esta sesión.

PENDIENTE: seguir el mismo criterio con la próxima lógica que se preste
a tener su propio archivo (candidatos futuros: fiados, caja/finanzas).

───────────────────────────────────────────────────

## SESIÓN 3 — DIAGNÓSTICO — Apagón del sistema (todas las apps caídas)

QUÉ: horas de diagnóstico de "todas mis apps se cayeron a la vez" —
timeouts, HTTP 404 con cuerpo HTML en vez de JSON, "1 venta sin
sincronizar" trabada. Causa real encontrada al final: **wifi del
local/router**, no código.

POR QUÉ: se sospechó primero del código (blindaje de multicompra
reintroducido, el fix de caché recién hecho, cuota de Apps Script
agotada). Se descartó cada una con evidencia real antes de llegar a la
causa correcta:
  - Historial de versiones de Apps Script: sin código nuevo entre la
    última entrega estable y el apagón → no era una regresión de código.
  - Panel de Ejecuciones: 0.03% de tasa de error en 7 días, ninguna
    ejecución fallida → no era un bug de código ni cuota agotada.
  - `appsscript.json` con `access: ANYONE_ANONYMOUS` → no era un
    problema de permisos de la implementación.
  - Compartiendo internet del celular al PC, todo volvió a andar de
    inmediato → confirmado: era la conexión.

CÓMO: no aplica (no fue un cambio de código) — fue un proceso de
descarte metódico, comparando teorías contra evidencia real (Ejecuciones,
historial de versiones, configuración) en vez de asumir.

DÓNDE: n/a — infraestructura de red, no código.

PROBLEMA QUE EVITA O RESUELVE: de acá salió la Regla de Oro 19 (orden de
diagnóstico: Sangre → Cerebro → Corazón → Extremidad) — la próxima vez
que "todo se caiga de golpe", chequear wifi ANTES de tocar código.

SI SE ROMPE: n/a.

PENDIENTE: ninguno — resuelto (reinicio de router).

───────────────────────────────────────────────────

## SESIÓN 4 — DIAGNÓSTICO — Bug real encontrado en el camino: botón "Cancelar todo"

QUÉ: se identificó (no se corrigió todavía) la causa más probable de que
el botón "✕ Cancelar todo" del banner de ventas pendientes no responda
ni en PC (sin cursor de mano) ni en celular (sin reacción al tocar).

POR QUÉ: Victor reportó que ese botón "se bloquea" y no tiene forma de
cancelar una venta pendiente atascada.

CÓMO (diagnóstico, sin implementar aún): el botón usa `_cancelarVentasPendientes()`,
que depende de `confirm()` nativo del navegador. `confirm()`/`alert()`
son conocidos por fallar en silencio en: apps instaladas en el celular
(modo PWA/pantalla de inicio), y en Chrome de escritorio después de que
la página ya mostró varios diálogos seguidos (el navegador ofrece
bloquearlos). Esto explicaría ambos síntomas reportados a la vez.

DÓNDE: `seba21.html`, función `_cancelarVentasPendientes()` (línea ~7138
en la v477) y el botón del banner `#bannerPendientes`.

PROBLEMA QUE EVITA O RESUELVE: pendiente de arreglar — ver Regla de Oro
13 (nunca usar diálogos nativos del navegador para algo importante).

SI SE ROMPE: n/a (todavía no se tocó código).

PENDIENTE (para la próxima sesión):
1. Reemplazar `confirm()` en `_cancelarVentasPendientes()` por un modal
   propio de la app (mismo estilo visual que el resto).
2. Cambiar el intervalo de reintento de `_reenviarVentasPendientes()` de
   60 segundos a 10 minutos.
3. Sacar el corte de las 22hs — que siga reintentando aunque el local
   esté cerrado, no que se rinda hasta la próxima apertura del POS.
4. Mensaje específico por venta pendiente (ej. "Venta de las 21:43,
   5 ítems, no se pudo sincronizar") en vez de un contador genérico.
5. (Más grande, evaluar aparte) EventLog con stock antes/después por
   producto vendido, para detectar automáticamente cuándo una venta no
   descontó stock.

---

## PROBLEMAS ABIERTOS AL CIERRE DEL DÍA (13/09/2026)

1. **Botón "Cancelar todo" no funciona** — diagnóstico listo (ver Sesión
   4), implementación pendiente.
2. **Intervalo de reintento de ventas pendientes** — cambiar 60s → 10min,
   sacar corte de las 22hs. Pendiente de implementar.
3. **EventLog con stock antes/después** — diseño conversado (registrar
   toda acción relevante en una hoja nueva "EventLog"), no implementado
   todavía. Quedó pausado por el apagón de wifi.
4. **Multicompra en producción** — `multicompra.gs` probado
   (`getMulticompraTodas()` corrió sin error desde el editor) pero
   *todavía no se hizo* Implementar → Nueva versión. Sigue en el editor,
   no en producción, al cierre de la sesión.
5. **Numeración de Reglas de Oro desincronizada entre documentos**
   (proyecto VAO, no Copihue): `PROMPT_MAESTRO.md` y `CLAUDE.md` de VAO
   tienen numeraciones distintas para reglas parcialmente superpuestas —
   no es un problema de Copihue pero quedó anotado.
6. **Inventario de extremidades sin limpiar** — confirmado cuáles son
   residuos probables (`sendwa_v1/v2/v3`, `sendwa_a/b/c`, `sendwav8`,
   `sendwadeepseekok`, `s_fixed`, `z`, `sendwa_copihue_pro`,
   `seba21alma15`, `elalmacencopihue`, `copihue-caratulas`) — no se
   borraron todavía de Vercel/GitHub, solo documentados en `CLAUDE.md`.

## PRÓXIMO PASO (al retomar)

**PASO 1 — Implementar multicompra.gs en producción**
Ya está probado. Solo falta: Implementar → Administrar implementaciones
→ Nueva versión.

**PASO 2 — Arreglar el botón "Cancelar todo" + ajustes de reintento**
Ver los 4 puntos concretos de la Sesión 4. Es la función más sensible
del sistema (maneja ventas/stock reales) — hacerlo con cuidado quirúrgico,
un cambio por vez, con diff contra el original.

Al terminar cualquiera de los dos: agregar la entrada correspondiente acá.

═══════════════════════════════════════════════════
FIN DE LA SESIÓN — 13/09/2026
═══════════════════════════════════════════════════
