import React from'react'
import{Layout}from'../components/Layout'
import{RoleInspector}from'../components/RoleInspector'
import{getFacilitatorToken}from'../lib/api'

export default function FacilitatorRoleInspector(){
  if(!getFacilitatorToken())return <Layout subtitle="Inspector docente"><div className="card card-accent"><h2>Primero entra como facilitador</h2><p>El inspector se habilita después de autenticar la sesión docente.</p><a className="btn btn-primary" href="facilitator.html">Ir al facilitador</a></div></Layout>
  return <Layout subtitle="Inspector docente" actions={<a className="btn btn-ghost" href="facilitator.html">← Volver al facilitador</a>}><div className="section-title"><h2>Laboratorio de roles</h2><p>Prueba las mismas herramientas del participante sin ocupar cupos, puntuar ni escribir evidencia en Supabase.</p></div><RoleInspector/></Layout>
}
