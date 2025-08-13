"use client";

import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";

import { getAuth } from "firebase/auth";
import {
    collection,
    getDocs,
    getDoc,
    doc,
    query,
    where,
    documentId, // Importamos para consultar por el ID del documento
} from "firebase/firestore";
import { db } from "@/libs/firebase";

import { useRouter } from "next/navigation";

export default function page() {
    const router = useRouter();

    // constantes

    // constante de verificacion
    const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState(false);
    const [deudores, setDeudores] = useState(true);

    // constantes para verificacion de login y vehiculo seleccionado
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [vehiculo, setVehiculo] = useState([]);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        vehiculo: ""
    });
    const [registros, setRegistros] = useState([]);

    // 1️⃣ verificacion de usuario
    useEffect(() => {
        const auth = getAuth();
        const currentUser = auth.currentUser;

        if (currentUser) {
            setUser(currentUser);

            const userDocRef = doc(db, "users", currentUser.uid);
            getDoc(userDocRef)

            .then((userSnapshot) => {
            if (userSnapshot.exists()) {
                setUserData(userSnapshot.data());
            }
            })
            .catch((err) => {
            console.error("Error al obtener datos del usuario", err);
            });
        } else {
            alert("Tu sesión ha caducado. Por favor, inicia sesión nuevamente.");
            router.push("/");
        }
    }, []);

    // 2️⃣ Obtener vehículos
    useEffect(() => {
        const obtenerVehiculos = async () => {
            if (!user) return;

            try {
                const ref = collection(db, "users", user.uid, "Vehiculos");
                const snapshot = await getDocs(ref);
                const lista = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                }));
                setVehiculo(lista);
            } catch (e) {
                console.error("Error al obtener vehículos:", e);
                setVehiculo([]);
            } finally {
                setLoading(false);
            }
        };

        obtenerVehiculos();
    }, [user]);

    // 3️⃣ Cambios en select
    const handleVehiculoChange = (e) => {
        const { value } = e.target;
        setData((prev) => ({ ...prev, vehiculo: value }));
        setRegistros([]); // Limpiar registros si cambia el vehículo

        setVehiculoSeleccionado(true)
    };

    // llamado a la base de datos por los deudores y deudas

    // formulario para añadir deudor
    const formDeudor = () => {
        alert("Agregando deudor")
        router.push("./deudores/formDeudor")
    }

    // formulario para añadir deuda
    const formDeuda = () => {
        alert("Agregando deuda")
        router.push("./deudores/formDeuda")
    }
    

    return (
        <div>
            <Navbar/>

            <div className="flex items-center justify-center w-full max-w-md mx-auto mb-6 mt-24">
                <p className="font-semibold tracking-wider text-xl mr-4">Carro: </p>
                {loading ? (
                    <p>Cargando vehículos...</p>
                ) : vehiculo.length === 0 ? (
                    <p>No hay vehículos registrados.</p>
                ) : (
                    <select
                        value={data.vehiculo}
                        onChange={handleVehiculoChange}
                        name="vehiculo"
                        className="w-64 border p-2 rounded bg-white text-black"
                        required
                    >
                        <option value="">Selecciona un vehículo</option>
                        {vehiculo.map((carro) => (
                            <option key={carro.id} value={carro.placa}>
                                {carro.placa} - {carro.marca} {carro.modelo}
                            </option>
                        ))}
                    </select>
                )}
            </div>

            {vehiculoSeleccionado ? (
                <div className="flex items-center justify-center w-full max-w-md mx-auto mb-6 mt-24">
                    {deudores ? (
                        //cuando es deudores = false, en caso que si hay deudores
                        <div>
                            {/* mostrar la lista de deudores y deuda */}
                            <div>
                                <p>lista de deudas y deudores</p>
                            </div>

                            <button onClick={formDeudor} className="border-1 border-white bg-green-400 py-2 px-4 rounded font-semibold text-lg tracking-wide">Agregar Deudor</button>
                            <button onClick={formDeuda} className="border-1 border-white bg-blue-400 py-2 px-4 rounded font-semibold text-lg tracking-wide">Agregar Deuda</button>
                        </div>
                    ):(
                        //cuando es deudores = true, en caso que no hay deudores
                        <div>
                            <p>No tienes deudas o deudores por el momento!</p>
                        </div>
                    )}
                </div>
            ):(
                <div className="flex items-center justify-center w-full max-w-md mx-auto mb-6 mt-24">
                    <p>Selecciona un vehiculo primero</p>
                </div>
            )}
            
        </div>
    )
}
