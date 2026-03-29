import { notFound } from "next/navigation";
import { posts, getPostBySlug, getPrevNextPosts } from "@/lib/posts";
import { SITE } from "@/lib/constants";
import { publisherRef } from "@/lib/jsonld";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ArticleRenderer from "@/components/ArticleRenderer";
import BlogComments from "@/components/BlogComments";
import Link from "next/link";
import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    title: `${post.title} | ${SITE.name}`,
    description: post.summary,
  };
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const { prev, next } = getPrevNextPosts(slug);

  return (
    <div className="flex flex-col min-h-[100dvh]">
      <Navbar />

      <main id="main" className="flex-1 pt-32 pb-24 bg-[#050505] relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 -z-20">
          <img
            src="https://images.unsplash.com/photo-1504608524841-42f1e38e80e0?q=80&w=2500"
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover opacity-[0.12] mix-blend-screen"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-[#0e1726]/60 via-black/90 to-black -z-10" />

        <div className="mx-auto max-w-3xl px-6">
          {/* Back link */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition mb-10"
          >
            <ArrowLeftIcon className="h-4 w-4" /> Back to Insights
          </Link>

          {/* Header */}
          <div className="mb-10">
            <div className="flex items-center gap-3 text-sm mb-4">
              <span className="font-medium text-blue-400">{post.category}</span>
              <span className="text-white/10">·</span>
              <span className="text-gray-500">{post.date}</span>
              <span className="text-white/10">·</span>
              <span className="text-gray-600">{post.readTime}</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-white mb-6 leading-[1.15]">
              {post.title}
            </h1>
            <p className="text-lg text-gray-400 font-light leading-relaxed border-l-2 border-blue-500/40 pl-4">
              {post.summary}
            </p>
          </div>

          {/* Author byline */}
          <div className="flex items-center gap-4 py-6 border-t border-b border-white/5 mb-12">
            <div className="h-10 w-10 rounded-full bg-gray-800 border border-white/10 flex items-center justify-center text-sm font-semibold text-gray-300 shrink-0">
              {post.author.initials}
            </div>
            <div>
              <p className="text-sm font-medium text-white">{post.author.name}</p>
              <p className="text-xs text-gray-500">{post.author.title}</p>
            </div>
          </div>

          {/* Article Body */}
          <ArticleRenderer content={post.content} />

          <BlogComments />

          <div className="h-px w-full bg-white/5 mt-16 mb-10" />

          {/* Prev / Next navigation */}
          {(prev || next) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
              {prev ? (
                <a
                  href={`/blog/${prev.slug}`}
                  className="group flex flex-col rounded-xl border border-white/5 bg-white/[0.02] p-5 hover:bg-white/[0.04] hover:border-white/10 transition"
                >
                  <span className="text-xs text-gray-600 mb-2 flex items-center gap-1">
                    <ArrowLeftIcon className="h-3 w-3" /> Previous
                  </span>
                  <span className="text-sm font-medium text-gray-300 group-hover:text-white transition leading-snug">
                    {prev.title}
                  </span>
                </a>
              ) : (
                <div />
              )}
              {next ? (
                <a
                  href={`/blog/${next.slug}`}
                  className="group flex flex-col rounded-xl border border-white/5 bg-white/[0.02] p-5 hover:bg-white/[0.04] hover:border-white/10 transition text-right"
                >
                  <span className="text-xs text-gray-600 mb-2 flex items-center justify-end gap-1">
                    Next <ArrowRightIcon className="h-3 w-3" />
                  </span>
                  <span className="text-sm font-medium text-gray-300 group-hover:text-white transition leading-snug">
                    {next.title}
                  </span>
                </a>
              ) : (
                <div />
              )}
            </div>
          )}

          {/* CTA */}
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <p className="text-white font-medium mb-1">Have a project in mind?</p>
              <p className="text-gray-500 text-sm font-light">
                We build custom websites and web applications for Oklahoma businesses. Veteran-owned, based in Mustang, OK.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <a
                href="/intake"
                className="inline-flex h-10 items-center justify-center rounded-md bg-white px-6 text-sm font-medium text-black hover:bg-gray-200 transition"
              >
                Start a Project
              </a>
              <a
                href={`mailto:${SITE.email}`}
                className="inline-flex h-10 items-center justify-center rounded-md border border-white/10 px-6 text-sm font-medium text-white hover:bg-white/5 transition"
              >
                Email Us
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* BlogPosting JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.title,
            description: post.summary,
            datePublished: post.date,
            author: {
              "@type": "Person",
              name: post.author.name,
              jobTitle: post.author.title,
            },
            publisher: publisherRef,
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": `${SITE.url}/blog/${slug}`,
            },
            articleSection: post.category,
          }),
        }}
      />
    </div>
  );
}
