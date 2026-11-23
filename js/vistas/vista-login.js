async function verificarCredenciales(email, password) {
    await esperar(500);
    const usuario = leerLista(CLAVES.usuarios).find(
        (u) => u.email === email.toLowerCase() && u.password === password
    );
    if (usuario === undefined) {
        throw new Error("Correo o contraseña incorrectos.");
    }
    return usuario;
}

class VistaLogin extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
      <section class="login">
        <div class="tarjeta login__tarjeta">
          <span class="marca__logo marca__logo--grande">A</span>
          <h1>Bienvenido de nuevo</h1>
          <p class="texto-suave">Ingresa para administrar usuarios y exámenes.</p>

          <form id="form-login" class="formulario" novalidate>
            ${campoHTML("login-email", "Correo electrónico", "email")}
            ${campoHTML("login-password", "Contraseña", "password")}
            <p class="mensaje-error oculto" id="login-mensaje" role="alert"></p>
            <button type="submit" class="boton boton--ancho" id="login-boton">Ingresar</button>
          </form>

          <p class="login__ayuda">Cuenta de prueba: <code>admin@acme.edu</code> / <code>Admin123</code></p>
        </div>

        <aside class="login__lateral">
          <h2>¿Vas a presentar un examen?</h2>
          <p>No necesitas cuenta. Elige el examen, escribe tu identificación y comienza.</p>
          <button type="button" class="boton boton--claro" id="login-ir-catalogo">Ver exámenes disponibles</button>
        </aside>
      </section>`;

        this.formulario = this.querySelector("#form-login");
        this.formulario.addEventListener("submit", this.alEnviar);
        this.querySelector("#login-ir-catalogo").addEventListener("click", () => navegar("catalogo"));
    }

    alEnviar = async (e) => {
        e.preventDefault(); 
        limpiarErrores(this.formulario);

        const email = document.getElementById("login-email").value.trim();
        const password = document.getElementById("login-password").value;
        const mensaje = this.querySelector("#login-mensaje");
        mensaje.classList.add("oculto");

        let hayErrores = false;
        if (!esCorreoValido(email)) {
            marcarError("login-email", "Escribe un correo válido.");
            hayErrores = true;
        }
        if (password === "") {
            marcarError("login-password", "Escribe tu contraseña.");
            hayErrores = true;
        }
        if (hayErrores) {
            return;
        }

        const boton = this.querySelector("#login-boton");
        boton.disabled = true;
        boton.textContent = "Verificando…";

        try {
            const usuario = await verificarCredenciales(email, password);
            iniciarSesion(usuario);
            avisar(`¡Hola, ${usuario.nombre}!`, "exito");
            navegar("examenes");
        } catch (error) {
            mensaje.textContent = error.message;
            mensaje.classList.remove("oculto");
            this.querySelector(".login__tarjeta").animate(
                [
                    { transform: "translateX(0)" },
                    { transform: "translateX(-8px)" },
                    { transform: "translateX(8px)" },
                    { transform: "translateX(0)" },
                ],300
            );
            boton.disabled = false;
            boton.textContent = "Ingresar";
        }
    };
}

customElements.define("vista-login", VistaLogin);
