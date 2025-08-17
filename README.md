# 🍅 Pomodoro Timer com Controle de Música

Um timer Pomodoro simples e eficiente que controla automaticamente a música do seu PC durante os ciclos de trabalho e descanso.

## 💡 Motivação

Eu queria usar um pomodoro simples que tivesse controle da música (tocasse música no tempo de trabalho e parasse no tempo de descanso), mas não queria baixar nenhum aplicativo. Abri um vídeo no YouTube de pomodoro, mas tive muito anúncio, então resolvi fazer o meu próprio pomodoro com controle de música do PC.

## ✨ Características

- ⏰ **Timer Pomodoro**: Ciclos de trabalho (25min) e descanso (5min)
- 🎵 **Controle automático de música**:
  - ▶️ Toca música durante o trabalho
  - ⏸️ Pausa música durante o descanso
- 📱 **Interface simples**: Interface de terminal limpa e intuitiva
- 📊 **Contador de ciclos**: Acompanhe quantos pomodoros você completou

## 🔧 Dependências

O programa requer as seguintes dependências do sistema:

### Ubuntu/Debian:

```bash
sudo apt install playerctl pulseaudio-utils
```

## 🚀 Instalação e Uso

### Método 1: Executável Pré-compilado (Recomendado)

1. **Baixe o executável** (quando disponível):

```bash
# Baixe o arquivo pomodoro-linux
chmod +x pomodoro-linux
./pomodoro-linux
```

### Método 2: Compilar do Código

1. **Clone o repositório**:

```bash
git clone <url-do-repositorio>
cd pomodoro
```

2. **Instale as dependências do Node.js**:

```bash
yarn install
```

3. **Compile o projeto**:

```bash
yarn run build
```

4. **Execute o programa**:

```bash
yarn start
```

### Método 3: Gerar Executável

Para criar um executável standalone:

```bash
# Gerar executável para Linux
yarn run package

# Gerar para múltiplas plataformas
yarn run package-all
```

## 🎮 Como Usar

### Controles:

- **Espaço**: Play/Pause do timer
- **R**: Reiniciar ciclo atual
- **Q/Esc**: Sair do programa

### Fluxo de Uso:

1. Execute o programa
2. Inicie sua música favorita no seu player (Spotify, YouTube, etc.)
3. Pressione **Espaço** para iniciar o timer
4. O programa automaticamente:
   - ▶️ Mantém a música tocando durante o trabalho (25min)
   - ⏸️ Pausa a música durante o descanso (5min)
   - 🔔 Toca um beep ao trocar de estado
   - 🔄 Alterna automaticamente entre trabalho e descanso

**🍅 Bom Pomodoro!**
Mantenha o foco e seja produtivo! 🚀
