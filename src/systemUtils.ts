import { exec } from "node:child_process";
import { promisify } from "node:util";
import { platform } from "node:os";

const execAsync = promisify(exec);

export interface SystemUtils {
  playMusic(): Promise<void>;
  pauseMusic(): Promise<void>;
  stopMusic(): Promise<void>;
  playBeep(beepFilePath: string): Promise<void>;
}

class WindowsSystemUtils implements SystemUtils {
  async playMusic(): Promise<void> {
    try {
      // Usa PowerShell para controlar reprodução de mídia no Windows
      await execAsync(`powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('{MEDIA_PLAY_PAUSE}')"`);
    } catch (error) {
      console.warn('Não foi possível controlar a reprodução de música no Windows');
    }
  }

  async pauseMusic(): Promise<void> {
    try {
      // Usa PowerShell para pausar mídia no Windows
      await execAsync(`powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('{MEDIA_PLAY_PAUSE}')"`);
    } catch (error) {
      console.warn('Não foi possível pausar a música no Windows');
    }
  }

  async stopMusic(): Promise<void> {
    try {
      // Usa PowerShell para parar mídia no Windows
      await execAsync(`powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('{MEDIA_STOP}')"`);
    } catch (error) {
      console.warn('Não foi possível parar a música no Windows');
    }
  }

  async playBeep(beepFilePath: string): Promise<void> {
    try {
      // Usa PowerShell para reproduzir áudio no Windows
      await execAsync(`powershell -Command "Add-Type -AssemblyName presentationCore; (New-Object Media.SoundPlayer '${beepFilePath}').PlaySync()"`);
    } catch (error) {
      // Fallback para beep do sistema
      try {
        await execAsync('powershell -Command "[console]::beep(800,500)"');
      } catch (fallbackError) {
        console.warn('Não foi possível reproduzir o som de notificação');
      }
    }
  }
}

class LinuxSystemUtils implements SystemUtils {
  private playerctlAvailable: boolean = false;

  constructor() {
    this.checkPlayerctl();
  }

  private async checkPlayerctl(): Promise<void> {
    try {
      await execAsync('playerctl --version');
      this.playerctlAvailable = true;
    } catch {
      this.playerctlAvailable = false;
    }
  }

  async playMusic(): Promise<void> {
    if (this.playerctlAvailable) {
      try {
        await execAsync('playerctl play');
      } catch (error) {
        console.warn('Não foi possível iniciar a reprodução de música');
      }
    }
  }

  async pauseMusic(): Promise<void> {
    if (this.playerctlAvailable) {
      try {
        await execAsync('playerctl pause');
      } catch (error) {
        console.warn('Não foi possível pausar a música');
      }
    }
  }

  async stopMusic(): Promise<void> {
    if (this.playerctlAvailable) {
      try {
        await execAsync('playerctl stop');
      } catch (error) {
        console.warn('Não foi possível parar a música');
      }
    }
  }

  async playBeep(beepFilePath: string): Promise<void> {
    try {
      // Tenta usar paplay primeiro
      await execAsync(`paplay "${beepFilePath}"`);
    } catch {
      try {
        // Fallback para aplay
        await execAsync(`aplay "${beepFilePath}"`);
      } catch {
        try {
          // Fallback para mpv
          await execAsync(`mpv --no-video --volume=50 "${beepFilePath}"`);
        } catch {
          try {
            // Fallback para ffplay
            await execAsync(`ffplay -nodisp -autoexit -volume 50 "${beepFilePath}"`);
          } catch {
            console.warn('Não foi possível reproduzir o som de notificação');
          }
        }
      }
    }
  }
}

class MacOSSystemUtils implements SystemUtils {
  async playMusic(): Promise<void> {
    try {
      // Usa AppleScript para controlar iTunes/Music
      await execAsync(`osascript -e 'tell application "Music" to play'`);
    } catch (error) {
      try {
        // Fallback para Spotify
        await execAsync(`osascript -e 'tell application "Spotify" to play'`);
      } catch (fallbackError) {
        console.warn('Não foi possível controlar a reprodução de música no macOS');
      }
    }
  }

  async pauseMusic(): Promise<void> {
    try {
      // Usa AppleScript para pausar iTunes/Music
      await execAsync(`osascript -e 'tell application "Music" to pause'`);
    } catch (error) {
      try {
        // Fallback para Spotify
        await execAsync(`osascript -e 'tell application "Spotify" to pause'`);
      } catch (fallbackError) {
        console.warn('Não foi possível pausar a música no macOS');
      }
    }
  }

  async stopMusic(): Promise<void> {
    try {
      // Usa AppleScript para parar iTunes/Music
      await execAsync(`osascript -e 'tell application "Music" to stop'`);
    } catch (error) {
      try {
        // Fallback para Spotify
        await execAsync(`osascript -e 'tell application "Spotify" to pause'`);
      } catch (fallbackError) {
        console.warn('Não foi possível parar a música no macOS');
      }
    }
  }

  async playBeep(beepFilePath: string): Promise<void> {
    try {
      // Usa afplay para reproduzir áudio no macOS
      await execAsync(`afplay "${beepFilePath}"`);
    } catch (error) {
      try {
        // Fallback para say (texto para fala)
        await execAsync('say "Pomodoro finalizado"');
      } catch (fallbackError) {
        console.warn('Não foi possível reproduzir o som de notificação');
      }
    }
  }
}

export function createSystemUtils(): SystemUtils {
  const currentPlatform = platform();

  switch (currentPlatform) {
    case 'win32':
      return new WindowsSystemUtils();
    case 'linux':
      return new LinuxSystemUtils();
    case 'darwin':
      return new MacOSSystemUtils();
    default:
      console.warn(`Sistema operacional não suportado oficialmente: ${currentPlatform}`);
      // Fallback para Linux
      return new LinuxSystemUtils();
  }
}
