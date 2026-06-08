import buildApp from "../src/app";
import githubModelsClient from "../src/services/githubModelsClient";
import repositoryService from "../src/services/repositoryService";

jest.mock("../src/services/githubModelsClient", () => ({
  __esModule: true,
  default: {
    gradeCompletion: jest.fn(),
  },
}));

jest.mock("../src/services/repositoryService", () => ({
  __esModule: true,
  default: {
    readRepository: jest.fn(),
  },
}));

describe("POST /grade-repo", () => {
  it("grades a GitHub repository URL", async () => {
    const mockedClient = githubModelsClient as unknown as {
      gradeCompletion: jest.Mock;
    };
    const mockedRepositoryService = repositoryService as unknown as {
      readRepository: jest.Mock;
    };

    mockedRepositoryService.readRepository.mockResolvedValue(
      "Repository content",
    );
    mockedClient.gradeCompletion.mockResolvedValue(
      '{"correct":true,"points":18,"comment":"The repository demonstrates a strong structure and good API separation, but it is missing tests and clearer input validation in several handlers."}',
    );

    const boundary = "----gradebrain-repo-test-boundary";
    const multipartBody = Buffer.from(
      [
        `--${boundary}\r\n`,
        'Content-Disposition: form-data; name="syllabus"; filename="syllabus.txt"\r\n',
        "Content-Type: text/plain\r\n\r\n",
        "Expected topics and rubric\r\n",
        `--${boundary}\r\n`,
        'Content-Disposition: form-data; name="repoUrl"\r\n\r\n',
        "https://github.com/DuckGroup/gradebrain\r\n",
        `--${boundary}\r\n`,
        'Content-Disposition: form-data; name="prompt"\r\n\r\n',
        "Focus on backend implementation quality.\r\n",
        `--${boundary}--\r\n`,
      ].join(""),
      "utf8",
    );

    const app = buildApp();
    await app.ready();

    const response = await app.inject({
      method: "POST",
      url: "/grade-repo",
      headers: {
        "content-type": `multipart/form-data; boundary=${boundary}`,
      },
      payload: multipartBody,
    });

    expect(response.statusCode).toBe(200);

    const body = response.json();
    expect(body.success).toBe(true);
    expect(body.result).toBe(
      '{"correct":true,"points":18,"comment":"The repository demonstrates a strong structure and good API separation, but it is missing tests and clearer input validation in several handlers."}',
    );
    expect(mockedRepositoryService.readRepository).toHaveBeenCalledWith(
      expect.objectContaining({
        repoUrl: "https://github.com/DuckGroup/gradebrain",
      }),
    );

    await app.close();
  });

  it("accepts an uploaded repository zip", async () => {
    const mockedClient = githubModelsClient as unknown as {
      gradeCompletion: jest.Mock;
    };
    const mockedRepositoryService = repositoryService as unknown as {
      readRepository: jest.Mock;
    };

    mockedRepositoryService.readRepository.mockResolvedValue(
      "Repository content",
    );
    mockedClient.gradeCompletion.mockResolvedValue(
      '{"correct":true,"points":18,"comment":"The repository demonstrates a strong structure and good API separation, but it is missing tests and clearer input validation in several handlers."}',
    );

    const boundary = "----gradebrain-repo-zip-test-boundary";
    const multipartBody = Buffer.from(
      [
        `--${boundary}\r\n`,
        'Content-Disposition: form-data; name="syllabus"; filename="syllabus.txt"\r\n',
        "Content-Type: text/plain\r\n\r\n",
        "Expected topics and rubric\r\n",
        `--${boundary}\r\n`,
        'Content-Disposition: form-data; name="repoZip"; filename="repo.zip"\r\n',
        "Content-Type: application/zip\r\n\r\n",
        "fake-zip-binary\r\n",
        `--${boundary}--\r\n`,
      ].join(""),
      "utf8",
    );

    const app = buildApp();
    await app.ready();

    const response = await app.inject({
      method: "POST",
      url: "/grade-repo",
      headers: {
        "content-type": `multipart/form-data; boundary=${boundary}`,
      },
      payload: multipartBody,
    });

    expect(response.statusCode).toBe(200);

    const body = response.json();
    expect(body.success).toBe(true);
    expect(body.result).toBe(
      '{"correct":true,"points":18,"comment":"The repository demonstrates a strong structure and good API separation, but it is missing tests and clearer input validation in several handlers."}',
    );
    expect(mockedRepositoryService.readRepository).toHaveBeenCalledWith(
      expect.objectContaining({
        repoZip: expect.any(Buffer),
      }),
    );

    await app.close();
  });
});
