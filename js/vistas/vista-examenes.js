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

    agregarPregunta = () => {
        this.preguntas.push(nuevaPregunta());
        this.pintarPreguntas();
        const ultima = this.listaPreguntas.lastElementChild;
        ultima.animate([{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "translateY(0)" }], 300);
    };

    // Mientras se escribe, se actualiza el arreglo this.preguntas (sin volver a pintar)
    alEscribirPregunta = (e) => {
        const campo = e.target.getAttribute("data-campo");
        const i = Number(e.target.getAttribute("data-pregunta"));
        if (campo === "enunciado") {
            this.preguntas[i].enunciado = e.target.value;
        }
        if (campo === "respuesta") {
            const j = Number(e.target.getAttribute("data-respuesta"));
            this.preguntas[i].respuestas[j].descripcion = e.target.value;
        }
    };

    alHacerClicEnPreguntas = (e) => {
        const accion = e.target.getAttribute("data-accion");
        if (accion === null) {
            return;
        }
        const i = Number(e.target.getAttribute("data-pregunta"));
        const j = Number(e.target.getAttribute("data-respuesta"));
        const pregunta = this.preguntas[i];

        switch (accion) {
            case "quitar-pregunta":
                this.preguntas.splice(i, 1);
                break;
            case "agregar-respuesta":
                pregunta.respuestas.push({ id: generarId("r"), descripcion: "", correcta: false });
                break;
            case "quitar-respuesta": {
                const [quitada] = pregunta.respuestas.splice(j, 1);
                // Si se quitó la correcta, la primera pasa a ser la correcta
                if (quitada.correcta) {
                    pregunta.respuestas[0].correcta = true;
                }
                break;
            }
            case "marcar-correcta":
                // Solo una correcta: la elegida queda en true y las demás en false
                pregunta.respuestas.forEach((respuesta, k) => {
                    respuesta.correcta = k === j;
                });
                break;
        }
        this.pintarPreguntas();
    };

    // ---------- Formulario ----------
    editar(id) {
        const examen = leerLista(CLAVES.examenes).find((ex) => ex.id === id);
        if (examen === undefined) {
            return;
        }
        this.idEditando = id;
        document.getElementById("ex-codigo").value = examen.codigo;
        document.getElementById("ex-titulo").value = examen.titulo;
        document.getElementById("ex-tiempo").value = examen.tiempo;
        document.getElementById("ex-aprobacion").value = examen.aprobacion;
        document.getElementById("ex-descripcion").value = examen.descripcion;

        // Copia profunda: el spread solo copia el primer nivel y las preguntas
        // tienen objetos anidados. Con JSON.stringify + JSON.parse se copia todo.
        this.preguntas = JSON.parse(JSON.stringify(examen.preguntas));

        this.querySelector("#titulo-form-examen").textContent = "Editar examen: " + examen.titulo;
        this.querySelector("#ex-guardar").textContent = "Guardar cambios";
        this.querySelector("#tarjeta-form-examen").classList.add("tarjeta--editando");
        limpiarErrores(this.formulario);
        this.pintarTabla();
        this.pintarPreguntas();
        this.querySelector("#tarjeta-form-examen").scrollIntoView({ behavior: "smooth" });
    }

    limpiarFormulario() {
        this.idEditando = null;
        this.preguntas = [];
        ["ex-codigo", "ex-titulo", "ex-tiempo", "ex-aprobacion", "ex-descripcion"].forEach((idInput) => {
            document.getElementById(idInput).value = "";
        });
        this.querySelector("#titulo-form-examen").textContent = "Nuevo examen";
        this.querySelector("#ex-guardar").textContent = "Crear examen";
        this.querySelector("#tarjeta-form-examen").classList.remove("tarjeta--editando");
        limpiarErrores(this.formulario);
        this.pintarTabla();
        this.pintarPreguntas();
    }

    // Revisa los datos generales del examen. Devuelve true si todo está bien.
    validarDatos(datos) {
        let valido = true;
        const otros = leerLista(CLAVES.examenes).filter((ex) => ex.id !== this.idEditando);

        if (datos.codigo.length < 2) {
            marcarError("ex-codigo", "Escribe un código (mínimo 2 caracteres).");
            valido = false;
        } else if (otros.find((ex) => ex.codigo === datos.codigo) !== undefined) {
            marcarError("ex-codigo", "Ya existe un examen con este código.");
            valido = false;
        }
        if (datos.titulo.length < 3) {
            marcarError("ex-titulo", "Escribe un título (mínimo 3 caracteres).");
            valido = false;
        }
        // Number("") es 0 y Number("abc") es NaN: ambos casos se rechazan
        if (Number.isNaN(datos.tiempo) || datos.tiempo < 1 || datos.tiempo > 300 || datos.tiempo % 1 !== 0) {
            marcarError("ex-tiempo", "Escribe un número entero entre 1 y 300.");
            valido = false;
        }
        if (Number.isNaN(datos.aprobacion) || datos.aprobacion < 1 || datos.aprobacion > 100 || datos.aprobacion % 1 !== 0) {
            marcarError("ex-aprobacion", "Escribe un número entero entre 1 y 100.");
            valido = false;
        }
        if (datos.descripcion.length < 10) {
            marcarError("ex-descripcion", "Describe el examen (mínimo 10 caracteres).");
            valido = false;
        }
        return valido;
    }

    // Revisa cada pregunta. Devuelve true si todas están completas.
    validarPreguntas() {
        let valido = true;
        this.preguntas.forEach((pregunta, i) => {
            let mensaje = "";
            const vacias = pregunta.respuestas.filter((r) => r.descripcion.trim() === "");
            const correctas = pregunta.respuestas.filter((r) => r.correcta);

            if (pregunta.enunciado.trim() === "") {
                mensaje = "Escribe el enunciado de la pregunta.";
            } else if (vacias.length > 0) {
                mensaje = "Completa el texto de todas las respuestas.";
            } else if (correctas.length !== 1) {
                mensaje = "Marca exactamente una respuesta como correcta.";
            }

            const tarjeta = this.listaPreguntas.children[i];
            tarjeta.classList.toggle("pregunta-editor--error", mensaje !== "");
            document.getElementById("error-pregunta-" + i).textContent = mensaje;
            if (mensaje !== "") {
                valido = false;
            }
        });
        return valido;
    }

    guardar = (e) => {
        e.preventDefault();
        limpiarErrores(this.formulario);

        const datos = {
            codigo: document.getElementById("ex-codigo").value.trim().toUpperCase(),
            titulo: document.getElementById("ex-titulo").value.trim(),
            tiempo: Number(document.getElementById("ex-tiempo").value),
            aprobacion: Number(document.getElementById("ex-aprobacion").value),
            descripcion: document.getElementById("ex-descripcion").value.trim(),
        };

        const datosValidos = this.validarDatos(datos);
        const preguntasValidas = this.validarPreguntas();
        if (!datosValidos || !preguntasValidas) {
            avisar("Revisa los campos marcados en rojo.", "error");
            return;
        }

        // Se limpian los espacios de los textos de las preguntas
        const preguntasLimpias = this.preguntas.map((pregunta) => ({
            ...pregunta,
            enunciado: pregunta.enunciado.trim(),
            respuestas: pregunta.respuestas.map((r) => ({ ...r, descripcion: r.descripcion.trim() })),
        }));

        const examenes = leerLista(CLAVES.examenes);
        if (this.idEditando === null) {
            examenes.push({ ...datos, id: generarId("ex"), preguntas: preguntasLimpias });
            guardarLista(CLAVES.examenes, examenes);
            avisar(`Examen creado con ${preguntasLimpias.length} pregunta(s).`, "exito");
        } else {
            const actualizados = examenes.map((ex) =>
                ex.id === this.idEditando ? { ...ex, ...datos, preguntas: preguntasLimpias } : ex
            );
            guardarLista(CLAVES.examenes, actualizados);
            avisar("Examen actualizado.", "exito");
        }
        this.limpiarFormulario();
    };

    async eliminar(id) {
        const examen = leerLista(CLAVES.examenes).find((ex) => ex.id === id);
        const confirmado = await abrirModal({
            titulo: "Eliminar examen",
            mensaje: `Se eliminará "${examen.titulo}" con sus ${examen.preguntas.length} pregunta(s). Esta acción no se puede deshacer.`,
            textoAceptar: "Eliminar",
            peligro: true,
        });
        if (confirmado === null) {
            return;
        }
        const fila = this.cuerpoTabla.querySelector(`[data-id="${id}"]`);
        await fila.animate([{ opacity: 1 }, { opacity: 0, transform: "translateX(30px)" }], 300).finished;

        guardarLista(CLAVES.examenes, leerLista(CLAVES.examenes).filter((ex) => ex.id !== id));
        avisar("Examen eliminado.", "info");
        if (this.idEditando === id) {
            this.limpiarFormulario();
        } else {
            this.pintarTabla();
        }
    }
}
customElements.define("vista-examenes", VistaExamenes);