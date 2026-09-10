import { render, screen } from "@testing-library/react";
import Providers from "./providers";

describe("Providers (src)", () => {
  it("renders children", () => {
    render(
      <Providers>
        <div data-testid="child">Hello</div>
      </Providers>
    );
    expect(screen.getByTestId("child")).toHaveTextContent("Hello");
  });
});
