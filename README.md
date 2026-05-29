### UPDATE 29/05/2026

O projeto foi desenvolvido com vibe coding visto ao curto espaço de tempo de 4 dias para participar da abertura do festival de avistamento de baleias de Arraial do Cabo, porém devido ao curto espaço de tempo e as limitações técnicas o jogo ficou incompleto e está sendo arquivo, talvez futuramente sendo reaberto para estudo.

# 🐋 Whale Doom: Operação Ressurgência 🚀

[![Next.js](https://img.shields.io/badge/Next.js-16.2.6-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.4-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-r184-black?style=for-the-badge&logo=three.js)](https://threejs.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-blue?style=for-the-badge&logo=docker)](https://www.docker.com/)

Um jogo **3D em primeira pessoa (FPV)** de navegação e combate à poluição marinha rodando 100% no navegador. Inspirado esteticamente na ação frenética e HUD clássico de *Doom*, o jogo é ambientado nas profundezas reais de **Arraial do Cabo, RJ**, onde você controla uma baleia em sua jornada de ressurgência das fossas oceânicas até as águas rasas e cristalinas da costa brasileira.

---

## 🌊 Visão Geral do Jogo

Em **Whale Doom: Operação Ressurgência**, o jogador assume o papel de **Whale**, uma baleia que desperta no Mar Aberto profundo e precisa subir em direção à superfície. O caminho (trajetória linear no eixo Z negativo) é tomado por detritos industriais e poluição acumulada. Armado com um **Canhão de Bolhas de Alta Pressão**, seu objetivo é destruir a poluição e neutralizar ameaças ecológicas enquanto navega por cânions estreitos e correntes marinhas desafiadoras.

---

## 🎮 Como Jogar

1. Entre no jogo e clique em **INICIAR MISSÃO** para liberar a câmera e travar o mouse (Pointer Lock).
2. Utilize o mouse para direcionar a mira em 360° e nadar em qualquer direção 3D.
3. Destrua os lixos acumulados usando suas bolhas antes que colidam com você.

### 🕹️ Controles

* **Movimentação 3D:**
  * <kbd>W</kbd> / <kbd>S</kbd> / <kbd>A</kbd> / <kbd>D</kbd> (ou setas): Nadar para Frente, Trás, Esquerda e Direita.
  * <kbd>Espaço</kbd>: Subir (Nadar verticalmente para cima).
  * <kbd>Shift</kbd>: Descer (Nadar verticalmente para baixo).
* **Ataque:**
  * <kbd>Clique Esquerdo</kbd>: Disparar Canhão de Bolhas de Alta Pressão.
* **Menu e Mira:**
  * <kbd>ESC</kbd>: Pausa o jogo e libera o cursor do mouse.
  * **Toque na Tela:** Reativa a mira travada e retoma a ação.

### ⚠️ Regras e Elementos de Jogo

* **Vidas (Casco):** Você inicia com **3 vidas**. Colidir com detritos de poluição ou manchas de óleo causa 1 de dano e concede invulnerabilidade temporária (1.5s).
* **Detritos (Inimigos):**
  * **Barril Tóxico 🛢️:** Cilindros industriais amarelos brilhantes.
  * **Saco Plástico 🛍️:** Blobs translúcidos roxos flutuantes.
  * **Sucata Metálica 🔩:** Blocos vermelhos de ferro enferrujado oxidado.
  * **Manchas de Óleo 🛢️:** Fluidos viscosos escuros e densos na água.
* **Pontuação:** Cada detrito destruído com sucesso pelas bolhas adiciona **+150 pontos** ao seu score.
* **Vitória:** Alcance o antigo Portal de Chegada de Basalto na Seção 4 (Z ≤ -1980) para concluir a Operação Ressurgência.

---

## 🗺️ As 4 Seções Geográficas do Percurso

O mapa é uma rampa submarina contínua e inclinada com elevação diagonal progressiva (incline slope de `0.22` no eixo Y):

1. **Seção 1 — Mar Aberto (Z: 0 a -450 | Y ≈ -35):**
   * Transição inicial de Cabo Frio. Chão arenoso escuro com feixes de luz solar senoidais filtrados (cáusticas dinâmicas).
2. **Seção 2 — Paredões do Pontal (Z: -450 a -1000 | Y ≈ 120):**
   * Um cânion rochoso estreito (`allowedWidth = 40`) cercado por duas imensas paredes de pedra contínuas e acidentadas. Requer controle preciso com colisores de caixa dinâmicos que previnem quinas invisíveis.
3. **Seção 3 — Estreito do Boqueirão (Z: -1000 a -1600 | Y ≈ 246):**
   * Desfiladeiro vulcânico estreitíssimo (`allowedWidth = 24`) composto por colunas de basalto hexagonal e arcos de rocha. Apresenta **Correntes Oceânicas Horizontais** dinâmicas que empurram o jogador lateralmente.
4. **Seção 4 — Arraial do Cabo (Z: -1600 a -2000 | Y ≈ 361):**
   * Santuário ecológico de águas rasas, quentes e totalmente livre de poluição. Contém formações de coral, o histórico **Naufrágio do Vapor Harlingen (1906)** e o Portal de Basalto.

---

## 🛠️ Stack de Tecnologias

* **Framework Web:** Next.js 16 (App Router) & React 19.
* **Motor 3D & WebGL:** Three.js via `@react-three/fiber` (R3F) & `@react-three/drei`.
* **Materiais & Shaders Customizados (GLSL):**
  * `SeabedMaterial`: Ondulações de dunas de areia procedurais dinâmicas com ruído de Perlin tridimensional e transição cromática mud -> gold.
  * `RockMaterial`: Veias de sedimentos e sombreamento de oclusão de frestas (Crevice AO) nas formações rochosas.
  * `OilSlickMaterial`: Textura preta viscosa com brilho de Fresnel escuro e ondas.
  * `CausticsMaterial`: Projeção senoidal animada de cáusticas solares no mar profundo.
* **Gerenciamento de Estado:** Zustand (sincronização de alta performance sem Context API entre WebGL e HUD DOM).
* **Estilização:** TailwindCSS (v4) para o HUD futurista em vidro (Glassmorphism).

---

## 📂 Estrutura de Pastas do Jogo

```text
whale-doom-operacao-ressurgencia/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Metadados de SEO, fontes Google (Orbitron/Outfit) e root HTML
│   │   ├── page.tsx            # HUD overlay (vidas, score, radar de ameaças, controles virtuais)
│   │   └── globals.css         # Efeitos glassmorphic, neons e animações
│   ├── components/
│   │   └── 3d/
│   │       ├── GameCanvas.tsx      # Canvas R3F com sombras de alta performance e FOV dinâmico
│   │       ├── GameScene.tsx       # Luzes direcionais/ambiente e névoa volumétrica dinâmica
│   │       ├── FPSControls.tsx     # Física de natação 3D, correntes marinhas e caixa de colisões
│   │       ├── RouteScenario.tsx   # Paredões do Pontal, Colunas do Boqueirão e Naufrágio 3D
│   │       ├── FloatingObjects.tsx # Processamento procedural de lixos e manchas de óleo
│   │       ├── Particles.tsx       # Plânctons bioluminescentes (10k+ partículas fluidas)
│   │       ├── GuidingSchool.tsx   # Cardume instanciado de peixes (InstancedMesh) seguindo splines
│   │       └── materials/
│   │           └── CustomShaders.ts # Compilação dinâmica de shaders customizados GLSL
│   └── store/
│       ├── useGameStore.ts         # Estado e lógica reativa do jogo
│       └── useEnvironmentStore.ts  # Partição espacial em Z para colisões de alto desempenho (<1ms)
```

---

## 🚀 Inicialização e Execução

### Via Docker (Recomendado)

O projeto está totalmente containerizado e pré-configurado para desenvolvimento com hot-reload automático na porta **3000**:

```bash
# Subir o ambiente em segundo plano (build inicial + download de dependências)
docker-compose up -d --build

# Parar o container e limpar os volumes temporários
docker-compose down -v
```

O container utiliza cache inteligente de volumes para `node_modules` e `.next`, garantindo que compilações no Windows/WSL ocorram de maneira extremamente rápida.

### Desenvolvimento Local

Caso prefira rodar diretamente na sua máquina host (requer Node.js 20+ instalado):

```bash
# Instalar dependências (legacy-peer-deps ativa para compatibilidade R3F com React 19)
npm install --legacy-peer-deps

# Iniciar servidor de desenvolvimento (Turbopack ativo)
npm run dev

# Checagem de tipos do TypeScript
npx tsc --noEmit

# Criar build de produção
npm run build
```

---

## 📜 Licença

Este projeto está sob a licença MIT. Desenvolvido com amor para conscientização ambiental e diversão gamer. 🌊🐳
