// components/Navbar.tsx
import Link from 'next/link';
import Image from 'next/image'

const Navbar: React.FC = () => {
    return (
        <nav style={{ backgroundColor: 'rgba(56, 102, 65, 0.85)' }} className="p-6">
            <div className="container mx-auto">
                <div className="flex items-center justify-between">
                    <div>
                        <Link href="/" className="text-white font-pacifico text-xl flex items-center">
                            <Image
                                src='/logo.png'
                                width={64}
                                height={64}
                                alt="Page logo"
                                className="mr-4"
                            />
                            <span className="text-3xl ml-2 pt-4">Chicago Maps</span> {/* Cambiar el tamaño del texto a 36px y agregar un poco de margen a la izquierda */}
                        </Link>

                    </div>
                    <div className="flex space-x-4">
                        <div className="space-x-12">
                            <Link href="/" className="text-white hover:text-gray-400 transition duration-300 text-xl">
                                Home
                            </Link>
                            <Link href="/querybuilder" className="text-white hover:text-gray-400 transition duration-300 text-xl">
                                Relevant info
                            </Link>
                            <Link href="/queryhub" className="text-white hover:text-gray-400 transition duration-300 text-xl">
                                About us
                            </Link>
                        </div>

                    </div>
                </div>
            </div>
        </nav>

    );
};

export default Navbar;