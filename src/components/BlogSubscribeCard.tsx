const subscribeUrl = process.env.NEXT_PUBLIC_BLOG_SUBSCRIBE_URL?.trim();

export default function BlogSubscribeCard() {
  return (
    <section className="mb-14 rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-white mb-2">
            Subscribe for New Posts
          </h2>
          <p className="text-gray-400 font-light leading-relaxed">
            Get new insights on AI, meteorology, and technical defense consulting delivered directly to your inbox.
          </p>
        </div>

        {subscribeUrl ? (
          <form
            action={subscribeUrl}
            method="post"
            className="w-full md:w-auto flex flex-col sm:flex-row gap-2"
          >
            <label htmlFor="subscribe-email" className="sr-only">
              Email address
            </label>
            <input
              id="subscribe-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="h-11 min-w-0 sm:min-w-[250px] rounded-md border border-white/10 bg-black px-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="h-11 rounded-md bg-white px-5 text-sm font-medium text-black transition-colors hover:bg-gray-200"
            >
              Subscribe
            </button>
          </form>
        ) : (
          <a
            href="/contact?topic=Blog%20Subscription"
            className="inline-flex h-11 items-center justify-center rounded-md bg-white px-5 text-sm font-medium text-black transition-colors hover:bg-gray-200"
          >
            Subscribe by Email
          </a>
        )}
      </div>
    </section>
  );
}