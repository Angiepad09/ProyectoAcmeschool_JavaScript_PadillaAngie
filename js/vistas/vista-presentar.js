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
                radio.setAttribute("name", pregunta.id); // mismo name = solo una seleccionable
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

}