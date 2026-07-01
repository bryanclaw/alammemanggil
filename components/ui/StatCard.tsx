interface StatCardProps {
  value: string;
  label: string;
  image: string;
}

export default function StatCard({
  value,
  label,
  image,
}: StatCardProps) {
  return (
    <div
      className="relative h-48 overflow-hidden rounded-2xl shadow-lg transition duration-300 hover:-translate-y-2 hover:shadow-2xl"
      style={{
        backgroundImage: `url(${image})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/45" />

      {/* Content */}
      <div className="relative flex h-full flex-col items-center justify-center text-center text-white">
        <h3 className="text-4xl font-extrabold">{value}</h3>

        <p className="mt-2 text-sm tracking-wide uppercase">
          {label}
        </p>
      </div>
    </div>
  );
}