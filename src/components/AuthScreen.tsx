import { useState, type FormEvent } from 'react'
import { ArrowRight, AtSign, LockKeyhole, MessageCircle, Sparkles } from 'lucide-react'
import { supabase } from '../lib/supabase'

type Mode = 'login'|'signup'|'reset'
export function AuthScreen(){
 const [mode,setMode]=useState<Mode>('login'),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[name,setName]=useState(''),[busy,setBusy]=useState(false),[notice,setNotice]=useState(''),[error,setError]=useState('')
 async function submit(e:FormEvent){
  e.preventDefault();setBusy(true);setError('');setNotice('')
  try {
   if(mode==='reset'){
    const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:location.origin});if(error)throw error
    setNotice('Se o endereço estiver cadastrado, você receberá um e-mail de recuperação.')
   } else if(mode==='signup'){
    const {data,error}=await supabase.auth.signUp({email,password,options:{data:{full_name:name.trim()},emailRedirectTo:location.origin}});if(error)throw error
    if(!data.session)setNotice('Confira seu e-mail para confirmar a conta.')
   } else {
    const {error}=await supabase.auth.signInWithPassword({email,password});if(error)throw error
   }
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível continuar')}finally{setBusy(false)}
 }
 async function google(){setError('');const {error}=await supabase.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin}});if(error)setError(error.message)}
 return <main className="auth-layout"><section className="auth-intro"><div className="brand"><span className="brand-icon"><MessageCircle size={22}/></span>NEXORA <b>Chat</b></div><div className="hero-tag"><Sparkles size={15}/> A próxima geração de conversas</div><h1>Converse sem <em>limites.</em></h1><p>Um espaço para conexões reais, com uma experiência rápida, elegante e feita para você.</p><div className="hero-orb"/></section><section className="auth-panel"><div className="auth-card"><div className="eyebrow">BEM-VINDO AO NEXORA</div><h2>{mode==='signup'?'Crie sua conta':mode==='reset'?'Recuperar acesso':'Entre na sua conta'}</h2><p className="muted">{mode==='signup'?'Comece uma nova conversa.':mode==='reset'?'Enviaremos um link de recuperação.':'Suas conversas, em qualquer lugar.'}</p><form onSubmit={submit}>
 {mode==='signup'&&<label>Seu nome<input required maxLength={80} placeholder="Como podemos te chamar?" value={name} onChange={e=>setName(e.target.value)}/></label>}
 <label>E-mail<div className="input-icon"><AtSign size={17}/><input required type="email" placeholder="voce@exemplo.com" value={email} onChange={e=>setEmail(e.target.value)}/></div></label>
 {mode!=='reset'&&<label>Senha<div className="input-icon"><LockKeyhole size={17}/><input required minLength={6} type="password" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)}/></div></label>}
 {error&&<div className="feedback error" role="alert">{error}</div>}{notice&&<div className="feedback" role="status">{notice}</div>}
 <button className="primary full" disabled={busy}>{busy?'Processando...':mode==='signup'?'Criar conta':mode==='reset'?'Enviar link':'Entrar'} <ArrowRight size={17}/></button></form>
 {mode!=='reset'&&<><div className="separator">ou continue com</div><button className="secondary full" onClick={google} disabled={busy}>Google</button></>}
 <p className="auth-footer">{mode==='login'?<>Não tem conta? <button className="text-button" onClick={()=>setMode('signup')}>Cadastre-se</button></>:<button className="text-button" onClick={()=>setMode('login')}>Voltar para login</button>}</p>{mode==='login'&&<button className="text-button forgot" onClick={()=>setMode('reset')}>Esqueceu a senha?</button>}</div></section></main>
}
