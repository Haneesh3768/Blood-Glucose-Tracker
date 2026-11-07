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

  it("directly redirects to dashboard when session is available at root /", async () => {
    vi.spyOn(axios, "post").mockResolvedValue({
      data: {
        success: true,
        data: {
          accessToken: "active_jwt_token",
          user: {
            id: "user-123",
            name: "Jane Doe",
            email: "jane@sweety.app",
          },
        },
      },
    });

    render(<App />);

    expect(await screen.findByText(/Patient Overview/i)).toBeInTheDocument();
  });
});
