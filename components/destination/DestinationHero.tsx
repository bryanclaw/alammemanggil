import Image from "next/image";

export default function DestinationHero() {
  return (
    <section className="w-full">
      <Image
        src="/images/POSTERDESTI1.jpeg"
        alt="Poster Alam Memanggil"
        width={1440}
        height={800}
        priority
        className="block h-auto w-full object-cover"
      />
    </section>
  );
}