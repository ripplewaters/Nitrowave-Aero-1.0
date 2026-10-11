import release from '../../landing/release.json';

export const releasesUrl = `${release.repository}/releases/tag/${release.tag}`;
export const downloadUrl = (file: string) => `${release.repository}/releases/download/${release.tag}/${encodeURIComponent(file)}`;
export default release;
