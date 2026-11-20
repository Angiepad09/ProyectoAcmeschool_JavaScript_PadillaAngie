export function initData() {

    if (!localStorage.getItem("usuarios")) {

        const usuarios = [
            {
                id: crypto.randomUUID(),
                identificacion: "123456",
                nombre: "Administrador",
                email: "admin@acme.com",
                telefono: "3001234567",
                cargo: "Administrativo",
                password: "12345"
            }
        ];

        localStorage.setItem(
            "usuarios",
            JSON.stringify(usuarios)
        );
    }

}