// pages/page.jsx
"use client";

import { useEffect, useState, useCallback } from "react";
import Navbar from "../components/Navbar";
import { db, collection, getDocs, doc, getDoc } from "../../libs/firebase"; // Importamos getDoc para obtener un solo documento

// Importar Chart.js y react-chartjs-2
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Registrar los componentes de Chart.js que vamos a usar
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

export default function ReportesPage() { // Renombré el componente para mayor claridad
    const [vehiculos, setVehiculos] = useState([]);
    const [selectedVehiculoId, setSelectedVehiculoId] = useState("");
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // Fecha actual por defecto
    const [dailyRecord, setDailyRecord] = useState(null); // Almacena el registro diario

    // Opciones para la gráfica de barras
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false, // Permite que el gráfico ajuste su tamaño dentro del contenedor
        plugins: {
            title: {
                display: true,
                text: 'Resumen Diario de Ingresos y Gastos',
                color: '#fff', // Color del título
                font: {
                    size: 20
                }
            },
            legend: {
                display: false, // No necesitamos leyenda para un solo dataset
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        let label = context.dataset.label || '';
                        if (context.parsed.y !== null) {
                            // Formatea el valor como moneda colombiana
                            label += new Intl.NumberFormat('es-CO', { 
                                style: 'currency', 
                                currency: 'COP', 
                                minimumFractionDigits: 0, 
                                maximumFractionDigits: 0 
                            }).format(context.parsed.y);
                        }
                        return context.label + ': ' + label;
                    }
                }
            }
        },
        scales: {
            x: {
                ticks: {
                    color: '#fff' // Color de las etiquetas del eje X
                },
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)' // Color de las líneas de la cuadrícula
                }
            },
            y: {
                ticks: {
                    color: '#fff', // Color de las etiquetas del eje Y
                    callback: function(value) {
                        // Formatea los ticks del eje Y como moneda colombiana
                        return new Intl.NumberFormat('es-CO', { 
                            style: 'currency', 
                            currency: 'COP', 
                            minimumFractionDigits: 0, 
                            maximumFractionDigits: 0 
                        }).format(value);
                    }
                },
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)' // Color de las líneas de la cuadrícula
                }
            },
        }
    };

    // Función para obtener los vehículos
    useEffect(() => {
        const fetchVehicles = async () => {
            try {
                const vehiclesColRef = collection(db, "Usuarios", "3157870130", "Vehiculos");
                const vehicleSnapshot = await getDocs(vehiclesColRef);
                const vehiclesList = vehicleSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                setVehiculos(vehiclesList);
                if (vehiclesList.length > 0) {
                    setSelectedVehiculoId(vehiclesList[0].id); // Selecciona el primer vehículo por defecto
                }
            } catch (error) {
                console.error("Error al cargar vehículos:", error);
            }
        };
        fetchVehicles();
    }, []);

    // Función para cargar el registro diario del vehículo y fecha seleccionados
    const fetchDailyRecord = useCallback(async () => {
        if (!selectedVehiculoId || !selectedDate) {
            setDailyRecord(null);
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
                setDailyRecord(docSnap.data());
            } else {
                setDailyRecord(null); // No hay registro para la fecha/vehículo seleccionados
            }
        } catch (error) {
            console.error("Error al obtener el registro diario:", error);
            setDailyRecord(null);
        }
    }, [selectedVehiculoId, selectedDate]);

    // Ejecutar fetchDailyRecord cuando cambie el vehículo o la fecha
    useEffect(() => {
        fetchDailyRecord();
    }, [fetchDailyRecord]);

    // Preparar los datos para Chart.js
    const chartData = {
        labels: [],
        datasets: [
            {
                label: 'Monto',
                data: [],
                backgroundColor: [], // Colores dinámicos para las barras
                borderColor: [],     // Bordes dinámicos para las barras
                borderWidth: 1,
            }
        ],
    };

    if (dailyRecord) {
        // Ganancia Bruta (lo que se generó)
        chartData.labels.push('Ganancia Bruta');
        chartData.datasets[0].data.push(dailyRecord.gananciaBrutaDiaria || 0);
        chartData.datasets[0].backgroundColor.push('rgba(75, 192, 192, 0.7)'); // Verde azulado
        chartData.datasets[0].borderColor.push('rgba(75, 192, 192, 1)');

        // Gasto de Gasolina
        chartData.labels.push('Gasto Gasolina');
        chartData.datasets[0].data.push(dailyRecord.gastoGasolina || 0);
        chartData.datasets[0].backgroundColor.push('rgba(255, 99, 132, 0.7)'); // Rojo
        chartData.datasets[0].borderColor.push('rgba(255, 99, 132, 1)');

        // Gastos Adicionales (cada uno por separado)
        if (dailyRecord.gastosAdicionales && Array.isArray(dailyRecord.gastosAdicionales) && dailyRecord.gastosAdicionales.length > 0) {
            dailyRecord.gastosAdicionales.forEach((gasto) => {
                chartData.labels.push(gasto.nombre || 'Gasto Adicional'); // Usa el nombre del gasto o un genérico
                chartData.datasets[0].data.push(gasto.cantidad || 0);
                chartData.datasets[0].backgroundColor.push('rgba(255, 206, 86, 0.7)'); // Amarillo/Naranja
                chartData.datasets[0].borderColor.push('rgba(255, 206, 86, 1)');
            });
        }
        
        // Ganancia Neta
        chartData.labels.push('Ganancia Neta');
        chartData.datasets[0].data.push(dailyRecord.gananciaNeta || 0);
        chartData.datasets[0].backgroundColor.push('rgba(54, 162, 235, 0.7)'); // Azul
        chartData.datasets[0].borderColor.push('rgba(54, 162, 235, 1)');
    }

    return (
        <div className='mt-24'>
            <Navbar />
            <div className="w-10/12 md:w-3/4 mx-auto py-10">
                <p className="text-3xl font-bold tracking-wider text-center mb-8">Reportes de Ingresos y Gastos</p>

                {/* Selectores de Vehículo y Fecha */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 items-center justify-center bg-white/5 py-10 px-6 mx-auto w-full rounded-lg mb-8">
                    <div className="flex flex-col gap-2 w-full px-4">
                        <label htmlFor="CarroReporte" className="font-semibold tracking-wide text-xl">Selecciona el Vehículo:</label>
                        <select 
                            id="CarroReporte" 
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

                    <div className="flex flex-col gap-2 w-full px-4">
                        <label htmlFor="FechaReporte" className="font-semibold tracking-wide text-xl">Selecciona la Fecha:</label>
                        <input
                            id="FechaReporte"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            max={new Date().toISOString().split('T')[0]} // Impide seleccionar fechas futuras
                            className="outline-none focus:ring-blue-500 focus:border-blue-500 block dark:focus:ring-blue-500 dark:focus:border-blue-500 border-white border-2 rounded-md py-1.5 pl-2 pr-7 tracking-wider w-full"
                            type="date"
                        />
                    </div>
                </div>

                {/* Área de la gráfica diaria */}
                <div className='bg-white/5 h-96 md:h-[500px] rounded-xl text-center text-xl md:text-2xl tracking-wider font-semibold p-4 flex flex-col items-center justify-center'>
                    {dailyRecord ? (
                        <div className="w-full h-full">
                            <Bar options={chartOptions} data={chartData} />
                        </div>
                    ) : (
                        <p className="text-white/70">Selecciona un vehículo y una fecha para ver el reporte diario.</p>
                    )}
                </div>

                {/* Espacio para otras gráficas */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className='bg-white/10 h-64 rounded-xl text-center text-xl md:text-2xl tracking-wider font-semibold pt-4'>
                        Gráfica Semanal (Próximamente)
                    </div>

                    <div className='bg-white/10 h-64 rounded-xl text-center text-xl md:text-2xl tracking-wider font-semibold pt-4'>
                        Gráfica Quincenal (Próximamente)
                    </div>

                    <div className='bg-white/10 h-64 rounded-xl text-center text-xl md:text-2xl tracking-wider font-semibold pt-4'>
                        Gráfica Mensual (Próximamente)
                    </div>
                </div>
            </div>
        </div>
    );
}