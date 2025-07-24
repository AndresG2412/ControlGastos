"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
// Importa addDoc para añadir documentos y doc para construir referencias de documentos
import { db, collection, getDocs, doc, setDoc } from "../../libs/firebase"; 
// Importa FieldValue para operaciones atómicas como incrementar, si decides usarlas más adelante
// import { FieldValue } from "firebase/firestore";

export default function Page() {
    const [vehiculos, setVehiculos] = useState([]);
    const [selectedVehiculoId, setSelectedVehiculoId] = useState("");
    const [gananciaBrutaDiaria, setGananciaBrutaDiaria] = useState(""); // Renombré para mayor claridad
    const [gastoGasolina, setGastoGasolina] = useState("");
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);

    // Estado para los gastos adicionales: solo 'nombre' y 'cantidad'
    const [gastosAdicionales, setGastosAdicionales] = useState([
        { nombre: "", cantidad: "" } // Un gasto adicional inicial vacío
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

    // ** 2. Función para añadir un nuevo campo de gasto adicional **
    const addGastoAdicionalField = () => {
        setGastosAdicionales([...gastosAdicionales, { nombre: "", cantidad: "" }]);
    };

    // ** 3. Función para eliminar un campo de gasto adicional **
    const removeGastoAdicionalField = (indexToRemove) => {
        setGastosAdicionales(gastosAdicionales.filter((_, index) => index !== indexToRemove));
    };

    // ** 4. Función para manejar cambios en los campos de gastos adicionales **
    const handleGastoAdicionalChange = (index, event) => {
        const { name, value } = event.target;
        const list = [...gastosAdicionales];
        list[index][name] = value; // 'name' será 'nombre' o 'cantidad'
        setGastosAdicionales(list);
    };

    // ** 5. Función para manejar el envío del formulario **
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedVehiculoId) {
            alert("Por favor, selecciona un vehículo.");
            return;
        }

        const gananciaBruta = parseFloat(gananciaBrutaDiaria || 0);
        const gastoCombustible = parseFloat(gastoGasolina || 0);

        // Validar que la ganancia bruta y el gasto de gasolina sean números válidos
        if (isNaN(gananciaBruta) || isNaN(gastoCombustible)) {
            alert("Por favor, ingresa valores numéricos válidos para Ganancia Diaria y Gasto de Gasolina.");
            return;
        }

        // Filtra los gastos adicionales que tienen datos válidos y los convierte a un formato numérico
        let totalGastosAdicionales = 0;
        const gastosAdicionalesValidos = gastosAdicionales.filter(gasto => 
            gasto.cantidad && parseFloat(gasto.cantidad) > 0 && gasto.nombre // Aseguramos que haya nombre y cantidad
        ).map(gasto => {
            const cantidadNum = parseFloat(gasto.cantidad);
            totalGastosAdicionales += cantidadNum; // Suma al total de gastos adicionales
            return {
                nombre: gasto.nombre,
                cantidad: cantidadNum,
                hora: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) // Hora actual para referencia
            };
        });

        // Calcula la ganancia neta restando la gasolina y los gastos adicionales
        const gananciaNetaCalculada = gananciaBruta - gastoCombustible - totalGastosAdicionales;

        // Datos del registro diario
        const registroDiario = {
            gananciaBrutaDiaria: gananciaBruta,
            gastoGasolina: gastoCombustible,
            // Puedes mantener descripcionGastoPrincipal si aún quieres una descripción para la gasolina
            // o eliminarla si no es necesaria. La quitaré para simplificar según tu request.
            // descripcionGastoPrincipal: descripcionGastoPrincipal, 
            gastosAdicionales: gastosAdicionalesValidos,
            totalGastosAdicionales: totalGastosAdicionales, // Guardamos el total sumado de los gastos adicionales
            gananciaNeta: gananciaNetaCalculada,
            fecha: fecha,
            timestampRegistro: new Date()
        };

        try {
            const registroRef = doc(db, 
                "Usuarios", 
                "3157870130", 
                "Vehiculos", 
                selectedVehiculoId, 
                "registros", 
                fecha 
            );

            await setDoc(registroRef, registroDiario, { merge: true }); 
            
            alert("Gasto diario registrado con éxito!");
            // Limpiar el formulario
            setGananciaBrutaDiaria("");
            setGastoGasolina("");
            setGastosAdicionales([{ nombre: "", cantidad: "" }]); // Reinicia a un campo vacío
            // setFecha(new Date().toISOString().split('T')[0]); // Opcional: resetear la fecha
            
        } catch (error) {
            console.error("Error al registrar el gasto:", error);
            alert("Error al registrar el gasto. Por favor, intenta de nuevo.");
        }
    };

    return (
        <div className='mt-24'>
            <Navbar />
            <form onSubmit={handleSubmit} className="w-10/12 gap-y-6 md:w-3/4 mx-auto flex flex-col items-center justify-center h-screen">
                <p className="text-3xl font-bold tracking-wider">Ingresar Gastos Diarios</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 items-center justify-center bg-white/5 py-10 px-6 mx-auto w-full rounded-lg"> {/* Añadí padding en x */}

                    {/* Selector de Vehículo */}
                    <div className="flex flex-col gap-2 w-full px-4"> {/* Añadí px */}
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
                    <div className="flex flex-col gap-2 w-full px-4"> {/* Añadí px */}
                        <label htmlFor="Fecha" className="font-semibold tracking-wide text-xl">Fecha: Hoy</label>
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

                    {/* Ganancia Diaria */}
                    <div className="flex flex-col gap-2 w-full px-4"> {/* Añadí px */}
                        <label htmlFor="Ganancia" className="font-semibold tracking-wide text-xl">Ganancia Diaria (Bruta):</label>
                        <input 
                            id="Ganancia" 
                            autoComplete="off" 
                            className="outline-none focus:ring-blue-500 focus:border-blue-500 block dark:focus:ring-blue-500 dark:focus:border-blue-500 border-white border-2 rounded-md py-1.5 pl-2 pr-7 tracking-wider w-full" 
                            type="number" 
                            placeholder="Ej: 150.000" 
                            required 
                            value={gananciaBrutaDiaria}
                            onChange={(e) => setGananciaBrutaDiaria(e.target.value)}
                        />
                    </div>

                    {/* Gasto de Gasolina Diaria */}
                    <div className="flex flex-col gap-2 w-full px-4"> {/* Añadí px */}
                        <label htmlFor="Gasolina" className="font-semibold tracking-wide text-xl">Gasto de Gasolina:</label>
                        <input 
                            id="Gasolina" 
                            autoComplete="off" 
                            className="outline-none focus:ring-blue-500 focus:border-blue-500 block dark:focus:ring-blue-500 dark:focus:border-blue-500 border-white border-2 rounded-md py-1.5 pl-2 pr-7 tracking-wider w-full" 
                            type="number" 
                            placeholder="Ej: 30.000" 
                            required 
                            value={gastoGasolina}
                            onChange={(e) => setGastoGasolina(e.target.value)}
                        />
                    </div>
                </div>
                    
                {/* --- Gastos Adicionales --- */}
                <div className="w-full mx-auto border-t-2 border-white/20 pt-5 mt-5 px-6"> {/* Añadí px */}
                    <p className="text-2xl font-bold tracking-wider mb-2 text-center">Gastos Adicionales del Día</p>
                    <p className="text-md text-center text-white/70 mb-4">(Estos gastos se restarán de la Ganancia Bruta del día)</p>
                    {gastosAdicionales.map((gasto, index) => (
                        <div key={index} className="flex flex-col md:flex-row gap-4 mb-4 p-3 border border-white/10 rounded-md items-center">
                            <div className="flex-1 flex flex-col gap-2 w-full">
                                <label htmlFor={`nombreGasto-${index}`} className="font-semibold tracking-wide">Nombre del Gasto:</label>
                                <input
                                    id={`nombreGasto-${index}`}
                                    name="nombre"
                                    autoComplete="off"
                                    className="outline-none focus:ring-blue-500 focus:border-blue-500 block dark:focus:ring-blue-500 dark:focus:border-blue-500 border-white border-2 rounded-md py-1.5 pl-2 pr-7 tracking-wider w-full"
                                    type="text"
                                    placeholder="Ej: Repuesto Llanta"
                                    value={gasto.nombre}
                                    onChange={(e) => handleGastoAdicionalChange(index, e)}
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
                                    onChange={(e) => handleGastoAdicionalChange(index, e)}
                                />
                            </div>
                            {gastosAdicionales.length > 1 && (
                                <button 
                                    type="button" 
                                    onClick={() => removeGastoAdicionalField(index)} 
                                    className="bg-red-500 text-white p-2 rounded-md self-end md:self-center hover:bg-red-600 transition-colors duration-300 w-full md:w-auto"
                                >
                                    Eliminar
                                </button>
                            )}
                        </div>
                    ))}
                    <button 
                        type="button" 
                        onClick={addGastoAdicionalField} 
                        className="bg-green-500 tracking-wider text-white font-semibold py-2 px-4 rounded-md w-full hover:bg-green-600 transition-colors duration-300 mt-2"
                    >
                        + Añadir Otro Gasto Extra
                    </button>
                </div>

                <button type="submit" className="bg-blue-500 tracking-wider text-white font-semibold py-2 px-4 rounded-md w-10/12 md:w-2/3 hover:bg-blue-600 transition-colors duration-300 mt-5">
                    Registrar Gasto del Día
                </button>
            </form>
        </div>
    );
}