import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Pagination from "./Pagination";

describe("Pagination (src)", () => {
  it("renders current and last page info", () => {
    render(
      <Pagination currentPage={1} lastPage={5} onPageChange={vi.fn()} />
    );
    expect(screen.getByText("Página 1 de 5")).toBeInTheDocument();
  });

  it("disables 'Anterior' on first page", () => {
    render(
      <Pagination currentPage={1} lastPage={5} onPageChange={vi.fn()} />
    );
    expect(screen.getByText("Anterior")).toBeDisabled();
  });

  it("disables 'Siguiente' on last page", () => {
    render(
      <Pagination currentPage={5} lastPage={5} onPageChange={vi.fn()} />
    );
    expect(screen.getByText("Siguiente")).toBeDisabled();
  });

  it("calls onPageChange with prev page on 'Anterior' click", async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Pagination currentPage={3} lastPage={5} onPageChange={onPageChange} />
    );
    await user.click(screen.getByText("Anterior"));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("calls onPageChange with next page on 'Siguiente' click", async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Pagination currentPage={3} lastPage={5} onPageChange={onPageChange} />
    );
    await user.click(screen.getByText("Siguiente"));
    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it("handles single page (lastPage = 1)", () => {
    render(
      <Pagination currentPage={1} lastPage={1} onPageChange={vi.fn()} />
    );
    expect(screen.getByText("Anterior")).toBeDisabled();
    expect(screen.getByText("Siguiente")).toBeDisabled();
    expect(screen.getByText("Página 1 de 1")).toBeInTheDocument();
  });
});
