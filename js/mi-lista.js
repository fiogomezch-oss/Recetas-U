// ===== PÁGINA MI LISTA: RECETAS PERSONALES Y FAVORITAS =====

// Seleccionamos los elementos HTML que vamos a utilizar.
const formulario = document.querySelector('#formulario-receta');
const camposFormulario = formulario.querySelectorAll('input, select, textarea');
const botonLimpiarFormulario = document.querySelector('#limpiar-formulario');
const listaPersonales = document.querySelector('#lista-personales');
const listaFavoritas = document.querySelector('#lista-favoritas');
const contadorPersonales = document.querySelector('#contador-personales');
const contadorFavoritas = document.querySelector('#contador-favoritas');

// Recuperamos los datos guardados cuando se abre la página.
let recetasPersonales = leerLocal(CLAVE_PERSONALES);
let favoritosGuardados = leerLocal(CLAVE_FAVORITOS);
let recetasDelCatalogo = [];

// ===== VALIDACIÓN DEL FORMULARIO =====

// Devuelve un mensaje si el valor es incorrecto, o '' si está bien.
function obtenerError(campo) {
    const valor = campo.value.trim();

    if (valor === '') {
        return 'Este campo es obligatorio.';
    }

    if (campo.id === 'tiempo-receta') {
        const tiempo = Number(valor);
        if (!Number.isInteger(tiempo) || tiempo <= 0) {
            return 'El tiempo debe ser un número entero mayor que 0.';
        }
    }

    if (campo.id === 'precio-receta') {
        const precio = Number(valor);
        if (!Number.isInteger(precio) || precio < 0) {
            return 'El precio debe ser un número entero de 0 o más.';
        }
    }

    return '';
}

// Muestra u oculta el error del campo que estamos revisando.
function validarCampo(campo) {
    const error = document.querySelector('#error-' + campo.id);
    const mensaje = obtenerError(campo);

    error.textContent = mensaje;
    campo.classList.toggle('campo-invalido', mensaje !== '');
    campo.setAttribute('aria-invalid', mensaje !== '');
    return mensaje === '';
}

// Al guardar, revisamos todos los campos y no solamente el último.
function validarFormulario() {
    let esValido = true;

    for (const campo of camposFormulario) {
        if (!validarCampo(campo)) {
            esValido = false;
        }
    }

    return esValido;
}

// Quita los errores cuando se guarda correctamente o se limpia el formulario.
function limpiarErrores() {
    for (const campo of camposFormulario) {
        document.querySelector('#error-' + campo.id).textContent = '';
        campo.classList.remove('campo-invalido');
        campo.removeAttribute('aria-invalid');
    }
}

// Convierte un texto de varias líneas en un arreglo.
function convertirEnLista(texto) {
    return texto.split('\n').map((linea) => linea.trim()).filter((linea) => linea !== '');
}

// Creamos un identificador diferente para cada receta personal.
function obtenerNuevoId() {
    let nuevoId = 1;

    for (const receta of recetasPersonales) {
        if (receta.id >= nuevoId) {
            nuevoId = receta.id + 1;
        }
    }

    return nuevoId;
}

// ===== GUARDAR RECETAS PERSONALES =====

function guardarReceta(evento) {
    evento.preventDefault(); // Evita que el formulario recargue la página.

    if (!validarFormulario()) {
        mostrarMensaje('Revisa los campos marcados en rojo.', 'error');
        return;
    }

    // Objeto con la misma información que se pidió en el Avance 1.
    const nuevaReceta = {
        id: obtenerNuevoId(),
        nombre: document.querySelector('#nombre-receta').value.trim(),
        categoria: document.querySelector('#categoria-receta').value,
        tiempo: Number(document.querySelector('#tiempo-receta').value),
        precio: Number(document.querySelector('#precio-receta').value),
        ingredientes: convertirEnLista(document.querySelector('#ingredientes-receta').value),
        pasos: convertirEnLista(document.querySelector('#preparacion-receta').value)
    };

    recetasPersonales.push(nuevaReceta);

    try {
        guardarLocal(CLAVE_PERSONALES, recetasPersonales);
    } catch (error) {
        recetasPersonales.pop();
        mostrarMensaje('No se pudo guardar la receta en este navegador.', 'error');
        return;
    }

    mostrarPersonales();
    formulario.reset();
    limpiarErrores();
    mostrarMensaje('¡Tu receta se guardó correctamente!', 'exito');
}

// ===== MOSTRAR Y ELIMINAR RECETAS PERSONALES =====

function mostrarPersonales() {
    listaPersonales.textContent = '';
    contadorPersonales.textContent = 'Recetas creadas: ' + recetasPersonales.length;

    if (recetasPersonales.length === 0) {
        listaPersonales.appendChild(crearElemento('p', 'estado-vacio', 'Todavía no tienes recetas creadas. Usa el formulario para agregar la primera.'));
        return;
    }

    for (const receta of recetasPersonales) {
        // Creamos una tarjeta parecida a las del catálogo, pero sin imagen.
        const tarjeta = crearElemento('article', 'tarjeta-receta tarjeta-personal');
        const cuerpo = crearElemento('div', 'tarjeta-cuerpo');

        cuerpo.appendChild(crearElemento('span', 'etiqueta etiqueta-' + normalizar(receta.categoria), receta.categoria));
        cuerpo.appendChild(crearElemento('h3', '', receta.nombre));

        const datos = crearElemento('p', 'datos');
        datos.appendChild(crearElemento('span', '', 'Tiempo: ' + receta.tiempo + ' min'));
        datos.appendChild(crearElemento('span', '', 'Precio: ' + formatearPrecio(receta.precio)));
        cuerpo.appendChild(datos);

        const acciones = crearElemento('div', 'tarjeta-acciones');
        const botonEliminar = crearElemento('button', 'boton boton-secundario boton-pequeno', 'Eliminar');
        botonEliminar.type = 'button';
        botonEliminar.addEventListener('click', () => eliminarPersonal(receta.id));

        acciones.appendChild(botonEliminar);
        tarjeta.appendChild(cuerpo);
        tarjeta.appendChild(crearDetalle(receta));
        tarjeta.appendChild(acciones);
        listaPersonales.appendChild(tarjeta);
    }
}

function eliminarPersonal(id) {
    const nuevasRecetas = recetasPersonales.filter((receta) => receta.id !== id);

    try {
        guardarLocal(CLAVE_PERSONALES, nuevasRecetas);
    } catch (error) {
        mostrarMensaje('No se pudo eliminar la receta del navegador.', 'error');
        return;
    }

    recetasPersonales = nuevasRecetas;
    mostrarPersonales();
    mostrarMensaje('Receta eliminada de tu lista.', 'aviso');
}

// ===== MOSTRAR Y QUITAR FAVORITAS DEL CATÁLOGO =====

async function cargarFavoritas() {
    try {
        recetasDelCatalogo = await cargarRecetasJSON();
        mostrarFavoritas();
    } catch (error) {
        contadorFavoritas.textContent = '';
        listaFavoritas.appendChild(crearElemento('p', 'estado-vacio', 'No se pudieron cargar las favoritas. Abre el sitio con Live Server o desde GitHub Pages.'));
    }
}

function mostrarFavoritas() {
    favoritosGuardados = leerLocal(CLAVE_FAVORITOS);
    listaFavoritas.textContent = '';

    const recetasFavoritas = recetasDelCatalogo.filter((receta) => favoritosGuardados.includes(receta.id));
    contadorFavoritas.textContent = 'Recetas favoritas: ' + recetasFavoritas.length;

    if (recetasFavoritas.length === 0) {
        listaFavoritas.appendChild(crearElemento('p', 'estado-vacio', 'Todavía no guardaste favoritas. Visita el Catálogo y presiona Guardar en una receta.'));
        return;
    }

    for (const receta of recetasFavoritas) {
        const tarjeta = crearTarjeta(receta);
        const detalle = crearDetalle(receta);
        detalle.classList.add('oculto');

        const acciones = crearElemento('div', 'tarjeta-acciones');
        const botonVer = crearElemento('button', 'boton boton-secundario boton-pequeno', 'Ver receta');
        botonVer.type = 'button';
        botonVer.setAttribute('aria-expanded', 'false');
        botonVer.addEventListener('click', () => {
            const estaOculto = detalle.classList.toggle('oculto');
            botonVer.textContent = estaOculto ? 'Ver receta' : 'Ocultar receta';
            botonVer.setAttribute('aria-expanded', String(!estaOculto));
        });

        const botonQuitar = crearElemento('button', 'boton boton-pequeno', 'Quitar favorita');
        botonQuitar.type = 'button';
        botonQuitar.addEventListener('click', () => quitarFavorita(receta.id));

        acciones.appendChild(botonVer);
        acciones.appendChild(botonQuitar);
        tarjeta.appendChild(detalle);
        tarjeta.appendChild(acciones);
        listaFavoritas.appendChild(tarjeta);
    }
}

function quitarFavorita(id) {
    const nuevasFavoritas = favoritosGuardados.filter((favorito) => favorito !== id);

    try {
        guardarLocal(CLAVE_FAVORITOS, nuevasFavoritas);
    } catch (error) {
        mostrarMensaje('No se pudo quitar la favorita del navegador.', 'error');
        return;
    }

    favoritosGuardados = nuevasFavoritas;
    mostrarFavoritas();
    mostrarMensaje('Receta quitada de tus favoritas.', 'aviso');
}

// ===== EVENTOS E INICIO =====

// input y change permiten validar mientras se escriben o eligen datos.
for (const campo of camposFormulario) {
    campo.addEventListener('input', () => validarCampo(campo));
    campo.addEventListener('change', () => validarCampo(campo));
}

formulario.addEventListener('submit', guardarReceta);

botonLimpiarFormulario.addEventListener('click', () => {
    formulario.reset();
    limpiarErrores();
    mostrarMensaje('Formulario limpiado.', 'aviso');
});

mostrarPersonales();
cargarFavoritas();
