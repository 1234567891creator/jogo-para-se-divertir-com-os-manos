import React, { useState } from 'react';
import { KeyRound, X, Check, ShieldAlert } from 'lucide-react';
import { soundEngine } from '../game/audio';

interface SecretCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SecretCodeModal: React.FC<SecretCodeModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    if (code.length < 8) {
      const next = code + digit;
      setCode(next);
      setError(false);
      soundEngine.playCollectShard();
      if (next === '847717') {
        setTimeout(() => {
          onSuccess();
          onClose();
          setCode('');
        }, 200);
      }
    }
  };

  const handleDelete = () => {
    setCode((prev) => prev.slice(0, -1));
    setError(false);
    soundEngine.playHit();
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (code === '847717') {
      onSuccess();
      onClose();
      setCode('');
    } else {
      setError(true);
      soundEngine.playDamage();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-sm rounded-2xl border-2 border-amber-500/60 bg-slate-900 p-6 shadow-2xl text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 mb-3 shadow-lg shadow-amber-500/20">
            <KeyRound className="w-6 h-6 animate-pulse" />
          </div>
          <h3 className="font-serif text-lg font-bold text-amber-300">
            Digitar Código Secreto
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Digite o código de 6 dígitos para desbloquear o Painel de Administrador
          </p>
        </div>

        {/* Code Display */}
        <div className="mb-4 flex items-center justify-center gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`h-11 w-10 rounded-lg border-2 flex items-center justify-center font-mono text-lg font-bold transition-all ${
                error
                  ? 'border-red-500 bg-red-950/40 text-red-300'
                  : code[i]
                  ? 'border-amber-400 bg-amber-950/30 text-amber-300 shadow-md shadow-amber-500/20'
                  : 'border-slate-700 bg-slate-950/60 text-slate-500'
              }`}
            >
              {code[i] || '•'}
            </div>
          ))}
        </div>

        {error && (
          <p className="text-center text-xs text-red-400 mb-3">
            Código incorreto. Dica: 847717
          </p>
        )}

        {/* Virtual Numeric Keypad for Mobile or Touch */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((btn) => {
            const isAction = btn === 'C' || btn === '⌫';
            return (
              <button
                key={btn}
                type="button"
                onClick={() => {
                  if (btn === 'C') {
                    setCode('');
                    setError(false);
                  } else if (btn === '⌫') {
                    handleDelete();
                  } else {
                    handleDigit(btn);
                  }
                }}
                className={`h-12 rounded-xl font-mono text-base font-bold transition-all active:scale-95 flex items-center justify-center ${
                  isAction
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-amber-200 border border-amber-500/30 shadow-sm'
                }`}
              >
                {btn}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => handleSubmit()}
          className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
        >
          <Check className="w-4 h-4" />
          Confirmar Código
        </button>
      </div>
    </div>
  );
};
