const assert = require('node:assert/strict');
const test = require('node:test');
const syncBranches = require('../sync-pr-branches.cjs');

function pr(number, overrides = {}) {
  return {
    number,
    draft: false,
    base: { ref: 'main', repo: { full_name: 'owner/repo' } },
    head: {
      ref: `campaign-${number}`,
      sha: `head-${number}`,
      repo: { full_name: 'owner/repo' },
    },
    ...overrides,
  };
}

function harness(prs, { behind = 1, updateError, comments = [] } = {}) {
  const calls = { updates: [], creates: [], edits: [], failures: [], comparisons: [] };
  const pulls = {
    list: async () => {},
    updateBranch: async (request) => {
      calls.updates.push(request);
      if (updateError) throw updateError;
      return { status: 202 };
    },
  };
  const issues = {
    listComments: async () => {},
    createComment: async (request) => calls.creates.push(request),
    updateComment: async (request) => calls.edits.push(request),
  };
  const github = {
    rest: {
      pulls,
      issues,
      repos: {
        getBranch: async () => ({ data: { commit: { sha: 'main-with-indexes' } } }),
        compareCommitsWithBasehead: async (request) => {
          calls.comparisons.push(request);
          return { data: { behind_by: behind } };
        },
      },
    },
    paginate: async (method, request) => {
      if (method === pulls.list) {
        assert.equal(request.base, 'main');
        assert.equal(request.state, 'open');
        assert.equal(request.per_page, 100);
        return prs;
      }
      assert.equal(method, issues.listComments);
      return comments;
    },
  };
  const core = {
    info: () => {},
    warning: () => {},
    error: () => {},
    setFailed: (message) => calls.failures.push(message),
  };
  return {
    calls,
    run: () => syncBranches({
      github,
      core,
      context: { repo: { owner: 'owner', repo: 'repo' } },
    }),
  };
}

test('syncs eligible PRs using their expected head and post-index main SHA', async () => {
  const { calls, run } = harness([pr(1), pr(2)]);
  await run();
  assert.deepEqual(calls.updates.map((request) => request.expected_head_sha), ['head-1', 'head-2']);
  assert.deepEqual(
    calls.comparisons.map((request) => request.basehead),
    ['main-with-indexes...head-1', 'main-with-indexes...head-2'],
  );
  assert.equal(calls.creates.length, 0);
  assert.equal(calls.failures.length, 0);
});

test('skips drafts, forks, deleted repositories, non-main bases, and main heads', async () => {
  const { calls, run } = harness([
    pr(1, { draft: true }),
    pr(2, { head: { ref: 'fork', repo: { full_name: 'external/repo' } } }),
    pr(3, { head: { ref: 'deleted', repo: null } }),
    pr(4, { base: { ref: 'release', repo: { full_name: 'owner/repo' } } }),
    pr(5, { head: { ref: 'main', repo: { full_name: 'owner/repo' } } }),
  ]);
  await run();
  assert.equal(calls.comparisons.length, 0);
  assert.equal(calls.updates.length, 0);
});

test('does not update branches already containing main', async () => {
  const { calls, run } = harness([pr(1)], { behind: 0 });
  await run();
  assert.equal(calls.updates.length, 0);
  assert.equal(calls.creates.length, 0);
});

test('reports merge conflicts without failing the job', async () => {
  const { calls, run } = harness([pr(1)], {
    updateError: Object.assign(new Error('There was a merge conflict'), { status: 422 }),
  });
  await run();
  assert.equal(calls.creates.length, 1);
  assert.match(calls.creates[0].body, /blocked by a conflict/);
  assert.match(calls.creates[0].body, /\/schedule/);
  assert.equal(calls.failures.length, 0);
});

test('deduplicates conflict comments and does not edit a user-authored marker', async () => {
  const first = harness([pr(1)], {
    updateError: Object.assign(new Error('merge conflict'), { status: 422 }),
  });
  await first.run();
  const body = first.calls.creates[0].body;
  const { calls, run } = harness([pr(1)], {
    updateError: Object.assign(new Error('merge conflict'), { status: 422 }),
    comments: [
      { id: 10, body, user: { login: 'human' } },
      { id: 11, body, user: { login: 'github-actions[bot]' } },
    ],
  });
  await run();
  assert.equal(calls.creates.length, 0);
  assert.equal(calls.edits.length, 0);
});

test('updates an existing conflict status after a successful update request', async () => {
  const { calls, run } = harness([pr(1)], {
    comments: [{
      id: 11,
      body: '<!-- automatic-main-branch-sync -->\nPrevious conflict',
      user: { login: 'github-actions[bot]' },
    }],
  });
  await run();
  assert.equal(calls.edits.length, 1);
  assert.equal(calls.edits[0].comment_id, 11);
  assert.match(calls.edits[0].body, /requested successfully/);
});

test('surfaces permission and stale-head failures while continuing other PRs', async () => {
  for (const status of [403, 422]) {
    const { calls, run } = harness([pr(1), pr(2)], {
      updateError: Object.assign(new Error('Branch update rejected'), { status }),
    });
    await run();
    assert.equal(calls.failures.length, 2);
    assert.equal(calls.updates.length, 2);
    assert.equal(calls.creates.length, 0);
  }
});
