import { renderHook, act, waitFor } from "@testing-library/react";
import { vi, beforeEach, afterEach, describe, it, expect } from "vitest";
import { useProjects } from "./useProjects";

// Mock fetch globally
global.fetch = vi.fn();
const mockFetch = global.fetch as ReturnType<typeof vi.fn>;

describe("useProjects", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should fetch projects successfully on mount", async () => {
    const mockProjects = [
      { id: 1, name: "Project 1", description: "Description 1" },
      { id: 2, name: "Project 2", description: "Description 2" },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ projects: mockProjects }),
    } as Response);

    const { result } = renderHook(() => useProjects());

    // Initially loading should be true
    expect(result.current.loading).toBe(true);
    expect(result.current.projects).toEqual([]);
    expect(result.current.error).toBe(null);

    // Wait for the fetch to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.projects).toEqual(mockProjects);
    expect(result.current.error).toBe(null);
    expect(mockFetch).toHaveBeenCalledWith("/api/projects", {
      credentials: "include",
    });
  });

  it("should handle fetch error", async () => {
    const errorMessage = "Failed to fetch projects";
    mockFetch.mockRejectedValueOnce(new Error(errorMessage));

    const { result } = renderHook(() => useProjects());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.projects).toEqual([]);
    expect(result.current.error).toBe(errorMessage);
  });

  it("should handle response not ok", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: "Server error" }),
    } as Response);

    const { result } = renderHook(() => useProjects());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.projects).toEqual([]);
    expect(result.current.error).toBe("Failed to fetch projects");
  });

  it("should handle malformed response data", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}), // No projects field
    } as Response);

    const { result } = renderHook(() => useProjects());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.projects).toEqual([]);
    expect(result.current.error).toBe(null);
  });

  it("should handle refetch functionality", async () => {
    const initialProjects = [
      { id: 1, name: "Project 1", description: "Description 1" },
    ];
    const updatedProjects = [
      { id: 1, name: "Project 1", description: "Description 1" },
      { id: 2, name: "Project 2", description: "Description 2" },
    ];

    // Initial fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ projects: initialProjects }),
    } as Response);

    const { result } = renderHook(() => useProjects());

    await waitFor(() => {
      expect(result.current.projects).toEqual(initialProjects);
    });

    // Setup refetch response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ projects: updatedProjects }),
    } as Response);

    // Call refetch
    act(() => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.projects).toEqual(updatedProjects);
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("should handle unknown error types", async () => {
    mockFetch.mockRejectedValueOnce("String error"); // Non-Error object

    const { result } = renderHook(() => useProjects());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("Unknown error");
  });

  it("should reset error state on refetch", async () => {
    // First call fails
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useProjects());

    await waitFor(() => {
      expect(result.current.error).toBe("Network error");
    });

    // Second call succeeds
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ projects: [] }),
    } as Response);

    act(() => {
      result.current.refetch();
    });

    // Error should be cleared during loading
    expect(result.current.error).toBe(null);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(null);
  });

  it("should maintain loading state during refetch", async () => {
    // Initial successful fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ projects: [] }),
    } as Response);

    const { result } = renderHook(() => useProjects());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Setup delayed response for refetch
    let resolveRefetch: (value: Response) => void;
    const refetchPromise = new Promise((resolve) => {
      resolveRefetch = resolve;
    });

    mockFetch.mockReturnValueOnce(refetchPromise as Promise<Response>);

    act(() => {
      result.current.refetch();
    });

    // Should be loading during refetch
    expect(result.current.loading).toBe(true);

    // Resolve the refetch
    act(() => {
      resolveRefetch(
        new Response(JSON.stringify({ projects: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });
});
