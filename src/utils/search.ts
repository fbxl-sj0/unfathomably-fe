/*
  Unfathomably Frontend
  ---------------------

  File: search.ts

  Purpose:

    Collect small shared helpers for deciding how free-form search input should
    be interpreted before it reaches the API.

  Responsibilities:

    * recognize remote actor handles such as user@example.org
    * recognize full remote actor or feed URLs
    * keep search-routing heuristics consistent across input and autosuggest

  This file intentionally does NOT contain:

    * API calls
    * result rendering
    * backend-specific actor classification
*/

const actorUrlPattern = /^https?:\/\/\S+$/i;
const remoteActorHandlePattern = /^@?[^@\s/]+@[^@\s/]+$/i;
const atprotoHandlePattern = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z][a-z0-9-]{0,62}$/i;

const looksLikeActorIdentifier = (value: string) => {
  const query = value.trim();
  const possibleAtprotoHandle = query.startsWith('@') ? query.slice(1) : query;

  return actorUrlPattern.test(query)
    || remoteActorHandlePattern.test(query)
    || atprotoHandlePattern.test(possibleAtprotoHandle);
};

export { looksLikeActorIdentifier };

/* end of search.ts */
