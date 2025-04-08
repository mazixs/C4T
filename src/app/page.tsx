import Image from "next/image";
import Calculator from '../components/Calculator';

export default function Home() {
  return (
    <main className="min-h-screen p-6 md:p-12 bg-gray-100">
      <Calculator />
    </main>
  );
}
