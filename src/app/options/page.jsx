"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";

import { getAuth } from "firebase/auth";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc,
} from "firebase/firestore";
import { db } from "@/libs/firebase";

export default function Page() {
    const router = useRouter();

    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [vehiculos, setVehiculos] = useState([]);
    const [loading, setLoading] = useState(true);

    const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState("");
    const [fecha, setFecha] = useState("");
    const [registros, setRegistros] = useState(null);

    const [data, setData] = useState({
        vehiculo: "",
        ganancia: "",
    });

    const [gastos, setGastos] = useState([{ nombre: "", monto: "" }]);

    // 1️⃣ Obtener usuario
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
            setVehiculos(lista);
        } catch (e) {
            console.error("Error al obtener vehículos:", e);
            setVehiculos([]);
        } finally {
            setLoading(false);
        }
        };

        obtenerVehiculos();
    }, [user]);

    // 3️⃣ Obtener registros cuando hay vehículo y fecha
    useEffect(() => {
        const obtenerRegistros = async () => {
        if (!user || !vehiculoSeleccionado || !fecha) return;

        try {
            const ref = doc(db, "users", user.uid, "Vehiculos", vehiculoSeleccionado, "registros", fecha);
            console.log("Obteniendo datos de:", ref.path);
            const snapshot = await getDoc(ref);

            if (snapshot.exists()) {
            setRegistros(snapshot.data());
            } else {
            setRegistros(null);
            }
        } catch (e) {
            console.error("Error al obtener registros:", e);
            setRegistros([]);
        }
        };

        obtenerRegistros();
    }, [user, vehiculoSeleccionado, fecha]);

    // 3️⃣ Controladores
    const handleChange = (e) => {
        const { name, value } = e.target;
        setData((prev) => ({ ...prev, [name]: value }));
    };

    const handleGastoChange = (index, field, value) => {
        const nuevosGastos = [...gastos];
        nuevosGastos[index][field] = value;
        setGastos(nuevosGastos);
    };

    const agregarGasto = () => {
        setGastos([...gastos, { nombre: "", monto: "" }]);
    };

    const eliminarGasto = (index) => {
        if (gastos.length === 1) return;
        setGastos(gastos.filter((_, i) => i !== index));
    };

    // 4️⃣ Verificar y subir datos
    const verificar = async (e) => {
        e.preventDefault();

        if (!vehiculoSeleccionado || gastos.some((g) => !g.nombre || !g.monto)) {
            alert("Por favor completa todos los campos correctamente.");
            return;
        }

        try {
            const fechaId = fecha;
            const docRef = doc(db, "users", user.uid, "Vehiculos", vehiculoSeleccionado, "registros", fechaId);

            // Obtener datos existentes
            const snapshot = await getDoc(docRef);
            const dataExistente = snapshot.exists() ? snapshot.data() : null;

            const gananciaAnterior = dataExistente?.gananciaBruta || 0;
            const gastosAnteriores = dataExistente?.gastos || [];
            const gananciaNetaAnterior = dataExistente?.gananciaNeta || (gananciaAnterior - gastosAnteriores.reduce((s, g) => s + g.monto, 0));

            // Preparar datos nuevos
            const gananciaNueva = data.ganancia !== "" ? parseFloat(data.ganancia) : null;
            const nuevosGastos = gastos.map((g) => ({
                nombre: g.nombre,
                monto: parseFloat(g.monto),
            }));

            // Unir gastos anteriores con nuevos
            const gastosActualizados = [...gastosAnteriores, ...nuevosGastos];

            // Lógica condicional
            let nuevoDoc = {
                gastos: gastosActualizados,
            };

            if (gananciaNueva !== null && !isNaN(gananciaNueva)) {
                const gananciaBrutaActualizada = gananciaAnterior + gananciaNueva;
                const totalGastos = gastosActualizados.reduce((sum, g) => sum + g.monto, 0);
                const gananciaNetaActualizada = gananciaBrutaActualizada - totalGastos;

                nuevoDoc.gananciaBruta = gananciaBrutaActualizada;
                nuevoDoc.gananciaNeta = gananciaNetaActualizada;
            }

            await setDoc(docRef, nuevoDoc, { merge: true });

            console.log("Datos guardados en:", docRef.path);
            alert("Cuentas subidas exitosamente.");

            // Limpiar campos
            setData({ vehiculo: "", ganancia: "" });
            setGastos([{ nombre: "", monto: "" }]);
            router.push("/home");

        } catch (error) {
            console.error("Error al subir los datos:", error);
            alert("Ocurrió un error al subir los datos. Intenta de nuevo.");
        }
    };


    return (
        <div className="mt-24">
            <Navbar />

            <form onSubmit={verificar} className="flex flex-col items-center justify-center w-10/12 md:w-2/3 mx-auto bg-white/10 p-6 rounded">
                <p className="text-center text-3xl font-bold tracking-wider mb-5">Edición de Cuentas</p>

                {/* Selección de Vehículo */}
                <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto mb-6">
                    {loading ? (
                        <p>Cargando vehículos...</p>
                    ) : vehiculos.length === 0 ? (
                        <p>No hay vehículos registrados.</p>
                    ) : (
                        <select
                        value={vehiculoSeleccionado}
                        onChange={(e) => setVehiculoSeleccionado(e.target.value)}
                        className="w-full border p-2 rounded bg-white text-black"
                        required
                        >
                        <option value="">Selecciona un vehículo</option>
                        {vehiculos.map((carro) => (
                            <option key={carro.id} value={carro.placa}>
                            {carro.placa} - {carro.marca} {carro.modelo}
                            </option>
                        ))}
                        </select>
                    )}
                </div>

                {/* Selección de Fecha */}
                <div>
                    {vehiculoSeleccionado ? (
                        <div className="flex items-center justify-center w-full max-w-md mx-auto mb-6">
                        <label className="text-xl font-semibold tracking-wider mr-2">Fecha:</label>
                        <input
                            type="date"
                            value={fecha}
                            onChange={(e) => setFecha(e.target.value)}
                            className="border w-full border-white rounded p-2"
                        />
                        </div>
                    ) : (
                        <p className="text-white text-center">Por favor, selecciona un vehículo primero.</p>
                    )}
                </div>

                {/* Mostrar Ganancia Neta */}
                <div>
                    {vehiculoSeleccionado && fecha ? (
                        registros ? (
                        <div className="w-full max-w-4xl mx-auto mb-10 bg-white/10 rounded px-1 py-4 md:p-5">
                            
                                <h1 className="text-4xl font-bold mb-4 text-center">Editar Cuentas</h1>

                                <p className="text-center text-3xl tracking-wider font-bold">
                                    Ganancia Neta: {registros.gananciaNeta ?? "No registrada"}
                                </p>

                                {/* Ganancia */}
                                <div className="flex flex-col gap-2 mt-4">
                                    <label className="font-semibold tracking-wider text-lg">1. Ingresa la ganancia extra</label>
                                    <input
                                        name="ganancia"
                                        value={data.ganancia}
                                        onChange={handleChange}
                                        type="number"
                                        placeholder="0"
                                        className="border border-white text-white rounded pl-2 py-1"
                                    />
                                </div>

                                {/* Lista de gastos */}
                                <div className="flex flex-col gap-2 mt-4">
                                    <label className="font-semibold tracking-wider text-lg">
                                        2. Ingresa los gastos uno por uno
                                    </label>

                                    {gastos.map((gasto, idx) => (
                                        <div
                                            key={idx}
                                            className="flex flex-row items-center gap-2 w-full"
                                        >
                                            <input
                                                type="text"
                                                placeholder="Gasolina"
                                                className="w-full flex-1 border border-white rounded pl-2 py-1"
                                                value={gasto.nombre}
                                                onChange={(e) => handleGastoChange(idx, "nombre", e.target.value)}
                                                required
                                            />
                                            <input
                                                type="number"
                                                placeholder="20000"
                                                className="w-full flex-1 border border-white rounded pl-2 py-1"
                                                value={gasto.monto}
                                                onChange={(e) => handleGastoChange(idx, "monto", e.target.value)}
                                                required
                                            />
                                            <button
                                                type="button"
                                                className="w-auto px-3 py-1 text-white bg-red-500 rounded"
                                                onClick={() => eliminarGasto(idx)}
                                                disabled={gastos.length === 1}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}


                                    <button
                                        type="button"
                                        className="bg-blue-500 text-white px-2 py-1 rounded mt-2 w-fit"
                                        onClick={agregarGasto}
                                    >
                                        + Agregar gasto
                                    </button>
                                </div>

                        </div>
                        ) : (
                        <p className="text-white text-center">No se encontraron registros para esa fecha.</p>
                        )
                    ) : (
                        <p className="text-white text-center">Por favor completa los campos anteriores.</p>
                    )}
                </div>

                {/* Submit */}
                

                <div>
                    {vehiculoSeleccionado && fecha ? (
                        <button type="submit"
                            className="bg-green-500 hover:bg-green-700 duration-300 transition-all text-white font-semibold tracking-wider text-lg px-4 py-2 rounded mt-4 w-full"
                        >
                            Subir Nuevas Cuentas
                        </button>
                    ):(
                        <p className="text-white text-center mt-4">Completa todos los campos para subir cuentas.</p>
                    )}
                </div>
            </form>
        </div>
    );
}
