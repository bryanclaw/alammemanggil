export default function TopBar() {
  return (
    <div className="bg-[#FFFFFF] backdrop-blur-md sticky top-0 z-50 border-b border-[#6F4E37]/10 transition-all duration-300 shadow-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-center gap-4 px-6">
        <div className="rounded-full bg-[#6F4E37] px-6 py-2 shadow-xl hover:shadow-[#6F4E37]/30 hover:scale-105 active:scale-95 transition-all duration-300 ease-out cursor-pointer group">
          <span className="font-semibold text-[#FFFFFF] block animate-pulse group-hover:animate-none">
            Salam Lestari
          </span>
        </div>

        <p className="text-[#6F4E37] font-semibold tracking-wide hover:text-[#523928] transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 hover:after:w-full after:bg-[#6F4E37] after:transition-all after:duration-300">
          Jawab Panggilan, Taklukkan Alam!
        </p>
      </div>
    </div>
  );
}