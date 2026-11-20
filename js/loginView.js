import { login } from "../auth.js";

export function renderLogin() {

    const app = document.querySelector("#app");

    app.innerHTML = `
    
        <div class="login-container">

            <h1>Acme School</h1>

            <form id="loginForm">

                <input
                    id="email"
                    type="email"
                    placeholder="Correo"
                    required
                >

                <input
                    id="password"
                    type="password"
                    placeholder="Contraseña"
                    required
                >

                <button>
                    Ingresar
                </button>

            </form>

        </div>

    `;

    document
        .querySelector("#loginForm")
        .addEventListener("submit", handleLogin);
}