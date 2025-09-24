import Image from "next/image";
import Header from "@/components/header";
import PageTransition from "@/components/PageTransition";
import AnimatedButton from "@/components/AnimatedButton";
import SearchExperience from "@/components/SearchExperience";
import ExperienceList from "@/components/ExperienceList";
import Footer from "@/components/footer";
export default function Home() {
  return (
    <PageTransition>
      <Header />
      <SearchExperience />
      <ExperienceList />
      <Footer />
    </PageTransition>
  );
}
