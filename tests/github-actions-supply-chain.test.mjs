    "fixture.yml:14 duplicates environment key https_proxy case-insensitively",
  ]);
});

test("hosted checkout uses v7 while the isolated restore runner stays on v4", async () => {
  const workflowFiles = (await readdir(".github/workflows"))
    .filter((file) => /\.ya?ml$/u.test(file))
    .sort();
  const workflowRecords = [];

  for (const file of workflowFiles) {
    const source = await readFile(`.github/workflows/${file}`, "utf8");
    const checkoutShas = [
      ...source.matchAll(/actions\/checkout@([0-9a-f]{40})/gu),
    ].map((match) => match[1]);

    workflowRecords.push({
      file,
      source,
      checkoutShas,
      selfHosted:
        /\bruns-on:\s*\[[^\]]*\bself-hosted\b[^\]]*\]/u.test(source) ||
        /\bruns-on:\s*\n\s+group:[^\n]+\n\s+labels:[\s\S]*?\bself-hosted\b/u.test(source),
    });
  }

  const selfHostedWorkflows = workflowRecords.filter(
    (workflow) => workflow.selfHosted,
  );
  const requiredSelfHostedWorkflows = [
    STAGING_DEPLOY_WORKFLOW,
    STAGING_PROVISION_WORKFLOW,
    RESTORE_DATABASE_WORKFLOW,
    RESTORE_HOST_WORKFLOW,
    RESTORE_WORKFLOW,
  ];
  for (const requiredWorkflow of requiredSelfHostedWorkflows) {
    assert.equal(
      selfHostedWorkflows.some((workflow) => workflow.file === requiredWorkflow),
      true,
      `${requiredWorkflow} must stay on a self-hosted runner`,
    );
  }
  assert.deepEqual(
    selfHostedWorkflows
      .filter((workflow) => workflow.checkoutShas.length > 0)
      .map((workflow) => workflow.file),
    [
      STAGING_DEPLOY_WORKFLOW,
      STAGING_PROVISION_WORKFLOW,
      RESTORE_DATABASE_WORKFLOW,
      RESTORE_WORKFLOW,
    ],
  );
  const restoreWorkflows = selfHostedWorkflows.filter((workflow) =>
    [RESTORE_DATABASE_WORKFLOW, RESTORE_HOST_WORKFLOW, RESTORE_WORKFLOW].includes(
      workflow.file,
    )
  );
  const stagingProvisionWorkflow = selfHostedWorkflows.find(
    (workflow) => workflow.file === STAGING_PROVISION_WORKFLOW,
  );
  const stagingDeployWorkflow = selfHostedWorkflows.find(
    (workflow) => workflow.file === STAGING_DEPLOY_WORKFLOW,
  );
  assert.equal(restoreWorkflows.length, 3);
  for (const restoreWorkflow of restoreWorkflows) {
    assert.deepEqual(
      restoreWorkflow.checkoutShas,
      restoreWorkflow.file === RESTORE_HOST_WORKFLOW ? [] : [RESTORE_CHECKOUT_V4_SHA],
    );
  }
  assert.deepEqual(stagingProvisionWorkflow?.checkoutShas, [
    HOSTED_CHECKOUT_V7_0_1_SHA,
  ]);
  assert.deepEqual(stagingDeployWorkflow?.checkoutShas, [
    HOSTED_CHECKOUT_V7_0_1_SHA,
  ]);
  for (const restoreWorkflow of restoreWorkflows) {
    assert.match(
      restoreWorkflow.source,
      /runs-on:\s*\n\s+group:\s*fanmind-restore-drill\s*\n\s+labels:\s*\[self-hosted, fanmind-restore, fanmind-restore-01, linux, x64\]/u,
    );
    assert.match(
      restoreWorkflow.source,
      /RESTORE_RUNNER_SCOPE: \$\{\{ vars\.FANMIND_RESTORE_RUNNER_SCOPE \}\}[\s\S]*organization-workflow-allowlist/u,
    );
  }
  assert.match(
    stagingProvisionWorkflow?.source ?? "",
    /runs-on:\s*\[self-hosted, fanmind-prod, exoscale, linux, x64\]/u,
  );
  assert.match(
    stagingDeployWorkflow?.source ?? "",
    /runs-on:\s*\[self-hosted, fanmind-staging, exoscale, linux, x64\]/u,
  );

  const hostedWorkflows = workflowRecords.filter(
    (workflow) => !workflow.selfHosted && workflow.checkoutShas.length > 0,
  );
  assert.equal(hostedWorkflows.length, 54);
  assert.equal(
    hostedWorkflows.reduce(
      (count, workflow) => count + workflow.checkoutShas.length,
      0,
    ),
    57,
  );
  assert.equal(
    hostedWorkflows.every((workflow) =>
      workflow.checkoutShas.every(
        (checkoutSha) => checkoutSha === HOSTED_CHECKOUT_V7_0_1_SHA,
      ),
    ),
    true,
  );
