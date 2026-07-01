import { destinations } from "@/app/data/destinations";
import { notFound } from "next/navigation";

import DestinationHero from "@/components/destination/DestinationHero";
import DestinationInfo from "@/components/destination/DestinationInfo";
import DestinationItinerary from "@/components/destination/DestinationItinerary";
import BookingCard from "@/components/destination/BookingCard";
import RelatedDestinations from "@/components/destination/RelatedDestinations";

export default async function DestinationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const destination = destinations.find(
    (item) => item.slug === slug
  );

  if (!destination) {
    notFound();
  }

  return (
    <>
      <DestinationHero
        title={destination.title}
        province={destination.province}
        elevation={destination.elevation}
        image={destination.image}
      />

      <div className="mx-auto max-w-7xl px-6 py-20 grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DestinationInfo
            description={destination.description}
            duration={destination.duration}
            difficulty={destination.difficulty}
            price={destination.price}
          />

          <DestinationItinerary
            itinerary={destination.itinerary}
          />
        </div>

        <BookingCard />
      </div>

      <RelatedDestinations currentSlug={destination.slug} />
    </>
  );
}