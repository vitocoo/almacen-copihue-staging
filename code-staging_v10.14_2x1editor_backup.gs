// ===============================
// 🟩 PROYECTO: ALMACÉN COPIHUE STAGING - SISTEMA COMPLETO v11.0
// 📍 googlesheet: victoralvarezojeda@gmail.com
// 📍 Claude: victoralvarezojeda@gmail.com
// 📍 Deepseek: victoralvarezojeda@gmail.com
// 🌐 URL: https://almacen-copihue-staging.vercel.app/
// 📁 Repo: https://github.com/vitocoo/almacen-copihue-staging
// 📊 Planilla: Copia de Almacén Copihue - Base de Datos_Staging
// 🧩 Arquitectura: 1 planilla
// 🎯 Origen: Almacen de Copihue
// ⚠️ ESTE ES EL SISTEMA DE PRUEBAS — NO PRODUCCIÓN
// ⚠️ Producción vive en: almacen-copihue.vercel.app
// 📅 Última edición: 19/09/2026
// ===============================
// ======================
// ALMACÉN COPIHUE - SISTEMA COMPLETO v11.0
// v11.0: Separación de archivos — toda la lógica de multicompra
//        (_validarMulticompra_, getMulticompraTodas, y los helpers de
//        calcularOfertas/doGet/ajustarProducto) se movió a multicompra.gs.
//        Mismo comportamiento exacto, verificado con tests — solo cambia
//        dónde vive el código.
// ALMACÉN COPIHUE - SISTEMA COMPLETO v10.18
// v10.12b (18/09/2026): FIX — deshacerIngreso() no distinguía "producto
//         nuevo" de "producto existente": siempre solo restaba stock,
//         dejando un producto fantasma con stock 0 (en vez de borrar la
//         fila) cuando el ingreso deshecho había creado el producto de
//         cero. Ahora, si la columna E del Historial trae un ID (señal de
//         que ESTE ingreso creó el producto), borra la fila completa de
//         Inventario — pero solo si nada más tocó su stock desde que se
//         creó (si el stock actual ya no coincide con lo que este ingreso
//         puso, no borra nada y avisa para revisión manual, para no
//         llevarse puesto una venta u otro ingreso real). Comportamiento
//         para producto existente: sin cambios.
// v10.18: PERF — doGet ya no calcula rotación (escaneo completo de Ventas
//         e Historial) ni textos de oferta en vivo en cada carga. Ahora
//         lee de CacheService, refrescado por el nuevo trigger
//         refrescarCacheRotacionYOfertas (agregar en Activadores). Si el
//         caché está vacío, cae al cálculo en vivo de siempre — mismo
//         resultado, sin riesgo. Objetivo: bajar el doGet de 6-8s a
//         menos de 1s cuando hay caché disponible. Ningún dato ni
//         columna de la planilla fue tocado.
// ALMACÉN COPIHUE - SISTEMA COMPLETO v10.16
// v10.16: FIX — se saca el tope de 6 (limites.multicompra) que cortaba en
//         silencio la lista multicompraActiva de getOfertas() si había más
//         de 6 productos con multicompra activa en la planilla (ver
//         v10.15). Ese límite tenía sentido para relámpago/especiales/
//         destacadas (rotación de vidriera), pero mal aplicado acá. El
//         frontend (seba21 v474) ya arma su motor de precio desde el
//         listado completo de productos, no desde esta lista — sacar el
//         tope acá es un cinturón de seguridad extra, no una dependencia.
// ALMACÉN COPIHUE - SISTEMA COMPLETO v10.15
// v10.15: FIX CRÍTICO — se agregan mcTipo y mcGrupo al listado masivo de
//         productos (junto a mcActiva/mcCantidad/mcPrecio ya existentes).
//         Causa raíz encontrada de por qué Manaos/Cunnington no aplicaban
//         descuento aunque estuvieran bien configurados: el frontend
//         armaba su motor de precios real (_poolMulticompra) EXCLUSIVAMENTE
//         desde la lista "multicompraActiva" de getOfertas(), que tiene un
//         tope de 6 (pensado para no saturar el catálogo/flyer con
//         demasiadas ofertas destacadas). Si ya había 6 productos con
//         multicompra activa antes en la planilla, los de más abajo
//         (Manaos, Cunnington) quedaban afuera del cálculo de precio real
//         — no era un problema de datos ni de "SI" vs "TRUE", era el
//         límite del catálogo filtrando silenciosamente el motor de
//         cobro. Con mcTipo/mcGrupo ya expuestos acá (sin ningún límite),
//         el frontend puede armar _poolMulticompra directamente desde el
//         listado completo de productos.
// ALMACÉN COPIHUE - SISTEMA COMPLETO v10.14
// v10.14: FIX — auditoría de MULTICOMPRA_ACTIVA (SI vs TRUE mezclados en la
//         planilla): confirmado que _esActivoFlag_() ya normaliza ambos
//         formatos en los 4 puntos de lectura (ajustarProducto, getOfertas,
//         getMulticompraTodas, listado principal de productos) — no hacía
//         falta tocar nada ahí. Lo que sí estaba mal: el editor rápido
//         (ajustarProducto) al activar una promo con MULTICOMPRA_TIPO vacío
//         completaba siempre con el genérico "NX" en vez de derivar el tipo
//         real de la cantidad cargada (ej. cantidad=2 → "2X"), que es el
//         formato que ya se usa a mano en la planilla. Ahora deriva
//         "{cantidad}X" y cae a "NX" solo si no hay cantidad válida.
//         Funcionalmente no cambiaba el cálculo de precio (NX y 2X usan la
//         misma fórmula), pero dejaba la planilla con un valor inconsistente
//         respecto a lo cargado a mano.
// ALMACÉN COPIHUE - SISTEMA COMPLETO v10.13
// v10.13: FIX CRÍTICO — el editor rápido de Multicompra (Ajustar producto)
//         nunca escribía MULTICOMPRA_TIPO. El cálculo real del precio con
//         descuento en el frontend EXIGE que ese campo diga "2X"/"3X"/
//         "NX"/"LLEVÁ-PAGÁ"/"2DA_UNIDAD" para aplicar el descuento — sin
//         eso, el cartel "2x $X" se mostraba igual (no depende de tipo),
//         pero al cobrar el sistema NO aplicaba ningún descuento, cobraba
//         precio normal. Esto explica por qué las promos armadas a mano
//         en la planilla (con tipo ya cargado) funcionaban y las armadas
//         desde el editor no. Ahora, al activar una promo con el tipo
//         vacío, se completa solo con "NX" (genérico, sirve para
//         cualquier cantidad) — nunca pisa un tipo especial ya cargado a
//         mano (ej. 2DA_UNIDAD). Probado con los 3 casos: producto nuevo
//         (se completa solo), producto viejo con tipo ya cargado (no se
//         toca), desactivar (el tipo queda intacto para reactivar
//         después).
// ALMACÉN COPIHUE - SISTEMA COMPLETO v10.12
// v10.12: FIX — el editor de Multicompra (Ajustar producto) leía "activa"
//         con Boolean() plano en vez de _esActivoFlag_() (la función que
//         ya usa getOfertas para reconocer "SI"/"VERDADERO"/"X"/etc, no
//         solo un booleano real). Podía mostrar el check destildado
//         aunque la planilla tuviera el flag en un formato de texto
//         válido. Ahora usa _esActivoFlag_ en los dos lugares (listado de
//         productos y ajustarProducto), igual criterio en todo el
//         sistema.
// ALMACÉN COPIHUE - SISTEMA COMPLETO v10.11
// v10.11: FIX CRÍTICO — LockService agregado a ingresarMercaderia() (antes
//         no tenía ninguno, a diferencia de procesarVenta). Causa raíz de
//         datos de distintos ingresos mezclados en la misma fila de
//         Inventario: dos ejecuciones podían encontrar la misma fila y
//         escribir sobre ella en paralelo, intercalando costo/precio/
//         cantidad/categoría de operaciones distintas. Cambio quirúrgico:
//         toda la función queda envuelta en un candado (igual patrón que
//         procesarVenta), nada de su lógica interna fue tocado.
//         NUEVO — editor rápido de Multicompra en Ajustar producto:
//         mcActiva/mcCantidad/mcPrecio agregados al listado de productos
//         y a ajustarProducto(), columnas resueltas por nombre de
//         encabezado (mismo criterio que ya usaba getOfertas). No toca
//         MULTICOMPRA_TIPO ni GRUPO.
// ALMACÉN COPIHUE - SISTEMA COMPLETO v10.10
// v10.10: FIX — getCotizaciones() y getConfigRaspadita() leían columna B
//         (índice 1) en vez de columna C (índice 2), igual que el resto del
//         config_sistema. Resultado: usd_valor y clp_valor llegaban al
//         frontend como "3.1", "7.1" (número de fila) en vez del valor real.
//         Cambio: datos[i][1] → datos[i][2] en ambas funciones.
// v10.9: FIX CRÍTICO — límite de cordura en getCotizaciones(). Caso real:
//        clp_valor en config_sistema quedó con un valor disparatado (o
//        Sheets la convirtió en fecha sin querer) y el sistema calculó un
//        "vuelto a entregar" de más de 12 mil millones de pesos para una
//        compra de $1.000. Ahora, si usd_valor o clp_valor sale fuera de
//        un rango razonable (0.001 a 100.000), se trata como "no
//        disponible" en vez de usarse para calcular cualquier equivalente
//        — el panel de pago mixto muestra el error de siempre, nunca un
//        número absurdo.
// v10.8: FIX — getCotizaciones() no reconocía "1,6" (coma decimal, formato
//        argentino) para clp_valor en config_sistema: parseFloat("1,6")
//        corta en la coma y devuelve solo 1, o NaN si venía con más texto
//        alrededor — el panel de pago mixto reportaba "no hay cotización
//        de CLP" aunque sí estaba cargada. USD (sin coma, "1500") no tenía
//        el problema, por eso funcionaba bien. Se agrega
//        _parseNumeroFlexible(), que entiende coma decimal, punto, y
//        números reales de Sheets — usado para usd_valor, clp_valor y
//        usd_limite_sobrepago_pct.
// v10.7: NUEVO — SEBA21 v443, pago múltiple / multimoneda / vuelto.
//        Analizado y aprobado antes de programar (informe de estructura
//        real de Ventas/Fiados/Caja_Movimientos/procesarVenta/cotizaciones
//        entregado y revisado primero).
//        - getCotizaciones(): nueva, lee usd_valor/usd_activo/clp_valor/
//          clp_activo de config_sistema (ya existían, mismo patrón que
//          getConfigRaspadita). usd_limite_sobrepago_pct opcional (20% si
//          no está cargado en la planilla — configurable, no hardcodeado).
//        - procesarVenta(): si el payload trae detallePagos, VALIDA la
//          cotización de USD/CLP contra config_sistema EN EL SERVIDOR
//          (nunca confía en lo que mandó el celular) y escribe el JSON
//          en la columna I (nueva) de la fila de TOTAL del ticket. Si no
//          viene detallePagos, cero cambio de comportamiento — columna I
//          queda vacía, exactamente como antes de v10.7.
//        - getCajaDiaria(): si la fila tiene DETALLE_PAGOS, reparte el
//          total entre efectivo/posnet/transferencia/fiado según los
//          pagos reales (antes, "MIXTO" caía entero en "efectivo" por
//          descarte — corregido, era el hallazgo más importante del
//          análisis previo). Si no hay detalle, usa exactamente la lógica
//          de siempre. Suma también usdRecibido/clpRecibido del día para
//          un futuro arqueo físico.
//        - Ninguna columna existente de Ventas/Fiados/Caja_Movimientos
//          fue movida, renombrada ni reinterpretada. lockVenta, el
//          candado de idVenta, y guardarFiado()/abonarFiado()/
//          cobrarFiado() no se tocaron.
// v10.6: Idempotencia para copihue-fiado.html — abonarFiado() restaba el
//        abono del total en cada llamada; un reintento tras timeout de
//        conexión descontaba doble el saldo real del cliente (bug de
//        plata). Ahora chequea idOperacion contra las observaciones del
//        fiado antes de restar de nuevo (mismo patrón que v10.0/ingreso,
//        sin columna nueva — el idOperacion viaja embebido en el texto de
//        observaciones ya existente). cobrarFiado() recibió la misma
//        protección de forma defensiva. NOTA: este parche ya se había
//        hecho una vez como "v10.1" en otra conversación, pero esa rama
//        nunca llegó a producción — se ramificó otra sesión desde v10.0
//        antes de que existiera, y esa fue la que se desplegó (v10.1
//        "salidas" → v10.5 "candado ticket duplicado"). Reaplicado ahora
//        sobre v10.5 real, sin tocar nada de esos fixes.
// v10.5: FIX RAÍZ — ticket duplicado en Ventas (caso #2260: 9 filas de ítem
//        correctas pero 2 filas de "TOTAL TICKET" idénticas). Causa: dos
//        invocaciones de procesarVenta casi simultáneas (doble tap / reintento
//        del celular) leían el mismo getLastRow() antes de que la primera
//        terminara de escribir — ambas calculaban el mismo número de ticket
//        y el mismo rango de filas para los ítems (por eso los ítems se ven
//        una sola vez, la segunda escritura pisa la misma celda con el mismo
//        valor), pero appendRow() de la fila TOTAL sí encuentra una fila
//        libre distinta cada vez → dos TOTAL por ticket. El candado existente
//        (LockService) solo actuaba si el celular mandaba idVenta; ahora hay
//        un candado incondicional (lockVenta, espera hasta 15s) que serializa
//        TODO procesarVenta — lectura de stock, descuento y escritura en
//        Ventas — sin depender de que el payload traiga idVenta.
// v10.4: FIX MULTICOMPRA + diagnóstico de Últimas Unidades.
//        Multicompra acepta SI/SÍ/TRUE/VERDADERO/X/1/checkbox y agrega
//        getMulticompraTodas() sin el límite de 6 usado por calcularOfertas().
//        Últimas Unidades agrega diagnosticoUltimas() para mostrar qué IDs
//        guardados apuntan a qué producto/stock hoy.
// v10.3: FIX RAÍZ del orden de Caja-Egresos (y Sacar del local) — mi fix
//        anterior (v9.8/v9.10) ordenaba por fecha+hora, pero solo convertía
//        bien la fecha si la celda era un objeto Date de Sheets; si venía
//        como TEXTO en formato argentino "DD/MM/AAAA", la comparaba como
//        string tal cual — y ahí "25/03/2026" ordena ANTES que "24/04/2026"
//        porque el día pesa más que el mes al comparar carácter por
//        carácter. Nuevo helper _normalizarFechaOrden() reconoce Date, ISO
//        y DD/MM/AAAA en texto, y siempre devuelve yyyy-MM-dd (que sí
//        ordena bien). Usado en getCajaEgresos y getSalidasInternas.
// v10.2: FIX RAÍZ — "Precio de costo" siempre aparecía vacío en Ingresar
//        mercadería, incluso con costo cargado en ingresos anteriores.
//        Encontré DOS problemas encimados:
//        1) ingresarMercaderia() nunca escribía el costo en la columna S
//           (persistida) del Inventario — solo lo guardaba en el log de
//           Historial. Esa columna S es la que lee el listado masivo de
//           productos, así que quedaba en 0 salvo que alguien la tocara a
//           mano en la planilla. Ahora se escribe ahí cada vez que se
//           ingresa un costo > 0 (nunca se pisa con vacío).
//        2) El listado masivo mandaba ese campo como "costo", pero el
//           frontend siempre leyó "precioCosto" — nunca coincidían los
//           nombres, así que aunque la columna S tuviera algo cargado no
//           llegaba al modal. Se agrega precioCosto además de costo.
//        3) Para productos cuyo último ingreso fue sin costo (como el caso
//           reportado): si la columna S está vacía, se busca una sola vez
//           en el Historial el último costo no vacío que exista (mapa
//           armado en una sola pasada, no una búsqueda por producto — no
//           hace más lento el listado aunque haya muchos productos así).
//        obtenerInfoProducto() también se actualizó para preferir la
//        columna persistida antes de escanear el Historial.
// v10.1: FIX — getSalidasInternas ("Sacar del local") tenía el mismo
//        problema que getCajaEgresos (v9.8): confiaba en que las filas de
//        SALIDAS ya estaban en orden cronológico en vez de ordenar por
//        fecha+hora real. Mismo fix: juntar todo primero, ordenar, recién
//        ahí recortar al límite. (Aplicado sobre la base v10.0 — este
//        archivo venía de otra sesión con la idempotencia de ingreso ya
//        hecha, así que se sumó este parche sin pisarlo.)
// v10.0: Idempotencia real para copihue-ingreso.html — ingresarMercaderia()
//        ahora rechaza un idOperacion repetido (búsqueda con TextFinder
//        sobre la columna J del Historial, sin límite fijo de filas) y
//        devuelve success+yaExistia sin volver a sumar stock. Nuevas
//        buscarPorIdOperacion() (interna, reutilizada) y buscarOperacion()
//        (endpoint público, action=buscarOperacion) para que el cliente
//        pueda confirmar solo si un ingreso llegó tras un timeout, sin
//        depender de mirar los últimos N movimientos. Reemplaza un enfoque
//        descartado de comparar producto+cantidad+ventana de tiempo (daba
//        falsos positivos con compras legítimas duplicadas, ej. dos
//        entregas iguales el mismo día).
// v9.9: FIX — sugerencia de pedido de pan seguía apareciendo aunque se
//       tocara "Hoy no" o se aceptara pedirlo. La causa: el flag vivía solo
//       en localStorage, que es POR CELULAR — no compartido. Se agregan
//       getPanSugeridoHoy/marcarPanSugeridoHoy usando PropertiesService
//       (no config_sistema, no hace falta tocar la planilla para esto) para
//       que cualquier celular vea el mismo estado del día.
// v9.8: FIX — historial de Caja-Egresos con un bloque fuera de orden.
//       getCajaEgresos recorría la planilla de abajo hacia arriba confiando
//       en que las filas ya estaban en orden cronológico. Si algún egreso se
//       cargó o corrigió fuera de secuencia, ese bloque quedaba pegado en su
//       posición de fila real, no en la fecha que le correspondía. Ahora se
//       juntan todos los egresos primero y se ordenan por fecha+hora antes
//       de recortar al límite — el orden ya no depende de cómo quedaron las
//       filas en la planilla.
// v9.7: FIX REGRESIÓN de v9.6 — la validación de nombre nueva rompía TODAS
//       las ventas por peso (incluida multicompra por peso, ej. mandarinas
//       2kg x $X). El celular manda el nombre con los gramos pegados
//       ("MANDARINA X KG (2000gr)"), eso nunca iba a coincidir con el
//       nombre de la planilla ("MANDARINA X KG"), y la línea se cortaba sin
//       cobrar ni descontar stock. Ahora, si es venta por peso, se saca el
//       "(XXXXgr)" del final antes de comparar. Confirmado por el usuario:
//       con v9.5 (sin el fix) la venta por peso multicompra funcionaba bien,
//       con v9.6 se rompió — este parche corrige eso sin tocar la
//       protección de v9.6 para ventas por unidad.
// v9.6: FIX CRÍTICO — discrepancia de stock en ventas. procesarVenta usaba
//       item.id como POSICIÓN de fila (así se genera en doGet: id:i), sin
//       validar nada. Si alguien borraba o reordenaba una fila en Inventario
//       mientras el POS seguía abierto en algún celular, esa posición pasaba
//       a ser OTRO producto, y la próxima venta desde ese celular le
//       descontaba el stock al que quedó ahí de casualidad — no al que
//       realmente se vendió. Ahora se valida el nombre que manda el celular
//       (item.name, que ya se enviaba pero no se usaba) contra el nombre que
//       hay en esa fila; si no coincide, se busca el producto correcto por
//       nombre antes de tocar stock, y si no se encuentra, esa línea NO
//       descuenta stock y queda reportada en errores para revisar a mano.
//       De paso: si el stock era insuficiente, antes igual se cobraba y se
//       dejaba en 0 sin avisar de verdad — ahora esa línea no se cobra.
//       Nota: esto es un parche defensivo sobre la arquitectura actual
//       (índice de fila como ID). La solución de fondo sería migrar a usar
//       la columna ID (col. D) como identificador estable en vez de la
//       posición — queda pendiente si se quiere encarar más adelante.
// v9.5: FIX CRÍTICO — validación de token bloqueaba TODO el sistema (seba21,
//       catálogo, ingreso, etc.), no solo la Lambda de Alexa. El chequeo
//       estaba al principio de doGet(e), exigiendo token a cualquier action.
//       Se sacó de ahí y se movió a _tokenVozValido_(e), que ahora se llama
//       solo dentro de las 3 acciones de voz: consultarStockVoz,
//       consultarVentasVoz, consultarCajaVoz. El resto de las acciones
//       vuelve a funcionar sin token, como siempre debió ser.
// v9.4: OFERTA PERSONALIZADA POR PRODUCTO — aplicarOfertaPersonalizada() ahora
//       recibe { items:[{id,tipo}], texto } en vez de { productoIds, tipo, texto }.
//       Esto permite que sendwa.html asigne un % distinto a cada producto de la
//       tanda (antes era un solo % para todos). Mantiene el reset de columna AJ
//       de v9.3. ⚠️ REQUIERE actualizar sendwa.html a la versión que manda "items".
// v9.3: FIX OFERTA PERSONALIZADA — aplicarOfertaPersonalizada() no resetaba la
//       columna AJ al aplicar una tanda nueva, dejando vivas para siempre las
//       ofertas de tandas anteriores (sin horario que las apague). Resultado:
//       cualquier collage mostraba siempre los mismos precios/% de pruebas viejas,
//       sin importar qué % se elija ahora. Ahora se limpia TODA la columna AJ a 0
//       antes de escribir los IDs de la tanda actual — cada "aplicar" reemplaza
//       por completo a la campaña anterior (mismo modelo que el texto único).
// v9.2: BATCH WRITES en procesarVenta — elimina timeouts en ventas con muchos items.
//       Antes: N llamadas a getRange().setValue() (1 por producto) → 20-30s en GAS.
//       Ahora: 1 getDataRange().getValues() para leer, N setValue() mínimos para
//       stock (uno por fila afectada, con acumulación si el mismo producto aparece
//       dos veces), flush() único, y escritura en Ventas en un solo setValues() batch
//       por ticket. Resultado esperado: 3-8s vs 20-30s → timeouts de 25s del POS
//       ya no deberían cortarse antes de recibir success:true.
//       Sin cambios en la lógica de negocio, deduplicación, ni estructura de datos.
// v9.1: REFACTOR TRAGAMONEDAS — arquitectura una fila por giro.
// v9.1: REFACTOR TRAGAMONEDAS — arquitectura una fila por giro.
//       generarCodigoTragamonedas: crea fila maestra NroGiro=0 Estado=EMITIDO.
//       registrarPremioTragamonedas: appendRow por cada giro (GANADOR/PERDEDOR).
//       validarCodigoTragamonedas: cuenta filas NroGiro>0 para giros usados.
//       listarPendientesTragamonedas: agrupa por código, muestra todos los premios.
//       entregarPremioTragamonedas: marca todas las filas GANADOR del código.
//       El estado ya no se sobreescribe — cada giro es inmutable en su propia fila.
// v9.0: FIX CRÍTICO TRAGAMONEDAS — giro perdedor sobreescribía GANADOR con PERDEDOR.
//       registrarPremioTragamonedas ahora lee estadoActual antes de escribir:
//       si ya era GANADOR (por giro anterior), nunca pisa col D con PERDEDOR.
//       Así listarPendientesTragamonedas encuentra correctamente los ganadores.
// v8.9: FIX CRÍTICO TRAGAMONEDAS — giros múltiples no funcionaban:
//       generarCodigoTragamonedas(monto) calcula giros=floor(monto/10000) y los
//       guarda en col I "Giros". validarCodigoTragamonedas devuelve giros +
//       girosUsados + girosRestantes. registrarPremioTragamonedas incrementa
//       col J "GirosUsados" y solo marca PERDEDOR cuando se agotaron todos.
//       _tragSheet_ agrega cols I=Giros J=GirosUsados al encabezado.
// v8.8: RASPADITA — sistema de vencimiento automático al cierre del local.
//       registrarGanador guarda col J "Vence" = timestamp de cierre del día
//       calculado desde CONFIGURACION (misma clave "cierre local" que usa el POS).
//       listarPendientesRaspadita marca VENCIDO automáticamente si pasó el cierre.
//       entregarPremioRaspadita verifica vencimiento antes de marcar ENTREGADO.
//       buscarCodigoRaspadita devuelve estado real (VENCIDO si corresponde).
//       Estados: PENDIENTE / ENTREGADO / VENCIDO. Sin botón "No retirado".
// v8.7: TRAGAMONEDAS pendientes: listarPendientesTragamonedas() lee TRAGAMONEDAS_CODIGOS
//       filtrando Estado=GANADOR y Entregado!=SI. entregarPremioTragamonedas(codigo)
//       escribe SI en col H. _tragSheet_ agrega col H "Entregado". doGet expone
//       acciones listarPendientesTragamonedas y entregarPremioTragamonedas.
//       generarCodigoTragamonedas ahora recibe param monto (por si se necesita).
// v8.6: FIX RASPADITA — listarPendientesRaspadita saltaba la primera fila ganadora.
//       La hoja JUEGO_STATS no tenía encabezado: datos desde fila 1, pero el loop
//       arrancaba en i=1 (saltando índice 0). _getJuegoStats_ ahora detecta si A1
//       es un dato (no el texto "Fecha") e inserta la fila de encabezados antes
//       de los datos, empujándolos. _raspSheet_() usa _getJuegoStats_() para
//       garantizar siempre la existencia del encabezado antes de leer.
// v8.5: FIX CRÍTICO duplicados — LockService en procesarVenta: el chequeo de
//       idVenta con PropertiesService no era atómico; si timeout+reintento llegaban
//       juntos, ambos pasaban antes de que el primero escribiera el ID → duplicado.
//       Lock de 6s garantiza acceso exclusivo al chequeo + escritura.
// v8.4: actualizarTicketFiado — nueva acción que escribe el ticket en col C de
//       FIADOS cuando vender falló por timeout y el reintento fue exitoso.
//       doGet: action 'actualizarTicketFiado'. Los fiados ahora envían idVenta
//       (idFiado+'_v') → procesarVenta los deduplica igual que ventas normales.
// v8.3: getSalidasInternas + getCajaEgresos — lectura de SALIDAS y CAJA_MOVIMIENTOS
// v8.2: getCandidatosUltimas incluye seleccionados aunque no tengan vencimiento
//        guardarUltimasSeleccion elimina filas duplicadas del sistema anterior
// v8.1: Fix NaN fechas en getCandidatosUltimas y _leerUltimasConDias_ (timezone)
// v8.0: Últimas Unidades — getCandidatosUltimas, getUltimasSeleccion, guardarUltimasSeleccion
//        calcularOfertas ahora devuelve ultimasSeleccionadas via _leerUltimasConDias_()
// v7.9: RECIEN_LLEGADOS_DIAS — ventana configurable desde config_sistema (fallback 7 dias)
// v7.8: Fix getVentasProducto — strip (XXXgr)\/(XXXkg) de nomFila antes de comparar
// v7.7: vender() ahora devuelve ticket en la respuesta — guardarFiado() lo recibe
//       y lo graba en columna C de FIADOS (antes siempre quedaba vacía)
// v7.6: getDetalleTicket — devuelve items reales de hoja Ventas por número de ticket
//       cobrarFiado — fechaPago ahora graba fecha+hora (yyyy-MM-dd HH:mm) para mejor filtrado
// v7.5: upsertCliente — guardarFiado crea/actualiza hoja Clientes automáticamente
// v7.4: listarClientes — lee hoja Clientes (nombre + teléfono) para autocomplete modal fiado
// v7.3: listarFiados incluye pagados últimos 30 días + fechaPago/metodoPago
// v7.2: Fix getVentasProducto — strip (XXXgr) para productos por peso
// v7.1: Fix guardarFiado — eliminado DATEVALUE() en fórmula columna K de FIADOS
//       (DATEVALUE rompe cuando J ya es fecha real, no texto)
// v7.0: Fix categoría en producto nuevo — usa datos.categoria en vez de hardcodear ALMACEN
//       + actualizarStockMinimos() — calcula col N con promedio 7 días × 2
//       + actualizarEstadisticas() — rotación + stock mínimos en un paso
//       + doGet action 'actualizarEstadisticas'
// v6.9: Fix gananciaReal histórica — qty en gramos (ej: 800) se convierte a kg (0.8) para cálculo correcto
// v6.8: Fix costo productos por peso — nomLimpio no sacaba "(800gr)", no matcheaba con inventario
// v6.7: Fix top histórico — ticket "184" vs "0184" no matcheaban
// v6.6: qty por peso guarda número puro (0.8) en vez de texto (0.8kg)
// v6.5: Fix stock por peso — usaba id "peso_TIMESTAMP" en vez de idOriginal, nunca encontraba la fila
// v6.4: Fix qty esPeso — guardaba gramos (800) en vez de kg (0.8), inflaba top productos
// v6.3: Carrito temporal — guardarCarritoTemp + getCarritoTemp (backup en planilla)
// v6.2: Jueves Cervecero — 1 solo gancho (mejor margen) al 20%, resto 10-15%
// v6.1: Jueves Cervecero — estrategia gancho top 2
// v5.9: setConfig + logInterruptor + rebaja stock kg productos por peso
// v5.8: Nueva hoja Ajuste_Rapido separada de Historial
// ======================

const SS_ID = '15pOr68jBTNNN77-EgtQIW3akLtGaya-apKrePC0U2TI'; // STAGING

// ============================================================
//  SEGURIDAD — token de acceso para la Lambda de Alexa
// ============================================================
// Ejecutar UNA SOLA VEZ desde el editor de Apps Script (seleccionar
// esta función en el desplegable de arriba y tocar "Ejecutar").
// Genera un token largo y lo guarda en Script Properties. Después
// de correrla una vez, no hace falta volver a tocarla.
function configurarTokenSecreto() {
  const token = Utilities.getUuid() + '-' + Utilities.getUuid();
  PropertiesService.getScriptProperties().setProperty('API_TOKEN', token);
  Logger.log('Token generado: ' + token);
}

// Valida el token solo para las 3 acciones de voz (Lambda de Alexa).
// El resto de las acciones (POS, catálogo, ingreso, etc.) no lo requieren.
function _tokenVozValido_(e) {
  const tokenEsperado = PropertiesService.getScriptProperties().getProperty('API_TOKEN');
  const tokenRecibido = e && e.parameter && e.parameter.token;
  return !!tokenRecibido && tokenRecibido === tokenEsperado;
}
const HOJA_INVENTARIO = 'inventario';
const HOJA_CONFIG     = 'config_sistema';
const HOJA_CONFIG_OFERTAS = 'config_ofertas'; // destino del bloque de diagnóstico en vivo de calcularOfertas()
const HOJA_HISTORIAL = 'Historial';
const HOJA_AJUSTE_RAPIDO = 'Ajuste_Rapido';
const HOJA_PROVEEDORES = 'Proveedores';
const MP_ACCESS_TOKEN = 'APP_USR-5614141351834158-022520-6ad6dd5ed431ca58fa841bfd74f0945b-213611899';

// ========== MENÚ UNIFICADO ==========
// ⚠️ UN SOLO onOpen en todo el proyecto. motorInventario.gs NO tiene onOpen propio.
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🏪 COPIHUE')
    .addItem('📦 Ingresar Productos', 'abrirFormularioIngreso')
    .addSeparator()
    .addItem('📊 Ver Historial', 'irAHistorial')
    .addItem('🔄 Actualizar Todo', 'actualizarTodo')
    .addSeparator()
    .addItem('▶ Actualizar motor inventario', 'actualizarMotorInventario')
    .addItem('📋 Generar lista de compra', 'actualizarListaCompra')
    .addToUi();
  console.log('✅ Menú Copihue creado');
}

// ========== ABRIR FORMULARIO DE INGRESO ==========
function abrirFormularioIngreso() {
  const html = HtmlService.createHtmlOutputFromFile('ingreso')
    .setWidth(520)
    .setHeight(750)
    .setTitle('📦 Ingreso de Mercadería');
  SpreadsheetApp.getUi().showModalDialog(html, '📦 Ingreso de Mercadería - Copihue');
}

// ========== IR A HOJA HISTORIAL ==========
function irAHistorial() {
  const ss = SpreadsheetApp.openById(SS_ID);
  const sheetHistorial = ss.getSheetByName(HOJA_HISTORIAL);
  if (sheetHistorial) {
    ss.setActiveSheet(sheetHistorial);
  } else {
    SpreadsheetApp.getUi().alert('❌ No se encontró la hoja "Historial"');
  }
}

// ========== ACTUALIZAR TODO ==========
// ⚠️ Las funciones del motor muestran su propio alert — no agregar un tercero acá
function actualizarTodo() {
  actualizarMotorInventario();
  actualizarListaCompra();
}

// ========== OBTENER DATOS INICIALES (para formulario ingreso) ==========
function obtenerDatosIniciales() {
  try {
    const ss = SpreadsheetApp.openById(SS_ID);
    const sheetInventario = ss.getSheetByName(HOJA_INVENTARIO);
    const datos = sheetInventario.getDataRange().getValues();

    const productos = [];
    for (let i = 1; i < datos.length; i++) {
      if (datos[i][0]) {
        productos.push(String(datos[i][0]).trim());
      }
    }

    const proveedoresSet = new Set();
    for (let i = 1; i < datos.length; i++) {
      if (datos[i][4]) {
        proveedoresSet.add(String(datos[i][4]).trim());
      }
    }

    return {
      productos: productos,
      proveedores: Array.from(proveedoresSet).sort()
    };
  } catch (error) {
    console.error('Error obtenerDatosIniciales:', error);
    return { productos: [], proveedores: [] };
  }
}

// ========== OBTENER INFO DE UN PRODUCTO ==========
function obtenerInfoProducto(nombreProducto) {
  try {
    const ss = SpreadsheetApp.openById(SS_ID);
    const sheet = ss.getSheetByName(HOJA_INVENTARIO);
    const datos = sheet.getDataRange().getValues();
    const nombreBuscado = nombreProducto.trim().toUpperCase().replace(/\s+/g, ' ');

    for (let i = 1; i < datos.length; i++) {
      if (!datos[i][0]) continue;
      const nombreEnSheet = String(datos[i][0]).trim().toUpperCase().replace(/\s+/g, ' ');
      if (nombreEnSheet === nombreBuscado) {
        const costoCol = datos[i].length > 18 ? (parseFloat(datos[i][18]) || 0) : 0; // v10.2
        return {
          encontrado: true,
          fila: i + 1,
          precioVenta: datos[i][1] || 0,
          stockActual: datos[i][5] || 0,
          proveedor: datos[i][4] || '',
          categoria: datos[i][2] || '',
          precioCosto: costoCol > 0 ? costoCol : obtenerUltimoCosto(nombreProducto)
        };
      }
    }

    return { encontrado: false, mensaje: 'Producto no existe en inventario' };
  } catch (error) {
    console.error('Error obtenerInfoProducto:', error);
    return { encontrado: false, error: error.toString() };
  }
}

// ========== OBTENER ÚLTIMO PRECIO DE COSTO DESDE HISTORIAL ==========
// v10.2 — respaldo para productos cuya columna de costo en Inventario (S)
// todavía está vacía (ingresos viejos hechos sin costo, antes de que
// ingresarMercaderia empezara a persistirlo ahí). Arma el mapa en UNA sola
// pasada del Historial, no una búsqueda por producto — así el listado
// masivo de productos no se pone lento aunque haya muchos productos con
// la columna vacía.
function _mapaUltimosCostosDesdeHistorial() {
  var mapa = {};
  try {
    var ss = SpreadsheetApp.openById(SS_ID);
    var sheetHistorial = ss.getSheetByName(HOJA_HISTORIAL);
    if (!sheetHistorial) return mapa;
    var datos = sheetHistorial.getDataRange().getValues();
    // De abajo hacia arriba: la primera coincidencia por producto es la más
    // reciente. Solo se guarda si el costo de esa fila no está vacío.
    for (var i = datos.length - 1; i >= 1; i--) {
      var nombre = String(datos[i][1] || '').trim().toUpperCase();
      if (!nombre || mapa[nombre] !== undefined) continue;
      var costo = datos[i][6];
      if (costo && !isNaN(costo) && Number(costo) > 0) mapa[nombre] = Number(costo);
    }
  } catch (e) { console.error('Error _mapaUltimosCostosDesdeHistorial:', e); }
  return mapa;
}

function obtenerUltimoCosto(nombreProducto) {
  try {
    const ss = SpreadsheetApp.openById(SS_ID);
    const sheetHistorial = ss.getSheetByName(HOJA_HISTORIAL);
    if (!sheetHistorial) return null;

    const datos = sheetHistorial.getDataRange().getValues();
    const nombreBuscado = nombreProducto.trim().toUpperCase();

    for (let i = datos.length - 1; i >= 1; i--) {
      const nombreEnHistorial = String(datos[i][1] || '').trim().toUpperCase();
      if (nombreEnHistorial === nombreBuscado) {
        const costo = datos[i][6];
        if (costo && !isNaN(costo)) return Number(costo);
      }
    }
    return null;
  } catch (error) {
    console.error('Error obtenerUltimoCosto:', error);
    return null;
  }
}

// ========== LEER PROVEEDORES ==========
function leerProveedores() {
  try {
    const ss = SpreadsheetApp.openById(SS_ID);
    let sheet = ss.getSheetByName(HOJA_PROVEEDORES);

    if (!sheet) {
      sheet = ss.insertSheet(HOJA_PROVEEDORES);
      sheet.getRange(1, 1, 1, 5).setValues([['PROVEEDOR', 'TELEFONO_WA', 'MENSAJE', 'ACTIVO', 'NOTAS']]);
      sheet.getRange(1, 1, 1, 5).setFontWeight('bold');
      sheet.setFrozenRows(1);

      const invSheet = ss.getSheetByName(HOJA_INVENTARIO);
      const invDatos = invSheet.getDataRange().getValues();
      const provSet = new Set();
      for (let i = 1; i < invDatos.length; i++) {
        if (invDatos[i][4]) provSet.add(String(invDatos[i][4]).trim().toUpperCase());
      }
      let fila = 2;
      provSet.forEach(function(nombre) {
        sheet.getRange(fila, 1).setValue(nombre);
        sheet.getRange(fila, 3).setValue('Hola {nombre}! 🛒 Te hago el pedido:\n\n{productos}\n\n¡Gracias!');
        sheet.getRange(fila, 4).setValue('NO');
        fila++;
      });
      console.log('✅ Hoja Proveedores creada con ' + provSet.size + ' proveedores');
    }

    const datos = sheet.getDataRange().getValues();
    const proveedores = [];
    for (let i = 1; i < datos.length; i++) {
      const nombre = String(datos[i][0] || '').trim();
      if (!nombre) continue;
      proveedores.push({
        nombre:   nombre,
        telefono: String(datos[i][1] || '').replace(/\D/g, ''),
        mensaje:  String(datos[i][2] || '').trim(),
        activo:   String(datos[i][3] || '').toUpperCase() === 'SI',
        notas:    String(datos[i][4] || '').trim()
      });
    }

    return { success: true, proveedores: proveedores };
  } catch(e) {
    console.error('Error leerProveedores:', e);
    return { success: false, mensaje: e.toString(), proveedores: [] };
  }
}

// ========== GUARDAR PROVEEDOR ==========
function guardarProveedor(datos) {
  try {
    const ss = SpreadsheetApp.openById(SS_ID);
    const sheet = ss.getSheetByName(HOJA_PROVEEDORES);
    if (!sheet) return { success: false, mensaje: 'Hoja Proveedores no existe' };

    const rows = sheet.getDataRange().getValues();
    const nombreBuscado = String(datos.nombre || '').trim().toUpperCase();
    let filaEncontrada = -1;

    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][0] || '').trim().toUpperCase() === nombreBuscado) {
        filaEncontrada = i + 1;
        break;
      }
    }

    const fila = [
      datos.nombre.trim().toUpperCase(),
      String(datos.telefono || '').replace(/\D/g, ''),
      datos.mensaje || '',
      datos.activo ? 'SI' : 'NO',
      datos.notas || ''
    ];

    if (filaEncontrada > 0) {
      sheet.getRange(filaEncontrada, 1, 1, 5).setValues([fila]);
    } else {
      sheet.appendRow(fila);
    }

    return { success: true, mensaje: '✅ Proveedor guardado: ' + datos.nombre };
  } catch(e) {
    return { success: false, mensaje: e.toString() };
  }
}

// ========== INGRESAR MERCADERÍA (desde formulario) ==========
function ingresarMercaderia(datos) {
  const lockIngreso = LockService.getScriptLock();
  try {
    lockIngreso.waitLock(15000);
  } catch (lockError) {
    return {
      success: false,
      mensaje: 'El sistema está procesando otro ingreso. Esperá unos segundos e intentá nuevamente.'
    };
  }
  try {
  try {
    const ss = SpreadsheetApp.openById(SS_ID);
    const sheetInventario = ss.getSheetByName(HOJA_INVENTARIO);
    const sheetHistorial = ss.getSheetByName(HOJA_HISTORIAL);

    // ── Idempotencia: si este idOperacion ya fue procesado, no sumar stock
    // de nuevo — devolver éxito directo. Cubre reintentos del cliente tras
    // un timeout donde el primer guardado sí había llegado. Búsqueda con
    // TextFinder (no lee la hoja entera a memoria), rápida sin importar
    // cuántas filas tenga el Historial.
    const idOp = String(datos.idOperacion || '').trim();
    if (idOp) {
      const existente = buscarPorIdOperacion(sheetHistorial, idOp);
      if (existente.existe) {
        return {
          success: true,
          yaExistia: true,
          fila: existente.fila,
          fecha: existente.fecha,
          stockActual: existente.stockActual,
          mensaje: 'La operación ya estaba registrada el ' + existente.fecha + ' — no se sumó stock de nuevo.'
        };
      }
    }

    const producto = datos.producto.trim();
    const cantidad = Number(datos.cantidad);
    const precioCosto = datos.precioCosto;
    const precioVenta = datos.precioVenta;
    const proveedor = datos.proveedor;
    const fechaVencimiento = datos.fechaVencimiento;

    if (!producto) return { success: false, mensaje: 'Nombre de producto vacío' };
    const esAjusteDirecto = datos.stockDirecto !== undefined && datos.stockDirecto !== null;
    if (!esAjusteDirecto && cantidad <= 0) return { success: false, mensaje: 'Cantidad debe ser mayor a 0' };

    const datosInventario = sheetInventario.getDataRange().getValues();
    let filaProducto = -1;
    let stockActual = 0;
    const productoNormalizado = producto.trim().toUpperCase().replace(/\s+/g, ' ');

    for (let i = 1; i < datosInventario.length; i++) {
      if (!datosInventario[i][0]) continue;
      const nombreEnSheet = String(datosInventario[i][0]).trim().toUpperCase().replace(/\s+/g, ' ');
      if (nombreEnSheet === productoNormalizado) {
        filaProducto = i + 1;
        stockActual = Number(datosInventario[i][5]) || 0;
        break;
      }
    }

    // ── PRODUCTO NUEVO ──
    if (filaProducto === -1) {
      const ultimaFila = sheetInventario.getLastRow() + 1;
      const nuevoStock = cantidad;
      const todosLosDatos = sheetInventario.getDataRange().getValues();
      let maxId = 0;
      for (let i = 1; i < todosLosDatos.length; i++) {
        const idRaw = String(todosLosDatos[i][3] || '').replace('ID', '');
        const idNum = parseInt(idRaw);
        if (!isNaN(idNum) && idNum > maxId) maxId = idNum;
      }
      const nuevoId = 'ID' + (maxId + 1);

      const categoriaFinal = (datos.categoria && datos.categoria.trim())
        ? datos.categoria.trim().toUpperCase()
        : 'ALMACEN';

      sheetInventario.getRange(ultimaFila, 1).setValue(producto.toUpperCase());
      sheetInventario.getRange(ultimaFila, 2).setValue(precioVenta || 0);
      sheetInventario.getRange(ultimaFila, 3).setValue(categoriaFinal);
      sheetInventario.getRange(ultimaFila, 4).setValue(nuevoId);
      if (proveedor) sheetInventario.getRange(ultimaFila, 5).setValue(proveedor);
      sheetInventario.getRange(ultimaFila, 6).setValue(nuevoStock);
      if (precioCosto && precioCosto > 0) sheetInventario.getRange(ultimaFila, 19).setValue(precioCosto); // v10.2

      // Rellenar columnas automáticas con 0 y fórmulas
      var f = ultimaFila; // alias corto
      sheetInventario.getRange(f, 7).setValue(0);   // G: Relampago
      sheetInventario.getRange(f, 8).setValue(0);   // H: Destacada
      sheetInventario.getRange(f, 9).setValue(0);   // I: Especial
      sheetInventario.getRange(f, 12).setValue(0);  // L: promos/antojo_popup

      // ── J: categoriaOferta — fórmula en INGLÉS ──────────────────
      sheetInventario.getRange(f, 10).setFormula(
        '=IF(A'+f+'="","",IF(F'+f+'<=0,"sin stock",IF(NOT(OR(I'+f+'=0,I'+f+'=1)),"ERROR ESPECIAL",' +
        'IF(NOT(ISNUMBER(MATCH(G'+f+',{0,1,2,3,4,5,6,10,11,12,13,14},0))),"ERROR RELAMPAGO",' +
        'IF(OR(H'+f+'>70,AND(H'+f+'>0,H'+f+'<15)),"ERROR DESTACADA",' +
        'IF((I'+f+'=1)+(H'+f+'>0)+(G'+f+'>0)>1,"ERROR DOBLE OFERTA",' +
        'IF(I'+f+'=1,"especial",' +
        'IF(H'+f+'>0,"destacada",' +
        'IF(G'+f+'>0,' +
          'IF(OR(AND(G'+f+'<=6,F'+f+'<(G'+f+'+1)),AND(G'+f+'=10,F'+f+'<2),AND(G'+f+'>=11,F'+f+'<1)),' +
            '"REPONER "&IF(G'+f+'<=6,G'+f+'+1-F'+f+',IF(G'+f+'=10,2-F'+f+',1-F'+f+'))&" PARA PROMO",' +
            'IF(G'+f+'<=6,"relampago "&(G'+f+'+1)&"x"&G'+f+',' +
            'IF(G'+f+'=10,"2da50off",' +
            'IF(G'+f+'>=11,"relampago "&CHOOSE(G'+f+'-10,10,15,20,25)&"%","relampago")))),' +
        '"sin oferta"))))))))))'
      );

      // ── K: PT (Precio Técnico) — fórmula en INGLÉS ──────────────
      sheetInventario.getRange(f, 11).setFormula(
        '=IF(AND(C'+f+'="PROMOS",F'+f+'>=1),"COMBO ACTIVADO EN CAT. PROMOS",' +
        'IF(OR(F'+f+'<=0,B'+f+'<=0),"SIN STOCK / CARGAR STOCK",' +
        'IF(B'+f+'="","CARGAR PRECIO",' +
        'IF(AND(ISNUMBER(G'+f+'),G'+f+'>0),' +
          'B'+f+'*VLOOKUP(G'+f+',{1,0.5;2,0.6667;3,0.75;4,0.8;5,0.8333;6,0.8571;10,0.75},2,FALSE),' +
        'IF(AND(ISNUMBER(H'+f+'),H'+f+'>0),' +
          'B'+f+'*(1-H'+f+'/100),' +
        'IF(I'+f+'=1,B'+f+'*0.9,"NORMAL / SIN OFERTA"))))))'
      );

      if (fechaVencimiento) sheetInventario.getRange(f, 16).setValue(fechaVencimiento);

      const fechaNuevo = new Date();
      if (cantidad > 0 || precioCosto || precioVenta) {
        sheetHistorial.appendRow([
          fechaNuevo, producto, cantidad, nuevoStock, nuevoId,
          proveedor || '', precioCosto || '', precioVenta || '', fechaVencimiento || '',
          datos.idOperacion || '', 0  // J: idOperacion, K: stockAnterior (0 = producto nuevo)
        ]);
      }

      let mensajeNuevo = '✅ Producto NUEVO creado!\n📦 ' + producto + '\n🆔 ' + nuevoId + '\n📊 Stock inicial: ' + nuevoStock;
      if (precioVenta) mensajeNuevo += '\n💰 Precio venta: $' + precioVenta;
      mensajeNuevo += categoriaFinal === 'ALMACEN' && !datos.categoria
        ? '\n\n⚠️ No se seleccionó categoría (se asignó ALMACEN por defecto)'
        : '\n\n📂 Categoría: ' + categoriaFinal;

      return { success: true, mensaje: mensajeNuevo, nuevoStock: nuevoStock, esNuevo: true, idOperacion: datos.idOperacion || '' };
    }

    // ── PRODUCTO EXISTENTE ──
    const nuevoStock = (datos.stockDirecto !== undefined && datos.stockDirecto !== null)
      ? Number(datos.stockDirecto)
      : stockActual + cantidad;
    sheetInventario.getRange(filaProducto, 6).setValue(nuevoStock);

    if (proveedor) sheetInventario.getRange(filaProducto, 5).setValue(proveedor);
    if (precioVenta && precioVenta > 0) sheetInventario.getRange(filaProducto, 2).setValue(precioVenta);
    // v10.2 — persistir el costo en col S (19) del Inventario cuando se
    // ingresa uno real. Antes esta columna nunca se escribía desde acá (solo
    // se leía), así que el listado del POS mostraba "Sin dato" apenas el
    // ÚLTIMO ingreso se hacía sin costo, aunque hubiera un costo cargado en
    // ingresos anteriores. Solo se escribe si viene un costo > 0 — nunca se
    // pisa con vacío, para no perder el último costo real conocido.
    if (precioCosto && precioCosto > 0) sheetInventario.getRange(filaProducto, 19).setValue(precioCosto);
    if (fechaVencimiento) sheetInventario.getRange(filaProducto, 16).setValue(fechaVencimiento);
    if (datos.nombreNuevo && datos.nombreNuevo.trim()) sheetInventario.getRange(filaProducto, 1).setValue(datos.nombreNuevo.trim().toUpperCase());
    if (datos.categoria && datos.categoria.trim()) sheetInventario.getRange(filaProducto, 3).setValue(datos.categoria.trim().toUpperCase());

    const fecha = new Date();
    const tz   = Session.getScriptTimeZone();
    const fechaStr = Utilities.formatDate(fecha, tz, 'yyyy-MM-dd');
    const horaStr  = Utilities.formatDate(fecha, tz, 'HH:mm');

    // ── REGISTRAR EN SALIDAS si es retiro por vencimiento (stockDirecto=0 y cantidad=0) ──
    const esRetiroVencido = esAjusteDirecto && Number(datos.stockDirecto) === 0 && cantidad === 0 && stockActual > 0;
    if (esRetiroVencido) {
      var shSal = ss.getSheetByName('SALIDAS');
      if (!shSal) {
        shSal = ss.insertSheet('SALIDAS');
        shSal.getRange(1, 1, 1, 10).setValues([['Fecha','Hora','Producto','ID','Cantidad','Costo Unit.','Precio Venta','Motivo','Observación','Vendedor']]);
        shSal.getRange(1, 1, 1, 10).setFontWeight('bold');
      }
      // Obtener ID del producto
      var idProd = datosInventario[filaProducto - 1][3] || '';
      var costoProd = datosInventario[filaProducto - 1][18] || 0; // col S = costo
      var precioProd = datosInventario[filaProducto - 1][1] || 0; // col B = precio venta
      shSal.appendRow([
        fechaStr, horaStr,
        producto, idProd,
        stockActual, costoProd, precioProd,
        'VENCIDO', 'Auto-retiro por vencimiento', datos.vendedor || ''
      ]);
    }

    // Solo escribir en Historial si es un ingreso real (cantidad > 0) o si trae precio/costo
    const esIngresoReal = cantidad > 0 || precioCosto || precioVenta;
    if (esIngresoReal) {
      sheetHistorial.appendRow([
        fecha, producto, cantidad, nuevoStock, '',
        proveedor || '', precioCosto || '', precioVenta || '', fechaVencimiento || '',
        datos.idOperacion || '', stockActual  // J: idOperacion, K: stockAnterior (para poder deshacer)
      ]);
    }

    let mensaje = '✅ Ingreso exitoso!\n📦 ' + producto + '\n➕ Cantidad: ' + cantidad + '\n📊 Stock: ' + stockActual + ' → ' + nuevoStock;
    if (precioVenta) mensaje += '\n💰 Precio venta actualizado: $' + precioVenta;

    return { success: true, mensaje: mensaje, nuevoStock: nuevoStock, idOperacion: datos.idOperacion || '' };
  } catch (error) {
    console.error('Error ingresarMercaderia:', error);
    return { success: false, mensaje: 'Error: ' + error.toString() };
  }
  } finally {
    lockIngreso.releaseLock();
  }
}

// ========== AJUSTE RÁPIDO ==========
function ajustarProducto(datos) {
  try {
    const ss = SpreadsheetApp.openById(SS_ID);
    const sheetInventario = ss.getSheetByName(HOJA_INVENTARIO);

    let sheetAjuste = ss.getSheetByName(HOJA_AJUSTE_RAPIDO);
    if (!sheetAjuste) {
      sheetAjuste = ss.insertSheet(HOJA_AJUSTE_RAPIDO);
      sheetAjuste.appendRow([
        'FECHA', 'PRODUCTO', 'NOMBRE ANTES', 'NOMBRE DESPUÉS',
        'STOCK ANTES', 'STOCK DESPUÉS', 'PRECIO ANTES', 'PRECIO DESPUÉS',
        'CATEGORÍA ANTES', 'CATEGORÍA DESPUÉS', 'USUARIO'
      ]);
      sheetAjuste.getRange(1, 1, 1, 11).setBackground('#37474f').setFontColor('white').setFontWeight('bold');
    }

    const producto = String(datos.producto || '').trim();
    if (!producto) return { success: false, mensaje: 'Nombre de producto vacío' };

    const datosInv = sheetInventario.getDataRange().getValues();
    let filaProducto = -1;
    let stockActual = 0, precioActual = 0, catActual = '', nombreActual = '';
    const productoNorm = producto.toUpperCase().replace(/\s+/g, ' ');

    for (let i = 1; i < datosInv.length; i++) {
      if (!datosInv[i][0]) continue;
      const nombreEnSheet = String(datosInv[i][0]).trim().toUpperCase().replace(/\s+/g, ' ');
      if (nombreEnSheet === productoNorm) {
        filaProducto = i + 1;
        nombreActual = String(datosInv[i][0]).trim();
        precioActual = Number(datosInv[i][1]) || 0;
        catActual    = String(datosInv[i][2] || '').trim();
        stockActual  = Number(datosInv[i][5]) || 0;
        break;
      }
    }

    if (filaProducto === -1) return { success: false, mensaje: 'Producto no encontrado: ' + producto };

    // v10.11/v10.13/v10.14 — editor rápido de Multicompra: movido a
    // _ajustarMulticompraProducto_() en multicompra.gs (mismo
    // comportamiento exacto — lee/escribe las mismas columnas, misma
    // lógica de "completar tipo automático" — solo cambia de archivo).
    const mcCambios = _ajustarMulticompraProducto_(sheetInventario, filaProducto, datosInv, datos);

    const stockNuevo  = (datos.stockDespues !== undefined && datos.stockDespues !== null) ? Number(datos.stockDespues) : stockActual;
    const precioNuevo = datos.precioDespues ? Number(datos.precioDespues) : precioActual;
    const nombreNuevo = datos.nombreNuevo   ? String(datos.nombreNuevo).trim().toUpperCase() : nombreActual;
    const catNueva    = datos.categoriaDespues ? String(datos.categoriaDespues).trim().toUpperCase() : catActual;

    const stockRegistroAntes  = (datos.stockAntes !== undefined && datos.stockAntes !== null) ? Number(datos.stockAntes) : stockActual;
    const precioRegistroAntes = datos.precioAntes ? Number(datos.precioAntes) : precioActual;

    sheetInventario.getRange(filaProducto, 6).setValue(stockNuevo);
    if (precioNuevo !== precioActual)   sheetInventario.getRange(filaProducto, 2).setValue(precioNuevo);
    if (nombreNuevo !== nombreActual)   sheetInventario.getRange(filaProducto, 1).setValue(nombreNuevo);
    if (catNueva    !== catActual)      sheetInventario.getRange(filaProducto, 3).setValue(catNueva);

    // v18/09/2026 — editor rápido de 2x1 real (columna AL / COL_OFERTA_2X1).
    // datos.oferta2x1 siempre viaja como true/false desde el checkbox del
    // modal — se compara contra el valor real actual antes de escribir,
    // para no tocar la columna si no cambió.
    const oferta2x1Actual = datosInv[filaProducto - 1].length > 37 ? _esActivoFlag_(datosInv[filaProducto - 1][37]) : false;
    const oferta2x1Nueva  = (typeof datos.oferta2x1 === 'boolean') ? datos.oferta2x1 : oferta2x1Actual;
    if (oferta2x1Nueva !== oferta2x1Actual) {
      sheetInventario.getRange(filaProducto, COL_OFERTA_2X1).setValue(oferta2x1Nueva ? 'TRUE' : 'FALSE');
    }

    const fechaAj = new Date();
    sheetAjuste.appendRow([
      fechaAj, producto,
      nombreActual,          nombreNuevo  !== nombreActual  ? nombreNuevo  : '',
      stockRegistroAntes,    stockNuevo,
      precioRegistroAntes,   precioNuevo  !== precioRegistroAntes ? precioNuevo : '',
      catActual,             catNueva     !== catActual     ? catNueva     : '',
      'POS'
    ]);

    let cambios = [];
    if (stockNuevo !== stockRegistroAntes)   cambios.push('Stock: ' + stockRegistroAntes + ' → ' + stockNuevo);
    if (precioNuevo !== precioRegistroAntes)  cambios.push('Precio: $' + precioRegistroAntes + ' → $' + precioNuevo);
    if (nombreNuevo !== nombreActual)         cambios.push('Nombre: ' + nombreActual + ' → ' + nombreNuevo);
    if (catNueva    !== catActual)            cambios.push('Categoría: ' + catActual + ' → ' + catNueva);
    if (oferta2x1Nueva !== oferta2x1Actual)   cambios.push('2x1 real: ' + (oferta2x1Actual ? 'activo' : 'inactivo') + ' → ' + (oferta2x1Nueva ? 'activo' : 'inactivo'));
    cambios = cambios.concat(mcCambios);

    return { success: true, mensaje: '✅ Ajuste guardado\n' + cambios.join('\n'), stockNuevo: stockNuevo };
  } catch (error) {
    console.error('Error ajustarProducto:', error);
    return { success: false, mensaje: 'Error: ' + error.toString() };
  }
}

// ========== v10.18 — CACHÉ DE ROTACIÓN Y TEXTOS DE OFERTA ==========
// PERF: doGet llamaba en vivo a calcularRotacionAuto() (escanea Ventas
// completa + Historial completa) y a getTextoOfertaPersonalizada_() /
// getTextoOfertaSimple_() (cada una reabre la planilla) en CADA carga de
// CUALQUIER app del ecosistema. Con Ventas/Historial creciendo día a día
// esto empujó el doGet a 6-8s, por encima del timeout del cliente →
// "no responde" aunque en Google figure "Completada".
// Solución: estos 3 resultados ahora se guardan en CacheService y un
// trigger periódico (ver refrescarCacheRotacionYOfertas más abajo) los
// refresca. doGet lee el caché; si está vacío o falla (primera vez, o
// el trigger todavía no corrió), cae de vuelta al cálculo en vivo de
// SIEMPRE — cero cambio de comportamiento, solo más rápido cuando hay
// caché disponible. No se tocó ninguna lógica de negocio existente.
function _cachePut_(key, valor, ttlSeg) {
  try {
    CacheService.getScriptCache().put(key, JSON.stringify({ v: valor }), ttlSeg || 21600);
  } catch (e) {
    console.warn('⚠️ _cachePut_ falló para ' + key + ':', e.toString());
  }
}
function _cacheGet_(key) {
  try {
    const raw = CacheService.getScriptCache().get(key);
    if (raw === null) return { hit: false, valor: null };
    return { hit: true, valor: JSON.parse(raw).v };
  } catch (e) {
    console.warn('⚠️ _cacheGet_ falló para ' + key + ':', e.toString());
    return { hit: false, valor: null };
  }
}
// Trigger de tiempo: agregar manualmente en Apps Script → Activadores,
// función refrescarCacheRotacionYOfertas, cada 5-10 min (mismo ritmo que
// refrescarCacheInventarioVoz que ya tenés corriendo).
function refrescarCacheRotacionYOfertas() {
  try {
    _cachePut_('CACHE_ROTACION_AUTO', calcularRotacionAuto());
    _cachePut_('CACHE_TEXTO_OFERTA_PERSONALIZADA', getTextoOfertaPersonalizada_());
    _cachePut_('CACHE_TEXTO_OFERTA_SIMPLE', getTextoOfertaSimple_());
    console.log('✅ Caché rotación/ofertas refrescado');
  } catch (e) {
    console.warn('⚠️ refrescarCacheRotacionYOfertas falló:', e.toString());
  }
}

// ========== ROTACIÓN AUTOMÁTICA ==========
function calcularRotacionAuto() {
  try {
    const ss = SpreadsheetApp.openById(SS_ID);

    const sheetVentas = ss.getSheetByName('Ventas');
    const ventasMap = {};
    if (sheetVentas) {
      const filas = sheetVentas.getDataRange().getValues();
      const hace30 = new Date();
      hace30.setDate(hace30.getDate() - 30);
      for (let i = 1; i < filas.length; i++) {
        const f = filas[i];
        if (!f[0] || !f[3]) continue;
        const nombre = String(f[3]).trim().toUpperCase();
        if (nombre.includes('TOTAL TICKET') || nombre.startsWith('─')) continue;
        const fecha = f[1] instanceof Date ? f[1] : new Date(f[1]);
        if (isNaN(fecha.getTime()) || fecha < hace30) continue;
        const qty = parseFloat(String(f[4]).replace('gr','').replace('kg','')) || 0;
        ventasMap[nombre] = (ventasMap[nombre] || 0) + qty;
      }
    }

    const sheetHist = ss.getSheetByName(HOJA_HISTORIAL);
    const ingresosMap = {};
    if (sheetHist) {
      const filas = sheetHist.getDataRange().getValues();
      const hace90 = new Date();
      hace90.setDate(hace90.getDate() - 90);
      for (let i = 1; i < filas.length; i++) {
        const f = filas[i];
        if (!f[1]) continue;
        const nombre = String(f[1]).trim().toUpperCase();
        const fecha = f[0] instanceof Date ? f[0] : new Date(f[0]);
        if (isNaN(fecha.getTime()) || fecha < hace90) continue;
        ingresosMap[nombre] = (ingresosMap[nombre] || 0) + 1;
      }
    }

    const rotacionMap = {};
    const todosLosNombres = new Set([...Object.keys(ventasMap), ...Object.keys(ingresosMap)]);

    todosLosNombres.forEach(function(nombre) {
      const u = ventasMap[nombre] || 0;
      const v = ingresosMap[nombre] || 0;

      let bVentas = null;
      if      (u >= 8) bVentas = 5;
      else if (u >= 5) bVentas = 4;
      else if (u >= 3) bVentas = 3;
      else if (u >= 1) bVentas = 2;

      let bRepo = 1;
      if      (v >= 12) bRepo = 5;
      else if (v >= 6)  bRepo = 4;
      else if (v >= 3)  bRepo = 3;
      else if (v >= 1)  bRepo = 2;

      const combinado = bVentas !== null
        ? Math.round(bVentas * 0.7 + bRepo * 0.3)
        : bRepo;

      rotacionMap[nombre] = Math.max(1, Math.min(5, combinado));
    });

    if (calcularRotacionAuto._escribir) {
      const sheetInv = ss.getSheetByName(HOJA_INVENTARIO);
      const invDatos = sheetInv.getDataRange().getValues();
      const COL_ROTACION = 15;
      const actualizaciones = [];
      for (let i = 1; i < invDatos.length; i++) {
        const nombre = String(invDatos[i][0] || '').trim().toUpperCase();
        if (!nombre) continue;
        const rot = rotacionMap[nombre] || (parseInt(invDatos[i][14]) || 1);
        actualizaciones.push({ fila: i + 1, valor: rot });
      }
      actualizaciones.forEach(function(a) {
        sheetInv.getRange(a.fila, COL_ROTACION).setValue(a.valor);
      });
      console.log('✅ Rotación escrita en columna O: ' + actualizaciones.length + ' productos');
    }

    return rotacionMap;

  } catch(e) {
    console.warn('⚠️ calcularRotacionAuto falló, usando columna O:', e.toString());
    return {};
  }
}

function actualizarRotacionPlanilla() {
  calcularRotacionAuto._escribir = true;
  const mapa = calcularRotacionAuto();
  calcularRotacionAuto._escribir = false;
  const total = Object.keys(mapa).length;
  console.log('📊 Rotación actualizada para ' + total + ' productos');
  return { success: true, total: total };
}

// ========== ACTUALIZAR STOCK MÍNIMOS (columna N) ==========
function actualizarStockMinimos() {
  try {
    const ss = SpreadsheetApp.openById(SS_ID);
    const sheetVentas = ss.getSheetByName('Ventas');
    const sheetInv    = ss.getSheetByName(HOJA_INVENTARIO);
    if (!sheetVentas || !sheetInv) return { success: false, mensaje: 'Faltan hojas' };

    const hoy   = new Date();
    const hace7 = new Date(hoy - 7 * 24 * 60 * 60 * 1000);

    const ventas = sheetVentas.getDataRange().getValues();
    const ventasProd = {};

    for (let i = 1; i < ventas.length; i++) {
      const f = ventas[i];
      const fecha = f[1];
      if (!(fecha instanceof Date) || fecha < hace7) continue;
      const nombre = String(f[3] || '').trim();
      if (!nombre || nombre.includes('TOTAL TICKET') || nombre.startsWith('─')) continue;

      const nomLimpio = nombre
        .replace(/\[PRECIO ESP[^\]]*\]/i, '')
        .replace(/\s*\(\d+gr\)/i, '')
        .replace(/\s*\(\d+\.?\d*kg\)/i, '')
        .trim()
        .toUpperCase();

      const qty = parseFloat(String(f[4] || '0').replace('gr','').replace('kg','')) || 0;
      const esGramos = /\(\d+gr\)/i.test(nombre) && qty >= 50;
      const qtdReal  = esGramos ? qty / 1000 : qty;

      ventasProd[nomLimpio] = (ventasProd[nomLimpio] || 0) + qtdReal;
    }

    const inv = sheetInv.getDataRange().getValues();
    let actualizados = 0;
    let sinDatos = 0;

    for (let i = 1; i < inv.length; i++) {
      const nombre = String(inv[i][0] || '').trim().toUpperCase();
      if (!nombre) continue;

      const totalVendido   = ventasProd[nombre] || 0;
      const promedioDiario = totalVendido / 7;
      const stockMinimo    = promedioDiario > 0
        ? Math.ceil(promedioDiario * 2)
        : 1;

      if (totalVendido === 0) sinDatos++;

      const actualActual = parseInt(inv[i][13]) || 0;
      if (actualActual !== stockMinimo) {
        sheetInv.getRange(i + 1, 14).setValue(stockMinimo);
        actualizados++;
      }
    }

    console.log('✅ Stock mínimos actualizados: ' + actualizados + ' productos');
    return {
      success: true,
      mensaje: '✅ Stock mínimos: ' + actualizados + ' actualizados · ' + sinDatos + ' sin datos',
      actualizados,
      sinDatos
    };

  } catch(e) {
    console.error('Error actualizarStockMinimos:', e);
    return { success: false, mensaje: e.toString() };
  }
}

// ========== ACTUALIZAR ESTADÍSTICAS ==========
function actualizarEstadisticas() {
  const rotacion = actualizarRotacionPlanilla();
  const minimos  = actualizarStockMinimos();
  console.log('📊 Rotación:', rotacion.total, '| Mínimos:', minimos.actualizados);
  return { success: true, rotacion, minimos };
}

// ========== HELPERS MOTOR OFERTAS ==========
function _ofertaDiasVencer_(fila) {
  try {
    const v = fila.length > 15 ? fila[15] : '';
    if (!v) return null;
    const d = v instanceof Date ? v : new Date(v);
    if (isNaN(d.getTime())) return null;
    return Math.round((d - new Date()) / (1000 * 60 * 60 * 24));
  } catch(e) { return null; }
}

function _ofertaDiasDesdePromo_(fila) {
  try {
    const v = fila.length > 17 ? fila[17] : '';
    if (!v) return null;
    const d = v instanceof Date ? v : new Date(v);
    if (isNaN(d.getTime())) return null;
    return Math.round((new Date() - d) / (1000 * 60 * 60 * 24));
  } catch(e) { return null; }
}

function _ofertaPuntaje_(fila) {
  var p = 0;
  var dv = _ofertaDiasVencer_(fila);
  var dp = _ofertaDiasDesdePromo_(fila);
  var stock = parseInt(fila[5]) || 0;
  var rotacion = fila.length > 14 ? (parseInt(fila[14]) || 0) : 0;
  var precio = parseInt(fila[1]) || 0;
  if (dp !== null && dp < 15) return -99;
  if (dv !== null) {
    if (dv <= 3) p += 5;
    else if (dv <= 7 && stock >= 5) p += 4;
  }
  if (rotacion >= 3) p += 3;
  if (precio > 1000) p += 2;
  return p;
}

function _ofertaBuildProducto_(fila, i) {
  var tz = Session.getScriptTimeZone();
  var venc = '';
  try {
    var v = fila.length > 15 ? fila[15] : '';
    if (v) {
      venc = v instanceof Date ? Utilities.formatDate(v, tz, 'yyyy-MM-dd') : String(v).trim();
    }
  } catch(e) {}
  var dpv = _ofertaDiasVencer_(fila);
  var estadoVencimiento = 'ok';
  if (dpv !== null) {
    if (dpv <= 0)  estadoVencimiento = 'vencido';
    else if (dpv <= 3)  estadoVencimiento = 'urgente';
    else if (dpv <= 15) estadoVencimiento = 'proximo';
  }
  return {
    id:                i,
    name:              String(fila[0] || '').trim(),
    price:             parseInt(fila[1]) || 0,
    category:          String(fila[2] || 'ALMACEN').trim().toUpperCase(),
    stock:             parseInt(fila[5]) || 0,
    relampago:         parseInt(fila[6]) || 0,
    destacada:         parseInt(fila[7]) || 0,
    especial:          parseInt(fila[8]) || 0,
    rotacion:          fila.length > 14 ? (parseInt(fila[14]) || 0) : 0,
    vencimiento:       venc,
    diasParaVencer:    dpv,
    estadoVencimiento: estadoVencimiento,
    puntaje:           _ofertaPuntaje_(fila)
  };
}

// ========== HELPERS DE OFERTAS ==========
function _esActivoFlag_(valor) {
  if (valor === true) return true;
  if (valor === false || valor === null || valor === undefined) return false;
  var s = String(valor).trim().toUpperCase();
  return s === 'SI' || s === 'SÍ' || s === 'TRUE' || s === 'VERDADERO' || s === 'X' || s === '1';
}

// v11.0 — _validarMulticompra_ se movió a multicompra.gs (separación de
// archivos por tema, mismo proyecto Apps Script → sigue siendo global,
// se sigue llamando igual desde acá y desde doGet). Ver ese archivo para
// el comentario original completo.

function calcularOfertas() {
  var ss = SpreadsheetApp.openById(SS_ID);
  var sheet = ss.getSheetByName(HOJA_INVENTARIO);
  var datos = sheet.getDataRange().getValues();

  var limites = { relampago: 3, especiales: 2, destacadas: 9, multicompra: 6 };
  var horariosOferta = {
    relampago:  { inicio: 0,  cierre: 24, activo: false },
    destacadas: { inicio: 0,  cierre: 24, activo: false },
    especiales: { inicio: 0,  cierre: 24, activo: false },
    ultimas:    { inicio: 0,  cierre: 24, activo: true  }  // activo:true por defecto — el horario específico se lee desde config
  };
  var _inicioRelampago = null, _cierreRelampago = null;
  var _inicioDestacadas = null, _cierreDestacadas = null;
  var _inicioEspeciales = null, _cierreEspeciales = null;
  var _inicioUltimas = null, _cierreUltimas = null;

  var diaIdxJC = [1,2,3,4,5,6,0].indexOf(new Date().getDay());
  var tzNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));
  var horaActual = tzNow.getHours() + tzNow.getMinutes() / 60;

  // Leer todos los límites y horarios desde config_sistema al inicio
  try {
    var shCfgLim = ss.getSheetByName(HOJA_CONFIG);
    if (shCfgLim) {
      var cfgLim = shCfgLim.getDataRange().getValues();

      // Helper: parsear hora de celda (número o "HH:MM")
      function _parsearHora_(val) {
        if (val === null || val === undefined || val === '') return null;
        // ISO string: Google Sheets manda horas como "1899-12-30T21:00:00.000Z"
        if (typeof val === 'string' && val.includes('T')) {
          try {
            var d = new Date(val);
            return ((d.getUTCHours() - 3 + 24) % 24) + d.getUTCMinutes() / 60;
          } catch(e) { return null; }
        }
        // Fracción de día (0-1)
        if (typeof val === 'number') {
          if (val > 0 && val < 1) return val * 24;
          return val;
        }
        var s = String(val).trim();
        var m = s.match(/^(\d{1,2}):(\d{2})/);
        if (m) return parseInt(m[1]) + parseInt(m[2]) / 60;
        var n = parseFloat(s);
        return isNaN(n) ? null : n;
      }

      // Helper: verificar si el modo A respeta el horario
      function _estaActivoHoy_(diasVal, inicioVal, cierreVal) {
        var d = String(diasVal || '').trim().toUpperCase();
        if (d === '0') return false;           // desactivado forzado
        if (d === '1') return true;            // activado forzado
        // modo A: respetar horario
        var ini = _parsearHora_(inicioVal);
        var cie = _parsearHora_(cierreVal);
        if (ini === null || cie === null) return true;
        if (cie > ini) return horaActual >= ini && horaActual < cie;
        // horario que cruza medianoche
        return horaActual >= ini || horaActual < cie;
      }

      for (var li = 0; li < cfgLim.length; li++) {
        var lk = String(cfgLim[li][0] || '').trim().toLowerCase();
        var lv = cfgLim[li][diaIdxJC + 1];

        // Límites
        if (lk.indexOf('maximo relampago') !== -1 || lk.indexOf('máximo relampago') !== -1) { var n = parseInt(lv); if (!isNaN(n) && n > 0) limites.relampago = n; }
        if (lk.indexOf('maximo especiales') !== -1 || lk.indexOf('máximo especiales') !== -1) { var n = parseInt(lv); if (!isNaN(n) && n > 0) limites.especiales = n; }
        if (lk.indexOf('maximo destacadas') !== -1 || lk.indexOf('máximo destacadas') !== -1) { var n = parseInt(lv); if (!isNaN(n) && n > 0) limites.destacadas = n; }
        // Multicompra: a diferencia de relámpago/especiales/destacadas, NO varía por día —
        // es un único número (como columnas_catalogo). Se lee siempre de la columna B,
        // nunca de la columna del día actual (lv), para no depender de llenar las 7 columnas.
        if (lk.indexOf('maximo multicompra') !== -1 || lk.indexOf('máximo multicompra') !== -1) { var nMC = parseInt(cfgLim[li][1]); if (!isNaN(nMC) && nMC > 0) limites.multicompra = nMC; }

        // Horarios — claves únicas y descriptivas
        if (lk === 'hora inicio relampago')         _inicioRelampago  = _parsearHora_(lv);
        if (lk === 'hora cierre relampago')         _cierreRelampago  = _parsearHora_(lv);
        if (lk === 'hora inicio destacadas')        _inicioDestacadas = _parsearHora_(lv);
        if (lk === 'hora cierre destacadas')        _cierreDestacadas = _parsearHora_(lv);
        if (lk === 'hora inicio especiales')        _inicioEspeciales = _parsearHora_(lv);
        if (lk === 'hora cierre especiales')        _cierreEspeciales = _parsearHora_(lv);
        if (lk === 'hora inicio ultimas unidades' || lk === 'hora inicio últimas unidades') _inicioUltimas = _parsearHora_(lv);
        if (lk === 'hora cierre ultimas unidades' || lk === 'hora cierre últimas unidades') _cierreUltimas = _parsearHora_(lv);

        // Flag días
        if (lk === 'dias ofertas relampago' || lk === 'dias ofertas relámpago') {
          horariosOferta.relampago.activo = _estaActivoHoy_(lv, _inicioRelampago, _cierreRelampago);
        }
        if (lk === 'dias ofertas destacadas') {
          horariosOferta.destacadas.activo = _estaActivoHoy_(lv, _inicioDestacadas, _cierreDestacadas);
        }
        if (lk === 'dias ofertas especiales') {
          horariosOferta.especiales.activo = _estaActivoHoy_(lv, _inicioEspeciales, _cierreEspeciales);
        }
        if (lk === 'dias ofertas ultimas unidades' || lk === 'dias ofertas últimas unidades') {
          horariosOferta.ultimas.activo = _estaActivoHoy_(lv, _inicioUltimas, _cierreUltimas);
        }
      }
    }
  } catch(eLim) { Logger.log('Error leyendo config: ' + eLim); }

  var relampagoActivo = [];
  var idsUsados = {};
  var cerveceroActivoHoy = false;
  try {
    var shCfgJC = ss.getSheetByName(HOJA_CONFIG);
    if (shCfgJC) {
      var cfgJC = shCfgJC.getDataRange().getValues();
      for (var cji = 0; cji < cfgJC.length; cji++) {
        var cjClave = String(cfgJC[cji][0] || '').trim().toLowerCase();
        if (cjClave.includes('jueves cervecero') || cjClave.includes('cervecero')) {
          var cjVal = cfgJC[cji][diaIdxJC + 1];
          cerveceroActivoHoy = (cjVal === 1 || cjVal === '1' || cjVal === true);
          break;
        }
      }
    }
  } catch(eCJ) {}

  function _esCerveza_(fila) {
    var nom = String(fila[0] || '').trim().toUpperCase();
    var cat = String(fila[2] || '').trim().toUpperCase();
    return cat.includes('CERV') || nom.includes('CERVEZA') || nom.includes(' LATA') ||
           nom.includes('BIRRA') || nom.includes(' IPA') || nom.includes(' STOUT') || nom.includes(' PORTER');
  }

  // Helper: detecta si la columna J dice que hay que reponer stock para la promo
  function _stockSuficienteParaOferta_(fila) {
    var catOferta = String(fila[9] || '').trim().toUpperCase();
    // Si dice REPONER → stock insuficiente para la promo
    if (catOferta.indexOf('REPONER') !== -1) return false;
    // Verificar stock mínimo según tipo de promo
    var stock = parseInt(fila[5]) || 0;
    if (catOferta.indexOf('3X2') !== -1 || catOferta.indexOf('3 X 2') !== -1) return stock >= 3;
    if (catOferta.indexOf('2X1') !== -1 || catOferta.indexOf('2 X 1') !== -1) return stock >= 2;
    if (catOferta.indexOf('4X3') !== -1 || catOferta.indexOf('4 X 3') !== -1) return stock >= 4;
    return stock >= 1;
  }

  var candidatosRelampago = [];
  for (var i3 = 1; i3 < datos.length; i3++) {
    var fila3 = datos[i3];
    if (!fila3[0]) continue;
    if (idsUsados[i3]) continue;
    var stock3 = parseInt(fila3[5]) || 0;
    var relampago3 = parseInt(fila3[6]) || 0;
    if (stock3 <= 0 || relampago3 <= 0) continue;
    if (!_stockSuficienteParaOferta_(fila3)) continue; // columna J: REPONER o stock insuficiente
    var cat3 = String(fila3[2] || '').trim().toUpperCase();
    if (cat3 === 'CERVEZAS') continue;
    if (cerveceroActivoHoy && _esCerveza_(fila3)) continue;
    candidatosRelampago.push({ fila: fila3, i: i3, p: _ofertaPuntaje_(fila3) });
  }

  candidatosRelampago.sort(function(a, b) { return b.p - a.p; });

  var relampagoCandidatosParaRotar = candidatosRelampago;
  if (relampagoCandidatosParaRotar.length > limites.relampago) {
    var tzDateR   = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));
    var dateKeyR  = tzDateR.getFullYear() + '-' +
                    String(tzDateR.getMonth() + 1).padStart(2, '0') + '-' +
                    String(tzDateR.getDate()).padStart(2, '0');
    var argDateR  = new Date(dateKeyR);
    var dayOfYearR = Math.floor((argDateR - new Date(argDateR.getFullYear(), 0, 0)) / 86400000);
    var totalSetsR = Math.ceil(relampagoCandidatosParaRotar.length / limites.relampago);
    var setNumberR = dayOfYearR % totalSetsR;
    var startIdxR  = (setNumberR * limites.relampago) % relampagoCandidatosParaRotar.length;
    var rotadosR   = [];
    for (var rri = 0; rri < limites.relampago; rri++) {
      rotadosR.push(relampagoCandidatosParaRotar[(startIdxR + rri) % relampagoCandidatosParaRotar.length]);
    }
    relampagoCandidatosParaRotar = rotadosR;
  }

  var relampagoPoolCompleto = candidatosRelampago.map(function(c) {
    return _ofertaBuildProducto_(c.fila, c.i);
  });

  relampagoCandidatosParaRotar.forEach(function(c) {
    relampagoActivo.push(_ofertaBuildProducto_(c.fila, c.i));
  });

  var destacadasActivas = [];
  var especialesActivas = [];
  for (var idx = 1; idx < datos.length; idx++) {
    var fd = datos[idx];
    if (!fd[0]) continue;
    var stockD = parseInt(fd[5]) || 0;
    if (stockD <= 0) continue;
    if (!_stockSuficienteParaOferta_(fd)) continue; // columna J: REPONER o stock insuficiente
    if (cerveceroActivoHoy && _esCerveza_(fd)) continue;
    if ((parseInt(fd[7]) || 0) > 0) destacadasActivas.push(_ofertaBuildProducto_(fd, idx));
    if ((parseInt(fd[8]) || 0) > 0) especialesActivas.push(_ofertaBuildProducto_(fd, idx));
  }

  var especialesPool = especialesActivas;
  if (especialesActivas.length > limites.especiales) {
    var tzDate    = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));
    var dateKey   = tzDate.getFullYear() + '-' +
                    String(tzDate.getMonth() + 1).padStart(2, '0') + '-' +
                    String(tzDate.getDate()).padStart(2, '0');
    var argDate   = new Date(dateKey);
    var dayOfYear = Math.floor((argDate - new Date(argDate.getFullYear(), 0, 0)) / 86400000);
    var totalSets = Math.ceil(especialesActivas.length / limites.especiales);
    var setNumber = dayOfYear % totalSets;
    var startIdx  = (setNumber * limites.especiales) % especialesActivas.length;
    var rotados   = [];
    for (var ri = 0; ri < limites.especiales; ri++) {
      rotados.push(especialesActivas[(startIdx + ri) % especialesActivas.length]);
    }
    especialesActivas = rotados;
  }

  var destacadasPool = destacadasActivas.slice();
  var destacadasRotadas = destacadasActivas.slice();
  if (destacadasActivas.length > limites.destacadas) {
    var tzDateD   = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));
    var dateKeyD  = tzDateD.getFullYear() + '-' +
                    String(tzDateD.getMonth() + 1).padStart(2, '0') + '-' +
                    String(tzDateD.getDate()).padStart(2, '0');
    var argDateD  = new Date(dateKeyD);
    var dayOfYearD = Math.floor((argDateD - new Date(argDateD.getFullYear(), 0, 0)) / 86400000);
    var totalSetsD = Math.ceil(destacadasActivas.length / limites.destacadas);
    var setNumberD = dayOfYearD % totalSetsD;
    var startIdxD  = (setNumberD * limites.destacadas) % destacadasActivas.length;
    destacadasRotadas = [];
    for (var rdi = 0; rdi < limites.destacadas; rdi++) {
      destacadasRotadas.push(destacadasActivas[(startIdxD + rdi) % destacadasActivas.length]);
    }
  }

  var poolRecienLlegados = [];

  // Respetar horarios: vaciar pools inactivos segun config_sistema
  if (!horariosOferta.relampago.activo)  { relampagoActivo = []; relampagoPoolCompleto = []; }
  if (!horariosOferta.destacadas.activo) { destacadasActivas = []; destacadasRotadas = []; destacadasPool = []; }
  if (!horariosOferta.especiales.activo) { especialesActivas = []; especialesPool = []; }
  // Leer configuracion de Recien Llegados desde config_sistema
  var precioMinVidriera   = 2000; // fallback RECIEN_LLEGADOS_PRECIO_MIN
  var limiteRecienLlegados = 12;  // fallback RECIEN_LLEGADOS_LIMITE
  var diasRecienLlegados  = 7;    // fallback RECIEN_LLEGADOS_DIAS
  try {
    var shCfgRL = ss.getSheetByName(HOJA_CONFIG);
    if (shCfgRL) {
      var cfgRL = shCfgRL.getDataRange().getValues();
      for (var ci = 1; ci < cfgRL.length; ci++) {
        var ck = String(cfgRL[ci][0] || '').trim().toUpperCase();
        if (ck === 'RECIEN_LLEGADOS_PRECIO_MIN') {
          var cv = parseInt(cfgRL[ci][1]);
          if (!isNaN(cv) && cv >= 0) precioMinVidriera = cv;
        }
        if (ck === 'RECIEN_LLEGADOS_LIMITE') {
          var cl = parseInt(cfgRL[ci][1]);
          if (!isNaN(cl) && cl > 0) limiteRecienLlegados = cl;
        }
        if (ck === 'RECIEN_LLEGADOS_DIAS') {
          var cd = parseInt(cfgRL[ci][1]);
          if (!isNaN(cd) && cd > 0) diasRecienLlegados = cd;
        }
      }
    }
  } catch(eCfgRL) { Logger.log('Error leyendo config Recien Llegados: ' + eCfgRL); }
  try {
    var shHistRL = ss.getSheetByName(HOJA_HISTORIAL);
    var shInvRL  = ss.getSheetByName(HOJA_INVENTARIO);
    if (shHistRL && shInvRL) {
      var hoyRL = new Date(); hoyRL.setHours(0,0,0,0);
      var hace2 = new Date(hoyRL.getTime() - diasRecienLlegados * 86400000);
      var tzRL = Session.getScriptTimeZone();

      var ultimaFechaMap = {};
      var histRowsRL = shHistRL.getDataRange().getValues();
      for (var hi = 1; hi < histRowsRL.length; hi++) {
        var hfecha = histRowsRL[hi][0];
        var hnom   = String(histRowsRL[hi][1] || '').trim().toUpperCase();
        if (!hnom) continue;
        var hfechaD = hfecha instanceof Date ? hfecha : new Date(String(hfecha));
        if (isNaN(hfechaD.getTime())) continue;
        var dNorm = new Date(hfechaD); dNorm.setHours(0,0,0,0);
        if (dNorm < hace2) continue;
        if (!ultimaFechaMap[hnom] || hfechaD > ultimaFechaMap[hnom]) {
          ultimaFechaMap[hnom] = hfechaD;
        }
      }

      var idsOtrosPools = {};
      relampagoActivo.forEach(function(p){ idsOtrosPools[p.id] = true; });
      destacadasRotadas.forEach(function(p){ idsOtrosPools[p.id] = true; });
      especialesActivas.forEach(function(p){ idsOtrosPools[p.id] = true; });

      var invRowsRL = shInvRL.getDataRange().getValues();
      var candidatosRL = [];
      for (var ri = 1; ri < invRowsRL.length; ri++) {
        var rNom = String(invRowsRL[ri][0] || '').trim().toUpperCase();
        if (!rNom || !ultimaFechaMap[rNom]) continue;
        var rStock = parseInt(invRowsRL[ri][5]) || 0;
        if (rStock <= 0) continue;
        var rPrecio = parseInt(invRowsRL[ri][1]) || 0;
        if (rPrecio < precioMinVidriera) continue; // Precio minimo vidriera (desde config_sistema)
        if (idsOtrosPools[ri]) continue;
        candidatosRL.push({
          id:           ri,
          nombre:       String(invRowsRL[ri][0]).trim(),
          precio:       parseInt(invRowsRL[ri][1]) || 0,
          categoria:    String(invRowsRL[ri][2] || '').trim(),
          stock:        rStock,
          fechaIngreso: Utilities.formatDate(ultimaFechaMap[rNom], tzRL, 'dd/MM/yyyy'),
          _ts:          ultimaFechaMap[rNom].getTime()
        });
      }

      candidatosRL.sort(function(a, b){ return b._ts - a._ts; });
      poolRecienLlegados = candidatosRL.slice(0, limiteRecienLlegados + 10).map(function(p){
        return { id: p.id, nombre: p.nombre, precio: p.precio,
                 categoria: p.categoria, stock: p.stock, fechaIngreso: p.fechaIngreso };
      });
    }
  } catch(eRL) { Logger.log('Error poolRecienLlegados: ' + eRL); }

  // ========== MULTICOMPRA ==========
  // v11.0 — cálculo movido a _calcularMulticompraOfertas_(ss) en
  // multicompra.gs (mismo comportamiento exacto, solo cambia de archivo).
  var _resMC = _calcularMulticompraOfertas_(ss);
  var multicompraActiva = _resMC.multicompraActiva;
  var multicompraBloqueada = _resMC.multicompraBloqueada;
  // ========== FIN MULTICOMPRA ==========

  var ultimasSeleccionadasCalc = horariosOferta.ultimas.activo ? _leerUltimasConDias_() : [];

  var statsOfertas = {
    totalRelampago:          relampagoActivo.length,
    totalDestacadas:         destacadasActivas.length,
    totalEspeciales:         especialesPool.length,
    especialesMostradas:     especialesActivas.length,
    totalUltimas:            ultimasSeleccionadasCalc.length,
    totalMulticompra:        multicompraActiva.length,
    totalMulticompraBloqueada: multicompraBloqueada.length, // v10.17 — blindaje de promociones
    totalRecienLlegadosPool: poolRecienLlegados.length
  };

  try { _actualizarDiagnosticoOfertas_(statsOfertas); }
  catch(eDiag) { Logger.log('⚠️ No se pudo escribir diagnóstico de ofertas: ' + eDiag); }

  return {
    success: true,
    relampagoActivo:      relampagoActivo,
    relampagoPool:        relampagoPoolCompleto,
    destacadasActivas:    destacadasRotadas,
    destacadasPool:       destacadasPool,
    especialesActivas:    especialesActivas,
    poolRecienLlegados:     poolRecienLlegados,
    multicompraActiva:      multicompraActiva,
    multicompraBloqueada:   multicompraBloqueada, // v10.17 — alerta: promos configuradas pero no publicadas (motivo incluido)
    limiteRecienLlegados:   limiteRecienLlegados,
    ultimasSeleccionadas:        ultimasSeleccionadasCalc,
    ultimasSeleccionadasSiempre: _leerUltimasConDias_(),
    ultimasSeleccionConfigurada: _hayUltimasConfiguradas_(),
    limites: limites,
    horariosOferta: {
      relampago:  { inicio: _inicioRelampago,  cierre: _cierreRelampago,  activo: horariosOferta.relampago.activo  },
      destacadas: { inicio: _inicioDestacadas, cierre: _cierreDestacadas, activo: horariosOferta.destacadas.activo },
      especiales: { inicio: _inicioEspeciales, cierre: _cierreEspeciales, activo: horariosOferta.especiales.activo },
      ultimas:    { inicio: _inicioUltimas,    cierre: _cierreUltimas,    activo: horariosOferta.ultimas ? horariosOferta.ultimas.activo : true }
    },
    fecha: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm'),
    stats: statsOfertas
  };
}

// ========== DIAGNÓSTICO EN VIVO DE OFERTAS — escribe en config_ofertas ==========
// Solo escribe si los números cambiaron o si pasaron más de 10 minutos desde la última escritura,
// para no pegarle a la planilla en cada visita de un cliente (calcularOfertas corre en cada carga de página).
function _actualizarDiagnosticoOfertas_(stats) {
  var props = PropertiesService.getScriptProperties();
  var resumen = [
    stats.totalRelampago, stats.totalDestacadas, stats.totalEspeciales,
    stats.especialesMostradas, stats.totalUltimas, stats.totalMulticompra,
    stats.totalRecienLlegadosPool
  ].join('|');

  var ultimoResumen = props.getProperty('DIAG_OFERTAS_LAST');
  var ultimoTs      = parseInt(props.getProperty('DIAG_OFERTAS_LAST_TS')) || 0;
  var ahoraTs       = new Date().getTime();
  var diezMin       = 10 * 60 * 1000;

  if (resumen === ultimoResumen && (ahoraTs - ultimoTs) < diezMin) return; // sin cambios y aún fresco: no escribir

  var sh = SpreadsheetApp.openById(SS_ID).getSheetByName(HOJA_CONFIG_OFERTAS);
  if (!sh) return; // si la hoja no existe todavía, no hacer nada (no romper calcularOfertas)

  var ahora = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss');
  var filas = [
    ['—— DIAGNÓSTICO EN VIVO (autogenerado, no editar a mano) ——', ''],
    ['Relámpago activos',          stats.totalRelampago],
    ['Destacadas activos',         stats.totalDestacadas],
    ['Especiales activos',         stats.especialesMostradas],
    ['Últimas Unidades activos',   stats.totalUltimas],
    ['Multicompra activos',        stats.totalMulticompra],
    ['Recién Llegados (pool)',     stats.totalRecienLlegadosPool],
    ['Última actualización',       ahora]
  ];
  sh.getRange(40, 1, filas.length, 2).setValues(filas);

  props.setProperty('DIAG_OFERTAS_LAST', resumen);
  props.setProperty('DIAG_OFERTAS_LAST_TS', String(ahoraTs));
}

// ========== MOTOR DE PUNTAJE - SUGERENCIAS ==========
function calcularMotorSugerencias() {
  try {
    const ss = SpreadsheetApp.openById(SS_ID);
    const sheet = ss.getSheetByName(HOJA_INVENTARIO);
    const datos = sheet.getDataRange().getValues();
    const tz = Session.getScriptTimeZone();
    const hoy = new Date();
    const sugerencias = [];

    for (let i = 1; i < datos.length; i++) {
      const fila = datos[i];
      if (!fila[0]) continue;
      const nombre = String(fila[0] || '').trim();
      const precio = parseInt(fila[1]) || 0;
      const stock = parseInt(fila[5]) || 0;
      const relampago = parseInt(fila[6]) || 0;
      const rotacion = fila.length > 14 ? (parseInt(fila[14]) || 0) : 0;
      if (stock <= 0 || relampago <= 0) continue;

      let diasParaVencer = null;
      try {
        const v = fila.length > 15 ? fila[15] : '';
        if (v) {
          const vDate = v instanceof Date ? v : new Date(v);
          if (!isNaN(vDate.getTime())) diasParaVencer = Math.round((vDate - hoy) / (1000 * 60 * 60 * 24));
        }
      } catch(e) {}

      let diasDesdeUltimaPromo = null;
      try {
        const up = fila.length > 17 ? fila[17] : '';
        if (up) {
          const upDate = up instanceof Date ? up : new Date(up);
          if (!isNaN(upDate.getTime())) diasDesdeUltimaPromo = Math.round((hoy - upDate) / (1000 * 60 * 60 * 24));
        }
      } catch(e) {}

      if (diasDesdeUltimaPromo !== null && diasDesdeUltimaPromo < 15) continue;

      let puntaje = 0;
      if (diasParaVencer !== null) {
        if (diasParaVencer <= 3)  puntaje += 5;
        else if (diasParaVencer <= 7 && stock >= 5) puntaje += 4;
      }
      if (rotacion >= 3) puntaje += 3;
      if (precio > 1000) puntaje += 2;

      let tipo = 'relampago';

      sugerencias.push({ id: i, nombre, stock, rotacion, diasParaVencer, diasDesdeUltimaPromo, puntaje, tipo, relampago });
    }

    sugerencias.sort((a, b) => b.puntaje - a.puntaje);
    return { success: true, sugerencias: sugerencias.slice(0, 10), fecha: Utilities.formatDate(hoy, tz, 'yyyy-MM-dd HH:mm') };
  } catch (error) {
    return { success: false, mensaje: error.toString() };
  }
}

// ========== ACTIVAR RELÁMPAGO ==========
function activarRelampago(datos) {
  try {
    const ss = SpreadsheetApp.openById(SS_ID);
    const sheet = ss.getSheetByName(HOJA_INVENTARIO);
    const todosLosDatos = sheet.getDataRange().getValues();
    const productoId = datos.productoId;
    const tipoRelampago = datos.tipo;
    const filaProducto = parseInt(productoId) + 1;
    if (filaProducto < 2 || filaProducto > todosLosDatos.length) return { success: false, mensaje: 'Producto no encontrado' };
    sheet.getRange(filaProducto, 7).setValue(tipoRelampago);
    if (datos.limpiarOfertas && tipoRelampago > 0) {
      sheet.getRange(filaProducto, 8).setValue(0);
      sheet.getRange(filaProducto, 9).setValue(0);
    }
    const nombreProducto = todosLosDatos[filaProducto - 1][0];
    if (tipoRelampago > 0) sheet.getRange(filaProducto, 18).setValue(new Date());
    if (tipoRelampago === 0) return { success: true, mensaje: '✅ Relámpago desactivado: ' + nombreProducto };
    const descuentos = { 11: '10%', 12: '15%', 13: '20%', 14: '25%' };
    const desc = descuentos[tipoRelampago] || tipoRelampago;
    return { success: true, mensaje: '⚡ Relámpago activado! ' + nombreProducto + ' - Descuento: ' + desc };
  } catch (error) {
    return { success: false, mensaje: 'Error: ' + error.toString() };
  }
}

// ========== OFERTA PERSONALIZADA (texto + % aproximado, redondeo psicológico) ==========
// Columna AJ (36) de 'inventario' = código 0 (sin oferta) o 1-6 → 10/20/30/40/50/60%
// El texto de la campaña (ej. "Feliz Día del Padre") es ÚNICO y vive en config_sistema,
// porque se aplica de a tandas sobre la selección actual, no producto por producto.
const COL_OFERTA_PERSONALIZADA = 36; // AJ
const PCT_OFERTA_PERSONALIZADA = { 1: 10, 2: 20, 3: 30, 4: 40, 5: 50, 6: 60 };

// ========== OFERTA SIMPLE (precio final directo, sin %) ==========
// Columna AK (37) de 'inventario' = precio final directo en pesos, o 0/vacío
// = sin oferta simple activa. A diferencia de OFERTA PERSONALIZADA (que
// guarda un código 1-6 mapeado a un % fijo), acá Javier escribe el precio
// final tal cual, sin pasar por ningún cálculo de %. Convive con el sistema
// de % sin pisarlo — si un producto tiene las dos, Oferta Simple gana
// (ver prioridad en el armado de "productos" más abajo en doGet).
const COL_OFERTA_SIMPLE = 37; // AK

// ==================== OFERTA 2x1 REAL (v18/09/2026) ====================
// Columna AL (38) de 'inventario' = TRUE/FALSE, editable a mano en la
// planilla o vía las dos acciones de abajo. Distinta de:
// - Relámpago código "1" (2x1 tipo NxM): eso es cantidad sin precio
//   unitario fijo, sigue existiendo tal cual en columna G.
// - Oferta Simple (columna AK): esa deja comprar 1 sola unidad a mitad
//   de precio — no es un 2x1 real.
// Acá NO hay precio ni texto que calcular — es solo un flag. El cálculo
// real de "cada par, una unidad gratis" se hace en el carrito de
// seba21.html, usando este flag. A diferencia de Oferta Simple/
// Personalizada (que son "campañas" — cada aplicar resetea toda la
// columna), este flag es un toggle independiente por producto, sin
// horario ni pool, mismo criterio que ya usa Multicompra — aplicar/
// quitar sobre una lista de IDs no toca ningún otro producto.
const COL_OFERTA_2X1 = 38; // AL

// Activa el 2x1 real en uno o varios productos. datos = { items: [12, 45, ...] }
function aplicarOferta2x1(datos) {
  try {
    const ids = Array.isArray(datos.items) ? datos.items : [];
    if (!ids.length) return { success: false, mensaje: 'Sin productos seleccionados' };

    const ss = SpreadsheetApp.openById(SS_ID);
    const sheet = ss.getSheetByName(HOJA_INVENTARIO);
    const lastRow = sheet.getLastRow();

    let aplicados = 0;
    let invalidos = 0;
    ids.forEach(function (idRaw) {
      const id = parseInt(idRaw);
      if (isNaN(id)) { invalidos++; return; }
      const fila = id + 1;
      if (fila >= 2 && fila <= lastRow) {
        sheet.getRange(fila, COL_OFERTA_2X1).setValue('TRUE');
        aplicados++;
      } else {
        invalidos++;
      }
    });

    let mensaje = '🎁 2x1 real activado en ' + aplicados + ' producto(s)';
    if (invalidos > 0) mensaje += ' — ⚠️ ' + invalidos + ' ID(s) inválido(s), no se aplicaron';
    return { success: true, mensaje: mensaje, aplicados: aplicados };
  } catch (error) {
    return { success: false, mensaje: 'Error: ' + error.toString() };
  }
}

// Quita el 2x1 real de uno o varios productos. datos = { productoIds: [12, 45, ...] }
function quitarOferta2x1(datos) {
  try {
    const ids = Array.isArray(datos.productoIds) ? datos.productoIds : [];
    if (!ids.length) return { success: false, mensaje: 'Sin productos seleccionados' };

    const ss = SpreadsheetApp.openById(SS_ID);
    const sheet = ss.getSheetByName(HOJA_INVENTARIO);
    const lastRow = sheet.getLastRow();

    let quitados = 0;
    ids.forEach(function (idRaw) {
      const id = parseInt(idRaw);
      if (isNaN(id)) return;
      const fila = id + 1;
      if (fila >= 2 && fila <= lastRow) {
        sheet.getRange(fila, COL_OFERTA_2X1).setValue('FALSE');
        quitados++;
      }
    });

    return { success: true, mensaje: '🗑️ 2x1 real quitado de ' + quitados + ' producto(s)', quitados: quitados };
  } catch (error) {
    return { success: false, mensaje: 'Error: ' + error.toString() };
  }
}
// ==================== FIN OFERTA 2x1 REAL ====================

// Redondeo "gancho psicológico": sube al próximo escalón (100/500/1000 según el
// precio) y resta 1 → termina en ...99/...499/...999.
// BLINDAJE: con precios bajos, redondear hacia arriba podía terminar dando un
// precio FINAL MAYOR que el original (ej. $600 -10% → $999 = más caro, no es
// descuento). Si pasa, reintenta con un escalón más fino; si aun así no entra,
// usa precioOriginal-1 como último recurso. Nunca debe devolver >= precioOriginal.
function psicoRound_(precio, precioOriginal) {
  precioOriginal = precioOriginal || precio;

  // Step proporcional al precio (~4%, redondeado a una unidad "linda" según
  // la magnitud) en vez de 3 tramos fijos (100/500/1000). Con tramos fijos,
  // elegir 10%, 20%, 30% etc. en la oferta personalizada caía casi siempre
  // en el mismo escalón y daba el MISMO precio final para todos los %.
  // Con el step proporcional, cada % mueve el resultado a un escalón distinto.
  let step;
  if (precio < 300) {
    step = 10;
  } else if (precio < 1000) {
    step = Math.max(20, Math.round(precio * 0.04 / 20) * 20);
  } else {
    step = Math.max(100, Math.round(precio * 0.04 / 100) * 100);
  }

  // Redondeamos hacia ABAJO al escalón (no hacia arriba): así el gancho
  // "...99" siempre recorta del precio objetivo, nunca le devuelve plata
  // al precio original.
  let rounded = Math.floor(precio / step) * step;
  let final = rounded - 1;
  if (final <= 0) final = Math.max(1, Math.floor(precio) - 1);

  // BLINDAJE: exigimos un margen mínimo de separación real respecto al
  // original, no solo que "final" sea menor (evita el caso $2500->$2499).
  const margenMinimo = Math.max(step * 0.5, precioOriginal * 0.02);
  if (final >= precioOriginal - margenMinimo) {
    const step2 = Math.max(5, Math.floor(step / 5));
    let rounded2 = Math.floor(precio / step2) * step2;
    final = rounded2 - 1;
    if (final >= precioOriginal - margenMinimo || final <= 0) {
      final = Math.max(1, precioOriginal - margenMinimo - 1);
    }
  }
  return Math.round(final);
}

function getTextoOfertaPersonalizada_() {
  try {
    const ss = SpreadsheetApp.openById(SS_ID);
    const sheet = ss.getSheetByName(HOJA_CONFIG);
    if (!sheet) return '';
    const datos = sheet.getDataRange().getValues();
    for (let i = 1; i < datos.length; i++) {
      const clave = String(datos[i][0] || '').trim().toLowerCase();
      if (clave === 'texto oferta personalizada') return String(datos[i][1] || '').trim();
    }
    return '';
  } catch (e) { return ''; }
}

function setTextoOfertaPersonalizada_(texto) {
  const ss = SpreadsheetApp.openById(SS_ID);
  const sheet = ss.getSheetByName(HOJA_CONFIG);
  if (!sheet) return;
  const datos = sheet.getDataRange().getValues();
  for (let i = 1; i < datos.length; i++) {
    const clave = String(datos[i][0] || '').trim().toLowerCase();
    if (clave === 'texto oferta personalizada') {
      sheet.getRange(i + 1, 2).setValue(texto);
      return;
    }
  }
  const nuevaFila = sheet.getLastRow() + 1;
  sheet.getRange(nuevaFila, 1).setValue('Texto oferta personalizada');
  sheet.getRange(nuevaFila, 2).setValue(texto);
}

// Aplica la oferta a varios productos a la vez (selección hecha en sendwa)
// datos = { items: [{id:12, tipo:1}, {id:45, tipo:3}, ...], texto: 'Feliz Día del Padre' }
// v9.4: antes "tipo" era un único valor para TODOS los ids; ahora cada producto
// trae su propio tipo (1-6), porque sendwa permite elegir un % distinto por producto.
function aplicarOfertaPersonalizada(datos) {
  try {
    const items = Array.isArray(datos.items) ? datos.items : [];
    const texto = String(datos.texto || '').trim();
    if (!items.length) return { success: false, mensaje: 'Sin productos seleccionados' };
    if (!texto) return { success: false, mensaje: 'Falta el texto de la oferta' };

    const ss = SpreadsheetApp.openById(SS_ID);
    const sheet = ss.getSheetByName(HOJA_INVENTARIO);
    const lastRow = sheet.getLastRow();
    const todosLosDatos = sheet.getDataRange().getValues();

    // RESET: cada "aplicar" es una campaña nueva que reemplaza por completo a la
    // anterior (mismo criterio que el texto único de config_sistema). Si no se
    // limpia toda la columna antes de escribir la tanda nueva, los productos de
    // tandas viejas quedan con su tipo viejo activo para siempre — sin horario
    // ni expiración que los apague — y siguen apareciendo en cualquier collage
    // futuro con el % y precio de la prueba anterior.
    if (lastRow >= 2) {
      sheet.getRange(2, COL_OFERTA_PERSONALIZADA, lastRow - 1, 1).setValue(0);
    }

    let aplicados = 0;
    let sinStock = 0;
    let invalidos = 0;
    const pctsUsados = {};
    items.forEach(function (it) {
      const id = parseInt(it.id);
      const tipo = parseInt(it.tipo) || 0;
      if (!PCT_OFERTA_PERSONALIZADA[tipo]) { invalidos++; return; }
      const fila = id + 1;
      if (fila >= 2 && fila <= lastRow) {
        sheet.getRange(fila, COL_OFERTA_PERSONALIZADA).setValue(tipo);
        aplicados++;
        pctsUsados[tipo] = true;
        const filaDatos = todosLosDatos[fila - 1];
        if (filaDatos && (parseInt(filaDatos[5]) || 0) <= 0) sinStock++;
      }
    });
    setTextoOfertaPersonalizada_(texto);

    const pcts = Object.keys(pctsUsados).map(t => PCT_OFERTA_PERSONALIZADA[t] + '%');
    let mensaje = '🎉 "' + texto + '" (≈' + pcts.join('/') + ') aplicada a ' + aplicados + ' producto(s)';
    if (sinStock > 0) mensaje += ' — ⚠️ ' + sinStock + ' sin stock, no se van a mostrar con la oferta hasta que repongas';
    if (invalidos > 0) mensaje += ' — ⚠️ ' + invalidos + ' con % inválido, no se aplicaron';

    return { success: true, mensaje: mensaje, aplicados: aplicados, sinStock: sinStock };
  } catch (error) {
    return { success: false, mensaje: 'Error: ' + error.toString() };
  }
}

// Quita la oferta personalizada de varios productos a la vez
function quitarOfertaPersonalizada(datos) {
  try {
    const ids = Array.isArray(datos.productoIds) ? datos.productoIds : [];
    if (!ids.length) return { success: false, mensaje: 'Sin productos seleccionados' };

    const ss = SpreadsheetApp.openById(SS_ID);
    const sheet = ss.getSheetByName(HOJA_INVENTARIO);
    const lastRow = sheet.getLastRow();
    let quitados = 0;
    ids.forEach(function (id) {
      const fila = parseInt(id) + 1;
      if (fila >= 2 && fila <= lastRow) {
        sheet.getRange(fila, COL_OFERTA_PERSONALIZADA).setValue(0);
        quitados++;
      }
    });
    return { success: true, mensaje: '🗑️ Oferta personalizada quitada de ' + quitados + ' producto(s)', quitados: quitados };
  } catch (error) {
    return { success: false, mensaje: 'Error: ' + error.toString() };
  }
}

// ==================== OFERTA SIMPLE — funciones ====================
function getTextoOfertaSimple_() {
  try {
    const ss = SpreadsheetApp.openById(SS_ID);
    const sheet = ss.getSheetByName(HOJA_CONFIG);
    if (!sheet) return '';
    const datos = sheet.getDataRange().getValues();
    for (let i = 1; i < datos.length; i++) {
      const clave = String(datos[i][0] || '').trim().toLowerCase();
      if (clave === 'texto oferta simple') return String(datos[i][1] || '').trim();
    }
    return '';
  } catch (e) { return ''; }
}

function setTextoOfertaSimple_(texto) {
  const ss = SpreadsheetApp.openById(SS_ID);
  const sheet = ss.getSheetByName(HOJA_CONFIG);
  if (!sheet) return;
  const datos = sheet.getDataRange().getValues();
  for (let i = 1; i < datos.length; i++) {
    const clave = String(datos[i][0] || '').trim().toLowerCase();
    if (clave === 'texto oferta simple') {
      sheet.getRange(i + 1, 2).setValue(texto);
      return;
    }
  }
  const nuevaFila = sheet.getLastRow() + 1;
  sheet.getRange(nuevaFila, 1).setValue('Texto oferta simple');
  sheet.getRange(nuevaFila, 2).setValue(texto);
}

// Aplica un precio final directo a varios productos (selección hecha en sendwa)
// datos = { items: [{id:12, precio:1500}, {id:45, precio:2500}, ...], texto: 'Día del Niño' }
// Mismo criterio que Oferta Personalizada: cada "aplicar" es una campaña nueva
// que reemplaza por completo a la anterior (resetea toda la columna antes de
// escribir la tanda nueva).
function aplicarOfertaSimple(datos) {
  try {
    const items = Array.isArray(datos.items) ? datos.items : [];
    const texto = String(datos.texto || '').trim();
    if (!items.length) return { success: false, mensaje: 'Sin productos seleccionados' };
    if (!texto) return { success: false, mensaje: 'Falta el texto de la oferta' };

    const ss = SpreadsheetApp.openById(SS_ID);
    const sheet = ss.getSheetByName(HOJA_INVENTARIO);
    const lastRow = sheet.getLastRow();
    const todosLosDatos = sheet.getDataRange().getValues();

    if (lastRow >= 2) {
      sheet.getRange(2, COL_OFERTA_SIMPLE, lastRow - 1, 1).setValue(0);
    }

    let aplicados = 0;
    let sinStock = 0;
    let invalidos = 0;
    let masCaroQueAntes = 0;
    items.forEach(function (it) {
      const id = parseInt(it.id);
      const precio = parseFloat(it.precio);
      if (!precio || precio <= 0) { invalidos++; return; }
      const fila = id + 1;
      if (fila >= 2 && fila <= lastRow) {
        const filaDatos = todosLosDatos[fila - 1];
        // Precio "antes" — misma lógica de columnas K/L que usa el resto del
        // sistema (L tiene prioridad si está cargada, si no L usa K).
        const antesL = filaDatos && filaDatos.length > 11 ? parseInt(filaDatos[11]) : 0;
        const antesK = filaDatos && filaDatos.length > 10 ? parseInt(filaDatos[10]) : 0;
        const antes = antesL > 0 ? antesL : antesK;
        if (antes > 0 && precio >= antes) masCaroQueAntes++; // se aplica igual, pero se avisa
        sheet.getRange(fila, COL_OFERTA_SIMPLE).setValue(precio);
        aplicados++;
        if (filaDatos && (parseInt(filaDatos[5]) || 0) <= 0) sinStock++;
      }
    });
    setTextoOfertaSimple_(texto);

    let mensaje = '🎯 "' + texto + '" aplicada a ' + aplicados + ' producto(s)';
    if (sinStock > 0) mensaje += ' — ⚠️ ' + sinStock + ' sin stock, no se van a mostrar con la oferta hasta que repongas';
    if (invalidos > 0) mensaje += ' — ⚠️ ' + invalidos + ' con precio inválido, no se aplicaron';
    if (masCaroQueAntes > 0) mensaje += ' — ⚠️ ' + masCaroQueAntes + ' con precio "hoy" igual o mayor al "antes", no van a aparecer como oferta hasta que corrijas';

    return { success: true, mensaje: mensaje, aplicados: aplicados, sinStock: sinStock };
  } catch (error) {
    return { success: false, mensaje: 'Error: ' + error.toString() };
  }
}

function quitarOfertaSimple(datos) {
  try {
    const ids = Array.isArray(datos.productoIds) ? datos.productoIds : [];
    if (!ids.length) return { success: false, mensaje: 'Sin productos seleccionados' };
    const ss = SpreadsheetApp.openById(SS_ID);
    const sheet = ss.getSheetByName(HOJA_INVENTARIO);
    const lastRow = sheet.getLastRow();
    let quitados = 0;
    ids.forEach(function (id) {
      const fila = parseInt(id) + 1;
      if (fila >= 2 && fila <= lastRow) {
        sheet.getRange(fila, COL_OFERTA_SIMPLE).setValue(0);
        quitados++;
      }
    });
    return { success: true, mensaje: '🗑️ Oferta simple quitada de ' + quitados + ' producto(s)', quitados: quitados };
  } catch (error) {
    return { success: false, mensaje: 'Error: ' + error.toString() };
  }
}

function resetOfertaSimpleTotal() {
  try {
    const ss = SpreadsheetApp.openById(SS_ID);
    const sheet = ss.getSheetByName(HOJA_INVENTARIO);
    const lastRow = sheet.getLastRow();
    if (lastRow >= 2) {
      sheet.getRange(2, COL_OFERTA_SIMPLE, lastRow - 1, 1).setValue(0);
    }
    return { success: true, mensaje: '🧹 Oferta simple reseteada en toda la planilla' };
  } catch (error) {
    return { success: false, mensaje: 'Error: ' + error.toString() };
  }
}
// ==================== FIN OFERTA SIMPLE ====================

// RESET TOTAL: limpia la columna oferta_personalizada completa desde fila 2.
// A diferencia de quitarOfertaPersonalizada (que solo apaga los IDs recibidos,
// típicamente la selección visible en pantalla), esta función no depende de
// ninguna lista — apaga TODOS los productos de la planilla de una sola vez,
// incluso los que quedaron activos de campañas viejas y ya no están a la vista.
function resetOfertaPersonalizadaTotal() {
  try {
    const ss = SpreadsheetApp.openById(SS_ID);
    const sheet = ss.getSheetByName(HOJA_INVENTARIO);
    const lastRow = sheet.getLastRow();
    if (lastRow >= 2) {
      sheet.getRange(2, COL_OFERTA_PERSONALIZADA, lastRow - 1, 1).setValue(0);
    }
    return { success: true, mensaje: '🧹 Columna de ofertas personalizadas reseteada por completo', filas: Math.max(0, lastRow - 1) };
  } catch (error) {
    return { success: false, mensaje: 'Error: ' + error.toString() };
  }
}


// ========== GET CONFIG ==========
function getConfig() {
  try {
    const ss = SpreadsheetApp.openById(SS_ID);
    const sheet = ss.getSheetByName(HOJA_CONFIG);
    if (!sheet) return { success: false, mensaje: 'Hoja config_sistema no encontrada' };
    const datos = sheet.getDataRange().getValues();
    const config = {};
    let seccionActual = 'general';
    for (let i = 1; i < datos.length; i++) {
      const clave = String(datos[i][0] || '').trim();
      if (!clave) continue;
      if (clave.startsWith('──') || clave.startsWith('─') || clave.startsWith('📌')) {
        const c = clave.toLowerCase();
        if (c.includes('relámpago') || c.includes('relampago')) seccionActual = 'relampago';
        else if (c.includes('destacada')) seccionActual = 'destacadas';
        else if (c.includes('especial')) seccionActual = 'especiales';
        else if (c.includes('horario')) seccionActual = 'horario';
        continue;
      }
      const vals = [];
      for (let c = 1; c <= 7; c++) {
        const v = datos[i][c];
        vals.push(v !== '' && v !== null && v !== undefined ? v : null);
      }
      const claveUnica = seccionActual + '|' + clave;
      config[claveUnica] = vals;
      if (!config[clave]) config[clave] = vals;
    }
    return { success: true, config };
  } catch(e) {
    return { success: false, mensaje: e.toString() };
  }
}

// ========== SET CONFIG ==========
function setConfig(datos) {
  try {
    const ss = SpreadsheetApp.openById(SS_ID);
    const sheet = ss.getSheetByName(HOJA_CONFIG);
    if (!sheet) return { success: false, mensaje: 'Hoja config_sistema no encontrada' };

    const seccion  = String(datos.seccion || '').toLowerCase();
    const clave    = String(datos.clave   || '').trim();
    const diaIdx   = parseInt(datos.dia);
    const valor = (datos.valor === 'A' || datos.valor === null || datos.valor === undefined) ? 'A' :
                  (datos.valor === 1 || datos.valor === '1') ? 1 : 0;

    if (isNaN(diaIdx) || diaIdx < 0 || diaIdx > 6) return { success: false, mensaje: 'Día inválido' };

    const hojaData = sheet.getDataRange().getValues();
    let seccionActual = 'general';
    let filaObjetivo = -1;
    let filaFallback = -1;

    const claveNorm = clave.toLowerCase();

    for (let i = 1; i < hojaData.length; i++) {
      const celda = String(hojaData[i][0] || '').trim();
      if (!celda) continue;
      if (celda.startsWith('──') || celda.startsWith('─') || celda.startsWith('📌') || celda.startsWith('—')) {
        const c = celda.toLowerCase();
        if (c.includes('relámpago') || c.includes('relampago')) seccionActual = 'relampago';
        else if (c.includes('destacada')) seccionActual = 'destacadas';
        else if (c.includes('especial')) seccionActual = 'especiales';
        else if (c.includes('horario')) seccionActual = 'horario';
        continue;
      }
      const celdaNorm = celda.toLowerCase();
      if (seccionActual === seccion && celdaNorm === claveNorm) {
        filaObjetivo = i + 1;
        break;
      }
      if (filaFallback === -1 && celdaNorm === claveNorm) {
        filaFallback = i + 1;
      }
    }

    if (filaObjetivo === -1) filaObjetivo = filaFallback;
    if (filaObjetivo === -1) return { success: false, mensaje: 'No se encontró: ' + seccion + '|' + clave };

    const columna = diaIdx + 2;
    sheet.getRange(filaObjetivo, columna).setValue(valor);

    return { success: true, mensaje: 'OK: ' + seccion + '|' + clave + '[' + diaIdx + '] = ' + valor };
  } catch(e) {
    return { success: false, mensaje: e.toString() };
  }
}

// ========== JUEVES CERVECERO ==========
function getJuevesCervecero() {
  try {
    // 🟢 JUEVES CERVECERO: SOLO LOS JUEVES — corta ANTES de tocar la planilla.
    // Antes esto leía Inventario + Ventas (30 días) TODOS los días de la
    // semana, aunque la sección estuviera oculta en el frontend. Eso costaba
    // ~7s por carga, 6 de cada 7 días, para nada.
    const ahoraAR = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));
    if (ahoraAR.getDay() !== 4) {
      return { success: true, activo: false, productos: [], horaCierre: 22, horaInicio: 14, modoActivo: 'A' };
    }

    const ss = SpreadsheetApp.openById(SS_ID);
    const sheetInv    = ss.getSheetByName(HOJA_INVENTARIO);
    const sheetVentas = ss.getSheetByName('Ventas');
    const sheetCfg    = ss.getSheetByName(HOJA_CONFIG);
    if (!sheetInv) return { success: false, mensaje: 'Sin inventario' };

    let horaCierre = 22;
    let horaInicio = 14; // fallback — fila JUEVES CERVECERO columna INICIO
    let modoActivo = 'A'; // 'A', '0', '1'
    if (sheetCfg) {
      const cfgData = sheetCfg.getDataRange().getValues();
      for (let i = 0; i < cfgData.length; i++) {
        const clave = String(cfgData[i][0] || '').trim().toLowerCase();
        if (clave.includes('jueves cervecero') || clave.includes('cervecero')) {
          Logger.log('Fila cervecero encontrada en fila ' + i + '. Columnas: ' + JSON.stringify(cfgData[i]));
          Logger.log('C[2]=' + cfgData[i][2] + ' tipo=' + typeof cfgData[i][2] + ' | G[6]=' + cfgData[i][6] + ' tipo=' + typeof cfgData[i][6]);
          // Fila 26: A=JUEVES CERVECERO, B=INICIO, C=hora inicio, D=HRS, E=—, F=FINAL, G=hora cierre, H=HRS
          const ini = cfgData[i][2]; // columna C = hora inicio
          const fin = cfgData[i][6]; // columna G = hora cierre
          const modo = cfgData[i][8]; // columna I = modo (si existe)
          if (ini !== null && ini !== '') {
            var pIni;
            if (typeof ini === 'number' && ini > 0 && ini < 1) {
              pIni = ini * 24;
            } else if (typeof ini === 'string' && ini.includes('T')) {
              // Google Sheets manda hora como ISO: usar UTC horas + ajuste ARG (-3)
              var dIni = new Date(ini);
              pIni = ((dIni.getUTCHours() - 3 + 24) % 24) + dIni.getUTCMinutes() / 60;
            } else {
              pIni = typeof ini === 'number' ? ini : parseFloat(String(ini).split(':')[0]);
            }
            if (!isNaN(pIni)) horaInicio = Math.round(pIni * 100) / 100;
          }
          if (fin !== null && fin !== '') {
            var pFin;
            if (typeof fin === 'number' && fin > 0 && fin < 1) {
              pFin = fin * 24;
            } else if (typeof fin === 'string' && fin.includes('T')) {
              var dFin = new Date(fin);
              pFin = ((dFin.getUTCHours() - 3 + 24) % 24) + dFin.getUTCMinutes() / 60;
            } else {
              pFin = typeof fin === 'number' ? fin : parseFloat(String(fin).split(':')[0]);
            }
            if (!isNaN(pFin)) horaCierre = Math.round(pFin * 100) / 100;
          }
          if (modo !== null && modo !== undefined && modo !== '') modoActivo = String(modo).trim().toUpperCase();
          break;
        }
      }
    }

    const inv = sheetInv.getDataRange().getValues();
    const cervezas = [];
    for (let i = 1; i < inv.length; i++) {
      const nombre = String(inv[i][0] || '').trim();
      const cat    = String(inv[i][2] || '').trim().toUpperCase();
      const precio = parseFloat(inv[i][1]) || 0;
      const stock  = parseInt(inv[i][5]) || 0;
      const costo  = parseFloat(inv[i][18]) || 0;
      if (!nombre || stock < 3 || precio <= 0) continue;
      const esExcluido = nombre.toUpperCase().includes('GASEOSA') ||
                         nombre.toUpperCase().includes('COCA') ||
                         nombre.toUpperCase().includes('PEPSI') ||
                         nombre.toUpperCase().includes('SPRITE') ||
                         nombre.toUpperCase().includes('FANTA') ||
                         nombre.toUpperCase().includes('7UP') ||
                         nombre.toUpperCase().includes('CUNNINGTON') ||
                         nombre.toUpperCase().includes('MANAOS') ||
                         nombre.toUpperCase().includes('PASO DE LOS TOROS') ||
                         nombre.toUpperCase().includes('AGUA') ||
                         nombre.toUpperCase().includes('JUGO') ||
                         nombre.toUpperCase().includes('SODA');
      const esCerveza = !esExcluido && (
                        cat.includes('CERV') ||
                        nombre.toUpperCase().includes('CERVEZA') ||
                        nombre.toUpperCase().includes(' LATA') ||
                        nombre.toUpperCase().includes('BIRRA') ||
                        nombre.toUpperCase().includes(' IPA') ||
                        nombre.toUpperCase().includes(' STOUT') ||
                        nombre.toUpperCase().includes(' PORTER'));
      if (!esCerveza) continue;
      const margen = costo > 0 ? (precio - costo) / precio : 0.35;
      cervezas.push({ i, nombre, precio, stock, costo, margen });
    }

    if (!cervezas.length) return { success: true, productos: [], horaCierre };

    const ventasProd = {};
    const ticketTotales = {};
    if (sheetVentas) {
      const hoy    = new Date();
      const hace30 = new Date(hoy - 30 * 86400000);
      const ventas = sheetVentas.getDataRange().getValues();
      for (let i = 1; i < ventas.length; i++) {
        const f = ventas[i];
        const nombre = String(f[3] || '').trim();
        if (nombre.includes('TOTAL TICKET')) {
          ticketTotales[String(f[0] || '').trim()] = parseFloat(f[7]) || 0;
        }
      }
      for (let i = 1; i < ventas.length; i++) {
        const f = ventas[i];
        const fecha = f[1];
        if (!(fecha instanceof Date) || fecha < hace30) continue;
        const nombre = String(f[3] || '').trim().toUpperCase();
        const qty    = parseFloat(f[4]) || 0;
        const tk     = String(f[0] || '').trim();
        if (!nombre || nombre.startsWith('─')) continue;
        if (!ventasProd[nombre]) ventasProd[nombre] = { qty: 0, tickets: 0, ticketTotal: 0 };
        ventasProd[nombre].qty += qty;
        ventasProd[nombre].tickets++;
        ventasProd[nombre].ticketTotal += ticketTotales[tk] || 0;
      }
    }

    const maxQty    = Math.max(...cervezas.map(c => (ventasProd[c.nombre.toUpperCase()] || {qty:0}).qty), 1);
    const maxStock  = Math.max(...cervezas.map(c => c.stock), 1);
    const maxTicket = Math.max(...cervezas.map(c => (ventasProd[c.nombre.toUpperCase()] || {ticketTotal:0}).ticketTotal), 1);

    const scored = cervezas.map(c => {
      const vd       = ventasProd[c.nombre.toUpperCase()] || { qty: 0, tickets: 0, ticketTotal: 0 };
      const rotScore  = vd.qty / maxQty;
      const stockScore = c.stock / maxStock;
      const margenScore = Math.min(c.margen, 1);
      const ticketScore = vd.ticketTotal / maxTicket;
      const promoScore = (rotScore * 0.35) + (stockScore * 0.25) + (margenScore * 0.20) + (ticketScore * 0.20);
      return { ...c, promoScore, ventas30: vd.qty };
    });

    const top6 = scored.sort((a, b) => b.promoScore - a.promoScore).slice(0, 6);
    const idxGancho = top6.reduce((bestIdx, c, i) => c.margen > top6[bestIdx].margen ? i : bestIdx, 0);

    const top6Final = top6.map((c, idx) => {
      let descuento = idx === idxGancho ? 20 : (c.margen > 0.30 ? 15 : 10);
      const precioBase = Math.max(
        Math.round(c.precio * (1 - descuento / 100)),
        c.costo > 0 ? Math.ceil(c.costo * 1.05) : 0
      );
      const precioPromo99 = Math.round((precioBase - 99) / 100) * 100 + 99;
      const precioPromo = Math.min(precioPromo99, c.precio - 1);
      return { ...c, descuento, precioPromo, esGancho: idx === idxGancho };
    });

    return { success: true, productos: top6Final, horaCierre, horaInicio, modoActivo };
  } catch(e) {
    return { success: false, mensaje: e.toString() };
  }
}

function logEventoCerveza(datos) {
  try {
    const ss = SpreadsheetApp.openById(SS_ID);
    const HOJA_LOG = 'evento_cerveza_log';
    let sheet = ss.getSheetByName(HOJA_LOG);
    if (!sheet) {
      sheet = ss.insertSheet(HOJA_LOG);
      sheet.appendRow(['FECHA', 'PRODUCTOS', 'UNIDADES VENDIDAS', 'FACTURACIÓN', 'GANANCIA', 'TICKET PROMEDIO', 'DESCUENTO APLICADO']);
      sheet.getRange(1, 1, 1, 7).setBackground('#4a148c').setFontColor('white').setFontWeight('bold');
      [120, 200, 80, 100, 100, 100, 100].forEach((w, i) => sheet.setColumnWidth(i + 1, w));
    }
    const tz = Session.getScriptTimeZone();
    const fecha = Utilities.formatDate(new Date(), tz, 'dd/MM/yyyy HH:mm');
    sheet.appendRow([fecha, String(datos.productos || ''), datos.unidades || 0, datos.facturacion || 0, datos.ganancia || 0, datos.ticketPromedio || 0, String(datos.descuentos || '')]);
    return { success: true };
  } catch(e) {
    return { success: false, mensaje: e.toString() };
  }
}

function logInterruptor(datos) {
  try {
    const ss = SpreadsheetApp.openById(SS_ID);
    const HOJA_LOG = 'Interruptores_Log';
    let sheet = ss.getSheetByName(HOJA_LOG);
    if (!sheet) {
      sheet = ss.insertSheet(HOJA_LOG);
      sheet.appendRow(['FECHA', 'HORA', 'OFERTA', 'ACCIÓN', 'DÍA SEMANA', 'VENDEDOR']);
      sheet.getRange(1, 1, 1, 6).setBackground('#1a237e').setFontColor('white').setFontWeight('bold');
      sheet.setColumnWidth(1, 110); sheet.setColumnWidth(2, 80); sheet.setColumnWidth(3, 120);
      sheet.setColumnWidth(4, 100); sheet.setColumnWidth(5, 120); sheet.setColumnWidth(6, 120);
    }
    const tz = Session.getScriptTimeZone();
    const ahora = new Date();
    const fecha = Utilities.formatDate(ahora, tz, 'dd/MM/yyyy');
    const hora  = Utilities.formatDate(ahora, tz, 'HH:mm:ss');
    const diasNombres = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
    const diaSemana = diasNombres[ahora.getDay()];
    const oferta   = String(datos.tipo     || '').toUpperCase();
    const accion   = datos.estado === 1 ? '🟢 ACTIVADO' : '🔴 DESACTIVADO';
    const vendedor = String(datos.vendedor || 'Desconocido');
    sheet.appendRow([fecha, hora, oferta, accion, diaSemana, vendedor]);
    return { success: true };
  } catch(e) {
    return { success: false, mensaje: e.toString() };
  }
}

// v11.0 — getMulticompraTodas() se movió a multicompra.gs.

// ========== DIAGNÓSTICO — ÚLTIMAS UNIDADES ==========
function diagnosticoUltimas() {
  try {
    var ss=SpreadsheetApp.openById(SS_ID), cfg=ss.getSheetByName(HOJA_CONFIG), inv=ss.getSheetByName(HOJA_INVENTARIO);
    if(!cfg||!inv) return {ok:false,error:'Falta config_sistema o inventario'};
    var vals=cfg.getDataRange().getValues(), ids=[];
    for(var i=0;i<vals.length;i++) if(String(vals[i][0]||'').trim().toLowerCase()==='ultimas_seleccion'){
      try{ids=JSON.parse(vals[i][1]||'[]');}catch(e){ids=[];} break;
    }
    var data=inv.getDataRange().getValues(), hoy=new Date(); hoy.setHours(0,0,0,0), items=[], visibles=0;
    ids.forEach(function(id){
      var r=Number(id), f=(r>=1&&r<data.length)?data[r]:null;
      if(!f||!f[0]){items.push({id:id,encontrada:false,motivo:'FILA_INEXISTENTE'});return;}
      var stock=parseInt(f[5])||0,dias=null;
      if(f[9]){try{var raw=f[9] instanceof Date?Utilities.formatDate(f[9],Session.getScriptTimeZone(),'yyyy-MM-dd'):String(f[9]).split('T')[0];
        var d=new Date(raw+'T12:00:00'); if(!isNaN(d.getTime())) dias=Math.round((d-hoy)/86400000);}catch(e){}}
      var visible=stock>0&&(dias===null||dias>=0); if(visible) visibles++;
      items.push({id:id,fila:r+1,encontrada:true,nombre:String(f[0]||'').trim(),stock:stock,diasParaVencer:dias,
        visible:visible,motivo:visible?'OK':(stock<=0?'SIN_STOCK':'VENCIDO')});
    });
    return {ok:true,seleccionGuardada:ids.length,visiblesHoy:visibles,items:items};
  }catch(e){return {ok:false,error:e.toString(),seleccionGuardada:0,visiblesHoy:0,items:[]};}
}

// ========== API PRINCIPAL doGet ==========
function doGet(e) {
  try {
    // v10.11 — ping: health-check liviano para que el frontend pueda chequear
    // "¿el backend responde?" sin disparar lecturas de Sheets. Va primero,
    // antes de cualquier SpreadsheetApp.openById()/getSheetByName(), para que
    // sea lo más rápido posible. No toca ni lee ninguna planilla.
    if (e && e.parameter && e.parameter.action === 'ping') {
      return respuestaJSON({ ok: true, ts: Date.now() });
    }
    if (e && e.parameter && e.parameter.action === 'vender') {
      return procesarVenta(e.parameter.data);
    }
    if (e && e.parameter && e.parameter.action === 'getPanSugeridoHoy') {
      return respuestaJSON(getPanSugeridoHoy());
    }
    if (e && e.parameter && e.parameter.action === 'marcarPanSugeridoHoy') {
      return respuestaJSON(marcarPanSugeridoHoy());
    }
    if (e && e.parameter && e.parameter.action === 'agregar') {
      return agregarProducto(e.parameter.data);
    }
    if (e && e.parameter && e.parameter.action === 'ingresar') {
      const datos = JSON.parse(decodeURIComponent(e.parameter.data));
      return respuestaJSON(ingresarMercaderia(datos));
    }
    if (e && e.parameter && e.parameter.action === 'getInfoProducto') {
      return respuestaJSON(obtenerInfoProducto(e.parameter.nombre || ''));
    }
    if (e && e.parameter && e.parameter.action === 'salidaInterna') {
      var datosSalida = JSON.parse(decodeURIComponent(e.parameter.data));
      return respuestaJSON(registrarSalidaInterna(datosSalida));
    }
    if (e && e.parameter && e.parameter.action === 'setPausadoListaCompra') {
      var datosPausa = JSON.parse(decodeURIComponent(e.parameter.data));
      return respuestaJSON(setPausadoListaCompra(datosPausa));
    }
    if (e && e.parameter && e.parameter.action === 'ajusteRapido') {
      const datos = JSON.parse(decodeURIComponent(e.parameter.data));
      return respuestaJSON(ajustarProducto(datos));
    }
    if (e && e.parameter && e.parameter.action === 'setConfig') {
      const datos = JSON.parse(decodeURIComponent(e.parameter.data));
      return respuestaJSON(setConfig(datos));
    }
    if (e && e.parameter && e.parameter.action === 'getJuevesCervecero') {
      return respuestaJSON(getJuevesCervecero());
    }
    if (e && e.parameter && e.parameter.action === 'logEventoCerveza') {
      const datos = JSON.parse(decodeURIComponent(e.parameter.data));
      return respuestaJSON(logEventoCerveza(datos));
    }
    if (e && e.parameter && e.parameter.action === 'logInterruptor') {
      const datos = JSON.parse(decodeURIComponent(e.parameter.data));
      return respuestaJSON(logInterruptor(datos));
    }
    if (e && e.parameter && e.parameter.action === 'crearOrdenMP') {
      const monto = parseFloat(e.parameter.monto) || 0;
      if (monto <= 0) return respuestaJSON({ ok: false, error: 'Monto inválido' });
      return respuestaJSON(crearOrdenMP(monto));
    }
    if (e && e.parameter && e.parameter.action === 'getReportes') {
      try {
        return respuestaJSON(getReportes());
      } catch(errReportes) {
        return respuestaJSON({ error: true, mensaje: 'Error en reportes: ' + errReportes.toString() });
      }
    }
    if (e && e.parameter && e.parameter.action === 'getOfertas') {
      try {
        return respuestaJSON(calcularOfertas());
      } catch(errOfertas) {
        return respuestaJSON({ error: true, mensaje: 'Error en ofertas: ' + errOfertas.toString() });
      }
    }
    if (e && e.parameter && e.parameter.action === 'motorSugerencias') {
      return respuestaJSON(calcularMotorSugerencias());
    }
    if (e && e.parameter && e.parameter.action === 'relampago') {
      const datos = JSON.parse(decodeURIComponent(e.parameter.data));
      return respuestaJSON(activarRelampago(datos));
    }
    if (e && e.parameter && e.parameter.action === 'ofertaPersonalizada') {
      const datos = JSON.parse(decodeURIComponent(e.parameter.data));
      return respuestaJSON(aplicarOfertaPersonalizada(datos));
    }
    if (e && e.parameter && e.parameter.action === 'quitarOfertaPersonalizada') {
      const datos = JSON.parse(decodeURIComponent(e.parameter.data));
      return respuestaJSON(quitarOfertaPersonalizada(datos));
    }
    if (e && e.parameter && e.parameter.action === 'resetOfertaPersonalizadaTotal') {
      return respuestaJSON(resetOfertaPersonalizadaTotal());
    }
    if (e && e.parameter && e.parameter.action === 'ofertaSimple') {
      const datosOS = JSON.parse(decodeURIComponent(e.parameter.data));
      return respuestaJSON(aplicarOfertaSimple(datosOS));
    }
    if (e && e.parameter && e.parameter.action === 'quitarOfertaSimple') {
      const datosQOS = JSON.parse(decodeURIComponent(e.parameter.data));
      return respuestaJSON(quitarOfertaSimple(datosQOS));
    }
    if (e && e.parameter && e.parameter.action === 'resetOfertaSimpleTotal') {
      return respuestaJSON(resetOfertaSimpleTotal());
    }
    if (e && e.parameter && e.parameter.action === 'oferta2x1') {
      const datos2x1 = JSON.parse(decodeURIComponent(e.parameter.data));
      return respuestaJSON(aplicarOferta2x1(datos2x1));
    }
    if (e && e.parameter && e.parameter.action === 'quitarOferta2x1') {
      const datosQ2x1 = JSON.parse(decodeURIComponent(e.parameter.data));
      return respuestaJSON(quitarOferta2x1(datosQ2x1));
    }
    if (e && e.parameter && e.parameter.action === 'getConfig') {
      return respuestaJSON(getConfig());
    }
    if (e && e.parameter && e.parameter.action === 'actualizarEstadisticas') {
      return respuestaJSON(actualizarEstadisticas());
    }
    if (e && e.parameter && e.parameter.action === 'getProveedores') {
      return respuestaJSON(leerProveedores());
    }
    if (e && e.parameter && e.parameter.action === 'guardarProveedor') {
      const datos = JSON.parse(decodeURIComponent(e.parameter.data));
      return respuestaJSON(guardarProveedor(datos));
    }
    if (e && e.parameter && e.parameter.action === 'guardarCarritoTemp') {
      const datos = JSON.parse(decodeURIComponent(e.parameter.data));
      return respuestaJSON(guardarCarritoTemp(datos));
    }
    if (e && e.parameter && e.parameter.action === 'getCarritoTemp') {
      return respuestaJSON(getCarritoTemp());
    }
    if (e && e.parameter && e.parameter.action === 'getListaCompra') {
      return respuestaJSON(getListaCompraJSON());
    }
    if (e && e.parameter && e.parameter.action === 'listarFiados') {
      return respuestaJSON(listarFiados());
    }
    if (e && e.parameter && e.parameter.action === 'getDetalleTicket') {
      var ticket = e.parameter.data ? JSON.parse(decodeURIComponent(e.parameter.data)).ticket : '';
      return respuestaJSON(getDetalleTicket(ticket));
    }
    if (e && e.parameter && e.parameter.action === 'cobrarFiado') {
      var datosCobro = e.parameter.data ? JSON.parse(decodeURIComponent(e.parameter.data)) : {};
      return respuestaJSON(cobrarFiado(datosCobro));
    }
    if (e && e.parameter && e.parameter.action === 'abonarFiado') {
      var datosAbono = e.parameter.data ? JSON.parse(decodeURIComponent(e.parameter.data)) : {};
      return respuestaJSON(abonarFiado(datosAbono));
    }
    if (e && e.parameter && e.parameter.action === 'consultarStockVoz') {
  if (!_tokenVozValido_(e)) return respuestaJSON({ ok: false, error: 'No autorizado' });
  return respuestaJSON(consultarStockVoz(e.parameter.producto || ''));
    }
    if (e && e.parameter && e.parameter.action === 'consultarVentasVoz') {
  if (!_tokenVozValido_(e)) return respuestaJSON({ ok: false, error: 'No autorizado' });
  var datosV = e.parameter.data ? JSON.parse(decodeURIComponent(e.parameter.data)) : {};
  return respuestaJSON(consultarVentasVoz(datosV));
    }
    if (e && e.parameter && e.parameter.action === 'consultarCajaVoz') {
  if (!_tokenVozValido_(e)) return respuestaJSON({ ok: false, error: 'No autorizado' });
  var datosC = e.parameter.data ? JSON.parse(decodeURIComponent(e.parameter.data)) : {};
  return respuestaJSON(consultarCajaVoz(datosC));
    }
    // ── NUEVAS ACCIONES v2.0 FIADOS ──
    if (e && e.parameter && e.parameter.action === 'listarFiadosCliente') {
      var datosFC = e.postData ? JSON.parse(e.postData.contents) : JSON.parse(decodeURIComponent(e.parameter.data || '{}'));
      return respuestaJSON(listarFiadosCliente(datosFC));
    }
    if (e && e.parameter && e.parameter.action === 'pagarFiadosSeleccionados') {
      var datosPFS = e.postData ? JSON.parse(e.postData.contents) : JSON.parse(decodeURIComponent(e.parameter.data || '{}'));
      return respuestaJSON(pagarFiadosSeleccionados(datosPFS));
    }
    if (e && e.parameter && e.parameter.action === 'abonoFiado') {
      var datosAbono = JSON.parse(decodeURIComponent(e.parameter.data));
      return respuestaJSON(abonoFiado(datosAbono));
    }
    if (e && e.parameter && e.parameter.action === 'guardarFiado') {
      var datosFiado = JSON.parse(decodeURIComponent(e.parameter.data));
      return respuestaJSON(guardarFiado(datosFiado));
    }
    if (e && e.parameter && e.parameter.action === 'actualizarTicketFiado') {
      var datosTF = JSON.parse(decodeURIComponent(e.parameter.data));
      return respuestaJSON(actualizarTicketFiado(datosTF));
    }
    if (e && e.parameter && e.parameter.action === 'consultarFiado') {
      return respuestaJSON(consultarFiado(e.parameter.telefono));
    }
    if (e && e.parameter && e.parameter.action === 'listarClientes') {
      return respuestaJSON(listarClientes());
    }
    if (e && e.parameter && e.parameter.action === 'actualizarCliente') {
    var d = JSON.parse(decodeURIComponent(e.parameter.data));
    return respuestaJSON(actualizarCliente(d));
    }
    if (e && e.parameter && e.parameter.action === 'setPausadoNombre') {
      var datosPN = JSON.parse(decodeURIComponent(e.parameter.data));
      return respuestaJSON(setPausadoNombre(datosPN));
    }
    if (e && e.parameter && e.parameter.action === 'registrarMovimientoCaja') {
      var datosCaja = JSON.parse(decodeURIComponent(e.parameter.data));
      return respuestaJSON(registrarMovimientoCaja(datosCaja));
    }
    if (e && e.parameter && e.parameter.action === 'ventasProducto') {
      var datosVP = JSON.parse(decodeURIComponent(e.parameter.data));
      return respuestaJSON(getVentasProducto(datosVP));
    }
    if (e && e.parameter && e.parameter.action === 'getCandidatosUltimas') {
      return respuestaJSON(getCandidatosUltimas());
    }
    if (e && e.parameter && e.parameter.action === 'getUltimasSeleccion') {
      return respuestaJSON(getUltimasSeleccion());
    }
    if (e && e.parameter && e.parameter.action === 'guardarUltimasSeleccion') {
      var idsUlt = JSON.parse(decodeURIComponent(e.parameter.data));
      return respuestaJSON(guardarUltimasSeleccion(idsUlt));
    }
    if (e && e.parameter && e.parameter.action === 'getSalidasInternas') {
      var datosSI = e.parameter.data ? JSON.parse(decodeURIComponent(e.parameter.data)) : {};
      return respuestaJSON(getSalidasInternas(datosSI));
    }
    if (e && e.parameter && e.parameter.action === 'getCajaEgresos') {
      var datosCE = e.parameter.data ? JSON.parse(decodeURIComponent(e.parameter.data)) : {};
      return respuestaJSON(getCajaEgresos(datosCE));
    }
    if (e && e.parameter && e.parameter.action === 'getCajaDiaria') {
      var datosCJ = e.parameter.data ? JSON.parse(decodeURIComponent(e.parameter.data)) : {};
      return respuestaJSON(getCajaDiaria(datosCJ));
    }
    if (e && e.parameter && e.parameter.action === 'getHistorialCompras') {
      var datosHC = e.parameter.data ? JSON.parse(decodeURIComponent(e.parameter.data)) : {};
      return respuestaJSON(getHistorialCompras(datosHC));
    }
    if (e && e.parameter && e.parameter.action === 'getInventarioResumen') {
      return respuestaJSON(getInventarioResumen());
    }
    if (e && e.parameter && e.parameter.action === 'getUltimosIngresos') {
      var limiteUI = parseInt(e.parameter.limite) || 8;
      return respuestaJSON(getUltimosIngresos(limiteUI));
    }
    if (e && e.parameter && e.parameter.action === 'deshacerIngreso') {
      var datosDI = JSON.parse(decodeURIComponent(e.parameter.data));
      return respuestaJSON(deshacerIngreso(datosDI));
    }
    if (e && e.parameter && e.parameter.action === 'buscarOperacion') {
      return respuestaJSON(buscarOperacion(e.parameter.id));
    }
    if (e && e.parameter && e.parameter.action === 'getHerramientas') {
      return respuestaJSON(getHerramientas());
    }
    if (e && e.parameter && e.parameter.action === 'getMulticompraTodas') {
      return respuestaJSON(getMulticompraTodas());
    }
    if (e && e.parameter && e.parameter.action === 'diagnosticoUltimas') {
      return respuestaJSON(diagnosticoUltimas());
    }


    // ── RASPADITA ──────────────────────────────────────────────
    if (e && e.parameter && e.parameter.action === 'premiosRaspadita') {
      return respuestaJSON(premiosRaspadita());
    }
    if (e && e.parameter && e.parameter.action === 'registrarGanador') {
      var datosGanador = JSON.parse(decodeURIComponent(e.parameter.data));
      return respuestaJSON(registrarGanador(datosGanador));
    }
    if (e && e.parameter && e.parameter.action === 'getConfigRaspadita') {
      return respuestaJSON(getConfigRaspadita());
    }
    if (e && e.parameter && e.parameter.action === 'getCotizaciones') {
      return respuestaJSON(getCotizaciones());
    }
    if (e && e.parameter && e.parameter.action === 'registrarJugada') {
      var datosJugada = JSON.parse(decodeURIComponent(e.parameter.data));
      return respuestaJSON(registrarJugada(datosJugada));
    }
    if (e && e.parameter && e.parameter.action === 'buscarCodigoRaspadita') {
      return respuestaJSON(buscarCodigoRaspadita(e.parameter.codigo || ''));
    }
    if (e && e.parameter && e.parameter.action === 'entregarPremioRaspadita') {
      return respuestaJSON(entregarPremioRaspadita(e.parameter.codigo || ''));
    }
    if (e && e.parameter && e.parameter.action === 'listarPendientesRaspadita') {
      return respuestaJSON(listarPendientesRaspadita());
    }
    if (e && e.parameter && e.parameter.action === 'generarCodigoTragamonedas') {
      var montoTrag = parseFloat(e.parameter.monto || '0');
      return respuestaJSON(generarCodigoTragamonedas(montoTrag));
    }
    if (e && e.parameter && e.parameter.action === 'listarPendientesTragamonedas') {
      return respuestaJSON(listarPendientesTragamonedas());
    }
    if (e && e.parameter && e.parameter.action === 'entregarPremioTragamonedas') {
      return respuestaJSON(entregarPremioTragamonedas(e.parameter.codigo));
    }
    if (e && e.parameter && e.parameter.action === 'validarCodigoTragamonedas') {
      var dvt = JSON.parse(decodeURIComponent(e.parameter.data));
      return respuestaJSON(validarCodigoTragamonedas(dvt.codigo || ''));
    }
    if (e && e.parameter && e.parameter.action === 'registrarPremioTragamonedas') {
      var dpt = JSON.parse(decodeURIComponent(e.parameter.data));
      return respuestaJSON(registrarPremioTragamonedas(dpt));
    }
    if (e && e.parameter && e.parameter.action === 'getSinStockPriorizado') {
      return respuestaJSON(getSinStockPriorizado(e.parameter));
    }
    // ── FIN RASPADITA ───────────────────────────────────────────
// ── Módulo Pedidos WhatsApp ──────────────────────────────────
    if (e && e.parameter && e.parameter.action === 'getProductosParaPedir') {
      return respuestaJSON(getProductosParaPedir(e.parameter));
    }
    if (e && e.parameter && e.parameter.action === 'crearPedidoWA') {
      var datosP = JSON.parse(decodeURIComponent(e.parameter.data));
      return respuestaJSON(crearPedidoWA(datosP));
    }
    if (e && e.parameter && e.parameter.action === 'getPedidosWA') {
      return respuestaJSON(getPedidosWA(e.parameter));
    }
    if (e && e.parameter && e.parameter.action === 'actualizarEstadoPedido') {
      var datosE = JSON.parse(decodeURIComponent(e.parameter.data));
      return respuestaJSON(actualizarEstadoPedido(datosE));
    }
    if (e && e.parameter && e.parameter.action === 'marcarPedidoEnviado') {
      var datosM = JSON.parse(decodeURIComponent(e.parameter.data));
      return respuestaJSON(marcarPedidoEnviado(datosM));
    }
    // ── Fin módulo Pedidos WhatsApp ──────────────────────────────
    
    // ── GET PRODUCTOS (carga la tienda) ──
    const ss = SpreadsheetApp.openById(SS_ID);
    const sheet = ss.getSheetByName(HOJA_INVENTARIO);
    const datos = sheet.getDataRange().getValues();
    // v10.18 — PERF: leer de caché primero; si no hay caché (aún no corrió
    // el trigger, o falló), cae al cálculo en vivo de siempre. Ver bloque
    // "CACHÉ DE ROTACIÓN Y TEXTOS DE OFERTA" más arriba.
    const _cRot = _cacheGet_('CACHE_ROTACION_AUTO');
    const rotacionAuto = _cRot.hit ? _cRot.valor : calcularRotacionAuto();
    const _cTP = _cacheGet_('CACHE_TEXTO_OFERTA_PERSONALIZADA');
    const textoOfertaPersonalizada = _cTP.hit ? _cTP.valor : getTextoOfertaPersonalizada_();
    const _cTS = _cacheGet_('CACHE_TEXTO_OFERTA_SIMPLE');
    const textoOfertaSimple = _cTS.hit ? _cTS.valor : getTextoOfertaSimple_();
    const productos = [];
    const alertasMulticompra = []; // v10.17 — blindaje de promociones: packs bloqueados por no dar ahorro real
    let _mapaCostosRespaldo = null; // v10.2 — se arma solo si hace falta (lazy)

    // v10.11 — editor rápido de Multicompra (Ajustar producto): mismo
    // criterio de getOfertas, resolver las columnas por nombre de
    // encabezado UNA sola vez, no por producto.
    // v11.0 — resolución movida a _resolverColumnasMulticompra_() en
    // multicompra.gs (mismos 5 indexOf, mismo resultado).
    const headerMCList = datos[0].map(h => String(h || '').trim().toUpperCase());
    const colsMC = _resolverColumnasMulticompra_(headerMCList);

    for (let i = 1; i < datos.length; i++) {
      const fila = datos[i];
      if (!fila[0]) continue;
      const nombreKey = String(fila[0] || '').trim().toUpperCase();
      const rotacionCalculada = rotacionAuto[nombreKey] || (fila.length > 14 ? (parseInt(fila[14]) || 1) : 1);

      // v10.2 — costo persistido en col S; si está vacío (ingreso viejo sin
      // costo), se recurre UNA vez al mapa armado desde el Historial.
      let costoCol = fila.length > 18 ? (parseFloat(fila[18]) || 0) : 0;
      if (!costoCol) {
        if (_mapaCostosRespaldo === null) _mapaCostosRespaldo = _mapaUltimosCostosDesdeHistorial();
        costoCol = _mapaCostosRespaldo[nombreKey] || 0;
      }

      const producto = {
        id: i,
        name: String(fila[0] || '').trim(),
        price: parseInt(fila[1]) || 0,
        category: String(fila[2] || 'ALMACEN').trim().toUpperCase(),
        stock: parseInt(fila[5]) || 0,
        descripcion: fila[3] || '',
        image: '',
        relampago: parseInt(fila[6]) || 0,
        destacada: parseInt(fila[7]) || 0,
        especial: parseInt(fila[8]) || 0,
        normal: 0,
        // v18/09/2026 — 2x1 real, columna AL (38, fila[37]). Flag simple
        // sí/no — el cálculo de "cada par, una gratis" vive en seba21.html.
        oferta2x1: fila.length > 37 ? _esActivoFlag_(fila[37]) : false,
        proveedor: String(fila[4] || '').trim(),
        vencimiento: (() => {
          try {
            const v = fila.length > 15 ? fila[15] : '';
            if (!v) return '';
            if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
            return String(v).trim();
          } catch(e) { return ''; }
        })(),
        rotacion: rotacionCalculada,
        costo: costoCol,
        precioCosto: costoCol, // v10.2 — el frontend lee p.precioCosto; antes solo existía "costo" y nunca coincidía
        diaCritico: fila.length > 16 ? String(fila[16] || '').trim().toLowerCase() : '',
        stockMin: parseInt(fila[13]) || 0,
        prioridad: fila.length > 31 ? String(fila[31] || '').trim().toUpperCase() : 'NORMAL',
        pausadoListaCompra: fila.length > 34 ? String(fila[34] || '').trim().toUpperCase() : '',
        ultimaPromo: '',
        categoriaOferta: String(fila[9] || '').trim()
      };

      // v10.11/v10.15/v10.17 — campos de multicompra + blindaje de
      // promociones: movido a _evaluarMulticompraFila_() en multicompra.gs.
      // Mismo resultado: mcActiva/mcTipo/mcCantidad/mcPrecio/mcGrupo en el
      // producto, y si la multicompra activa en la planilla no da ahorro
      // real, se apaga mcActiva (precio normal intacto) y se agrega a
      // alertasMulticompra — la planilla nunca se modifica acá.
      const _mcInfo = _evaluarMulticompraFila_(fila, colsMC, producto.price, producto.name);
      producto.mcActiva   = _mcInfo.mcActiva;
      producto.mcTipo      = _mcInfo.mcTipo;
      producto.mcCantidad  = _mcInfo.mcCantidad;
      producto.mcPrecio    = _mcInfo.mcPrecio;
      producto.mcGrupo     = _mcInfo.mcGrupo;
      if (_mcInfo.mcBloqueada) {
        producto.mcBloqueada = true;
        producto.mcMotivoBloqueo = _mcInfo.mcMotivoBloqueo;
        alertasMulticompra.push(_mcInfo.alerta);
      }

      if (fila.length > 11) {
        const columnaL = fila[11];
        if (columnaL !== undefined && columnaL !== '' && columnaL !== null) {
          const num = parseInt(columnaL);
          if (!isNaN(num) && num > 0) producto.normal = num;
        }
      }
      if (producto.normal === 0 && fila.length > 10) {
        const columnaK = fila[10];
        if (columnaK !== undefined && columnaK !== '' && columnaK !== null) {
          const num = parseInt(columnaK);
          if (!isNaN(num) && num > 0) producto.normal = num;
        }
      }

      // OFERTA SIMPLE — col AK (37): precio final directo, sin %, lo escribe
      // Javier a mano ("antes $2.000 → hoy $1.500"). Tiene PRIORIDAD sobre
      // Oferta Personalizada por % — si ambas están activas para el mismo
      // producto, esta gana y la de % ni se calcula.
      const precioSimple = fila.length > 36 ? (parseFloat(fila[36]) || 0) : 0;
      if (precioSimple > 0 && textoOfertaSimple) {
        const stockOkS = producto.stock > 0;
        let vencidoOkS = true;
        if (producto.vencimiento) {
          try {
            const vS = new Date(producto.vencimiento + 'T00:00:00');
            const hoyS = new Date(); hoyS.setHours(0, 0, 0, 0);
            if (vS <= hoyS) vencidoOkS = false;
          } catch (eS) { /* fecha rara, no bloquea */ }
        }
        if (stockOkS && vencidoOkS && precioSimple < producto.price) {
          producto.ofertaPersonalizada = {
            activa: true, tipo: 'directo',
            texto: textoOfertaSimple,
            precioFinal: precioSimple,
            etiqueta: '🎯 ' + textoOfertaSimple
          };
          // Campo dedicado además del de arriba — sendwa.html lo necesita para
          // "📋 Ofertas activas en planilla", el aviso de "¿Cargar la oferta
          // que ya está en la planilla?" y el ✕ individual de cada producto.
          // Sin esto, esas 3 funciones fallan en silencio (no tiran error,
          // simplemente no encuentran nada) aunque el resto ande bien.
          producto.ofertaSimple = {
            activa: true,
            precioFinal: precioSimple,
            precio: precioSimple,
            texto: textoOfertaSimple
          };
        }
      }

      // OFERTA PERSONALIZADA — col AJ (36): código 1-6 → 10/20/30/40/50/60% aprox.,
      // precio final con redondeo psicológico (...499/...999), texto único de config_sistema.
      // BLINDAJE (misma filosofía que la fórmula de columna J): no se activa si...
      const tipoPers = fila.length > 35 ? (parseInt(fila[35]) || 0) : 0;
      const pctPers  = PCT_OFERTA_PERSONALIZADA[tipoPers];
      if (!producto.ofertaPersonalizada && tipoPers >= 1 && tipoPers <= 6 && pctPers && textoOfertaPersonalizada) {
        const stockOk = producto.stock > 0; // sin stock no se ofrece, igual que "sin stock" de J
        let vencidoOk = true;
        if (producto.vencimiento) {
          try {
            const vP = new Date(producto.vencimiento + 'T00:00:00');
            const hoyP = new Date(); hoyP.setHours(0, 0, 0, 0);
            if (vP <= hoyP) vencidoOk = false; // vencido: no se empuja con descuento
          } catch (eV) { /* fecha rara, no bloquea */ }
        }
        if (stockOk && vencidoOk) {
          const precioFinalPers = psicoRound_(producto.price * (1 - pctPers / 100), producto.price);
          // Última red de seguridad: si por algún motivo no quedó por debajo del
          // precio original, no se activa (equivalente a "ERROR: NO DESCUENTA" de J).
          if (precioFinalPers < producto.price) {
            producto.ofertaPersonalizada = {
              activa: true, tipo: tipoPers, porcentaje: pctPers,
              texto: textoOfertaPersonalizada,
              precioFinal: precioFinalPers,
              etiqueta: '🎉 ' + textoOfertaPersonalizada
            };
          }
        }
      }

      productos.push(producto);
    }

    return ContentService
      .createTextOutput(JSON.stringify({
        productos: productos,
        total: productos.length,
        fecha: new Date().toISOString(),
        version: '7.0',
        alertasMulticompra: alertasMulticompra // v10.17 — blindaje de promociones
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    console.error('❌ Error API:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ error: true, mensaje: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ========== PROCESAR VENTA ==========
// v9.2 — BATCH WRITES: toda la rebaja de stock se hace en un solo setValues()
// y la escritura en hoja Ventas también en un solo batch (appendRows no disponible
// en Apps Script → se usa getRange + setValues con bloque contiguo pre-calculado).
// Resultado: de 10-20 escrituras individuales a 2-3 operaciones → 3-5s vs 20-30s.
// ========== SUGERENCIA PEDIDO PAN — ESTADO COMPARTIDO (v9.9) ==========
// Antes esto se llevaba solo con localStorage en el celular, así que
// tocar "Hoy no" o pedir el pan en un teléfono no frenaba la sugerencia en
// otro (localStorage es por dispositivo). Se guarda un flag simple en
// PropertiesService (no hace falta tocar config_sistema para esto) con la
// fecha del último "ya se avisó" — cualquier celular que consulte ve lo
// mismo.
function getPanSugeridoHoy() {
  try {
    const hoy = Utilities.formatDate(new Date(), 'America/Argentina/Buenos_Aires', 'yyyy-MM-dd');
    const guardado = PropertiesService.getScriptProperties().getProperty('pan_sugerido_fecha');
    return { success: true, yaSugerido: guardado === hoy };
  } catch (e) {
    return { success: false, yaSugerido: false, mensaje: e.toString() };
  }
}

function marcarPanSugeridoHoy() {
  try {
    const hoy = Utilities.formatDate(new Date(), 'America/Argentina/Buenos_Aires', 'yyyy-MM-dd');
    PropertiesService.getScriptProperties().setProperty('pan_sugerido_fecha', hoy);
    return { success: true };
  } catch (e) {
    return { success: false, mensaje: e.toString() };
  }
}

function procesarVenta(dataStr) {
  try {
    const payload = JSON.parse(decodeURIComponent(dataStr));
    const items = Array.isArray(payload) ? payload : (payload.items || []);
    const metodoPago = Array.isArray(payload) ? 'efectivo' : (payload.metodoPago || 'efectivo');
    const vendedor = Array.isArray(payload) ? '' : (payload.vendedor || '');
    const ventaPayload = Array.isArray(payload) ? {} : payload;

    if (!items || !Array.isArray(items) || items.length === 0) return respuestaJSON({ success: false, mensaje: 'Sin items' });

    // ── Anti-duplicado con LockService ──────────────────────────────────────
    if (payload.idVenta) {
      var lock = LockService.getScriptLock();
      try { lock.waitLock(6000); } catch(lockErr) {
        return respuestaJSON({ success: false, duplicate: true, mensaje: 'Venta en proceso, intentá de nuevo' });
      }
      try {
        var props = PropertiesService.getScriptProperties();
        var procesados2 = props.getProperty('ventas_procesadas') || '';
        if (procesados2.indexOf(payload.idVenta) !== -1) {
          return respuestaJSON({ success: true, duplicate: true });
        }
        var lista2 = procesados2 ? procesados2.split(',') : [];
        lista2.push(payload.idVenta);
        if (lista2.length > 100) lista2 = lista2.slice(-100);
        props.setProperty('ventas_procesadas', lista2.join(','));
      } finally { lock.releaseLock(); }
    }

    // ── BLINDAJE: candado obligatorio para todo el proceso de venta ────────
    // El candado de arriba solo actúa si el celular manda idVenta (protege
    // contra reintentos con el MISMO idVenta). Este de acá es incondicional:
    // sin él, dos ventas que llegan casi al mismo instante pueden leer el
    // mismo getLastRow() antes de que la primera termine de escribir, y
    // terminan generando el mismo número de ticket con dos filas de TOTAL
    // (causa confirmada del ticket #2260 duplicado). Serializa el proceso
    // completo: lectura de stock, descuento, y escritura en hoja Ventas.
    var lockVenta = LockService.getScriptLock();
    try { lockVenta.waitLock(15000); } catch (lockErr2) {
      return respuestaJSON({ success: false, mensaje: 'Local ocupado procesando otra venta, esperá unos segundos e intentá de nuevo' });
    }
    try {

    const ss = SpreadsheetApp.openById(SS_ID);
    const sheetInventario = ss.getSheetByName(HOJA_INVENTARIO);

    // ── PASO 1: leer inventario completo de una vez (1 operación) ───────────
    const todosLosDatos = sheetInventario.getDataRange().getValues();
    const errores = [];
    const procesados = [];
    const fecha = new Date();
    let totalVenta = 0;

    // Mapa de filaIndex → nuevoStock para hacer el batch write al final
    const stockUpdates = {}; // { filaIndex: nuevoValor }

    // ── v9.6: mapa nombre normalizado → filaIndex, para la protección de
    // abajo (búsqueda de respaldo cuando el índice que mandó el celular
    // quedó desincronizado). Se arma una sola vez, no por item.
    const _normVenta = s => String(s || '').trim().toUpperCase().replace(/\s+/g, ' ');
    const _nombreAFilaVenta = {};
    for (let r = 1; r < todosLosDatos.length; r++) {
      if (!todosLosDatos[r][0]) continue;
      const key = _normVenta(todosLosDatos[r][0]);
      if (_nombreAFilaVenta[key] === undefined) _nombreAFilaVenta[key] = r;
    }

    for (const item of items) {
      let filaIndex = item.esPeso ? (item.idOriginal || item.id) : item.id;
      if (filaIndex < 1 || filaIndex >= todosLosDatos.length) { errores.push('ID ' + item.id + ' no encontrado'); continue; }
      let fila = todosLosDatos[filaIndex];
      let nombreEnSheet = String(fila[0] || '').trim();

      // ── v9.6: PROTECCIÓN CONTRA DESINCRONIZACIÓN DE ÍNDICE DE FILA ──────
      // item.id es la POSICIÓN de fila que tenía el producto cuando el
      // celular cargó el catálogo (ver doGet: id:i). Si alguien borra o
      // reordena una fila en Inventario mientras el POS sigue abierto, esa
      // posición pasa a ser OTRO producto — y sin este chequeo se le
      // descontaría el stock al que quedó ahí de casualidad, no al que
      // realmente se vendió (raíz más probable de "el stock no coincide").
      // El celular ya manda item.name en cada venta; si no coincide con lo
      // que hay ahora en esa fila, se busca el producto correcto por nombre
      // antes de tocar ningún stock.
      if (item.name) {
        // v9.7: en venta por peso el celular manda el nombre CON los gramos
        // pegados al final, ej. "MANDARINA X KG (2000gr)" — hay que sacar
        // esa parte antes de comparar contra la planilla, o nunca va a
        // coincidir (eso rompió las ventas por peso en v9.6: cortaba la
        // línea entera pensando que el producto no existía).
        const nombreBase = item.esPeso
          ? String(item.name).replace(/\s*\(\s*\d+\s*gr\s*\)\s*$/i, '')
          : item.name;
        const nombreEsperado = _normVenta(nombreBase);
        if (_normVenta(nombreEnSheet) !== nombreEsperado) {
          const filaCorrecta = _nombreAFilaVenta[nombreEsperado];
          if (filaCorrecta !== undefined) {
            filaIndex = filaCorrecta;
            fila = todosLosDatos[filaIndex];
            nombreEnSheet = String(fila[0] || '').trim();
          } else {
            errores.push((item.name || nombreEnSheet) + ': no se encontró en el inventario actual (¿se borró o cambió de nombre mientras el POS estaba abierto?) — NO se descontó stock, revisar manualmente');
            continue;
          }
        }
      }

      const precioUnit = parseInt(fila[1]) || 0;
      const qty = parseInt(item.qty) || 0;
      const esPeso = item.esPeso === true;
      const gramos = parseInt(item.gramos) || 0;
      const precioVenta = (item.precioVenta !== undefined && item.precioVenta !== null && item.precioVenta !== '') ? parseInt(item.precioVenta) : precioUnit;
      const precioOriginal = parseInt(item.precioOriginal) || 0;
      const precioModificado = item.precioModificado === true;

      if (esPeso && gramos <= 0) { errores.push(nombreEnSheet + ': gramos inválidos'); continue; }
      if (!esPeso && qty <= 0) continue;

      if (esPeso) {
        const kgVendidos = gramos / 1000;
        const stockEnKg = parseFloat(fila[5]) || 0;
        // Si el mismo producto aparece dos veces en el carrito, acumular
        const baseStock = stockUpdates[filaIndex] !== undefined ? stockUpdates[filaIndex] : stockEnKg;
        const nuevoStockKg = Math.max(0, Math.round((baseStock - kgVendidos) * 1000) / 1000);
        stockUpdates[filaIndex] = nuevoStockKg;
        const nombreConPeso = gramos > 0 ? nombreEnSheet + ' (' + gramos + 'gr)' : nombreEnSheet;
        const kgDisplay = Math.round(kgVendidos * 1000) / 1000;
        totalVenta += precioVenta;
        procesados.push({ name: nombreConPeso, qty: kgDisplay, nuevoStock: nuevoStockKg, precio: precioVenta, esPeso: true, gramos });
      } else {
        const stockActual = parseInt(fila[5]) || 0;
        const baseStock = stockUpdates[filaIndex] !== undefined ? stockUpdates[filaIndex] : stockActual;
        // v9.6: si no hay stock suficiente, antes se registraba el error PERO
        // igual se cobraba y se dejaba el stock en 0 (vendía "de más" sin
        // avisar de verdad). Ahora se corta la línea y no se cobra ese item.
        if (baseStock < qty) {
          errores.push(nombreEnSheet + ': stock insuficiente (tiene ' + baseStock + ', se quiso vender ' + qty + ') — NO se cobró este ítem');
          continue;
        }
        const nuevoStock = Math.max(0, baseStock - qty);
        stockUpdates[filaIndex] = nuevoStock;
        totalVenta += precioVenta * qty;
        procesados.push({ name: nombreEnSheet, qty, nuevoStock, precio: precioVenta, precioModificado, precioOriginal });
      }
    }

    // ── PASO 2: escribir stock en BATCH — una operación por fila afectada ───
    // En lugar de N setValue() individuales, agrupamos filas contiguas y
    // hacemos setValues() por grupo. Peor caso: N operaciones si no son
    // contiguas, pero sin el overhead de leer la hoja N veces.
    const filasAfectadas = Object.keys(stockUpdates).map(Number).sort((a, b) => a - b);
    for (const fi of filasAfectadas) {
      sheetInventario.getRange(fi + 1, 6).setValue(stockUpdates[fi]);
    }
    // Un solo flush consolida todas las escrituras de stock antes de continuar
    SpreadsheetApp.flush();

    // ── PASO 3: ticket y hoja Ventas en batch ───────────────────────────────
    var ticketStr = null;
    try {
      const sheetVentas = ss.getSheetByName('Ventas');
      if (sheetVentas) {
        const tz = Session.getScriptTimeZone();
        const hora = Utilities.formatDate(fecha, tz, 'HH:mm');
        const filasTotales = sheetVentas.getLastRow();
        let ultimoTicket = 0;
        if (filasTotales > 1) {
          const colA = sheetVentas.getRange(2, 1, filasTotales - 1, 1).getValues();
          for (const f of colA) { const n = parseInt(f[0]); if (!isNaN(n) && n > ultimoTicket) ultimoTicket = n; }
        }
        const nroTicket = ultimoTicket + 1;
        ticketStr = String(nroTicket).padStart(4, '0');

        // Construir todas las filas del ticket en memoria y escribirlas de una vez
        const filasVenta = [];
        for (const p of procesados) {
          const subtotal = p.esPeso ? p.precio : p.precio * p.qty;
          const cantDisplay = p.esPeso ? p.qty : p.qty;
          const nombreDisplay = p.precioModificado
            ? p.name + (p.precioOriginal ? ' [PRECIO ESP: $' + p.precioOriginal + '→$' + p.precio + ']' : ' [PRECIO ESPECIAL]')
            : p.name;
          filasVenta.push([ticketStr, fecha, hora, nombreDisplay, cantDisplay, p.precio, subtotal]);
        }
        // Fila de total
        const totalUnidades = procesados.reduce((s, p) => s + (p.esPeso ? 1 : p.qty), 0);
        const metodoPagoEmoji = metodoPago === 'posnet' ? '💳' : metodoPago === 'transferencia' ? '📱' : metodoPago === 'FIADO' ? '🧾' : '💵';
        const clienteInfo = (metodoPago === 'FIADO' && ventaPayload.clienteFiado)
          ? ' | 👤 ' + ventaPayload.clienteFiado + (ventaPayload.telefonoFiado ? ' · ' + ventaPayload.telefonoFiado : '') : '';
        filasVenta.push(['', fecha, hora, '─── TOTAL TICKET N° ' + ticketStr + ' ───', totalUnidades, metodoPagoEmoji + ' ' + metodoPago.toUpperCase() + clienteInfo, vendedor, totalVenta]);

        // Una sola escritura batch para todo el ticket
        const primeraFilaLibre = filasTotales + 1;
        // Las filas de items tienen 7 cols, la de total tiene 8 — escribimos por separado
        const filasItems = filasVenta.slice(0, filasVenta.length - 1);
        const filaTotalTicket = filasVenta[filasVenta.length - 1];

        if (filasItems.length > 0) {
          // Formatear col A como texto para el ticket (evita que Sheets lo convierta a número)
          const rangoTicketCol = sheetVentas.getRange(primeraFilaLibre, 1, filasItems.length, 1);
          rangoTicketCol.setNumberFormat('@STRING@');
          sheetVentas.getRange(primeraFilaLibre, 1, filasItems.length, 7).setValues(filasItems);
        }
        // Fila de total siempre como appendRow (tiene 8 cols y ticket vacío — más simple)
        sheetVentas.appendRow(filaTotalTicket);

        // v10.7 — pago mixto/multimoneda (SEBA21 v443). Si no viene
        // detallePagos, no se toca nada más — cero cambio de comportamiento
        // para ventas normales de un solo método. Si viene, se valida la
        // cotización de USD/CLP contra config_sistema EN EL SERVIDOR (no se
        // confía en lo que mandó el celular) y se guarda el detalle
        // estructurado en la columna I de esta misma fila de total.
        if (ventaPayload.detallePagos && ventaPayload.detallePagos.pagos && ventaPayload.detallePagos.pagos.length) {
          try {
            var cotServer = getCotizaciones();
            var pagosValidados = ventaPayload.detallePagos.pagos.map(function(p) {
              var moneda = String(p.moneda || 'ARS').toUpperCase();
              var recibido = parseFloat(p.recibido) || 0;
              var cotizacion = 1, equivalenteARS = recibido;
              if (moneda === 'USD' && cotServer.ok && cotServer.usdValor > 0) {
                cotizacion = cotServer.usdValor;
                equivalenteARS = Math.round(recibido * cotizacion);
              } else if (moneda === 'CLP' && cotServer.ok && cotServer.clpValor > 0) {
                cotizacion = cotServer.clpValor;
                equivalenteARS = Math.round(recibido * cotizacion);
              }
              return { metodo: String(p.metodo || '').toUpperCase(), moneda: moneda, recibido: recibido, cotizacion: cotizacion, equivalenteARS: equivalenteARS };
            });
            var detalleFinal = { pagos: pagosValidados, vueltoARS: parseFloat(ventaPayload.detallePagos.vueltoARS) || 0 };
            var filaTotalNum = primeraFilaLibre + filasItems.length;
            sheetVentas.getRange(filaTotalNum, 9).setValue(JSON.stringify(detalleFinal));
          } catch (eDetalle) {
            console.warn('⚠️ No se pudo registrar detallePagos:', eDetalle.toString());
          }
        }
      }
    } catch (e) {
      console.warn('⚠️ No se pudo registrar en hoja Ventas:', e.toString());
    }

    return respuestaJSON({ success: true, procesados: procesados.length, total: totalVenta, ticket: ticketStr, errores: errores, fecha: fecha.toISOString() });

    } finally { lockVenta.releaseLock(); }
  } catch (error) {
    return respuestaJSON({ success: false, mensaje: error.toString() });
  }
}

// ========== AGREGAR PRODUCTO NUEVO ==========
function agregarProducto(dataStr) {
  try {
    const datos = JSON.parse(decodeURIComponent(dataStr));
    if (!datos.name || !datos.name.trim()) return respuestaJSON({ success: false, mensaje: 'El nombre es obligatorio' });
    if (!datos.price || parseInt(datos.price) <= 0) return respuestaJSON({ success: false, mensaje: 'El precio debe ser mayor a 0' });

    const ss = SpreadsheetApp.openById(SS_ID);
    const sheet = ss.getSheetByName(HOJA_INVENTARIO);
    const datosActuales = sheet.getDataRange().getValues();
    const nombreNuevo = datos.name.trim().toUpperCase().replace(/\s+/g, ' ');

    for (let i = 1; i < datosActuales.length; i++) {
      const nombreExistente = String(datosActuales[i][0] || '').trim().toUpperCase().replace(/\s+/g, ' ');
      if (nombreExistente === nombreNuevo) return respuestaJSON({ success: false, mensaje: 'Ya existe: "' + datosActuales[i][0] + '" en fila ' + (i + 1) });
    }

    const totalFilas = datosActuales.length;
    const idDesc = 'ID' + String(totalFilas).padStart(3, '0');
    const nuevaFila = [
      datos.name.trim().toUpperCase(), parseInt(datos.price) || 0,
      String(datos.category || 'ALMACEN').trim().toUpperCase(), idDesc,
      String(datos.proveedor || '').trim().toUpperCase(), parseInt(datos.stock) || 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, datos.vencimiento || ''
    ];
    sheet.appendRow(nuevaFila);

    try {
      const hojaHistorial = ss.getSheetByName(HOJA_HISTORIAL);
      if (hojaHistorial) {
        hojaHistorial.appendRow([
          new Date(), datos.name.trim().toUpperCase(), parseInt(datos.stock) || 0,
          parseInt(datos.stock) || 0, 'ALTA',
          String(datos.proveedor || '').trim().toUpperCase(),
          parseInt(datos.precioCosto) || 0, parseInt(datos.price) || 0,
          datos.vencimiento ? new Date(datos.vencimiento) : ''
        ]);
      }
    } catch(eHist) { console.warn('⚠️ No se pudo escribir en Historial:', eHist.toString()); }

    return respuestaJSON({ success: true, mensaje: '✅ "' + datos.name.trim() + '" agregado correctamente', fila: totalFilas + 1, id: totalFilas });
  } catch (error) {
    return respuestaJSON({ success: false, mensaje: error.toString() });
  }
}

// ========== HELPERS ==========
function respuestaJSON(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function pruebaRapida() {
  const resultado = doGet(null);
  const json = JSON.parse(resultado.getContent());
  console.log('Versión API:', json.version);
  console.log('Total productos:', json.total);
  return json;
}

// ========== REPORTES COMPLETOS ==========
function getReportes() {
  try {
    const ss = SpreadsheetApp.openById(SS_ID);
    const sheetVentas = ss.getSheetByName('Ventas');
    const sheetInv    = ss.getSheetByName(HOJA_INVENTARIO);
    if (!sheetVentas) return { error: 'No existe hoja Ventas' };

    const tz = Session.getScriptTimeZone();
    const filas = sheetVentas.getDataRange().getValues();
    const hoy = new Date();
    const costos = {};
    const sheetHist2 = ss.getSheetByName(HOJA_HISTORIAL);
    const stockInfo = {};
    const proveedorInfo = {}; // nombre → proveedor principal del inventario

    if (sheetInv) {
      const inv = sheetInv.getDataRange().getValues();
      const _aliasEspecificos = {};
          _aliasEspecificos["AZUCAR LEDESMA 1KG"] = "AZUCAR LEDESMA CLASICA 1KG";
          _aliasEspecificos["ENCENDEDOR BIC MAXI J6LISO"] = "ENCENDEDOR GRANDE BIC MAXI J6LISO";
          _aliasEspecificos["ENCENDEDOR BIC MINI J5LISO"] = "ENCENDEDOR CHICO BIC MINI J5LISO";
          _aliasEspecificos["FIDEOS MATARAZZO 500GR (CODITOS RAYADOS) 500 GR"] = "FIDEOS MATARAZZO 500GR (CODITO RAYADO) 500 GR";
          _aliasEspecificos["FIDEOS MATARAZZO 500GR (TALLARINES N5) 500 GR"] = "FIDEOS MATARAZZO 500GR (TALLARIN N5) 500 GR";
          _aliasEspecificos["JUGO EN POLVO NARANJA BANANA ARCOR X 15GR"] = "JUGO EN POLVO NARANJA BANANA ARCOR X 15GR";
          _aliasEspecificos["JUGO EN POLVO NARANJA DULCE TANG X 15GR"] = "JUGO EN POLVO NARANJA TANG X 15GR";
          _aliasEspecificos["JUGO EN POLVO SABOR A MULTIFRUTA ARCOR 15G 1L"] = "JUGO EN POLVO MULTIFRUTA ARCOR 15GR";
          _aliasEspecificos["LAMPARA 9W E27"] = "LAMPARA 9W E27 FOCO";
          _aliasEspecificos["LENTEJAS SECAS REMOJADAS INALPA LATA"] = "LENTEJAS SECAS REMOJADAS INALPA LATA 300GR";
          _aliasEspecificos["LEVADURA 10GR"] = "LEVADURA MI PAN 10GR";
          _aliasEspecificos["PAN RALLADO 500GR"] = "PAN RALLADO PREFERIDO  500GR";
          _aliasEspecificos["PURE DE TOMATE NOEL 530GR"] = "PURE DE TOMATE NOEL 520GR";
          _aliasEspecificos["RAZA COMIDA DE GATO 1KG"] = "RAZA GATO CARNE PESCADO ARROZ 1KG";
          _aliasEspecificos["RAZA COMIDA DE GATO 500GR"] = "RAZA GATO CARNE PESCADO ARROZ 500GR";
          _aliasEspecificos["REBOSADOR 500GR"] = "REBOSADOR PREFERIDO 500GR";
          _aliasEspecificos["SAL DOS ESTRELLAS ENTREFINA 1KG"] = "SAL  ENTREFINA DOS ESTRELLAS  1KG";
          _aliasEspecificos["SAL FINA 500GR"] = "SAL FINA DOS ESTRELLAS 500GR";
          _aliasEspecificos["TOMATE PERITAS EN LATA ARCOR 400GR"] = "TOMATE PELADO PERITA ARCOR LATA 400GR";
          _aliasEspecificos["JUGO BAGGIO CAJA 1,5 LITROS NARANJA"] = "JUGO BAGGIO FRESH CAJA 1,5 LITROS NARANJA";
          _aliasEspecificos["NARANJAS KG"] = "NARANJA X KG";
          _aliasEspecificos["QUESO LA PAULINA BARRA SANDWICH 1KG"] = "QUESO LA PAULINA BARRA SANDWICH X KG";
          _aliasEspecificos["PAPELILLO"] = "PAPELILLO OCB SEDA";
          _aliasEspecificos["JUGO EN POLVO ARCOR SABOR A MULTIFRUTA 15G 1L"] = "JUGO EN POLVO MULTIFRUTA ARCOR 15GR";
          _aliasEspecificos["ARROZ 1 KG PRIMOR"] = "ARROZ 1KG PRIMOR";
          _aliasEspecificos["PROCENEX"] = "PROCENEX LIMPIADOR PISOS 900ML";
          _aliasEspecificos["MISTER TRAPO PISO 62X48"] = "MISTER TRAPO PISO 62X48 MR";
          _aliasEspecificos["ALFAJOR PEPITOS X3 57GR"] = "ALFAJOR TRIPLE PEPITOS 57GR";

      const _aliasOrigen = {};

      for (let i = 1; i < inv.length; i++) {
        const nom = String(inv[i][0]||'').trim().toUpperCase();
        const sto = parseInt(inv[i][5]) || 0;
        const cos = parseFloat(inv[i][18]) || 0;
        if (!nom) continue;

        stockInfo[nom] = sto;
        if (cos > 0) costos[nom] = cos;
        var prov = String(inv[i][4] || '').trim().toUpperCase();
        if (prov) proveedorInfo[nom] = prov;
        if (String(inv[i][34] || '').trim().toUpperCase() === 'SI') {
          stockInfo['__pausado__' + nom] = true;
        }

        Object.keys(_aliasEspecificos).forEach(function(viejo) {
          if (_aliasEspecificos[viejo] === nom && stockInfo[viejo] === undefined) {
            stockInfo[viejo] = sto;
            if (cos > 0 && !costos[viejo]) costos[viejo] = cos;
            Logger.log('⚠️ Alias específico: "' + viejo + '" → "' + nom + '"');
          }
        });

        function _normBase(s) {
          return s.replace(/\s+/g, ' ').replace(/,/g, '.').trim();
        }

        var base = _normBase(nom);
        var candidatos = new Set();

        candidatos.add(base.replace(/ X KG$/, ' KG').replace(/ X KG /, ' KG ').trim());
        candidatos.add(base.replace(/\bFRESH\b/g, '').replace(/\s+/g, ' ').trim());
        candidatos.add(base.replace(/\bCON FRUTAS?\b/gi, '').replace(/\s+/g, ' ').trim());
        candidatos.add(base.replace(/\bDOBLE CREMA\b/gi, '').replace(/\s+/g, ' ').trim());
        candidatos.add(base.replace(/\bX (\d+GR)\b/g, '$1').replace(/\s+/g, ' ').trim());
        candidatos.add(base.replace(/ X KG$/, ' KG').replace(/ X KG /, ' KG ').replace(/\bFRESH\b/g, '').replace(/\s+/g, ' ').trim());

        candidatos.forEach(function(alias) {
          if (!alias || alias === nom) return;
          if (stockInfo[alias] !== undefined) {
            if (_aliasOrigen[alias] && _aliasOrigen[alias] !== nom) {
              Logger.log('⚠️ Colisión de alias: "' + alias + '" entre "' + _aliasOrigen[alias] + '" y "' + nom + '"');
            }
            return;
          }
          stockInfo[alias] = sto;
          if (cos > 0 && !costos[alias]) costos[alias] = cos;
          _aliasOrigen[alias] = nom;
          Logger.log('⚠️ Alias usado para stockInfo: "' + alias + '" -> "' + nom + '"');
        });
      }
    }
    if (sheetHist2) {
      const hist = sheetHist2.getDataRange().getValues();
      for (let i = 1; i < hist.length; i++) {
        const nom = String(hist[i][1]||'').trim().toUpperCase();
        const cos = parseFloat(hist[i][6]) || 0;
        if (nom && cos > 0 && !costos[nom]) costos[nom] = cos;
      }
    }

    const vencProximos = [];
    if (sheetInv) {
      const inv = sheetInv.getDataRange().getValues();
      const limite = new Date(); limite.setDate(limite.getDate() + 30);
      for (let i = 1; i < inv.length; i++) {
        const nom = String(inv[i][0]||'').trim();
        const stock = parseInt(inv[i][5])||0;
        const venc = inv[i].length > 15 ? inv[i][15] : '';
        if (!venc || !nom) continue;
        let fechaVenc;
        try { fechaVenc = venc instanceof Date ? venc : new Date(venc); } catch(e) { continue; }
        if (isNaN(fechaVenc.getTime())) continue;
        const dias = Math.round((fechaVenc - hoy) / 86400000);
        if (dias <= 30) vencProximos.push({ nombre: nom, stock, fecha: Utilities.formatDate(fechaVenc, tz, 'yyyy-MM-dd'), dias, vencido: dias < 0 });
      }
      vencProximos.sort((a,b) => a.dias - b.dias);
    }

    const items = [];
    const totales = [];

    for (let i = 1; i < filas.length; i++) {
      const f = filas[i];
      const colA  = String(f[0]||'').trim();
      const fecha = f[1];
      if (!fecha || !(fecha instanceof Date)) continue;
      const fechaStr = Utilities.formatDate(fecha, tz, 'yyyy-MM-dd');
      const rawHora = f[2];
      let hora = '';
      if (rawHora instanceof Date) {
        hora = Utilities.formatDate(rawHora, tz, 'HH:mm');
      } else {
        hora = String(rawHora||'').trim();
        const hm = hora.match(/\b(\d{1,2}):(\d{2}):/);
        if (hm) hora = hm[1].padStart(2,'0') + ':' + hm[2];
      }
      const nombre = String(f[3]||'').trim();

      if (nombre.includes('TOTAL TICKET')) {
        const ticketMatch = nombre.match(/N[°ºo]?\s*(\d+)/i);
        const ticket = ticketMatch ? String(ticketMatch[1]).padStart(4,'0') : colA;
        const metodo   = String(f[5]||'').replace(/[💵📱💳🔀🏦]/g,'').trim().toUpperCase();
        const vendedor = String(f[6]||'').trim();
        const total    = parseFloat(f[7]) || 0;
        totales.push({ fechaStr, hora, ticket, metodo, vendedor, total });
      } else if (nombre && !nombre.startsWith('─')) {
        const ticketRaw = String(colA||'').trim();
        const ticket    = ticketRaw.match(/^\d+$/) ? ticketRaw.padStart(4,'0') : ticketRaw;
        const qtyRaw   = f[4];
        const qtyStr   = String(qtyRaw||'').trim();
        let qty        = parseFloat(qtyStr.replace('gr','').replace('kg','')) || 0;
        const esQtyEnGramos = /\(\d+gr\)/i.test(nombre) && qty >= 50;
        if (esQtyEnGramos) qty = qty / 1000;
        const precio   = parseFloat(f[5]) || 0;
        const subtotal = parseFloat(f[6]) || 0;
        const nomLimpio = nombre.replace(/\[PRECIO ESP[^]]*\]/,'').replace(/\s*\(\d+gr\)/i,'').replace(/\s*\(\d+\.?\d*kg\)/i,'').trim().toUpperCase();
        const costo    = costos[nomLimpio] || 0;
        const tieneCosto = costo > 0;
        const gananciaReal = tieneCosto ? subtotal - (costo * qty) : null;
        const gananciaAprox = subtotal * 0.4;
        items.push({ fechaStr, hora, ticket, nombre: nomLimpio, qty, precio, subtotal, costo, gananciaReal, gananciaAprox, tieneCosto });
      }
    }

    const mapaGanancia = {};
    for (const it of items) {
      if (!mapaGanancia[it.nombre]) {
        mapaGanancia[it.nombre] = { nombre: it.nombre, qtdVendida: 0, ingresos: 0, gananciaReal: 0, gananciaAprox: 0, tieneCosto: it.tieneCosto, costo: it.costo };
      }
      const m = mapaGanancia[it.nombre];
      m.qtdVendida  += it.qty;
      m.ingresos    += it.subtotal;
      m.gananciaAprox += it.gananciaAprox;
      if (it.gananciaReal !== null) { m.gananciaReal += it.gananciaReal; m.tieneCosto = true; }
    }

    const topGanancia = Object.values(mapaGanancia)
      .map(p => ({ ...p, ganancia: p.tieneCosto ? p.gananciaReal : p.gananciaAprox, esReal: p.tieneCosto }))
      .filter(p => p.ganancia > 0)
      .sort((a, b) => b.ganancia - a.ganancia)
      .slice(0, 20);

    var recienLlegados = [];
    try {
      var hoy3 = new Date();
      hoy3.setHours(0, 0, 0, 0);
      var hace3 = new Date(hoy3.getTime() - 3 * 86400000);

      var nomIngresados = {};
      if (sheetHist2) {
        var histRL = sheetHist2.getDataRange().getValues();
        for (var hi = 1; hi < histRL.length; hi++) {
          var hFecha = histRL[hi][0];
          var hNom   = String(histRL[hi][1] || '').trim().toUpperCase();
          if (!hNom) continue;
          var hFechaD;
          if (hFecha instanceof Date) {
            hFechaD = hFecha;
          } else {
            var partes = String(hFecha).match(/(\d+)\/(\d+)\/(\d+)/);
            if (!partes) continue;
            hFechaD = new Date(parseInt(partes[3]), parseInt(partes[2])-1, parseInt(partes[1]));
          }
          if (isNaN(hFechaD.getTime())) continue;
          var dNorm = new Date(hFechaD); dNorm.setHours(0,0,0,0);
          if (dNorm < hace3) continue;
          if (!nomIngresados[hNom] || hFechaD > nomIngresados[hNom]) {
            nomIngresados[hNom] = hFechaD;
          }
        }
      }

      if (sheetInv) {
        var invRL = sheetInv.getDataRange().getValues();
        for (var ri = 1; ri < invRL.length; ri++) {
          var rNom = String(invRL[ri][0] || '').trim().toUpperCase();
          if (!rNom || !nomIngresados[rNom]) continue;
          var rStock = parseInt(invRL[ri][5]) || 0;
          if (rStock <= 0) continue;
          recienLlegados.push({
            nombre:       String(invRL[ri][0]).trim(),
            precio:       parseInt(invRL[ri][1]) || 0,
            categoria:    String(invRL[ri][2] || '').trim(),
            stock:        rStock,
            relampago:    parseInt(invRL[ri][6]) || 0,
            destacada:    parseInt(invRL[ri][7]) || 0,
            especial:     parseInt(invRL[ri][8]) || 0,
            fechaIngreso: Utilities.formatDate(nomIngresados[rNom], tz, 'dd/MM/yyyy')
          });
        }
      }
      recienLlegados.sort(function(a, b) {
        return b.fechaIngreso.localeCompare(a.fechaIngreso);
      });
    } catch(eRL) { Logger.log('Error recienLlegados: ' + eRL); }

    return { items, totales, vencProximos, stockInfo, proveedorInfo, topGanancia, recienLlegados };
  } catch(e) {
    return { error: e.toString() };
  }
}

// ========== MERCADO PAGO ==========
function crearOrdenMP(monto) {
  try {
    const payload = {
      items: [{ title: 'Compra Almacén Copihue', quantity: 1, unit_price: parseFloat(monto), currency_id: 'ARS' }],
      payment_methods: { excluded_payment_types: [], installments: 1 },
      statement_descriptor: 'ALMACEN COPIHUE',
      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString()
    };
    const resp = UrlFetchApp.fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'post',
      headers: { 'Authorization': 'Bearer ' + MP_ACCESS_TOKEN, 'Content-Type': 'application/json' },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    const data = JSON.parse(resp.getContentText());
    if (data.init_point) return { ok: true, url: data.init_point, id: data.id };
    return { ok: false, error: JSON.stringify(data) };
  } catch(e) {
    return { ok: false, error: e.toString() };
  }
}

// ========== CARRITO TEMPORAL ==========
function guardarCarritoTemp(payload) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sh = ss.getSheetByName('carrito_temp');
    if (!sh) {
      sh = ss.insertSheet('carrito_temp');
      sh.getRange(1,1,1,3).setValues([['timestamp','vendedor','items_json']]);
    }
    const data = typeof payload === 'string' ? JSON.parse(payload) : payload;
    if (!data.items || data.items.length === 0) {
      if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow()-1, 3).clearContent();
      return { success: true, action: 'cleared' };
    }
    if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow()-1, 3).clearContent();
    sh.getRange(2,1,1,3).setValues([[new Date().toISOString(), data.vendedor || '', JSON.stringify(data.items)]]);
    return { success: true, action: 'saved', count: data.items.length };
  } catch(e) {
    return { success: false, error: e.toString() };
  }
}

function getCarritoTemp() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheetByName('carrito_temp');
    if (!sh || sh.getLastRow() < 2) return { success: true, items: [] };
    const row = sh.getRange(2,1,1,3).getValues()[0];
    const ts = row[0];
    if (ts && (Date.now() - new Date(ts).getTime()) > 8 * 60 * 60 * 1000) {
      sh.getRange(2, 1, 1, 3).clearContent();
      return { success: true, items: [] };
    }
    const items = row[2] ? JSON.parse(row[2]) : [];
    return { success: true, items, vendedor: row[1] || '', ts: ts ? new Date(ts).toISOString() : '' };
  } catch(e) {
    return { success: false, error: e.toString(), items: [] };
  }
}

// ========== LISTA DE COMPRA JSON ==========
function getListaCompraJSON() {
  try {
    var ss = SpreadsheetApp.openById(SS_ID);

    var shLista = ss.getSheetByName('Lista de compra');
    if (!shLista) return { ok: false, error: 'Hoja "Lista de compra" no encontrada.' };
    var listaData = shLista.getDataRange().getValues();
    if (listaData.length <= 1) return { ok: false, error: 'Lista vacía.' };

    var shInv = ss.getSheetByName('inventario');
    var invMap = {};
    if (shInv) {
      var invData = shInv.getDataRange().getValues();
      for (var i = 1; i < invData.length; i++) {
        var row = invData[i];
        var nombre = String(row[0] || '').trim();
        if (!nombre) continue;
        var nombreKey = nombre.toUpperCase().replace(/\s+/g,' ');
        invMap[nombreKey] = {
          stock:     parseFloat(row[5])  || 0,
          categoria: String(row[2] || '').trim().toUpperCase(),
          v7:        parseFloat(row[21]) || 0,
          v30:       parseFloat(row[22]) || 0,
          // v9.6: stockMin automático (col N) — se recalcula cada hora en
          // base a ventas reales (actualizarMotorInventario). Reemplaza al
          // piso manual como señal de urgencia: no requiere configuración.
          stockMin:  parseFloat(row[13]) || 0,
          diasStock: row[24] !== '' && row[24] !== null ? (parseFloat(row[24]) || 0) : null,
          riesgo:    String(row[30] || '').trim().toUpperCase(),
          prioridad: String(row[31] || '').trim().toUpperCase(),
          pausado:   String(row[34] || '').trim().toUpperCase() === 'SI'
        };
      }
    }

    var costoMap = {};
    var historialMap = {}; // nombre -> [{proveedor, costo, fecha}] (últimos 3 proveedores distintos)
    var shHist = ss.getSheetByName(HOJA_HISTORIAL);
    if (shHist) {
      var histData = shHist.getDataRange().getValues();
      // Recorrer de más reciente a más viejo
      for (var h = histData.length - 1; h >= 1; h--) {
        var nomHist     = String(histData[h][1] || '').trim().toUpperCase();
        var costoHist   = parseFloat(histData[h][6]) || 0;
        var provHist    = String(histData[h][5] || '').trim().toUpperCase();
        var fechaHistRaw = histData[h][0];
        if (!nomHist) continue;

        if (costoHist > 0 && !costoMap[nomHist]) costoMap[nomHist] = costoHist;

        if (costoHist > 0 && provHist) {
          if (!historialMap[nomHist]) historialMap[nomHist] = [];
          var yaEsta = historialMap[nomHist].some(function(e){ return e.proveedor === provHist; });
          if (!yaEsta && historialMap[nomHist].length < 3) {
            var fechaStr = '';
            try {
              var fd = fechaHistRaw instanceof Date ? fechaHistRaw : new Date(fechaHistRaw);
              if (!isNaN(fd.getTime())) {
                fechaStr = Utilities.formatDate(fd, Session.getScriptTimeZone(), 'dd/MM/yy');
              }
            } catch(ef) {}
            historialMap[nomHist].push({ proveedor: provHist, costo: costoHist, fecha: fechaStr });
          }
        }
      }
    }

    var items = [];
    var totalPesos = 0;
    var urgentes = 0;

    for (var j = 1; j < listaData.length; j++) {
      var lr = listaData[j];
      var nombre = String(lr[0] || '').trim();
      if (!nombre || nombre.startsWith('──')) continue;

      var inv       = invMap[nombre.toUpperCase().replace(/\s+/g,' ')] || {};
      var stock     = (inv.stock !== undefined) ? inv.stock : (parseFloat(lr[1]) || 0);
      var minimo    = parseFloat(lr[2]) || 0;
      var cantidad  = parseFloat(lr[3]) || 0;
      var precio    = parseFloat(lr[4]) || 0;
      var total     = parseFloat(lr[5]) || 0;
      var proveedor = String(lr[6] || '').trim();

      var catInv = inv.categoria || '';
      if (catInv === 'COMPUTACION' || catInv === 'ELECTRONICA' || catInv === 'TECNOLOGIA') continue;

      var diasStock  = inv.diasStock !== undefined ? inv.diasStock : null;
      var v7         = inv.v7  || 0;
      var v30        = inv.v30 || 0;
      var riesgo     = inv.riesgo    || '';
      var prioridad  = inv.prioridad || '';
      var stockMin   = inv.stockMin  || 0; // automático, en base a ventas
      var pausado    = inv.pausado   || false;

      if (pausado) {
        items.push({
          nombre, stock, minimo, cantidad, precio, costo: costoMap[nombre.trim().toUpperCase()] || 0,
          total, totalVenta: total, proveedor, diasStock, urgencia: 99,
          prioridad: 'PAUSADO', pausado: true,
          historialPrecios: historialMap[nombre.trim().toUpperCase()] || []
        });
        continue;
      }

      // v9.6 — Urgencia 100% automática, sin depender de piso manual (ese
      // campo queda solo para la función de "desactivar de la lista").
      var urgencia;
      if (stock <= 0) {
        urgencia = 0; // sin stock: siempre lo más urgente
      } else if (riesgo === 'ALERTA') {
        urgencia = 1; // riesgo real de vencimiento (si hay fecha cargada)
      } else if (stockMin > 0 && stock <= stockMin) {
        urgencia = 2; // por debajo del mínimo automático (ventas reales)
      } else if (diasStock !== null && diasStock <= 3) {
        urgencia = 3;
      } else if (diasStock !== null && diasStock <= 7) {
        urgencia = 4;
      } else {
        urgencia = 7;
      }

      if (urgencia <= 2) urgentes++;
      var nomKey = nombre.trim().toUpperCase();
      var costo = costoMap[nomKey] || 0;
      var totalCosto = costo > 0 ? Math.round(costo * cantidad) : 0;
      totalPesos += totalCosto > 0 ? totalCosto : total;

      items.push({
        nombre, stock, minimo, cantidad,
        precio, costo,
        total:      totalCosto > 0 ? totalCosto : total,
        totalVenta: total,
        proveedor, diasStock, urgencia,
        prioridad: prioridad || (urgencia <= 2 ? 'URGENTE' : 'OK'),
        historialPrecios: historialMap[nomKey] || []
      });
    }

    items.sort(function(a, b) { return a.urgencia - b.urgencia; });

    return { ok: true, items, urgentes, totalPesos, generadoEn: new Date().toISOString() };
  } catch(e) {
    return { ok: false, error: e.toString() };
  }
}

// ========== FIADOS ==========
var HOJA_FIADOS = 'FIADOS';
function listarFiados() {
  try {
    var ss = SpreadsheetApp.openById(SS_ID);
    var sh = ss.getSheetByName(HOJA_FIADOS);
    if (!sh) return { ok: false, error: 'Hoja FIADOS no encontrada' };
    var datos = sh.getDataRange().getValues();
    var hoy = new Date(); hoy.setHours(0,0,0,0);
    var fiados = [];
    for (var i = 1; i < datos.length; i++) {
      var fila = datos[i];
      if (!fila[0]) continue;
      var estado = String(fila[10] || '').toUpperCase();
      var vencFecha = fila[9] ? new Date(String(fila[9]).split('T')[0] + 'T12:00:00') : null;
      if (vencFecha && vencFecha < hoy && estado !== 'PAGADO') estado = 'VENCIDO';
      // Pagados: incluir solo los de los últimos 30 días
      if (estado === 'PAGADO') {
        var fechaPago = fila[11] ? new Date(String(fila[11]).split('T')[0] + 'T12:00:00') : null;
        var hace30 = new Date(hoy); hace30.setDate(hace30.getDate() - 30);
        if (!fechaPago || fechaPago < hace30) continue;
      }

      // ── Abonos: columna N (índice 13) ──
      // Formato: "Abono $15 (EFECTIVO) 21/05/2026 | Abono $40 (TRANSFERENCIA) 21/05/2026"
      var abonosRaw = String(fila[13] || '');
      var totalOriginal = parseFloat(fila[7]) || 0; // col H = monto original de la venta
      var totalSaldo    = parseFloat(fila[8]) || 0; // col I = saldo actual (ya descontado)
      var totalAbonado  = Math.max(0, totalOriginal - totalSaldo);

      fiados.push({
        fila:             i + 1,
        idFiado:          String(fila[0] || ''),
        fecha:            String(fila[1] || ''),
        ticket:           String(fila[2] || ''),
        cliente:          String(fila[3] || ''),
        telefono:         String(fila[4] || ''),
        descripcion:      String(fila[5] || ''),
        cantItems:        fila[6] || 0,
        totalOriginal:    totalOriginal,   // ← NUEVO: monto original
        total:            totalSaldo,      // saldo pendiente real
        totalAbonado:     totalAbonado,    // ← NUEVO: cuánto abonó hasta ahora
        abonos:           abonosRaw,       // ← NUEVO: detalle de abonos col N
        fechaVencimiento: fila[9] ? String(fila[9]).split('T')[0] : '',
        fechaPago:        fila[11] ? String(fila[11]).split('T')[0] : '',
        metodoPago:       String(fila[12] || ''),
        estado:           estado
      });
    }
    fiados.sort(function(a, b) {
      if (a.estado === 'VENCIDO' && b.estado !== 'VENCIDO') return -1;
      if (b.estado === 'VENCIDO' && a.estado !== 'VENCIDO') return 1;
      return (a.fechaVencimiento || '').localeCompare(b.fechaVencimiento || '');
    });
    return { ok: true, fiados };
  } catch(e) {
    return { ok: false, error: e.toString() };
  }
}


function abonarFiado(datos) {
  try {
    if (!datos.idFiado) return { success: false, mensaje: 'Falta ID del fiado' };
    var ss = SpreadsheetApp.openById(SS_ID);
    var sh = ss.getSheetByName(HOJA_FIADOS);
    if (!sh) return { success: false, mensaje: 'Hoja FIADOS no encontrada' };
    var rows = sh.getDataRange().getValues();
    var idOp = String(datos.idOperacion || '').trim();
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) !== String(datos.idFiado)) continue;
      var obsPrevia = String(rows[i][13] || '');

      // Idempotencia: si este idOperacion ya quedó registrado en las
      // observaciones de ESTE fiado, el abono ya se aplicó — no restar de
      // nuevo. Reutiliza la misma columna de observaciones que ya se
      // escribe siempre, sin necesidad de columna nueva en la planilla.
      if (idOp && obsPrevia.indexOf(idOp) !== -1) {
        return { success: true, yaExistia: true, nuevoTotal: parseFloat(rows[i][8]) || 0, mensaje: 'Este abono ya estaba registrado — no se descontó de nuevo.' };
      }

      var totalActual = parseFloat(rows[i][8]) || 0;
      var abono = parseFloat(datos.abono) || 0;
      if (abono <= 0) return { success: false, mensaje: 'Monto inválido' };
      var nuevoTotal = Math.max(0, totalActual - abono);
      sh.getRange(i + 1, 9).setValue(nuevoTotal);
      var obsActual = obsPrevia;
      var tz = Session.getScriptTimeZone();
      var fecha = Utilities.formatDate(new Date(), tz, 'dd/MM/yyyy');
      var nuevaObs = (obsActual ? obsActual + ' | ' : '') +
        'Abono $' + abono + ' (' + (datos.metodoPago||'EFECTIVO') + ') ' + fecha +
        (idOp ? ' [' + idOp + ']' : '');
      sh.getRange(i + 1, 14).setValue(nuevaObs);
      if (nuevoTotal === 0) {
        sh.getRange(i + 1, 11).setValue('PAGADO');
        sh.getRange(i + 1, 12).setValue(fecha);
        sh.getRange(i + 1, 13).setValue(datos.metodoPago || 'EFECTIVO');
      }
      return { success: true, nuevoTotal };
    }
    return { success: false, mensaje: 'Fiado no encontrado' };
  } catch(e) {
    return { success: false, mensaje: e.toString() };
  }
}

function cobrarFiado(datos) {
  try {
    if (!datos.idFiado) return { success: false, mensaje: 'Falta ID del fiado' };
    var ss = SpreadsheetApp.openById(SS_ID);
    var sh = ss.getSheetByName(HOJA_FIADOS);
    if (!sh) return { success: false, mensaje: 'Hoja FIADOS no encontrada' };
    var rows = sh.getDataRange().getValues();
    var idOp = String(datos.idOperacion || '').trim();
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) === String(datos.idFiado)) {
        var tz = Session.getScriptTimeZone();
        var obsExistente = String(rows[i][13] || '');
        if (idOp && obsExistente.indexOf(idOp) !== -1) {
          return { success: true, yaExistia: true };
        }
      var fechaPago = datos.fechaPago || Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd HH:mm');
        if (datos.esAbonoParcial) {
          var obsActual = String(rows[i][13] || '');
          var nuevaObs = obsActual ? obsActual + ' | ' + (datos.obs||'') : (datos.obs||'');
          sh.getRange(i + 1, 14).setValue(nuevaObs);
        } else {
          sh.getRange(i + 1, 11).setValue('PAGADO');
          sh.getRange(i + 1, 12).setValue(fechaPago);
          sh.getRange(i + 1, 13).setValue(datos.metodoPago || 'EFECTIVO');
          var obsAct = String(rows[i][13] || '');
          var notaObs = (datos.obs || '') + (idOp ? ' [' + idOp + ']' : '');
          if (notaObs.trim()) sh.getRange(i + 1, 14).setValue(obsAct ? obsAct + ' | ' + notaObs : notaObs);
        }
        return { success: true };
      }
    }
    return { success: false, mensaje: 'Fiado no encontrado: ' + datos.idFiado };
  } catch(e) {
    return { success: false, mensaje: e.toString() };
  }
}

var COL_PAUSADO_LC = 35;

function setPausadoNombre(datos) {
  try {
    var ss  = SpreadsheetApp.openById(SS_ID);
    var sh  = ss.getSheetByName(HOJA_INVENTARIO);
    if (!sh) return { success: false, mensaje: 'Hoja inventario no encontrada' };
    var rows = sh.getDataRange().getValues();
    var nom = String(datos.nombre || '').trim().toUpperCase();
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][0] || '').trim().toUpperCase() === nom) {
        sh.getRange(i + 1, COL_PAUSADO_LC).setValue(datos.pausado || '');
        return { success: true };
      }
    }
    return { success: false, mensaje: 'Producto no encontrado: ' + datos.nombre };
  } catch(e) {
    return { success: false, mensaje: e.toString() };
  }
}

function setPausadoListaCompra(datos) {
  try {
    var ss  = SpreadsheetApp.openById(SS_ID);
    var sh  = ss.getSheetByName(HOJA_INVENTARIO);
    if (!sh) return { success: false, mensaje: 'Hoja inventario no encontrada' };
    var filaIdx = parseInt(datos.id);
    if (!filaIdx || filaIdx < 1) return { success: false, mensaje: 'ID inválido' };
    sh.getRange(filaIdx + 1, COL_PAUSADO_LC).setValue(datos.pausado || '');
    return { success: true };
  } catch(e) {
    return { success: false, mensaje: e.toString() };
  }
}

function registrarSalidaInterna(datos) {
  try {
    var ss = SpreadsheetApp.openById(SS_ID);
    var shInv  = ss.getSheetByName(HOJA_INVENTARIO);
    var shSal  = ss.getSheetByName('SALIDAS');

    if (!shInv) return { success: false, mensaje: 'Hoja inventario no encontrada' };

    if (!shSal) {
      shSal = ss.insertSheet('SALIDAS');
      shSal.getRange(1, 1, 1, 10).setValues([[
        'Fecha', 'Hora', 'Producto', 'ID', 'Cantidad', 'Costo Unit.', 'Precio Venta', 'Motivo', 'Observación', 'Vendedor'
      ]]);
      shSal.getRange(1, 1, 1, 10).setFontWeight('bold');
    }

    var invData = shInv.getDataRange().getValues();
    var filaIdx = datos.id;
    if (!filaIdx || filaIdx < 1 || filaIdx >= invData.length) {
      return { success: false, mensaje: 'Producto no encontrado' };
    }

    var stockActual = parseFloat(invData[filaIdx][5]) || 0;
    var cantidad    = parseFloat(datos.cantidad) || 0;

    if (cantidad <= 0) return { success: false, mensaje: 'Cantidad inválida' };
    if (cantidad > stockActual) return { success: false, mensaje: 'Stock insuficiente (hay ' + stockActual + ')' };

    var nuevoStock = Math.max(0, stockActual - cantidad);
    shInv.getRange(filaIdx + 1, 6).setValue(nuevoStock);

    var tz    = Session.getScriptTimeZone();
    var now   = new Date();
    var fecha = Utilities.formatDate(now, tz, 'yyyy-MM-dd');
    var hora  = Utilities.formatDate(now, tz, 'HH:mm');

    shSal.appendRow([
      fecha, hora,
      datos.nombre || '', 'ID' + filaIdx,
      cantidad, datos.costo || 0, datos.precio || 0,
      datos.motivo || '', datos.obs || '', datos.vendedor || ''
    ]);

    return { success: true, nuevoStock };
  } catch(e) {
    return { success: false, mensaje: e.toString() };
  }
}

function abonoFiado(datos) {
  try {
    var ss = SpreadsheetApp.openById(SS_ID);
    var sh = ss.getSheetByName(HOJA_FIADOS);
    if (!sh) return { success: false, mensaje: 'Hoja FIADOS no encontrada' };

    var rows = sh.getDataRange().getValues();
    var tz   = Session.getScriptTimeZone();
    var hoy  = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
    var metodo   = datos.metodoPago || 'EFECTIVO';
    var restante = parseFloat(datos.monto) || 0;
    var cancelados = 0;

    if (restante <= 0) return { success: false, mensaje: 'Monto inválido' };

    var fiados = [];
    for (var i = 1; i < rows.length; i++) {
      var tel = String(rows[i][4] || '').replace(/\D/g,'');
      var cli = String(rows[i][3] || '').trim().toLowerCase();
      var est = String(rows[i][10] || '').toUpperCase();
      if (est === 'PAGADO') continue;
      var telBuscar = String(datos.telefono || '').replace(/\D/g,'');
      var cliBuscar = String(datos.cliente || '').trim().toLowerCase();
      if ((telBuscar && tel === telBuscar) || (!telBuscar && cli === cliBuscar)) {
        fiados.push({ fila: i + 1, total: parseFloat(rows[i][8]) || 0, fecha: String(rows[i][1] || '') });
      }
    }

    fiados.sort(function(a,b){ return a.fecha.localeCompare(b.fecha); });

    for (var j = 0; j < fiados.length; j++) {
      if (restante <= 0) break;
      var f = fiados[j];
      if (restante >= f.total) {
        sh.getRange(f.fila, 11).setValue('PAGADO');
        sh.getRange(f.fila, 12).setValue(hoy);
        sh.getRange(f.fila, 13).setValue(metodo);
        restante = Math.round((restante - f.total) * 100) / 100;
        cancelados++;
      } else {
        var nuevoTotal = Math.round((f.total - restante) * 100) / 100;
        sh.getRange(f.fila, 9).setValue(nuevoTotal);
        sh.getRange(f.fila, 8).setValue(nuevoTotal);
        var obsActual = String(sh.getRange(f.fila, 14).getValue() || '');
        var nuevaObs = (obsActual ? obsActual + ' | ' : '') +
          'Abono $' + datos.monto + ' (' + metodo + ') ' + hoy + ' — queda $' + nuevoTotal;
        sh.getRange(f.fila, 14).setValue(nuevaObs);
        restante = 0;
      }
    }

    return { success: true, cancelados, restante };
  } catch(e) {
    return { success: false, mensaje: e.toString() };
  }
}

function registrarMovimientoCaja(datos) {
  try {
    var ss = SpreadsheetApp.openById(SS_ID);
    var HOJA_CAJA = 'CAJA_MOVIMIENTOS';
    var sh = ss.getSheetByName(HOJA_CAJA);
    if (!sh) {
      sh = ss.insertSheet(HOJA_CAJA);
      sh.getRange(1, 1, 1, 9).setValues([['FECHA', 'HORA', 'TIPO', 'MOTIVO', 'MONTO', 'MEDIO', 'CATEGORIA', 'OBSERVACION', 'VENDEDOR']]);
      sh.getRange(1, 1, 1, 9).setBackground('#37474f').setFontColor('white').setFontWeight('bold');
    }
    sh.appendRow([
      datos.fecha       || '',
      datos.hora        || '',
      datos.tipo        || 'EGRESO',
      datos.motivo      || '',
      datos.monto       || 0,
      datos.medio       || 'EFECTIVO',
      datos.categoria   || '',
      datos.observacion || '',
      datos.vendedor    || ''
    ]);
    return { success: true };
  } catch(e) {
    return { success: false, mensaje: e.toString() };
  }
}

// ========== DETALLE DE TICKET DESDE HOJA VENTAS ==========
function getDetalleTicket(ticket) {
  try {
    if (!ticket) return { ok: false, error: 'Ticket requerido' };
    var ss = SpreadsheetApp.openById(SS_ID);
    var sh = ss.getSheetByName('Ventas');
    if (!sh) return { ok: false, error: 'Hoja Ventas no encontrada' };

    var ticketStr = String(ticket).trim();
    // Normalizar: puede venir como "0123" o "123"
    var ticketNum  = parseInt(ticketStr, 10);
    var ticketPad  = String(ticketNum).padStart(4, '0');

    var filas = sh.getDataRange().getValues();
    var items = [];
    var totalTicket = 0;
    var fechaTicket = '';
    var horaTicket  = '';
    var metodoPago  = '';
    var vendedor    = '';
    var clienteInfo = '';

    for (var i = 1; i < filas.length; i++) {
      var f = filas[i];
      var tFila = String(f[0] || '').trim();
      // Fila TOTAL del ticket
      var desc = String(f[3] || '');
      if (desc.includes('TOTAL TICKET') && (desc.includes('N° ' + ticketPad) || desc.includes('N° ' + ticketNum))) {
        fechaTicket = f[1] instanceof Date
          ? Utilities.formatDate(f[1], Session.getScriptTimeZone(), 'dd/MM/yyyy')
          : String(f[1] || '');
        horaTicket  = String(f[2] || '');
        metodoPago  = String(f[5] || '');
        vendedor    = String(f[6] || '');
        totalTicket = parseFloat(f[7]) || 0;
        // clienteInfo está dentro del metodoPago después del pipe
        if (metodoPago.includes('|')) {
          var partes = metodoPago.split('|');
          metodoPago  = partes[0].trim();
          clienteInfo = partes[1].trim();
        }
        continue;
      }
      // Filas de productos del ticket
      if (tFila !== ticketPad && tFila !== String(ticketNum)) continue;
      items.push({
        nombre:    String(f[3] || '').trim(),
        cantidad:  f[4],
        precio:    parseFloat(f[5]) || 0,
        subtotal:  parseFloat(f[6]) || 0
      });
    }

    if (!items.length && !totalTicket) return { ok: false, error: 'Ticket ' + ticketStr + ' no encontrado' };

    return {
      ok: true,
      ticket:     ticketPad,
      fecha:      fechaTicket,
      hora:       horaTicket,
      metodoPago: metodoPago,
      vendedor:   vendedor,
      cliente:    clienteInfo,
      total:      totalTicket,
      items:      items
    };
  } catch(e) {
    return { ok: false, error: e.toString() };
  }
}

function guardarFiado(datos) {
  try {
    var ss = SpreadsheetApp.openById(SS_ID);
    var sh = ss.getSheetByName(HOJA_FIADOS);
    if (!sh) return { success: false, mensaje: 'Hoja FIADOS no encontrada' };

    var now = new Date();
    var tz  = Session.getScriptTimeZone();
    var fechaStr = Utilities.formatDate(now, tz, 'yyyy-MM-dd HH:mm');

    var ultimaFila = sh.getLastRow();
    var numFiado = ultimaFila;
    var idFiado = datos.idFiado || ('FIADO-' + String(numFiado).padStart(4, '0'));

    sh.appendRow([
      idFiado, fechaStr,
      datos.ticket || '', datos.cliente || '', datos.telefono || '',
      datos.descripcion || 'TICKET COMPLETO',
      datos.cantItems || 1, datos.total || 0, datos.total || 0,
      datos.vencimiento || '',
      '', '', '',
      datos.obs || ''
    ]);

    var nuevaFila = sh.getLastRow();
    sh.getRange(nuevaFila, 11).setFormula(
      '=IF(D'+nuevaFila+'="";"";IF(L'+nuevaFila+'<>"";"PAGADO";IF(AND(J'+nuevaFila+'<>"";TODAY()>J'+nuevaFila+');"VENCIDO";"PENDIENTE")))'
    );

    // Registrar / actualizar cliente automáticamente
    if (datos.cliente) {
      upsertCliente(ss, datos.cliente, datos.telefono || '');
    }

    return { success: true, idFiado };
  } catch(e) {
    return { success: false, mensaje: e.toString() };
  }
}

// ========== ACTUALIZAR TICKET EN FIADO (para reintento exitoso) ==========
// Llamada desde _reenviarVentasPendientes cuando el primer intento de vender
// había fallado por timeout y el reintento fue exitoso — escribe el ticket
// correcto en columna C de la fila del fiado.
function actualizarTicketFiado(datos) {
  try {
    if (!datos.idFiado || !datos.ticket) return { success: false, mensaje: 'Faltan idFiado o ticket' };
    var ss = SpreadsheetApp.openById(SS_ID);
    var sh = ss.getSheetByName(HOJA_FIADOS);
    if (!sh) return { success: false, mensaje: 'Hoja FIADOS no encontrada' };
    var rows = sh.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][0] || '').trim() === String(datos.idFiado).trim()) {
        // Solo actualiza si la columna C (ticket) estaba vacía
        if (!rows[i][2]) {
          sh.getRange(i + 1, 3).setValue(String(datos.ticket));
          SpreadsheetApp.flush();
        }
        return { success: true };
      }
    }
    return { success: false, mensaje: 'idFiado no encontrado: ' + datos.idFiado };
  } catch(e) {
    return { success: false, mensaje: e.toString() };
  }
}


// Inserta el cliente si no existe; si existe actualiza el teléfono si estaba vacío
function upsertCliente(ss, nombre, telefono) {
  try {
    var sh = ss.getSheetByName('Clientes');
    if (!sh) {
      // Crear hoja con encabezados si no existe
      sh = ss.insertSheet('Clientes');
      sh.getRange(1, 1, 1, 2).setValues([['Nombre', 'Telefono']]);
      sh.getRange(1, 1, 1, 2).setFontWeight('bold').setBackground('#e8f5e9');
      sh.setFrozenRows(1);
    }

    var nombreNorm = nombre.trim().toUpperCase();
    var telLimpio  = String(telefono).replace(/\D/g, '');
    var datos = sh.getDataRange().getValues();

    // Buscar fila existente por nombre (insensible a mayúsculas)
    for (var i = 1; i < datos.length; i++) {
      if (String(datos[i][0] || '').trim().toUpperCase() === nombreNorm) {
        // Ya existe — completar teléfono solo si la celda está vacía
        if (!String(datos[i][1] || '').trim() && telLimpio) {
          sh.getRange(i + 1, 2).setValue(telLimpio);
        }
        return; // nada más que hacer
      }
    }

    // No existe — agregar nueva fila
    sh.appendRow([nombre.trim(), telLimpio]);
  } catch(e) {
    console.error('upsertCliente error (no crítico):', e);
    // Fallo silencioso — no interrumpe el guardado del fiado
  }
}

function consultarFiado(telefono) {
  try {
    if (!telefono) return { ok: true, deuda: null };
    var ss = SpreadsheetApp.openById(SS_ID);
    var sh = ss.getSheetByName(HOJA_FIADOS);
    if (!sh) return { ok: true, deuda: null };

    var datos = sh.getDataRange().getValues();
    var telBuscar = String(telefono).replace(/\D/g, '');

    var totalDeuda = 0;
    var pendientes = 0;
    var vencidos = 0;
    var nombreCliente = '';
    var hoy = new Date(); hoy.setHours(0,0,0,0);

    for (var i = 1; i < datos.length; i++) {
      var fila = datos[i];
      var telFila = String(fila[4] || '').replace(/\D/g, '');
      if (telFila !== telBuscar) continue;

      var estado = String(fila[10] || '').toUpperCase();
      if (estado === 'PAGADO') continue;

      var fechaVenc = fila[9] ? new Date(fila[9]) : null;
      if (fechaVenc && fechaVenc < hoy && estado !== 'PAGADO') estado = 'VENCIDO';

      var total = parseFloat(fila[8]) || 0;
      totalDeuda += total;
      pendientes++;
      if (estado === 'VENCIDO') vencidos++;
      if (!nombreCliente && fila[3]) nombreCliente = String(fila[3]);
    }

    if (pendientes === 0) return { ok: true, deuda: null };
    return { ok: true, deuda: { nombre: nombreCliente, total: totalDeuda, pendientes, vencidos } };
  } catch(e) {
    return { ok: true, deuda: null };
  }
}

// ========== LISTAR CLIENTES v2 (autocomplete fiados) ==========
// Lee primero hoja Clientes; si está vacía, extrae clientes únicos de FIADOS.
// Así siempre hay datos aunque la hoja Clientes no esté poblada aún.
function listarClientes() {
  try {
    var ss = SpreadsheetApp.openById(SS_ID);
    var clientes = [];
    var vistos   = {}; // para deduplicar por nombre normalizado

    // ── 1. Leer hoja Clientes (fuente principal) ──
    var shCli = ss.getSheetByName('Clientes');
    if (shCli) {
      var datosCli = shCli.getDataRange().getValues();
      if (datosCli.length >= 2) {
        var hdr     = datosCli[0].map(function(h){ return String(h).toLowerCase().trim(); });
        var iNombre = hdr.findIndex(function(h){ return h.includes('nombre'); });
        var iTel    = hdr.findIndex(function(h){ return h.includes('tel') || h.includes('fono') || h.includes('phone'); });
        if (iNombre >= 0) {
          for (var i = 1; i < datosCli.length; i++) {
            var nom = String(datosCli[i][iNombre] || '').trim();
            if (!nom) continue;
            var key = nom.toUpperCase();
            if (vistos[key]) continue;
            vistos[key] = true;
            var tel = iTel >= 0 ? String(datosCli[i][iTel] || '').trim() : '';
            clientes.push({ nombre: nom, telefono: tel });
          }
        }
      }
    }

    // ── 2. Fallback: extraer clientes únicos de hoja FIADOS ──
    // (necesario si los fiados se crearon antes de la v7.5 que puebla Clientes)
    var shFia = ss.getSheetByName('FIADOS');
    if (shFia) {
      var datosFia = shFia.getDataRange().getValues();
      // Col D (idx 3) = Cliente, Col E (idx 4) = Teléfono
      for (var j = 1; j < datosFia.length; j++) {
        var fila = datosFia[j];
        if (!fila[0]) continue; // fila vacía
        var nomF = String(fila[3] || '').trim();
        if (!nomF) continue;
        var keyF = nomF.toUpperCase();
        if (vistos[keyF]) continue; // ya está desde hoja Clientes
        vistos[keyF] = true;
        var telF = String(fila[4] || '').trim();
        clientes.push({ nombre: nomF, telefono: telF });

        // Aprovechar y sincronizar a hoja Clientes para próximas consultas
        try { upsertCliente(nomF, telF); } catch(ex) {}
      }
    }

    // Ordenar alfabéticamente
    clientes.sort(function(a, b) { return a.nombre.localeCompare(b.nombre, 'es'); });

    return { ok: true, clientes: clientes };
  } catch(e) {
    console.error('Error listarClientes v2:', e);
    return { ok: true, clientes: [] };
  }
}

// ========== VENTAS POR PRODUCTO (para panel de info POS) ==========
function getVentasProducto(datos) {
  try {
    var ss = SpreadsheetApp.openById(SS_ID);
    var sh = ss.getSheetByName('Ventas');
    if (!sh) return { success: false, mensaje: 'Hoja Ventas no encontrada' };

    var nombre = String(datos.nombre || '').trim().toUpperCase();
    var dias   = parseInt(datos.dias) || 60;
    if (!nombre) return { success: false, mensaje: 'Nombre requerido' };

    var tz    = Session.getScriptTimeZone();
    var hoy   = new Date(); hoy.setHours(0,0,0,0);
    var desde = new Date(hoy); desde.setDate(desde.getDate() - dias);

    var filas = sh.getDataRange().getValues();
    var porDia = {}; // 'YYYY-MM-DD' -> qty

    for (var i = 1; i < filas.length; i++) {
      var f = filas[i];
      // Fila de producto: col A tiene ticket, col D tiene nombre
      if (!f[0] || String(f[3] || '').includes('TOTAL TICKET')) continue;
      var nomFila = String(f[3] || '').trim().toUpperCase();
      // Quitar sufijos de precio especial para comparar
      var nomLimpio = nomFila.replace(/\s*\[PRECIO.*?\]$/,'').replace(/\s*\(\d+\s*gr\)$/i,'').replace(/\s*\(\d+\.?\d*\s*kg\)$/i,'').trim();
      if (nomLimpio !== nombre) continue;

      var fechaFila = f[1] instanceof Date ? f[1] : new Date(f[1]);
      if (isNaN(fechaFila) || fechaFila < desde) continue;

      var fechaKey = Utilities.formatDate(fechaFila, tz, 'yyyy-MM-dd');
      var qty = parseFloat(f[4]) || 1;
      porDia[fechaKey] = (porDia[fechaKey] || 0) + qty;
    }

    // Convertir a array ordenado desc
    var resultado = Object.keys(porDia).sort().reverse().map(function(d) {
      return { fecha: d, qty: Math.round(porDia[d] * 1000) / 1000 };
    });

    var totalQty = resultado.reduce(function(s, r) { return s + r.qty; }, 0);

    return { success: true, dias: resultado, total: Math.round(totalQty * 1000) / 1000 };
  } catch(e) {
    return { success: false, mensaje: e.toString() };
  }
}

// ======================
// FIADOS v2.0 — Detalle por ticket + Pago selectivo
// ======================

// ========== LISTAR FIADOS DE UN CLIENTE CON DETALLE DE TICKETS ==========
// Busca por teléfono (o nombre) todos los fiados pendientes de un cliente
// y enriquece cada uno con el detalle real de productos desde hoja Ventas.
function listarFiadosCliente(datos) {
  try {
    var ss = SpreadsheetApp.openById(SS_ID);
    var shFiados = ss.getSheetByName(HOJA_FIADOS);
    if (!shFiados) return { ok: false, error: 'Hoja FIADOS no encontrada' };

    var telefono = String(datos.telefono  || '').replace(/\D/g, '');
    var cliente  = String(datos.cliente   || '').trim().toUpperCase();
    if (!telefono && !cliente) return { ok: false, error: 'Se requiere teléfono o cliente' };

    var rows = shFiados.getDataRange().getValues();
    var hoy  = new Date(); hoy.setHours(0, 0, 0, 0);
    var fiados = [];

    for (var i = 1; i < rows.length; i++) {
      var fila = rows[i];
      if (!fila[0]) continue;

      var telFila = String(fila[4] || '').replace(/\D/g, '');
      var cliFila = String(fila[3] || '').trim().toUpperCase();

      var coincide = (telefono && telFila === telefono) ||
                     (!telefono && cliFila === cliente);
      if (!coincide) continue;

      var estado = String(fila[10] || '').toUpperCase();
      var vencFecha = fila[9]
        ? new Date(String(fila[9]).split('T')[0] + 'T12:00:00')
        : null;
      if (vencFecha && vencFecha < hoy && estado !== 'PAGADO') estado = 'VENCIDO';

      // Solo pendientes + vencidos
      if (estado === 'PAGADO') continue;

      var ticketNum    = String(fila[2] || '').trim();
      var detalle      = [];
      var totalDetalle = 0;

      // Enriquecer con detalle real de hoja Ventas si hay ticket
      if (ticketNum) {
        var res = getDetalleTicket(ticketNum);
        if (res.ok && res.items && res.items.length) {
          detalle      = res.items;
          totalDetalle = res.total;
        }
      }

      var totalPendiente = parseFloat(fila[8]) || 0;
      var totalOriginal  = parseFloat(fila[7]) || totalPendiente;

      fiados.push({
        idFiado:          String(fila[0]),
        fecha:            String(fila[1] || ''),
        ticket:           ticketNum,
        cliente:          String(fila[3] || ''),
        telefono:         String(fila[4] || ''),
        descripcion:      String(fila[5] || ''),
        cantItems:        fila[6] || 0,
        totalOriginal:    totalOriginal,
        totalPendiente:   totalPendiente,
        abonadoParcial:   totalOriginal > totalPendiente,
        montoAbonado:     Math.round((totalOriginal - totalPendiente) * 100) / 100,
        fechaVencimiento: fila[9] ? String(fila[9]).split('T')[0] : '',
        estado:           estado,
        observaciones:    String(fila[13] || ''),
        detalle:          detalle,
        totalDetalle:     totalDetalle
      });
    }

    // Ordenar: VENCIDO primero, luego por fecha ascendente
    fiados.sort(function(a, b) {
      if (a.estado === 'VENCIDO' && b.estado !== 'VENCIDO') return -1;
      if (b.estado === 'VENCIDO' && a.estado !== 'VENCIDO') return 1;
      return a.fecha.localeCompare(b.fecha);
    });

    var totalDeuda  = fiados.reduce(function(s, f) { return s + f.totalPendiente; }, 0);
    var hayVencidos = fiados.some(function(f) { return f.estado === 'VENCIDO'; });

    return {
      ok:          true,
      cliente:     fiados.length ? fiados[0].cliente : (datos.cliente || ''),
      telefono:    telefono,
      totalDeuda:  Math.round(totalDeuda * 100) / 100,
      cantFiados:  fiados.length,
      hayVencidos: hayVencidos,
      fiados:      fiados
    };
  } catch(e) {
    return { ok: false, error: e.toString() };
  }
}

// ========== PAGAR FIADOS SELECCIONADOS (total o parcial) ==========
// Recibe array de pagos: [{ idFiado, monto, parcial }]
// Actualiza FIADOS y registra ingreso en CAJA_MOVIMIENTOS.
function pagarFiadosSeleccionados(datos) {
  try {
    if (!datos.pagos || !datos.pagos.length) {
      return { ok: false, error: 'No se indicaron fiados a cobrar' };
    }

    var ss      = SpreadsheetApp.openById(SS_ID);
    var shFiado = ss.getSheetByName(HOJA_FIADOS);
    if (!shFiado) return { ok: false, error: 'Hoja FIADOS no encontrada' };

    var tz       = Session.getScriptTimeZone();
    var ahora    = new Date();
    var fechaStr = Utilities.formatDate(ahora, tz, 'yyyy-MM-dd');
    var horaStr  = Utilities.formatDate(ahora, tz, 'HH:mm');
    var metodo   = String(datos.metodoPago || 'EFECTIVO').toUpperCase();

    var rows      = shFiado.getDataRange().getValues();
    var resultado = [];
    var totalCobrado = 0;

    for (var p = 0; p < datos.pagos.length; p++) {
      var pago      = datos.pagos[p];
      var idFiado   = String(pago.idFiado || '').trim();
      var monto     = parseFloat(pago.monto) || 0;
      var esParcial = !!pago.parcial;

      if (!idFiado || monto <= 0) continue;

      // Buscar fila en sheet
      var filaEncontrada = -1;
      for (var i = 1; i < rows.length; i++) {
        if (String(rows[i][0]).trim() === idFiado) {
          filaEncontrada = i;
          break;
        }
      }
      if (filaEncontrada < 0) {
        resultado.push({ idFiado: idFiado, ok: false, error: 'No encontrado' });
        continue;
      }

      var totalActual = parseFloat(rows[filaEncontrada][8]) || 0;
      var montoReal   = Math.min(monto, totalActual); // nunca cobrar más de lo que debe
      var nuevo       = Math.round((totalActual - montoReal) * 100) / 100;
      var filaSh      = filaEncontrada + 1;

      // Actualizar total pendiente (col I = col 9)
      shFiado.getRange(filaSh, 9).setValue(nuevo);

      // Actualizar observaciones (col N = col 14)
      var obsActual = String(rows[filaEncontrada][13] || '');
      var tipoOp    = esParcial ? 'Abono' : 'Pago total';
      var nuevaObs  = (obsActual ? obsActual + ' | ' : '') +
        tipoOp + ' $' + montoReal + ' (' + metodo + ') ' + fechaStr + ' ' + horaStr;
      shFiado.getRange(filaSh, 14).setValue(nuevaObs);

      // Si quedó en cero: marcar PAGADO (col K=11, L=12, M=13)
      if (nuevo === 0) {
        shFiado.getRange(filaSh, 11).setValue('PAGADO');
        shFiado.getRange(filaSh, 12).setValue(fechaStr + ' ' + horaStr);
        shFiado.getRange(filaSh, 13).setValue(metodo);
      }

      totalCobrado += montoReal;
      resultado.push({
        idFiado:      idFiado,
        ok:           true,
        montoCobrado: montoReal,
        nuevoTotal:   nuevo,
        pagadoTotal:  nuevo === 0
      });
    }

    // Registrar en CAJA_MOVIMIENTOS
    if (totalCobrado > 0) {
      _registrarIngresoFiadoCaja_(ss, {
        fecha:    fechaStr,
        hora:     horaStr,
        monto:    totalCobrado,
        medio:    metodo,
        cliente:  datos.cliente || '',
        obs:      'Cobro fiado — ' + resultado.filter(function(r){ return r.ok; }).length + ' ticket(s)'
      });
    }

    return {
      ok:           true,
      totalCobrado: Math.round(totalCobrado * 100) / 100,
      detalle:      resultado
    };
  } catch(e) {
    return { ok: false, error: e.toString() };
  }
}

// ——— Helper: registra ingreso en CAJA_MOVIMIENTOS ———
function _registrarIngresoFiadoCaja_(ss, d) {
  try {
    var HOJA_CAJA = 'CAJA_MOVIMIENTOS';
    var sh = ss.getSheetByName(HOJA_CAJA);
    if (!sh) {
      sh = ss.insertSheet(HOJA_CAJA);
      sh.getRange(1, 1, 1, 8).setValues([[
        'FECHA','HORA','TIPO','MOTIVO','MONTO','MEDIO','CATEGORIA','OBSERVACION'
      ]]);
      sh.getRange(1, 1, 1, 8).setBackground('#37474f').setFontColor('white').setFontWeight('bold');
    }
    sh.appendRow([
      d.fecha, d.hora,
      'INGRESO',
      'COBRO FIADO — ' + (d.cliente || '').toUpperCase(),
      d.monto,
      d.medio,
      'FIADOS',
      d.obs || ''
    ]);
  } catch(e) {
    console.error('_registrarIngresoFiadoCaja_ error (no crítico):', e);
  }
}

// ========== ÚLTIMAS UNIDADES — Selección manual ==========

/**
 * Helper interno: lee ultimas_seleccion de config_sistema y cruza con inventario
 * para devolver [{id, diasParaVencer}]. Usado por calcularOfertas().
 */
// v10.5: helper aparte de _leerUltimasConDias_ — esa filtra por stock/vencido,
// así que si LOS DOS productos elegidos a mano se vendieron o vencieron,
// devuelve []. El flyer usaba eso para decidir si mostrar fallback algorítmico,
// confundiendo "nadie eligió nada" con "eligieron, pero hoy no queda". Este
// helper solo mira si HAY algo cargado en la celda, sin filtrar nada más.
function _hayUltimasConfiguradas_() {
  try {
    var ss = SpreadsheetApp.openById(SS_ID);
    var shCfg = ss.getSheetByName(HOJA_CONFIG);
    if (!shCfg) return false;
    var cfgVals = shCfg.getDataRange().getValues();
    for (var i = 0; i < cfgVals.length; i++) {
      if (String(cfgVals[i][0] || '').trim().toLowerCase() === 'ultimas_seleccion') {
        try { return (JSON.parse(cfgVals[i][1] || '[]') || []).length > 0; } catch(e) { return false; }
      }
    }
    return false;
  } catch(e) { return false; }
}

function _leerUltimasConDias_() {
  try {
    var ss   = SpreadsheetApp.openById(SS_ID);
    var shCfg = ss.getSheetByName(HOJA_CONFIG);
    if (!shCfg) return [];
    var cfgVals = shCfg.getDataRange().getValues();
    var ids = [];
    for (var i = 0; i < cfgVals.length; i++) {
      if (String(cfgVals[i][0] || '').trim().toLowerCase() === 'ultimas_seleccion') {
        try { ids = JSON.parse(cfgVals[i][1] || '[]'); } catch(e) { ids = []; }
        break;
      }
    }
    if (!ids.length) return [];

    // Cruzar con inventario para obtener diasParaVencer actual
    var shInv  = ss.getSheetByName(HOJA_INVENTARIO);
    var invVals = shInv.getDataRange().getValues();
    var hoy = new Date(); hoy.setHours(0,0,0,0);
    var idsSet = {};
    ids.forEach(function(id){ idsSet[Number(id)] = true; });

    var resultado = [];
    for (var r = 1; r < invVals.length; r++) {
      if (!idsSet[r]) continue;
      var stock = parseInt(invVals[r][5]) || 0;
      if (stock <= 0) continue; // excluir sin stock
      var dpv = null;
      var vencRaw = invVals[r][9];
      if (vencRaw) {
        try {
          var vStr2 = (vencRaw instanceof Date)
            ? Utilities.formatDate(vencRaw, Session.getScriptTimeZone(), 'yyyy-MM-dd')
            : String(vencRaw).split('T')[0];
          var vFecha2 = new Date(vStr2 + 'T12:00:00');
          dpv = Math.round((vFecha2 - hoy) / 86400000);
          if (dpv < 0) continue; // vencido: excluir
        } catch(e) {}
      }
      resultado.push({ id: r, diasParaVencer: dpv });
    }
    return resultado;
  } catch(e) {
    Logger.log('_leerUltimasConDias_ error: ' + e);
    return [];
  }
}

/**
 * Devuelve candidatos para el selector manual de Últimas Unidades.
 * Productos con vencimiento, stock > 0, ordenados por urgencia.
 */
function getCandidatosUltimas() {
  try {
    var ss    = SpreadsheetApp.openById(SS_ID);
    var shInv = ss.getSheetByName(HOJA_INVENTARIO);
    var datos = shInv.getDataRange().getValues();
    var hoy   = new Date(); hoy.setHours(0,0,0,0);

    // Leer selección vigente para incluirla siempre aunque no pase los filtros
    var selVigente = [];
    try {
      var r = getUltimasSeleccion();
      selVigente = (r.seleccion || []).map(Number);
    } catch(e) {}
    var selSet = {};
    selVigente.forEach(function(id){ selSet[id] = true; });

    var candidatos = [];
    var idsAgregados = {};

    for (var i = 1; i < datos.length; i++) {
      var fila  = datos[i];
      if (!fila[0]) continue;
      var stock = parseInt(fila[5]) || 0;
      var yaSeleccionado = selSet[i] === true;

      // Sin stock y no seleccionado a mano → no aplica (ni por vencimiento ni por stock)
      if (!yaSeleccionado && stock <= 0) continue;

      var relampago   = parseInt(fila[6]) || 0;
      var precio      = parseInt(fila[1]) || 0;
      var rotacion    = fila.length > 14 ? (parseInt(fila[14]) || 0) : 0;
      var stockMinRaw = fila.length > 13 ? (parseInt(fila[13]) || 0) : 0;

      var dias   = null;
      var score  = 5;
      var motivo = '⚪ Sin fecha de vencimiento';
      var tieneVencValido = false;

      if (fila[9]) {
        try {
          var vStr = (fila[9] instanceof Date)
            ? Utilities.formatDate(fila[9], Session.getScriptTimeZone(), 'yyyy-MM-dd')
            : String(fila[9]).split('T')[0];
          var vFecha = new Date(vStr + 'T12:00:00');

          // FIX v9.5: si la fecha no parsea bien (formato inválido en la planilla),
          // NO seguir con NaN — tratar este producto como "sin vencimiento válido"
          // y que caiga en el fallback de stock/rotación de más abajo.
          if (!isNaN(vFecha.getTime())) {
            tieneVencValido = true;
            dias = Math.round((vFecha - hoy) / 86400000);

            if (dias < 0 && !yaSeleccionado) continue; // vencido y no seleccionado: excluir

            var diasStock = rotacion > 0 ? Math.ceil(stock / rotacion) : 9999;
            if (dias === 0)       { score = 200; motivo = '🔴 Vence HOY'; }
            else if (dias === 1)  { score = 150; motivo = '🔴 Vence mañana'; }
            else if (dias <= 3)   { score = 100; motivo = '🔴 Vence en ' + dias + ' días'; }
            else if (diasStock >= dias) { score = Math.round((diasStock / dias) * 60); motivo = '🟡 Stock para ' + diasStock + 'd, vence en ' + dias + 'd'; }
            else                  { score = dias <= 14 ? 20 : 5; motivo = '⚪ Vence en ' + dias + ' días'; }

            if (dias < 0) { score = 0; motivo = '⚠️ Vencido — quitar selección'; }
          }
        } catch(e) {}
      }

      if (!tieneVencValido) {
        // NUEVO v9.5 — Sin vencimiento cargado (o fecha inválida): priorizar por
        // exceso de stock vs. mínimo (el mínimo ya refleja el promedio de ventas,
        // ver actualizarStockMinimos) + rotación lenta (columna O, escala 1-5).
        dias = null;
        var minimoRef      = stockMinRaw > 0 ? stockMinRaw : 3;
        var ratioStock     = stock / minimoRef;
        var pesoRotFallback = 6 - (rotacion || 3); // 5 si rota lento, 1 si rota rápido
        var scoreFallback  = Math.round(Math.min(100, ratioStock * 15 + pesoRotFallback * 8));

        // Solo se propone como candidato NUEVO si hay señal real de sobre-stock.
        // Si ya estaba seleccionado a mano, se muestra igual (para poder destickearlo).
        if (!yaSeleccionado && ratioStock < 1.5) continue;

        score  = scoreFallback;
        motivo = '📦 Stock ' + stock + 'u (mín. ' + minimoRef + ') · rotación ' + (rotacion || '?') + '/5 — sin vencimiento';
      }

      if (yaSeleccionado && stock <= 0) { score = 0; motivo = '⚠️ Sin stock — quitar selección'; }

      idsAgregados[i] = true;
      candidatos.push({
        id: i, nombre: String(fila[0]).trim(), precio: precio, stock: stock,
        vencimiento: dias !== null ? motivo : '',
        diasParaVencer: dias, score: score, motivo: motivo,
        ofertaDesc: relampago > 0 ? ('-' + relampago + '%') : '',
        yaSeleccionado: yaSeleccionado
      });
    }

    candidatos.sort(function(a, b){
      if (b.score !== a.score) return b.score - a.score;
      // FIX v9.5: desempate — evitar NaN cuando diasParaVencer es null (sin vencimiento).
      // Los que sí tienen fecha de vencimiento van antes que los que solo tienen
      // score por stock/rotación, a igualdad de puntaje.
      if (a.diasParaVencer === null && b.diasParaVencer === null) return 0;
      if (a.diasParaVencer === null) return 1;
      if (b.diasParaVencer === null) return -1;
      return a.diasParaVencer - b.diasParaVencer;
    });
    return { ok: true, candidatos: candidatos };
  } catch(e) {
    return { ok: false, error: e.toString() };
  }
}

/**
 * Lee la selección guardada de Últimas Unidades desde config_sistema.
 */
function getUltimasSeleccion() {
  try {
    var shCfg = SpreadsheetApp.openById(SS_ID).getSheetByName(HOJA_CONFIG);
    if (!shCfg) return { ok: true, seleccion: [] };
    var vals = shCfg.getDataRange().getValues();
    for (var i = 0; i < vals.length; i++) {
      if (String(vals[i][0] || '').trim().toLowerCase() === 'ultimas_seleccion') {
        var ids = [];
        try { ids = JSON.parse(vals[i][1] || '[]'); } catch(e) {}
        return { ok: true, seleccion: ids };
      }
    }
    return { ok: true, seleccion: [] };
  } catch(e) {
    return { ok: false, error: e.toString() };
  }
}

/**
 * Guarda la selección manual de IDs en config_sistema → fila 'ultimas_seleccion'.
 * Si la fila no existe, la crea.
 */
function guardarUltimasSeleccion(ids) {
  try {
    var ss    = SpreadsheetApp.openById(SS_ID);
    var shCfg = ss.getSheetByName(HOJA_CONFIG);
    if (!shCfg) return { ok: false, error: 'Hoja config_sistema no encontrada' };

    var vals = shCfg.getDataRange().getValues();
    var filasEncontradas = []; // puede haber duplicados del sistema anterior
    for (var i = 0; i < vals.length; i++) {
      if (String(vals[i][0] || '').trim().toLowerCase() === 'ultimas_seleccion') {
        filasEncontradas.push(i + 1); // 1-indexed
      }
    }

    var jsonIds = JSON.stringify(ids || []);
    var ts      = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");

    if (filasEncontradas.length > 1) {
      // Eliminar filas duplicadas de abajo hacia arriba para no desplazar índices
      for (var d = filasEncontradas.length - 1; d >= 1; d--) {
        shCfg.deleteRow(filasEncontradas[d]);
      }
    }

    if (filasEncontradas.length >= 1) {
      shCfg.getRange(filasEncontradas[0], 2).setValue(jsonIds);
      shCfg.getRange(filasEncontradas[0], 3).setValue(ts);
    } else {
      shCfg.appendRow(['ultimas_seleccion', jsonIds, ts]);
    }

    return { ok: true, guardados: (ids || []).length };
  } catch(e) {
    return { ok: false, error: e.toString() };
  }
}

// ========== LECTURA DE REGISTROS — SALIDAS Y CAJA ==========

/**
 * Devuelve las últimas N filas de SALIDAS (merma, consumo, vencidos).
 * datos.limite: max registros (default 100). datos.fecha: filtrar por fecha YYYY-MM-DD (opcional).
 */
// v10.3 — normalizador de fecha para ordenar historiales. FIX del bug real:
// getCajaEgresos/getSalidasInternas asumían que si la celda no era un
// objeto Date, ya venía en formato ISO (yyyy-MM-dd...). Pero algunas filas
// tienen la fecha como TEXTO en formato argentino "DD/MM/AAAA" — comparado
// como string así, "25/03/2026" ordena ANTES que "24/04/2026" (el día pesa
// más que el mes al comparar carácter por carácter), dando el salteo de
// fechas que se veía. Ahora se detectan los tres formatos y siempre se
// devuelve yyyy-MM-dd, que sí ordena bien como texto.
function _normalizarFechaOrden(v) {
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  var s = String(v || '').trim();
  if (!s) return '';
  var m = s.match(/^(\d{4})-(\d{2})-(\d{2})/); // yyyy-MM-dd (con o sin hora ISO pegada)
  if (m) return m[1] + '-' + m[2] + '-' + m[3];
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/); // dd/MM/yyyy o d/M/yyyy (formato AR)
  if (m) return m[3] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[1]).slice(-2);
  var d = new Date(s); // último recurso
  if (!isNaN(d)) return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  return s;
}

function getSalidasInternas(datos) {
  try {
    var limite = (datos && datos.limite) ? parseInt(datos.limite) : 100;
    var filtroFecha = datos && datos.fecha ? String(datos.fecha) : null;
    var ss = SpreadsheetApp.openById(SS_ID);
    var sh = ss.getSheetByName('SALIDAS');
    if (!sh) return { ok: true, registros: [] };
    var vals = sh.getDataRange().getValues();
    // Cols: Fecha, Hora, Producto, ID, Cantidad, Costo Unit., Precio Venta, Motivo, Observación, Vendedor
    var registros = [];
    // v9.10 FIX — mismo problema que tenía getCajaEgresos (v9.8): recorrer
    // de abajo hacia arriba confía en que las filas ya están en orden
    // cronológico. Se juntan todas primero y se ordenan por fecha+hora real
    // antes de recortar al límite.
    for (var i = 1; i < vals.length; i++) {
      var f = vals[i];
      if (!f[0]) continue;
      var fechaStr = _normalizarFechaOrden(f[0]); // v10.3
      if (filtroFecha && fechaStr !== filtroFecha) continue;
      registros.push({
        fecha:     fechaStr,
        hora:      String(f[1] || '').trim(),
        producto:  String(f[2] || '').trim(),
        idProd:    String(f[3] || '').trim(),
        cantidad:  parseFloat(f[4]) || 0,
        costo:     parseFloat(f[5]) || 0,
        precio:    parseFloat(f[6]) || 0,
        motivo:    String(f[7] || '').trim(),
        obs:       String(f[8] || '').trim(),
        vendedor:  String(f[9] || '').trim()
      });
    }
    registros.sort(function(a, b) {
      var claveA = a.fecha + ' ' + a.hora;
      var claveB = b.fecha + ' ' + b.hora;
      return claveB.localeCompare(claveA); // más reciente primero
    });
    if (registros.length > limite) registros = registros.slice(0, limite);
    return { ok: true, registros: registros };
  } catch(e) {
    return { ok: false, error: e.toString() };
  }
}

/**
 * Devuelve las últimas N filas de CAJA_MOVIMIENTOS, filtradas por EGRESO.
 * datos.limite: max registros (default 100). datos.fecha: filtrar por fecha (opcional).
 */
function getCajaEgresos(datos) {
  try {
    var limite = (datos && datos.limite) ? parseInt(datos.limite) : 100;
    var filtroFecha = datos && datos.fecha ? String(datos.fecha) : null;
    var ss = SpreadsheetApp.openById(SS_ID);
    var sh = ss.getSheetByName('CAJA_MOVIMIENTOS');
    if (!sh) return { ok: true, registros: [] };
    var vals = sh.getDataRange().getValues();
    // Cols: FECHA, HORA, TIPO, MOTIVO, MONTO, MEDIO, CATEGORIA, OBSERVACION
    var registros = [];
    // v9.8 FIX — antes se recorría de abajo hacia arriba y se confiaba en
    // que las filas ya estaban en orden cronológico (por eso "se cortaba"
    // con un bloque fuera de orden: si algún movimiento se cargó o corrigió
    // fuera de secuencia, quedaba pegado en la posición de fila, no en la
    // fecha real). Ahora se juntan TODOS los egresos primero y se ordenan
    // por fecha+hora antes de recortar al límite.
    for (var i = 1; i < vals.length; i++) {
      var f = vals[i];
      if (!f[0]) continue;
      var tipo = String(f[2] || '').trim().toUpperCase();
      if (tipo !== 'EGRESO') continue;
      var fechaStr = _normalizarFechaOrden(f[0]); // v10.3
      if (filtroFecha && fechaStr !== filtroFecha) continue;
      registros.push({
        fecha:     fechaStr,
        hora:      String(f[1] || '').trim(),
        tipo:      tipo,
        motivo:    String(f[3] || '').trim(),
        monto:     parseFloat(f[4]) || 0,
        medio:     String(f[5] || '').trim(),
        categoria: String(f[6] || '').trim(),
        obs:       String(f[7] || '').trim()
      });
    }
    registros.sort(function(a, b) {
      var claveA = a.fecha + ' ' + a.hora;
      var claveB = b.fecha + ' ' + b.hora;
      return claveB.localeCompare(claveA); // más reciente primero
    });
    if (registros.length > limite) registros = registros.slice(0, limite);
    return { ok: true, registros: registros };
  } catch(e) {
    return { ok: false, error: e.toString() };
  }
}

// ============================================================
// REEMPLAZAR la función getCajaDiaria() actual (línea ~4086 de tu Code.gs)
// por esta versión. Calcula los totales del día directamente
// desde la hoja "Ventas" (fila "TOTAL TICKET"), en vez de buscar
// una hoja "Caja" que no existe.
// ============================================================
function getCajaDiaria(datos) {
  try {
    var limite = (datos && datos.limite) ? parseInt(datos.limite) : 500;
    var ss = SpreadsheetApp.openById(SS_ID);
    var sh = ss.getSheetByName('Ventas');
    if (!sh) return { ok: true, registros: [] };
    var tz = Session.getScriptTimeZone();
    var filas = sh.getDataRange().getValues();
    var porDia = {}; // fechaStr -> acumulado del día

    for (var i = 1; i < filas.length; i++) {
      var f = filas[i];
      var fecha = f[1];
      if (!fecha || !(fecha instanceof Date)) continue;
      var desc = String(f[3] || '');
      if (!desc.includes('TOTAL TICKET')) continue; // solo filas resumen de ticket

      var fechaStr = Utilities.formatDate(fecha, tz, 'yyyy-MM-dd');
      var metodo = String(f[5] || '').replace(/[💵📱💳🔀🏦]/g, '').trim().toUpperCase();
      if (metodo.indexOf('|') !== -1) metodo = metodo.split('|')[0].trim();
      var total = parseFloat(f[7]) || 0;
      var detalleRaw = f.length > 8 ? f[8] : '';

      if (!porDia[fechaStr]) {
        porDia[fechaStr] = { fecha: fechaStr, efectivo: 0, posnet: 0, transferencia: 0, fiado: 0, total: 0, tickets: 0, usdRecibido: 0, clpRecibido: 0 };
      }
      var d = porDia[fechaStr];
      d.total += total;
      d.tickets += 1;

      // v10.7 — pago mixto/multimoneda (SEBA21 v443): si esta fila tiene
      // DETALLE_PAGOS (col I), una venta "MIXTO" ya no cae entera en
      // "efectivo" por descarte — se reparte según los pagos reales. Si la
      // columna está vacía (ventas de antes de v10.7, o ventas de un solo
      // método), se usa EXACTAMENTE la lógica de siempre, sin tocar nada.
      var detalle = null;
      if (detalleRaw) { try { detalle = JSON.parse(detalleRaw); } catch (eJson) { detalle = null; } }
      if (detalle && detalle.pagos && detalle.pagos.length) {
        detalle.pagos.forEach(function (p) {
          var eq = parseFloat(p.equivalenteARS) || 0;
          var mm = String(p.metodo || '').toUpperCase();
          if (mm === 'POSNET' || mm === 'TARJETA') d.posnet += eq;
          else if (mm === 'TRANSFERENCIA') d.transferencia += eq;
          else if (mm === 'FIADO') d.fiado += eq;
          else {
            d.efectivo += eq; // EFECTIVO ARS/USD/CLP son todos "físico en caja"
            if (String(p.moneda || '').toUpperCase() === 'USD') d.usdRecibido += parseFloat(p.recibido) || 0;
            if (String(p.moneda || '').toUpperCase() === 'CLP') d.clpRecibido += parseFloat(p.recibido) || 0;
          }
        });
      } else if (metodo === 'POSNET') d.posnet += total;
      else if (metodo === 'TRANSFERENCIA') d.transferencia += total;
      else if (metodo === 'FIADO') d.fiado += total;
      else d.efectivo += total; // EFECTIVO o cualquier valor no reconocido
    }

    var registros = Object.values(porDia).sort(function (a, b) { return b.fecha.localeCompare(a.fecha); });
    if (registros.length > limite) registros = registros.slice(0, limite);
    return { ok: true, registros: registros };
  } catch (e) {
    return { ok: false, error: e.toString() };
  }
}

// ========== IDEMPOTENCIA DE INGRESOS (búsqueda por idOperacion) ==========
// Recibe sheetHistorial ya abierto — evita un SpreadsheetApp.openById() extra
// cuando ingresarMercaderia() ya tiene la hoja abierta. El endpoint público
// (buscarOperacion, abajo) sí abre la planilla, porque no la tiene.
// Usa TextFinder en vez de leer la columna entera a memoria: rápido incluso
// con miles de filas de Historial acumuladas.
function buscarPorIdOperacion(sheetHistorial, idOp) {
  const idOpLimpio = String(idOp || '').trim();
  if (!idOpLimpio) return { existe: false };

  const ultimaFila = sheetHistorial.getLastRow();
  if (ultimaFila < 2) return { existe: false };

  const rangoJ = sheetHistorial.getRange(2, 10, ultimaFila - 1, 1); // col J completa
  const encontrada = rangoJ.createTextFinder(idOpLimpio).matchEntireCell(true).findNext();
  if (!encontrada) return { existe: false };

  const fila = encontrada.getRow();
  const filaData = sheetHistorial.getRange(fila, 1, 1, 11).getValues()[0];
  const tz = Session.getScriptTimeZone();
  return {
    existe: true,
    fila: fila,
    producto: String(filaData[1] || ''),
    cantidad: Number(filaData[2]) || 0,
    stockActual: Number(filaData[3]) || 0, // col D = stock resultante de ESE ingreso puntual
    fecha: filaData[0] instanceof Date ? Utilities.formatDate(filaData[0], tz, 'dd/MM HH:mm') : String(filaData[0] || '')
  };
}

// Endpoint público — el cliente lo consulta cuando hay timeout, para saber
// con certeza si su ingreso llegó, sin depender de cuántos movimientos más
// se hayan cargado mientras tanto (a diferencia de mirar los últimos N).
function buscarOperacion(idOp) {
  try {
    const ss = SpreadsheetApp.openById(SS_ID);
    const sheetHistorial = ss.getSheetByName(HOJA_HISTORIAL);
    return buscarPorIdOperacion(sheetHistorial, idOp);
  } catch (error) {
    console.error('Error buscarOperacion:', error);
    return { existe: false, error: error.toString() };
  }
}

// ========== ÚLTIMOS INGRESOS (para panel de deshacer en copihue-ingreso.html) ==========
// A diferencia de getHistorialCompras (que es para reportes), esta función devuelve
// el NÚMERO DE FILA real de cada registro, necesario para poder deshacerlo con precisión.
function getUltimosIngresos(limite) {
  try {
    limite = limite || 8;
    const ss = SpreadsheetApp.openById(SS_ID);
    const sh = ss.getSheetByName(HOJA_HISTORIAL);
    if (!sh) return { ok: true, registros: [] };
    const vals = sh.getDataRange().getValues();
    // Cols: A=fecha B=producto C=cantidad D=stockNuevo E=id F=proveedor G=costo H=ventaP I=venc J=idOperacion K=stockAnterior
    const registros = [];
    for (let i = vals.length - 1; i >= 1; i--) {
      const f = vals[i];
      if (!f[0]) continue;
      const cantidad = parseFloat(f[2]) || 0;
      if (cantidad <= 0) continue; // solo ingresos reales de stock, no ajustes de precio solo

      const fechaStr = f[0] instanceof Date
        ? Utilities.formatDate(f[0], Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm')
        : String(f[0]);

      registros.push({
        fila:          i + 1,                       // número de fila real en la hoja (1-indexed)
        fecha:         fechaStr,
        producto:      String(f[1] || '').trim(),
        cantidad:      cantidad,
        stockNuevo:    parseFloat(f[3]) || 0,
        stockAnterior: f[10] !== undefined && f[10] !== '' ? parseFloat(f[10]) : null, // col K
        proveedor:     String(f[5] || '').trim(),
        costo:         parseFloat(f[6]) || 0,
        precioVenta:   parseFloat(f[7]) || 0,
        idOperacion:   String(f[9] || '').trim()     // col J
      });
      if (registros.length >= limite) break;
    }
    return { ok: true, registros: registros };
  } catch(e) {
    return { ok: false, error: e.toString() };
  }
}

// Deshace un ingreso identificado por su número de fila en Historial.
// 1) Verifica que la fila siga correspondiendo al mismo producto (por seguridad,
//    en caso de que la hoja se haya modificado entre la lectura y el deshacer).
// 2) Resta la cantidad ingresada del stock actual en Inventario.
// 3) Borra la fila de Historial.
function deshacerIngreso(datos) {
  try {
    const ss = SpreadsheetApp.openById(SS_ID);
    const sheetHistorial = ss.getSheetByName(HOJA_HISTORIAL);
    const sheetInventario = ss.getSheetByName(HOJA_INVENTARIO);

    const fila = parseInt(datos.fila);
    const productoEsperado = String(datos.producto || '').trim().toUpperCase();
    const cantidadEsperada = Number(datos.cantidad);

    if (!fila || fila < 2) return { success: false, mensaje: 'Fila inválida' };

    const filaHist = sheetHistorial.getRange(fila, 1, 1, 11).getValues()[0];
    const productoEnFila = String(filaHist[1] || '').trim().toUpperCase();
    const cantidadEnFila = parseFloat(filaHist[2]) || 0;
    // v10.12b — columna E (índice 4): trae el ID nuevo SOLO si este ingreso
    // creó el producto de cero (ver ingresarMercaderia, rama "PRODUCTO
    // NUEVO"). Para un producto que ya existía, esa columna queda vacía.
    const esProductoNuevo = !!(String(filaHist[4] || '').trim());

    // Verificación de seguridad: la fila tiene que seguir siendo el mismo ingreso
    if (productoEnFila !== productoEsperado || cantidadEnFila !== cantidadEsperada) {
      return {
        success: false,
        mensaje: 'La fila ya no coincide con ese ingreso (puede que la planilla haya cambiado). No se deshizo nada — revisá manualmente.'
      };
    }

    // Buscar el producto en Inventario
    const datosInventario = sheetInventario.getDataRange().getValues();
    let filaProducto = -1;
    let stockActualInv = 0;
    const productoNormalizado = productoEsperado.replace(/\s+/g, ' ');

    for (let i = 1; i < datosInventario.length; i++) {
      if (!datosInventario[i][0]) continue;
      const nombreEnSheet = String(datosInventario[i][0]).trim().toUpperCase().replace(/\s+/g, ' ');
      if (nombreEnSheet === productoNormalizado) {
        filaProducto = i + 1;
        stockActualInv = Number(datosInventario[i][5]) || 0;
        break;
      }
    }

    if (filaProducto === -1) {
      return { success: false, mensaje: 'No se encontró el producto en Inventario — no se restó stock. Revisá manualmente.' };
    }

    // v10.12b — CASO PRODUCTO NUEVO: deshacer bien hecho es borrar la fila
    // entera, no dejar un producto fantasma con stock 0. Solo si nada más
    // tocó su stock desde que se creó.
    if (esProductoNuevo) {
      if (stockActualInv !== cantidadEnFila) {
        return {
          success: false,
          mensaje: 'Este producto tuvo otra actividad desde que se creó (una venta u otro ingreso) — no se borró nada, para no perder ese movimiento. Revisá manualmente en Inventario.'
        };
      }
      sheetInventario.deleteRow(filaProducto);
      sheetHistorial.deleteRow(fila);
      return {
        success: true,
        mensaje: '↩️ Ingreso deshecho — como era un producto nuevo, se borró su fila completa de Inventario.\n📦 ' + filaHist[1],
        stockNuevo: 0,
        filaBorrada: true
      };
    }

    // CASO PRODUCTO EXISTENTE — comportamiento original, sin cambios.
    const nuevoStockInv = Math.max(0, stockActualInv - cantidadEnFila);
    sheetInventario.getRange(filaProducto, 6).setValue(nuevoStockInv);

    // Borrar la fila de Historial
    sheetHistorial.deleteRow(fila);

    return {
      success: true,
      mensaje: '↩️ Ingreso deshecho.\n📦 ' + filaHist[1] + '\n📊 Stock: ' + stockActualInv + ' → ' + nuevoStockInv,
      stockNuevo: nuevoStockInv
    };
  } catch (error) {
    console.error('Error deshacerIngreso:', error);
    return { success: false, mensaje: 'Error: ' + error.toString() };
  }
}

function getHistorialCompras(datos) {
  try {
    var limite = (datos && datos.limite) ? parseInt(datos.limite) : 1000;
    var ss = SpreadsheetApp.openById(SS_ID);
    var sh = ss.getSheetByName('Historial');
    if (!sh) return { ok: true, registros: [] };
    var vals = sh.getDataRange().getValues();
    // Cols: FECHA, PRODUCTO, CANTIDAD, STOCK_NUEVO, ID, PROVEEDOR, PRECIO_COSTO, PRECIO_VENTA, FECHA_VENCIMIENTO
    var registros = [];
    for (var i = vals.length - 1; i >= 1; i--) {
      var f = vals[i];
      if (!f[0]) continue;
      var cantidad = parseFloat(f[2]) || 0;
      if (cantidad <= 0) continue; // solo ingresos de stock
      var precioCosto = parseFloat(f[6]) || 0;
      var fechaStr = f[0] instanceof Date
        ? Utilities.formatDate(f[0], Session.getScriptTimeZone(), 'yyyy-MM-dd')
        : String(f[0]).split('T')[0];
      registros.push({
        fecha:      fechaStr,
        producto:   String(f[1] || '').trim(),
        cantidad:   cantidad,
        stockNuevo: parseFloat(f[3]) || 0,
        id:         String(f[4] || '').trim(),
        proveedor:  String(f[5] || '').trim(),
        costo:      precioCosto,
        precioVenta:parseFloat(f[7]) || 0,
        vencimiento:f[8] ? String(f[8]).split('T')[0] : '',
        total:      cantidad * precioCosto
      });
      if (registros.length >= limite) break;
    }
    return { ok: true, registros: registros };
  } catch(e) {
    return { ok: false, error: e.toString() };
  }
}

function getInventarioResumen() {
  try {
    var ss   = SpreadsheetApp.openById(SS_ID);
    var sh   = ss.getSheetByName(HOJA_INVENTARIO);
    if (!sh) return { ok: true, productos: [], totalCosto: 0, totalVenta: 0 };
    var vals = sh.getDataRange().getValues();
    var productos = [];
    var totalCosto = 0, totalVenta = 0;
    for (var i = 1; i < vals.length; i++) {
      var r = vals[i];
      if (!r[0]) continue;
      var nombre    = String(r[0]).trim();
      var precio    = parseFloat(r[1])  || 0;  // col B precio venta
      var categoria = String(r[2]||'').trim();  // col C
      var proveedor = String(r[4]||'').trim();  // col E
      var stock     = parseFloat(r[5])  || 0;  // col F
      var costo     = parseFloat(r[18]) || parseFloat(r[6]) || 0; // col S o G
      var valorCosto = Math.round(stock * costo);
      var valorVenta = Math.round(stock * precio);
      totalCosto += valorCosto;
      totalVenta += valorVenta;
      if (stock > 0) {
        productos.push({
          nombre:     nombre,
          categoria:  categoria,
          proveedor:  proveedor,
          stock:      stock,
          costo:      costo,
          precio:     precio,
          valorCosto: valorCosto,
          valorVenta: valorVenta
        });
      }
    }
    productos.sort(function(a,b){ return b.valorCosto - a.valorCosto; });
    return { ok: true, productos: productos, totalCosto: totalCosto, totalVenta: totalVenta };
  } catch(e) {
    return { ok: false, error: e.toString() };
  }
}
// ========== doPost — Config Ofertas ==========
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.action === 'setConfig') {
      return respuestaJSON(setBulkConfig(body.config));
    }
    return respuestaJSON({ ok: false, error: 'Acción desconocida: ' + (body.action || '?') });
  } catch(err) {
    return respuestaJSON({ ok: false, error: 'doPost error: ' + err.toString() });
  }
}

// ========== setBulkConfig — escribe config completa ==========
function setBulkConfig(configMap) {
  try {
    const ss    = SpreadsheetApp.openById(SS_ID);
    const sheet = ss.getSheetByName(HOJA_CONFIG);
    if (!sheet) return { success: false, error: 'Hoja config_sistema no encontrada' };

    const datos = sheet.getDataRange().getValues();
    const rowMap = {};
    for (let i = 1; i < datos.length; i++) {
      const k = String(datos[i][0] || '').trim();
      if (k) rowMap[k.toLowerCase()] = i + 1;
    }

    let escritos = 0;
    const errores = [];

    for (const key of Object.keys(configMap)) {
      const clavePura = key.includes('|') ? key.split('|').slice(1).join('|') : key;
      const fila = rowMap[clavePura.toLowerCase()];
      if (!fila) { errores.push('No encontrado: ' + key); continue; }

      const arr = Array.isArray(configMap[key]) ? configMap[key] : [configMap[key]];
      for (let c = 0; c < arr.length && c < 7; c++) {
        const v = (arr[c] === null || arr[c] === undefined) ? '' : arr[c];
        const actual = datos[fila - 1][c + 1]; // ya en memoria, sin lectura extra
        if (String(actual).trim() !== String(v).trim()) {
          sheet.getRange(fila, c + 2).setValue(v);
          escritos++;
        }
      }
    }

    return { success: true, escritos: escritos, errores: errores };
  } catch(e) {
    return { success: false, error: e.toString() };
  }
}
/*
========================================================
AUTO PREVIEW COLORES — CONFIG_UI
NO ELIMINAR
========================================================

CONFIG_UI:
- editor visual
- preview instantáneo
- branding central

Google Sheets NO convierte HEX en color automáticamente.

========================================================
*/

function onEdit(e) {

  try {

    if (!e || !e.range) return;

    const hoja = e.range.getSheet();

    // SOLO CONFIG_UI
    if (hoja.getName() !== 'CONFIG_UI') return;

    const celda = e.range;

    const valor = celda.getValue();

    // Si borran la celda
    if (!valor) {

      celda
        .setBackground(null)
        .setFontColor('#000000');

      return;
    }

    const texto = String(valor).trim();

    // HEX válido
    const match = texto.match(/^#?([0-9A-Fa-f]{6})$/);

    // Si NO es HEX válido
    if (!match) {

      celda
        .setBackground(null)
        .setFontColor('#000000');

      return;
    }

    const color = '#' + match[1].toUpperCase();

    // Pintar fondo
    celda.setBackground(color);

    // Calcular brillo
    const rgb = parseInt(match[1], 16);

    const r = (rgb >> 16) & 255;
    const g = (rgb >> 8) & 255;
    const b = rgb & 255;

    const brillo = (r * 299 + g * 587 + b * 114) / 1000;

    // Texto blanco/negro automático
    celda.setFontColor(
      brillo < 128
        ? '#FFFFFF'
        : '#000000'
    );

  } catch(error) {

    Logger.log(error);

  }

}

// ══ HERRAMIENTAS ═════════════════════════════════════════════════════════
// Lee hoja HERRAMIENTAS: A=NOMBRE  B=URL  C=ICONO  D=DESCRIPCION  E=ACTIVO
function getHerramientas() {
  try {
    var ss   = SpreadsheetApp.openById(SS_ID);
    var hoja = ss.getSheetByName('HERRAMIENTAS');
    if (!hoja) return { ok: false, error: 'Hoja HERRAMIENTAS no encontrada' };
    var datos = hoja.getDataRange().getValues();
    var lista = [];
    for (var i = 1; i < datos.length; i++) {
      var fila = datos[i];
      if (!fila[0]) continue;
      lista.push({
        nombre:      String(fila[0] || '').trim(),
        url:         String(fila[1] || '').trim(),
        icono:       String(fila[2] || '').trim(),
        descripcion: String(fila[3] || '').trim(),
        activo:      String(fila[4] || '').trim().toUpperCase() === 'SI'
      });
    }
    return { ok: true, herramientas: lista };
  } catch(err) {
    return { ok: false, error: String(err) };
  }
}
// ══ FIN HERRAMIENTAS ══════════════════════════════════════════════════════

// ============================================================
//  RASPADITA COPIHUE — v1.0
// ============================================================

function premiosRaspadita() {
  try {
    var ss  = SpreadsheetApp.openById(SS_ID);
    var sh  = ss.getSheetByName(HOJA_INVENTARIO);
    if (!sh) return { ok: false, error: 'Hoja inventario no encontrada' };
    var datos   = sh.getDataRange().getValues();
    var premios = [];
    for (var i = 1; i < datos.length; i++) {
      var r         = datos[i];
      var nombre    = String(r[0] || '').trim();
      var precio    = parseFloat(r[1]) || 0;
      var categoria = String(r[2] || '').trim().toUpperCase();
      var stock     = parseFloat(r[5]) || 0;
      if (!nombre) continue;
      if (categoria !== 'DULCES Y SNACKS') continue;
      if (precio > 2500 || precio <= 1000) continue;
      if (stock < 3) continue;
      premios.push({ nombre: nombre, precio: precio, stock: Math.floor(stock) });
    }
    // Mezclar (Fisher-Yates)
    for (var j = premios.length - 1; j > 0; j--) {
      var k = Math.floor(Math.random() * (j + 1));
      var tmp = premios[j]; premios[j] = premios[k]; premios[k] = tmp;
    }
    return { ok: true, premios: premios, total: premios.length };
  } catch(err) {
    return { ok: false, error: err.toString() };
  }
}

// v10.7 — SEBA21 pagos múltiples/multimoneda: lee usd_valor/usd_activo/
// clp_valor/clp_activo de config_sistema (ya existían en la planilla, no se
// creó ninguna fuente nueva). Mismo patrón que getConfigRaspadita().
// usd_limite_sobrepago_pct es opcional — si no está cargada en la planilla,
// usa 20% por defecto (no es un límite fijo enterrado: si el negocio quiere
// otro valor, solo tiene que agregar esa fila en config_sistema).
// v10.7b — FIX: parseFloat de JS corta en la coma. Si config_sistema tiene
// "1,6" (formato argentino, coma decimal) en vez de "1.6", parseFloat("1,6")
// devolvía 1 en vez de 1.6 — o directamente NaN si venía con más texto
// alrededor, lo que disparaba "no hay cotización cargada" aunque sí estaba.
// Entiende: número real de Sheets, "1,6", "1.6", "$1.500,50", con espacios.
function _parseNumeroFlexible(v) {
  if (v === null || v === undefined || v === '') return 0;
  if (typeof v === 'number') return v;
  var s = String(v).trim().replace(/[^\d,.\-]/g, '');
  if (!s) return 0;
  if (s.indexOf(',') !== -1 && s.indexOf('.') !== -1) {
    s = s.replace(/\./g, '').replace(',', '.'); // "1.500,50" -> "1500.50"
  } else if (s.indexOf(',') !== -1) {
    s = s.replace(',', '.'); // "1,6" -> "1.6"
  }
  var n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

function getCotizaciones() {
  try {
    var ss = SpreadsheetApp.openById(SS_ID);
    var sh = ss.getSheetByName(HOJA_CONFIG);
    if (!sh) return { ok: false, error: 'Hoja config_sistema no encontrada' };
    var datos = sh.getDataRange().getValues();
    var mapa = {
      'usd_valor':                 'usdValor',
      'usd_activo':                'usdActivo',
      'clp_valor':                 'clpValor',
      'clp_activo':                'clpActivo',
      'usd_limite_sobrepago_pct':  'usdLimiteSobrepagoPct'
    };
    var cfg = {};
    for (var i = 0; i < datos.length; i++) {
      var clave = String(datos[i][0] || '').trim().toLowerCase();
      if (mapa[clave]) cfg[mapa[clave]] = datos[i][2]; // columna C = valor (igual que el resto del config)
    }
    var usdBruto = _parseNumeroFlexible(cfg.usdValor);
    var clpBruto = _parseNumeroFlexible(cfg.clpValor);
    // v10.9 — límite de cordura: si el valor que sale de config_sistema es
    // absurdo (por ejemplo, Sheets convirtió la celda en una fecha sin
    // querer, o quedó un número gigante por error de tipeo), NO se usa para
    // calcular ningún equivalente — se trata como "no disponible", igual
    // que si la cotización nunca se hubiera cargado. Mejor mostrar el error
    // de siempre que calcular un vuelto de miles de millones por accidente
    // (caso real: CLP quedó en un valor gigante y el vuelto calculado dio
    // más de 12 mil millones de pesos).
    var RANGO_MIN = 0.001, RANGO_MAX = 100000;
    var usdValida = usdBruto >= RANGO_MIN && usdBruto <= RANGO_MAX;
    var clpValida = clpBruto >= RANGO_MIN && clpBruto <= RANGO_MAX;
    return {
      ok: true,
      usdValor:  usdValida ? usdBruto : 0,
      usdActivo: usdValida && String(cfg.usdActivo).toUpperCase() === 'TRUE',
      clpValor:  clpValida ? clpBruto : 0,
      clpActivo: clpValida && String(cfg.clpActivo).toUpperCase() === 'TRUE',
      usdLimiteSobrepagoPct: cfg.usdLimiteSobrepagoPct !== undefined && cfg.usdLimiteSobrepagoPct !== ''
        ? (_parseNumeroFlexible(cfg.usdLimiteSobrepagoPct) || 20)
        : 20
    };
  } catch (err) {
    return { ok: false, error: err.toString() };
  }
}

function getConfigRaspadita() {
  try {
    var ss  = SpreadsheetApp.openById(SS_ID);
    var sh  = ss.getSheetByName(HOJA_CONFIG);
    if (!sh) return { ok: false, error: 'Hoja config_sistema no encontrada' };
    var datos  = sh.getDataRange().getValues();
    var mapa = {
      'telefono':             'telefono',
      'nombre de la empresa': 'empresa',
      'color primario':       'colorPrimario',
      'url_sitio':            'urlSitio',
  'slogan':               'slogan',
  'test_tragamonedas':    'test_tragamonedas'
    };
    var config = {};
    for (var i = 0; i < datos.length; i++) {
      var clave = String(datos[i][0] || '').trim().toLowerCase();
      if (mapa[clave]) config[mapa[clave]] = String(datos[i][2] || '').trim(); // columna C = valor
    }
    return { ok: true, config: config };
  } catch(err) {
    return { ok: false, error: err.toString() };
  }
}

function registrarGanador(datos) {
  try {
    var sh    = _getJuegoStats_();
    var tz    = Session.getScriptTimeZone();
    var ahora = new Date();
    var fecha = Utilities.formatDate(ahora, tz, 'yyyy-MM-dd');
    var hora  = Utilities.formatDate(ahora, tz, 'HH:mm:ss');
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    var codigo = 'COP-';
    for (var i = 0; i < 5; i++) codigo += chars.charAt(Math.floor(Math.random() * chars.length));
    // Calcular vencimiento = cierre del local del día actual
    var vence = _raspVencimientoCierre_(ahora, tz);
    sh.appendRow([fecha, hora, String(datos.dispositivo||''), 'GANADOR', String(datos.premio||''), parseFloat(datos.precio||0), codigo, 'PENDIENTE', 'NO', vence]);
    SpreadsheetApp.flush();
    return { ok: true, codigo: codigo, vence: vence };
  } catch(err) {
    return { ok: false, error: err.toString() };
  }
}

// Calcula el timestamp de cierre del local para el día actual.
// Lee la hora de cierre de la config. Fallback: 22:00.
function _raspVencimientoCierre_(ahora, tz) {
  try {
    var ss   = SpreadsheetApp.openById(SS_ID);
    var sh   = ss.getSheetByName('CONFIGURACION');
    var hC = 22, mC = 0;
    if (sh) {
      var rows = sh.getDataRange().getValues();
      for (var i = 0; i < rows.length; i++) {
        var clave = String(rows[i][0] || '').trim().toLowerCase();
        if (clave.indexOf('cierre') !== -1 && clave.indexOf('local') !== -1) {
          var raw = String(rows[i][1] || '').trim();
          // Puede ser "22:00", "22", o fracción decimal (p.ej. 0.9166 de Google Sheets)
          if (raw.indexOf(':') !== -1) {
            var parts = raw.split(':');
            hC = parseInt(parts[0]) || 22;
            mC = parseInt(parts[1]) || 0;
          } else if (!isNaN(parseFloat(raw)) && parseFloat(raw) <= 1) {
            var totalMins = Math.round(parseFloat(raw) * 24 * 60);
            hC = Math.floor(totalMins / 60);
            mC = totalMins % 60;
          } else {
            hC = parseInt(raw) || 22;
          }
          break;
        }
      }
    }
    var vence = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), hC, mC, 0);
    return Utilities.formatDate(vence, tz, 'yyyy-MM-dd HH:mm:ss');
  } catch(e) {
    // Fallback: 22:00 del día actual
    var v = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 22, 0, 0);
    return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
  }
}

function registrarJugada(datos) {
  try {
    var sh    = _getJuegoStats_();
    var tz    = Session.getScriptTimeZone();
    var ahora = new Date();
    var fecha = Utilities.formatDate(ahora, tz, 'yyyy-MM-dd');
    var hora  = Utilities.formatDate(ahora, tz, 'HH:mm:ss');
    sh.appendRow([fecha, hora, String(datos.dispositivo||''), 'PERDEDOR', '', '', '', '', '']);
    SpreadsheetApp.flush();
    return { ok: true };
  } catch(err) {
    return { ok: false, error: err.toString() };
  }
}

// Helper: obtiene (o crea) la hoja JUEGO_STATS con encabezados correctos
function _getJuegoStats_() {
  var ss      = SpreadsheetApp.openById(SS_ID);
  var sh      = ss.getSheetByName('JUEGO_STATS');
  var headers = ['Fecha','Hora','Dispositivo','Resultado','Premio','Precio','Código','Estado','Entregado','Vence'];
  if (!sh) {
    sh = ss.insertSheet('JUEGO_STATS');
    sh.getRange(1,1,1,headers.length).setValues([headers]);
    sh.getRange(1,1,1,headers.length).setFontWeight('bold');
    sh.setFrozenRows(1);
    return sh;
  }
  if (sh.getLastRow() === 0) {
    sh.getRange(1,1,1,headers.length).setValues([headers]);
    sh.getRange(1,1,1,headers.length).setFontWeight('bold');
    sh.setFrozenRows(1);
    return sh;
  }
  // Verificar si la primera fila ES el encabezado o un dato.
  // Si la celda A1 contiene una fecha (no el texto "Fecha"), la hoja
  // no tiene encabezado — insertar una fila antes de los datos.
  var primeraCelda = String(sh.getRange(1,1).getValue() || '').trim();
  if (primeraCelda.toLowerCase() !== 'fecha') {
    sh.insertRowBefore(1);
    sh.getRange(1,1,1,headers.length).setValues([headers]);
    sh.getRange(1,1,1,headers.length).setFontWeight('bold');
    sh.setFrozenRows(1);
    console.log('✅ JUEGO_STATS: encabezado insertado en fila 1 (había datos sin header)');
  }
  return sh;
}

// ========== RASPADITA — Helper: leer JUEGO_STATS ==========
// Columnas: 0=Fecha 1=Hora 2=Dispositivo 3=Resultado 4=Premio 5=Precio 6=Código 7=Estado 8=Entregado
function _raspSheet_() {
  // Usa _getJuegoStats_ para garantizar que la fila 1 siempre sea el encabezado.
  // Si la hoja existía sin encabezado (datos desde fila 1), lo inserta ahora.
  return _getJuegoStats_();
}

function _raspFila_(sh, codigo) {
  var datos = sh.getDataRange().getValues();
  for (var i = 1; i < datos.length; i++) {
    var cod = String(datos[i][6] || '').trim().toUpperCase();
    if (cod === codigo && datos[i][3] === 'GANADOR') return i + 1; // fila 1-indexed
  }
  return -1;
}

function _raspObj_(row) {
  return {
    fecha:  String(row[0] || ''),
    hora:   String(row[1] || ''),
    premio: String(row[4] || ''),
    precio: row[5] || 0,
    codigo: String(row[6] || '').trim().toUpperCase(),
    estado: String(row[7] || 'PENDIENTE'),
    entregado: String(row[8] || 'NO'),
    vence: String(row[9] || '')
  };
}

// ========== RASPADITA — Buscar código ==========
function buscarCodigoRaspadita(codigo) {
  try {
    codigo = String(codigo).trim().toUpperCase();
    if (!codigo) return { ok: false, error: 'Código vacío' };
    var sh = _raspSheet_();
    if (!sh || sh.getLastRow() < 2) return { ok: false, error: 'Sin registros' };
    var datos = sh.getDataRange().getValues();
    var ahora2 = new Date();
    for (var i = 1; i < datos.length; i++) {
      var cod = String(datos[i][6] || '').trim().toUpperCase();
      if (cod === codigo && datos[i][3] === 'GANADOR') {
        var obj = _raspObj_(datos[i]);
        // Calcular estado real por vencimiento
        if (obj.estado === 'PENDIENTE' && obj.vence) {
          var vD = new Date(obj.vence);
          if (!isNaN(vD.getTime()) && ahora2 > vD) {
            obj.estado = 'VENCIDO';
            sh.getRange(i + 1, 8).setValue('VENCIDO');
            SpreadsheetApp.flush();
          }
        }
        return { ok: true, ganador: obj };
      }
    }
    return { ok: false, error: 'Código no encontrado' };
  } catch(err) {
    return { ok: false, error: err.toString() };
  }
}

// ========== RASPADITA — Listar pendientes ==========
function listarPendientesRaspadita() {
  try {
    var sh = _raspSheet_();
    if (!sh || sh.getLastRow() < 2) return { ok: true, pendientes: [] };
    var datos   = sh.getDataRange().getValues();
    var ahora   = new Date();
    var pending = [];
    for (var i = 1; i < datos.length; i++) {
      if (datos[i][3] !== 'GANADOR') continue;
      var estado = String(datos[i][7] || 'PENDIENTE');
      if (estado !== 'PENDIENTE') continue;
      // Calcular si venció según hora de cierre guardada en col J
      var venceStr = String(datos[i][9] || '');
      if (venceStr) {
        var venceDate = new Date(venceStr);
        if (!isNaN(venceDate.getTime()) && ahora > venceDate) {
          // Vencido — actualizar estado en la hoja automáticamente
          var sh2 = sh; // misma hoja
          sh2.getRange(i + 1, 8).setValue('VENCIDO');
          continue; // no mostrar en pendientes
        }
      }
      pending.push(_raspObj_(datos[i]));
    }
    if (pending.length > 0) SpreadsheetApp.flush();
    // Más recientes primero
    pending.reverse();
    return { ok: true, pendientes: pending };
  } catch(err) {
    return { ok: false, error: err.toString() };
  }
}

// ========== RASPADITA — Marcar como entregado ==========
function entregarPremioRaspadita(codigo) {
  try {
    codigo = String(codigo).trim().toUpperCase();
    if (!codigo) return { ok: false, error: 'Código vacío' };
    var sh = _raspSheet_();
    if (!sh || sh.getLastRow() < 2) return { ok: false, error: 'Sin registros' };
    var fila = _raspFila_(sh, codigo);
    if (fila < 0) return { ok: false, error: 'Código no encontrado' };
    // Verificar vencimiento antes de entregar
    var row = sh.getRange(fila, 1, 1, 10).getValues()[0];
    var venceStr = String(row[9] || '');
    if (venceStr) {
      var venceDate = new Date(venceStr);
      if (!isNaN(venceDate.getTime()) && new Date() > venceDate) {
        sh.getRange(fila, 8).setValue('VENCIDO');
        SpreadsheetApp.flush();
        return { ok: false, vencido: true, error: 'Premio vencido — el local cerró sin que se retirara' };
      }
    }
    sh.getRange(fila, 8).setValue('ENTREGADO'); // col H = Estado
    sh.getRange(fila, 9).setValue('SI');         // col I = Entregado
    SpreadsheetApp.flush();
    return { ok: true };
  } catch(err) {
    return { ok: false, error: err.toString() };
  }
}

// ========== EDITAR CLIENTE ==========
// Agrega esto en Code.gs junto a upsertCliente
// También agregar en el doGet/doPost:
//   if (e && e.parameter && e.parameter.action === 'actualizarCliente') {
//     var d = JSON.parse(decodeURIComponent(e.parameter.data));
//     return respuestaJSON(actualizarCliente(d));
//   }

function actualizarCliente(datos) {
  try {
    if (!datos.nombreOriginal) return { success: false, mensaje: 'Falta nombre original' };
    var ss  = SpreadsheetApp.openById(SS_ID);
    var nomOrig = datos.nombreOriginal.trim().toUpperCase();
    var nomNuevo = (datos.nombreNuevo || datos.nombreOriginal).trim();
    var telNuevo = String(datos.telefonoNuevo || '').replace(/\D/g, '');

    // ── 1. Actualizar hoja Clientes ──
    var shCli = ss.getSheetByName('Clientes');
    if (shCli) {
      var cliData = shCli.getDataRange().getValues();
      for (var i = 1; i < cliData.length; i++) {
        if (String(cliData[i][0] || '').trim().toUpperCase() === nomOrig) {
          shCli.getRange(i + 1, 1).setValue(nomNuevo);
          if (telNuevo) shCli.getRange(i + 1, 2).setValue(telNuevo);
          break;
        }
      }
    }

    // ── 2. Actualizar hoja FIADOS columna D (nombre) y E (teléfono) ──
    var shFia = ss.getSheetByName(HOJA_FIADOS);
    var fiaData = shFia.getDataRange().getValues();
    var actualizados = 0;
    for (var j = 1; j < fiaData.length; j++) {
      if (String(fiaData[j][3] || '').trim().toUpperCase() === nomOrig) {
        shFia.getRange(j + 1, 4).setValue(nomNuevo);
        if (telNuevo) shFia.getRange(j + 1, 5).setValue(telNuevo);
        actualizados++;
      }
    }

    SpreadsheetApp.flush();
    return { success: true, actualizados: actualizados };
  } catch(e) {
    return { success: false, mensaje: e.toString() };
  }
}

// ============================================================
//  TRAGAMONEDAS COPIHUE — v2.0 (una fila por giro)
//
//  Estructura TRAGAMONEDAS_CODIGOS:
//  A=Código | B=Fecha | C=Hora | D=Estado | E=Símbolo | F=Premio
//  G=Dispositivo | H=Entregado | I=GirosTotal | J=NroGiro
//
//  - generarCodigoTragamonedas: crea 1 fila maestra (NroGiro=0, Estado=EMITIDO)
//  - registrarPremioTragamonedas: appendRow por cada giro jugado
//  - validarCodigoTragamonedas: cuenta filas del código para saber giros usados
//  - listarPendientesTragamonedas: busca filas GANADOR no entregadas
//  - entregarPremioTragamonedas: marca todas las filas GANADOR del código
// ============================================================

function _tragSheet_() {
  var ss      = SpreadsheetApp.openById(SS_ID);
  var sh      = ss.getSheetByName('TRAGAMONEDAS_CODIGOS');
  var headers = ['Código','Fecha','Hora','Estado','Símbolo','Premio','Dispositivo','Entregado','GirosTotal','NroGiro'];
  if (!sh) {
    sh = ss.insertSheet('TRAGAMONEDAS_CODIGOS');
    sh.getRange(1,1,1,headers.length).setValues([headers]);
    sh.getRange(1,1,1,headers.length).setFontWeight('bold');
    sh.setFrozenRows(1);
    return sh;
  }
  // SIEMPRE verificar fila 1 antes de usar la hoja
  // Si está vacía o tiene datos (no el texto "Código") → escribir/insertar encabezado
  var primeraCelda = String(sh.getRange(1,1).getValue() || '').trim();
  if (primeraCelda === '') {
    // Hoja vacía o fila 1 vacía — escribir encabezado directamente
    sh.getRange(1,1,1,headers.length).setValues([headers]);
    sh.getRange(1,1,1,headers.length).setFontWeight('bold');
    sh.setFrozenRows(1);
  } else if (primeraCelda.toLowerCase() !== 'código') {
    // Fila 1 tiene datos reales (ej: TRG-XXXXX) — insertar encabezado antes
    sh.insertRowBefore(1);
    sh.getRange(1,1,1,headers.length).setValues([headers]);
    sh.getRange(1,1,1,headers.length).setFontWeight('bold');
    sh.setFrozenRows(1);
    console.log('✅ TRAGAMONEDAS_CODIGOS: encabezado insertado automáticamente');
  }
  // Si primeraCelda === 'código' → encabezado ya existe, no hacer nada
  return sh;
}

function _genCodigoTrag_() {
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  var c = 'TRG-';
  for (var i = 0; i < 5; i++) c += chars.charAt(Math.floor(Math.random() * chars.length));
  return c;
}

// Genera el código y crea la fila maestra (NroGiro=0, Estado=EMITIDO)
function generarCodigoTragamonedas(monto) {
  try {
    var giros  = Math.max(1, Math.floor((parseFloat(monto) || 10000) / 10000));
    var sh     = _tragSheet_();
    var tz     = Session.getScriptTimeZone();
    var ahora  = new Date();
    var fecha  = Utilities.formatDate(ahora, tz, 'yyyy-MM-dd');
    var hora   = Utilities.formatDate(ahora, tz, 'HH:mm:ss');
    var codigo = _genCodigoTrag_();
    // Evitar duplicados
    var codigos = sh.getDataRange().getValues().map(function(r){ return String(r[0]); });
    var tries = 0;
    while (codigos.indexOf(codigo) !== -1 && tries++ < 10) codigo = _genCodigoTrag_();
    // Fila maestra: NroGiro=0 = código emitido, aún no jugado
    sh.appendRow([codigo, fecha, hora, 'EMITIDO', '', '', '', 'NO', giros, 0]);
    SpreadsheetApp.flush();
    return { ok: true, codigo: codigo, giros: giros };
  } catch(err) {
    return { ok: false, error: err.toString() };
  }
}

// Valida el código y devuelve cuántos giros quedan
function validarCodigoTragamonedas(codigo) {
  try {
    codigo = String(codigo).trim().toUpperCase();
    if (!codigo) return { ok: false, error: 'Código vacío' };
    var sh    = _tragSheet_();
    var datos = sh.getDataRange().getValues();
    var girosTotal  = 0;
    var girosUsados = 0;
    var yaEntregado = false;
    var encontrado  = false;
    for (var i = 1; i < datos.length; i++) {
      if (String(datos[i][0]).trim().toUpperCase() !== codigo) continue;
      encontrado = true;
      var nroGiro    = parseInt(datos[i][9]) || 0;
      var gt         = parseInt(datos[i][8]) || 1;
      var estadoFila = String(datos[i][3] || '').trim().toUpperCase();
      if (gt > girosTotal) girosTotal = gt;
      if (nroGiro === 0) {
        // Fila maestra (v2) o fila del sistema viejo (v1)
        // Si tiene Estado=GANADOR/PERDEDOR es fila vieja ya jugada → contar como usada
        if (estadoFila === 'GANADOR' || estadoFila === 'PERDEDOR') {
          girosUsados++;
          if (estadoFila === 'GANADOR') {
            // Fila vieja con premio — si no está entregada, es pendiente real
            // No bloquear: girosTotal puede ser mayor si monto fue >$10.000
          }
        }
        // EMITIDO/PENDIENTE con nroGiro=0 → fila maestra, no jugada aún
        continue;
      }
      girosUsados++;
      if (String(datos[i][7] || '').trim().toUpperCase() === 'SI') yaEntregado = true;
    }
    if (!encontrado) return { ok: false, error: 'Código no encontrado' };
    var girosRestantes = Math.max(0, girosTotal - girosUsados);
    if (girosRestantes === 0) {
      return { ok: true, usado: true, girosRestantes: 0 };
    }
    return {
      ok: true, usado: false,
      giros: girosTotal, girosUsados: girosUsados,
      girosRestantes: girosRestantes
    };
  } catch(err) {
    return { ok: false, error: err.toString() };
  }
}

// Registra el resultado de un giro — appendRow (nueva fila por giro)
function registrarPremioTragamonedas(datos) {
  try {
    var codigo     = String(datos.codigo     || '').trim().toUpperCase();
    var simboloId  = String(datos.simbolo    || 'nada');
    var premioTxt  = String(datos.premio     || 'SIN PREMIO');
    var dispositivo= String(datos.dispositivo|| '').slice(0, 80);
    var nroGiro    = parseInt(datos.giro)    || 1;
    var girosTotal = parseInt(datos.girosTotal) || 1;
    var esGanador  = simboloId !== 'nada';
    if (!codigo) return { ok: false, error: 'Código vacío' };
    var sh  = _tragSheet_();
    var tz  = Session.getScriptTimeZone();
    var ahora = new Date();
    var fecha = Utilities.formatDate(ahora, tz, 'yyyy-MM-dd');
    var hora  = Utilities.formatDate(ahora, tz, 'HH:mm:ss');
    // Verificar que el código existe
    var existente = sh.getDataRange().getValues().filter(function(r){
      return String(r[0]).trim().toUpperCase() === codigo;
    });
    if (existente.length === 0) return { ok: false, error: 'Código no encontrado' };
    // Agregar fila del giro
    var estado = esGanador ? 'GANADOR' : 'PERDEDOR';
    sh.appendRow([codigo, fecha, hora, estado, simboloId, premioTxt, dispositivo, 'NO', girosTotal, nroGiro]);
    SpreadsheetApp.flush();
    var girosRestantes = Math.max(0, girosTotal - nroGiro);
    return { ok: true, codigoPremio: codigo, girosRestantes: girosRestantes };
  } catch(err) {
    return { ok: false, error: err.toString() };
  }
}

// Lista todos los premios ganados pendientes de entrega (agrupa por código)
function listarPendientesTragamonedas() {
  try {
    var sh    = _tragSheet_();
    var datos = sh.getDataRange().getValues();
    // Agrupar filas por código — buscar las que son GANADOR y no entregadas
    var mapa = {}; // codigo → { premio, simbolo, fecha, hora, dispositivo }
    for (var i = 1; i < datos.length; i++) {
      var cod       = String(datos[i][0] || '').trim().toUpperCase();
      var estado    = String(datos[i][3] || '').trim().toUpperCase();
      var entregado = String(datos[i][7] || '').trim().toUpperCase();
      var nroGiro   = parseInt(datos[i][9]) || 0;
      if (!cod || nroGiro === 0) continue; // saltar fila maestra
      if (estado === 'GANADOR' && entregado !== 'SI') {
        if (!mapa[cod]) {
          mapa[cod] = {
            codigo     : cod,
            premios    : [],
            fecha      : String(datos[i][1]),
            hora       : String(datos[i][2]),
            dispositivo: String(datos[i][6])
          };
        }
        mapa[cod].premios.push({
          nroGiro: nroGiro,
          simbolo: String(datos[i][4]),
          premio : String(datos[i][5])
        });
      }
    }
    // Construir lista final
    var pendientes = Object.keys(mapa).map(function(cod) {
      var g = mapa[cod];
      var premioTexto = g.premios.length === 1
        ? g.premios[0].premio
        : g.premios.map(function(p){ return 'Giro '+p.nroGiro+': '+p.premio; }).join(' / ');
      return {
        codigo     : g.codigo,
        premio     : premioTexto,
        simbolo    : g.premios[0].simbolo,
        fecha      : g.fecha,
        hora       : g.hora,
        dispositivo: g.dispositivo,
        cantPremios: g.premios.length
      };
    });
    // Más recientes primero
    pendientes.reverse();
    return { ok: true, pendientes: pendientes };
  } catch(err) {
    return { ok: false, error: err.toString() };
  }
}

// Marcar premio como entregado — marca todas las filas GANADOR del código
function entregarPremioTragamonedas(codigo) {
  try {
    codigo = String(codigo || '').trim().toUpperCase();
    if (!codigo) return { ok: false, error: 'Código vacío' };
    var sh    = _tragSheet_();
    var datos = sh.getDataRange().getValues();
    var marcados = 0;
    for (var i = 1; i < datos.length; i++) {
      if (String(datos[i][0]).trim().toUpperCase() !== codigo) continue;
      if (String(datos[i][3]).trim().toUpperCase() === 'GANADOR' &&
          String(datos[i][7]).trim().toUpperCase() !== 'SI') {
        sh.getRange(i + 1, 8).setValue('SI');   // col H = Entregado
        marcados++;
      }
    }
    if (marcados === 0) return { ok: false, error: 'Código no encontrado o ya entregado: ' + codigo };
    SpreadsheetApp.flush();
    return { ok: true, codigo: codigo, premiosEntregados: marcados };
  } catch(err) {
    return { ok: false, error: err.toString() };
  }
}
