/*
 * Unfathomably FE
 * File: identity-proof.ts
 *
 * Purpose:
 *   Validate linked-data identity proofs returned by Unfathomably BE.
 *
 * Responsibilities:
 *   - describe the verified FEP-c390 statement shape used by the interface
 *   - discard fields that are not needed for profile presentation
 *
 * This file intentionally does not verify signatures. Cryptographic
 * verification belongs to the backend trust boundary.
 */

import * as z from '@/zod.ts';

const identityProofSchema = z.object({
  type: z.literal('VerifiableIdentityStatement'),
  subject: z.string(),
  alsoKnownAs: z.string(),
  proof: z.object({
    type: z.literal('DataIntegrityProof'),
    cryptosuite: z.literal('eddsa-jcs-2022'),
    created: z.string(),
    verificationMethod: z.string(),
    proofPurpose: z.literal('assertionMethod'),
    proofValue: z.string(),
  }),
});

type IdentityProof = z.infer<typeof identityProofSchema>;

export {
  identityProofSchema,
  type IdentityProof,
};

/* end of identity-proof.ts */
