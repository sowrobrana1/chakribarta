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
      <p
        style={{
          margin: "10px 12px 0",
          padding: "10px 12px",
          borderRadius: 10,
          background: "#fff8e1",
          border: "1px solid #f0d48a",
          fontSize: 13,
          lineHeight: 1.7,
          color: "#5d4037",
        }}
      >
        দাবিত্যাগ: ChakriBarta সরকারি অ্যাপ নয় এবং কোনো সরকারি সংস্থার
        প্রতিনিধিত্ব করে না। সরকারি সার্কুলারের তথ্য সংশ্লিষ্ট দপ্তরের
        অফিসিয়াল বিজ্ঞপ্তি থেকে সংগৃহীত — মূল উৎসের লিংক প্রতিটি সার্কুলারের
        পাতায় দেওয়া আছে।
      </p>
      <ToolsShortcut />
      <HomeFeed jobs={jobs} initialCategory={initialCategory} />
      <BottomNav active={initialCategory === "ফলাফল" ? "ফলাফল" : "হোম"} />
    </>
  );
}
