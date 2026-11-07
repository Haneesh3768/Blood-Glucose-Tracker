import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App.js";

describe("Client Application Shell", () => {
  it("renders the application title and auth modal when unauthenticated", () => {
    render(<App />);
    expect(screen.getByText(/Personal Blood Glucose Monitoring Portal/i)).toBeInTheDocument();
  });
});

