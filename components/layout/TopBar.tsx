export default function TopBar() {
  return (
    <div className="bg-[#FFFFFF] backdrop-blur-md sticky top-0 z-50 border-b border-[#6F4E37]/10 transition-all duration-300 shadow-sm">
      <div className="mx-auto flex min-h-12 sm:h-14 max-w-7xl flex-wrap sm:flex-nowrap items-center justify-center gap-2 sm:gap-4 px-3.5 sm:px-6 py-1.5 sm:py-0">
        <div className="rounded-full bg-[#6F4E37] px-3.5 py-1 sm:px-6 sm:py-2 shadow-xl hover:shadow-[#6F4E37]/30 hover:scale-105 active:scale-95 transition-all duration-300 ease-out cursor-pointer group shrink-0">
          <span className="text-xs sm:text-base font-semibold text-[#FFFFFF] block animate-pulse group-hover:animate-none whitespace-nowrap">
            Salam Lestari
          </span>
        </div>

        <p className="text-xs sm:text-base text-[#6F4E37] font-semibold tracking-wide hover:text-[#523928] transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 hover:after:w-full after:bg-[#6F4E37] after:transition-all after:duration-300 text-center sm:text-left">
          Jawab Panggilan, Taklukkan Alam!
        </p>
      </div>
    </div>
  );
}