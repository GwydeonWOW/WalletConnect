'use client';

import { useState } from 'react';
import { useAuth } from '../../../lib/auth-context';

type Step = 'email' | 'qr' | 'code';

export default function LoginPage() {
  const { register, verifyRegistration, login, verifyLogin, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<Step>('email');
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  const handleEmailSubmit = async (action: 'register' | 'login') => {
    if (!email) return;
    setProcessing(true);
    setError(null);
    setMode(action);

    try {
      if (action === 'register') {
        const qr = await register(email);
        setQrUrl(qr);
        setStep('qr');
      } else {
        await login(email);
        setStep('code');
      }
    } catch (err: any) {
      setError(err.message || 'Failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleCodeSubmit = async () => {
    if (code.length !== 6) return;
    setProcessing(true);
    setError(null);

    try {
      if (mode === 'register') {
        await verifyRegistration(email, code);
      } else {
        await verifyLogin(email, code);
      }
    } catch (err: any) {
      setError(err.message || 'Invalid code');
    } finally {
      setProcessing(false);
    }
  };

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

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {step === 'email' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                onClick={() => handleEmailSubmit('register')}
                disabled={processing || !email}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Crear cuenta
              </button>
              <button
                onClick={() => handleEmailSubmit('login')}
                disabled={processing || !email}
                className="w-full bg-[var(--bg-secondary)] hover:bg-[var(--border)] disabled:opacity-50 text-white font-medium py-3 px-4 rounded-lg transition-colors border border-[var(--border)]"
              >
                Iniciar sesion
              </button>
            </div>
          )}

          {step === 'qr' && qrUrl && (
            <div className="space-y-4">
              <p className="text-sm text-gray-400 text-center">
                Escanea este QR con tu app de autenticacion (Authy, Google Authenticator, etc.)
              </p>
              <div className="flex justify-center">
                <img src={qrUrl} alt="QR Code" className="rounded-lg" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Codigo de verificacion</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  maxLength={6}
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-4 py-3 text-white text-center text-2xl tracking-[0.5em] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                onClick={handleCodeSubmit}
                disabled={processing || code.length !== 6}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Verificar y crear cuenta
              </button>
            </div>
          )}

          {step === 'code' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-400 text-center">
                Introduce el codigo de tu app de autenticacion
              </p>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Codigo de verificacion</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  maxLength={6}
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-4 py-3 text-white text-center text-2xl tracking-[0.5em] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                onClick={handleCodeSubmit}
                disabled={processing || code.length !== 6}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Verificar codigo
              </button>
            </div>
          )}

          {step !== 'email' && (
            <button
              onClick={() => { setStep('email'); setCode(''); setError(null); }}
              className="w-full mt-3 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Volver
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
