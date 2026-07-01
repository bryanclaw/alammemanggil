interface Props {
  itinerary: string[];
}

export default function DestinationItinerary({
  itinerary,
}: Props) {
  return (
    <section className="mx-auto max-w-5xl px-6 py-20">
      <h2 className="mb-10 text-3xl font-bold">
        Itinerary
      </h2>

      <div className="space-y-6">
        {itinerary.map((day, index) => (
          <div
            key={index}
            className="rounded-xl border p-6"
          >
            {day}
          </div>
        ))}
      </div>
    </section>
  );
}