"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // para redirección en Next.js

import Navbar from '../components/Navbar';

// Importar la configuración de Firebase
import { db } from "@/libs/firebase";
import { getFirestore, doc, collection, getDoc, setDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export default function page() {

    //crear un estado para los datos del usuario
    const [userData, setUserData] = useState(null);

    //usamos useEffect para verificar el usuario al cargar la pagina
    useEffect(() => {
        const fetchUserData = async () => {
        const auth = getAuth();
        const user = auth.currentUser;

        if (user) {
            const userDocRef = doc(db, "users", user.uid);
            const userSnapshot = await getDoc(userDocRef);

            if (userSnapshot.exists()) {
                setUserData(userSnapshot.data());
            } else {
                console.log("No se encontró el documento del usuario");
            }
        } else {
            // Si no hay usuario, mostrar alerta y redirigir
            alert("Tu sesión ha caducado. Por favor, inicia sesión nuevamente.");
            router.push("/"); // Redirige al login
        }
    };
        fetchUserData();
    }, []);

    const router = useRouter();

    const [data, setData] = useState({
        tipo: "particular",
        placa: "",
        marca: "",
        modelo: "",
    });

    const [errorMsg, setErrorMsg] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;
        setData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    // Función para verificar y registrar el vehículo
    const verificacion = async (e) => {
        e.preventDefault();

        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
            setErrorMsg("Usuario no autenticado.");
            return;
        }

        // Validaciones
        if (!data.tipo || !data.placa || !data.marca || !data.modelo) {
            alert("Por favor, verifica los datos.");
            return;
        }

        const placaMayus = data.placa.toUpperCase();
        const placaRegex = /^[A-Z]{3}[0-9]{3}$/;

        if (!placaRegex.test(placaMayus)) {
            alert("La placa debe tener 3 letras seguidas de 3 números (ej: ABC123).");
            return;
        }

        const docRef = doc(db, "users", user.uid, "Vehiculos", placaMayus);

        try {
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                alert("El vehículo ya está registrado.");
            } else {
                await setDoc(docRef, {
                    tipo: data.tipo,
                    placa: placaMayus,
                    marca: data.marca,
                    modelo: data.modelo,
                    registradoEn: new Date(),
                });

                alert("Vehículo registrado correctamente");

                // Limpiar formulario si deseas
                setData({
                    tipo: "particular",
                    placa: "",
                    marca: "",
                    modelo: "",
                });

                setErrorMsg("");
            }
        } catch (error) {
            console.error("Error al registrar el vehículo:", error);
            alert("Ocurrió un error al registrar el vehículo.");
        }
    };


    return (
        <div className="w-screen h-screen flex flex-col items-center justify-center">
            <Navbar/>
            <form onSubmit={verificacion} className="flex flex-col items-center justify-center gap-1 p-8 bg-white/10 rounded shadow-md md:w-2/4 w-10/12 mx-auto">
                <p className="text-3xl md:text-4xl font-bold tracking-wider mb-4 text-center">Registro de Carro</p>

                <div className="flex flex-col gap-1 mt-4 md:w-2/4 w-11/12">
                    <label className="text-lg font-semibold tracking-wide">Tipo Vehiculo:</label>
                    <select name="tipo" value={data.tipo} onChange={handleChange} id="tipo" className="border border-gray-300 rounded p-2 text-black bg-white" required>
                        <option value="particular" defaultValue={"particular"}>Particular</option>
                        <option value="buseta">Buseta</option>
                    </select>
                </div>

                <div className="flex flex-col gap-1 mt-4 md:w-2/4 w-11/12">
                    <label className="text-lg font-semibold tracking-wide">Placa:</label>
                    <input 
                        type="text" 
                        name="placa"
                        value={data.placa} onChange={handleChange} 
                        className="border uppercase border-gray-300 rounded p-2 text-black bg-white" 
                        placeholder="abc123" 
                        required
                    />
                </div>

                <div className="flex flex-col gap-1 mt-4 md:w-2/4 w-11/12">
                    <label className="text-lg font-semibold tracking-wide">Marca:</label>
                    <select name="marca" value={data.marca} onChange={handleChange} id="tipo" className="border border-gray-300 rounded p-2 text-black bg-white" required>
                        <option value="-">-</option>
                        <option value="toyota">Toyota</option>
                        <option value="ford">Ford</option>
                        <option value="chevrolet">Chevrolet</option>
                        <option value="honda">Honda</option>
                        <option value="nissan">Nissan</option>
                        <option value="hyundai">Hyundai</option>
                        <option value="kia">Kia</option>
                        <option value="volkswagen">Volkswagen</option>
                        <option value="mazda">Mazda</option>
                        <option value="subaru">Subaru</option>
                        <option value="mercedes-benz">Mercedes-Benz</option>
                        <option value="bmw">BMW</option>
                        <option value="audi">Audi</option>
                        <option value="peugeot">Peugeot</option>
                        <option value="renault">Renault</option>
                        <option value="fiat">Fiat</option>
                        <option value="mitsubishi">Mitsubishi</option>
                        <option value="suzuki">Suzuki</option>
                        <option value="volvo">Volvo</option>
                        <option value="tesla">Otro</option>
                    </select>
                </div>

                <div className="flex flex-col gap-1 mt-4 md:w-2/4 w-11/12">
                    <label className="text-lg font-semibold tracking-wide">Modelo:</label>
                    <input 
                        type="text" 
                        name="modelo"
                        value={data.modelo} onChange={handleChange}
                        className="w-full border border-gray-300 rounded p-2 text-black bg-white" 
                        placeholder="Ejemplo: Corolla 2020" 
                        required
                    />
                </div>

                <button type="submit" className="mt-10 md:w-2/4 w-11/12 bg-blue-500 text-white tracking-wider text-xl md:text-2xl font-semibold py-2 px-4 rounded hover:bg-blue-600 transition-colors duration-300">
                    Registrar Vehiculo
                </button>
            </form>
        </div>
    )
}
