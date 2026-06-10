import { posts, getCategories } from "@/lib/posts";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BlogClientPage from "@/components/BlogClientPage";
import { SITE } from "@/lib/constants";

export const metadata = {
  title: `Blog | ${SITE.name}`,
  description: `Insights on AI, meteorology, and systems engineering from ${SITE.name}.`,
};

export default function BlogIndex() {
  const categories = getCategories();

  return (
    <div className="flex flex-col min-h-[100dvh]">
      <Navbar />

      <main id="main" className="flex-1 pt-32 pb-24 bg-[#050505] relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 -z-20">
          <img
            src="/images/blog/blog-index-bg.webp"
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover opacity-[0.18] mix-blend-screen"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-[#0e1726]/60 via-black/90 to-black -z-10" />

        <div className="mx-auto max-w-5xl px-6">
          <BlogClientPage posts={posts} categories={categories} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
