"use client";

// hacer en un componente la verificacion de login y el seleccionar vehiculo

import React from 'react';

import { useState } from 'react';

//llamado de la base de datos y autenticacion e inicio de seccion en firebase
//createUserWithEmailAndPassword ya es una funcion, va en verificacion
import { getAuth, signInWithEmailAndPassword } from "firebase/auth"; 
import { db } from "@/libs/firebase";

//redireccionar a la pagina de inicio de seccion
import { useRouter } from 'next/navigation';

export default function Home() { //Read component of CRUD
    
    //redireccionar a la pagina de inicio de seccion
    const router = useRouter();

    const auth = getAuth();

    const [data, setData] = useState({
        correo: "",
        contraseña: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;
        setData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const verificacion = (e) => {
        e.preventDefault(); // evita que recargue la página
        setErrorMsg(""); // Limpiar error anterior
        console.log('Datos del formulario:', data);

        signInWithEmailAndPassword(auth, data.correo, data.contraseña)
            .then((userCredential) => {
                const user = userCredential.user;
                console.log('Usuario autenticado:', user);
                router.push("/home");
                alert('Inicio de sesión exitoso');
                // Aquí puedes redirigir al usuario a otra página o realizar otras acciones
            })
            .catch((error) => {
                const errorCode = error.code;

                if (errorCode === "auth/user-not-found") {
                    setErrorMsg("El correo no está registrado.");
                } else if (errorCode === "auth/wrong-password") {
                    setErrorMsg("La contraseña es incorrecta.");
                } else {
                    setErrorMsg("Ocurrió un error. Intenta nuevamente.");
                }

                console.log(`Error ${errorCode}: ${error.message}`);
            });
    };

    return (
        <form className="flex flex-col items-center justify-center h-screen" onSubmit={verificacion}>
            <div className="my-auto flex flex-col gap-y-8 items-center justify-center bg-white/5 py-10 w-10/12 md:w-1/3 mx-auto rounded-lg">
                <p className="text-3xl font-bold tracking-wider">Bienvenido</p>

                <div className="flex flex-col gap-3 w-full">
                    <label htmlFor="Correo" className="font-semibold text-center tracking-wide text-xl">
                        Correo Electrónico
                    </label>
                    <input name='correo' value={data.correo} onChange={handleChange} type="email" required
                        className="mx-auto outline-none focus:ring-blue-500 focus:border-blue-500 block dark:focus:ring-blue-500 dark:focus:border-blue-500 border-white border-2 rounded-md py-1.5 pl-2 pr-7 tracking-wider w-10/12 md:w-2/3"
                    />
                </div>

                <div className="flex flex-col gap-3 w-full">
                    <label htmlFor="Contraseña" className="font-semibold text-center tracking-wide text-xl">
                        Contraseña
                    </label>
                    <div className='relative mx-auto w-10/12 md:w-2/3'>
                        <input
                            name='contraseña'
                            value={data.contraseña}
                            onChange={handleChange}
                            type={showPassword ? "text" : "password"}
                            required
                            className="mx-auto outline-none focus:ring-blue-500 focus:border-blue-500 block dark:focus:ring-blue-500 dark:focus:border-blue-500 border-white border-2 rounded-md py-1.5 pl-2 pr-10 tracking-wider w-full"
                            placeholder="Contraseña"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className='absolute right-2 top-1/2 transform -translate-y-1/2 transition-colors duration-200'
                            style={{ color: showPassword ? '#737373' : '#FFFFFF' }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>

                {errorMsg && (
                    <p className='text-red-400 text-center text-sm font-semibold'>{errorMsg}</p>
                )}

                <button
                    type="submit"
                    className="bg-blue-500 tracking-wider text-white font-semibold py-2 px-4 rounded-md w-10/12 md:w-2/3 hover:bg-blue-600 transition-colors duration-300 disabled:opacity-60"
                >Ingresar
                </button>
            </div>
        </form>
    );
}
