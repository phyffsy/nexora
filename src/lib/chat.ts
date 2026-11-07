import { supabase } from './supabase'
import type { Profile, Message } from '../types'

export async function findPeople(term: string): Promise<Profile[]> {
  const q = term.trim().replace(/[%_,()]/g, '')
  if (q.length < 2) return []
  const { data, error } = await supabase.from('profiles').select('id,username,display_name,avatar_url,bio').or('username.ilike.%' + q + '%,display_name.ilike.%' + q + '%').limit(15)
  if (error) throw error
  return data ?? []
}
export async function startConversation(otherId: string): Promise<string> {
  const { data, error } = await supabase.rpc('create_direct_conversation', { other_user: otherId })
  if (error) throw error
  return data as string
}
export async function loadMessages(conversationId: string, before?: string): Promise<Message[]> {
  let query = supabase.from('messages').select('id,conversation_id,sender_id,body,created_at,edited_at,deleted_at').eq('conversation_id', conversationId).order('created_at', { ascending: false }).limit(40)
  if (before) query = query.lt('created_at', before)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []).reverse()
}
export async function sendMessage(conversationId: string, body: string) {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error('Sessão expirada')
  const { error } = await supabase.from('messages').insert({ conversation_id: conversationId, sender_id: auth.user.id, body: body.trim() })
  if (error) throw error
}
