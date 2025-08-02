"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";

import { getAuth } from "firebase/auth";
import {
  collection,
  getDocs,
  getDoc,
  doc,
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
    const [data, setData] = useState({ vehiculo: "" });

    const [registros, setRegistros] = useState([]);

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
    const handleChange = async (e) => {
        const { name, value } = e.target;
        setData((prev) => ({ ...prev, [name]: value }));

        if (user && value) {
            const ref = collection(db, "users", user.uid, "Vehiculos", value, "registros");
            const snapshot = await getDocs(ref);
            const lista = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data()
            }));
            setRegistros(lista);
        } else {
            setRegistros([]);
        }
    };

    // 4️⃣ Preparar datos para Chart.js
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
                data: registros.map((r) => {
                    const gastos = r.gastos?.reduce((total, g) => total + Number(g.monto), 0) || 0;
                    return (r.gananciaBruta || 0) - gastos;
                }),
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

    return (
        <div className="mt-24 text-white px-4">
            <Navbar />

            <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto mb-6">
                {loading ? (
                <p>Cargando vehículos...</p>
                ) : vehiculo.length === 0 ? (
                <p>No hay vehículos registrados.</p>
                ) : (
                    <select
                        value={data.vehiculo}
                        onChange={handleChange}
                        name="vehiculo"
                        className="w-full border p-2 rounded bg-white text-black"
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

                <div className="w-full max-w-4xl mx-auto mb-10 bg-white/10 rounded px-1 py-4 md:p-5">
                    <p className="text-center text-3xl tracking-wider font-bold">Tabla Diaria</p>
                    <Bar data={chartData} options={chartOptions} className="p-1 md:p-4"/>
                    <p className="text-center text-lg font-semibold mt-4">
                        Ganancia Neta Total: ${gananciaNetaTotal.toLocaleString()}
                    </p>
                </div>
        </div>
    );
}
