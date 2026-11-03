// ===== FUNCIONES COMPARTIDAS POR LAS PÁGINAS =====

// Lee el archivo JSON y devuelve el arreglo de recetas
async function cargarRecetasJSON() {
    const respuesta = await fetch('data/recetas.json');
    if (!respuesta.ok) {
        throw new Error('No se pudo cargar el archivo JSON');
    }
    return await respuesta.json();
}

// Crea un elemento HTML con clase y texto
// Se usa textContent (y no innerHTML) para que el texto nunca se interprete como HTML
function crearElemento(etiqueta, clase, texto) {
    const elemento = document.createElement(etiqueta);
    if (clase) {
        elemento.className = clase;
    }
    if (texto !== undefined) {
        elemento.textContent = texto;
    }
    return elemento;
}

// Quita tildes y pasa a minúsculas: "Económica" -> "economica"
function normalizar(texto) {
    return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// 1500 -> "₡1.500"
function formatearPrecio(numero) {
    return '₡' + Math.round(numero).toLocaleString('es-CR');
}

// Tarjeta de una receta: imagen, categoría, nombre y datos
function crearTarjeta(receta) {
    const tarjeta = crearElemento('article', 'tarjeta-receta');

    const imagen = crearElemento('img', 'tarjeta-imagen');
    imagen.src = receta.imagen;
    imagen.alt = receta.nombre;

    const cuerpo = crearElemento('div', 'tarjeta-cuerpo');
    cuerpo.appendChild(crearElemento('span', 'etiqueta etiqueta-' + normalizar(receta.categoria), receta.categoria));
    cuerpo.appendChild(crearElemento('h3', '', receta.nombre));

    const datos = crearElemento('p', 'datos');
    datos.appendChild(crearElemento('span', '', 'Tiempo: ' + receta.tiempo + ' min'));
    datos.appendChild(crearElemento('span', '', 'Precio: ' + formatearPrecio(receta.precio)));
    datos.appendChild(crearElemento('span', '', 'Dificultad: ' + receta.estado));
    cuerpo.appendChild(datos);

    tarjeta.appendChild(imagen); 
    tarjeta.appendChild(cuerpo);
    return tarjeta;
}


// ===== localStorage =====

const CLAVE_FAVORITOS = 'favoritos';
const CLAVE_PERSONALES = 'recetas-personales';

// Lee un arreglo guardado en localStorage (si no hay nada, devuelve [])
function leerLocal(clave) {
    try {
        const texto = localStorage.getItem(clave);
        if (texto === null) {
            return [];
        }
        const datos = JSON.parse(texto);
        return Array.isArray(datos) ? datos : [];
    } catch (error) {
        return [];
    }
}

// Guarda un arreglo en localStorage (hay que convertirlo a texto)
function guardarLocal(clave, datos) {
    localStorage.setItem(clave, JSON.stringify(datos));
}

// ===== MENSAJES =====

// Mensaje flotante. Tipo: 'exito', 'error' o 'aviso'. Desaparece solo.
let temporizadorMensaje;

function mostrarMensaje(texto, tipo) {
    const caja = document.querySelector('#mensaje');
    caja.textContent = texto;
    caja.className = 'mensaje ' + tipo;
    clearTimeout(temporizadorMensaje);
    temporizadorMensaje = setTimeout(() => {
        caja.className = 'mensaje oculto';
    }, 3500);
}

// ===== DETALLE DE UNA RECETA =====

// Bloque con ingredientes y pasos de preparación
function crearDetalle(receta) {
    const detalle = crearElemento('div', 'detalle');

    detalle.appendChild(crearElemento('h4', '', 'Ingredientes'));
    const listaIngredientes = crearElemento('ul');
    for (const ingrediente of receta.ingredientes) {
        listaIngredientes.appendChild(crearElemento('li', '', ingrediente));
    }
    detalle.appendChild(listaIngredientes);

    detalle.appendChild(crearElemento('h4', '', 'Preparación'));
    const listaPasos = crearElemento('ol');
    for (const paso of receta.pasos) {
        listaPasos.appendChild(crearElemento('li', '', paso));
    }
    detalle.appendChild(listaPasos);

    return detalle;
}