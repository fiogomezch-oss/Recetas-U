// ===== PÁGINA DE INICIO =====

const contenedorDestacadas = document.querySelector('#destacadas');
const botonesFiltro = document.querySelectorAll('.chip');

let recetasDestacadas = [];
let categoriaActiva = 'todas';

// Carga el JSON y se queda solo con las recetas destacadas
async function iniciar() {
    try {
        const recetas = await cargarRecetasJSON();
        recetasDestacadas = recetas.filter((receta) => receta.destacada);
        mostrarDestacadas();
    } catch (error) {
        contenedorDestacadas.textContent = '';
        contenedorDestacadas.appendChild(crearElemento('p', 'estado-vacio', 'No se pudieron cargar las recetas.'));
    }
}

// Dibuja las tarjetas según la categoría seleccionada
function mostrarDestacadas() {
    contenedorDestacadas.textContent = '';

    const visibles = recetasDestacadas.filter((receta) => {
        return categoriaActiva === 'todas' || receta.categoria === categoriaActiva;
    });

    if (visibles.length === 0) {
        contenedorDestacadas.appendChild(crearElemento('p', 'estado-vacio', 'No hay recetas destacadas en esta categoría.'));
        return;
    }

    for (const receta of visibles) {
        contenedorDestacadas.appendChild(crearTarjeta(receta));
    }
}

// Al hacer clic en un botón: cambia la categoría y vuelve a dibujar
function seleccionarCategoria(boton) {
    categoriaActiva = boton.dataset.categoria;

    for (const otro of botonesFiltro) {
        otro.classList.remove('activo');
    }
    boton.classList.add('activo');

    mostrarDestacadas();
}

for (const boton of botonesFiltro) {
    boton.addEventListener('click', () => seleccionarCategoria(boton));
}

iniciar();