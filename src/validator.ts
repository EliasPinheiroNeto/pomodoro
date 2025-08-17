import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export async function validateDependencies(): Promise<boolean> {
  const dependencies = [
    { cmd: 'playerctl --version', name: 'playerctl' },
    { cmd: 'paplay --version', name: 'paplay (pulseaudio-utils)' }
  ];

  console.log('🔍 Verificando dependências...');

  for (const dep of dependencies) {
    try {
      await execAsync(dep.cmd);
    } catch {
      console.error(`❌ Dependência não encontrada: ${dep.name}`);
      console.error(`\nPara instalar as dependências no Ubuntu/Debian:`);
      console.error(`sudo apt install playerctl pulseaudio-utils`);
      return false;
    }
  }

  console.log('✅ Todas as dependências encontradas!');
  console.log('🍅 Iniciando Pomodoro Timer...\n');
  return true;
}
