import Planner from "./Planner";
import SeoContent from "./components/SeoContent";
import { jsonLd } from "./seo";

export default function Home() {
  return (
    <>
      {/* Structured data for search engines (hardcoded, no user input). */}
      {jsonLd().map((data, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
        />
      ))}
      <Planner />
      <SeoContent />
    </>
  );
}
