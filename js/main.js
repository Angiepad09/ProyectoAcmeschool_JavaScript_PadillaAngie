async function iniciar() {
  await cargarDatosIniciales();
  const app = document.createElement("acme-app");
  document.getElementById("app").replaceChildren(app);
}

iniciar();
