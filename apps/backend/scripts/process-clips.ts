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

const CSV_PATH =
  '/Users/nakuljeirath/dev/work/video-clips/apps/backend/Video Clips - Sheet1.csv';
const LOCAL_VIDEO_DIR = path.resolve(
  __dirname,
  '/Users/nakuljeirath/dev/work/video-clips/apps/backend/tmp/videos'
);
const LOCAL_THUMB_DIR = path.resolve(
  __dirname,
  '/Users/nakuljeirath/dev/work/video-clips/apps/backend/tmp/thumbnails'
);
const REMOTE_HOST = '192.168.0.7';
const REMOTE_USER = 'nakul';
const GRAPHQL_ENDPOINT = 'http://localhost:3000/graphql'; // TODO: set actual endpoint
const GRAPHQL_AUTH_TOKEN = process.env.GRAPHQL_AUTH_TOKEN || '';

async function processCSV(passphrase: string) {
  if (!fs.existsSync(LOCAL_VIDEO_DIR))
    fs.mkdirSync(LOCAL_VIDEO_DIR, { recursive: true });
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

  let lastSource = null;
  let localSource = null;
  // GraphQL query to check if a video clip with the given name exists
  const getVideoClipByNameQuery = gql`
    query GetVideoClipByName($searchQuery: String!) {
      videoClips(searchQuery: $searchQuery) {
        id
        name
      }
    }
  `;

  for (const row of rows) {
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

    // Query backend to check if video already exists by name and ensure names match
    try {
      const result = await client.request(getVideoClipByNameQuery, {
        searchQuery: name,
      });
      if (
        result &&
        result.videoClips &&
        result.videoClips.length > 0 &&
        result.videoClips.some((clip: any) => clip.name === name)
      ) {
        console.log(`Clip already exists on backend, skipping: ${name}`);
        continue;
      }
    } catch (err) {
      console.error(`Error querying backend for clip '${name}':`, err);
      // Optionally continue or throw, here we continue
      continue;
    }

    if (source !== lastSource) {
      localSource = path.join(LOCAL_VIDEO_DIR, path.basename(source));
      if (!fs.existsSync(localSource)) {
        console.log(`SCP ${source} to ${localSource}`);
        await ssh.getFile(localSource, source);
      } else {
        console.log(`Source already downloaded: ${localSource}`);
      }
      lastSource = source;
    }
    const trimmedVideo = path.join(LOCAL_VIDEO_DIR, `${name}.mp4`);
    const thumbnail = path.join(LOCAL_THUMB_DIR, `${name}.jpg`);

    // 2. ffmpeg trim
    console.log(`Trimming video: ${localSource} -> ${trimmedVideo}`);
    execSync(
      `ffmpeg -y -i "${localSource}" -ss ${Start} -to ${End} -c:v libx264 -profile:v high -pix_fmt yuv420p -c:a copy -b:a 128k -movflags +faststart "${trimmedVideo}"`
    );

    // 3. ffmpeg thumbnail
    console.log(`Extracting thumbnail: ${trimmedVideo} -> ${thumbnail}`);
    execSync(
      `ffmpeg -y -i "${trimmedVideo}" -frames:v 1 -q:v 2 "${thumbnail}"`
    );

    // 4. Compute blurhash
    const image = await sharp(thumbnail)
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

    // 5. Upload video to S3 using presigned URL
    const generateUploadUrlMutation = gql`
      mutation GenerateUploadUrl($fileName: String!, $contentType: String!) {
        generateUploadUrl(fileName: $fileName, contentType: $contentType) {
          uploadUrl
          s3Key
          videoUrl
        }
      }
    `;
    const fileName = `${name}.mp4`;
    const contentType = 'video/mp4';
    const { generateUploadUrl } = await client.request(
      generateUploadUrlMutation,
      { fileName, contentType }
    );
    console.log(generateUploadUrl);

    // 5.2 Upload video to S3
    const videoData = fs.readFileSync(trimmedVideo);
    await axios.put(generateUploadUrl.uploadUrl, videoData, {
      headers: {
        'Content-Type': contentType,
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
    const s3Key = generateUploadUrl.s3Key;
    const videoUrl = generateUploadUrl.videoUrl;

    // 5.3 Upload thumbnail to S3 (optional, if needed)
    const thumbnailUrl = undefined; // Set if you upload thumbnail

    // 5.4 Create video clip
    const createVideoClipMutation = gql`
      mutation CreateVideoClip($input: CreateVideoClipInput!) {
        createVideoClip(input: $input) {
          id
        }
      }
    `;
    const input = {
      name,
      description: description || script,
      script,
      characters,
      tags,
      blurhash,
      s3Key,
      videoUrl,
      thumbnailUrl,
      // Add other fields as needed (duration, source, etc.)
    };
    await client.request(createVideoClipMutation, { input });
    console.log(`Uploaded and saved clip: ${name}`);
  }

  console.log('All done!');
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

askPassphrase()
  .then((passphrase) => processCSV(passphrase))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
