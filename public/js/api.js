async function fetchModVersions() {
  try {
    const res = await fetch("/api/mods");
    if (!res.ok) throw new Error("Failed to fetch mod versions");
    return await res.json();
  } catch (err) {
    console.warn("Could not fetch versions from API:", err);
    return [];
  }
}
