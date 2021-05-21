async function getPackageInfoByName(packageName) {
  const response = await fetch(`https://api.npms.io/v2/package/${packageName}`);
  if (response.ok) {
    const json = await response.json();
    return {
      name: json.collected.metadata.name,
      description: json.collected.metadata.description,
      version: json.collected.metadata.version,
      date: json.collected.metadata.date,
      publisher: json.collected.metadata.publisher.username,
      homepage: json.collected.metadata.links.homepage,
      repository: json.collected.metadata.links.repository,
      license: json.collected.metadata.license,
      quality: json.score.detail.quality,
      popularity: json.score.detail.popularity,
      maintenance: json.score.detail.maintenance,
    };
  }
}
