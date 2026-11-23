const VISTAS = {
    catalogo: "vista-catalogo",
    presentar: "vista-presentar",
    login: "vista-login",
    usuarios: "vista-usuarios",
    examenes: "vista-examenes",
};

const VISTAS_PRIVADAS = ["usuarios", "examenes"];

class AcmeApp extends HTMLElement {
    connectedCallback() {
        document.addEventListener("app:navegar", this.alNavegar);
        document.addEventListener("app:sesion", this.alCambiarSesion);

        const guardada = sessionStorage.getItem("acme_vista");
        this.mostrar(guardada !== null ? guardada : "catalogo");
    }

    alNavegar = (e) => {
        this.mostrar(e.detail.vista);
    };

    alCambiarSesion = () => {
        const actual = sessionStorage.getItem("acme_vista");
        if (VISTAS_PRIVADAS.indexOf(actual) !== -1 && obtenerUsuarioActual() === null) {
            this.mostrar("login");
        }
    };

    mostrar(vistaPedida) {
        let vista = vistaPedida;

        if (VISTAS[vista] === undefined) {
            vista = "catalogo";
        }
        if (VISTAS_PRIVADAS.indexOf(vista) !== -1 && obtenerUsuarioActual() === null) {
            avisar("Inicia sesión para entrar a este módulo.", "info");
            vista = "login";
        }
        if (vista === "login" && obtenerUsuarioActual() !== null) {
            vista = "examenes";
        }

        const elemento = document.createElement(VISTAS[vista]);
        this.replaceChildren(elemento);
        elemento.animate(
            [
                { opacity: 0, transform: "translateY(10px)" },
                { opacity: 1, transform: "translateY(0)" },
            ],
            { duration: 350, easing: "ease-out" }
        );

        sessionStorage.setItem("acme_vista", vista);
        document.dispatchEvent(new CustomEvent("app:vista-cambiada", { detail: { vista: vista } }));
    }
}

customElements.define("acme-app", AcmeApp);
