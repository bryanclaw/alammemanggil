interface Props {
  description: string;
  duration: string;
  difficulty: string;
  price: number;
}

export default function DestinationInfo({
  description,
  duration,
  difficulty,
  price,
}: Props) {
  return (
    <section className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <h2 className="mb-6 text-3xl font-bold">
          Overview
        </h2>

        <p className="leading-8 text-gray-600">
          {description}
        </p>
      </div>

      <div className="rounded-2xl border p-8 shadow">
        <h3 className="mb-6 text-2xl font-bold">
          Trip Info
        </h3>

        <div className="space-y-4">
          <p>
            <strong>Duration</strong>
            <br />
            {duration}
          </p>

          <p>
            <strong>Difficulty</strong>
            <br />
            {difficulty}
          </p>

          <p>
            <strong>Price</strong>
            <br />
            Rp {price.toLocaleString("id-ID")}
          </p>
        </div>
      </div>
    </section>
  );
}