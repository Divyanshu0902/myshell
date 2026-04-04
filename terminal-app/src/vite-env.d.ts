/// <reference types="vite/client" />

interface ShellExitPayload {
  code: number | null;
  signal: string | null;
}

interface TerminalAppApi {
  startShell: () => Promise<{ ok: boolean; shellPath: string; cwd: string; reused: boolean }>;
  writeToShell: (data: string) => Promise<{ ok: boolean }>;
  stopShell: () => Promise<{ ok: boolean }>;
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<{ isMaximized: boolean }>;
  closeWindow: () => Promise<void>;
  onShellData: (callback: (payload: string) => void) => () => void;
  onShellCwd: (callback: (payload: { cwd: string }) => void) => () => void;
  onShellExit: (callback: (payload: ShellExitPayload) => void) => () => void;
  onShellError: (callback: (payload: { message: string }) => void) => () => void;
}

declare global {
  interface Window {
    terminalApp: TerminalAppApi;
  }
}
