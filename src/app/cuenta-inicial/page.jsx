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
  setDoc, // <-- Importamos setDoc para guardar datos
} from "firebase/firestore";
import { db } from "@/libs/firebase";

export default function page() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ vehiculo: "" });
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [vehiculo, setVehiculo] = useState([]);
  const [cargandoVehiculos, setCargandoVehiculos] = useState(false);

  // Nuevo estado para el monto inicial
  const [cajaInicial, setCajaInicial] = useState('');
  const [guardando, setGuardando] = useState(false); // Nuevo estado para el botón de guardar

  // 1️⃣ Obtener usuario
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
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
      setLoading(false); // Mover aquí para que cargue aunque no haya usuario
    });

    return () => unsubscribe();
  }, [router]);

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
        setCargandoVehiculos(false);
      }
    };

    obtenerVehiculos();
  }, [user]);

  // 3️⃣ Cambios en select
  const handleVehiculoChange = (e) => {
    const { value } = e.target;
    setData((prev) => ({ ...prev, vehiculo: value }));
    setCargandoVehiculos(true);
    // Podrías aquí también cargar el valor inicial si ya existe
    // pero para empezar, lo hacemos simple
  };

  // 4️⃣ Nuevo: Enviar los datos a la base de datos
  const handleGuardarInicial = async (e) => {
    e.preventDefault();
    if (!data.vehiculo || cajaInicial === '') {
      alert('Por favor, selecciona un vehículo y un monto inicial.');
      return;
    }

    setGuardando(true);
    try {
      // Ruta: users/{UID}/Vehiculos/{placa}/configuracion/datos
      const docRef = doc(db, `users/${user.uid}/Vehiculos/${data.vehiculo}/configuracion/datos`);
      
      await setDoc(docRef, {
        cajaInicial: parseFloat(cajaInicial),
        fechaInicio: new Date(),
      }, { merge: true });

      alert('¡Caja inicial guardada con éxito!');
      router.push('/home'); // Redirigir al home
    } catch (error) {
      console.error('Error al guardar la caja inicial: ', error);
      alert('Hubo un error al guardar los datos.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div>
      <Navbar />

      <div className="mt-24 mb-8">
        <h1 className='text-3xl font-bold text-center'>Ingreso Inicial o Extra</h1>
        <p className='text-center text-lg mt-4'>Esta sección te permite establecer la cuenta inicial de tu negocio.</p>
        <p className='text-center text-lg mt-2'>Asegúrate de ingresar el monto correcto para comenzar a registrar tus gastos e ingresos.</p>
      </div>

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

      {/* Nuevo formulario para el monto inicial */}
      <form onSubmit={handleGuardarInicial}>
        <div className='flex items-center justify-center mt-8'>
          {cargandoVehiculos && data.vehiculo ? (
            <div>
              <label className="font-semibold tracking-wider text-xl mr-4">Inicio: </label>
              <input
                type="number"
                value={cajaInicial}
                onChange={(e) => setCajaInicial(e.target.value)}
                required
                className='p-1 border-1 bg-white rounded pl-2 w-56 text-black'
              />
            </div>
          ) : (
            <div>
              <p className="font-semibold tracking-wider text-xl mr-4">Seleccione un Vehiculo Primero</p>
            </div>
          )}
        </div>
        <div className="flex justify-center mt-6">
          <button
            type="submit"
            className="bg-green-500 text-white font-bold py-2 px-4 rounded hover:bg-green-600"
            disabled={guardando || !data.vehiculo || cajaInicial === ''}
          >
            {guardando ? 'Guardando...' : 'Guardar Saldo Inicial'}
          </button>
        </div>
      </form>
    </div>
  );
}