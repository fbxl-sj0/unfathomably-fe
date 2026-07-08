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

const looksLikeActorIdentifier = (value: string) => {
  const query = value.trim();

  return actorUrlPattern.test(query) || remoteActorHandlePattern.test(query);
};

export { looksLikeActorIdentifier };

/* end of search.ts */
