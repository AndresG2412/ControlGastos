"use client";

import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { getAuth } from "firebase/auth";
import {
    collection,
    getDocs,
    deleteDoc,
    updateDoc,
    doc
} from "firebase/firestore";
import { db } from "@/libs/firebase";
import { useRouter } from "next/navigation";

export default function Page() {
    const router = useRouter();
    const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState(false);
    const [deudas, setDeudas] = useState([]);
    const [deudores, setDeudores] = useState([]);
    const [user, setUser] = useState(null);
    const [vehiculo, setVehiculo] = useState([]);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({ vehiculo: "" });

    // ✅ Usuario autenticado
    useEffect(() => {
        const auth = getAuth();
        const currentUser = auth.currentUser;
        if (currentUser) {
            setUser(currentUser);
        } else {
            alert("Tu sesión ha caducado. Por favor, inicia sesión nuevamente.");
            router.push("/");
        }
    }, []);

    // ✅ Obtener vehículos
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

    // ✅ Cargar deudas y deudores
    const handleVehiculoChange = async (e) => {
        const { value } = e.target;
        setData((prev) => ({ ...prev, vehiculo: value }));
        setVehiculoSeleccionado(true);

        if (!value) {
            setDeudas([]);
            setDeudores([]);
            return;
        }
        await cargarRegistros(value);
    };

    const cargarRegistros = async (placa) => {
        try {
            const deudasRef = collection(db, "users", user.uid, "Vehiculos", placa, "deudas");
            const deudoresRef = collection(db, "users", user.uid, "Vehiculos", placa, "deudores");

            const [deudasSnap, deudoresSnap] = await Promise.all([
                getDocs(deudasRef),
                getDocs(deudoresRef)
            ]);

            setDeudas(deudasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setDeudores(deudoresSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        } catch (error) {
            console.error("Error al cargar registros:", error);
        }
    };

    // 🗑 Eliminar documento
    const eliminarRegistro = async (tipo, id) => {
        try {
            await deleteDoc(doc(db, "users", user.uid, "Vehiculos", data.vehiculo, tipo, id));
            await cargarRegistros(data.vehiculo);
        } catch (err) {
            console.error("Error eliminando:", err);
        }
    };

    // ✅ Tachar (marcar como pagado)
    const tacharRegistro = async (tipo, id) => {
        try {
            const ref = doc(db, "users", user.uid, "Vehiculos", data.vehiculo, tipo, id);
            await updateDoc(ref, { pagado: true });
            await cargarRegistros(data.vehiculo);
        } catch (err) {
            console.error("Error actualizando:", err);
        }
    };

    const formDeudor = () => router.push("./deudores/formDeudor");
    const formDeuda = () => router.push("./deudores/formDeuda");

    const fila = (item, tipo) => (
        <tr key={item.id} className={item.pagado ? "text-green-600" : ""}>
            <td className="border px-3 py-2">{item.nombre || "-"}</td>
            <td className="border px-3 py-2">{item.monto || "-"}</td>
            <td className="border px-3 py-2">{item.inicio || "-"}</td>
            <td className="border px-3 py-2">{item.limite || "-"}</td>
            <td className="border px-3 py-2 flex gap-2">
                <button
                    onClick={() => tacharRegistro(tipo, item.id)}
                    className="bg-green-300 px-2 py-1 rounded"
                >
                    ✅
                </button>
                <button
                    onClick={() => eliminarRegistro(tipo, item.id)}
                    className="bg-red-300 px-2 py-1 rounded"
                >
                    🗑
                </button>
            </td>
        </tr>
    );
    const toggleTachado = async (tipo, placa, id, estadoActual) => {
        try {
            const ref = doc(db, "users", user.uid, "Vehiculos", placa, tipo === "Deuda" ? "deudas" : "deudores", id);
            await updateDoc(ref, {
                estado: estadoActual === "tachado" ? "normal" : "tachado"
            });
            cargarRegistros(placa); // recargar la tabla
        } catch (error) {
            console.error("Error al actualizar estado:", error);
        }
    };


    return (
        <div>
            <Navbar />

            {/* Selector de vehículo */}
            <div className="flex items-center justify-center w-full max-w-md mx-auto mb-6 mt-24">
                <p className="font-semibold text-xl mr-4">Carro: </p>
                {loading ? (
                    <p>Cargando...</p>
                ) : vehiculo.length === 0 ? (
                    <p>No hay vehículos.</p>
                ) : (
                    <select
                        value={data.vehiculo}
                        onChange={handleVehiculoChange}
                        className="w-64 border p-2 rounded bg-white text-black"
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

            {vehiculoSeleccionado && (
                <div className="flex flex-col items-center w-full max-w-5xl mx-auto mb-6">
                    {/* Tabla de Deudores */}
                    <p className="font-semibold text-lg mt-4 mb-2">Lista de Deudores</p>
                    <table className="w-full border-collapse border border-gray-300 text-left mb-6">
                        <thead>
                            <tr>
                                <th className="border px-3 py-2">Nombre</th>
                                <th className="border px-3 py-2">Monto</th>
                                <th className="border px-3 py-2">Inicio</th>
                                <th className="border px-3 py-2">Límite</th>
                                <th className="border px-3 py-2">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deudores.length > 0 ? deudores.map(item => fila(item, "deudores")) : (
                                <tr><td colSpan="5" className="text-center">Sin deudores</td></tr>
                            )}
                        </tbody>
                    </table>

                    {/* Tabla de Deudas */}
                    <p className="font-semibold text-lg mt-4 mb-2">Lista de Deudas</p>
                    <table className="w-full border-collapse border border-gray-300 text-left">
                        <thead>
                            <tr>
                                <th className="border px-3 py-2">Nombre</th>
                                <th className="border px-3 py-2">Monto</th>
                                <th className="border px-3 py-2">Inicio</th>
                                <th className="border px-3 py-2">Límite</th>
                                <th className="border px-3 py-2">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deudas.length > 0 ? deudas.map(item => fila(item, "deudas")) : (
                                <tr><td colSpan="5" className="text-center">Sin deudas</td></tr>
                            )}
                        </tbody>
                    </table>

                    {/* Botones agregar */}
                    <div className="flex gap-4 mt-6">
                        <button onClick={formDeudor} className="bg-green-400 py-2 px-4 rounded font-semibold">
                            Agregar Deudor
                        </button>
                        <button onClick={formDeuda} className="bg-blue-400 py-2 px-4 rounded font-semibold">
                            Agregar Deuda
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
