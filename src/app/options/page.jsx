"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // para redirección en Next.js

import Navbar from '../components/Navbar';

//importacion para verificar que este con una cuenta
import { getAuth } from "firebase/auth";

//importacion para obtener los datos del usuario desde la base de datos
import { getDoc, doc } from "firebase/firestore";

// Importar la configuración de Firebase
import { db } from "@/libs/firebase";

export default function page() {
    const router = useRouter();

    //crear un estado para los datos del usuario
    const [userData, setUserData] = useState(null);

    //usamos useEffect para verificar el usuario al cargar la pagina
    useEffect(() => {
        const fetchUserData = async () => {
        const auth = getAuth();
        const user = auth.currentUser;

        if (user) {
            const userDocRef = doc(db, "users", user.uid);
            const userSnapshot = await getDoc(userDocRef);

            if (userSnapshot.exists()) {
                setUserData(userSnapshot.data());
            } else {
                console.log("No se encontró el documento del usuario");
            }
        } else {
            // Si no hay usuario, mostrar alerta y redirigir
            alert("Tu sesión ha caducado. Por favor, inicia sesión nuevamente.");
            router.push("/"); // Redirige al login
        }
    };
        fetchUserData();
    }, []);

    return (
        <div className="mt-24">
            <Navbar/>
            pagina para editar lso gastos del vehiculo
        </div>
    )
}
