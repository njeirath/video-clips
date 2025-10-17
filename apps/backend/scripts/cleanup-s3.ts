import { OpenSearchService } from '../src/services/opensearch.service';
import { S3Client, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';

import { config as dotenvConfig } from 'dotenv';
dotenvConfig({ path: process.env.ENV_PATH || '../../../.env' });
const openSearchService = new OpenSearchService();

async function checkOpenSearchConnection() {
  try {
    // Simple health check
    await openSearchService['client'].cluster.health();
    return true;
  } catch (err) {
    console.error('Failed to connect to OpenSearch:', err);
    return false;
  }
}

async function getReferencedS3Keys() {
  // Get all video clips from OpenSearch
  const clips = await openSearchService.getAllVideoClips();
  // Collect all referenced video S3 keys
  const videoKeys = clips
    .map((clip: any) => clip.s3Key)
    .filter((key: string | undefined) => !!key);

  // Extract share S3 keys from shareUrl property (e.g., https://.../s/xxxxxxx)
  const shareKeys = clips
    .map((clip: any) => {
      if (clip.shareUrl && typeof clip.shareUrl === 'string') {
        const match = clip.shareUrl.match(/\/s\/([A-Za-z0-9_-]+)/);
        return match ? `s/${match[1]}` : undefined;
      }
      return undefined;
    })
    .filter((key: string | undefined) => !!key);

  return { videoKeys, shareKeys };
}

async function main() {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(`\nUsage: npx ts-node scripts/cleanup-s3.ts [--dry-run]\n
Options:\n  --dry-run   Only show what would be deleted, do not delete\n  --help      Show this help message\n`);
    process.exit(0);
  }
  const dryRun = process.argv.includes('--dry-run');
  console.log('Starting S3 cleanup...');
  const opensearchOk = await checkOpenSearchConnection();
  if (!opensearchOk) {
    console.error('Aborting: OpenSearch is not available.');
    process.exit(2);
  }
  const { videoKeys, shareKeys } = await getReferencedS3Keys();
  console.log('Referenced video S3 keys:', videoKeys.length);
  console.log('Referenced share S3 keys:', shareKeys.length);
  // List all S3 objects in 'videos/' and 's/'
  const region = process.env.AWS_REGION || 'us-east-2';
  const bucketName = process.env.S3_VIDEO_BUCKET || 'dev-video-clips-storage';
  const s3Client = new S3Client({ region });

  async function listAllKeys(prefix: string): Promise<string[]> {
    let continuationToken: string | undefined = undefined;
    let keys: string[] = [];
    do {
      const resp: {
        Contents?: { Key?: string }[];
        IsTruncated?: boolean;
        NextContinuationToken?: string;
      } = await s3Client.send(new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      }));
      if (resp.Contents) {
        keys.push(...resp.Contents.map((obj: { Key?: string }) => obj.Key!).filter(Boolean));
      }
      continuationToken = resp.IsTruncated ? resp.NextContinuationToken : undefined;
    } while (continuationToken);
    return keys;
  }

  const allVideoKeys = await listAllKeys('videos/');
  const allShareKeys = await listAllKeys('s/');
  console.log('Total S3 video objects:', allVideoKeys.length);
  console.log('Total S3 share objects:', allShareKeys.length);
  // Compare and identify unreferenced objects
  const referencedVideoSet = new Set(videoKeys);
  const referencedShareSet = new Set(shareKeys);

  const unreferencedVideos = allVideoKeys.filter(key => !referencedVideoSet.has(key));
  const unreferencedShares = allShareKeys.filter(key => !referencedShareSet.has(key));

  console.log('Unreferenced video objects:', unreferencedVideos.length);
  console.log('Unreferenced share objects:', unreferencedShares.length);
  // Delete unreferenced objects
  async function deleteKeys(keys: string[], label: string) {
    let deleted = 0;
    for (const key of keys) {
      try {
        await s3Client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }));
        deleted++;
        console.log(`[Deleted] ${label}: ${key}`);
      } catch (err) {
        console.error(`[Error] Failed to delete ${label}: ${key}`, err);
      }
    }
    console.log(`Deleted ${deleted} ${label} objects.`);
  }

  if (unreferencedVideos.length > 0) {
    if (dryRun) {
      console.log('[Dry Run] Would delete video objects:', unreferencedVideos);
    } else {
      await deleteKeys(unreferencedVideos, 'video');
    }
  }
  if (unreferencedShares.length > 0) {
    if (dryRun) {
      console.log('[Dry Run] Would delete share objects:', unreferencedShares);
    } else {
      await deleteKeys(unreferencedShares, 'share');
    }
  }
  if (unreferencedVideos.length === 0 && unreferencedShares.length === 0) {
    console.log('No unreferenced S3 objects to delete.');
  }
  console.log('Cleanup complete.');
}

main().catch((err) => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});
