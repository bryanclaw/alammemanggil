import Image from "next/image";

export default function vidioopening() {
  return (
    <section className="relative w-full overflow-hidden">
      <video
        autoPlay
        muted
        loop
        playsInline
        className="h-100 w-full object-cover"
      >
        <source src="/images/VidioOpening.mp4" type="video/mp4" />
      </video>
    </section>
  );
}