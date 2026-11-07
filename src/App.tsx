import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import { AuthScreen } from './components/AuthScreen'
import { ChatScreen } from './components/ChatScreen'

export default function App() {
 const [session,setSession] = useState<Session|null>(null)
 const [loading,setLoading] = useState(true)
 useEffect(()=>{
  supabase.auth.getSession().then(({data})=>{setSession(data.session);setLoading(false)}).catch(()=>setLoading(false))
  const {data:{subscription}} = supabase.auth.onAuthStateChange((_event,s)=>setSession(s))
  return ()=>subscription.unsubscribe()
 },[])
 if(loading)return <div className="splash">NEXORA <span>Chat</span></div>
 return session ? <ChatScreen session={session}/> : <AuthScreen/>
}
