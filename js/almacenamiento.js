const CLAVES = {
  usuarios: "acme_usuarios",
  examenes: "acme_examenes",
  resultados: "acme_resultados",
  contador: "acme_contador",
  intento: "acme_intento_activo",
  sesion: "acme_sesion",
};

function leerLista(clave) {
  const texto = localStorage.getItem(clave);
  if (texto === null) {
    return [];
  }
  return JSON.parse(texto);
}

function guardarLista(clave, lista) {
  localStorage.setItem(clave, JSON.stringify(lista));
}

function generarId(prefijo) {
  const actual = Number(localStorage.getItem(CLAVES.contador)); // Number(null) es 0
  const siguiente = actual + 1;
  localStorage.setItem(CLAVES.contador, siguiente);
  return prefijo + "-" + siguiente;
}

function iniciarSesion(usuario) {
  sessionStorage.setItem(CLAVES.sesion, JSON.stringify({ usuarioId: usuario.id }));
  document.dispatchEvent(new CustomEvent("app:sesion"));
}

function cerrarSesion() {
  sessionStorage.removeItem(CLAVES.sesion);
  document.dispatchEvent(new CustomEvent("app:sesion"));
}

function obtenerUsuarioActual() {
  const texto = sessionStorage.getItem(CLAVES.sesion);
  if (texto === null) {
    return null;
  }
  const { usuarioId } = JSON.parse(texto);
  const usuario = leerLista(CLAVES.usuarios).find((u) => u.id === usuarioId);
  return usuario === undefined ? null : usuario;
}

function leerIntento() {
  const texto = localStorage.getItem(CLAVES.intento);
  return texto === null ? null : JSON.parse(texto);
}

function guardarIntento(intento) {
  localStorage.setItem(CLAVES.intento, JSON.stringify(intento));
}

function borrarIntento() {
  localStorage.removeItem(CLAVES.intento);
}

async function cargarDatosIniciales() {
  if (localStorage.getItem(CLAVES.usuarios) !== null) {
    return;
  }
  try {
    const respuesta = await fetch("data/semilla.json");
    if (!respuesta.ok) {
      throw new Error("HTTP " + respuesta.status);
    }
    const { usuarios, examenes } = await respuesta.json();

    const usuariosConId = usuarios.map((usuario) => ({ ...usuario, id: generarId("u") }));
    const examenesConId = examenes.map((examen) => ({
      ...examen,
      id: generarId("ex"),
      preguntas: examen.preguntas.map((pregunta) => ({
        ...pregunta,
        id: generarId("p"),
        respuestas: pregunta.respuestas.map((respuesta) => ({ ...respuesta, id: generarId("r") })),
      })),
    }));

    guardarLista(CLAVES.usuarios, usuariosConId);
    guardarLista(CLAVES.examenes, examenesConId);
    
  } catch (error) {
    console.error("No se pudieron cargar los datos iniciales:", error.message);
    guardarLista(CLAVES.usuarios, []);
    guardarLista(CLAVES.examenes, []);
  }
}
