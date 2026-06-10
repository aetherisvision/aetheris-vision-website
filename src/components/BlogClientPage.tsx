"use client";

import { useState } from "react";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import type { Post } from "@/lib/posts";
import BlogSubscribeCard from "@/components/BlogSubscribeCard";

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
      <div className="mb-12">
        <h1 className="text-4xl md:text-6xl font-semibold tracking-tighter text-white mb-4">
          Insights & <span className="text-blue-500">Analysis</span>
        </h1>
        <p className="text-gray-400 text-lg md:text-xl max-w-2xl font-light">
          Executive perspectives on atmospheric modeling, machine learning architecture, and complex systems engineering.
        </p>
      </div>

      <BlogSubscribeCard />

      {/* Featured post */}
      {featured && (
        <a
          href={`/blog/${featured.slug}`}
          className="group block rounded-2xl border border-white/10 bg-white/[0.03] p-8 md:p-10 mb-14 relative overflow-hidden transition-all hover:bg-white/[0.05] hover:border-white/20 no-underline"
        >
          {/* Subtle blue glow top-left */}
          <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-start gap-6 md:gap-10">
            <div className="md:w-56 shrink-0 flex flex-col gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest text-blue-400 uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
                Featured
              </span>
              <span className="text-sm font-medium text-gray-400 mt-1">{featured.category}</span>
              <span className="text-sm text-gray-600">{featured.date}</span>
              <span className="text-sm text-gray-700">{featured.readTime}</span>
            </div>

            <div className="flex-1">
              <h2 className="text-2xl md:text-3xl font-semibold text-white mb-3 group-hover:text-blue-300 transition-colors leading-snug">
                {featured.title}
              </h2>
              <p className="text-gray-400 font-light leading-relaxed mb-5">
                {featured.summary}
              </p>
              <div className="inline-flex items-center gap-2 text-sm font-medium text-white group-hover:gap-3 transition-all">
                Read Article <ArrowRightIcon className="h-4 w-4" />
              </div>
            </div>
          </div>
        </a>
      )}

      {/* Category filter pills */}
      <div className="flex flex-wrap gap-2 mb-10">
        {["All", ...categories].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
              activeCategory === cat
                ? "bg-blue-600 border-blue-600 text-white"
                : "border-white/10 text-gray-400 hover:text-white hover:border-white/20 bg-transparent"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Post list */}
      <div className="grid gap-6">
        {filtered.length === 0 && (
          <p className="text-gray-600 font-light py-8">No posts in this category yet.</p>
        )}
        {filtered.map((post) => (
          <a
            key={post.id}
            href={`/blog/${post.slug}`}
            className="group flex flex-col md:flex-row md:items-start gap-4 md:gap-8 rounded-2xl border border-white/5 bg-white/[0.02] p-8 transition-all hover:bg-white/[0.04] hover:border-white/10 cursor-pointer no-underline"
          >
            <div className="md:w-48 shrink-0 text-sm text-gray-500 py-1 flex flex-col gap-1">
              <span className="font-medium text-blue-400">{post.category}</span>
              <span>{post.date}</span>
              <span className="text-gray-600">{post.readTime}</span>
            </div>

            <div className="flex-1">
              <h2 className="text-2xl font-medium text-white mb-3 group-hover:text-blue-400 transition-colors">
                {post.title}
              </h2>
              <p className="text-gray-400 font-light leading-relaxed mb-4">
                {post.summary}
              </p>
              <div className="text-sm font-medium text-white inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Read Article &#8594;
              </div>
            </div>
          </a>
        ))}
      </div>
    </>
  );
}
