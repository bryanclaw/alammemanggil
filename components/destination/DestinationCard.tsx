import Image from "next/image";
import Link from "next/link";

interface Props {
  slug: string;
  title: string;
  province: string;
  image: string;
  duration: string;
  difficulty: string;
  price: number;
}

export default function DestinationCard({
  slug,
  title,
  province,
  image,
  duration,
  difficulty,
  price,
}: Props) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-lg transition hover:-translate-y-2 hover:shadow-xl">
      <div className="relative h-60">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover"
        />
      </div>

      <div className="space-y-4 p-5">
        <div>
          <p className="text-sm text-gray-500">{province}</p>

          <h3 className="text-xl font-bold">{title}</h3>
        </div>

        <div className="flex justify-between text-sm text-gray-600">
          <span>{duration}</span>

          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              difficulty === "Easy"
                ? "bg-green-100 text-green-700"
                : difficulty === "Medium"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {difficulty}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-lg font-bold text-[#7B5538]">
            Rp {price.toLocaleString("id-ID")}
          </p>

          <Link
            href={`/destination/${slug}`}
            className="rounded-full bg-[#7B5538] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#5f412c]"
          >
            Details
          </Link>
        </div>
      </div>
    </div>
  );
}