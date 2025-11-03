/* eslint-disable */
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = T | null | undefined;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type CharacterWithCount = {
  __typename?: 'CharacterWithCount';
  count: Scalars['Int']['output'];
  name: Scalars['String']['output'];
};

export type CreateVideoClipInput = {
  blurhash?: InputMaybe<Scalars['String']['input']>;
  characters?: InputMaybe<Array<Scalars['String']['input']>>;
  description?: InputMaybe<Scalars['String']['input']>;
  duration?: InputMaybe<Scalars['Float']['input']>;
  name: Scalars['String']['input'];
  s3Key?: InputMaybe<Scalars['String']['input']>;
  script?: InputMaybe<Scalars['String']['input']>;
  source?: InputMaybe<VideoClipSourceInput>;
  tags?: InputMaybe<Array<Scalars['String']['input']>>;
  thumbnailUrl?: InputMaybe<Scalars['String']['input']>;
  videoUrl?: InputMaybe<Scalars['String']['input']>;
};

export type MovieSource = {
  __typename?: 'MovieSource';
  end?: Maybe<Scalars['Float']['output']>;
  releaseDate?: Maybe<Scalars['String']['output']>;
  start?: Maybe<Scalars['Float']['output']>;
  title: Scalars['String']['output'];
};

export type MovieSourceInput = {
  end?: InputMaybe<Scalars['Float']['input']>;
  releaseDate?: InputMaybe<Scalars['String']['input']>;
  start?: InputMaybe<Scalars['Float']['input']>;
  title: Scalars['String']['input'];
};

export type Mutation = {
  __typename?: 'Mutation';
  createVideoClip: VideoClip;
  generateUploadUrl: PresignedUrlResponse;
  updateVideoClip: VideoClip;
};


export type MutationCreateVideoClipArgs = {
  input: CreateVideoClipInput;
};


export type MutationGenerateUploadUrlArgs = {
  contentType: Scalars['String']['input'];
  fileName: Scalars['String']['input'];
  thumbnailContentType?: InputMaybe<Scalars['String']['input']>;
  thumbnailFileName?: InputMaybe<Scalars['String']['input']>;
};


export type MutationUpdateVideoClipArgs = {
  input: UpdateVideoClipInput;
};

export type PresignedUrlResponse = {
  __typename?: 'PresignedUrlResponse';
  s3Key: Scalars['String']['output'];
  thumbnailS3Key?: Maybe<Scalars['String']['output']>;
  thumbnailUploadUrl?: Maybe<Scalars['String']['output']>;
  thumbnailUrl?: Maybe<Scalars['String']['output']>;
  uploadUrl: Scalars['String']['output'];
  videoUrl: Scalars['String']['output'];
};

export type Query = {
  __typename?: 'Query';
  availableCharacters: Array<CharacterWithCount>;
  availableShows: Array<ShowWithCount>;
  hello: Scalars['String']['output'];
  myVideoClips: Array<VideoClip>;
  videoClip?: Maybe<VideoClip>;
  videoClips: Array<VideoClip>;
};


export type QueryAvailableCharactersArgs = {
  filterShow?: InputMaybe<Scalars['String']['input']>;
};


export type QueryAvailableShowsArgs = {
  filterCharacter?: InputMaybe<Scalars['String']['input']>;
};


export type QueryVideoClipArgs = {
  id: Scalars['String']['input'];
};


export type QueryVideoClipsArgs = {
  filterCharacter?: InputMaybe<Scalars['String']['input']>;
  filterShow?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  searchQuery?: InputMaybe<Scalars['String']['input']>;
  sortBy?: InputMaybe<Scalars['String']['input']>;
};

export type ShowSource = {
  __typename?: 'ShowSource';
  airDate?: Maybe<Scalars['String']['output']>;
  end?: Maybe<Scalars['Float']['output']>;
  episode?: Maybe<Scalars['Int']['output']>;
  season?: Maybe<Scalars['Int']['output']>;
  start?: Maybe<Scalars['Float']['output']>;
  title: Scalars['String']['output'];
};

export type ShowSourceInput = {
  airDate?: InputMaybe<Scalars['String']['input']>;
  end?: InputMaybe<Scalars['Float']['input']>;
  episode?: InputMaybe<Scalars['Int']['input']>;
  season?: InputMaybe<Scalars['Int']['input']>;
  start?: InputMaybe<Scalars['Float']['input']>;
  title: Scalars['String']['input'];
};

export type ShowWithCount = {
  __typename?: 'ShowWithCount';
  count: Scalars['Int']['output'];
  name: Scalars['String']['output'];
};

export type UpdateVideoClipInput = {
  characters?: InputMaybe<Array<Scalars['String']['input']>>;
  description?: InputMaybe<Scalars['String']['input']>;
  duration?: InputMaybe<Scalars['Float']['input']>;
  id: Scalars['String']['input'];
  script?: InputMaybe<Scalars['String']['input']>;
  shareUrl?: InputMaybe<Scalars['String']['input']>;
  source?: InputMaybe<VideoClipSourceInput>;
  tags?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type VideoClip = {
  __typename?: 'VideoClip';
  blurhash?: Maybe<Scalars['String']['output']>;
  characters?: Maybe<Array<Scalars['String']['output']>>;
  createdAt: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  duration?: Maybe<Scalars['Float']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  s3Key?: Maybe<Scalars['String']['output']>;
  script?: Maybe<Scalars['String']['output']>;
  shareUrl?: Maybe<Scalars['String']['output']>;
  source?: Maybe<VideoClipSource>;
  tags?: Maybe<Array<Scalars['String']['output']>>;
  thumbnailUrl?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['String']['output']>;
  updatedBy?: Maybe<Scalars['String']['output']>;
  userEmail: Scalars['String']['output'];
  userId: Scalars['String']['output'];
  videoUrl?: Maybe<Scalars['String']['output']>;
};

export type VideoClipSource = MovieSource | ShowSource;

export type VideoClipSourceInput = {
  movie?: InputMaybe<MovieSourceInput>;
  show?: InputMaybe<ShowSourceInput>;
};

export type CreateVideoClipMutationVariables = Exact<{
  input: CreateVideoClipInput;
}>;


export type CreateVideoClipMutation = { __typename?: 'Mutation', createVideoClip: { __typename?: 'VideoClip', id: string, name: string, description?: string | null, userId: string, createdAt: string } };

export type GenerateUploadUrlMutationVariables = Exact<{
  fileName: Scalars['String']['input'];
  contentType: Scalars['String']['input'];
}>;


export type GenerateUploadUrlMutation = { __typename?: 'Mutation', generateUploadUrl: { __typename?: 'PresignedUrlResponse', uploadUrl: string, s3Key: string, videoUrl: string } };

export type GetVideoClipQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type GetVideoClipQuery = { __typename?: 'Query', videoClip?: { __typename?: 'VideoClip', id: string, name: string, description?: string | null, userId: string, userEmail: string, videoUrl?: string | null, thumbnailUrl?: string | null, script?: string | null, duration?: number | null, characters?: Array<string> | null, tags?: Array<string> | null, createdAt: string, updatedAt?: string | null, updatedBy?: string | null, source?:
      | { __typename?: 'MovieSource', title: string, releaseDate?: string | null, start?: number | null, end?: number | null }
      | { __typename?: 'ShowSource', title: string, airDate?: string | null, season?: number | null, episode?: number | null, start?: number | null, end?: number | null }
     | null } | null };

export type UpdateVideoClipMutationVariables = Exact<{
  input: UpdateVideoClipInput;
}>;


export type UpdateVideoClipMutation = { __typename?: 'Mutation', updateVideoClip: { __typename?: 'VideoClip', id: string, name: string, description?: string | null, script?: string | null, duration?: number | null, characters?: Array<string> | null, tags?: Array<string> | null, updatedAt?: string | null, updatedBy?: string | null, source?:
      | { __typename?: 'MovieSource', title: string, releaseDate?: string | null, start?: number | null, end?: number | null }
      | { __typename?: 'ShowSource', title: string, airDate?: string | null, season?: number | null, episode?: number | null, start?: number | null, end?: number | null }
     | null } };

export type GetVideoClipsQueryVariables = Exact<{
  searchQuery?: InputMaybe<Scalars['String']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  sortBy?: InputMaybe<Scalars['String']['input']>;
  filterShow?: InputMaybe<Scalars['String']['input']>;
  filterCharacter?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetVideoClipsQuery = { __typename?: 'Query', videoClips: Array<{ __typename?: 'VideoClip', id: string, name: string, description?: string | null, userId: string, userEmail: string, videoUrl?: string | null, shareUrl?: string | null, thumbnailUrl?: string | null, blurhash?: string | null, createdAt: string, source?:
      | { __typename?: 'MovieSource', title: string }
      | { __typename?: 'ShowSource', title: string, season?: number | null, episode?: number | null }
     | null }> };

export type GetAvailableShowsQueryVariables = Exact<{
  filterCharacter?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetAvailableShowsQuery = { __typename?: 'Query', availableShows: Array<{ __typename?: 'ShowWithCount', name: string, count: number }> };

export type GetAvailableCharactersQueryVariables = Exact<{
  filterShow?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetAvailableCharactersQuery = { __typename?: 'Query', availableCharacters: Array<{ __typename?: 'CharacterWithCount', name: string, count: number }> };

export type GetVideoClipDetailQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type GetVideoClipDetailQuery = { __typename?: 'Query', videoClip?: { __typename?: 'VideoClip', id: string, name: string, description?: string | null, userId: string, userEmail: string, videoUrl?: string | null, thumbnailUrl?: string | null, script?: string | null, duration?: number | null, characters?: Array<string> | null, tags?: Array<string> | null, createdAt: string, updatedAt?: string | null, updatedBy?: string | null, source?:
      | { __typename?: 'MovieSource', title: string, releaseDate?: string | null, start?: number | null, end?: number | null }
      | { __typename?: 'ShowSource', title: string, airDate?: string | null, season?: number | null, episode?: number | null, start?: number | null, end?: number | null }
     | null } | null };


export const CreateVideoClipDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateVideoClip"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateVideoClipInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createVideoClip"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<CreateVideoClipMutation, CreateVideoClipMutationVariables>;
export const GenerateUploadUrlDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GenerateUploadUrl"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fileName"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"contentType"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"generateUploadUrl"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"fileName"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fileName"}}},{"kind":"Argument","name":{"kind":"Name","value":"contentType"},"value":{"kind":"Variable","name":{"kind":"Name","value":"contentType"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uploadUrl"}},{"kind":"Field","name":{"kind":"Name","value":"s3Key"}},{"kind":"Field","name":{"kind":"Name","value":"videoUrl"}}]}}]}}]} as unknown as DocumentNode<GenerateUploadUrlMutation, GenerateUploadUrlMutationVariables>;
export const GetVideoClipDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetVideoClip"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"videoClip"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"userEmail"}},{"kind":"Field","name":{"kind":"Name","value":"videoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"thumbnailUrl"}},{"kind":"Field","name":{"kind":"Name","value":"script"}},{"kind":"Field","name":{"kind":"Name","value":"duration"}},{"kind":"Field","name":{"kind":"Name","value":"characters"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"source"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ShowSource"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"airDate"}},{"kind":"Field","name":{"kind":"Name","value":"season"}},{"kind":"Field","name":{"kind":"Name","value":"episode"}},{"kind":"Field","name":{"kind":"Name","value":"start"}},{"kind":"Field","name":{"kind":"Name","value":"end"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MovieSource"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"releaseDate"}},{"kind":"Field","name":{"kind":"Name","value":"start"}},{"kind":"Field","name":{"kind":"Name","value":"end"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedBy"}}]}}]}}]} as unknown as DocumentNode<GetVideoClipQuery, GetVideoClipQueryVariables>;
export const UpdateVideoClipDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateVideoClip"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateVideoClipInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateVideoClip"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"script"}},{"kind":"Field","name":{"kind":"Name","value":"duration"}},{"kind":"Field","name":{"kind":"Name","value":"characters"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"source"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ShowSource"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"airDate"}},{"kind":"Field","name":{"kind":"Name","value":"season"}},{"kind":"Field","name":{"kind":"Name","value":"episode"}},{"kind":"Field","name":{"kind":"Name","value":"start"}},{"kind":"Field","name":{"kind":"Name","value":"end"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MovieSource"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"releaseDate"}},{"kind":"Field","name":{"kind":"Name","value":"start"}},{"kind":"Field","name":{"kind":"Name","value":"end"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedBy"}}]}}]}}]} as unknown as DocumentNode<UpdateVideoClipMutation, UpdateVideoClipMutationVariables>;
export const GetVideoClipsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetVideoClips"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"searchQuery"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sortBy"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filterShow"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filterCharacter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"videoClips"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"searchQuery"},"value":{"kind":"Variable","name":{"kind":"Name","value":"searchQuery"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"sortBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sortBy"}}},{"kind":"Argument","name":{"kind":"Name","value":"filterShow"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filterShow"}}},{"kind":"Argument","name":{"kind":"Name","value":"filterCharacter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filterCharacter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"userEmail"}},{"kind":"Field","name":{"kind":"Name","value":"videoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"shareUrl"}},{"kind":"Field","name":{"kind":"Name","value":"thumbnailUrl"}},{"kind":"Field","name":{"kind":"Name","value":"blurhash"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"source"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ShowSource"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"season"}},{"kind":"Field","name":{"kind":"Name","value":"episode"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MovieSource"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetVideoClipsQuery, GetVideoClipsQueryVariables>;
export const GetAvailableShowsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAvailableShows"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filterCharacter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"availableShows"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filterCharacter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filterCharacter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"count"}}]}}]}}]} as unknown as DocumentNode<GetAvailableShowsQuery, GetAvailableShowsQueryVariables>;
export const GetAvailableCharactersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAvailableCharacters"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filterShow"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"availableCharacters"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filterShow"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filterShow"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"count"}}]}}]}}]} as unknown as DocumentNode<GetAvailableCharactersQuery, GetAvailableCharactersQueryVariables>;
export const GetVideoClipDetailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetVideoClipDetail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"videoClip"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"userEmail"}},{"kind":"Field","name":{"kind":"Name","value":"videoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"thumbnailUrl"}},{"kind":"Field","name":{"kind":"Name","value":"script"}},{"kind":"Field","name":{"kind":"Name","value":"duration"}},{"kind":"Field","name":{"kind":"Name","value":"characters"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"source"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ShowSource"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"airDate"}},{"kind":"Field","name":{"kind":"Name","value":"season"}},{"kind":"Field","name":{"kind":"Name","value":"episode"}},{"kind":"Field","name":{"kind":"Name","value":"start"}},{"kind":"Field","name":{"kind":"Name","value":"end"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MovieSource"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"releaseDate"}},{"kind":"Field","name":{"kind":"Name","value":"start"}},{"kind":"Field","name":{"kind":"Name","value":"end"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedBy"}}]}}]}}]} as unknown as DocumentNode<GetVideoClipDetailQuery, GetVideoClipDetailQueryVariables>;