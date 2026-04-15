/**
 * useAuth sem autenticação — uso interno.
 * Retorna um usuário estático "interno" para compatibilidade com componentes existentes.
 */

export function useAuth() {
  return {
    user:    { id: 'internal', email: 'interno@contentai.local' },
    session: null,
    loading: false,
    signOut: async () => { /* no-op */ },
  }
}
