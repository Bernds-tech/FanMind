function createContactLoadSequence() {
  let current = 0;
  return {
    begin() {
      current += 1;
      return current;
    },
    invalidate() {
      current += 1;
    },
    isCurrent(sequence) {
      return Number.isInteger(sequence) && sequence === current;
    },
  };
}

function resolveContactLoadTarget(current, refreshResult) {
  const source = refreshResult === undefined ? current : refreshResult;
  return {
    workspace: source.workspace,
    transportUnavailable: source.transportUnavailable,
  };
}

export {
  createContactLoadSequence,
  resolveContactLoadTarget,
};
