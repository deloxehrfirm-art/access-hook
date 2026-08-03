'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ModalConfig {
  isOpen: boolean;
  title: string;
  message: string;
  type?: ToastType;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  tertiaryAction?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, title?: string, duration?: number) => void;
  showModal: (config: Omit<ModalConfig, 'isOpen'>) => void;
  closeModal: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [modal, setModal] = useState<ModalConfig>({
    isOpen: false,
    title: '',
    message: '',
  });

  const showToast = useCallback((message: string, type: ToastType = 'info', title?: string, duration = 4500) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message, duration }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showModal = useCallback((config: Omit<ModalConfig, 'isOpen'>) => {
    setModal({ ...config, isOpen: true });
  }, []);

  const closeModal = useCallback(() => {
    setModal((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, showModal, closeModal }}>
      {children}

      {/* Toast Notifications Overlay */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 max-w-md w-full pointer-events-none px-4 sm:px-0">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-2xl backdrop-blur-xl ${
                toast.type === 'success'
                  ? 'bg-[#182a23]/95 border-emerald-500/40 text-emerald-200'
                  : toast.type === 'error'
                  ? 'bg-[#2d1819]/95 border-rose-500/40 text-rose-200'
                  : toast.type === 'warning'
                  ? 'bg-[#2b2214]/95 border-amber-500/40 text-amber-200'
                  : 'bg-[#16212d]/95 border-cyan-500/40 text-cyan-200'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                {toast.type === 'error' && <XCircle className="w-5 h-5 text-rose-400" />}
                {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                {toast.type === 'info' && <Info className="w-5 h-5 text-cyan-400" />}
              </div>
              <div className="flex-1">
                {toast.title && <h4 className="font-semibold text-sm mb-0.5">{toast.title}</h4>}
                <p className="text-xs leading-relaxed text-slate-200">{toast.message}</p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-white transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Reusable Professional Modal Overlay */}
      <AnimatePresence>
        {modal.isOpen && (
          <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#1a2321] border border-white/15 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative overflow-hidden"
            >
              <button
                onClick={closeModal}
                className="absolute top-5 right-5 text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className={`p-3 rounded-2xl ${
                  modal.type === 'warning' ? 'bg-amber-500/20 text-amber-300' :
                  modal.type === 'error' ? 'bg-rose-500/20 text-rose-300' : 'bg-[#dbf0de]/20 text-[#dbf0de]'
                }`}>
                  {modal.type === 'warning' ? <AlertTriangle className="w-6 h-6" /> :
                   modal.type === 'error' ? <XCircle className="w-6 h-6" /> : <Info className="w-6 h-6" />}
                </div>
                <h3 className="text-xl font-bold text-[#dbf0de]">{modal.title}</h3>
              </div>

              <p className="text-gray-300 text-sm leading-relaxed mb-6">{modal.message}</p>

              <div className="flex flex-col sm:flex-row gap-3 justify-end">
                {modal.tertiaryAction && (
                  <button
                    onClick={() => {
                      modal.tertiaryAction?.onClick();
                      closeModal();
                    }}
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold text-gray-300 hover:bg-white/5 transition-colors border border-white/10"
                  >
                    {modal.tertiaryAction.label}
                  </button>
                )}
                {modal.secondaryAction && (
                  <button
                    onClick={() => {
                      modal.secondaryAction?.onClick();
                      closeModal();
                    }}
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold text-gray-200 bg-white/10 hover:bg-white/20 transition-colors border border-white/10"
                  >
                    {modal.secondaryAction.label}
                  </button>
                )}
                {modal.primaryAction && (
                  <button
                    onClick={() => {
                      modal.primaryAction?.onClick();
                      closeModal();
                    }}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-[#1a2321] bg-[#dbf0de] hover:bg-[#c3e4c7] transition-all hover:scale-[1.02] shadow-lg"
                  >
                    {modal.primaryAction.label}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
