export type Profile = { id: string; username: string; display_name: string; avatar_url: string | null; bio: string | null }
export type Conversation = { id: string; created_at: string; updated_at: string }
export type Membership = { conversation_id: string; user_id: string }
export type Message = { id: string; conversation_id: string; sender_id: string; body: string; created_at: string; edited_at: string | null; deleted_at: string | null }
