import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SEARCH_DEBOUNCE_MS } from "../search-params";
import { SearchInput } from "./search-input";

describe("SearchInput", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("searches once, after the user stops typing", () => {
    const onSearch = vi.fn();
    render(<SearchInput query="" isPending={false} onSearch={onSearch} />);
    const input = screen.getByLabelText("Search captions");

    for (const text of ["c", "ce", "cea", "ceasefire"]) {
      fireEvent.change(input, { target: { value: text } });
      act(() => vi.advanceTimersByTime(100));
    }
    expect(onSearch).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS));
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith("ceasefire");
  });

  it("clearing the box removes the search", () => {
    const onSearch = vi.fn();
    render(<SearchInput query="ceasefire" isPending={false} onSearch={onSearch} />);

    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
    act(() => vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS));

    expect(onSearch).toHaveBeenCalledWith(undefined);
  });

  it("does not search again for whitespace-only changes", () => {
    const onSearch = vi.fn();
    render(<SearchInput query="ceasefire" isPending={false} onSearch={onSearch} />);

    fireEvent.change(screen.getByLabelText("Search captions"), {
      target: { value: "ceasefire  " },
    });
    act(() => vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS));

    expect(onSearch).not.toHaveBeenCalled();
  });

  it("follows the URL when the search is cleared elsewhere", () => {
    const { rerender } = render(
      <SearchInput query="ceasefire" isPending={false} onSearch={vi.fn()} />,
    );

    rerender(<SearchInput query="" isPending={false} onSearch={vi.fn()} />);

    expect(screen.getByLabelText("Search captions")).toHaveValue("");
  });
});
