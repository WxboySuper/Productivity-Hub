// Example of how to refactor for better testability
import { useState, useEffect, useCallback } from "react";
import { ensureCsrfToken } from "./useTasks";

export interface Project {
  id: number;
  name: string;
  description?: string;
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/projects", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch projects");

      const data = await response.json();
      setProjects(data.projects || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteProject = useCallback(
    async (id: number) => {
      try {
        const csrfToken = await ensureCsrfToken();
        const response = await fetch(`/api/projects/${id}`, {
          method: "DELETE",
          credentials: "include",
          headers: {
            ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
          },
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to delete project");
        }
        // Refetch projects to update the list
        await fetchProjects();
      } catch (err) {
        // Re-throw the error to be caught by the component
        throw err;
      }
    },
    [fetchProjects],
  );

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return {
    projects,
    loading,
    error,
    refetch: fetchProjects,
    deleteProject,
  };
}
