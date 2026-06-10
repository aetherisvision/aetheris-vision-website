"use client";

import { useState } from "react";
import Image from "next/image";
import type { Post } from "@/lib/posts";
import BlogSubscribeCard from "@/components/BlogSubscribeCard";

/** Mono metadata line shared by the featured banner and list rows. */
function PostMeta({ post }: { post: Post }) {
  return (
    <p className="font-mono text-[11px] uppercase tracking-wider text-gray-500">
      {post.date} · <span className="text-blue-400">{post.category}</span> · {post.readTime}
    </p>
  );
}

export default function BlogClientPage({
  posts,
  categories,
}: {
  posts: Post[];
  categories: string[];
}) {
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const featured = posts.find((p) => p.featured);
  const rest = posts.filter((p) => !p.featured);

  const filtered =
    activeCategory === "All"
      ? rest
      : rest.filter((p) => p.category === activeCategory);

  return (
    <>
      {/* Page header */}
      <header className="mb-14">
        <h1 className="font-serif text-5xl md:text-6xl font-medium tracking-tight text-white mb-4">
          Insights &amp; Analysis
        </h1>
        <p className="text-gray-400 text-lg font-light leading-relaxed">
          Perspectives on atmospheric modeling, machine learning architecture, and
          complex systems engineering.
        </p>
      </header>

      {/* Featured post */}
      {featured && (
        <a
          href={`/blog/${featured.slug}`}
          className="group block mb-16 no-underline"
        >
          <div className="relative aspect-[21/9] rounded-lg overflow-hidden border border-white/10 mb-5">
            <Image
              src="/images/blog/blog-post-bg.webp"
              alt=""
              aria-hidden="true"
              fill
              className="object-cover opacity-80 group-hover:opacity-95 group-hover:scale-[1.02] transition duration-500"
              sizes="(max-width: 768px) 100vw, 768px"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/85 via-[#050505]/20 to-transparent" />
            <span className="absolute top-4 left-4 font-mono text-[11px] uppercase tracking-wider text-white/90 border border-white/25 bg-black/40 backdrop-blur-sm rounded-sm px-2 py-1">
              Featured
            </span>
          </div>
          <PostMeta post={featured} />
          <h2 className="font-serif text-3xl md:text-4xl font-medium text-white leading-snug mt-2 mb-3 group-hover:text-blue-300 transition-colors">
            {featured.title}
          </h2>
          <p className="text-gray-400 font-light leading-relaxed">{featured.summary}</p>
        </a>
      )}

      {/* Category filter */}
      <nav
        aria-label="Filter posts by category"
        className="flex flex-wrap gap-x-6 gap-y-2 border-y border-white/10 py-3 mb-12"
      >
        {["All", ...categories].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            aria-pressed={activeCategory === cat}
            className={`text-sm transition-colors ${
              activeCategory === cat
                ? "text-white underline underline-offset-8 decoration-blue-500"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {cat}
          </button>
        ))}
      </nav>

      {/* Post list — plain hairline-separated reading rows */}
      <div className="divide-y divide-white/[0.08] mb-20">
        {filtered.length === 0 && (
          <p className="text-gray-600 font-light py-8">No posts in this category yet.</p>
        )}
        {filtered.map((post) => (
          <a
            key={post.id}
            href={`/blog/${post.slug}`}
            className="group block py-8 first:pt-0 no-underline"
          >
            <PostMeta post={post} />
            <h2 className="font-serif text-2xl md:text-[1.75rem] font-medium text-white leading-snug mt-2 mb-2.5 group-hover:text-blue-300 transition-colors">
              {post.title}
            </h2>
            <p className="text-gray-400 font-light leading-relaxed">{post.summary}</p>
          </a>
        ))}
      </div>

      {/* Subscribe — moved below the reading list */}
      <BlogSubscribeCard />
    </>
  );
}
