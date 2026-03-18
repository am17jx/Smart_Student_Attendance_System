import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: "https://95d89c69cd19c2a10f4e6daf8d2f2f9a@o4511065101565952.ingest.de.sentry.io/4511065241944144",
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
});
