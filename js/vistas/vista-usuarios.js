const CARGOS = ["Administrativo", "Docente"];

class VistaUsuarios extends HTMLElement {
    constructor() {
        super();
        this.idEditando = null; // null = creando; un id = editando
    }

    connectedCallback() {
        this.innerHTML = `
      <div class="encabezado-pagina">
        <p class="sobretitulo">Administración</p>
        <h1>Gestión de usuarios</h1>
        <p class="texto-suave">Crea, actualiza y elimina las cuentas con acceso a los módulos privados.</p>
      </div>

      <div class="dos-columnas">
        <section class="tarjeta" id="tarjeta-form-usuario">
          <h2 id="titulo-form-usuario">Nuevo usuario</h2>
          <form id="form-usuario" class="formulario" novalidate>
            ${campoHTML("u-identificacion", "Número de identificación", "text")}
            ${campoHTML("u-nombre", "Nombre completo", "text")}
            ${campoHTML("u-email", "Email", "email")}
            ${campoHTML("u-telefono", "Teléfono", "tel")}
            <div class="campo">
              <label for="u-cargo">Cargo</label>
              <select id="u-cargo">
                <option value="">Selecciona…</option>
                <option value="Administrativo">Administrativo</option>
                <option value="Docente">Docente</option>
              </select>
              <small class="campo__error"></small>
            </div>
            ${campoHTML("u-password", "Contraseña", "password")}
            <p class="texto-suave texto-pequeno oculto" id="ayuda-password">Déjala vacía para conservar la actual.</p>
            <div class="formulario__acciones">
              <button type="button" class="boton boton--secundario oculto" id="u-cancelar">Cancelar</button>
              <button type="submit" class="boton" id="u-guardar">Crear usuario</button>
            </div>
          </form>
        </section>

        <section class="tarjeta">
          <div class="tarjeta__barra">
            <h2>Usuarios registrados <span class="contador" id="contador-usuarios">0</span></h2>
            <input type="search" id="buscar-usuario" class="buscador" placeholder="Buscar por nombre o email…" aria-label="Buscar usuario" />
          </div>
          <div class="tabla-envoltura">
            <table class="tabla">
              <thead>
                <tr>
                  <th>Identificación</th><th>Nombre</th><th>Email</th><th>Teléfono</th><th>Cargo</th><th>Acciones</th>
                </tr>
              </thead>
              <tbody id="tabla-usuarios"></tbody>
            </table>
          </div>
        </section>
      </div>`;

        this.formulario = this.querySelector("#form-usuario");
        this.cuerpoTabla = this.querySelector("#tabla-usuarios");

        this.formulario.addEventListener("submit", this.guardar);
        this.cuerpoTabla.addEventListener("click", this.alHacerClicEnTabla);
        this.querySelector("#u-cancelar").addEventListener("click", () => this.limpiarFormulario());
        this.querySelector("#buscar-usuario").addEventListener("input", () => this.pintarTabla());

        this.pintarTabla();
    }
    // ---------- Tabla ----------
    pintarTabla() {
        const usuarios = leerLista(CLAVES.usuarios);
        const busqueda = this.querySelector("#buscar-usuario").value.trim().toLowerCase();
        const filtrados = usuarios.filter(
            (u) => u.nombre.toLowerCase().includes(busqueda) || u.email.includes(busqueda)
        );

        this.querySelector("#contador-usuarios").textContent = usuarios.length;
        this.cuerpoTabla.replaceChildren();

        if (filtrados.length === 0) {
            const fila = crearElemento("tr");
            const celda = crearElemento("td", ["tabla__vacia"], "No hay usuarios para mostrar.");
            celda.setAttribute("colspan", "6");
            fila.append(celda);
            this.cuerpoTabla.append(fila);
            return;
        }

        for (const usuario of filtrados) {
            const { id, identificacion, nombre, email, telefono, cargo } = usuario;
            const fila = crearElemento("tr");
            fila.setAttribute("data-id", id);
            fila.classList.toggle("fila--editando", id === this.idEditando);

            const datos = [
                ["Identificación", identificacion],
                ["Nombre", nombre],
                ["Email", email],
                ["Teléfono", telefono],
            ];
            datos.forEach(([titulo, valor]) => {
                const celda = crearElemento("td", undefined, valor);
                celda.setAttribute("data-titulo", titulo);
                fila.append(celda);
            });

            const celdaCargo = crearElemento("td");
            celdaCargo.setAttribute("data-titulo", "Cargo");
            const claseCargo = cargo === "Docente" ? "etiqueta--verde" : "etiqueta--azul";
            celdaCargo.append(crearElemento("span", ["etiqueta", claseCargo], cargo));
            fila.append(celdaCargo);

            const celdaAcciones = crearElemento("td", ["tabla__acciones"]);
            celdaAcciones.append(
                crearBotonAccion("Editar", "editar", id, ["boton", "boton--secundario", "boton--pequeno"]),
                crearBotonAccion("Eliminar", "eliminar", id, ["boton", "boton--peligro", "boton--pequeno"])
            );
            fila.append(celdaAcciones);

            this.cuerpoTabla.append(fila);
        }
    }
    alHacerClicEnTabla = (e) => {
        const accion = e.target.getAttribute("data-accion");
        const id = e.target.getAttribute("data-id");
        if (accion === "editar") {
            this.editar(id);
        }
        if (accion === "eliminar") {
            this.eliminar(id);
        }
    };

    // ---------- Formulario ----------
    editar(id) {
        const usuario = leerLista(CLAVES.usuarios).find((u) => u.id === id);
        if (usuario === undefined) {
            return;
        }
        this.idEditando = id;
        document.getElementById("u-identificacion").value = usuario.identificacion;
        document.getElementById("u-nombre").value = usuario.nombre;
        document.getElementById("u-email").value = usuario.email;
        document.getElementById("u-telefono").value = usuario.telefono;
        document.getElementById("u-cargo").value = usuario.cargo;
        document.getElementById("u-password").value = "";

        this.querySelector("#titulo-form-usuario").textContent = "Editar usuario";
        this.querySelector("#u-guardar").textContent = "Guardar cambios";
        this.querySelector("#u-cancelar").classList.remove("oculto");
        this.querySelector("#ayuda-password").classList.remove("oculto");
        this.querySelector("#tarjeta-form-usuario").classList.add("tarjeta--editando");
        limpiarErrores(this.formulario);
        this.pintarTabla();
        this.querySelector("#tarjeta-form-usuario").scrollIntoView({ behavior: "smooth" });
    }
    limpiarFormulario() {
        this.idEditando = null;
        ["u-identificacion", "u-nombre", "u-email", "u-telefono", "u-cargo", "u-password"].forEach((idInput) => {
            document.getElementById(idInput).value = "";
        });
        this.querySelector("#titulo-form-usuario").textContent = "Nuevo usuario";
        this.querySelector("#u-guardar").textContent = "Crear usuario";
        this.querySelector("#u-cancelar").classList.add("oculto");
        this.querySelector("#ayuda-password").classList.add("oculto");
        this.querySelector("#tarjeta-form-usuario").classList.remove("tarjeta--editando");
        limpiarErrores(this.formulario);
        this.pintarTabla();
    }

    guardar = (e) => {
        e.preventDefault();
        limpiarErrores(this.formulario);

        const datos = {
            identificacion: document.getElementById("u-identificacion").value.trim(),
            nombre: document.getElementById("u-nombre").value.trim(),
            email: document.getElementById("u-email").value.trim().toLowerCase(),
            telefono: document.getElementById("u-telefono").value.trim(),
            cargo: document.getElementById("u-cargo").value,
            password: document.getElementById("u-password").value,
        };
        const usuarios = leerLista(CLAVES.usuarios);
        // Los demás usuarios (sin el que se está editando), para revisar repetidos
        const otros = usuarios.filter((u) => u.id !== this.idEditando);
        let valido = true;

        if (!soloDigitos(datos.identificacion) || datos.identificacion.length < 5) {
            marcarError("u-identificacion", "Usa solo números (mínimo 5 dígitos).");
            valido = false;
        } else if (otros.find((u) => u.identificacion === datos.identificacion) !== undefined) {
            marcarError("u-identificacion", "Ya existe un usuario con esta identificación.");
            valido = false;
        }
        if (datos.nombre.length < 3) {
            marcarError("u-nombre", "Escribe el nombre completo.");
            valido = false;
        }
        if (!esCorreoValido(datos.email)) {
            marcarError("u-email", "Escribe un email válido.");
            valido = false;
        } else if (otros.find((u) => u.email === datos.email) !== undefined) {
            marcarError("u-email", "Este email ya está registrado.");
            valido = false;
        }
        if (!soloDigitos(datos.telefono) || datos.telefono.length < 7) {
            marcarError("u-telefono", "Usa solo números (mínimo 7 dígitos).");
            valido = false;
        }
        if (CARGOS.indexOf(datos.cargo) === -1) {
            marcarError("u-cargo", "Selecciona un cargo.");
            valido = false;
        }
        // Al crear, la contraseña es obligatoria. Al editar, solo si se escribe una nueva.
        const debeValidarPassword = this.idEditando === null || datos.password !== "";
        if (debeValidarPassword && datos.password.length < 6) {
            marcarError("u-password", "Mínimo 6 caracteres.");
            valido = false;
        }

        if (!valido) {
            return;
        }

        if (this.idEditando === null) {
            usuarios.push({ ...datos, id: generarId("u") });
            guardarLista(CLAVES.usuarios, usuarios);
            avisar("Usuario creado correctamente.", "exito");
        } else {
            const actualizados = usuarios.map((u) => {
                if (u.id !== this.idEditando) {
                    return u;
                }
                const password = datos.password === "" ? u.password : datos.password;
                return { ...u, ...datos, password: password };
            });
            guardarLista(CLAVES.usuarios, actualizados);
            avisar("Usuario actualizado.", "exito");
            // Si me edité a mí mismo, el encabezado debe mostrar el nombre nuevo
            const actual = obtenerUsuarioActual();
            if (actual !== null && actual.id === this.idEditando) {
                document.dispatchEvent(new CustomEvent("app:sesion"));
            }
        }
        this.limpiarFormulario();
    };

    async eliminar(id) {
        const actual = obtenerUsuarioActual();
        if (actual !== null && actual.id === id) {
            avisar("No puedes eliminar tu propia cuenta mientras tienes la sesión abierta.", "alerta");
            return;
        }
        const usuario = leerLista(CLAVES.usuarios).find((u) => u.id === id);
        const confirmado = await abrirModal({
            titulo: "Eliminar usuario",
            mensaje: `¿Seguro que deseas eliminar a ${usuario.nombre}? Esta acción no se puede deshacer.`,
            textoAceptar: "Eliminar",
            peligro: true,
        });
        if (confirmado === null) {
            return;
        }

        // Animación de salida de la fila antes de borrarla
        const fila = this.cuerpoTabla.querySelector(`[data-id="${id}"]`);
        await fila.animate([{ opacity: 1 }, { opacity: 0, transform: "translateX(30px)" }], 300).finished;

        const restantes = leerLista(CLAVES.usuarios).filter((u) => u.id !== id);
        guardarLista(CLAVES.usuarios, restantes);
        avisar("Usuario eliminado.", "info");
        if (this.idEditando === id) {
            this.limpiarFormulario();
        } else {
            this.pintarTabla();
        }

    }
}
customElements.define("vista-usuarios", VistaUsuarios);