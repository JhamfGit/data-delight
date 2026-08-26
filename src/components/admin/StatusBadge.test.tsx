import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "./StatusBadge";

describe("StatusBadge", () => {
  it("renders the known SI status with its literal text", () => {
    render(<StatusBadge status="SI" />);
    expect(screen.getByText("SI")).toBeInTheDocument();
  });

  it("renders the known NO status with its literal text", () => {
    render(<StatusBadge status="NO" />);
    expect(screen.getByText("NO")).toBeInTheDocument();
  });

  it("renders an unknown status value verbatim as a neutral badge, not a NO/SI fallback", () => {
    render(<StatusBadge status="FAILED" />);
    expect(screen.getByText("FAILED")).toBeInTheDocument();
    expect(screen.queryByText("NO")).not.toBeInTheDocument();
    expect(screen.queryByText("SI")).not.toBeInTheDocument();
  });

  it("marks an unknown status with role status and a distinct accessible label", () => {
    render(<StatusBadge status="PENDING_REVIEW" />);
    expect(screen.getByText("PENDING_REVIEW")).toHaveAttribute(
      "data-known",
      "false"
    );
  });

  it("marks a known status as known via data-known", () => {
    render(<StatusBadge status="SI" />);
    expect(screen.getByText("SI")).toHaveAttribute("data-known", "true");
  });
});
