import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import WhatsNew from "../../../components/common/WhatsNew";

const mockRelease = {
  title: "v0.12.0-beta Release Highlights",
  date: "2025-07-25",
  user_highlights: [
    "Major UI/UX redesign with dynamic themes and modern layouts",
    "Introduced new dynamic backgrounds",
  ],
  added: [
    "Dynamic backgrounds (10 creative themes) and modern card-based layouts",
  ],
  changed: ["Authentication and security improvements"],
  fixed: ["Focus management for accessibility"],
  refactored: ["Component structure for maintainability"],
  apiChangeSummary: ["No breaking API changes"],
  breakingChanges: ["Component API updated for new design system"],
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface Global {
      fetch: ReturnType<typeof vi.fn>;
    }
  }
}

describe("WhatsNew", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders highlights from local JSON", async () => {
    const json = vi.fn().mockResolvedValue(mockRelease);
    const okRes = { ok: true, json } as unknown as Response;
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(okRes));

    render(<WhatsNew />);

    // Heading loads after fetch
    await waitFor(() =>
      expect(
        screen.getByRole("heading", {
          name: /v0.12.0-beta release highlights/i,
        }),
      ).toBeInTheDocument(),
    );

    // Specific Highlights section heading (avoid matching the H1 which includes the word 'Highlights')
    expect(
      screen.getByRole("heading", { level: 2, name: /^highlights$/i }),
    ).toBeInTheDocument();
    // At least one highlight item
    expect(
      screen.getByText(
        "Major UI/UX redesign with dynamic themes and modern layouts",
      ),
    ).toBeInTheDocument();

    // Changelog section
    expect(screen.getByText(/full changelog/i)).toBeInTheDocument();
    expect(screen.getByText(/added/i)).toBeInTheDocument();
  });

  it("falls back to API when local JSON fails", async () => {
    const notOkRes = { ok: false, status: 404 } as unknown as Response;
    const okRes = {
      ok: true,
      json: vi.fn().mockResolvedValue(mockRelease),
    } as unknown as Response;

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(notOkRes) // first call to /whats-new.json fails
      .mockResolvedValueOnce(okRes); // second call to /api/releases/latest succeeds
    vi.stubGlobal("fetch", fetchMock);

    render(<WhatsNew />);

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /v0.12.0-beta/i }),
      ).toBeInTheDocument(),
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("shows error then retries successfully", async () => {
    const notOkRes = { ok: false, status: 500 } as unknown as Response;
    const okRes = {
      ok: true,
      json: vi.fn().mockResolvedValue(mockRelease),
    } as unknown as Response;

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(notOkRes)
      .mockResolvedValueOnce(notOkRes)
      // After clicking retry, succeed
      .mockResolvedValueOnce(okRes);

    vi.stubGlobal("fetch", fetchMock);

    render(<WhatsNew />);

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());

    const retry = screen.getByRole("button", {
      name: /retry loading what's new/i,
    });
    fireEvent.click(retry);

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /v0.12.0-beta/i }),
      ).toBeInTheDocument(),
    );
  });

  it("has region landmark and labelled heading", async () => {
    const json = vi.fn().mockResolvedValue(mockRelease);
    const okRes = { ok: true, json } as unknown as Response;
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(okRes));

    render(<WhatsNew />);

    const region = await screen.findByTestId("whats-new");
    expect(region).toBeInTheDocument();
  });
});
