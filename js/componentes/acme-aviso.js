class AcmeAviso extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({mode: "open"});
    shadow.innerHTML = `
      <style>
        .pila {
          position: fixed;
          right: 16px;
          bottom: 16px;
          display: grid;
          gap: 8px;
          z-index: 1000;
        }
        .aviso {
          max-width: 340px;
          padding: 12px 16px;
          border-radius: 12px;
          border-left: 6px solid #93c5fd;
          background: #1b1f3b;
          color: white;
          font: 500 15px system-ui, sans-serif;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
        }
        .aviso--exito { border-left-color: #4ade80; }
        .aviso--error { border-left-color: #f87171; }
        .aviso--alerta { border-left-color: #fbbf24; }
      </style>
      <div class="pila" role="status" aria-live="polite"></div>`;
  }

  // Muestra un aviso y lo quita solo después de 3 segundos.
  async mostrar(texto, tipo) {
    const pila = this.shadowRoot.querySelector(".pila");
    const aviso = document.createElement("div");
    aviso.classList.add("aviso", "aviso--" + tipo);
    aviso.textContent = texto;
    pila.append(aviso);

    aviso.animate(
      [
        { opacity: 0, transform: "translateY(12px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],250
    );

    await esperar(3000);
    await aviso.animate([{ opacity: 1 }, { opacity: 0 }], 300).finished;
    aviso.remove();
  }
}

customElements.define("acme-aviso", AcmeAviso);
