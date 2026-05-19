import buildApp from "../src/app";
import githubModelsClient from "../src/services/githubModelsClient";

jest.mock("../src/services/githubModelsClient", () => ({
  __esModule: true,
  default: {
    gradeCompletion: jest.fn(),
  },
}));

describe("POST /grade", () => {
  it("returns a grade result", async () => {
    const mockedClient = githubModelsClient as unknown as {
      gradeCompletion: jest.Mock;
    };

    mockedClient.gradeCompletion.mockResolvedValue(
      '{"correct":true,"grade":"A"}',
    );

    const boundary = "----gradebrain-test-boundary";
    const multipartBody = Buffer.from(
      [
        `--${boundary}\r\n`,
        'Content-Disposition: form-data; name="syllabus"; filename="syllabus.txt"\r\n',
        "Content-Type: text/plain\r\n\r\n",
        "Expected topics and rubric\r\n",
        `--${boundary}\r\n`,
        'Content-Disposition: form-data; name="exam"; filename="exam.txt"\r\n',
        "Content-Type: text/plain\r\n\r\n",
        "Student answer content\r\n",
        `--${boundary}--\r\n`,
      ].join(""),
      "utf8",
    );

    const app = buildApp();
    await app.ready();

    const response = await app.inject({
      method: "POST",
      url: "/grade",
      headers: {
        "content-type": `multipart/form-data; boundary=${boundary}`,
      },
      payload: multipartBody,
    });

    expect(response.statusCode).toBe(200);

    const body = response.json();
    expect(body.success).toBe(true);
    expect(body.result).toBe('{"correct":true,"grade":"A"}');

    await app.close();
  });
});
