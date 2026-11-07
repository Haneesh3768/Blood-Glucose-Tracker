import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReadingModal } from "./ReadingModal.js";

describe("ReadingModal & Business Validation UI Tests", () => {
  it("displays 'Please enter a glucose value.' when value is omitted", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onSuccess = vi.fn();

    render(
      <ReadingModal
        isOpen={true}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    const submitBtn = screen.getByRole("button", { name: /Record Reading/i });
    await user.click(submitBtn);

    expect(await screen.findByText(/Please enter a glucose value\./i)).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("displays 'Value must be between 40 and 600 mg/dl.' when value is below 40", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onSuccess = vi.fn();

    render(
      <ReadingModal
        isOpen={true}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    const input = screen.getByPlaceholderText(/e\.g\. 110/i);
    await user.type(input, "35");

    const submitBtn = screen.getByRole("button", { name: /Record Reading/i });
    await user.click(submitBtn);

    expect(await screen.findByText(/Value must be between 40 and 600 mg\/dl\./i)).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("displays 'Value must be between 40 and 600 mg/dl.' when value exceeds 600", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onSuccess = vi.fn();

    render(
      <ReadingModal
        isOpen={true}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    const input = screen.getByPlaceholderText(/e\.g\. 110/i);
    await user.type(input, "650");

    const submitBtn = screen.getByRole("button", { name: /Record Reading/i });
    await user.click(submitBtn);

    expect(await screen.findByText(/Value must be between 40 and 600 mg\/dl\./i)).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
