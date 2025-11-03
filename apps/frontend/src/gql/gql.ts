/* eslint-disable */
import * as types from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  mutation CreateVideoClip($input: CreateVideoClipInput!) {\n    createVideoClip(input: $input) {\n      id\n      name\n      description\n      userId\n      createdAt\n    }\n  }\n": typeof types.CreateVideoClipDocument,
    "\n  mutation GenerateUploadUrl($fileName: String!, $contentType: String!) {\n    generateUploadUrl(fileName: $fileName, contentType: $contentType) {\n      uploadUrl\n      s3Key\n      videoUrl\n    }\n  }\n": typeof types.GenerateUploadUrlDocument,
    "\n  query GetVideoClip($id: String!) {\n    videoClip(id: $id) {\n      id\n      name\n      description\n      userId\n      userEmail\n      videoUrl\n      thumbnailUrl\n      script\n      duration\n      characters\n      tags\n      source {\n        ... on ShowSource {\n          title\n          airDate\n          season\n          episode\n          start\n          end\n        }\n        ... on MovieSource {\n          title\n          releaseDate\n          start\n          end\n        }\n      }\n      createdAt\n      updatedAt\n      updatedBy\n    }\n  }\n": typeof types.GetVideoClipDocument,
    "\n  mutation UpdateVideoClip($input: UpdateVideoClipInput!) {\n    updateVideoClip(input: $input) {\n      id\n      name\n      description\n      script\n      duration\n      characters\n      tags\n      source {\n        ... on ShowSource {\n          title\n          airDate\n          season\n          episode\n          start\n          end\n        }\n        ... on MovieSource {\n          title\n          releaseDate\n          start\n          end\n        }\n      }\n      updatedAt\n      updatedBy\n    }\n  }\n": typeof types.UpdateVideoClipDocument,
    "\n  query GetVideoClips($searchQuery: String, $offset: Int, $limit: Int, $sortBy: String, $filterShow: String, $filterCharacter: String) {\n    videoClips(searchQuery: $searchQuery, offset: $offset, limit: $limit, sortBy: $sortBy, filterShow: $filterShow, filterCharacter: $filterCharacter) {\n      id\n      name\n      description\n      userId\n      userEmail\n      videoUrl\n      shareUrl\n      thumbnailUrl\n      blurhash\n      createdAt\n      source {\n        ... on ShowSource {\n          title\n          season\n          episode\n        }\n        ... on MovieSource {\n          title\n        }\n      }\n    }\n  }\n": typeof types.GetVideoClipsDocument,
    "\n  query GetAvailableShows($filterCharacter: String) {\n    availableShows(filterCharacter: $filterCharacter) {\n      name\n      count\n    }\n  }\n": typeof types.GetAvailableShowsDocument,
    "\n  query GetAvailableCharacters($filterShow: String) {\n    availableCharacters(filterShow: $filterShow) {\n      name\n      count\n    }\n  }\n": typeof types.GetAvailableCharactersDocument,
    "\n  query GetVideoClipDetail($id: String!) {\n    videoClip(id: $id) {\n      id\n      name\n      description\n      userId\n      userEmail\n      videoUrl\n      thumbnailUrl\n      script\n      duration\n      characters\n      tags\n      source {\n        ... on ShowSource {\n          title\n          airDate\n          season\n          episode\n          start\n          end\n        }\n        ... on MovieSource {\n          title\n          releaseDate\n          start\n          end\n        }\n      }\n      createdAt\n      updatedAt\n      updatedBy\n    }\n  }\n": typeof types.GetVideoClipDetailDocument,
};
const documents: Documents = {
    "\n  mutation CreateVideoClip($input: CreateVideoClipInput!) {\n    createVideoClip(input: $input) {\n      id\n      name\n      description\n      userId\n      createdAt\n    }\n  }\n": types.CreateVideoClipDocument,
    "\n  mutation GenerateUploadUrl($fileName: String!, $contentType: String!) {\n    generateUploadUrl(fileName: $fileName, contentType: $contentType) {\n      uploadUrl\n      s3Key\n      videoUrl\n    }\n  }\n": types.GenerateUploadUrlDocument,
    "\n  query GetVideoClip($id: String!) {\n    videoClip(id: $id) {\n      id\n      name\n      description\n      userId\n      userEmail\n      videoUrl\n      thumbnailUrl\n      script\n      duration\n      characters\n      tags\n      source {\n        ... on ShowSource {\n          title\n          airDate\n          season\n          episode\n          start\n          end\n        }\n        ... on MovieSource {\n          title\n          releaseDate\n          start\n          end\n        }\n      }\n      createdAt\n      updatedAt\n      updatedBy\n    }\n  }\n": types.GetVideoClipDocument,
    "\n  mutation UpdateVideoClip($input: UpdateVideoClipInput!) {\n    updateVideoClip(input: $input) {\n      id\n      name\n      description\n      script\n      duration\n      characters\n      tags\n      source {\n        ... on ShowSource {\n          title\n          airDate\n          season\n          episode\n          start\n          end\n        }\n        ... on MovieSource {\n          title\n          releaseDate\n          start\n          end\n        }\n      }\n      updatedAt\n      updatedBy\n    }\n  }\n": types.UpdateVideoClipDocument,
    "\n  query GetVideoClips($searchQuery: String, $offset: Int, $limit: Int, $sortBy: String, $filterShow: String, $filterCharacter: String) {\n    videoClips(searchQuery: $searchQuery, offset: $offset, limit: $limit, sortBy: $sortBy, filterShow: $filterShow, filterCharacter: $filterCharacter) {\n      id\n      name\n      description\n      userId\n      userEmail\n      videoUrl\n      shareUrl\n      thumbnailUrl\n      blurhash\n      createdAt\n      source {\n        ... on ShowSource {\n          title\n          season\n          episode\n        }\n        ... on MovieSource {\n          title\n        }\n      }\n    }\n  }\n": types.GetVideoClipsDocument,
    "\n  query GetAvailableShows($filterCharacter: String) {\n    availableShows(filterCharacter: $filterCharacter) {\n      name\n      count\n    }\n  }\n": types.GetAvailableShowsDocument,
    "\n  query GetAvailableCharacters($filterShow: String) {\n    availableCharacters(filterShow: $filterShow) {\n      name\n      count\n    }\n  }\n": types.GetAvailableCharactersDocument,
    "\n  query GetVideoClipDetail($id: String!) {\n    videoClip(id: $id) {\n      id\n      name\n      description\n      userId\n      userEmail\n      videoUrl\n      thumbnailUrl\n      script\n      duration\n      characters\n      tags\n      source {\n        ... on ShowSource {\n          title\n          airDate\n          season\n          episode\n          start\n          end\n        }\n        ... on MovieSource {\n          title\n          releaseDate\n          start\n          end\n        }\n      }\n      createdAt\n      updatedAt\n      updatedBy\n    }\n  }\n": types.GetVideoClipDetailDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateVideoClip($input: CreateVideoClipInput!) {\n    createVideoClip(input: $input) {\n      id\n      name\n      description\n      userId\n      createdAt\n    }\n  }\n"): (typeof documents)["\n  mutation CreateVideoClip($input: CreateVideoClipInput!) {\n    createVideoClip(input: $input) {\n      id\n      name\n      description\n      userId\n      createdAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation GenerateUploadUrl($fileName: String!, $contentType: String!) {\n    generateUploadUrl(fileName: $fileName, contentType: $contentType) {\n      uploadUrl\n      s3Key\n      videoUrl\n    }\n  }\n"): (typeof documents)["\n  mutation GenerateUploadUrl($fileName: String!, $contentType: String!) {\n    generateUploadUrl(fileName: $fileName, contentType: $contentType) {\n      uploadUrl\n      s3Key\n      videoUrl\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetVideoClip($id: String!) {\n    videoClip(id: $id) {\n      id\n      name\n      description\n      userId\n      userEmail\n      videoUrl\n      thumbnailUrl\n      script\n      duration\n      characters\n      tags\n      source {\n        ... on ShowSource {\n          title\n          airDate\n          season\n          episode\n          start\n          end\n        }\n        ... on MovieSource {\n          title\n          releaseDate\n          start\n          end\n        }\n      }\n      createdAt\n      updatedAt\n      updatedBy\n    }\n  }\n"): (typeof documents)["\n  query GetVideoClip($id: String!) {\n    videoClip(id: $id) {\n      id\n      name\n      description\n      userId\n      userEmail\n      videoUrl\n      thumbnailUrl\n      script\n      duration\n      characters\n      tags\n      source {\n        ... on ShowSource {\n          title\n          airDate\n          season\n          episode\n          start\n          end\n        }\n        ... on MovieSource {\n          title\n          releaseDate\n          start\n          end\n        }\n      }\n      createdAt\n      updatedAt\n      updatedBy\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateVideoClip($input: UpdateVideoClipInput!) {\n    updateVideoClip(input: $input) {\n      id\n      name\n      description\n      script\n      duration\n      characters\n      tags\n      source {\n        ... on ShowSource {\n          title\n          airDate\n          season\n          episode\n          start\n          end\n        }\n        ... on MovieSource {\n          title\n          releaseDate\n          start\n          end\n        }\n      }\n      updatedAt\n      updatedBy\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateVideoClip($input: UpdateVideoClipInput!) {\n    updateVideoClip(input: $input) {\n      id\n      name\n      description\n      script\n      duration\n      characters\n      tags\n      source {\n        ... on ShowSource {\n          title\n          airDate\n          season\n          episode\n          start\n          end\n        }\n        ... on MovieSource {\n          title\n          releaseDate\n          start\n          end\n        }\n      }\n      updatedAt\n      updatedBy\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetVideoClips($searchQuery: String, $offset: Int, $limit: Int, $sortBy: String, $filterShow: String, $filterCharacter: String) {\n    videoClips(searchQuery: $searchQuery, offset: $offset, limit: $limit, sortBy: $sortBy, filterShow: $filterShow, filterCharacter: $filterCharacter) {\n      id\n      name\n      description\n      userId\n      userEmail\n      videoUrl\n      shareUrl\n      thumbnailUrl\n      blurhash\n      createdAt\n      source {\n        ... on ShowSource {\n          title\n          season\n          episode\n        }\n        ... on MovieSource {\n          title\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetVideoClips($searchQuery: String, $offset: Int, $limit: Int, $sortBy: String, $filterShow: String, $filterCharacter: String) {\n    videoClips(searchQuery: $searchQuery, offset: $offset, limit: $limit, sortBy: $sortBy, filterShow: $filterShow, filterCharacter: $filterCharacter) {\n      id\n      name\n      description\n      userId\n      userEmail\n      videoUrl\n      shareUrl\n      thumbnailUrl\n      blurhash\n      createdAt\n      source {\n        ... on ShowSource {\n          title\n          season\n          episode\n        }\n        ... on MovieSource {\n          title\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetAvailableShows($filterCharacter: String) {\n    availableShows(filterCharacter: $filterCharacter) {\n      name\n      count\n    }\n  }\n"): (typeof documents)["\n  query GetAvailableShows($filterCharacter: String) {\n    availableShows(filterCharacter: $filterCharacter) {\n      name\n      count\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetAvailableCharacters($filterShow: String) {\n    availableCharacters(filterShow: $filterShow) {\n      name\n      count\n    }\n  }\n"): (typeof documents)["\n  query GetAvailableCharacters($filterShow: String) {\n    availableCharacters(filterShow: $filterShow) {\n      name\n      count\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetVideoClipDetail($id: String!) {\n    videoClip(id: $id) {\n      id\n      name\n      description\n      userId\n      userEmail\n      videoUrl\n      thumbnailUrl\n      script\n      duration\n      characters\n      tags\n      source {\n        ... on ShowSource {\n          title\n          airDate\n          season\n          episode\n          start\n          end\n        }\n        ... on MovieSource {\n          title\n          releaseDate\n          start\n          end\n        }\n      }\n      createdAt\n      updatedAt\n      updatedBy\n    }\n  }\n"): (typeof documents)["\n  query GetVideoClipDetail($id: String!) {\n    videoClip(id: $id) {\n      id\n      name\n      description\n      userId\n      userEmail\n      videoUrl\n      thumbnailUrl\n      script\n      duration\n      characters\n      tags\n      source {\n        ... on ShowSource {\n          title\n          airDate\n          season\n          episode\n          start\n          end\n        }\n        ... on MovieSource {\n          title\n          releaseDate\n          start\n          end\n        }\n      }\n      createdAt\n      updatedAt\n      updatedBy\n    }\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;