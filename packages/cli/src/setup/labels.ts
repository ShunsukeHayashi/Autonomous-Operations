/**
 * Labels setup module
 *
 * Creates 53 labels across 10 categories from .github/labels.yml
 */

import { Octokit } from '@octokit/rest';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { parse as parseYaml } from 'yaml';

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Label {
  name: string;
  color: string;
  description: string;
}

interface SetupOptions {
  merge?: boolean; // If true, merge with existing labels
}

export async function setupLabels(
  owner: string,
  repo: string,
  token: string,
  options: SetupOptions = {}
): Promise<{ created: number; updated: number }> {
  const octokit = new Octokit({ auth: token });

  // Load labels from template
  const labels = await loadLabelsFromTemplate();

  let created = 0;
  let updated = 0;

  // Get existing labels if merge mode
  let existingLabels: string[] = [];

  if (options.merge) {
    const { data } = await octokit.issues.listLabelsForRepo({
      owner,
      repo,
      per_page: 100,
    });
    existingLabels = data.map((label) => label.name);
  }

  // Create or update each label
  for (const label of labels) {
    try {
      if (existingLabels.includes(label.name)) {
        // Update existing label
        await octokit.issues.updateLabel({
          owner,
          repo,
          name: label.name,
          color: label.color.replace('#', ''),
          description: label.description,
        });
        updated++;
      } else {
        // Create new label
        await octokit.issues.createLabel({
          owner,
          repo,
          name: label.name,
          color: label.color.replace('#', ''),
          description: label.description,
        });
        created++;
      }
    } catch (error) {
      // Label might already exist, skip
      continue;
    }
  }

  return { created, updated };
}

/**
 * Load labels from .github/labels.yml template
 */
async function loadLabelsFromTemplate(): Promise<Label[]> {
  // Get template path (relative to this file)
  const templatePath = path.join(__dirname, '../../templates/labels.yml');

  if (!fs.existsSync(templatePath)) {
    // Fallback: load from project root
    const rootPath = path.join(process.cwd(), '.github', 'labels.yml');

    if (!fs.existsSync(rootPath)) {
      throw new Error('labels.yml template not found');
    }

    const content = fs.readFileSync(rootPath, 'utf-8');
    return parseYaml(content) as Label[];
  }

  const content = fs.readFileSync(templatePath, 'utf-8');
  return parseYaml(content) as Label[];
}
