import buildApp from "../src/app";
import githubModelsClient from "../src/services/githubModelsClient";
import pdfService from "../src/services/pdfService";

jest.mock("../src/services/githubModelsClient", () => ({
  __esModule: true,
  default: {
    gradeCompletion: jest.fn(),
  },
}));

jest.mock("../src/services/pdfService", () => ({
  __esModule: true,
  default: {
    parsePDF: jest.fn(),
  },
}));

describe("POST /grade-student", () => {
  it("accepts a prompt with raw content", async () => {
    const mockedClient = githubModelsClient as unknown as {
      gradeCompletion: jest.Mock;
    };

    mockedClient.gradeCompletion.mockResolvedValue(
      '{"correct":true,"points":15,"comment":"Good work"}',
    );

    const app = buildApp();
    await app.ready();

    const response = await app.inject({
      method: "POST",
      url: "/grade-student",
      headers: {
        "content-type": "application/json",
      },
      payload: {
        studentAnswers: "Student answer content",
        syllabusContent: "Expected topics and rubric",
        prompt: "Focus on clarity and missing details.",
      },
    });

    expect(response.statusCode).toBe(200);

    const body = response.json();
    expect(body.success).toBe(true);
    expect(body.result).toBe(
      '{"correct":true,"points":15,"comment":"Good work"}',
    );
    expect(mockedClient.gradeCompletion).toHaveBeenCalledWith(
      expect.stringContaining("Expected topics and rubric"),
      0,
      expect.stringContaining("Focus on clarity and missing details."),
    );

    await app.close();
  });

  it("prefers raw student answers over a student file", async () => {
    const mockedClient = githubModelsClient as unknown as {
      gradeCompletion: jest.Mock;
    };
    const mockedPdfService = pdfService as unknown as {
      parsePDF: jest.Mock;
    };

    mockedClient.gradeCompletion.mockClear();
    mockedPdfService.parsePDF.mockResolvedValue("Parsed student file text");
    mockedClient.gradeCompletion.mockResolvedValue(
      '{"correct":true,"points":15,"comment":"Good work"}',
    );

    const app = buildApp();
    await app.ready();

    const response = await app.inject({
      method: "POST",
      url: "/grade-student",
      headers: {
        "content-type": "application/json",
      },
      payload: {
        studentFile: "elev 1 (18 av 20) db1.pdf",
        studentAnswers: "Override answer text",
        syllabusContent: "Expected topics and rubric",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(mockedPdfService.parsePDF).toHaveBeenCalled();
    expect(mockedClient.gradeCompletion).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("Syllabus:\nExpected topics and rubric"),
      0,
      expect.stringContaining(
        "Important: Do NOT use any scores, marks or annotations already written on the paper",
      ),
    );
    expect(mockedClient.gradeCompletion.mock.calls[0][0]).toEqual(
      expect.stringContaining("Parsed student file text"),
    );
    expect(mockedClient.gradeCompletion.mock.calls[0][0]).toEqual(
      expect.stringContaining("[USER-PROVIDED STUDENT ANSWERS]\nOverride answer text"),
    );

    await app.close();
  });
});
