import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import axe from "axe-core";
import App from "./App";

// Basic accessibility test for the main app

describe("Accessibility", () => {
  it("App should have no major accessibility violations", async () => {
    const { container } = render(<App />);
    // axe-core expects a raw HTML element or document
    const results = await axe.run(container);
    expect(results.violations.length).toBe(0);
  });
});
