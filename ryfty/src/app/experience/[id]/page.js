import Link from "next/link";
import { getExperienceData, getExperienceMetadata } from "@/lib/database";
import ExperienceDetailClient from "./ExperienceDetailClient";
import { useAuth } from "@/contexts/AuthContext";
import { getAuthToken } from "@/utils/authStorage";

// Generate metadata for SEO
export async function generateMetadata({ params }) {
  const { id } = await params;
  const experience = await getExperienceMetadata(id);
  if (!experience) {
    return {
      title: 'Experience Not Found | Ryfty',
      description: 'The requested experience could not be found.',
    };
  }

  return {
    title: `${experience.title} | Ryfty`,
    description: experience.description,
    openGraph: {
      title: experience.title,
      description: experience.description,
      images: experience.poster_image_url ? [experience.poster_image_url] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: experience.title,
      description: experience.description,
      images: experience.poster_image_url ? [experience.poster_image_url] : [],
    },
  };
}

export default async function ExperienceDetail({ params }) {
  const { id } = await params;
  return <ExperienceDetailClient id={id}/>;
}