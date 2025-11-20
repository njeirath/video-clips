import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';
import { NodeSSH } from 'node-ssh';
import { execSync } from 'child_process';
import sharp from 'sharp';
import { encode } from 'blurhash';
import { GraphQLClient, gql } from 'graphql-request';
import axios from 'axios';
import readline from 'readline';
import process from 'process';

const CSV_PATH =
  '/Users/nakuljeirath/dev/work/video-clips/apps/backend/Video Clips - Sheet1.csv';
const LOCAL_VIDEO_DIR = path.resolve(
  __dirname,
  '/Users/nakuljeirath/dev/work/video-clips/apps/backend/tmp/videos'
);
const LOCAL_SOURCE_DIR = path.resolve(
  __dirname,
  '/Users/nakuljeirath/dev/work/video-clips/apps/backend/tmp/sources'
);
const LOCAL_THUMB_DIR = path.resolve(
  __dirname,
  '/Users/nakuljeirath/dev/work/video-clips/apps/backend/tmp/thumbnails'
);
const REMOTE_HOST = '192.168.0.7';
const REMOTE_USER = 'nakul';
const endpointHost = (process.env.ENDPOINT_HOST || 'localhost').replace(/\/+$/, '');
const GRAPHQL_ENDPOINT = `http://${endpointHost}:3020/graphql`; // TODO: set actual endpoint
const GRAPHQL_AUTH_TOKEN = process.env.GRAPHQL_AUTH_TOKEN || '';

async function processCSV(passphrase: string, rowArg?: string) {
  if (!fs.existsSync(LOCAL_VIDEO_DIR))
    fs.mkdirSync(LOCAL_VIDEO_DIR, { recursive: true });
  if (!fs.existsSync(LOCAL_SOURCE_DIR))
    fs.mkdirSync(LOCAL_SOURCE_DIR, { recursive: true });
  if (!fs.existsSync(LOCAL_THUMB_DIR))
    fs.mkdirSync(LOCAL_THUMB_DIR, { recursive: true });

  const ssh = new NodeSSH();
  const privateKey = fs.readFileSync('/Users/nakuljeirath/.ssh/id_rsa', 'utf8');
  await ssh.connect({
    host: REMOTE_HOST,
    username: REMOTE_USER,
    privateKey,
    passphrase,
  });

  const client = new GraphQLClient(GRAPHQL_ENDPOINT, {
    headers: {
      authorization: `Bearer ${GRAPHQL_AUTH_TOKEN}`,
    },
  });

  const parser = fs.createReadStream(CSV_PATH).pipe(parse({ columns: true }));
  const rows = [];
  for await (const row of parser) {
    rows.push(row);
  }

  // Parse rowArg to determine which rows to process
  let selectedRows: any[] = [];
  if (rowArg) {
    const rangeMatch = rowArg.match(/^(\d+)-(\d+)$/);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);
      if (start > 0 && end >= start && end <= rows.length) {
        selectedRows = rows.slice(start - 1, end);
      }
    } else {
      const singleMatch = rowArg.match(/^(\d+)$/);
      if (singleMatch) {
        const idx = parseInt(singleMatch[1], 10);
        if (idx > 0 && idx <= rows.length) {
          selectedRows = [rows[idx - 1]];
        }
      }
    }
    if (selectedRows.length === 0) {
      console.error(`Invalid row argument: ${rowArg}`);
      ssh.dispose();
      return;
    }
  } else {
    selectedRows = rows;
  }

  let lastSource = null;
  let localSource = null;
  // Helper: parse time strings like "00:17:20.3" or "17:20.3" or plain seconds
  function parseTimeToSeconds(timeStr?: string): number | undefined {
    if (!timeStr) return undefined;
    const s = String(timeStr).trim();
    // If numeric (seconds) already
    if (/^\d+(\.\d+)?$/.test(s)) return Number(s);
    // Matches HH:MM:SS(.ms) or MM:SS(.ms)
    const parts = s.split(':').map((p) => p.trim());
    if (parts.length === 0) return undefined;
    let seconds = 0;
    if (parts.length === 3) {
      const hours = Number(parts[0]);
      const minutes = Number(parts[1]);
      const secs = Number(parts[2]);
      if (isNaN(hours) || isNaN(minutes) || isNaN(secs)) return undefined;
      seconds = hours * 3600 + minutes * 60 + secs;
    } else if (parts.length === 2) {
      const minutes = Number(parts[0]);
      const secs = Number(parts[1]);
      if (isNaN(minutes) || isNaN(secs)) return undefined;
      seconds = minutes * 60 + secs;
    } else {
      return undefined;
    }
    return seconds;
  }
  // Helper: split comma-separated CSV fields into string[] (trimmed), return undefined if empty
  function splitCsvArray(field?: string): string[] | undefined {
    if (!field) return undefined;
    const parts = String(field)
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    return parts.length > 0 ? parts : undefined;
  }
  // GraphQL query to fetch clips with pagination (offset/limit). We'll page
  // through results until we receive a page smaller than the requested limit.
  const getVideoClipsQuery = gql`
    query GetVideoClips( $offset: Int, $limit: Int) {
      videoClips(offset: $offset, limit: $limit) {
        id
        name
      }
    }
  `;
  // Fetch existing clips once so we don't query the backend on every row.
  // Assumption: the `videoClips(searchQuery: String!)` query accepts an empty
  // string and returns all clips. If the server requires a different approach
  // we'll need to adjust this to a proper "list all" query.
  let existingClips: any[] = [];
  try {
    const pageSize = 500; // reasonable batch size for paging
    let offset = 0;
    while (true) {
      const pageResult = await client.request(getVideoClipsQuery, {
        offset,
        limit: pageSize,
      });
      const pageClips = (pageResult && pageResult.videoClips) || [];
      existingClips.push(...pageClips);
      if (pageClips.length < pageSize) break;
      offset += pageSize;
    }
  } catch (err) {
    console.error('Error fetching existing video clips from backend:', err);
    // Continue with an empty list; duplicates may be created in this run.
  }

  let skipped = 0;
  let processed = 0;
  let alreadyPresent = 0;
  for (const row of selectedRows) {
    const currentIndex = rows.indexOf(row) + 1;
    console.log(`Processing ${currentIndex} of ${rows.length}`);
    const {
      Show,
      Season,
      Episode,
      Start,
      End,
      name,
      description,
      script,
      characters,
      tags,
      source,
    } = row;

    if (!source || !name || !Start || !End) {
      skipped += 1;
      continue;
    }

    // Parse start/end times (they may be in hh:mm:ss.ms format)
    const parsedStart = parseTimeToSeconds(Start);
    const parsedEnd = parseTimeToSeconds(End);
    if (
      typeof parsedStart === 'undefined' ||
      typeof parsedEnd === 'undefined'
    ) {
      console.error(
        `Invalid Start/End time formats for clip '${name}': Start='${Start}', End='${End}' - skipping`
      );
      skipped += 1;
      continue;
    }
    if (parsedStart >= parsedEnd) {
      console.error(
        `Start must be less than End for clip '${name}': start=${parsedStart}, end=${parsedEnd} - skipping`
      );
      skipped += 1;
      continue;
    }

    // Clean the name for file usage
    const cleanName = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

    // Check cached list of existing clips (fetched once before the loop)
    if (existingClips.some((clip: any) => clip.name === name)) {
      console.log(`Clip already exists on backend, skipping: ${name}`);
      alreadyPresent += 1;
      continue;
    }

    // Check if we can skip downloading the source when the trimmed video + thumbnail already exist
    const trimmedVideoPath = path.join(LOCAL_VIDEO_DIR, `${cleanName}.mp4`);
    const thumbnailPath = path.join(LOCAL_THUMB_DIR, `${cleanName}.jpg`);

    if (source !== lastSource) {
      // If both trimmed video and thumbnail already exist, skip fetching the source
      if (fs.existsSync(trimmedVideoPath)) {
        console.log(
          `Trimmed video and thumbnail already present for '${cleanName}', skipping source download`
        );
        // Do NOT set lastSource/localSource here because we didn't actually download the source.
        // This ensures future rows that need trimming will still trigger a download.
      } else {
        // keep original downloaded source files separate from trimmed output videos
        localSource = path.join(LOCAL_SOURCE_DIR, path.basename(source));
        if (!fs.existsSync(localSource)) {
          console.log(`SCP ${source} to ${localSource}`);
          await ssh.getFile(localSource, source);
        } else {
          console.log(
            `Source already downloaded in sources dir: ${localSource}`
          );
        }
        lastSource = source;
      }
    }

    // 2. ffmpeg trim
    if (!fs.existsSync(trimmedVideoPath)) {
      console.log(`Trimming video: ${localSource} -> ${trimmedVideoPath}`);
      execSync(
        `ffmpeg -y -i "${localSource}" -ss ${Start} -to ${End} -c:v libx264 -profile:v high -pix_fmt yuv420p -c:a copy -b:a 128k -movflags +faststart "${trimmedVideoPath}"`
      );
    }

    // 3. ffmpeg thumbnail
    if (!fs.existsSync(thumbnailPath)) {
      console.log(
        `Extracting thumbnail: ${trimmedVideoPath} -> ${thumbnailPath}`
      );
      // Extract a single frame using ffmpeg to a temporary file first.
      // Ensure the temp file has a standard image extension so ffmpeg can
      // choose the proper muxer/format automatically (avoid "Unable to choose an output format").
      const tmpThumb = thumbnailPath + '.tmp.jpg';
      execSync(
        `ffmpeg -y -i "${trimmedVideoPath}" -frames:v 1 -q:v 2 "${tmpThumb}"`
      );

      // Resize the extracted thumbnail to a max width of 480px while preserving aspect ratio
      // and avoid upscaling smaller images.
      try {
        const img = sharp(tmpThumb);
        const metadata = await img.metadata();
        if (metadata.width && metadata.width > 480) {
          await img
            .resize({ width: 480 })
            .jpeg({ quality: 85 })
            .toFile(thumbnailPath);
        } else {
          // If width is already <= 480, simply convert to JPEG (if necessary) and move
          await img.jpeg({ quality: 85 }).toFile(thumbnailPath);
        }
      } catch (err) {
        // If sharp fails for any reason, fall back to the original tmp file
        console.error(`Failed to resize thumbnail for ${cleanName}:`, err);
        // tmpThumb already has a .jpg extension so we can safely rename it
        fs.renameSync(tmpThumb, thumbnailPath);
      } finally {
        // Clean up tmp file if it still exists
        try {
          if (fs.existsSync(tmpThumb)) fs.unlinkSync(tmpThumb);
        } catch (e) {
          // ignore cleanup errors
        }
      }
    }

    // 4. Compute blurhash
    const image = await sharp(thumbnailPath)
      .raw()
      .ensureAlpha()
      .resize(32, 32)
      .toBuffer({ resolveWithObject: true });
    const { data, info } = image;
    const blurhash = encode(
      new Uint8ClampedArray(data),
      info.width,
      info.height,
      4,
      4
    );
    console.log(`Blurhash: ${blurhash}`);

    // 5. Upload video and thumbnail to S3 using presigned URLs
    const generateUploadUrlMutation = gql`
      mutation GenerateUploadUrl(
        $fileName: String!
        $contentType: String!
        $thumbnailFileName: String
        $thumbnailContentType: String
      ) {
        generateUploadUrl(
          fileName: $fileName
          contentType: $contentType
          thumbnailFileName: $thumbnailFileName
          thumbnailContentType: $thumbnailContentType
        ) {
          uploadUrl
          s3Key
          videoUrl
          thumbnailUploadUrl
          thumbnailS3Key
          thumbnailUrl
        }
      }
    `;
    const fileName = `${cleanName}.mp4`;
    const contentType = 'video/mp4';
    const thumbnailFileName = `${cleanName}.jpg`;
    const thumbnailContentType = 'image/jpeg';

    const { generateUploadUrl } = await client.request(
      generateUploadUrlMutation,
      {
        fileName,
        contentType,
        thumbnailFileName,
        thumbnailContentType,
      }
    );

    // 5.2 Upload video to S3
    const videoData = fs.readFileSync(trimmedVideoPath);
    await axios.put(generateUploadUrl.uploadUrl, videoData, {
      headers: {
        'Content-Type': contentType,
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
    const s3Key = generateUploadUrl.s3Key;
    const videoUrl = generateUploadUrl.videoUrl;
    console.log('Video uploaded successfully');

    // 5.3 Upload thumbnail to S3
    let thumbnailUrl = undefined;
    if (generateUploadUrl.thumbnailUploadUrl && fs.existsSync(thumbnailPath)) {
      const thumbnailData = fs.readFileSync(thumbnailPath);
      await axios.put(generateUploadUrl.thumbnailUploadUrl, thumbnailData, {
        headers: {
          'Content-Type': thumbnailContentType,
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });
      thumbnailUrl = generateUploadUrl.thumbnailUrl;
      console.log('Thumbnail uploaded successfully');
    }

    // 5.4 Create video clip
    const createVideoClipMutation = gql`
      mutation CreateVideoClip($input: CreateVideoClipInput!) {
        createVideoClip(input: $input) {
          id
        }
      }
    `;
    // Build source input based on CSV fields. Schema expects a VideoClipSourceInput
    // which has either a 'show' or 'movie' object. Use parsedStart/parsedEnd.
    let sourceInput: any = undefined;
    // If Season or Episode present, treat as ShowSource
    const seasonNum = Season ? Number(Season) : undefined;
    const episodeNum = Episode ? Number(Episode) : undefined;

    if (Season || Episode || Show) {
      // Prefer explicit Show field if present
      sourceInput = {
        show: {
          title: Show || path.basename(source, path.extname(source)),
          airDate: undefined,
          season: isNaN(seasonNum) ? undefined : seasonNum,
          episode: isNaN(episodeNum) ? undefined : episodeNum,
          start: parsedStart,
          end: parsedEnd,
        },
      };
    } else if (source) {
      // Fallback: treat as movie/source file
      sourceInput = {
        movie: {
          title: path.basename(source, path.extname(source)),
          releaseDate: undefined,
          start: parsedStart,
          end: parsedEnd,
        },
      };
    }

    const duration = parsedEnd - parsedStart;

    const input = {
      name,
      description: description,
      script,
      characters: splitCsvArray(characters),
      tags: splitCsvArray(tags),
      blurhash,
      s3Key,
      videoUrl,
      thumbnailUrl,
      duration,
      source: sourceInput,
    };
    const createResult = await client.request(createVideoClipMutation, { input });
    // If creation succeeded, push to cached list so subsequent rows in this
    // run won't try to re-upload the same clip.
    if (createResult && createResult.createVideoClip && createResult.createVideoClip.id) {
      existingClips.push({ id: createResult.createVideoClip.id, name });
    }
    console.log(`Uploaded and saved clip: ${name}`);
    processed += 1;
  }

  console.log(
    `All done! Processed: ${processed}, Skipped (missing data): ${skipped}, Already Present: ${alreadyPresent}`
  );
  ssh.dispose();
}

function askPassphrase(): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });
    // Hide input by muting output
    const stdin = process.stdin;
    const onData = (char: Buffer) => {
      const str = char.toString();
      switch (str) {
        case '\n':
        case '\r':
        case '\u0004':
          stdin.pause();
          break;
        default:
          process.stdout.clearLine(0);
          process.stdout.cursorTo(0);
          process.stdout.write(
            'Enter SSH key passphrase: ' + '*'.repeat(rl.line.length)
          );
          break;
      }
    };
    process.stdout.write('Enter SSH key passphrase: \n');
    stdin.on('data', onData);
    rl.question('', (answer) => {
      stdin.removeListener('data', onData);
      process.stdout.write('\n');
      rl.close();
      resolve(answer);
    });
  });
}

// Parse named argument --row-range=<value>
let rowArg: string | undefined = undefined;
for (const arg of process.argv.slice(2)) {
  if (arg.startsWith('--row-range=')) {
    rowArg = arg.replace('--row-range=', '');
    break;
  }
}
askPassphrase()
  .then((passphrase) => processCSV(passphrase, rowArg))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
