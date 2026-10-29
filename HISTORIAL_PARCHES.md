# Historial de parches — Ecosistema Copihue

Cómo se usa: en cada entrega se agrega una fila arriba de la tabla, con versión, fecha, qué cambió y dónde está.
STAGING recibe cada parche primero. PRODUCCIÓN solo recibe lo probado y aprobado.
Cada archivo tiene su propia numeración. Los respaldos de la versión anterior están en las carpetas RESPALDO.

## Estado actual (27/10/2026)

| Archivo | STAGING | PRODUCCIÓN |
|---|---|---|
| seba21 (POS) | v541 | v537 |
| copihue-ingreso | v28 | v28 |
| copihue-fiado | v43 | v41 |
| copihue-reportes | ver.36 | ver.36 |
| code.gs (Apps Script) | v11.0 en uso | sin cambios en esta tanda |

## seba21.html / seba21-staging.html

| Versión | Fecha | Qué cambió | STAGING | PRODUCCIÓN |
|---|---|---|---|---|
| v541 | 29/10 | El botón "Enviar ticket al cliente" queda deshabilitado con el avance ("Aplicando abono a la deuda: 2 de 4…") hasta que terminan los abonos del vuelto. Los fiados viejos sin N° de ticket salen como "Compra del DD/MM/AAAA" en el detalle. La línea gris pasó de "DIAG v539" a "Progreso". | sí (simulador 26/26; celular pendiente) | no |
| v540 | 27/10 | Mensaje de WhatsApp del vuelto aplicado a deuda: Ticket, Fecha, Hora, Deuda anterior, Abono (vuelto), Deuda actualizada y detalle por ticket. El N° de ticket se busca por idVenta si vender da timeout; si no se encuentra, la línea se omite. La venta mixta con fiado también lleva Ticket/Fecha/Hora con etiqueta. La venta normal también muestra el N° de ticket si vender lo devuelve. | sí (simulador 24/24; celular pendiente) | no |
| v539 | 27/10 | Contador de avance al aplicar el vuelto ("X de N fiados listos") y línea de tiempos. | sí | no |
| v538 | 27/10 | Vuelto aplicado a deuda: abonos al fiado más viejo primero, el resto en efectivo, con idOperacion (no duplica). | sí | no |
| v537 | 27/10 | Arreglo: la venta mixta después de cerrar la pantalla de cobro se cobraba como EFECTIVO por el total y el fiado no se creaba. El botón volvía a apuntar a confirmarVenta y salteaba _confirmarCobroDispatch. Cambio en cerrarConfirm() y en el cierre del fiado. | sí | sí (27/10) |
| v536 | 27/10 | El N° de ticket del fiado de una venta mixta se completa en segundo plano (hasta ~63 s), aunque vender dé timeout. No demora el ticket al cliente. | sí | sí, dentro de v537 |
| v535 | 27/10 | Línea gris de diagnóstico, temporal, para ver por qué el ticket del fiado quedaba vacío. Mostró que vender daba timeout a los 25 s. | sí | no (quitada) |
| v534 | 27/10 | Fiado del mixto con descripción de productos (antes "TICKET COMPLETO"); ticket completado si vender no lo devuelve; scroll automático al botón "Enviar ticket"; el mensaje de deuda dice "N compras pendientes" en vez de listar tickets. | sí | sí, dentro de v537 |
| v533 | 26/10 | El ticket de WhatsApp de una venta mixta con fiado incluye el estado de la deuda (deuda anterior, fiado de esta compra, total pendiente). Si no se puede confirmar la deuda, sale sin ese bloque y avisa. | sí | sí, dentro de v537 |
| v532 | 26/10 | Con el pago mixto abierto, los métodos normales quedan deshabilitados y el cobro nunca vuelve al camino normal. Botón renombrado: "PAGO MIXTO • ABONO + FIADO + $CL + $US ETC". | sí | sí, dentro de v537 |
| v531 | 26/10 | El fiado de una venta mixta ya no se pierde en silencio si la planilla responde success:false: queda en pendientes y reintenta sin duplicar. | sí | sí, dentro de v537 |
| v530 | 26/10 | Listas del catálogo, ingreso y fotos: productos con stock primero. | sí | sí (26/10) |
| v529 | 26/10 | Lista de resultados del ingreso más alta (max-height 300 px). | sí | sí, dentro de v530 |
| v528 | 26/10 | Cotización por WhatsApp (imagen para compartir). | sí | sí, dentro de v530 |
| v527 | — | Búsqueda por palabras. | sí | sí, dentro de v530 |
| v526 | — | Aviso de stock para productos por kg. | sí | sí, dentro de v530 |
| v525 | — | Botones del Resumen. | sí | sí, dentro de v530 |
| v524 | — | Decimales en kg. | sí | sí, dentro de v530 |
| v523 | — | Limpieza del pago mixto después de cobrar. | sí | sí, dentro de v530 |
| v522 | — | Tarjetas del pago mixto. | sí | sí, dentro de v530 |
| v521 y anteriores | — | Ver los respaldos seba21-v518, v519, v521 y v521b en PRODUCCION/RESPALDO. | — | — |

## Otros archivos

| Archivo | Versión | Qué cambió | Dónde |
|---|---|---|---|
| copihue-fiado.html | v43 | (v43: los fiados sin N° de ticket salen como "Compra del DD/MM/AAAA" en vez del código f_…; respaldo copihue-fiado-v42. Simulador 7/7.) v42: Los tres recibos de WhatsApp (abono a un fiado, pago repartido, cobro total) muestran Fecha, Hora, Cliente, Deuda anterior, Abono y Deuda actualizada, más el detalle por ticket. Importes y registros no se tocan. Respaldo: copihue-fiado-v41. Simulador 6/6; celular pendiente. | solo STAGING |
| copihue-ingreso.html | v28 | Lista de resultados más alta y stock primero (pasó a PROD junto con seba21 v530). Respaldo: copihue-ingreso-v27. | STAGING y PROD |

## Respaldos disponibles

- STAGING/RESPALDO: seba21-staging-v521 a v540; copihue-fiado v41 y v42 (cada uno es el estado justo antes del cambio siguiente).
- PRODUCCION/RESPALDO: seba21-v518, v519, v521, v521b y v530; copihue-ingreso-v27; copihue-fiado v37 y v39; copihue-reportes ver35; copihue-retiros-de-caja v1 a v3.

## Pendientes y problemas conocidos

- vender tarda ~28 s en las ventas mixtas de STAGING (Ejecuciones 29/10: 28,49 s y 27,62 s) y el POS corta a los 25 s. Falta ver por qué tarda y comparar con PRODUCCIÓN.
- Ventas mixtas en PRODUCCIÓN anteriores a v537: pueden haber quedado como EFECTIVO por el total, con el fiado sin crear. Falta revisar la hoja Ventas.
- Fiados de ventas mixtas hechas antes de v534 (por ejemplo f_1792821891526_f8bmp, f_1793064886040_xr620, f_1793065782118_dzgyl): quedaron sin ticket y con "TICKET COMPLETO". No se modificaron.
- Ventas de prueba en STAGING del 27/10 00:52 ($9.500) y 00:55 ($7.900): quedaron como EFECTIVO por el error de v536 y anteriores. No se modificaron.
- v538–v541 y copihue-fiado v43 esperan prueba en el celular y OK para pasar a PRODUCCIÓN.
- Manual Ofertas, columnas E:G: algo las vuelve a escribir hasta la fila 764 en STAGING. Queda pendiente, es un problema visual.
- getMulticompraTodas está definida dos veces en flyer_multicompra.gs. Queda ofrecido neutralizar la vieja en STAGING.
- Prueba en el celular pendiente: cotización por WhatsApp con "Compartir".
