/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ai from "../ai.js";
import type * as bugAi from "../bugAi.js";
import type * as bugRules from "../bugRules.js";
import type * as bugticket from "../bugticket.js";
import type * as caseConversation from "../caseConversation.js";
import type * as caseTeaser from "../caseTeaser.js";
import type * as chipEvidence from "../chipEvidence.js";
import type * as factsheet from "../factsheet.js";
import type * as gradeFormat from "../gradeFormat.js";
import type * as homeStats from "../homeStats.js";
import type * as http from "../http.js";
import type * as officerAuth from "../officerAuth.js";
import type * as officerData from "../officerData.js";
import type * as officerRules from "../officerRules.js";
import type * as quickBitePublic from "../quickBitePublic.js";
import type * as replyTiming from "../replyTiming.js";
import type * as requestedReference from "../requestedReference.js";
import type * as resultRules from "../resultRules.js";
import type * as roleScorecard from "../roleScorecard.js";
import type * as seniorEvidence from "../seniorEvidence.js";
import type * as seniorFeedback from "../seniorFeedback.js";
import type * as sessions from "../sessions.js";
import type * as studentPresentationRules from "../studentPresentationRules.js";
import type * as ticketAi from "../ticketAi.js";
import type * as ticketRules from "../ticketRules.js";
import type * as tickets from "../tickets.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ai: typeof ai;
  bugAi: typeof bugAi;
  bugRules: typeof bugRules;
  bugticket: typeof bugticket;
  caseConversation: typeof caseConversation;
  caseTeaser: typeof caseTeaser;
  chipEvidence: typeof chipEvidence;
  factsheet: typeof factsheet;
  gradeFormat: typeof gradeFormat;
  homeStats: typeof homeStats;
  http: typeof http;
  officerAuth: typeof officerAuth;
  officerData: typeof officerData;
  officerRules: typeof officerRules;
  quickBitePublic: typeof quickBitePublic;
  replyTiming: typeof replyTiming;
  requestedReference: typeof requestedReference;
  resultRules: typeof resultRules;
  roleScorecard: typeof roleScorecard;
  seniorEvidence: typeof seniorEvidence;
  seniorFeedback: typeof seniorFeedback;
  sessions: typeof sessions;
  studentPresentationRules: typeof studentPresentationRules;
  ticketAi: typeof ticketAi;
  ticketRules: typeof ticketRules;
  tickets: typeof tickets;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  staticHosting: import("@convex-dev/static-hosting/_generated/component.js").ComponentApi<"staticHosting">;
};
