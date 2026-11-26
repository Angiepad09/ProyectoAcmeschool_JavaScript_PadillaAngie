class AcmeTemporizador extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.segundos = 0;
        this.total = 0;
        this.activo = false;
    }

    static get observedAttributes() {
        return ["segundos", "total"];
    }

    attributeChangedCallback(nombre, valorAnterior, valorNuevo) {
        if (nombre === "segundos") {
            this.segundos = Number(valorNuevo);
        }
        if (nombre === "total") {
            this.total = Number(valorNuevo);
        }
        this.pintar();
    }

    connectedCallback() {
        const plantilla = document.getElementById("tpl-temporizador");
        this.shadowRoot.appendChild(plantilla.content.cloneNode(true));
        this.fin = Date.now() + this.segundos * 1000;
        this.activo = true;
        this.pintar();
        this.siguienteSegundo();
    }

    // Al quitar el componente de la página se detiene la cuenta.
    disconnectedCallback() {
        this.activo = false;
    }

    siguienteSegundo() {
        setTimeout(() => {
            if (!this.activo) {
                return;
            }
            // Cambiar el atributo dispara attributeChangedCallback → pintar()
            const restantes = Math.max(0, Math.round((this.fin - Date.now()) / 1000));
            this.setAttribute("segundos", restantes);
            
            this.dispatchEvent(
                new CustomEvent("tiempo-tic", { detail: { segundos: this.segundos }, bubbles: true })
            );

            if (this.segundos <= 0) {
                this.activo = false;
                this.dispatchEvent(new CustomEvent("tiempo-agotado", { bubbles: true }));
                return;
            }
            this.siguienteSegundo();
        }, 1000);
    }

    pintar() {
        const tiempo = this.shadowRoot.getElementById("tiempo");
        if (tiempo === null) {
            return;
        }
        tiempo.textContent = formatearTiempo(this.segundos);

        const porcentaje = this.total > 0 ? (this.segundos / this.total) * 100 : 0;
        this.shadowRoot.getElementById("relleno").style.width = porcentaje + "%";

        // En el último minuto el reloj se pone rojo
        this.shadowRoot.querySelector(".reloj").classList.toggle("reloj--alerta", this.segundos <= 60);
    }
}

customElements.define("acme-temporizador", AcmeTemporizador);