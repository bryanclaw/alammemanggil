export default function vidioopening() {
  return (
    <section className="relative w-full overflow-hidden bg-black">
      <video
        autoPlay
        muted
        loop
        playsInline
        className="h-52 sm:h-72 md:h-96 lg:h-[26rem] w-full object-cover object-center block"
      >
        <source src="/images/VidioOpening.mp4" type="video/mp4" />
      </video>
    </section>
  );
}