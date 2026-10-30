# Claves del POS — Etapa 1 (SOLO STAGING)

## Qué se sube
1. GitHub STAGING: `seba21-staging.html` (v542). Respaldo: `seba21-staging-v541-RESPALDO.html`.
2. Apps Script de STAGING:
   a) Archivo nuevo `seguridad.gs` (+ → Script → nombre `seguridad` → pegar todo).
   b) UNA sola inserción en `doGet`, justo debajo del bloque de `ping`:

```
    if (e && e.parameter && e.parameter.action === 'seguridad') {
      return respuestaJSON(seguridadAccion_(e.parameter.data));
    }
```
   c) Implementar → Administrar implementaciones → Editar → Nueva versión → Implementar (misma URL).

## Cargar las claves (lo hacés VOS, no se mandan por chat)
1. En `seguridad.gs`, dentro de `cargarPins()`, sacá el `//` de cada línea y poné el PIN de 6 dígitos de cada persona
   (los 4: Víctor, Sebastián, Nali y Alma).
2. Arriba elegí `cargarPins` → ▶ Ejecutar (aceptar permisos la primera vez).
3. **Borrá los PIN del archivo** (volvé a poner `//` y `'000000'`) y guardá. Quedan solo cifrados.
4. Cambiar una clave: repetir. Dar de baja: ejecutar `quitarPin('Nombre')`.

## Cómo se comporta
- Al abrir el POS pide: elegir nombre + 6 dígitos. Al cerrar la app, vuelve a pedir.
- Tocar el nombre arriba a la derecha = "Cerrar sesión".
- 5 errores seguidos → esa persona queda bloqueada 5 minutos.
- Sin internet: entra solo quien ya ingresó antes en ese celular.
- Si el servidor todavía no tiene claves cargadas, el POS funciona como antes y avisa en pantalla.
- ETAPA 1 no bloquea nada del servidor: la clave protege la pantalla. El servidor empieza a exigirla en Etapa 2/3 (con tu OK aparte).
