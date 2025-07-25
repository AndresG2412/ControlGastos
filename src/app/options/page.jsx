// pages/ediciones.jsx
"use client";

import { useEffect, useState, useCallback } from "react";
import Navbar from "../components/Navbar";
import { db, collection, getDocs, doc, getDoc, setDoc } from "../../libs/firebase"; // Importamos setDoc para actualizar

export default function EdicionesPage() {
    const [registros, setRegistros] = useState([]);
    const [vehiculos, setVehiculos] = useState([]);
    const [selectedVehiculoId, setSelectedVehiculoId] = useState("");
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // Fecha por defecto hoy

    // Función para obtener los vehículos
    useEffect(() => {
        const fetchVehicles = async () => {
            try {
                const vehiclesColRef = collection(db, "Usuarios", "3157870130", "Vehiculos");
                const vehicleSnapshot = await getDocs(vehiclesColRef);
                const vehiclesList = vehicleSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                setVehiculos(vehiclesList);
                if (vehiclesList.length > 0) {
                    setSelectedVehiculoId(vehiclesList[0].id); // Selecciona el primero por defecto
                }
            } catch (error) {
                console.error("Error al cargar vehículos:", error);
            }
        };
        fetchVehicles();
    }, []);

    // Función para cargar los registros de un vehículo y fecha específicos
    const fetchRegistros = useCallback(async () => {
        if (!selectedVehiculoId || !selectedDate) {
            setRegistros([]);
            return;
        }

        try {
            const registroRef = doc(db, 
                "Usuarios", 
                "3157870130", 
                "Vehiculos", 
                selectedVehiculoId, 
                "registros", 
                selectedDate 
            );
            const docSnap = await getDoc(registroRef);

            if (docSnap.exists()) {
                setRegistros([docSnap.data()]); // Lo ponemos en un array para que sea consistente con map
            } else {
                setRegistros([]);
            }
        } catch (error) {
            console.error("Error al obtener el registro diario:", error);
            setRegistros([]);
        }
    }, [selectedVehiculoId, selectedDate]); // Dependencias para useCallback

    // Cargar registros cuando cambie el vehículo o la fecha
    useEffect(() => {
        fetchRegistros();
    }, [fetchRegistros]); // Dependencia de fetchRegistros (que es useCallback)

    // Función para editar un gasto adicional
    const handleEditGastoAdicional = async (registroFecha, gastoIndex, newName, newAmount) => {
        if (!selectedVehiculoId || !registroFecha) return;

        try {
            const registroRef = doc(db, 
                "Usuarios", 
                "3157870130", 
                "Vehiculos", 
                selectedVehiculoId, 
                "registros", 
                registroFecha 
            );
            const docSnap = await getDoc(registroRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                let updatedGastosAdicionales = [...(data.gastosAdicionales || [])];

                // Actualizar el gasto específico
                if (gastoIndex >= 0 && gastoIndex < updatedGastosAdicionales.length) {
                    updatedGastosAdicionales[gastoIndex] = { 
                        ...updatedGastosAdicionales[gastoIndex], 
                        nombre: newName, 
                        cantidad: parseFloat(newAmount || 0) 
                    };
                } else {
                    alert("Índice de gasto no válido.");
                    return;
                }

                // Recalcular el total de gastos adicionales
                const newTotalGastosAdicionales = updatedGastosAdicionales.reduce((sum, g) => sum + g.cantidad, 0);

                // Recalcular la ganancia neta con los nuevos totales
                const newGananciaNeta = (data.gananciaBrutaDiaria || 0) - (data.gastoGasolina || 0) - newTotalGastosAdicionales;

                // Actualizar el documento en Firestore
                await setDoc(registroRef, { 
                    gastosAdicionales: updatedGastosAdicionales, 
                    totalGastosAdicionales: newTotalGastosAdicionales,
                    gananciaNeta: newGananciaNeta,
                    timestampRegistro: new Date() // Opcional: actualizar timestamp de modificación
                }, { merge: true }); // Usamos merge:true para actualizar solo estos campos

                alert("Gasto adicional editado con éxito.");
                fetchRegistros(); // Recargar los datos para actualizar la UI
            } else {
                alert("Registro no encontrado para editar.");
            }
        } catch (error) {
            console.error("Error al editar gasto adicional:", error);
            alert("Error al editar el gasto adicional. Por favor, intenta de nuevo.");
        }
    };

    // Función para eliminar un gasto adicional
    const handleDeleteGastoAdicional = async (registroFecha, gastoIndex) => {
        if (!selectedVehiculoId || !registroFecha) return;

        if (!confirm("¿Estás seguro de que quieres eliminar este gasto adicional?")) {
            return; // El usuario canceló
        }

        try {
            const registroRef = doc(db, 
                "Usuarios", 
                "3157870130", 
                "Vehiculos", 
                selectedVehiculoId, 
                "registros", 
                registroFecha 
            );
            const docSnap = await getDoc(registroRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                let updatedGastosAdicionales = (data.gastosAdicionales || []).filter((_, i) => i !== gastoIndex);

                // Recalcular el total de gastos adicionales
                const newTotalGastosAdicionales = updatedGastosAdicionales.reduce((sum, g) => sum + g.cantidad, 0);

                // Recalcular la ganancia neta con los nuevos totales
                const newGananciaNeta = (data.gananciaBrutaDiaria || 0) - (data.gastoGasolina || 0) - newTotalGastosAdicionales;

                // Actualizar el documento en Firestore
                await setDoc(registroRef, { 
                    gastosAdicionales: updatedGastosAdicionales, 
                    totalGastosAdicionales: newTotalGastosAdicionales,
                    gananciaNeta: newGananciaNeta,
                    timestampRegistro: new Date() // Opcional: actualizar timestamp de modificación
                }, { merge: true });

                alert("Gasto adicional eliminado con éxito.");
                fetchRegistros(); // Recargar los datos para actualizar la UI
            } else {
                alert("Registro no encontrado para eliminar.");
            }
        } catch (error) {
            console.error("Error al eliminar gasto adicional:", error);
            alert("Error al eliminar el gasto adicional. Por favor, intenta de nuevo.");
        }
    };

    return (
        <div className='mt-24'>
            <Navbar />
            <div className="w-10/12 md:w-3/4 mx-auto py-10">
                <p className="text-3xl font-bold tracking-wider text-center mb-8">Edición de Registros Diarios</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 items-center justify-center bg-white/5 py-10 px-6 mx-auto w-full rounded-lg mb-8">
                    {/* Selector de Vehículo */}
                    <div className="flex flex-col gap-2 w-full px-4">
                        <label htmlFor="CarroEdicion" className="font-semibold tracking-wide text-xl">Selecciona el Vehículo:</label>
                        <select 
                            id="CarroEdicion" 
                            className="focus:bg-black outline-none focus:ring-blue-500 focus:border-blue-500 block dark:focus:ring-blue-500 dark:focus:border-blue-500 border-white border-2 rounded-md py-1.5 pl-2 pr-7 tracking-wider w-full" 
                            value={selectedVehiculoId}
                            onChange={(e) => setSelectedVehiculoId(e.target.value)}
                        >
                            <option value="">Selecciona...</option>
                            {vehiculos.map((veh) => (
                                <option key={veh.id} value={veh.id}>
                                    {veh.nombre || veh.placa || veh.id}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Campo de Fecha */}
                    <div className="flex flex-col gap-2 w-full px-4">
                        <label htmlFor="FechaEdicion" className="font-semibold tracking-wide text-xl">Selecciona la Fecha:</label>
                        <input
                            id="FechaEdicion"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                            className="outline-none focus:ring-blue-500 focus:border-blue-500 block dark:focus:ring-blue-500 dark:focus:border-blue-500 border-white border-2 rounded-md py-1.5 pl-2 pr-7 tracking-wider w-full"
                            type="date" // ¡Aquí el cambio clave!
                        />
                    </div>
                </div>

                {registros.length > 0 ? (
                    registros.map((registro, regIndex) => (
                        <div key={regIndex} className="bg-white/5 p-6 rounded-lg mb-6">
                            <h2 className="text-2xl font-bold mb-4 text-center">Registro del {registro.fecha}</h2>
                            <p className="text-xl mb-2">**Ganancia Bruta:** ${registro.gananciaBrutaDiaria.toLocaleString('es-CO')}</p>
                            <p className="text-xl mb-2">**Gasto de Gasolina:** ${registro.gastoGasolina.toLocaleString('es-CO')}</p>
                            <p className="text-xl mb-4">**Ganancia Neta:** <span className="font-bold text-green-400">${registro.gananciaNeta.toLocaleString('es-CO')}</span></p>

                            <h3 className="text-xl font-semibold mt-6 mb-3">Gastos Adicionales:</h3>
                            {registro.gastosAdicionales && registro.gastosAdicionales.length > 0 ? (
                                <ul>
                                    {registro.gastosAdicionales.map((gasto, gastoIndex) => (
                                        <li key={gastoIndex} className="flex flex-col md:flex-row items-center justify-between bg-white/10 p-3 rounded-md mb-2">
                                            <span>
                                                **{gasto.nombre}**: ${gasto.cantidad.toLocaleString('es-CO')} ({gasto.hora})
                                            </span>
                                            <div className="flex gap-2 mt-2 md:mt-0">
                                                <button 
                                                    onClick={() => {
                                                        // Usamos un modal o un input en línea para una mejor UX que prompt()
                                                        const newName = prompt("Nuevo nombre para el gasto:", gasto.nombre);
                                                        const newAmount = prompt("Nueva cantidad para el gasto:", gasto.cantidad);
                                                        if (newName !== null && newAmount !== null) { // prompt devuelve null si se cancela
                                                            handleEditGastoAdicional(registro.fecha, gastoIndex, newName, newAmount);
                                                        }
                                                    }}
                                                    className="bg-yellow-600 text-white px-3 py-1 rounded-md hover:bg-yellow-700 transition-colors"
                                                >
                                                    Editar
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteGastoAdicional(registro.fecha, gastoIndex)}
                                                    className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 transition-colors"
                                                >
                                                    Eliminar
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p>No hay gastos adicionales registrados para este día.</p>
                            )}
                        </div>
                    ))
                ) : (
                    <p className="text-center text-xl text-white/70">Selecciona un vehículo y una fecha para ver el registro.</p>
                )}
            </div>
        </div>
    );
}