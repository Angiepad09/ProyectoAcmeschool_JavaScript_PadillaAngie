class VistaCatalogo extends HTMLElement {
    
    connectedCallback() {
        this.innerHTML = `
      <section class="portada">
        <div>
          <p class="sobretitulo sobretitulo--claro">Módulo de estudiantes</p>
          <h1>Exámenes disponibles</h1>
          <p>Elige un examen, ingresa tus datos y responde antes de que termine el tiempo. No necesitas iniciar sesión.</p>
        </div>
        <input type="search" id="buscar-examen" class="buscador" placeholder="Buscar examen…" aria-label="Buscar examen" />
      </section>
      <div id="aviso-pendiente"></div>
      <div class="tarjetas-examen" id="lista-examenes"></div>`;

        this.lista = this.querySelector("#lista-examenes");
        this.querySelector("#buscar-examen").addEventListener("input", () => this.pintarExamenes());
        this.lista.addEventListener("click", this.alHacerClic);

        this.pintarPendiente();
        this.pintarExamenes();
    }

    // Si hay un examen sin terminar, se ofrece continuarlo
    pintarPendiente() {
        const intento = leerIntento();
        if (intento === null) {
            return;
        }
        const examen = leerLista(CLAVES.examenes).find((ex) => ex.id === intento.examenId);
        if (examen === undefined) {
            borrarIntento();
            return;
        }
        const caja = crearElemento("div", ["banner"]);
        caja.append(
            crearElemento("p", undefined, `${intento.nombre}, tienes en curso "${examen.titulo}". Puedes continuarlo donde lo dejaste.`)
        );
        const boton = crearElemento("button", ["boton", "boton--pequeno"], "Continuar examen");
        boton.setAttribute("type", "button");
        boton.addEventListener("click", () => navegar("presentar"));
        caja.append(boton);
        this.querySelector("#aviso-pendiente").append(caja);
    }

    pintarExamenes() {
        const busqueda = this.querySelector("#buscar-examen").value.trim().toLowerCase();
        // Solo se muestran los exámenes que tienen preguntas
        const examenes = leerLista(CLAVES.examenes)
            .filter((ex) => ex.preguntas.length > 0)
            .filter((ex) => ex.titulo.toLowerCase().includes(busqueda) || ex.codigo.toLowerCase().includes(busqueda));

        this.lista.replaceChildren();

        if (examenes.length === 0) {
            this.lista.append(crearElemento("p", ["vacio"], "No hay exámenes disponibles por ahora."));
            return;
        }

        examenes.forEach((examen, i) => {
            const { id, codigo, titulo, tiempo, aprobacion, descripcion, preguntas } = examen;
            const tarjeta = crearElemento("article", ["tarjeta-examen"]);

            const superior = crearElemento("div", ["tarjeta-examen__superior"]);
            superior.append(
                crearElemento("span", ["codigo"], codigo),
                crearElemento("span", ["texto-suave", "texto-pequeno"], preguntas.length + " pregunta(s)")
            );

            const datos = crearElemento("dl", ["tarjeta-examen__datos"]);
            const tiempoCaja = crearElemento("div");
            tiempoCaja.append(crearElemento("dt", undefined, "⏱ Tiempo"), crearElemento("dd", undefined, tiempo + " min"));
            const aprobacionCaja = crearElemento("div");
            aprobacionCaja.append(crearElemento("dt", undefined, "🎯 Para aprobar"), crearElemento("dd", undefined, aprobacion + "%"));
            datos.append(tiempoCaja, aprobacionCaja);

            const boton = crearBotonAccion("Presentar examen", "presentar", id, ["boton", "boton--ancho"]);

            tarjeta.append(
                superior,
                crearElemento("h2", ["tarjeta-examen__titulo"], titulo),
                crearElemento("p", ["tarjeta-examen__descripcion"], descripcion),
                datos,
                boton
            );
            this.lista.append(tarjeta);

            // Las tarjetas entran una detrás de otra (delay)
            tarjeta.animate(
                [
                    { opacity: 0, transform: "translateY(15px)" },
                    { opacity: 1, transform: "translateY(0)" },
                ],
                { duration: 400, delay: i * 80, fill: "backwards" }
            );
        });
    }
}