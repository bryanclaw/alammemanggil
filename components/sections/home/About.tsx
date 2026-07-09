import Link from "next/link";

export default function About() {
  return (
    <section
      className="relative h-[500px] w-full overflow-hidden"
      style={{
        backgroundImage: "url('/images/POSTERHOME2.png')", 
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
    
      <div className="absolute inset-0 bg-black/35" />

      <div className="relative mx-auto flex h-full max-w-7xl items-center justify-end px-8 lg:px-16">
        <div className="max-w-[620px] text-right text-white">
          <h2 className="ml-18 text-left text-white font-bold text-[68px] leading-[78px] tracking-[-1px]">
            <div>Alam adalah</div>
            <div>Panggung, Kamu</div>
            <div className="whitespace-nowrap">
            adalah Petualangnya
            </div>
          </h2>

          <p className="mt-10 text-[18px] font-semibold leading-[1.6] md:text-[22px]">
            Di sinilah setiap individu menjadi pemeran
            <br />
            utama petualang yang menikmati
            <br />
            keindahan setiap langkah.
          </p>

      
        </div>
      </div>
    </section>
  );
}