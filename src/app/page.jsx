// pages/index.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db, collection, query, where, getDocs, limit } from "../libs/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

export default function Home() {
    const [correo, setCorreo] = useState("");
    const [contrasena, setContrasena] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        
        try {
            // 1. Autenticación con Firebase Auth
            console.log("Iniciando autenticación...");
            const userCredential = await signInWithEmailAndPassword(auth, correo, contrasena);
            const user = userCredential.user;
            
            console.log("Autenticación exitosa. Datos del usuario:", {
                uid: user.uid,
                email: user.email,
                emailVerified: user.emailVerified
            });

            // 2. Consulta a Firestore para verificar el usuario en la colección "Usuarios"
            console.log("Iniciando consulta a Firestore en la colección 'Usuarios'...");
            
            // **Punto clave de depuración:**
            // Asegúrate de que las reglas de seguridad de Firestore permitan la lectura
            // de la colección "Usuarios" para usuarios autenticados.
            // Por ejemplo, en tus reglas de Firestore, podrías tener algo como:
            // match /Usuarios/{documentId} {
            //   allow read: if request.auth != null;
            // }
            // O si es una base de datos de prueba, temporalmente:
            // match /Usuarios/{documentId} {
            //   allow read, write: if true;
            // }
            // Pero para producción, usa reglas más seguras.

            // **Otro punto clave de depuración:**
            // Si la consulta falla con un error relacionado con "missing index" (índice faltante),
            // necesitarás crear un índice compuesto en Firestore para la colección "Usuarios"
            // en el campo "authUid". Firebase te proporcionará un enlace en el mensaje de error
            // para crear este índice automáticamente.

            const q = query(
                collection(db, "Usuarios"),
                where("authUid", "==", user.uid)
            );
            
            const querySnapshot = await getDocs(q);
            console.log(`Documentos encontrados en Firestore: ${querySnapshot.size}`);

            if (querySnapshot.empty) {
                // Esto ocurre si no se encuentra un documento en la colección "Usuarios"
                // con el 'authUid' que coincida con el UID del usuario autenticado.
                // Verifica que el 'authUid' en Firestore sea exactamente igual al UID de Firebase Auth.
                const errorMsg = "No se encontró un perfil de usuario asociado en Firestore. Por favor, verifica la integridad de tus datos en la colección 'Usuarios'.";
                console.error(errorMsg);
                throw new Error(errorMsg);
            }

            // 3. Procesar resultados
            const usuarioDoc = querySnapshot.docs[0];
            const userData = usuarioDoc.data();
            
            console.log("Datos del documento de usuario encontrado en Firestore:", {
                id: usuarioDoc.id,
                ...userData
            });

            // 4. Almacenar el ID del documento y redirigir
            localStorage.setItem("usuarioId", usuarioDoc.id);
            console.log("Redirigiendo a /home...");
            router.push("/home"); // Asegúrate de que esta ruta sea correcta en tu configuración de Next.js

        } catch (error) {
            console.error("Error completo durante el inicio de sesión:", {
                code: error.code,
                message: error.message,
                stack: error.stack
            });
            
            setError(translateError(error));
        } finally {
            setLoading(false);
        }
    };

    // Traductor de errores de Firebase Auth
    const translateError = (error) => {
        const errorMap = {
            'auth/invalid-email': 'Correo electrónico inválido. Por favor, verifica el formato.',
            'auth/user-disabled': 'Tu cuenta ha sido deshabilitada. Contacta al soporte.',
            'auth/user-not-found': 'Usuario no registrado. Verifica tu correo electrónico o regístrate.',
            'auth/wrong-password': 'Contraseña incorrecta. Intenta de nuevo.',
            'auth/too-many-requests': 'Demasiados intentos fallidos. Por favor, intenta de nuevo más tarde.',
            'auth/network-request-failed': 'Error de conexión a la red. Verifica tu conexión a Internet.',
            // Errores personalizados que podrías lanzar desde tu lógica
            'No se encontró un perfil de usuario asociado en Firestore. Por favor, verifica la integridad de tus datos en la colección Usuarios.': 'Error interno: No se encontró el perfil de usuario en la base de datos.',
        };
        
        return errorMap[error.code] || error.message || "Error desconocido al iniciar sesión. Por favor, intenta de nuevo.";
    };

    return (
        <form className="flex flex-col items-center justify-center h-screen" onSubmit={handleLogin}>
            <div className="my-auto flex flex-col gap-y-8 items-center justify-center bg-white/5 py-10 w-10/12 md:w-1/3 mx-auto rounded-lg">
                <p className="text-3xl font-bold tracking-wider">Bienvenido</p>

                <div className="flex flex-col gap-3 w-full">
                    <label htmlFor="Correo" className="font-semibold text-center tracking-wide text-xl">
                        Correo Electrónico
                    </label>
                    <input
                        id="Correo"
                        autoComplete="email"
                        className="mx-auto outline-none focus:ring-blue-500 focus:border-blue-500 block dark:focus:ring-blue-500 dark:focus:border-blue-500 border-white border-2 rounded-md py-1.5 pl-2 pr-7 tracking-wider w-10/12 md:w-2/3"
                        type="email"
                        placeholder="Ejemplo@gmail.com"
                        required
                        value={correo}
                        onChange={(e) => setCorreo(e.target.value)}
                    />
                </div>

                <div className="flex flex-col gap-3 w-full">
                    <label htmlFor="Contraseña" className="font-semibold text-center tracking-wide text-xl">
                        Contraseña
                    </label>
                    <input
                        id="Contraseña"
                        autoComplete="current-password"
                        className="mx-auto outline-none focus:ring-blue-500 focus:border-blue-500 block dark:focus:ring-blue-500 dark:focus:border-blue-500 border-white border-2 rounded-md py-1.5 pl-2 pr-7 tracking-wider w-10/12 md:w-2/3"
                        type="password"
                        placeholder="********"
                        required
                        value={contrasena}
                        onChange={(e) => setContrasena(e.target.value)}
                    />
                </div>

                {error && (
                    <p className="text-red-500 font-semibold text-center w-10/12 md:w-2/3">
                        {error}
                    </p>
                )}

                <button
                    type="submit"
                    className="bg-blue-500 tracking-wider text-white font-semibold py-2 px-4 rounded-md w-10/12 md:w-2/3 hover:bg-blue-600 transition-colors duration-300 disabled:opacity-60"
                    disabled={loading}
                >
                    {loading ? "Ingresando..." : "Iniciar Sesión"}
                </button>
            </div>
        </form>
    );
}
