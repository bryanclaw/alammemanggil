import Image from "next/image";
import { Quote } from "lucide-react";

interface Props {
  name: string;
  destination: string;
  image: string;
  review: string;
}

export default function TestimonialCard({
  name,
  destination,
  image,
  review,
}: Props) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-lg transition hover:shadow-xl">
      <Quote className="mb-4 text-[#7B5538]" size={36} />

      <p className="mb-6 leading-7 text-gray-600">
        <span>{review}</span>
      </p>

      <div className="flex items-center gap-4">
        <div className="relative h-14 w-14 overflow-hidden rounded-full">
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover"
          />
        </div>

        <div>
          <h4 className="font-semibold">{name}</h4>
          <p className="text-sm text-gray-500">
            {destination}
          </p>
        </div>
      </div>
    </div>
  );
}