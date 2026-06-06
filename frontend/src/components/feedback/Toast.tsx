import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import styles from './Toast.module.css';

type ToastFn = (message: string) => void;
const ToastCtx = createContext<ToastFn>(() => {});

export function useToast() {
  return useContext(ToastCtx);
}

interface T {
  id: number;
  message: string;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<T[]>([]);
  const counter = useRef(0);

  const toast = useCallback((message: string) => {
    const id = ++counter.current;
    setToasts((cur) => [...cur, { id, message }]);
    setTimeout(
      () => setToasts((cur) => cur.filter((t) => t.id !== id)),
      2800,
    );
  }, []);

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className={styles.container}>
        {toasts.map((t) => (
          <div key={t.id} className={styles.toast}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
