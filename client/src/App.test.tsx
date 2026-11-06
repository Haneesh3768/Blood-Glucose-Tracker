import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App.js";

describe("Client Application Shell", () => {
  it("renders the application title and shell without crashing", () => {
    render(<App />);
    expect(screen.getByText(/Sweety Glucose Tracker/i)).toBeInTheDocument();
  });
});

