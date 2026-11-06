const URL_API = "https://rickandmortyapi.com/api/episode";
const CLAVE_ALMACENAMIENTO = "ultimaBusquedaEpisodios";
const TEXTO_DESCONOCIDO = "Desconocido";

const formulario = document.querySelector("#formulario-busqueda");
const campoNombre = document.querySelector("#nombre");
const campoTemporada = document.querySelector("#temporada");
const botonBuscar = document.querySelector("#boton-buscar");
const mensaje = document.querySelector("#mensaje");
const contenedorResultados = document.querySelector("#resultados");

// Los valores vacíos o "unknown" se muestran como «Desconocido».
const formatearDato = (valor) => {
  const vacio = valor === undefined || valor === null || valor === "" || valor === "unknown";
  return vacio ? TEXTO_DESCONOCIDO : String(valor);
};

// Arma la URL con new URL() y searchParams (nombre y temporada en la misma petición).
const construirUrl = (nombre, temporada) => {
  const url = new URL(URL_API);
  if (nombre) url.searchParams.set("name", nombre);
  if (temporada) url.searchParams.set("episode", temporada);
  return url;
};

// Pide los episodios a la API. Un 404 significa "sin resultados", no es un error.
const pedirEpisodios = async (nombre, temporada) => {
  const respuesta = await fetch(construirUrl(nombre, temporada));
  if (respuesta.status === 404) return { info: { count: 0 }, results: [] };
  if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}`);
  return await respuesta.json();
};

const crearElemento = (etiqueta, texto, clase) => {
  const elemento = document.createElement(etiqueta);
  elemento.textContent = texto;
  if (clase) elemento.className = clase;
  return elemento;
};

const crearDato = (etiqueta, valor) => {
  const fila = document.createElement("div");
  fila.className = "tarjeta__dato";
  fila.append(crearElemento("dt", etiqueta), crearElemento("dd", formatearDato(valor)));
  return fila;
};

const crearTarjeta = (episodio) => {
  const tarjeta = document.createElement("article");
  tarjeta.className = "tarjeta";

  const datos = document.createElement("dl");
  datos.append(
    crearDato("Emisión", episodio.air_date),
    crearDato("Personajes", episodio.characters?.length)
  );

  tarjeta.append(
    crearElemento("p", formatearDato(episodio.episode), "tarjeta__codigo"),
    crearElemento("h2", formatearDato(episodio.name), "tarjeta__titulo"),
    datos
  );
  return tarjeta;
};

const mostrarTarjetas = (episodios) => {
  contenedorResultados.replaceChildren(...episodios.map(crearTarjeta));
};

const limpiarTarjetas = () => contenedorResultados.replaceChildren();

const mostrarMensaje = (texto, tipo = "info") => {
  mensaje.textContent = texto;
  mensaje.dataset.tipo = tipo;
};

const cambiarEstadoCarga = (buscando) => {
  botonBuscar.disabled = buscando;
  botonBuscar.textContent = buscando ? "Buscando…" : "Buscar";
};

const buscar = async (nombre, temporada) => {
  limpiarTarjetas();
  cambiarEstadoCarga(true);
  mostrarMensaje("Buscando…");

  try {
    const { info, results } = await pedirEpisodios(nombre, temporada);

    if (results.length === 0) {
      mostrarMensaje("Sin resultados. Prueba con otro nombre u otra temporada.", "aviso");
      return;
    }

    mostrarTarjetas(results);
    mostrarMensaje(`${info.count} episodio(s) encontrado(s). Se muestran ${results.length}.`);
  } catch (error) {
    mostrarMensaje("No se pudo conectar con la API. Revisa tu conexión e inténtalo de nuevo.", "error");
  } finally {
    cambiarEstadoCarga(false);
  }
};

// Persistencia con localStorage
const guardarBusqueda = (busqueda) => {
  try {
    localStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify(busqueda));
  } catch (error) {
    // Si el almacenamiento no está disponible, la página sigue funcionando.
  }
};

const leerBusquedaGuardada = () => {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_ALMACENAMIENTO));
  } catch (error) {
    return null;
  }
};

const restaurarBusqueda = () => {
  const guardada = leerBusquedaGuardada();
  if (!guardada) return;

  campoNombre.value = guardada.nombre ?? "";
  campoTemporada.value = guardada.temporada ?? "";

  if (campoNombre.value || campoTemporada.value) {
    buscar(campoNombre.value, campoTemporada.value);
  }
};

const manejarEnvio = (evento) => {
  evento.preventDefault();
  const nombre = campoNombre.value.trim();
  const temporada = campoTemporada.value;

  if (!nombre && !temporada) {
    limpiarTarjetas();
    mostrarMensaje("Escribe un nombre o elige una temporada para buscar.", "aviso");
    return;
  }

  guardarBusqueda({ nombre, temporada });
  buscar(nombre, temporada);
};

const iniciar = () => {
  formulario.addEventListener("submit", manejarEnvio);
  restaurarBusqueda();
};

iniciar();
