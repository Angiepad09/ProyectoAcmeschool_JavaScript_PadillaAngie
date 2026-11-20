export function login(email, password) {

    const usuarios = JSON.parse(
        localStorage.getItem("usuarios")
    ) || [];

    return usuarios.find(
        usuario =>
            usuario.email === email &&
            usuario.password === password
    );
}