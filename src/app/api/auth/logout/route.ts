import { cookies } from 'next/headers';
import { apiSuccess } from '@/lib/api-response';

export async function POST(): Promise<Response> {
  const cookieStore = await cookies();
  cookieStore.delete('token');
  return apiSuccess({ loggedOut: true });
}
