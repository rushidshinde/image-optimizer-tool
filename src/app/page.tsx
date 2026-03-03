import { Metadata } from "next";
import { Dashboard } from "@/components/Dashboard";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Analyze the images on any web page. Identify missing responsive sizes, discover optimization opportunities, and grab perfectly sized image formats directly from the dashboard.",
};

export default function Home() {
  return <Dashboard />;
}
