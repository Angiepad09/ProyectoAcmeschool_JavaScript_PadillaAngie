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
}