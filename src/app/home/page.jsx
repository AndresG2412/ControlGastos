"use client";

// hacer la tabla mensual una sola tabla

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
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

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Page() {
    const router = useRouter();

    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [vehiculo, setVehiculo] = useState([]);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({ vehiculo: "" , fecha: "", mes: ""});
    const [cajaInicial, setCajaInicial] = useState(0);

    const [registros, setRegistros] = useState([]);

    const [mesSeleccionado, setMesSeleccionado] = useState(false);
    
    // Aquí guardaremos todos los registros del mes para la gráfica
    const [registrosMensuales, setRegistrosMensuales] = useState([]);

    // Nuevos estados para los totales mensuales
    const [gananciaBrutaMensual, setGananciaBrutaMensual] = useState(0);
    const [gastosMensual, setGastosMensual] = useState(0);
    const [gananciaNetaMensual, setGananciaNetaMensual] = useState(0);
    
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
    };

    const handleFechaChange = async (e) => {
        const { value } = e.target;
        setData((prev) => ({ ...prev, fecha: value }));

        if (user && data.vehiculo && value) {
            try {
                const ref = doc(
                    db,
                    "users",
                    user.uid,
                    "Vehiculos",
                    data.vehiculo,
                    "registros",
                    value
                );

                const snapshot = await getDoc(ref);

                if (snapshot.exists()) {
                    setRegistros([{
                        id: snapshot.id,
                        ...snapshot.data()
                    }]);
                } else {
                    setRegistros([]);
                }
            } catch (err) {
                console.error("Error al obtener registros:", err);
                setRegistros([]);
            }
        }
    };

// Función actualizada para manejar el cambio de mes
    const handleMesChange = async (e) => {
        const { value } = e.target; // '2025-08'
        setData((prev) => ({ ...prev, mes: value, fecha: "" })); // Limpiamos el día al seleccionar un mes
        setMesSeleccionado(true);

        if (user && data.vehiculo && value) {
            try {
                // 1. Obtenemos el año y mes del input
                const [year, month] = value.split('-');
                
                // 2. Construimos las cadenas de inicio y fin para la consulta de rango
                const primerDiaMes = `${year}-${month}-01`;
                const ultimoDiaMes = `${year}-${month}-31`; // Usamos 31 como valor seguro

                // 3. Realizamos la consulta a Firestore para obtener todos los registros del mes
                const registrosRef = collection(db, `users/${user.uid}/Vehiculos/${data.vehiculo}/registros`);
                const q = query(
                    registrosRef,
                    where(documentId(), '>=', primerDiaMes),
                    where(documentId(), '<=', ultimoDiaMes)
                );
                
                const snapshot = await getDocs(q);
                const listaRegistros = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setRegistrosMensuales(listaRegistros);

                // 4. Obtenemos la caja inicial
                const configRef = doc(db, `users/${user.uid}/Vehiculos/${data.vehiculo}/configuracion/datos`);
                const configSnapshot = await getDoc(configRef);
                const cajaInicialValue = configSnapshot.exists() ? configSnapshot.data().cajaInicial : 0;
                setCajaInicial(cajaInicialValue);

            } catch (err) {
                console.error("Error al obtener registros mensuales:", err);
                setRegistrosMensuales([]);
                setMesSeleccionado(false);
            }
        }
    };

    // 5. useMemo para calcular los totales mensuales
    useMemo(() => {
        if (registrosMensuales.length > 0) {
            let totalBruto = 0;
            let totalGastos = 0;
            let totalNeta = 0;

            registrosMensuales.forEach(registro => {
                totalBruto += registro.gananciaBruta || 0;
                const gastosDelDia = registro.gastos?.reduce((sum, g) => sum + Number(g.monto), 0) || 0;
                totalGastos += gastosDelDia;
                totalNeta += (registro.gananciaBruta || 0) - gastosDelDia;
            });

            setGananciaBrutaMensual(totalBruto);
            setGastosMensual(totalGastos);
            setGananciaNetaMensual(totalNeta);
        } else {
            setGananciaBrutaMensual(0);
            setGastosMensual(0);
            setGananciaNetaMensual(0);
        }
    }, [registrosMensuales]);

    // 4️⃣ Preparar datos para Chart.js tabla diaria
    const chartData = {
        labels: registros.map((registro) => {
            const nombresGastos = registro.gastos?.map((g) => g.nombre).join(", ") || "Sin gastos";
            return `${nombresGastos}`;
        }),
        datasets: [
            {
                label: "Ganancia Bruta",
                backgroundColor: "#34D399",
                data: registros.map((r) => r.gananciaBruta || 0),
            },
            {
                label: "Total Gastos",
                backgroundColor: "#F87171",
                data: registros.map((r) =>
                    r.gastos?.reduce((total, g) => total + Number(g.monto), 0)
                ),
            },
            {
                label: "Ganancia Neta",
                backgroundColor: "#60A5FA",
                data: registros.map((r) => r.gananciaNeta || 0),
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { position: "top" },
        },
        scales: {
            x: {
            ticks: {
                callback: function (val) {
                // Devuelve el texto tal cual (respetando el salto de línea)
                return this.getLabelForValue(val);
                },
                autoSkip: false,
                maxRotation: 0,
                minRotation: 0,
            },
            },
        },
    };

    const gananciaNetaTotal = useMemo(() => {
        return registros.reduce((total, r) => {
            const gastos = r.gastos?.reduce((sum, g) => sum + Number(g.monto), 0) || 0;
            const neta = (r.gananciaBruta || 0) - gastos;
            return total + neta;
        }, 0);
    }, [registros]);

    // tabla semanal

    // 4️⃣ Preparar datos para Chart.js tabla diaria
    // Nuevos datos para la gráfica mensual
    const chartDataMes = {
        labels: registrosMensuales.map(r => r.id),
        datasets: [
            {
                label: "Ganancia Bruta",
                backgroundColor: "#34D399",
                data: registrosMensuales.map(r => r.gananciaBruta || 0),
            },
            {
                label: "Total Gastos",
                backgroundColor: "#F87171",
                data: registrosMensuales.map(r => r.gastos?.reduce((total, g) => total + Number(g.monto), 0) || 0),
            },
            {
                label: "Ganancia Neta",
                backgroundColor: "#60A5FA",
                data: registrosMensuales.map(r => r.gananciaNeta || 0),
            },
        ],
    };

    const chartOptionsMes = {
        
        responsive: true,
        plugins: {
            legend: { position: "top" },
        },
        scales: {
            x: {
            ticks: {
                callback: function (val) {
                // Devuelve el texto tal cual (respetando el salto de línea)
                return this.getLabelForValue(val);
                },
                autoSkip: false,
                maxRotation: 0,
                minRotation: 0,
            },
            },
        },
    };

    const gananciaNetaTotalMes = useMemo(() => {
        return 0;
    }, []);

    const gastosTotalMes = useMemo(() => {
        return 0;
    }, []);

    return (
        <div className="mt-24 text-white px-4">
            <Navbar />

            <div className="flex items-center justify-center w-full max-w-md mx-auto mb-6">
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

            <div className="flex items-center justify-center w-full max-w-md mx-auto mb-6">
                <p className="font-semibold tracking-wider text-xl mr-4">Fecha: </p>
                <input
                    value={data.fecha}
                    onChange={handleFechaChange}
                    type="date"
                    className="rounded p-1 w-64 text-black bg-white"
                />            
            </div>

            {registros.length ? (
                <div className="w-full max-w-4xl mx-auto mb-10 bg-white/10 rounded px-1 py-4 md:p-5">
                    <p className="text-center text-3xl tracking-wider font-bold">Tabla Diaria {data.fecha}</p>
                    <Bar data={chartData} options={chartOptions} className="p-1 md:p-4"/>
                    <p className="text-center text-2xl font-semibold mt-4">
                        Ganancia Neta: ${gananciaNetaTotal.toLocaleString()}
                    </p>
                </div>
            ) : (
                <div className="w-full max-w-4xl mx-auto mb-10 bg-white/10 rounded px-1 py-4 md:p-5">
                    <p className="text-center text-3xl tracking-wider font-bold">Tabla Diaria {data.fecha}</p>
                    <Bar data={chartData} options={chartOptions} className="p-1 md:p-4"/>
                    <p className="text-center text-2xl font-semibold mt-4">
                        Ganancia Neta: ${gananciaNetaTotal.toLocaleString()}
                    </p>
                </div>
            )}

            {/* Input de Mes y Año */}
            <div className="flex items-center justify-center w-full max-w-md mx-auto mb-6">
                <p className="font-semibold tracking-wider text-xl mr-4">Mes y Año: </p>
                <input
                    value={data.mes}
                    onChange={handleMesChange}
                    type="month"
                    className="rounded p-1 w-64 text-black bg-white"
                />
            </div>
            
            {/* Sección de la gráfica mensual */}
            {mesSeleccionado && registrosMensuales.length > 0 ? (
                <div className="w-full max-w-4xl mx-auto mb-10 bg-white/10 rounded px-1 py-4 md:p-5">
                    <p className="text-center text-3xl tracking-wider font-bold">Tabla Mensual {data.mes}</p>
                    <Bar data={chartDataMes} options={chartOptionsMes} className="p-1 md:p-4"/>
                    <p className="text-center text-2xl font-semibold mt-4">
                        Ganancia Bruta: ${gananciaBrutaMensual.toLocaleString()}
                    </p>
                    <p className="text-center text-2xl font-semibold mt-4">
                        Gastos Totales: ${gastosMensual.toLocaleString()}
                    </p>
                    <p className="text-center text-2xl font-semibold mt-4">
                        Ganancia Neta: ${gananciaNetaMensual.toLocaleString()}
                    </p>
                    <p className="text-center text-3xl font-bold mt-4 text-green-400">
                        Total General: ${(gananciaNetaMensual + cajaInicial).toLocaleString()}
                    </p>
                </div>
            ) : mesSeleccionado && registrosMensuales.length === 0 ? (
                <div className="w-full max-w-4xl mx-auto mb-10 bg-white/10 rounded px-1 py-4 md:p-5 text-center">
                    <p className="text-xl">No hay registros para este mes.</p>
                </div>
            ) : null}

        </div>
    );
}
