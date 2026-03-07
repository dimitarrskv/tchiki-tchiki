import { ReactNode } from 'react';

export function MobileShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex flex-col items-center"
      style={{ height: '100dvh' }}
    >
      <div className="w-full max-w-md px-4 py-4 flex flex-col flex-1 min-h-0">
        {children}
      </div>
    </div>
  );
}
