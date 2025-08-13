"use client";

import { useState,useEffect } from 'react';
import Navbar from '@/app/components/Navbar';

// Importar la configuración de Firebase
import { db } from "@/libs/firebase";
import { getFirestore, doc, collection, getDoc, setDoc, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";

import { useRouter } from "next/navigation";

export default function page() {

    const router = useRouter();
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [vehiculo, setVehiculo] = useState([]);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        vehiculo: ""
    });

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
    };

    const [datosForm, setDatosForm] = useState({
        nombre: "",
        monto: "",
        limite:  ""
    })

    const handleChange = (e) => {
        const { name, value } = e.target;
        setDatosForm((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const verificar = async (e) => {
        e.preventDefault();

        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
            alert("Usuario no autenticado.");
            return;
        }

        // Validaciones
        if (!datosForm.nombre || !datosForm.monto || !data.vehiculo) {
            alert("Por favor, verifica los datos.");
            return;
        }

        
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const fechaHoy = `${yyyy}-${mm}-${dd}`;

        try {
            // 📌 Referencia a la subcolección "deudas"
            const deudorRef = collection(
                db,
                "users",
                user.uid,
                "Vehiculos",
                data.vehiculo,
                "deudores"
            );

            // 📌 Agregar documento con ID automático
            await setDoc(doc(deudorRef), {
                nombre: datosForm.nombre,
                monto: Number(datosForm.monto),
                inicio: datosForm.inicio || fechaHoy,
                limite: datosForm.limite || null,
                fechaRegistro: new Date().toISOString()
            });

            alert("✅ Deudor agregada correctamente.");

            // Reiniciar formulario
            setDatosForm({
                nombre: "",
                monto: "",
                limite: ""
            });
            setData((prev) => ({ ...prev, vehiculo: "" }));

        } catch (error) {
            console.error("Error al guardar la deuda:", error);
            alert("❌ Ocurrió un error al guardar la deuda.");
        }
    };

    return (
        <div className='w-screen h-screen flex flex-col items-center justify-center'>
            <Navbar/>
            <form onSubmit={verificar} className='w-1/3 bg-white/10 rounded-2xl p-10'>
                <p className='font-semibold text-3xl text-center tracking-wider'>Formulario Deudor</p>

                <div className='flex flex-col mx-auto items-center justify-center text-start mt-6 mb-8 gap-y-4 w-2/3'>

                    <div>
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

                    <div className='flex flex-col gap-x-1 w-full'>
                        <label className="font-semibold text-lg tracking-wide">Nombre:</label>
                        <input name='nombre' value={datosForm.nombre} onChange={handleChange} type="text" className='border-1 border-white rounded p-1 text-white w-full' required/>
                    </div>

                    <div className='flex flex-col gap-x-1 w-full'>
                        <label className="font-semibold text-lg tracking-wide">Cantidad:</label>
                        <input name='monto' value={datosForm.monto} onChange={handleChange} type="number" className='border-1 border-white rounded p-1 text-white w-full' required/>
                    </div>

                    <div className='flex flex-col gap-x-1 w-full'>
                        <label className="font-semibold text-lg tracking-wide">Inicio Deuda:</label>
                        <input name='inicio' value={datosForm.inicio} onChange={handleChange} type="date" className='border-1 border-white rounded p-1 text-white w-full'/>
                    </div>

                    <div className='flex flex-col gap-x-1 w-full'>
                        <label className="font-semibold text-lg tracking-wide">Limite Pago:</label>
                        <input name='limite' value={datosForm.limite} onChange={handleChange} type="date" className='border-1 border-white rounded p-1 text-white w-full'/>
                    </div>
                </div>

                <div className='w-2/3 mx-auto'>
                    <button type='submit' className='border-white hover:duration-300 border-1 px-4 py-2 font-semibold tracking-wide text-lg rounded bg-green-400 hover:scale-110 hover:bg-green-600 w-full'>Agregar Deudor</button>
                </div>
            </form>
        </div>
    )
}
