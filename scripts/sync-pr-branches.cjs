const marker = '<!-- automatic-main-branch-sync -->';

module.exports = async function syncBranches({ github, context, core }) {
  const repository = { owner: context.repo.owner, repo: context.repo.repo };
  const { data: main } = await github.rest.repos.getBranch({
    ...repository,
    branch: 'main',
  });
  const prs = await github.paginate(github.rest.pulls.list, {
    ...repository,
    state: 'open',
    base: 'main',
    per_page: 100,
  });

  async function updateStatus(pr, message, create) {
    const comments = await github.paginate(github.rest.issues.listComments, {
      ...repository,
      issue_number: pr.number,
      per_page: 100,
    });
    const existing = comments.find(
      (comment) =>
        comment.user?.login === 'github-actions[bot]' &&
        comment.body?.startsWith(marker),
    );
    const body = `${marker}\n${message}`;
    if (existing) {
      if (existing.body !== body) {
        await github.rest.issues.updateComment({
          ...repository,
          comment_id: existing.id,
          body,
        });
      }
    } else if (create) {
      await github.rest.issues.createComment({
        ...repository,
        issue_number: pr.number,
        body,
      });
    }
  }

  for (const pr of prs) {
    if (
      pr.draft ||
      pr.base.ref !== 'main' ||
      pr.head.repo?.full_name !== pr.base.repo.full_name ||
      pr.head.ref === 'main'
    ) {
      continue;
    }

    try {
      const { data: comparison } = await github.rest.repos.compareCommitsWithBasehead({
        ...repository,
        basehead: `${main.commit.sha}...${pr.head.sha}`,
      });
      if (comparison.behind_by === 0) {
        await updateStatus(pr, 'This PR branch is up to date with `main`.', false);
        continue;
      }

      try {
        await github.rest.pulls.updateBranch({
          ...repository,
          pull_number: pr.number,
          expected_head_sha: pr.head.sha,
        });
      } catch (error) {
        if (error.status !== 422 || !/merge conflict/i.test(error.message)) {
          throw error;
        }
        core.warning(`PR #${pr.number}: merging main would cause a conflict.`);
        await updateStatus(
          pr,
          'Automatic merge of `main` into this PR branch was blocked by a conflict. ' +
            'No changes were pushed. Please merge `main` into this branch locally, ' +
            'resolve the conflicts, and push the result. Generated `index.html` and ' +
            '`index.json` files should be regenerated with `bash scripts/generate-indexes.sh`, ' +
            'not resolved by hand. The `/schedule` command has not been changed.',
          true,
        );
        continue;
      }

      core.info(`PR #${pr.number}: requested a merge of main into ${pr.head.ref}.`);
      await updateStatus(
        pr,
        'An automatic merge of `main` into this PR branch has been requested successfully. ' +
          'Check the PR for the updated branch status. The `/schedule` command has not been changed.',
        false,
      );
    } catch (error) {
      core.error(`PR #${pr.number}: branch sync failed: ${error.message}`);
      core.setFailed('One or more PR branches could not be synced. See the job log.');
    }
  }
};
