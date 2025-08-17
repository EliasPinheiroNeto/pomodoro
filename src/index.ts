import { exec } from "node:child_process";
import { promisify } from "node:util";
import blessed from "blessed";
import { validateDependencies } from "./validator";

const execAsync = promisify(exec);
const POMODORO_TIME = 1500;
const BREAK_TIME = 300;

enum PomodoroState { WORK = "TRABALHO", BREAK = "INTERVALO" }

class PomodoroApp {
  private screen: blessed.Widgets.Screen;
  private mainBox: blessed.Widgets.BoxElement;
  private statusIndicator: blessed.Widgets.BoxElement;
  private currentState = PomodoroState.WORK;
  private timeRemaining = POMODORO_TIME;
  private timerInterval?: NodeJS.Timeout;
  private isRunning = false;
  private cycleCount = 0;

  constructor() {
    this.screen = blessed.screen({ smartCSR: true, title: 'Pomodoro Timer' });
    this.statusIndicator = blessed.box({
      top: 0, left: 0, width: 20, height: 3,
      content: '⏸️ PAUSADO',
      style: { fg: 'yellow' }
    });
    this.mainBox = blessed.box({
      top: 'center', left: 'center', width: 60, height: 8,
      border: { type: 'line' },
      style: { border: { fg: 'cyan' } },
      label: ' POMODORO ',
      align: 'center', valign: 'middle'
    });

    this.screen.append(this.statusIndicator);
    this.screen.append(this.mainBox);
    this.setupEventHandlers();
    this.updateDisplay();
  }

  private setupEventHandlers() {
    this.screen.key(['space'], () => this.toggleTimer());
    this.screen.key(['q', 'escape', 'C-c'], () => this.cleanup());
    this.screen.render();
  }

  private async execCommand(command: string) {
    try { await execAsync(command); } catch { }
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
      this.execCommand('playerctl play');
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
      this.execCommand('playerctl pause');
    }
    this.updateDisplay();
  }

  private async tick() {
    if (--this.timeRemaining <= 0) {
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
      await this.execCommand('playerctl pause');
    }
    await this.execCommand('paplay src/assets/beep-beep.mp3');

    // Alterna estado
    if (this.currentState === PomodoroState.WORK) {
      this.currentState = PomodoroState.BREAK;
      this.timeRemaining = BREAK_TIME;
      this.cycleCount++;
    } else {
      this.currentState = PomodoroState.WORK;
      this.timeRemaining = POMODORO_TIME;
      await this.execCommand('playerctl play');
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
    this.mainBox.setContent(`\n${this.currentState}\n\n${timeStr}\n\nCiclos: ${this.cycleCount}\n\nEspaço: play/pause | Q/Esc: sair`);
    this.screen.render();
  }

  private cleanup() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.execCommand('playerctl stop');
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