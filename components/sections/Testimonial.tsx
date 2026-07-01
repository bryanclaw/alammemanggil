import TestimonialCard from "../ui/TestimonialCard";
import { testimonials } from "@/app/data/testimonials";

export default function Testimonial() {
  return (
    <section className="bg-[#F6F4F1] py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-14 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#7B5538]">
            Testimonials
          </p>

          <h2 className="mt-3 text-4xl font-bold">
            What Our Adventurers Say
          </h2>

          <p className="mt-4 text-gray-600">
            Stories from hikers and explorers who have joined Alam Memanggil.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((item) => (
            <TestimonialCard
              key={item.id}
              {...item}
            />
          ))}
        </div>
      </div>
    </section>
  );
}