# Whale Doom: Operação Ressurgência 🐋🚀

Um jogo 3D de navegador responsivo e dinâmico, desenvolvido com o ecossistema moderno do **React, Next.js, Three.js, React Three Fiber (R3F)** e estilizado com **TailwindCSS**.

Este repositório contém a estrutura de inicialização e o protótipo jogável da Operação Ressurgência.

---

## 🌌 Visão Geral do Jogo

Neste protótipo de exploração espacial/marítima cyberpunk, você controla a embarcação **Whale** voando através de uma fenda cósmica. Seu objetivo é navegar pelo túnel de poeira cósmica coletando **anéis de energia verdes** para aumentar sua pontuação enquanto desvia de **minas espaciais vermelhas** que danificam a integridade do escudo estrutural.

O jogo apresenta uma interface futurista e minimalista com efeitos de **glassmorfismo**, controles responsivos por teclado, partículas dinâmicas gerando sensação de velocidade no espaço, e física de rotação (*banking* lateral e inclinação vertical).

---

## 🛠️ Tecnologias Utilizadas

- **Core Framework**: [Next.js 15 (App Router)](https://nextjs.org/) & React 19
- **3D Rendering & Engine**: [Three.js](https://threejs.org/) via [@react-three/fiber (v9)](https://r3f.docs.pmnd.rs/)
- **Componentes Auxiliares 3D**: [@react-three/drei](https://github.com/pmndrs/drei) (para renderização de starfields otimizados)
- **Styling & HUD**: [TailwindCSS (v4)](https://tailwindcss.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) (compartilhamento de pontuação, vidas e boost em tempo real entre o canvas WebGL e a interface DOM)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 🕹️ Como Jogar

1. Acesse o menu principal do jogo.
2. Clique em **INICIAR MISSÃO** para ligar os motores da *Whale*.
3. Utilize os controles descritos abaixo para navegar:

### Controles
- <kbd>W</kbd> ou <kbd>↑</kbd>: Mover para Cima
- <kbd>S</kbd> ou <kbd>↓</kbd>: Mover para Baixo
- <kbd>A</kbd> ou <kbd>←</kbd>: Mover para Esquerda
- <kbd>D</kbd> ou <kbd>→</kbd>: Mover para Direita
- <kbd>ESPAÇO</kbd>: Ativar Hiper-Propulsor (Boost consumível temporário)
- Botão <kbd>Pausa</kbd> (HUD superior): Congela a simulação de voo temporal

### Regras
- **Anéis Verdes**: +100 Pontos.
- **Minas Vermelhas**: Reduz em 1 ponto a integridade de escudo. Você tem 3 pontos totais. Ao atingir 0%, a missão falha.
- **Hiper-Propulsor**: Consome o indicador de boost no canto superior direito. Ao soltar a barra de espaço, o boost se regenera lentamente.

---

## 📂 Estrutura de Pastas de Componentes

A estrutura criada está modularizada e preparada para expansão:

```text
├── src/
│   ├── app/
│   │   ├── globals.css      # Design system, fontes Google (Orbitron/Inter) e animações neon.
│   │   ├── layout.tsx       # Configurações de metadados de SEO e contêiner raiz.
│   │   └── page.tsx         # Página principal com o DOM do HUD Glassmorphic, Menus de Início e Fim.
│   ├── components/
│   │   └── 3d/
│   │       ├── FloatingObjects.tsx # Gerador procedural e detector de colisão de anéis e minas.
│   │       ├── GameCanvas.tsx      # Contêiner Canvas com WebGL shadows e câmera responsiva.
│   │       ├── GameScene.tsx       # Iluminação cyberpunk, neblina atmosférica e renderização das estrelas.
│   │       ├── Particles.tsx       # Sistema de partículas dinâmicas de poeira cósmica/bolhas.
│   │       └── Player.tsx          # Renderização 3D da Whale (motores brilhantes, cockpit) e movimentação suave.
│   ├── hooks/
│   │   └── useKeyboard.ts   # Listener otimizado para teclado (eventos keyDown/keyUp).
│   └── store/
│   │   └── useGameStore.ts  # Estado global do jogo com Zustand para controle de score, vidas e estado da partida.
```

---

## 🚀 Inicialização Local

Para rodar a aplicação em ambiente de desenvolvimento local:

1. Instale as dependências:
   ```bash
   npm install --legacy-peer-deps
   ```
2. Inicialize o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
3. Abra [http://localhost:3000](http://localhost:3000) no seu navegador.
