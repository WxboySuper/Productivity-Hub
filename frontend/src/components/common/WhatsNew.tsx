import React, { useEffect, useMemo, useState } from "react";

type ReleaseData = {
  version?: string;
  date?: string;
  title?: string;
  highlights?: Array<{
    id: string;
    title: string;
    description: string;
    details?: string[];
    image?: string;
    links?: { label: string; href: string }[];
  }>;
  user_highlights?: string[];
  added?: string[];
  changed?: string[];
  fixed?: string[];
  refactored?: string[];
  apiChangeSummary?: string[];
  breakingChanges?: string[];
};

const DEFAULT_JSON_URL = "/whats-new.json"; // Vite serves public/ at root
const FALLBACK_API_URL = "/api/releases/latest";

/**
 * Fetch the latest release data for the What\'s New page.
 * Tries the static JSON first, then falls back to the backend endpoint.
 */
async function fetchLatestRelease(): Promise<ReleaseData> {
  // Try static JSON first (fast/local), then fallback to backend endpoint
  try {
    const res = await fetch(DEFAULT_JSON_URL, { cache: "no-store" });
    if (res.ok) return (await res.json()) as ReleaseData;
  } catch (err) {
    console.error("Failed to fetch static release data:", err);
  }

  const res2 = await fetch(FALLBACK_API_URL, { cache: "no-store" });
  if (res2.ok) return (await res2.json()) as ReleaseData;

  throw new Error("Failed to fetch release data");
}

/**
 * Collapsible changelog section (e.g., Added, Changed, Fixed).
 */
function Section({
  id,
  title,
  items,
  defaultOpen = false,
}: {
  id: string;
  title: string;
  items?: string[];
  defaultOpen?: boolean;
}) {
  if (!items || items.length === 0) return null;
  return (
    <details
      className="bg-white/90 dark:bg-gray-800 rounded-lg shadow border border-blue-100 dark:border-gray-700"
      open={defaultOpen}
    >
      <summary
        className="cursor-pointer select-none list-none px-4 py-3 font-semibold text-blue-900 dark:text-blue-200 flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-t-lg"
        aria-controls={`${id}-content`}
        aria-expanded={defaultOpen}
      >
        {title}
        <span aria-hidden="true" className="text-sm text-gray-500">
          ({items.length})
        </span>
      </summary>
      <div id={`${id}-content`} className="px-4 pb-4">
        <ul className="list-disc pl-6 space-y-2">
          {items.map((it, idx) => (
            <li key={idx} className="text-gray-800 dark:text-gray-200">
              {it}
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}

/**
 * What\'s New component. Displays release highlights and the full changelog.
 */
export default function WhatsNew() {
  const [data, setData] = useState<ReleaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const releaseData = await fetchLatestRelease();
      setData(releaseData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to load release info");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const title =
    data?.title || (data?.version ? `Release ${data.version}` : "What’s New");
  const formattedDate = useMemo(() => {
    if (!data?.date) return null;
    const parsedDate = new Date(data.date);
    return isNaN(parsedDate.valueOf())
      ? data.date
      : parsedDate.toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
  }, [data?.date]);

  if (loading) {
    return (
      <section className="max-w-5xl mx-auto p-4 sm:p-6" aria-busy="true">
        <div className="bg-white/90 rounded-lg shadow p-6 border border-blue-100">
          <div className="animate-pulse space-y-4">
            <div className="h-7 bg-blue-100 rounded w-1/3" />
            <div className="h-4 bg-blue-50 rounded w-1/4" />
            <div className="h-16 bg-blue-50 rounded" />
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="max-w-3xl mx-auto p-4 sm:p-6">
        <div
          role="alert"
          className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 shadow"
        >
          <p className="font-semibold mb-2">Failed to load What&apos;s New</p>
          <p className="mb-4 text-sm">{error}</p>
          <button
            onClick={load}
            className="phub-action-btn"
            aria-label="Retry loading What's New"
          >
            Retry
          </button>
        </div>
      </section>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <section
      aria-labelledby="whatsnew-title"
      className="max-w-6xl mx-auto p-4 sm:p-6"
      data-testid="whats-new"
    >
      <div className="mb-6">
        <h1
          id="whatsnew-title"
          className="text-3xl sm:text-4xl font-extrabold text-blue-900 drop-shadow phub-text-gradient"
        >
          {title}
        </h1>
        {formattedDate && (
          <p className="text-gray-600 mt-1">Released on {formattedDate}</p>
        )}
      </div>

      {/* Highlights */}
      {Array.isArray(data.highlights) && data.highlights.length > 0 ? (
        <section aria-labelledby="highlights-heading" className="mb-8">
          <h2
            id="highlights-heading"
            className="text-2xl font-bold text-blue-800 mb-3"
          >
            Highlights
          </h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.highlights.map((h) => (
              <li
                key={h.id}
                className="bg-white/90 dark:bg-gray-800 border border-blue-100 dark:border-gray-700 rounded-lg shadow p-4 flex flex-col gap-3"
              >
                <div className="flex items-start gap-3">
                  {h.image ? (
                    <img
                      src={h.image}
                      alt={h.title}
                      className="w-16 h-16 object-cover rounded-md border border-blue-100 hidden sm:block"
                    />
                  ) : null}
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {h.title}
                    </h3>
                    <p className="text-gray-700 dark:text-gray-200 mt-1">
                      {h.description}
                    </p>
                  </div>
                </div>
                {Array.isArray(h.details) && h.details.length > 0 && (
                  <ul className="list-disc pl-5 space-y-1 text-gray-800 dark:text-gray-200">
                    {h.details.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                )}
                {Array.isArray(h.links) && h.links.length > 0 && (
                  <div className="pt-1">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300 mr-2">
                      Learn more:
                    </span>
                    {h.links.map((lnk, i) => (
                      <a
                        key={`${h.id}-link-${i}`}
                        href={lnk.href}
                        target="_self"
                        rel="noopener"
                        className="text-blue-700 hover:underline mr-3"
                      >
                        {lnk.label}
                      </a>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : data.user_highlights && data.user_highlights.length > 0 ? (
        <section aria-labelledby="highlights-heading" className="mb-8">
          <h2
            id="highlights-heading"
            className="text-2xl font-bold text-blue-800 mb-3"
          >
            Highlights
          </h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.user_highlights.map((h) => (
              <li
                key={h}
                className="bg-white/90 dark:bg-gray-800 border border-blue-100 dark:border-gray-700 rounded-lg shadow p-4"
              >
                <span className="text-gray-800 dark:text-gray-100">{h}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Changelog sections */}
      <section aria-labelledby="changelog-heading" className="space-y-4">
        <h2 id="changelog-heading" className="text-2xl font-bold text-blue-800">
          Full Changelog
        </h2>
        <Section id="added" title="Added" items={data.added} defaultOpen />
        <Section id="changed" title="Changed" items={data.changed} />
        <Section id="fixed" title="Fixed" items={data.fixed} />
        <Section id="refactored" title="Refactored" items={data.refactored} />
        <Section
          id="api"
          title="API Change Summary"
          items={data.apiChangeSummary}
        />
        <Section
          id="breaking"
          title="Breaking Changes"
          items={data.breakingChanges}
        />
      </section>
    </section>
  );
}
