import Hero from "@/components/sections/home/Hero";
import VidioOpening from "@/components/sections/home/vidioopening";
import WhyChooseUs from "@/components/sections/home/WhyChooseUs";
import About from "@/components/sections/home/About";
import Recommendation from "@/components/sections/home/Recommendation";
import Testimonial from "@/components/sections/home/Testimonial";
import Expedition from "@/components/sections/home/Expedition";
import CTA from "@/components/sections/home/CTA";

export default function Home() {
  return (
    <>
      <Hero />
      <VidioOpening />
      <WhyChooseUs />
      <About />
      <Recommendation />
      <Testimonial />
      <Expedition />
      <CTA />
    </>
  );
}