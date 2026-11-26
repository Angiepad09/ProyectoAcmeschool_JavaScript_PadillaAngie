class AcmeModal extends HTMLElement {
  constructor() {
    super();
    this.resolver = null;
  }

  connectedCallback() {
    this.classList.add("modal", "oculto");
    this.addEventListener("click", (e) => {
      if (e.target === this) {
        this.cerrar(null);
      }
    });
  }

  abrir(opciones) {
    const { titulo, mensaje, textoAceptar, peligro, campos, validar } = opciones;

    this.innerHTML = `
      <div class="modal__caja" role="dialog" aria-modal="true" aria-labelledby="modal-titulo">
        <h2 id="modal-titulo"></h2>
        <p class="modal__mensaje"></p>
        <div class="modal__campos"></div>
        <p class="modal__error" role="alert"></p>
        <div class="modal__acciones">
          <button type="button" class="boton boton--secundario" id="modal-cancelar">Cancelar</button>
          <button type="button" class="boton" id="modal-aceptar"></button>
        </div>
      </div>`;

    this.querySelector("#modal-titulo").textContent = titulo;
    this.querySelector(".modal__mensaje").textContent = mensaje;
    const botonAceptar = this.querySelector("#modal-aceptar");
    botonAceptar.textContent = textoAceptar;
    botonAceptar.classList.toggle("boton--peligro", peligro === true);

    if (campos !== undefined) {
      const contenedor = this.querySelector(".modal__campos");
      campos.forEach((campo) => {
        contenedor.insertAdjacentHTML("beforeend", campoHTML(campo.id, campo.etiqueta, "text"));
        document.getElementById(campo.id).value = campo.valor !== undefined ? campo.valor : "";
      });
    }

    this.classList.remove("oculto");
    this.querySelector(".modal__caja").animate(
      [
        { opacity: 0, transform: "scale(0.95)" },
        { opacity: 1, transform: "scale(1)" },
      ],200
    );

    this.querySelector("input, #modal-aceptar").focus();
    return new Promise((resolve) => {
      this.resolver = resolve;
      this.querySelector("#modal-cancelar").addEventListener("click", () => this.cerrar(null));
      botonAceptar.addEventListener("click", () => this.aceptar(campos, validar));
      document.addEventListener("keydown", this.alPresionarTecla);
    });
  }

  alPresionarTecla = (e) => {
    if (e.key === "Escape") {
      this.cerrar(null);
    }
  };

  aceptar(campos, validar) {
    if (campos === undefined) {
      this.cerrar(true);
      return;
    }

    const valores = {};
    campos.forEach((campo) => {
      valores[campo.id] = document.getElementById(campo.id).value.trim();
    });
    if (validar !== undefined) {
      const error = validar(valores);
      if (error !== "") {
        this.querySelector(".modal__error").textContent = error;
        return;
      }
    }
    this.cerrar(valores);
  }

  cerrar(respuesta) {
    if (this.resolver === null) {
      return; // no hay modal abierto
    }
    document.removeEventListener("keydown", this.alPresionarTecla);
    this.classList.add("oculto");
    this.replaceChildren();
    const resolver = this.resolver;
    this.resolver = null;
    resolver(respuesta);
  }
}

customElements.define("acme-modal", AcmeModal);
