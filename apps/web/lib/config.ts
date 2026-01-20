export const BRAND = {
  name: "Mooses Place",
  tagline: "Lottery insights & weighted-random pick builder",
  legal: {
    disclaimerShort:
      "For entertainment and analytics only. Lottery outcomes are random; this tool does not predict results.",
    disclaimerLong:
      "Mooses Place provides historical visualizations and weighted-random number suggestions with user-controlled constraints. Lottery outcomes are random. Nothing in this app guarantees or predicts future results. We do not sell tickets or facilitate purchases. Always check your local laws before playing."
  }
};

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
