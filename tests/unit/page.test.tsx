import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import HomePage from "../../src/app/page";

describe("HomePage (/)", () => {
  it("renders the placeholder heading", () => {
    const html = renderToStaticMarkup(<HomePage />);
    expect(html).toContain("<h1>");
    expect(html).toContain(
      "How we use analytics to make critical business decisions",
    );
  });
});
