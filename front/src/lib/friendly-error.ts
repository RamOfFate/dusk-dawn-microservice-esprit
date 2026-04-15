import { ApiError } from "~/lib/api-error";

export function getFriendlyError(error: unknown): {
  title: string;
  message: string;
  hint?: string;
} {
  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 403) {
      return {
        title: "Access denied",
        message:
          "This action requires authentication/authorization. If Keycloak is enabled, you may need to sign in.",
        hint: "Try browsing public endpoints first (books/categories), or configure auth headers in the gateway.",
      };
    }

    if (error.status === 404) {
      return {
        title: "Not found",
        message:
          "The service endpoint was not found. This can happen if the gateway route isn’t configured for that service.",
        hint: "Confirm the API Gateway routes and that the target service is registered in Eureka.",
      };
    }

    if (error.status >= 500) {
      return {
        title: "Service unavailable",
        message:
          "The backend returned an error. The gateway or one of the services may be down.",
        hint: "Make sure Eureka + API Gateway are running, then start the target microservice.",
      };
    }

    return {
      title: "Request failed",
      message:
        error.details ??
        `The server returned an error (HTTP ${error.status}). Please try again.`,
    };
  }

  if (error instanceof Error) {
    return {
      title: "Something went wrong",
      message: error.message || "An unexpected error occurred.",
    };
  }

  return {
    title: "Something went wrong",
    message: "An unexpected error occurred.",
  };
}
