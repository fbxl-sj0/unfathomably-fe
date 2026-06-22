import { Gitlab } from '@gitbeaker/rest';

import { getChanges } from './lib/changelog.ts';

const {
  CI_COMMIT_TAG,
  CI_JOB_TOKEN,
  CI_PROJECT_ID,
  CI_PROJECT_URL,
} = process.env;

const api = new Gitlab({
  host: 'https://gitlab.com',
  jobToken: CI_JOB_TOKEN,
});

async function main() {
  await api.ProjectReleases.create(CI_PROJECT_ID!, {
    name: CI_COMMIT_TAG,
    tag_name: CI_COMMIT_TAG,
    description: '## Changelog\n\n' + getChanges(CI_COMMIT_TAG!),
    assets: {
      links: [{
        name: 'Build',
        url: `${CI_PROJECT_URL!}/-/jobs/artifacts/${CI_COMMIT_TAG}/download?job=build`,
        link_type: 'package',
      }],
    },
  });
}

main();
