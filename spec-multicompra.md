# Especificación — Multicompra (visual y cálculo)

Definido con Victor el 14/09/2026. Esta es la fuente de verdad — si una
IA futura va a tocar multicompra, leer esto primero. No modificar sin
confirmar con Victor.

## Badge según estado

| Estado | Texto del badge |
|---|---|
| Multicompra configurada, todavía no activa | `MULTICOMPRA` |
| Activa, mismo producto (sin combinar con otros) | El pack real: ej. `2x $10.000` |
| Activa, combinando variantes/sabores distintos | `🔀 Combinable` |

## Cálculo — mismo producto (sin combinar)

`ciclos = floor(qty / AT)`, `resto = qty % AT` (AT = cantidad del pack, ej. 2).

- Los `ciclos` completos pagan el precio de pack (`AU`).
- El `resto` paga precio normal, **sin descuento, sin badge de oferta**.
- Ejemplo con AT=2, AU=$10.000, precio normal=$5.500:
  - qty=1 → sin descuento (nunca llega a 2).
  - qty=2 → 1 pack de $10.000. Ahorro: $1.000.
  - qty=3 → 1 pack de $10.000 + 1 unidad normal a $5.500. Ahorro: $1.000
    (NO $1.500 — la unidad suelta no descuenta).
  - qty=4 → 2 packs de $10.000. Ahorro: $2.000.

## Cálculo y visual — variantes distintas combinadas ("Combinable")

Las líneas del mismo grupo (distintos sabores/variantes) se muestran
**en UNA sola tarjeta**, no en líneas separadas. La tarjeta contiene:

1. Badge `🔀 Combinable {AT}x ${AU}`.
2. Un renglón por variante: nombre + cantidad + precio normal por
   unidad (ej. `Cola x1 — $5.500 c/u`).
3. Precio normal total del grupo, tachado.
4. Ahorro total del grupo, en verde.

El ahorro total sigue calculándose sobre la **cantidad combinada real**
de todas las variantes (`ciclos = floor(qtyTotal / AT)` sobre la suma) —
esto mantiene el beneficio real de combinar sabores. Ejemplo: Cola x1 +
Limón x2 + Pomelo x3 = 6 unidades → 3 pares completos → ahorro real
$3.000 (no se reparte proporcionalmente entre líneas, se muestra
agrupado como corresponde a la mecánica real de la promo).

## Precio normal de referencia

Mostrar el precio normal por unidad junto al detalle de la oferta
activa (antes o al lado de la cantidad), para que el vendedor y el
cliente tengan la referencia sin calcular mentalmente.

## Dónde aplica

Lista de productos, carrito (panel lateral + modal "Confirmar venta"),
y ticket — mismo criterio en los tres lugares, misma fuente de cálculo.

**Pendiente aparte:** revisar si `index.html` (catálogo público) cumple
este mismo criterio — no se tocó en esta sesión, queda anotado para
después.
