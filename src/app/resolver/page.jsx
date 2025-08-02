"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";

import { getAuth } from "firebase/auth";
import { collection, getDocs, getDoc, doc, addDoc, setDoc } from "firebase/firestore";
import { db } from "@/libs/firebase";

export default function Page() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [vehiculo, setVehiculo] = useState([]);
  const [loading, setLoading] = useState(true);

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

    // 4️⃣ Verificación y subida
    const verificar = async (e) => {
        e.preventDefault();

        if (!data.vehiculo || !data.ganancia || gastos.some(g => !g.nombre || !g.monto)) {
            alert("Por favor completa todos los campos correctamente.");
            return;
        }

        try {
            const today = new Date();
            const yyyy = today.getFullYear().toString().slice(2); // dos últimos dígitos
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            const fechaId = `${yyyy}-${mm}-${dd}`;

            // Ruta: users/{uid}/Vehiculos/{placa}/registros/{fecha}
            const docRef = doc(db, "users", user.uid, "Vehiculos", data.vehiculo, "registros", fechaId);

            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                alert("Ya has subido cuentas para este vehículo hoy.");
                return;
            }

            await setDoc(docRef, {
                ganancia: Number(data.ganancia),
                gastos: gastos.map((g) => ({
                    nombre: g.nombre,
                    monto: Number(g.monto),
                })),
                fechaRegistro: new Date(),
            });

            console.log("Datos guardados en:", `users/${user.uid}/Vehiculos/${data.vehiculo}/registros/${fechaId}`);
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
    <div className="flex flex-col items-center justify-center mt-24">
        <Navbar />

        <form onSubmit={verificar} className="bg-white/10 p-6 rounded w-10/12 md:w-full max-w-xl">
            <h1 className="text-4xl font-bold mb-4 text-center">Registrar Cuentas</h1>

            {/* Selección de vehículo */}
            <p className="font-semibold tracking-wider text-lg">1. Selecciona el Vehículo</p>
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

        {/* Ganancia */}
        <div className="flex flex-col gap-2 mt-4">
            <label className="font-semibold tracking-wider text-lg">2. Ingresa la ganancia en BRUTO</label>
            <input
                name="ganancia"
                value={data.ganancia}
                onChange={handleChange}
                type="number"
                placeholder="90000"
                className="border border-white text-white rounded pl-2 py-1"
                required
            />
        </div>

        {/* Lista de gastos */}
        <div className="flex flex-col gap-2 mt-4">
            <label className="font-semibold tracking-wider text-lg">
                3. Ingresa los gastos uno por uno
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


        {/* Submit */}
        <button
          type="submit"
          className="bg-green-500 hover:bg-green-700 duration-300 transition-all text-white font-semibold tracking-wider text-lg px-4 py-2 rounded mt-4 w-full"
        >
          Subir Cuentas
        </button>
      </form>
    </div>
  );
}
