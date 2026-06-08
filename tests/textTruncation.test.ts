import { truncateTexts } from "../src/utils/textTruncation";

describe("truncateTexts", () => {
  it("preserves content from multiple OCR pages", () => {
    const submission = [
      "[PAGE 1]\n",
      "page one content ".repeat(400),
      "\n[PAGE 2]\n",
      "page two content ".repeat(400),
      "\n[PAGE 3]\n",
      "page three content ".repeat(400),
    ].join("");

    const result = truncateTexts(submission, "short syllabus");

    expect(result.submission).toContain("[PAGE 1]");
    expect(result.submission).toContain("[PAGE 2]");
    expect(result.submission).toContain("[PAGE 3]");
  });
});
