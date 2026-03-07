import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FetchError } from "./fetch-error";

describe("FetchError", () => {
  it("renders default message when no message prop", () => {
    render(<FetchError />);
    expect(screen.getByText("データの取得に失敗しました")).toBeTruthy();
  });

  it("renders custom message", () => {
    render(<FetchError message="カスタムエラー" />);
    expect(screen.getByText("カスタムエラー")).toBeTruthy();
  });

  it("renders retry button when onRetry is provided", () => {
    const onRetry = vi.fn();
    render(<FetchError onRetry={onRetry} />);
    const button = screen.getByRole("button", { name: /再読み込み/ });
    expect(button).toBeTruthy();
  });

  it("does not render retry button when onRetry is not provided", () => {
    render(<FetchError />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("calls onRetry when retry button is clicked", () => {
    const onRetry = vi.fn();
    render(<FetchError onRetry={onRetry} />);
    fireEvent.click(screen.getByRole("button", { name: /再読み込み/ }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders error icon", () => {
    const { container } = render(<FetchError />);
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
  });
});
