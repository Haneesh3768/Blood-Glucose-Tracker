import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import axios from "axios";
import App from "./App.js";

describe("Client Application Shell", () => {
  it("renders the application title and sign-in view when unauthenticated", async () => {
    vi.spyOn(axios, "post").mockRejectedValue(new Error("No active session"));
    render(<App />);

    expect(
      await screen.findByText(/Personal Blood Glucose Monitoring Portal/i)
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sign In/i })).toBeInTheDocument();
  });
});
