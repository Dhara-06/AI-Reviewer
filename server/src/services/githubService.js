const axios = require('axios');
const config = require('../config/env');

const MAX_FILES = 15;
const MAX_FILE_SIZE_BYTES = 50 * 1024; // 50 KB

const IGNORED_PATTERNS = [
  /^\.env/i,
  /\.pem$/i,
  /\.key$/i,
  /id_rsa/i,
  /credentials\.json/i,
  /node_modules/i,
  /^\.git/i,
  /dist\//i,
  /build\//i,
  /\.(png|jpe?g|gif|svg|ico|pdf|zip|tar|gz|mp4|webm|mp3|exe|dll|so|dylib)$/i,
];

const parseGitHubUrl = (url) => {
  if (!url || typeof url !== 'string') {
    throw new Error('GitHub repository URL is required.');
  }

  const cleanUrl = url.trim().replace(/\.git$/, '');
  const match = cleanUrl.match(/github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)/i);

  if (!match) {
    throw new Error('Invalid GitHub repository URL format. Example: https://github.com/username/project');
  }

  return { owner: match[1], repo: match[2] };
};

const getGitHubClient = () => {
  const headers = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'AI-Review-Automation-System/2.0',
  };

  if (config.github.token) {
    headers.Authorization = `Bearer ${config.github.token}`;
  }

  return axios.create({
    baseURL: 'https://api.github.com',
    headers,
    timeout: 15000,
  });
};

const inspectRepository = async (repoUrl) => {
  const { owner, repo } = parseGitHubUrl(repoUrl);
  const client = getGitHubClient();

  try {
    const repoRes = await client.get(`/repos/${owner}/${repo}`);
    const defaultBranch = repoRes.data.default_branch || 'main';

    const commitRes = await client.get(`/repos/${owner}/${repo}/commits/${defaultBranch}`);
    const latestCommitSha = commitRes.data.sha;

    const treeRes = await client.get(`/repos/${owner}/${repo}/git/trees/${latestCommitSha}?recursive=1`);
    const tree = treeRes.data.tree || [];

    const candidateBlobs = tree.filter((item) => {
      if (item.type !== 'blob') return false;
      if (item.size && item.size > MAX_FILE_SIZE_BYTES) return false;
      for (const pattern of IGNORED_PATTERNS) {
        if (pattern.test(item.path)) return false;
      }
      return true;
    });

    const readmeItem = candidateBlobs.find((b) => /^readme\.md$/i.test(b.path));
    const otherFiles = candidateBlobs
      .filter((b) => !/^readme\.md$/i.test(b.path))
      .slice(0, MAX_FILES - (readmeItem ? 1 : 0));

    const selectedBlobs = readmeItem ? [readmeItem, ...otherFiles] : otherFiles;

    const inspectedFiles = [];
    for (const blob of selectedBlobs) {
      try {
        const fileRes = await client.get(`/repos/${owner}/${repo}/contents/${blob.path}?ref=${latestCommitSha}`);
        if (fileRes.data && fileRes.data.content) {
          const content = Buffer.from(fileRes.data.content, 'base64').toString('utf-8');
          inspectedFiles.push({
            path: blob.path,
            size: blob.size || content.length,
            content,
          });
        }
      } catch (err) {
        console.warn(`[GitHub Service] Skip file ${blob.path}: ${err.message}`);
      }
    }

    return {
      success: true,
      owner,
      repo,
      defaultBranch,
      commitSha: latestCommitSha,
      repositoryMetadata: {
        stars: repoRes.data.stargazers_count,
        forks: repoRes.data.forks_count,
        openIssues: repoRes.data.open_issues_count,
        isPrivate: repoRes.data.private,
        lastUpdated: repoRes.data.updated_at,
        description: repoRes.data.description,
      },
      files: inspectedFiles,
      totalFilesInRepo: tree.length,
    };
  } catch (error) {
    const status = error.response?.status;
    let userMsg = `Failed to access repository ${owner}/${repo}.`;
    if (status === 404) {
      userMsg = `Repository ${owner}/${repo} was not found or is private.`;
    } else if (status === 403) {
      userMsg = 'GitHub API rate limit exceeded or access forbidden.';
    }
    throw new Error(userMsg);
  }
};

module.exports = {
  parseGitHubUrl,
  inspectRepository,
};
