'use client';

import { useAuth } from '../../../lib/auth-context';

export default function LoginPage() {
  const { register, login, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Wallet Connect</h1>
          <p className="text-gray-400 mt-2">Portfolio tracker de solo lectura</p>
        </div>

        <div className="bg-[var(--bg-card)] rounded-xl p-8 border border-[var(--border)]">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-300">
              Esta aplicacion solo leera tu direccion publica y nunca te pedira firmar ni operar.
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={register}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Crear cuenta con Passkey
            </button>

            <button
              onClick={login}
              className="w-full bg-[var(--bg-secondary)] hover:bg-[var(--border)] text-white font-medium py-3 px-4 rounded-lg transition-colors border border-[var(--border)]"
            >
              Iniciar sesion con Passkey
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
