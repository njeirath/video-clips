import { SampleResolver } from "./sample-resolver";
import { VideoClipResolver } from "./video-clip.resolver";

// Central list of all GraphQL resolvers
// Add new resolvers here to ensure they're used in both runtime and schema generation
export const resolvers = [SampleResolver, VideoClipResolver] as const;
