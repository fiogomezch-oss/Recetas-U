// ===== PÁGINA SOLUCIÓN INTERACTIVA: CATÁLOGO =====

const buscador = document.querySelector('#buscador');
const filtroCategoria = document.querySelector('#filtro-categoria');
const filtroTiempo = document.querySelector('#filtro-tiempo');
const filtroPrecio = document.querySelector('#filtro-precio');
const soloFavoritas = document.querySelector('#solo-favoritas');
const botonLimpiar = document.querySelector('#limpiar-filtros');
const listaRecetas = document.querySelector('#lista-recetas');
const contador = document.querySelector('#contador');

let todasLasRecetas = [];
let favoritos = leerLocal(CLAVE_FAVORITOS);   // se recuperan al abrir la página
let abiertas = [];                            // ids de las recetas con el detalle visible

// Carga el JSON y dibuja el catálogo
async function iniciar() {
    try {
        todasLasRecetas = await cargarRecetasJSON();
        mostrarRecetas();
    } catch (error) {
        listaRecetas.textContent = '';
        listaRecetas.appendChild(crearElemento('p', 'estado-vacio', 'No se pudieron cargar las recetas.'));
    }
}

// Aplica la búsqueda y todos los filtros al mismo tiempo
function filtrarRecetas() {
    const texto = normalizar(buscador.value.trim());
    const categoria = filtroCategoria.value;
    const tiempoMaximo = Number(filtroTiempo.value);   // 0 = cualquiera
    const precioMaximo = Number(filtroPrecio.value);   // 0 = cualquiera

    return todasLasRecetas.filter((receta) => {
        const enNombre = normalizar(receta.nombre).includes(texto);
        const enIngredientes = receta.ingredientes.some((ingrediente) => normalizar(ingrediente).includes(texto));
        const coincideTexto = enNombre || enIngredientes;

        const coincideCategoria = categoria === 'todas' || receta.categoria === categoria;
        const coincideTiempo = tiempoMaximo === 0 || receta.tiempo <= tiempoMaximo;
        const coincidePrecio = precioMaximo === 0 || receta.precio <= precioMaximo;
        const coincideFavorita = !soloFavoritas.checked || favoritos.includes(receta.id);

        return coincideTexto && coincideCategoria && coincideTiempo && coincidePrecio && coincideFavorita;
    });
}

// Dibuja la lista completa según el estado actual
function mostrarRecetas() {
    const visibles = filtrarRecetas();
    listaRecetas.textContent = '';

    if (visibles.length === 0) {
        listaRecetas.appendChild(crearElemento('p', 'estado-vacio', 'No se encontraron recetas con esa búsqueda o filtros. Prueba con otra palabra o limpia los filtros.'));
    }

    for (const receta of visibles) {
        const estaAbierta = abiertas.includes(receta.id);
        const esFavorita = favoritos.includes(receta.id);

        const tarjeta = crearTarjeta(receta);
        if (estaAbierta) {
            tarjeta.appendChild(crearDetalle(receta));
        }
        tarjeta.appendChild(crearAcciones(receta, estaAbierta, esFavorita));
        listaRecetas.appendChild(tarjeta);
    }

    contador.textContent = 'Mostrando ' + visibles.length + ' de ' + todasLasRecetas.length + ' recetas · Favoritas guardadas: ' + favoritos.length;
}

// Botones de cada tarjeta
function crearAcciones(receta, estaAbierta, esFavorita) {
    const acciones = crearElemento('div', 'tarjeta-acciones');

    const botonVer = crearElemento('button', 'boton boton-secundario boton-pequeno', estaAbierta ? 'Ocultar receta' : 'Ver receta');
    botonVer.type = 'button';
    botonVer.setAttribute('aria-expanded', estaAbierta);
    botonVer.addEventListener('click', () => alternarDetalle(receta.id));

    const botonFavorita = crearElemento('button', esFavorita ? 'boton boton-pequeno boton-guardada' : 'boton boton-pequeno', esFavorita ? 'Guardada' : 'Guardar');
    botonFavorita.type = 'button';
    botonFavorita.setAttribute('aria-pressed', esFavorita);
    botonFavorita.addEventListener('click', () => alternarFavorita(receta.id));

    acciones.appendChild(botonVer);
    acciones.appendChild(botonFavorita);
    return acciones;
}

// Muestra u oculta ingredientes y pasos
function alternarDetalle(id) {
    if (abiertas.includes(id)) {
        abiertas = abiertas.filter((abierta) => abierta !== id);
    } else {
        abiertas.push(id);
    }
    mostrarRecetas();
}

// Guarda o quita una receta de favoritas (y lo guarda en localStorage)

function alternarFavorita(id) {
    const estabaGuardada = favoritos.includes(id);

    const nuevasFavoritas = favoritos.filter(
        (favorita) => favorita !== id
    );

    if (!estabaGuardada) {
        nuevasFavoritas.push(id);
    }

    try {
        guardarLocal(CLAVE_FAVORITOS, nuevasFavoritas);
    } catch (error) {
        mostrarMensaje('No se pudo guardar el cambio.', 'error');
        return;
    }

    favoritos = nuevasFavoritas;

    if (estabaGuardada) {
        mostrarMensaje('Receta quitada de tus favoritas.', 'aviso');
    } else {
        mostrarMensaje('Receta guardada en tus favoritas.', 'exito');
    }

    mostrarRecetas();
}


function limpiarFiltros() {
    buscador.value = '';
    filtroCategoria.value = 'todas';
    filtroTiempo.value = '0';
    filtroPrecio.value = '0';
    soloFavoritas.checked = false;
    mostrarRecetas();
    mostrarMensaje('Filtros limpiados.', 'aviso');
}

// Eventos: la lista cambia mientras el usuario escribe o elige
buscador.addEventListener('input', mostrarRecetas);
filtroCategoria.addEventListener('change', mostrarRecetas);
filtroTiempo.addEventListener('change', mostrarRecetas);
filtroPrecio.addEventListener('change', mostrarRecetas);
soloFavoritas.addEventListener('change', mostrarRecetas);
botonLimpiar.addEventListener('click', limpiarFiltros);

iniciar();