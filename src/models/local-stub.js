// Lightweight offline stub model (offline fallback)
export async function runLocalStub(input) {
  // deterministic, fast
  const digest = (s => {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h.toString(16);
  })(input);
  const summary = `stub-summary:${input.slice(0, 200)}...`;
  return { summary, digest };
}
