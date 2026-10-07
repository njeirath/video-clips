import { realpath, stat } from 'node:fs/promises';
import path from 'node:path';

export const MEDIA_SOURCE_ROOT = '/mnt/nfs';

export class MediaPathError extends Error {
  constructor(message: string, readonly statusCode: number) {
    super(message);
    this.name = 'MediaPathError';
  }
}

export interface ResolvedMediaFile {
  filePath: string;
  mediaRoot: string;
}

function isInsideRoot(root: string, candidate: string): boolean {
  const relativePath = path.relative(root, candidate);
  return (
    relativePath !== '' &&
    relativePath !== '..' &&
    !relativePath.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relativePath)
  );
}

export function resolveMediaPath(source: string): ResolvedMediaFile {
  if (typeof source !== 'string' || !path.isAbsolute(source)) {
    throw new MediaPathError('The media source must be an absolute path.', 400);
  }

  const normalizedSource = path.resolve(source);
  const sourceRoot = path.resolve(MEDIA_SOURCE_ROOT);
  if (!isInsideRoot(sourceRoot, normalizedSource)) {
    throw new MediaPathError(
      `The media source must be inside ${MEDIA_SOURCE_ROOT}.`,
      403
    );
  }

  const relativePath = path.relative(sourceRoot, normalizedSource);
  const configuredBase = process.env.MEDIA_BASE_PATH?.trim();
  const mediaRoot = configuredBase
    ? path.resolve(configuredBase, 'mnt', 'nfs')
    : sourceRoot;
  const filePath = path.resolve(mediaRoot, relativePath);

  if (!isInsideRoot(mediaRoot, filePath)) {
    throw new MediaPathError(
      'The media source resolves outside the media root.',
      403
    );
  }

  return { filePath, mediaRoot };
}

export async function resolveReadableMediaFile(
  source: string
): Promise<ResolvedMediaFile> {
  const resolved = resolveMediaPath(source);
  let realMediaRoot: string;
  let realFilePath: string;

  try {
    realMediaRoot = await realpath(resolved.mediaRoot);
  } catch {
    throw new MediaPathError(
      'The configured media root is not available.',
      503
    );
  }

  try {
    realFilePath = await realpath(resolved.filePath);
  } catch {
    throw new MediaPathError('The media file was not found.', 404);
  }

  if (!isInsideRoot(realMediaRoot, realFilePath)) {
    throw new MediaPathError(
      'The media file resolves outside the media root.',
      403
    );
  }

  try {
    if (!(await stat(realFilePath)).isFile()) {
      throw new MediaPathError('The media source is not a file.', 404);
    }
  } catch (error) {
    if (error instanceof MediaPathError) {
      throw error;
    }
    throw new MediaPathError('The media file is not readable.', 403);
  }

  return { filePath: realFilePath, mediaRoot: realMediaRoot };
}
