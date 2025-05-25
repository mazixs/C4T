import Image from "next/image";
import Calculator from '../components/Calculator';

export default function Home() {
  return (
    <>
      <main className="min-h-screen p-6 md:p-12 bg-gray-100">
        <Calculator />
      </main>
      <footer className="w-full text-center p-4 text-gray-600 text-sm">
        <div className="flex flex-col items-center">
          <p className="mb-1">Автор: mazix</p>
          <a href="https://github.com/mazixs?tab=repositories" target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-blue-600 hover:underline">
            <Image src="/github.svg" alt="GitHub Icon" width={16} height={16} className="mr-1" />
            GitHub
          </a>
        </div>
      </footer>
    </>
  );
}
