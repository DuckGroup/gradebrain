import buildApp from "../src/app";
import githubModelsClient from "../src/services/githubModelsClient";

jest.mock("../src/services/githubModelsClient", () => ({
  __esModule: true,
  default: {
    chatCompletion: jest.fn(),
  },
}));

describe("POST /grade", () => {
  it("returns a grade result", async () => {
    const mockedClient = githubModelsClient as unknown as {
      chatCompletion: jest.Mock;
    };

    mockedClient.chatCompletion.mockResolvedValue(
      '{"correct":true,"grade":"A"}',
    );

    const app = buildApp();
    await app.ready();

    const response = await app.inject({
      method: "POST",
      url: "/grade",
      payload: {
        systemPrompt: "Use the syllabus to grade the answer.",
        userContent: "Answer content.",
      },
    });

    expect(response.statusCode).toBe(200);

    const body = response.json();
    expect(body.success).toBe(true);
    expect(body.result).toBe('{"correct":true,"grade":"A"}');

    await app.close();
  });
});
