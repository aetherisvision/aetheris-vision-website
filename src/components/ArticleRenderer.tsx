"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import type { Components } from "react-markdown";
import type { ClassAttributes, HTMLAttributes } from "react";

// ── Custom component map — styled to match the dark Aetheris aesthetic ────────

const components: Components = {
  h1: ({ children }) => (
    <h1 className="text-3xl md:text-4xl font-semibold text-white mt-14 mb-6 tracking-tight leading-tight">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-xl md:text-2xl font-semibold text-white mt-14 mb-5 tracking-tight">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-lg md:text-xl font-semibold text-gray-200 mt-10 mb-3 tracking-tight">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-base font-semibold text-gray-300 mt-8 mb-2">{children}</h4>
  ),
  p: ({ children }) => (
    <p className="text-gray-400 font-light leading-relaxed mb-6">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="text-gray-200 font-semibold">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="text-gray-300 italic">{children}</em>
  ),
  a: ({ href, children }) => {
    const isInternal = href?.startsWith("/");
    return (
      <a
        href={href}
        {...(!isInternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className="text-blue-400 hover:text-blue-300 underline underline-offset-2 decoration-blue-400/40 hover:decoration-blue-300/60 transition"
      >
        {children}
      </a>
    );
  },
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-blue-500/50 pl-5 py-1 my-8 text-gray-300 font-light leading-relaxed italic">
      {children}
    </blockquote>
  ),
  ul: ({ children }) => (
    <ul className="space-y-2.5 my-6 ml-1">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="space-y-3 my-6 ml-1 list-none">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="flex items-start gap-3 text-gray-400 font-light leading-relaxed">
      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
      <span>{children}</span>
    </li>
  ),
  hr: () => <div className="h-px w-full bg-white/5 my-10" />,
  img: ({ src, alt }) => (
    <span className="block my-8">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt ?? ""}
        className="rounded-xl border border-white/5 w-full object-cover"
      />
      {alt && (
        <span className="block text-center text-xs text-gray-600 mt-2 italic">{alt}</span>
      )}
    </span>
  ),
  table: ({ children }) => (
    <div className="my-8 overflow-x-auto rounded-xl border border-white/5">
      <table className="w-full text-sm text-left">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="border-b border-white/5 bg-white/[0.03]">{children}</thead>
  ),
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => (
    <tr className="border-b border-white/5 last:border-0">{children}</tr>
  ),
  th: ({ children }) => (
    <th className="px-4 py-3 text-xs font-semibold tracking-widest text-gray-500 uppercase">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-3 text-gray-400 font-light">{children}</td>
  ),
  code: (
    props: ClassAttributes<HTMLElement> &
      HTMLAttributes<HTMLElement> & { inline?: boolean }
  ) => {
    const { inline, className, children } = props;
    const match = /language-(\w+)/.exec(className ?? "");
    const language = match?.[1] ?? "text";

    if (!inline && match) {
      return (
        <div className="my-8 rounded-xl overflow-hidden border border-white/5">
          <div className="flex items-center justify-between px-4 py-2 bg-white/[0.03] border-b border-white/5">
            <span className="text-xs font-mono text-gray-500">{language}</span>
          </div>
          <SyntaxHighlighter
            style={oneDark}
            language={language}
            PreTag="div"
            customStyle={{
              margin: 0,
              borderRadius: 0,
              background: "rgba(255,255,255,0.02)",
              fontSize: "0.85rem",
              lineHeight: "1.6",
            }}
          >
            {String(children).replace(/\n$/, "")}
          </SyntaxHighlighter>
        </div>
      );
    }

    return (
      <code className="px-1.5 py-0.5 rounded bg-white/[0.07] text-blue-300 text-[0.85em] font-mono">
        {children}
      </code>
    );
  },
};

// ── Public component ──────────────────────────────────────────────────────────

export default function ArticleRenderer({ content }: { content: string }) {
  return (
    <article className="max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
