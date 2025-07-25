import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import AppHeader from "./AppHeader";

const AppHeaderWrapper = ({
  children,
  ...props
}: React.PropsWithChildren<React.ComponentProps<typeof AppHeader>>) => (
  <BrowserRouter>
    <AppHeader {...props} />
    {children}
  </BrowserRouter>
);

describe("AppHeader", () => {
  it("renders the app title with correct link", () => {
    render(<AppHeaderWrapper />);

    const titleLink = screen.getByRole("link", { name: /productivity hub/i });
    expect(titleLink).toBeInTheDocument();
    expect(titleLink).toHaveAttribute("href", "/");
  });

  it("renders beta label when provided", () => {
    render(<AppHeaderWrapper betaLabel="v0.12.0-dev10" />);

    expect(screen.getByText("v0.12.0-dev10")).toBeInTheDocument();
  });

  it("does not render beta label when not provided", () => {
    render(<AppHeaderWrapper />);

    // Should not find any beta label elements
    expect(screen.queryByText(/v0\./)).not.toBeInTheDocument();
  });

  it("renders right content when provided", () => {
    const rightContent = <button>Test Button</button>;
    render(<AppHeaderWrapper rightContent={rightContent} />);

    expect(
      screen.getByRole("button", { name: /test button/i }),
    ).toBeInTheDocument();
  });

  it("renders without right content when not provided", () => {
    render(<AppHeaderWrapper />);

    // Should render the header structure without extra content
    expect(
      screen.getByRole("link", { name: /productivity hub/i }),
    ).toBeInTheDocument();
  });

  it("renders both beta label and right content together", () => {
    const rightContent = (
      <div>
        <span>User: John</span>
        <button>Logout</button>
      </div>
    );

    render(<AppHeaderWrapper betaLabel="Beta" rightContent={rightContent} />);

    expect(screen.getByText("Beta")).toBeInTheDocument();
    expect(screen.getByText("User: John")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /logout/i })).toBeInTheDocument();
  });
});
