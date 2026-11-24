// Calcula el resultado de un examen a partir de las respuestas elegidas.
function calificar(examen, respuestas) {
    const total = examen.preguntas.length;
    const acertadas = examen.preguntas.filter((pregunta) => {
        const correcta = pregunta.respuestas.find((r) => r.correcta);
        return correcta !== undefined && respuestas[pregunta.id] === correcta.id;
    }).length;
    // Porcentaje con un decimal
    const porcentaje = Math.round((acertadas / total) * 1000) / 10;
    return { total, acertadas, porcentaje, aprobado: porcentaje >= examen.aprobacion };
}

// Cuenta cuántas preguntas tienen respuesta
function contarRespondidas(respuestas) {
    let cantidad = 0;
    for (const idPregunta in respuestas) {
        cantidad++;
    }
    return cantidad;
}

class VistaPresentar extends HTMLElement {
    constructor() {
        super();
        this.terminado = false;
    }

    connectedCallback() {
        this.intento = leerIntento();
        if (this.intento === null) {
            avisar("Primero elige un examen e ingresa tus datos.", "info");
            navegar("catalogo");
            return;
        }
        this.examen = leerLista(CLAVES.examenes).find((ex) => ex.id === this.intento.examenId);
        if (this.examen === undefined) {
            borrarIntento();
            avisar("El examen ya no existe.", "error");
            navegar("catalogo");
            return;
        }
        // Si el tiempo se acabó, se califica de una vez
        if (this.intento.segundosRestantes <= 0) {
            this.finalizar(true);
            return;
        }
        this.pintarExamen();
    }

    pintarExamen() {
        const { examen, intento } = this;

        this.innerHTML = `
      <div class="examen">
        <header class="tarjeta examen__cabecera">
          <div>
            <p class="sobretitulo" id="examen-estudiante"></p>
            <h1 id="examen-titulo"></h1>
            <p class="examen__datos">
              <span><strong id="examen-total"></strong> preguntas</span>
              <span><strong id="examen-aprobacion"></strong> para aprobar</span>
            </p>
          </div>
          <div id="espacio-reloj"></div>
          <div class="progreso"><div class="progreso__barra" id="progreso-barra"></div></div>
          <p class="texto-suave texto-pequeno" id="progreso-texto"></p>
        </header>

        <form id="form-examen-estudiante" novalidate>
          <ol class="examen__preguntas" id="examen-preguntas"></ol>
          <div class="tarjeta examen__pie">
            <p class="texto-suave">Puedes cambiar tus respuestas hasta que presiones Terminar o se acabe el tiempo.</p>
            <button type="submit" class="boton boton--grande">Terminar</button>
          </div>
        </form>
      </div>`;

        this.querySelector("#examen-estudiante").textContent = `${examen.codigo} · ${intento.nombre} (${intento.identificacion})`;
        this.querySelector("#examen-titulo").textContent = examen.titulo;
        this.querySelector("#examen-total").textContent = examen.preguntas.length;
        this.querySelector("#examen-aprobacion").textContent = examen.aprobacion + "%";

        // Temporizador
        const reloj = document.createElement("acme-temporizador");
        reloj.setAttribute("total", examen.tiempo * 60);
        reloj.setAttribute("segundos", intento.segundosRestantes);
        reloj.addEventListener("tiempo-tic", this.alPasarUnSegundo);
        reloj.addEventListener("tiempo-agotado", this.alAgotarseElTiempo);
        this.querySelector("#espacio-reloj").append(reloj);

        // Preguntas
        const lista = this.querySelector("#examen-preguntas");
        examen.preguntas.forEach((pregunta, i) => {
            const item = crearElemento("li", ["tarjeta", "pregunta"]);
            const grupo = crearElemento("fieldset");
            const leyenda = crearElemento("legend");
            leyenda.append(crearElemento("span", ["pregunta__numero"], i + 1), pregunta.enunciado);
            grupo.append(leyenda);

            pregunta.respuestas.forEach((respuesta, j) => {
                const opcion = crearElemento("label", ["opcion"]);
                const radio = document.createElement("input");
                radio.setAttribute("type", "radio");
                radio.setAttribute("name", pregunta.id);
                radio.setAttribute("value", respuesta.id);
                radio.checked = intento.respuestas[pregunta.id] === respuesta.id;
                opcion.classList.toggle("opcion--elegida", radio.checked);

                opcion.append(radio, crearElemento("span", ["opcion__letra"], LETRAS[j]), crearElemento("span", undefined, respuesta.descripcion));
                grupo.append(opcion);
            });

            item.append(grupo);
            lista.append(item);
        });

        const formulario = this.querySelector("#form-examen-estudiante");
        formulario.addEventListener("change", this.alElegirRespuesta);
        formulario.addEventListener("submit", this.alTerminar);
        this.actualizarProgreso();
    }

    alPasarUnSegundo = (e) => {
        this.intento.segundosRestantes = e.detail.segundos;
        guardarIntento(this.intento);
    };

    alAgotarseElTiempo = () => {
        document.querySelector("acme-modal").cerrar(null);
        avisar("¡Se acabó el tiempo! El examen se envió automáticamente.", "alerta");
        this.finalizar(true);
    };

    alElegirRespuesta = (e) => {
        const idPregunta = e.target.getAttribute("name");
        this.intento.respuestas[idPregunta] = e.target.value;
        guardarIntento(this.intento);

        // Resalta la opción elegida
        const grupo = e.target.parentElement.parentElement;
        grupo.querySelectorAll(".opcion").forEach((opcion) => {
            opcion.classList.toggle("opcion--elegida", opcion.firstElementChild.checked);
        });
        this.actualizarProgreso();
    };

    actualizarProgreso() {
        const total = this.examen.preguntas.length;
        const respondidas = contarRespondidas(this.intento.respuestas);
        this.querySelector("#progreso-barra").style.width = (respondidas / total) * 100 + "%";
        this.querySelector("#progreso-texto").textContent = `${respondidas} de ${total} respondidas`;
    }

    alTerminar = async (e) => {
        e.preventDefault();
        const faltan = this.examen.preguntas.length - contarRespondidas(this.intento.respuestas);
        const mensaje =
            faltan > 0
                ? `Tienes ${faltan} pregunta(s) sin responder. Las preguntas sin respuesta cuentan como incorrectas.`
                : "Respondiste todas las preguntas. Ya no podrás cambiar tus respuestas.";

        const confirmado = await abrirModal({ titulo: "¿Terminar el examen?", mensaje: mensaje, textoAceptar: "Terminar" });
        if (confirmado !== null) {
            this.finalizar(false);
        }
    };

    finalizar(porTiempo) {
        if (this.terminado) {
            return; // evita guardar dos veces
        }
        this.terminado = true;

        const {examen, intento} = this;
        const calificacion = calificar(examen, intento.respuestas);

        const resultado = {
            id: generarId("res"),
            examenId: examen.id,
            examenCodigo: examen.codigo,
            examenTitulo: examen.titulo,
            identificacion: intento.identificacion,
            nombre: intento.nombre,
            respuestas: { ...intento.respuestas },
            ...calificacion,
            aprobacionRequerida: examen.aprobacion,
            porTiempo: porTiempo,
            segundosUsados: examen.tiempo * 60 - (intento.segundosRestantes > 0 ? intento.segundosRestantes : 0),
        };

        const resultados = leerLista(CLAVES.resultados);
        resultados.push(resultado);
        guardarLista(CLAVES.resultados, resultados);
        borrarIntento();

        this.pintarResultado(resultado);
    }

    async pintarResultado(resultado) {
        const { aprobado, porcentaje, acertadas, total, aprobacionRequerida, nombre, segundosUsados, porTiempo } = resultado;

        this.innerHTML = `
      <section class="tarjeta resultado">
        <p class="sobretitulo" id="resultado-examen"></p>
        <p class="resultado__porcentaje"><span id="resultado-porcentaje"></span>%</p>
        <div class="resultado__barra">
          <div class="resultado__relleno" id="resultado-relleno"></div>
          <div class="resultado__meta" id="resultado-meta"></div>
        </div>
        <h1 class="resultado__titulo" id="resultado-titulo"></h1>
        <p id="resultado-mensaje"></p>
        <dl class="resultado__datos">
          <div><dt>Respuestas correctas</dt><dd id="resultado-correctas"></dd></div>
          <div><dt>Porcentaje de acierto</dt><dd id="resultado-acierto"></dd></div>
          <div><dt>Tiempo usado</dt><dd id="resultado-tiempo"></dd></div>
        </dl>
        <p class="etiqueta etiqueta--amarilla oculto" id="resultado-por-tiempo">Enviado automáticamente al agotarse el tiempo</p>
        <button type="button" class="boton boton--grande" id="resultado-volver">Volver a los exámenes</button>
      </section>`;

        const tarjeta = this.querySelector(".resultado");
        tarjeta.classList.add(aprobado ? "resultado--aprobado" : "resultado--reprobado");

        this.querySelector("#resultado-examen").textContent = `${resultado.examenCodigo} · ${resultado.examenTitulo}`;
        this.querySelector("#resultado-porcentaje").textContent = porcentaje;
        this.querySelector("#resultado-titulo").textContent = aprobado ? "¡Aprobaste!" : "No aprobaste";
        this.querySelector("#resultado-mensaje").textContent = aprobado
            ? `Excelente trabajo, ${nombre}. Superaste el ${aprobacionRequerida}% requerido.`
            : `${nombre}, necesitabas ${aprobacionRequerida}% para aprobar. ¡Sigue practicando!`;
        this.querySelector("#resultado-correctas").textContent = `${acertadas} / ${total}`;
        this.querySelector("#resultado-acierto").textContent = porcentaje + "%";
        this.querySelector("#resultado-tiempo").textContent = formatearTiempo(segundosUsados);
        this.querySelector("#resultado-por-tiempo").classList.toggle("oculto", !porTiempo);
        this.querySelector("#resultado-meta").style.left = aprobacionRequerida + "%";
        this.querySelector("#resultado-volver").addEventListener("click", () => navegar("catalogo"));

        await tarjeta.animate([
            { opacity: 0, transform: "scale(0.95)" },
            { opacity: 1, transform: "scale(1)" },
        ], 300
        ).finished;
        this.querySelector("#resultado-relleno").animate([{ width: "0%" }, { width: porcentaje + "%" }], {
            duration: 1000, easing: "ease-out", fill: "forwards",
        });
    }
}

customElements.define("vista-presentar", VistaPresentar);

