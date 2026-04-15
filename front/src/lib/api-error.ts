export class ApiError extends Error {
  public status: number;
  public url: string;
  public details?: string;

  constructor(
    message: string,
    opts: { status: number; url: string; details?: string },
  ) {
    super(message);
    this.name = "ApiError";
    this.status = opts.status;
    this.url = opts.url;
    this.details = opts.details;
  }
}
