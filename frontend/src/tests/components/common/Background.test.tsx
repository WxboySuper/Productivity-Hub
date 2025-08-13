import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import Background, {
  BackgroundType,
} from "../../../components/common/Background";

describe("Background", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Component Rendering", () => {
    it("renders with default background type", () => {
      const { container } = render(<Background />);

      const backgroundElement = container.querySelector(".dynamic-background");
      expect(backgroundElement).toBeInTheDocument();
      expect(backgroundElement).toHaveClass("bg-creative-dots");
    });

    it("renders with specified background type", () => {
      const { container } = render(
        <Background backgroundType="neural-network" />,
      );

      const backgroundElement = container.querySelector(".dynamic-background");
      expect(backgroundElement).toBeInTheDocument();
      expect(backgroundElement).toHaveClass("bg-neural-network");
    });

    it("renders with glass effect container structure", () => {
      const { container } = render(
        <Background backgroundType="cosmic-waves" />,
      );

      const backgroundElement = container.querySelector(".dynamic-background");
      expect(backgroundElement).toBeInTheDocument();
      expect(backgroundElement).toHaveClass("bg-cosmic-waves");
    });
  });

  describe("Background Type Variations", () => {
    const backgroundTypes: BackgroundType[] = [
      "creative-dots",
      "neural-network",
      "cosmic-waves",
      "productivity-minimal",
      "sunset-gradient",
      "forest-depth",
      "aurora-borealis",
      "geometric-dreams",
      "ocean-depths",
      "cyberpunk-neon",
    ];

    backgroundTypes.forEach((bgType) => {
      it(`renders correctly with ${bgType} background`, () => {
        const { container } = render(<Background backgroundType={bgType} />);

        const backgroundElement = container.querySelector(
          ".dynamic-background",
        );
        expect(backgroundElement).toBeInTheDocument();
        expect(backgroundElement).toHaveClass(`bg-${bgType}`);
      });
    });
  });

  describe("Props Handling", () => {
    it("updates background when backgroundType prop changes", () => {
      const { container, rerender } = render(
        <Background backgroundType="creative-dots" />,
      );

      let backgroundElement = container.querySelector(".dynamic-background");
      expect(backgroundElement).toHaveClass("bg-creative-dots");

      rerender(<Background backgroundType="sunset-gradient" />);

      backgroundElement = container.querySelector(".dynamic-background");
      expect(backgroundElement).toHaveClass("bg-sunset-gradient");
    });

    it("handles undefined backgroundType gracefully", () => {
      const { container } = render(<Background backgroundType={undefined} />);

      const backgroundElement = container.querySelector(".dynamic-background");
      expect(backgroundElement).toBeInTheDocument();
      // Should fall back to default
      expect(backgroundElement).toHaveClass("bg-creative-dots");
    });
  });

  describe("CSS Classes and Styling", () => {
    it("applies correct base CSS classes", () => {
      const { container } = render(
        <Background backgroundType="aurora-borealis" />,
      );

      const backgroundElement = container.querySelector(".dynamic-background");
      expect(backgroundElement).toHaveClass("dynamic-background");
      expect(backgroundElement).toHaveClass("bg-aurora-borealis");
    });

    it("maintains consistent class structure across background types", () => {
      const backgroundTypes: BackgroundType[] = [
        "geometric-dreams",
        "ocean-depths",
        "cyberpunk-neon",
      ];

      backgroundTypes.forEach((bgType) => {
        const { container } = render(<Background backgroundType={bgType} />);
        const backgroundElement = container.querySelector(
          ".dynamic-background",
        );

        expect(backgroundElement).toHaveClass("dynamic-background");
        expect(backgroundElement).toHaveClass(`bg-${bgType}`);
      });
    });
  });

  describe("Component State Management", () => {
    it("maintains internal state consistency with props", () => {
      const { container, rerender } = render(
        <Background backgroundType="productivity-minimal" />,
      );

      let backgroundElement = container.querySelector(".dynamic-background");
      expect(backgroundElement).toHaveClass("bg-productivity-minimal");

      // Rerender with same background type
      rerender(<Background backgroundType="productivity-minimal" />);

      backgroundElement = container.querySelector(".dynamic-background");
      expect(backgroundElement).toHaveClass("bg-productivity-minimal");
    });

    it("handles rapid background type changes", () => {
      const { container, rerender } = render(
        <Background backgroundType="creative-dots" />,
      );

      const backgroundChanges: BackgroundType[] = [
        "neural-network",
        "cosmic-waves",
        "sunset-gradient",
        "forest-depth",
      ];

      backgroundChanges.forEach((bgType) => {
        rerender(<Background backgroundType={bgType} />);
        const backgroundElement = container.querySelector(
          ".dynamic-background",
        );
        expect(backgroundElement).toHaveClass(`bg-${bgType}`);
      });
    });
  });

  describe("Accessibility and Performance", () => {
    it("renders without accessibility violations", () => {
      const { container } = render(
        <Background backgroundType="aurora-borealis" />,
      );

      const backgroundElement = container.querySelector(".dynamic-background");
      expect(backgroundElement).toBeInTheDocument();

      // Background should not interfere with screen readers
      expect(backgroundElement).not.toHaveAttribute("role");
      expect(backgroundElement).not.toHaveAttribute("aria-label");
    });

    it("renders efficiently without unnecessary DOM elements", () => {
      const { container } = render(
        <Background backgroundType="cyberpunk-neon" />,
      );

      // Should render only a single background div
      const backgroundElements = container.querySelectorAll(
        ".dynamic-background",
      );
      expect(backgroundElements).toHaveLength(1);
    });

    it("handles background type edge cases", () => {
      // Test with potential edge case values
      const { container } = render(
        <Background backgroundType={"invalid-background" as BackgroundType} />,
      );

      const backgroundElement = container.querySelector(".dynamic-background");
      expect(backgroundElement).toBeInTheDocument();
      expect(backgroundElement).toHaveClass("bg-invalid-background");
    });
  });

  describe("Integration and Usage Patterns", () => {
    it("works correctly when used multiple times", () => {
      const { container } = render(
        <div>
          <Background backgroundType="creative-dots" />
          <Background backgroundType="neural-network" />
          <Background backgroundType="cosmic-waves" />
        </div>,
      );

      const backgroundElements = container.querySelectorAll(
        ".dynamic-background",
      );
      expect(backgroundElements).toHaveLength(3);

      expect(backgroundElements[0]).toHaveClass("bg-creative-dots");
      expect(backgroundElements[1]).toHaveClass("bg-neural-network");
      expect(backgroundElements[2]).toHaveClass("bg-cosmic-waves");
    });

    it("maintains proper DOM structure for CSS styling", () => {
      const { container } = render(
        <Background backgroundType="ocean-depths" />,
      );

      const backgroundElement = container.querySelector(".dynamic-background");
      expect(backgroundElement?.tagName).toBe("DIV");
      expect(backgroundElement).toHaveClass("dynamic-background");
      expect(backgroundElement).toHaveClass("bg-ocean-depths");
    });
  });
});
