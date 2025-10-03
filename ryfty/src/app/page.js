"use client";

import { useState } from "react";
import Header from "@/components/header";
import PageTransition from "@/components/PageTransition";
import SearchExperience from "@/components/SearchExperience";
import ExperienceList from "@/components/ExperienceList";
import Footer from "@/components/footer";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  return (
    <PageTransition>
      <Header />
      <SearchExperience onSearch={handleSearch} />
      <ExperienceList searchQuery={searchQuery} />
      <Footer />
    </PageTransition>
  );
}
