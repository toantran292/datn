const API_URL = process.env.NEXT_PUBLIC_MEET_API || 'http://localhost:40600';

export interface MeetingTokenRequest {
  user_id: string;
  user_name?: string;
  subject_type: 'chat' | 'project';
  chat_id?: string;
  project_id?: string;
  room_id?: string;
}

export interface MeetingTokenResponse {
  token: string;
  room_id: string;
  meeting_id: string;
  websocket_url: string;
  ice_servers: any[];
}

export async function getMeetingToken(
  params: MeetingTokenRequest
): Promise<MeetingTokenResponse> {
  const response = await fetch(`${API_URL}/meet/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get meeting token: ${error}`);
  }

  return response.json();
}
