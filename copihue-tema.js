/* ============================================================================
   copihue-tema.js — v1 (10/10/2026)
   TEMA COMPARTIDO de Almacén Copihue. Mismo código que naturaleza-tema.js v5
   (Naturaleza Ilustrada); solo cambia la clave donde se guarda el tema.
   Copihue todavía no tiene página de Apariencia: mientras no exista, no hay
   tema guardado y quedan los colores bordó por defecto de cada página.

   Qué hace:
   1. Lee el tema guardado por la página Apariencia
      (localStorage 'naturaleza_tema_v1') y pone los colores base.
   2. CALCULA SOLO el color de la letra para que siempre haya contraste:
        --sobre-header        letra sobre el encabezado (blanca u oscura)
        --sobre-header-tenue  la misma letra, más suave (etiquetas)
        --sobre-header-suave  fondo translúcido de botones del encabezado
        --sobre-header-borde  borde translúcido de esos botones
        --verde / --verde-oscuro   color de marca oscurecido lo necesario
                              para leerse sobre blanco (títulos, precios)
                              y para llevar letra blanca encima (botones).
   DOS MODOS (atributo data-modo en la etiqueta <script>):
     · sin atributo  → "completo": lo usa el POS (index.html). Pone todo.
     · data-modo="encabezado" → para las demás páginas: solo pone los colores
       del encabezado y su letra. NO toca --texto, --fondo, --gris ni --verde,
       porque cada página usa esos nombres para sus propios colores.
   En los dos modos deja además --tema-fuerte y --tema-fuerte-2 (color de
   marca legible sobre blanco) para quien los quiera usar.
   v3 — MODOS OSCUROS DESACTIVADOS: las páginas tienen casillas y tarjetas de
   fondo blanco fijo, así que un fondo oscuro dejaba letra clara sobre blanco
   (ilegible). Si el tema guardado trae un fondo oscuro, se IGNORAN texto,
   subtexto, fondo y gris y quedan los valores claros por defecto. Los colores
   del encabezado se siguen aplicando igual.
   v4 — BARRA DEL NAVEGADOR: en el celular, la franja de arriba (donde está la
   dirección) toma el color de <meta name="theme-color">. Cada página lo tenía
   fijo (bordó en el POS, verde en Fiados). Ahora este archivo lo pone igual
   al color del encabezado, y si la página no tiene esa etiqueta, la crea.
   v5 — SALIDA ESTÁNDAR: si la etiqueta <script> trae data-salida="index.html"
   (y data-pagina="Reportes"), la página pregunta UNA sola vez "¿Salir de
   Reportes?" tanto al tocar su botón Volver (NaturalezaTema.salir()) como al
   usar el botón/gesto Atrás del teléfono. No usa el aviso del navegador al
   cerrar (beforeunload), que era lo que hacía preguntar dos veces.
   Si no hay tema guardado no cambia nada: quedan los colores por defecto.
   No hace pedidos a internet. No toca datos de venta.
   ============================================================================ */
(function () {
    'use strict';
    var CLAVE = 'copihue_tema_v1';
    var DEFECTO = { header1: '#7f1d1d', header2: '#991b1b' };
    var CLARO = '#ffffff', OSCURO = '#1a1a1a';
    var _yo = document.currentScript;
    var SOLO_ENCABEZADO = !!(_yo && _yo.getAttribute('data-modo') === 'encabezado');

    function rgb(hex) {
        hex = String(hex || '').trim().replace('#', '');
        if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null;
        return { r: parseInt(hex.slice(0, 2), 16), g: parseInt(hex.slice(2, 4), 16), b: parseInt(hex.slice(4, 6), 16) };
    }
    function aHex(c) {
        return '#' + [c.r, c.g, c.b].map(function (v) {
            return Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
        }).join('');
    }
    function luminancia(hex) {
        var c = rgb(hex); if (!c) return 0;
        var p = [c.r, c.g, c.b].map(function (v) {
            v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2];
    }
    function contraste(a, b) {
        var L1 = luminancia(a), L2 = luminancia(b);
        return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    }
    // Letra (blanca u oscura) que mejor se lee sobre TODOS los fondos dados
    function letraSobre(fondos) {
        function peor(letra) { return Math.min.apply(null, fondos.map(function (f) { return contraste(f, letra); })); }
        return peor(CLARO) >= peor(OSCURO) ? CLARO : OSCURO;
    }
    // Oscurece un color hasta que se lea sobre blanco con el contraste pedido
    function fuerte(hex, minimo) {
        var c = rgb(hex); if (!c) return hex;
        for (var i = 0; i < 40 && contraste(aHex(c), CLARO) < minimo; i++) {
            c = { r: c.r * 0.94, g: c.g * 0.94, b: c.b * 0.94 };
        }
        return aHex(c);
    }

    function leer() {
        try { return JSON.parse(localStorage.getItem(CLAVE) || 'null') || {}; } catch (e) { return {}; }
    }

    function aplicar(tema) {
        var t = tema || leer();
        var root = document.documentElement.style;
        // 1) Colores base (solo los que vengan y sean válidos)
        var base = { primary: '--primary', header1: '--header-bg-1', header2: '--header-bg-2',
                     texto: '--texto', subtexto: '--subtexto', fondo: '--fondo', gris: '--gris' };
        if (SOLO_ENCABEZADO) base = { primary: '--primary', header1: '--header-bg-1', header2: '--header-bg-2' };
        var fondoOscuro = !!rgb(t.fondo) && luminancia(t.fondo) < 0.35;
        Object.keys(base).forEach(function (k) {
            var esBrillo = (k === 'texto' || k === 'subtexto' || k === 'fondo' || k === 'gris');
            if (esBrillo && fondoOscuro) { root.removeProperty(base[k]); return; } // v3: vuelve al valor claro por defecto
            if (t[k]) root.setProperty(base[k], t[k]);
        });

        // 2) Derivados de contraste
        var h1 = rgb(t.header1) ? t.header1 : DEFECTO.header1;
        var h2 = rgb(t.header2) ? t.header2 : DEFECTO.header2;
        var letra = letraSobre([h1, h2]);
        var esClara = letra === CLARO;
        var n = esClara ? '255,255,255' : '0,0,0';
        root.setProperty('--sobre-header', letra);
        root.setProperty('--sobre-header-tenue', 'rgba(' + n + ',' + (esClara ? '0.8' : '0.75') + ')');
        root.setProperty('--sobre-header-suave', 'rgba(' + n + ',' + (esClara ? '0.2' : '0.08') + ')');
        root.setProperty('--sobre-header-borde', 'rgba(' + n + ',' + (esClara ? '0.4' : '0.3') + ')');
        root.setProperty('--tema-fuerte', fuerte(h1, 5.5));
        root.setProperty('--tema-fuerte-2', fuerte(h2, 4.5));
        if (!SOLO_ENCABEZADO) {
            root.setProperty('--verde-oscuro', fuerte(h1, 5.5));
            root.setProperty('--verde', fuerte(h2, 4.5));
        }
        // v4 — barra del navegador del celular = color del encabezado
        try {
            var meta = document.querySelector('meta[name="theme-color"]');
            if (!meta && document.head) {
                meta = document.createElement('meta');
                meta.setAttribute('name', 'theme-color');
                document.head.appendChild(meta);
            }
            if (meta) meta.setAttribute('content', h1);
        } catch (eMeta) {}
        return { letra: letra, header1: h1, header2: h2 };
    }

    // v5 — salida estándar: una sola pregunta, por el botón Volver o por Atrás
    var _saliendo = false, _preguntando = false;
    function protegerSalida(destino, pagina) {
        destino = destino || 'index.html';
        function salir() {
            if (_saliendo || _preguntando) return false;
            _preguntando = true;
            var ok = true;
            try { ok = window.confirm('¿Salir de ' + (pagina || 'esta página') + '?'); } catch (e) {}
            _preguntando = false;
            if (ok) { _saliendo = true; window.location.href = destino; }
            return ok;
        }
        try { history.pushState({ niGuard: true }, '', location.href); } catch (e) {}
        window.addEventListener('popstate', function () {
            if (_saliendo) return;
            if (!salir()) { try { history.pushState({ niGuard: true }, '', location.href); } catch (e) {} }
        });
        return salir;
    }

    window.NaturalezaTema = { aplicar: aplicar, contraste: contraste, letraSobre: letraSobre, fuerte: fuerte, version: 5 };
    try { aplicar(); } catch (e) {}
    try {
        if (_yo && _yo.getAttribute('data-salida')) {
            window.NaturalezaTema.salir = protegerSalida(_yo.getAttribute('data-salida'), _yo.getAttribute('data-pagina'));
        }
    } catch (e) {}
})();
