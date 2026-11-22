function crearElemento(etiqueta, clases, texto) {
  const elemento = document.createElement(etiqueta);
  if (clases !== undefined) {
    elemento.classList.add(...clases);
  }
  if (texto !== undefined) {
    elemento.textContent = texto;
  }
  return elemento;
}

function crearBotonAccion(texto, accion, id, clases) {
  const boton = crearElemento("button", clases, texto);
  boton.setAttribute("type", "button");
  boton.setAttribute("data-accion", accion);
  boton.setAttribute("data-id", id);
  return boton;
}

function campoHTML(id, etiqueta, tipo) {
  return `
    <div class="campo">
      <label for="${id}">${etiqueta}</label>
      <input id="${id}" type="${tipo}" autocomplete="off" />
      <small class="campo__error"></small>
    </div>`;
}

function limpiarErrores(formulario) {
  formulario.querySelectorAll(".campo").forEach((campo) => {
    campo.classList.remove("campo--error");
    campo.querySelector(".campo__error").textContent = "";
  });
}

function marcarError(idInput, mensaje) {
  const campo = document.getElementById(idInput).parentElement;
  campo.classList.add("campo--error");
  campo.querySelector(".campo__error").textContent = mensaje;
}

function soloDigitos(texto) {
  if (texto.length === 0) {
    return false;
  }
  return [...texto].every((caracter) => "0123456789".includes(caracter));
}

function esCorreoValido(correo) {
  const posicionArroba = correo.indexOf("@");
  const dominio = correo.slice(posicionArroba + 1);
  return posicionArroba > 0 && dominio.includes(".") && !correo.includes(" ");
}

function formatearTiempo(segundosTotales) {
  const minutos = Math.floor(segundosTotales / 60);
  const segundos = segundosTotales % 60;
  const dosDigitos = (numero) => (numero < 10 ? "0" + numero : "" + numero);
  return dosDigitos(minutos) + ":" + dosDigitos(segundos);
}

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function avisar(texto, tipo) {
  document.querySelector("acme-aviso").mostrar(texto, tipo);
}

function abrirModal(opciones) {
  return document.querySelector("acme-modal").abrir(opciones);
}

function navegar(vista) {
  document.dispatchEvent(new CustomEvent("app:navegar", { detail: { vista: vista } }));
}
