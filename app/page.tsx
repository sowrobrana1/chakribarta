import Header from "@/components/Header";
import HomeFeed from "@/components/HomeFeed";
import ToolsShortcut from "@/components/ToolsShortcut";
import BottomNav from "@/components/BottomNav";
import { getCirculars } from "@/lib/data";

export const dynamic = "force-dynamic";

interface HomeProps {
  searchParams?: { cat?: string };
}

export default async function HomePage({ searchParams }: HomeProps) {
  const initialCategory = searchParams?.cat ?? "সব";
  const jobs = await getCirculars();

  return (
    <>
      <Header />
      <ToolsShortcut />
      <HomeFeed jobs={jobs} initialCategory={initialCategory} />
      <BottomNav active={initialCategory === "ফলাফল" ? "ফলাফল" : "হোম"} />
    </>
  );
}
