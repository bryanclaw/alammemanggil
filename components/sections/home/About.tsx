export default function About() {
  return (
    <section
      className="relative w-full aspect-[4/3] min-h-[245px] max-h-[340px] sm:aspect-auto sm:max-h-none sm:min-h-[460px] lg:h-[500px] overflow-hidden py-5 sm:py-10 lg:py-0"
      style={{
        backgroundImage: "url('/images/POSTERHOME2.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/45 lg:bg-black/35" />

      <div className="relative mx-auto flex h-full max-w-7xl items-center justify-center lg:justify-end px-4 sm:px-8 lg:px-16">
        <div className="w-full max-w-[620px] text-center sm:text-right text-white">
          <h2 className="sm:ml-10 lg:ml-18 text-center sm:text-left text-white font-bold text-xl sm:text-5xl lg:text-[68px] leading-[1.15] lg:leading-[78px] tracking-[-0.4px] lg:tracking-[-1px]">
            <div>Alam adalah</div>
            <div>Panggung, Kamu</div>
            <div className="sm:whitespace-nowrap">adalah Petualangnya</div>
          </h2>

          <p className="mt-3 sm:mt-8 lg:mt-10 text-xs sm:text-[18px] md:text-[22px] font-semibold leading-[1.45] sm:leading-[1.6] text-white/95">
            Di sinilah setiap individu menjadi pemeran
            <br className="hidden sm:inline" /> utama petualang yang menikmati
            <br className="hidden sm:inline" /> keindahan setiap langkah.
          </p>
        </div>
      </div>
    </section>
  );
}