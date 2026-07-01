import Hero from "@/components/sections/Hero";
import WhyChooseUs from "@/components/sections/WhyChooseUs";
import About from "@/components/sections/About";
import Recommendation from "@/components/sections/Recommendation";
import Testimonial from "@/components/sections/Testimonial";
import Expedition from "@/components/sections/Expedition";
import CTA from "@/components/sections/CTA";

export default function Home() {
  return (
    <>
      <Hero />
      <WhyChooseUs />
      <About />
      <Recommendation />
      <Testimonial />
      <Expedition />
      <CTA />
    </>
  );
}