import { writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import blessed from "blessed";
import { validateDependencies } from "./validator";
import { BEEP } from "./beep";
import { createSystemUtils, SystemUtils } from "./systemUtils";

const POMODORO_TIME = 1500;
const BREAK_TIME = 300;

// Criar arquivo temporário de beep
const tempBeepFile = join(tmpdir(), 'pomodoro-beep.wav');

enum PomodoroState { WORK = "TRABALHO", BREAK = "INTERVALO" }

class PomodoroApp {
  private screen: blessed.Widgets.Screen;
  private mainBox: blessed.Widgets.BoxElement;
  private statusIndicator: blessed.Widgets.BoxElement;
  private commands: blessed.Widgets.BoxElement;

  private currentState = PomodoroState.WORK;
  private timeRemaining = POMODORO_TIME;
  private timerInterval?: NodeJS.Timeout;
  private isRunning = false;
  private cycleCount = 0;
  private systemUtils: SystemUtils;

  constructor() {
    this.systemUtils = createSystemUtils();

    // Criar arquivo temporário de beep
    this.createTempBeepFile();

    this.screen = blessed.screen({ smartCSR: true, title: 'Pomodoro Timer' });
    this.statusIndicator = blessed.box({
      top: 0, left: 0, width: 20, height: 3,
      content: '⏸️ PAUSADO',
      style: { fg: 'yellow' }
    });
    this.mainBox = blessed.box({
      top: 'center', left: 'center', width: 60, height: 9,
      border: { type: 'line' },
      style: { border: { fg: 'cyan' } },
      label: ' POMODORO ',
      align: 'center', valign: 'middle'
    });
    this.commands = blessed.box({
      bottom: 0, left: 0, width: '100%', height: 1,
      content: 'Espaço: play/pause | Q/Esc: sair | R: reiniciar ciclo (Não para a música)',
      style: { fg: 'gray' }
    });

    this.screen.append(this.statusIndicator);
    this.screen.append(this.mainBox);
    this.screen.append(this.commands);
    this.setupEventHandlers();
    this.updateDisplay();
  }

  private createTempBeepFile() {
    try {
      const beepBuffer = Buffer.from(BEEP, 'base64');
      writeFileSync(tempBeepFile, beepBuffer);
    } catch (error) {
      console.error('Erro ao criar arquivo temporário de beep:', error);
    }
  }

  private setupEventHandlers() {
    this.screen.key(['space'], () => this.toggleTimer());
    this.screen.key(['q', 'escape', 'C-c'], () => this.cleanup());
    this.screen.key(['r'], () => this.resetCycle());
    this.screen.render();
  }

  start() {
    this.screen.render();
  }

  private toggleTimer() {
    this.isRunning ? this.pauseTimer() : this.startTimer();
  }

  private async startTimer() {
    if (this.isRunning) return;

    this.isRunning = true;
    if (this.currentState === PomodoroState.WORK) {
      await this.systemUtils.playMusic();
    }
    this.timerInterval = setInterval(() => this.tick(), 1000);
    this.updateDisplay();
  }

  private async pauseTimer() {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = undefined;
    }
    if (this.currentState === PomodoroState.WORK) {
      await this.systemUtils.pauseMusic();
    }
    this.updateDisplay();
  }

  private async resetCycle() {
    if (this.isRunning) {
      this.isRunning = false;

      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = undefined;
      }
    }

    this.timeRemaining = POMODORO_TIME;
    this.currentState = PomodoroState.WORK;
    this.updateDisplay();
  }

  private async tick() {
    if (this.timeRemaining-- <= 0) {
      this.isRunning = false;
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = undefined;
      }
      await this.switchState();
    }
    this.updateDisplay();
  }

  private async switchState() {
    // Pausa música atual e toca beep
    if (this.currentState === PomodoroState.WORK) {
      await this.systemUtils.pauseMusic();
    }
    await this.systemUtils.playBeep(tempBeepFile);

    // Alterna estado
    if (this.currentState === PomodoroState.WORK) {
      this.currentState = PomodoroState.BREAK;
      this.timeRemaining = BREAK_TIME;
      this.cycleCount++;
    } else {
      this.currentState = PomodoroState.WORK;
      this.timeRemaining = POMODORO_TIME;
      await this.systemUtils.playMusic();
    }

    // Auto-restart timer
    this.isRunning = true;
    this.timerInterval = setInterval(() => this.tick(), 1000);
    this.updateDisplay();
  }

  private updateDisplay() {
    const minutes = Math.floor(this.timeRemaining / 60);
    const seconds = this.timeRemaining % 60;
    const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    const statusEmoji = this.isRunning ? "▶️" : "⏸️";
    const statusText = this.isRunning ? "RODANDO" : "PAUSADO";

    this.statusIndicator.setContent(`${statusEmoji} ${statusText}`);
    this.mainBox.setContent(`\n${this.currentState}\n\n${timeStr}\n\nCiclos: ${this.cycleCount}\n`);
    this.screen.render();
  }

  private cleanup() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.systemUtils.stopMusic();

    // Remover arquivo temporário
    try {
      unlinkSync(tempBeepFile);
    } catch (error) {
      // Ignora erro se arquivo não existir
    }

    setTimeout(() => process.exit(0), 200);
  }
}

async function main() {
  if (!(await validateDependencies())) {
    console.error('\n❌ Falha na validação de dependências. Programa cancelado.');
    process.exit(1);
  }

  const app = new PomodoroApp();
  app.start();
}

main().catch(console.error);