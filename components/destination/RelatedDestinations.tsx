interface Props {
  currentSlug: string;
}

export default function RelatedDestinations({
  currentSlug,
}: Props) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <h2 className="text-3xl font-bold">
        Related Destinations
      </h2>

      <p className="mt-3 text-gray-500">
        Current destination: {currentSlug}
      </p>
    </section>
  );
}