import { getExperienceMetadata } from "@/lib/database";
import BookExperienceClient from "./BookExperienceClient";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const experience = await getExperienceMetadata(id);
  
  if (!experience) {
    return {
      title: 'Booking | Ryfty',
    };
  }

  return {
    title: `Confirm and pay - ${experience.title} | Ryfty`,
    description: `Complete your booking for ${experience.title}`,
  };
}

export default async function BookPage({ params }) {
  const { id } = await params;
  return <BookExperienceClient id={id} />;
}
