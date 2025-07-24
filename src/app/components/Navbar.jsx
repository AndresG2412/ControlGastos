"use client";
import Link from 'next/link'
import { useState } from 'react';

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const closeMenu = () => {
        setIsMenuOpen(false);
    };

    return (
        <>
            <div className='h-1/12 w-full bg-[#111] shadow-1 fixed top-0 left-0 flex justify-between items-center border-b-[1px] border-[#fff] z-50 backdrop-blur-sm'>
                <p className='hidden md:block pl-4 tracking-wide font-semibold text-xl'>Bienvenido, Example</p>
                <p className='md:hidden block pl-4 tracking-wide font-semibold text-xl'>Bienvenido, <br />Example</p>
                
                {/* Botón hamburguesa*/}
                <button 
                    onClick={toggleMenu}
                    className='hover:cursor-pointer mr-4 p-2 focus:outline-none'
                    aria-label="Toggle menu"
                >
                    <div className="relative w-6 h-6 flex flex-col justify-center items-center">
                        <span 
                        className={`block w-6 h-0.5 bg-white transition-all duration-300 ease-in-out ${
                            isMenuOpen ? 'rotate-45 translate-y-0' : '-translate-y-1.5'
                        }`}
                        />
                        <span 
                        className={`block w-6 h-0.5 bg-white transition-all duration-300 ease-in-out ${
                            isMenuOpen ? 'opacity-0' : 'opacity-100'
                        }`}
                        />
                        <span 
                        className={`block w-6 h-0.5 bg-white transition-all duration-300 ease-in-out ${
                            isMenuOpen ? '-rotate-45 -translate-y-1' : 'translate-y-1.5'
                        }`}
                        />
                    </div>
                </button>
            </div>

            {/* Overlay del menú móvil */}
            <div 
                className={`fixed inset-0 bg-opacity-50 z-40 transition-all duration-300 ease-in-out md:w-1/4 ${
                isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
                }`}
                onClick={closeMenu}
            />

            {/* Menú móvil */}
            <div 
                className={`fixed top-0 right-0 h-full w-full bg-[#111] z-50 transform transition-all duration-500 ease-out md:w-1/4 ${
                isMenuOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                {/* Header del menú móvil */}
                <div className="flex justify-between items-center h-16 px-4 border-b border-[#333]">
                    <button 
                        onClick={closeMenu}
                        className="p-2 focus:outline-none"
                        aria-label="Close menu"
                    >
                        <svg className="w-6 h-6 text-white scale-150 absolute right-5 top-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Contenido del menú móvil */}
                <div className="flex flex-col items-center justify-center h-full space-y-12 pb-32">
                    {/* Item Productos */}
                    <div 
                        className={`group flex flex-col items-center space-y-4 transform transition-all duration-700 ease-out ${
                        isMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                        }`}
                        style={{ transitionDelay: isMenuOpen ? '200ms' : '0ms' }}
                    >
                        <div className='flex items-center justify-center space-x-3'>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="group-hover:text-blue-400 group-hover:duration-300 transition-colors duration-300 size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                            </svg>

                            <Link 
                                className='uppercase text-white font-bold text-3xl tracking-widest group-hover:text-blue-400 group-hover:duration-300 transition-colors duration-300' 
                                href="/home"
                                onClick={closeMenu}
                            >
                                Inicio
                            </Link>
                        </div>
                    </div>

                    {/* Item Home */}
                    <div 
                        className={`group flex flex-col items-center space-y-4 transform transition-all duration-700 ease-out ${
                        isMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                        }`}
                        style={{ transitionDelay: isMenuOpen ? '200ms' : '0ms' }}
                    >
                        <div className='flex items-center justify-center space-x-3'>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="group-hover:text-blue-400 group-hover:duration-300 transition-colors duration-300 size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>

                            <Link 
                                className='uppercase text-white font-bold text-3xl tracking-widest group-hover:text-blue-400 group-hover:duration-300 transition-colors duration-300' 
                                href="/resolver"
                                onClick={closeMenu}
                            >
                                Ingresar
                            </Link>
                        </div>
                    </div>

                    {/* Item Home */}
                    <div 
                        className={`group flex flex-col items-center space-y-4 transform transition-all duration-700 ease-out ${
                        isMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                        }`}
                        style={{ transitionDelay: isMenuOpen ? '200ms' : '0ms' }}
                    >
                        <div className='flex items-center justify-center space-x-3'>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="group-hover:text-blue-400 group-hover:duration-300 transition-colors duration-300 size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                            </svg>


                            <Link 
                                className='uppercase text-white font-bold text-3xl tracking-widest group-hover:text-blue-400 group-hover:duration-300 transition-colors duration-300' 
                                href="/options"
                                onClick={closeMenu}
                            >
                                Editar
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Footer del menú móvil */}
                <div className="absolute bottom-8 left-0 right-0 text-center">
                    <p className="text-gray-400 text-sm">Toca la X para cerrar</p>
                </div>
            </div>
        </>
    )
}
