const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const OWNER_PATTERN =
  /^[a-z0-9](?:[a-z0-9_-]{0,37}[a-z0-9])?$/iu;

function optionalEasBinding(environment = process.env) {
  const owner = String(
    environment.FANMIND_MOBILE_EXPECTED_EAS_OWNER ?? "",
  ).trim();
  const projectId = String(
    environment.FANMIND_MOBILE_EXPECTED_EAS_PROJECT_ID ?? "",
  )
    .trim()
    .toLowerCase();

  if (!owner && !projectId) return null;
  if (
    !OWNER_PATTERN.test(owner) ||
    /^(?:owner|example|placeholder|fanmind)$/iu.test(owner) ||
    !UUID_PATTERN.test(projectId)
  ) {
    throw new Error("FANMIND_MOBILE_EAS_BINDING_INVALID");
  }
  return { owner, projectId };
}

module.exports = ({ config, environment = process.env }) => {
  const binding = optionalEasBinding(environment);
  if (!binding) return config;

  return {
    ...config,
    owner: binding.owner,
    extra: {
      ...(config.extra ?? {}),
      eas: {
        projectId: binding.projectId,
      },
    },
  };
};

module.exports.optionalEasBinding = optionalEasBinding;
