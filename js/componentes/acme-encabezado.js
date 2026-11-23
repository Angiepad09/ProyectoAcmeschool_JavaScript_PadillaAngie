
class AcmeEncabezado extends HTMLElement {
    connectedCallback() {
        this.pintar();
        this.addEventListener("click", this.alHacerClic);
        document.addEventListener("app:sesion", () => this.pintar());
        document.addEventListener("app:vista-cambiada", this.marcarActivo);
    }

    pintar() {
        const usuario = obtenerUsuarioActual();

        this.innerHTML = `
      <header class="barra">
        <div class="barra__contenido contenedor">
          <button type="button" class="marca" data-vista="catalogo">
            <span class="marca__logo">A</span>
            <span>Acme<strong>School</strong></span>
          </button>
          <button type="button" class="barra__menu" data-accion="menu" aria-expanded="false" aria-label="Abrir menú">☰</button>
          <nav class="barra__nav" aria-label="Navegación principal">
            <button type="button" class="barra__enlace" data-vista="catalogo">Presentar examen</button>
            <div class="barra__privado"></div>
            <div class="barra__usuario"></div>
          </nav>
        </div>
      </header>`;

        const privado = this.querySelector(".barra__privado");
        const zonaUsuario = this.querySelector(".barra__usuario");

        if (usuario === null) {
            zonaUsuario.innerHTML = `<button type="button" class="boton boton--pequeno" data-vista="login">Ingresar</button>`;
        } else {
            privado.innerHTML = `
        <button type="button" class="barra__enlace" data-vista="examenes">Gestión de exámenes</button>
        <button type="button" class="barra__enlace" data-vista="usuarios">Usuarios</button>`;

            zonaUsuario.append(crearElemento("span", ["barra__nombre"], usuario.nombre));
            zonaUsuario.insertAdjacentHTML(
                "beforeend",
                `<button type="button" class="boton boton--secundario boton--pequeno" data-accion="salir">Salir</button>`
            );
        }
        this.marcarActivo();
    }

    alHacerClic = (e) => {
        const vista = e.target.getAttribute("data-vista");
        const accion = e.target.getAttribute("data-accion");

        if (vista !== null) {
            navegar(vista);
        }
        if (accion === "salir") {
            cerrarSesion();
            avisar("Sesión cerrada. ¡Hasta pronto!", "info");
            navegar("login");
        }
        if (accion === "menu") {
            const nav = this.querySelector(".barra__nav");
            const abierto = nav.classList.toggle("barra__nav--abierta");
            e.target.setAttribute("aria-expanded", abierto);
        }
    };


    marcarActivo = () => {
        const vistaActual = sessionStorage.getItem("acme_vista");
        this.querySelectorAll(".barra__enlace").forEach((enlace) => {
            const vistaDelEnlace = enlace.getAttribute("data-vista");
            const activo = vistaDelEnlace === vistaActual || (vistaDelEnlace === "catalogo" && vistaActual === "presentar");
            enlace.classList.toggle("barra__enlace--activo", activo);
        });
        const nav = this.querySelector(".barra__nav");
        if (nav !== null) {
            nav.classList.remove("barra__nav--abierta");
        }
    };
}

customElements.define("acme-encabezado", AcmeEncabezado);
