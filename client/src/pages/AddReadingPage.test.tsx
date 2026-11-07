import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AddReadingPage } from "./AddReadingPage.js";

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe("AddReadingPage & Validation Rules Tests", () => {
  it("rejects empty glucose value with 'Please enter a glucose value.'", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AddReadingPage />);

    const saveBtn = screen.getByRole("button", { name: /Save Reading/i });
    await user.click(saveBtn);

    expect(await screen.findByText(/Please enter a glucose value\./i)).toBeInTheDocument();
  });

  it("rejects glucose value under 40 with 'Value must be between 40 and 600 mg/dl.'", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AddReadingPage />);

    const input = screen.getByPlaceholderText(/e\.g\. 110/i);
    await user.type(input, "30");

    const saveBtn = screen.getByRole("button", { name: /Save Reading/i });
    await user.click(saveBtn);

    expect(await screen.findByText(/Value must be between 40 and 600 mg\/dl\./i)).toBeInTheDocument();
  });

  it("rejects glucose value over 600 with 'Value must be between 40 and 600 mg/dl.'", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AddReadingPage />);

    const input = screen.getByPlaceholderText(/e\.g\. 110/i);
    await user.type(input, "620");

    const saveBtn = screen.getByRole("button", { name: /Save Reading/i });
    await user.click(saveBtn);

    expect(await screen.findByText(/Value must be between 40 and 600 mg\/dl\./i)).toBeInTheDocument();
  });
});
