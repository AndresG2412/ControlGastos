"use client";

import { useEffect, useState, useCallback } from "react"; // Agregamos useCallback
import Navbar from "../components/Navbar";
import { db, collection, getDocs, doc, setDoc, getDoc } from "../../libs/firebase"; // Importamos getDoc

export default function Page() {
    const [vehiculos, setVehiculos] = useState([]);
    const [selectedVehiculoId, setSelectedVehiculoId] = useState("");
    const [gananciaBrutaDiariaInput, setGananciaBrutaDiariaInput] = useState(""); // Input para la nueva ganancia
    const [gastoGasolinaInput, setGastoGasolinaInput] = useState(""); // Input para el nuevo gasto de gasolina
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);

    // Estados para los valores ACUMULADOS del día (lo que ya está en Firestore)
    const [currentGananciaBruta, setCurrentGananciaBruta] = useState(0);
    const [currentGastoGasolina, setCurrentGastoGasolina] = useState(0);
    const [currentGastosAdicionales, setCurrentGastosAdicionales] = useState([]);

    // Estado para los NUEVOS gastos adicionales que se van a añadir en esta sesión
    const [nuevosGastosAdicionales, setNuevosGastosAdicionales] = useState([
        { nombre: "", cantidad: "" } // Un gasto adicional inicial vacío para nuevas entradas
    ]);

    // ** 1. Obtener los vehículos del usuario **
    useEffect(() => {
        const obtenerVehiculos = async () => {
            try {
                const ref = collection(db, "Usuarios", "3157870130", "Vehiculos");
                const snapshot = await getDocs(ref);
                const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setVehiculos(lista);
                if (lista.length > 0) {
                    setSelectedVehiculoId(lista[0].id); // Selecciona el primero por defecto
                }
            } catch (e) {
                console.error("Error al obtener vehículos:", e);
                setVehiculos([]);
            }
        };
        obtenerVehiculos();
    }, []);

    // ** 2. Función para cargar los datos del día seleccionado **
    const cargarDatosDelDia = useCallback(async () => {
        if (!selectedVehiculoId || !fecha) {
            setCurrentGananciaBruta(0);
            setCurrentGastoGasolina(0);
            setCurrentGastosAdicionales([]);
            return;
        }

        try {
            const registroRef = doc(db, 
                "Usuarios", 
                "3157870130", 
                "Vehiculos", 
                selectedVehiculoId, 
                "registros", 
                fecha 
            );
            const docSnap = await getDoc(registroRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                setCurrentGananciaBruta(data.gananciaBrutaDiaria || 0);
                setCurrentGastoGasolina(data.gastoGasolina || 0);
                setCurrentGastosAdicionales(data.gastosAdicionales || []);
            } else {
                // Si no hay datos para el día, inicializa a 0
                setCurrentGananciaBruta(0);
                setCurrentGastoGasolina(0);
                setCurrentGastosAdicionales([]);
            }
        } catch (error) {
            console.error("Error al cargar los datos del día:", error);
            alert("Error al cargar los datos del día. Por favor, intenta de nuevo.");
            setCurrentGananciaBruta(0);
            setCurrentGastoGasolina(0);
            setCurrentGastosAdicionales([]);
        }
    }, [selectedVehiculoId, fecha]);

    // Cargar datos cuando cambie el vehículo o la fecha
    useEffect(() => {
        cargarDatosDelDia();
    }, [selectedVehiculoId, fecha, cargarDatosDelDia]);

    // ** 3. Función para añadir un nuevo campo de gasto adicional (para esta sesión) **
    const addNuevoGastoAdicionalField = () => {
        setNuevosGastosAdicionales([...nuevosGastosAdicionales, { nombre: "", cantidad: "" }]);
    };

    // ** 4. Función para eliminar un campo de gasto adicional (de los nuevos a añadir) **
    const removeNuevoGastoAdicionalField = (indexToRemove) => {
        setNuevosGastosAdicionales(nuevosGastosAdicionales.filter((_, index) => index !== indexToRemove));
    };

    // ** 5. Función para manejar cambios en los campos de los nuevos gastos adicionales **
    const handleNuevoGastoAdicionalChange = (index, event) => {
        const { name, value } = event.target;
        const list = [...nuevosGastosAdicionales];
        list[index][name] = value;
        setNuevosGastosAdicionales(list);
    };

    // ** 6. Función para manejar el envío del formulario **
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedVehiculoId) {
            alert("Por favor, selecciona un vehículo.");
            return;
        }

        const nuevaGananciaBruta = parseFloat(gananciaBrutaDiariaInput || 0);
        const nuevoGastoCombustible = parseFloat(gastoGasolinaInput || 0);

        if (isNaN(nuevaGananciaBruta) || isNaN(nuevoGastoCombustible)) {
            alert("Por favor, ingresa valores numéricos válidos para Ganancia Diaria y Gasto de Gasolina.");
            return;
        }

        // Obtener los datos actuales del día antes de actualizar (por si acaso han cambiado desde la carga inicial)
        const registroRef = doc(db, 
            "Usuarios", 
            "3157870130", 
            "Vehiculos", 
            selectedVehiculoId, 
            "registros", 
            fecha 
        );
        const docSnap = await getDoc(registroRef);
        let datosExistentes = docSnap.exists() ? docSnap.data() : {
            gananciaBrutaDiaria: 0,
            gastoGasolina: 0,
            gastosAdicionales: []
        };

        // Suma los nuevos valores a los existentes
        const totalGananciaBruta = datosExistentes.gananciaBrutaDiaria + nuevaGananciaBruta;
        const totalGastoGasolina = datosExistentes.gastoGasolina + nuevoGastoCombustible;

        // Filtra y añade los nuevos gastos adicionales válidos a la lista existente
        const nuevosGastosValidos = nuevosGastosAdicionales.filter(gasto => 
            gasto.cantidad && parseFloat(gasto.cantidad) > 0 && gasto.nombre 
        ).map(gasto => ({
            nombre: gasto.nombre,
            cantidad: parseFloat(gasto.cantidad),
            hora: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
        }));
        
        const todosLosGastosAdicionales = [...datosExistentes.gastosAdicionales, ...nuevosGastosValidos];

        // Recalcular el total de gastos adicionales a partir de la lista completa
        const totalGastosAdicionales = todosLosGastosAdicionales.reduce((sum, gasto) => sum + gasto.cantidad, 0);

        // Calcula la ganancia neta con los totales acumulados
        const gananciaNetaCalculada = totalGananciaBruta - totalGastoGasolina - totalGastosAdicionales;

        const registroDiarioActualizado = {
            gananciaBrutaDiaria: totalGananciaBruta,
            gastoGasolina: totalGastoGasolina,
            gastosAdicionales: todosLosGastosAdicionales,
            totalGastosAdicionales: totalGastosAdicionales,
            gananciaNeta: gananciaNetaCalculada,
            fecha: fecha,
            timestampRegistro: new Date() // Actualiza el timestamp del último registro
        };

        try {
            await setDoc(registroRef, registroDiarioActualizado, { merge: false }); // merge: false para sobreescribir con los nuevos totales
                                                                                     // Si usáramos merge:true, tendríamos que ser muy cuidadosos con los arrays
                                                                                     // y los incrementos atómicos para los números.
                                                                                     // Es más seguro recalcular y sobreescribir el documento completo del día.
            
            alert("Registro diario actualizado con éxito!");
            // Limpiar los campos de entrada y recargar los datos actuales
            setGananciaBrutaDiariaInput("");
            setGastoGasolinaInput("");
            setNuevosGastosAdicionales([{ nombre: "", cantidad: "" }]); // Reinicia un campo vacío para nuevos gastos
            cargarDatosDelDia(); // Recarga los datos para que el usuario vea los nuevos totales

        } catch (error) {
            console.error("Error al registrar/actualizar el gasto:", error);
            alert("Error al registrar/actualizar el gasto. Por favor, intenta de nuevo.");
        }
    };

    return (
        <div className='mt-24'>
            <Navbar />
            <form onSubmit={handleSubmit} className="w-10/12 gap-y-6 md:w-3/4 mx-auto flex flex-col items-center justify-center min-h-screen py-10">
                <p className="text-3xl font-bold tracking-wider mb-8">Ingresar/Actualizar Gastos Diarios</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 items-center justify-center bg-white/5 py-10 px-6 mx-auto w-full rounded-lg">
                    {/* Selector de Vehículo */}
                    <div className="flex flex-col gap-2 w-full px-4">
                        <label htmlFor="Carro" className="font-semibold tracking-wide text-xl">Selecciona el Vehículo:</label>
                        <select 
                            id="Carro" 
                            autoComplete="off" 
                            className="focus:bg-black outline-none focus:ring-blue-500 focus:border-blue-500 block dark:focus:ring-blue-500 dark:focus:border-blue-500 border-white border-2 rounded-md py-1.5 pl-2 pr-7 tracking-wider w-full" 
                            required
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
                        <label htmlFor="Fecha" className="font-semibold tracking-wide text-xl">Fecha:</label>
                        <input
                            id="Fecha"
                            value={fecha}
                            onChange={(e) => setFecha(e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                            autoComplete="off"
                            className="outline-none focus:ring-blue-500 focus:border-blue-500 block dark:focus:ring-blue-500 dark:focus:border-blue-500 border-white border-2 rounded-md py-1.5 pl-2 pr-7 tracking-wider w-full"
                            type="date"
                            required
                        />
                    </div>
                </div>

                <div className="w-full bg-white/5 py-8 px-6 mx-auto rounded-lg mt-6">
                    <p className="text-2xl font-bold tracking-wider mb-4 text-center">Resumen del Día ({fecha})</p>
                    <p className="text-xl text-white/80 mb-2">Ganancia Bruta Acumulada: **${currentGananciaBruta.toLocaleString('es-CO')}**</p>
                    <p className="text-xl text-white/80 mb-2">Gasto Gasolina Acumulado: **${currentGastoGasolina.toLocaleString('es-CO')}**</p>
                    <p className="text-xl text-white/80 mb-2">Total Gastos Adicionales: **${currentGastosAdicionales.reduce((sum, g) => sum + g.cantidad, 0).toLocaleString('es-CO')}**</p>
                    <p className="text-2xl font-bold text-green-400 mt-4">Ganancia Neta Actual: **${(currentGananciaBruta - currentGastoGasolina - currentGastosAdicionales.reduce((sum, g) => sum + g.cantidad, 0)).toLocaleString('es-CO')}**</p>
                </div>
                
                <div className="w-full bg-white/5 py-8 px-6 mx-auto rounded-lg mt-6">
                    <p className="text-2xl font-bold tracking-wider mb-4 text-center">Nuevos Ingresos/Gastos para Añadir</p>

                    {/* Nueva Ganancia Diaria */}
                    <div className="flex flex-col gap-2 w-full px-4 mb-5">
                        <label htmlFor="Ganancia" className="font-semibold tracking-wide text-xl">Añadir Ganancia Bruta:</label>
                        <input 
                            id="Ganancia" 
                            autoComplete="off" 
                            className="outline-none focus:ring-blue-500 focus:border-blue-500 block dark:focus:ring-blue-500 dark:focus:border-blue-500 border-white border-2 rounded-md py-1.5 pl-2 pr-7 tracking-wider w-full" 
                            type="number" 
                            placeholder="Ej: 50.000 (se sumará al total)" 
                            value={gananciaBrutaDiariaInput}
                            onChange={(e) => setGananciaBrutaDiariaInput(e.target.value)}
                        />
                    </div>

                    {/* Nuevo Gasto de Gasolina Diaria */}
                    <div className="flex flex-col gap-2 w-full px-4 mb-5">
                        <label htmlFor="Gasolina" className="font-semibold tracking-wide text-xl">Añadir Gasto de Gasolina:</label>
                        <input 
                            id="Gasolina" 
                            autoComplete="off" 
                            className="outline-none focus:ring-blue-500 focus:border-blue-500 block dark:focus:ring-blue-500 dark:focus:border-blue-500 border-white border-2 rounded-md py-1.5 pl-2 pr-7 tracking-wider w-full" 
                            type="number" 
                            placeholder="Ej: 10.000 (se sumará al total)" 
                            value={gastoGasolinaInput}
                            onChange={(e) => setGastoGasolinaInput(e.target.value)}
                        />
                    </div>
                </div>
                    
                {/* --- Nuevos Gastos Adicionales --- */}
                <div className="w-full bg-white/5 py-8 px-6 mx-auto rounded-lg mt-6">
                    <p className="text-2xl font-bold tracking-wider mb-2 text-center">Añadir Gastos Adicionales</p>
                    <p className="text-md text-center text-white/70 mb-4">(Estos gastos se añadirán a la lista y se restarán de la ganancia bruta)</p>
                    {nuevosGastosAdicionales.map((gasto, index) => (
                        <div key={index} className="flex flex-col md:flex-row gap-4 mb-4 p-3 border border-white/10 rounded-md items-center">
                            <div className="flex-1 flex flex-col gap-2 w-full">
                                <label htmlFor={`nombreGasto-${index}`} className="font-semibold tracking-wide">Nombre del Gasto:</label>
                                <input
                                    id={`nombreGasto-${index}`}
                                    name="nombre"
                                    autoComplete="off"
                                    className="outline-none focus:ring-blue-500 focus:border-blue-500 block dark:focus:ring-blue-500 dark:focus:border-blue-500 border-white border-2 rounded-md py-1.5 pl-2 pr-7 tracking-wider w-full"
                                    type="text"
                                    placeholder="Ej: Lavado Carro"
                                    value={gasto.nombre}
                                    onChange={(e) => handleNuevoGastoAdicionalChange(index, e)}
                                />
                            </div>
                            <div className="flex-1 flex flex-col gap-2 w-full">
                                <label htmlFor={`cantidadGasto-${index}`} className="font-semibold tracking-wide">Cantidad:</label>
                                <input
                                    id={`cantidadGasto-${index}`}
                                    name="cantidad"
                                    autoComplete="off"
                                    className="outline-none focus:ring-blue-500 focus:border-blue-500 block dark:focus:ring-blue-500 dark:focus:border-blue-500 border-white border-2 rounded-md py-1.5 pl-2 pr-7 tracking-wider w-full"
                                    type="number"
                                    placeholder="Ej: 15.000"
                                    value={gasto.cantidad}
                                    onChange={(e) => handleNuevoGastoAdicionalChange(index, e)}
                                />
                            </div>
                            {nuevosGastosAdicionales.length > 1 && (
                                <button 
                                    type="button" 
                                    onClick={() => removeNuevoGastoAdicionalField(index)} 
                                    className="bg-red-500 text-white p-2 rounded-md self-end md:self-center hover:bg-red-600 transition-colors duration-300 w-full md:w-auto"
                                >
                                    Eliminar
                                </button>
                            )}
                        </div>
                    ))}
                    <button 
                        type="button" 
                        onClick={addNuevoGastoAdicionalField} 
                        className="bg-green-500 tracking-wider text-white font-semibold py-2 px-4 rounded-md w-full hover:bg-green-600 transition-colors duration-300 mt-2"
                    >
                        + Añadir Otro Gasto Extra
                    </button>
                </div>

                <button type="submit" className="bg-blue-500 tracking-wider text-white font-semibold py-2 px-4 rounded-md w-10/12 md:w-2/3 hover:bg-blue-600 transition-colors duration-300 mt-5">
                    Actualizar Registro del Día
                </button>
            </form>
        </div>
    );
}