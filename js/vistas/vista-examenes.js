function nuevaPregunta() {
    return {
        id: generarId("p"),
        enunciado: "",
        respuestas: [
            { id: generarId("r"), descripcion: "", correcta: true },
            { id: generarId("r"), descripcion: "", correcta: false },
        ],
    };
}

const LETRAS = ["A", "B", "C", "D", "E", "F"];
const MAXIMO_RESPUESTAS = 6;

class VistaExamenes extends HTMLElement {
    constructor() {
        super();
        this.idEditando = null;
        this.preguntas = [];
    }

    connectedCallback() {
        this.innerHTML = `
      <div class="encabezado-pagina encabezado-pagina--con-boton">
        <div>
          <p class="sobretitulo">Administración</p>
          <h1>Gestión de exámenes</h1>
          <p class="texto-suave">Configura los exámenes, sus preguntas y la respuesta correcta de cada una.</p>
        </div>
        <button type="button" class="boton" id="ex-nuevo">+ Nuevo examen</button>
      </div>

      <section class="tarjeta">
        <h2>Exámenes registrados <span class="contador" id="contador-examenes">0</span></h2>
        <div class="tabla-envoltura">
          <table class="tabla">
            <thead>
              <tr>
                <th>Código</th><th>Título</th><th>Tiempo</th><th>Aprobación</th><th>Preguntas</th><th>Intentos</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody id="tabla-examenes"></tbody>
          </table>
        </div>
      </section>

      <section class="tarjeta" id="tarjeta-form-examen">
        <h2 id="titulo-form-examen">Nuevo examen</h2>
        <form id="form-examen" novalidate>
          <div class="formulario formulario--rejilla">
            ${campoHTML("ex-codigo", "Código", "text")}
            ${campoHTML("ex-titulo", "Título", "text")}
            ${campoHTML("ex-tiempo", "Tiempo (minutos)", "number")}
            ${campoHTML("ex-aprobacion", "Porcentaje de aprobación", "number")}
            <div class="campo campo--completo">
              <label for="ex-descripcion">Descripción del examen</label>
              <textarea id="ex-descripcion" rows="3"></textarea>
              <small class="campo__error"></small>
            </div>
          </div>

          <div class="preguntas">
            <h3>Preguntas <span class="contador" id="contador-preguntas">0</span></h3>
            <p class="texto-suave texto-pequeno">Marca el círculo de la respuesta correcta. Solo puede haber una por pregunta.</p>
            <div id="lista-preguntas" class="preguntas__lista"></div>
            <button type="button" class="boton boton--punteado" id="ex-agregar-pregunta">+ Agregar pregunta</button>
          </div>

          <div class="formulario__acciones">
            <button type="button" class="boton boton--secundario" id="ex-limpiar">Limpiar</button>
            <button type="submit" class="boton" id="ex-guardar">Crear examen</button>
          </div>
        </form>
      </section>`;

        this.formulario = this.querySelector("#form-examen");
        this.cuerpoTabla = this.querySelector("#tabla-examenes");
        this.listaPreguntas = this.querySelector("#lista-preguntas");

        this.formulario.addEventListener("submit", this.guardar);
        this.cuerpoTabla.addEventListener("click", this.alHacerClicEnTabla);
        this.listaPreguntas.addEventListener("input", this.alEscribirPregunta);
        this.listaPreguntas.addEventListener("click", this.alHacerClicEnPreguntas);
        this.querySelector("#ex-agregar-pregunta").addEventListener("click", this.agregarPregunta);
        this.querySelector("#ex-limpiar").addEventListener("click", () => this.limpiarFormulario());
        this.querySelector("#ex-nuevo").addEventListener("click", () => {
            this.limpiarFormulario();
            avisar("Formulario listo para un examen nuevo.", "info");
        });

        this.pintarTabla();
        this.pintarPreguntas();
    }
    // ---------- Tabla ----------
    pintarTabla() {
        const examenes = leerLista(CLAVES.examenes);
        const resultados = leerLista(CLAVES.resultados);
        this.querySelector("#contador-examenes").textContent = examenes.length;
        this.cuerpoTabla.replaceChildren();

        if (examenes.length === 0) {
            const fila = crearElemento("tr");
            const celda = crearElemento("td", ["tabla__vacia"], "Aún no hay exámenes. Crea el primero con el formulario.");
            celda.setAttribute("colspan", "7");
            fila.append(celda);
            this.cuerpoTabla.append(fila);
            return;
        }

        for (const examen of examenes) {
            const { id, codigo, titulo, tiempo, aprobacion, preguntas } = examen;
            const intentos = resultados.filter((r) => r.examenId === id).length;

            const fila = crearElemento("tr");
            fila.setAttribute("data-id", id);
            fila.classList.toggle("fila--editando", id === this.idEditando);

            const datos = [
                ["Código", codigo],
                ["Título", titulo],
                ["Tiempo", tiempo + " min"],
                ["Aprobación", aprobacion + "%"],
                ["Preguntas", preguntas.length],
                ["Intentos", intentos],
            ];
            datos.forEach(([nombreColumna, valor]) => {
                const celda = crearElemento("td", undefined, valor);
                celda.setAttribute("data-titulo", nombreColumna);
                fila.append(celda);
            });

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
    // ---------- Editor de preguntas ----------
    pintarPreguntas() {
        this.querySelector("#contador-preguntas").textContent = this.preguntas.length;
        this.listaPreguntas.replaceChildren();

        if (this.preguntas.length === 0) {
            this.listaPreguntas.append(
                crearElemento("p", ["vacio"], "Este examen todavía no tiene preguntas. Los exámenes sin preguntas no se muestran a los estudiantes.")
            );
            return;
        }

        this.preguntas.forEach((pregunta, i) => {
            const tarjeta = crearElemento("article", ["pregunta-editor"]);
            const cabecera = crearElemento("div", ["pregunta-editor__cabecera"]);
            cabecera.append(crearElemento("span", ["pregunta-editor__numero"], i + 1));

            const enunciado = document.createElement("textarea");
            enunciado.value = pregunta.enunciado;
            enunciado.setAttribute("rows", "2");
            enunciado.setAttribute("placeholder", "Escribe la pregunta…");
            enunciado.setAttribute("aria-label", "Enunciado de la pregunta " + (i + 1));
            enunciado.setAttribute("data-campo", "enunciado");
            enunciado.setAttribute("data-pregunta", i);
            cabecera.append(enunciado);

            const botonQuitar = crearElemento("button", ["boton", "boton--peligro", "boton--pequeno"], "Eliminar");
            botonQuitar.setAttribute("type", "button");
            botonQuitar.setAttribute("data-accion", "quitar-pregunta");
            botonQuitar.setAttribute("data-pregunta", i);
            cabecera.append(botonQuitar);
            tarjeta.append(cabecera);

            // Respuestas
            const lista = crearElemento("ul", ["respuestas-editor"]);
            pregunta.respuestas.forEach((respuesta, j) => {
                const item = crearElemento("li", ["respuesta-editor"]);
                item.classList.toggle("respuesta-editor--correcta", respuesta.correcta);

                const radio = document.createElement("input");
                radio.setAttribute("type", "radio");
                radio.setAttribute("name", "correcta-" + i);
                radio.setAttribute("aria-label", "Marcar la respuesta " + LETRAS[j] + " como correcta");
                radio.setAttribute("data-accion", "marcar-correcta");
                radio.setAttribute("data-pregunta", i);
                radio.setAttribute("data-respuesta", j);
                radio.checked = respuesta.correcta;

                const texto = document.createElement("input");
                texto.setAttribute("type", "text");
                texto.value = respuesta.descripcion;
                texto.setAttribute("placeholder", "Respuesta " + LETRAS[j]);
                texto.setAttribute("aria-label", "Texto de la respuesta " + LETRAS[j]);
                texto.setAttribute("data-campo", "respuesta");
                texto.setAttribute("data-pregunta", i);
                texto.setAttribute("data-respuesta", j);

                const quitar = crearElemento("button", ["boton", "boton--secundario", "boton--pequeno"], "✕");
                quitar.setAttribute("type", "button");
                quitar.setAttribute("aria-label", "Quitar la respuesta " + LETRAS[j]);
                quitar.setAttribute("data-accion", "quitar-respuesta");
                quitar.setAttribute("data-pregunta", i);
                quitar.setAttribute("data-respuesta", j);
                quitar.disabled = pregunta.respuestas.length <= 2; // mínimo 2 respuestas

                item.append(radio, texto, quitar);
                lista.append(item);
            });

            tarjeta.append(lista);

            const pie = crearElemento("div", ["pregunta-editor__pie"]);
            const agregar = crearElemento("button", ["boton", "boton--secundario", "boton--pequeno"], "+ Agregar respuesta");
            agregar.setAttribute("type", "button");
            agregar.setAttribute("data-accion", "agregar-respuesta");
            agregar.setAttribute("data-pregunta", i);
            agregar.disabled = pregunta.respuestas.length >= MAXIMO_RESPUESTAS;
            const error = crearElemento("small", ["campo__error"]);
            error.setAttribute("id", "error-pregunta-" + i);
            pie.append(agregar, error);
            tarjeta.append(pie);

            this.listaPreguntas.append(tarjeta);
        });
    }
}