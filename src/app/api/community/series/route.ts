import { searchCommunitySeries, getCommunityEpisodes } from '@/lib/database';
import { communityId } from '@/lib/community-input';
import { communityResponse, communityFailure } from '@/lib/community-response';

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const seriesId = params.get('seriesId');
    return communityResponse(
      seriesId
        ? await getCommunityEpisodes(communityId(seriesId))
        : await searchCommunitySeries(params.get('q') ?? '')
    );
  } catch (error) {
    return communityFailure(error);
  }
}
