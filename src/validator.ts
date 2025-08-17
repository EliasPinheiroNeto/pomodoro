import { exec } from "node:child_process";
import { promisify } from "node:util";
import { platform } from "node:os";

const execAsync = promisify(exec);

interface Dependency {
  cmd: string;
  name: string;
  installInstructions: string;
  optional?: boolean;
}

export async function validateDependencies(): Promise<boolean> {
  const isWindows = platform() === 'win32';
  const isLinux = platform() === 'linux';
  const isMacOS = platform() === 'darwin';

  let dependencies: Dependency[] = [];

  if (isWindows) {
    // No Windows, vamos usar APIs nativas do Windows para controle de mídia
    // e reprodução de áudio, então não há dependências externas obrigatórias
    console.log('✅ Executando no Windows - usando APIs nativas do sistema');
    return true;
  } else if (isLinux) {
    dependencies = [
      {
        cmd: 'playerctl --version',
        name: 'playerctl',
        installInstructions: 'sudo apt install playerctl (Ubuntu/Debian) ou sudo dnf install playerctl (Fedora)',
        optional: true
      },
      {
        cmd: 'paplay --version',
        name: 'paplay (pulseaudio-utils)',
        installInstructions: 'sudo apt install pulseaudio-utils (Ubuntu/Debian) ou sudo dnf install pulseaudio-utils (Fedora)'
      }
    ];
  } else if (isMacOS) {
    dependencies = [
      {
        cmd: 'afplay -h',
        name: 'afplay',
        installInstructions: 'afplay já está incluído no macOS'
      }
    ];
  }

  let hasAllRequired = true;
  let hasOptionalWarnings = false;

  for (const dep of dependencies) {
    try {
      await execAsync(dep.cmd);
      console.log(`✅ ${dep.name} encontrado`);
    } catch {
      if (dep.optional) {
        console.warn(`⚠️  Dependência opcional não encontrada: ${dep.name}`);
        console.warn(`   Funcionalidade de controle de música não estará disponível`);
        console.warn(`   Para instalar: ${dep.installInstructions}`);
        hasOptionalWarnings = true;
      } else {
        console.error(`❌ Dependência obrigatória não encontrada: ${dep.name}`);
        console.error(`   Para instalar: ${dep.installInstructions}`);
        hasAllRequired = false;
      }
    }
  }

  if (!hasAllRequired) {
    console.error('\n❌ Algumas dependências obrigatórias não foram encontradas.');
    return false;
  }

  if (hasOptionalWarnings) {
    console.log('\n⚠️  Algumas funcionalidades opcionais podem não estar disponíveis.');
  }

  return true;
}
