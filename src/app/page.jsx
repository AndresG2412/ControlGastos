import Image from "next/image";
import Link from "next/link";

export default function Home() {

    const confirmar = () => {
        console.log("Inicio de sesión confirmado");
    };

    return (
        <form className="flex flex-col items-center justify-center h-screen">
            <div className="my-auto flex flex-col gap-y-8 items-center justify-center bg-white/5 py-10 w-10/12 md:w-1/3 mx-auto rounded-lg">
                <p className="text-3xl font-bold tracking-wider">Bienvenido</p>

                <div className="flex flex-col gap-3 w-full">
                    <label htmlFor="Correo" className="font-semibold text-center tracking-wide text-xl">Correo Electronico</label>
                    <input id="Correo"  autoComplete="off" className="mx-auto outline-none focus:ring-blue-500 focus:border-blue-500 block dark:focus:ring-blue-500 dark:focus:border-blue-500 border-white border-2 rounded-md py-1.5 pl-2 pr-7 tracking-wider w-10/12 md:w-2/3" type="email" placeholder="Ejemplo@gmail.com" required/>
                </div>

                <div className="flex flex-col gap-3 w-full">
                    <label htmlFor="Contraseña" className="font-semibold text-center tracking-wide text-xl">Contraseña</label>
                    <input id="Contraseña"  autoComplete="off" className="mx-auto outline-none focus:ring-blue-500 focus:border-blue-500 block dark:focus:ring-blue-500 dark:focus:border-blue-500 border-white border-2 rounded-md py-1.5 pl-2 pr-7 tracking-wider w-10/12 md:w-2/3" type="password" placeholder="********" required/>
                </div>

                {/* cambiar a boton */}
                <Link href="/home" className="bg-blue-500 tracking-wider text-white font-semibold py-2 px-4 rounded-md w-10/12 md:w-2/3 hover:bg-blue-600 transition-colors duration-300">
                    Iniciar Sesión
                </Link>
            </div>
        </form>
    );
}
