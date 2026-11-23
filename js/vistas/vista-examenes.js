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
}