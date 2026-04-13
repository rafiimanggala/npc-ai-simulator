const GAME_EXAMPLES = {
  fsm: {
    title: 'Finite State Machine (FSM)',
    description: 'Each NPC has a fixed set of states with explicit transitions. Simple, predictable, easy to debug.',
    games: [
      {
        name: 'Pac-Man',
        year: 1980,
        usage: 'Ghost AI cycles through Scatter, Chase, and Frightened states. Each ghost has unique chase targeting.',
        highlight: 'The simplest AI pattern — still used in modern games for basic NPC behavior.',
      },
      {
        name: 'Metal Gear Solid',
        year: 1998,
        usage: 'Guard AI: Patrol → Alert → Caution → Evasion. The iconic "!" detection uses FSM state transitions.',
        highlight: 'Player can observe and exploit state transitions to plan stealth routes.',
      },
      {
        name: 'Halo: Combat Evolved',
        year: 2001,
        usage: 'Marine allies: Idle → Follow → Fight → Flee. Grunts panic (flee state) when Elite leader dies.',
        highlight: 'Morale-based state transitions create emergent group behavior from simple FSM.',
      },
    ],
    implementation: `// Core FSM pattern
const STATES = { IDLE, PATROL, CHASE, ATTACK };
let currentState = STATES.IDLE;

function update(dt) {
  switch (currentState) {
    case STATES.IDLE:
      if (canSeePlayer()) currentState = STATES.CHASE;
      if (idleTimer > 2)  currentState = STATES.PATROL;
      break;
    case STATES.CHASE:
      moveToward(player);
      if (inAttackRange()) currentState = STATES.ATTACK;
      if (!canSeePlayer()) currentState = STATES.PATROL;
      break;
  }
}`,
    keyIdea: 'One active state at a time. Transitions are condition-based. No state history.',
  },

  hfsm: {
    title: 'Hierarchical FSM (HFSM)',
    description: 'FSM with nested sub-states. Top-level states contain their own FSMs, reducing transition complexity.',
    games: [
      {
        name: 'The Sims',
        year: 2000,
        usage: 'Top: Daily Routine (Work/Home/Social). Sub: Home → Cook → Eat → Sleep. Each activity is a nested FSM.',
        highlight: 'Hierarchy makes complex daily schedules manageable without explosion of transitions.',
      },
      {
        name: "Assassin's Creed",
        year: 2007,
        usage: 'Guards: Passive (Patrol/Stand/Chat) → Suspicious (Investigate/Search) → Combat (Attack/Call Backup/Flee).',
        highlight: 'Sub-states keep behaviors organized — Combat.Attack vs Combat.Defend are separate from Passive states.',
      },
      {
        name: 'Far Cry 3',
        year: 2012,
        usage: 'Animal AI hierarchy: Alive (Foraging→Hunting→Resting→Fleeing) → Dead. Predators nest hunt sub-states.',
        highlight: 'Wildlife feels alive because each animal runs a deep hierarchy of nested behaviors.',
      },
    ],
    implementation: `// Hierarchical states use dot notation
let state = 'PASSIVE.Patrol';

function update(dt) {
  // Top-level transition overrides sub-state
  if (hearGunshot()) state = 'ALERT.Investigate';

  switch (state) {
    case 'PASSIVE.Patrol':
      followWaypoints();
      if (seesSuspiciousActivity()) state = 'ALERT.Investigate';
      break;
    case 'ALERT.Investigate':
      moveToLastKnownPos();
      if (timer > 3) state = 'PASSIVE.Patrol'; // give up
      if (confirmThreat()) state = 'COMBAT.Attack';
      break;
  }
}`,
    keyIdea: 'States within states. Top-level handles major behavior shifts, sub-states handle details.',
  },

  bt: {
    title: 'Behavior Tree (BT)',
    description: 'Tree of nodes executed top-to-bottom. Selectors try alternatives, Sequences chain requirements.',
    games: [
      {
        name: 'Halo 2',
        year: 2004,
        usage: 'Bungie pioneered BTs for enemy AI. Elites evaluate: find cover → flank → grenade → melee in priority order.',
        highlight: 'BTs replaced FSMs at Bungie — easier to author complex priority-based decisions.',
      },
      {
        name: 'Unreal Engine',
        year: '2014+',
        usage: "Epic's default AI system uses Behavior Trees. Every UE game (Fortnite, Satisfactory) builds on BTs.",
        highlight: 'Industry standard — Unreal\'s visual BT editor made BTs accessible to designers, not just programmers.',
      },
      {
        name: 'Batman: Arkham Knight',
        year: 2015,
        usage: 'Enemy groups coordinate via shared BTs: one attacks, others flank/throw objects. Boss fights use complex BTs.',
        highlight: 'BTs enable group tactics — nodes check what teammates are doing before choosing action.',
      },
    ],
    implementation: `// Behavior Tree node types
Selector([           // Try first that succeeds
  Sequence([         // All must succeed
    Condition('EnemySeen'),
    Condition('HasWeapon'),
    Selector([
      Sequence([Condition('InRange'), Action('Attack')]),
      Action('Chase'),
    ]),
  ]),
  Sequence([         // Fallback behavior
    Action('Patrol'),
  ]),
])

// Each node returns: SUCCESS, FAILURE, or RUNNING`,
    keyIdea: 'Selector = try alternatives (OR). Sequence = all must pass (AND). Evaluated every tick.',
  },

  utility: {
    title: 'Utility AI',
    description: 'Score every possible action with math curves. Highest score wins. Produces nuanced, context-sensitive behavior.',
    games: [
      {
        name: 'The Sims',
        year: 2000,
        usage: 'Every object advertises utility scores based on Sim needs. Hungry Sim scores fridge high, tired Sim scores bed high.',
        highlight: 'The canonical Utility AI example — smooth blending of priorities creates lifelike behavior.',
      },
      {
        name: 'Dragon Age: Inquisition',
        year: 2014,
        usage: 'Party AI scores: heal ally (health curve) vs attack enemy (threat curve) vs use ability (cooldown curve).',
        highlight: 'Utility curves let designers tune AI personality — aggressive warriors score Attack higher.',
      },
      {
        name: 'Killzone 2',
        year: 2009,
        usage: 'Helghast soldiers score cover positions by: distance, angle to player, flanking opportunity, squad spacing.',
        highlight: 'Utility beats BT here — evaluating 50 cover spots needs scoring, not if/else trees.',
      },
    ],
    implementation: `// Score each action, pick highest
function evaluate() {
  const scores = {};
  scores.PATROL = 0.3;  // base desire
  scores.ATTACK = healthCurve(npc.health)
                * distanceCurve(distToPlayer)
                * weaponBonus;
  scores.HEAL   = 1.0 - (npc.health / 100); // lower HP = higher score
  scores.FLEE   = npc.health < 20 ? 0.9 : 0.1;

  return highestScoringAction(scores);
}

// Response curves shape personality:
// Linear: proportional response
// Exponential: dramatic at extremes
// Logistic: smooth threshold behavior`,
    keyIdea: 'No hardcoded transitions. Every action competes on a numerical scale every frame.',
  },

  goap: {
    title: 'Goal-Oriented Action Planning (GOAP)',
    description: 'NPC has goals and actions with preconditions/effects. Planner finds cheapest action sequence automatically.',
    games: [
      {
        name: 'F.E.A.R.',
        year: 2005,
        usage: 'Soldiers plan: Goal(KillPlayer) → FindCover → FlankLeft → ThrowGrenade → Rush. Plans adapt to level layout.',
        highlight: 'Pioneered GOAP in games. Enemies felt smarter than scripted AI because plans emerge dynamically.',
      },
      {
        name: 'Shadow of Mordor',
        year: 2014,
        usage: 'Nemesis system: Captains plan revenge (Goal: DefeatPlayer) → GatherOrcs → SetAmbush → Challenge.',
        highlight: 'GOAP + procedural personalities = unique rivalries. Each captain plans differently.',
      },
      {
        name: 'Tomb Raider',
        year: 2013,
        usage: 'Enemy squads: Goal(EliminateTarget) → one flanks, one suppresses, one advances. Roles emerge from planning.',
        highlight: 'Squad tactics without scripting — each NPC independently plans the best role.',
      },
    ],
    implementation: `// Define actions with preconditions & effects
const actions = [
  { name: 'PickUpWeapon',
    preconditions: { hasWeapon: false },
    effects: { hasWeapon: true }, cost: 2 },
  { name: 'Approach',
    preconditions: { hasWeapon: true },
    effects: { inRange: true }, cost: 3 },
  { name: 'Attack',
    preconditions: { inRange: true, hasWeapon: true },
    effects: { enemyDead: true }, cost: 1 },
];

// Backward A* planner finds cheapest path:
// Goal{enemyDead} ← Attack ← Approach ← PickUpWeapon
const plan = planActions(actions, goal, worldState);`,
    keyIdea: 'Define WHAT actions do, not WHEN. The planner figures out the optimal sequence.',
  },

  pathfinding: {
    title: 'A* Pathfinding',
    description: 'Finds shortest path on a grid/graph using heuristic search. The backbone of game navigation.',
    games: [
      {
        name: 'StarCraft',
        year: 1998,
        usage: 'Unit pathfinding on tilemap. Groups of units pathfind independently, creating natural formation spreading.',
        highlight: 'A* on large maps required optimizations like hierarchical pathfinding (HPA*) for performance.',
      },
      {
        name: 'Civilization VI',
        year: 2016,
        usage: 'Turn-based movement on hex grid. A* with variable terrain costs: roads cheap, mountains impassable.',
        highlight: 'Terrain cost weighting makes units prefer roads — same A* algorithm, richer behavior.',
      },
      {
        name: 'The Legend of Zelda: BotW',
        year: 2017,
        usage: 'NavMesh-based A* for enemy and NPC movement. Enemies path around obstacles to reach Link.',
        highlight: 'Modern games use Navigation Meshes (NavMesh) instead of grids — A* works on both.',
      },
    ],
    implementation: `// A* algorithm core
function aStar(grid, start, goal) {
  const open = [start];     // nodes to explore
  const gScore = { start: 0 }; // actual cost from start
  const fScore = { start: heuristic(start, goal) };

  while (open.length > 0) {
    current = lowestFScore(open);
    if (current === goal) return reconstructPath();

    for (neighbor of getNeighbors(current)) {
      tentG = gScore[current] + moveCost(neighbor);
      if (tentG < gScore[neighbor]) {
        cameFrom[neighbor] = current;
        gScore[neighbor] = tentG;
        fScore[neighbor] = tentG + heuristic(neighbor, goal);
      }
    }
  }
}
// heuristic = Manhattan distance (grid) or Euclidean (navmesh)`,
    keyIdea: 'f(n) = g(n) + h(n). Actual cost + estimated remaining. Heuristic guides search toward goal.',
  },

  steering: {
    title: 'Steering Behaviors / Flocking',
    description: 'Craig Reynolds\' 1987 Boids algorithm. Three simple rules create emergent flocking from individual agents.',
    games: [
      {
        name: 'Half-Life 2',
        year: 2004,
        usage: 'Antlion swarms use flocking to create organic attack waves. Separation prevents clumping in doorways.',
        highlight: 'Flocking makes swarms feel alive — no two attacks look the same despite simple rules.',
      },
      {
        name: 'GTA V',
        year: 2013,
        usage: 'Pedestrians and traffic flow. Cars use steering (seek/avoid) + lane-following. Pedestrians flock on sidewalks.',
        highlight: '1000+ NPCs moving naturally — impossible with pathfinding alone, steering makes it scalable.',
      },
      {
        name: 'Total War: Warhammer',
        year: 2016,
        usage: 'Army formations: units maintain cohesion while moving. Cavalry charges use seek + separation for spread.',
        highlight: 'Formation movement = cohesion + alignment. Breaking formation = increased separation weight.',
      },
    ],
    implementation: `// Craig Reynolds' three rules per boid:
function flock(boid, neighbors) {
  // 1. SEPARATION: steer away from nearby boids
  separation = average(away_from_each_neighbor);
  // 2. ALIGNMENT: match velocity of nearby boids
  alignment = average(neighbor_velocities) - my_velocity;
  // 3. COHESION: steer toward center of nearby boids
  cohesion = steer_toward(center_of_neighbors);

  // Weighted sum produces emergent behavior
  force = separation * 2.5
        + alignment  * 1.0
        + cohesion   * 1.0;
  boid.applyForce(force);
}
// 30 boids, 3 rules each = realistic flock behavior`,
    keyIdea: 'Emergent complexity: simple local rules produce complex global patterns. No central coordinator.',
  },

  director: {
    title: 'AI Director',
    description: 'Meta-AI that controls game pacing. Monitors player stress and dynamically adjusts challenge intensity.',
    games: [
      {
        name: 'Left 4 Dead',
        year: 2008,
        usage: 'AI Director tracks player stress (health, damage taken, idle time). Spawns hordes during BUILD_UP, boss infected at PEAK, grants respite during RELAX.',
        highlight: 'The definitive AI Director. Every playthrough feels different — same map, different experience.',
      },
      {
        name: 'Resident Evil 4',
        year: 2005,
        usage: 'Dynamic Difficulty Adjustment (DDA): dying too much → fewer enemies, less damage. Dominating → more aggressive AI.',
        highlight: 'Invisible pacing — players don\'t notice the director keeping them at the edge of their skill level.',
      },
      {
        name: 'Alien: Isolation',
        year: 2014,
        usage: 'Two AIs: Director (knows player location, feeds hints to Alien) + Alien (hunts based on hints). Director controls tension curve.',
        highlight: 'Director creates cat-and-mouse pacing without the Alien ever feeling scripted.',
      },
    ],
    implementation: `// Tension cycle: BUILD_UP → PEAK → RELAX → repeat
function update(dt) {
  // Monitor player stress metrics
  tension = nearbyEnemies * 0.2
          + recentDamage * 0.3
          + (phase === 'PEAK' ? 0.3 : 0);

  // Phase transitions based on time
  if (phaseTimer > PHASE_DURATION[phase]) {
    phase = nextPhase(phase);
  }

  // Adjust spawn rate by phase
  if (spawnTimer > SPAWN_RATE[phase]) {
    spawnEnemy(); // more frequent in PEAK
  }

  // RELAX: remove distant enemies, let player breathe
  if (phase === 'RELAX') despawnFarEnemies();
}`,
    keyIdea: 'The AI doesn\'t play the game — it designs the experience in real-time.',
  },

  rl: {
    title: 'Reinforcement Learning (Q-Learning)',
    description: 'Agent learns optimal behavior through trial and error. No pre-programmed rules — behavior emerges from rewards.',
    games: [
      {
        name: 'AlphaStar (StarCraft II)',
        year: 2019,
        usage: 'DeepMind trained RL agents to play StarCraft at Grandmaster level. Learned build orders, micro, macro from scratch.',
        highlight: 'RL discovered strategies humans never considered — like non-standard unit compositions that exploit timing.',
      },
      {
        name: 'Forza Motorsport',
        year: 2005,
        usage: 'Drivatar system: RL learns YOUR driving style (braking points, cornering, aggression) to create your AI ghost.',
        highlight: 'Personal RL models — each player\'s Drivatar drives differently because it learned from their data.',
      },
      {
        name: 'OpenAI Five (Dota 2)',
        year: 2019,
        usage: 'RL agents learned teamfight coordination, item builds, map control. 45,000 years of gameplay experience.',
        highlight: 'RL scales to complex strategy — but requires massive compute for training.',
      },
    ],
    implementation: `// Q-Learning: learn value of (state, action) pairs
function step() {
  state = getCurrentState(); // e.g., grid position
  // Epsilon-greedy: explore vs exploit
  action = (random() < epsilon)
    ? randomAction()
    : bestAction(state); // argmax Q(s,a)

  // Take action, observe result
  { newState, reward, done } = environment.step(action);

  // Bellman equation update
  oldQ = Q[state][action];
  maxNextQ = max(Q[newState][all_actions]);
  Q[state][action] = oldQ + alpha * (
    reward + gamma * maxNextQ - oldQ
  );

  // Decay exploration over time
  epsilon *= 0.998;
}`,
    keyIdea: 'Q(s,a) converges to optimal policy through repeated episodes. Exploration (epsilon) decreases over time.',
  },

  llm: {
    title: 'LLM NPC (Large Language Model)',
    description: 'NPCs powered by language models for dynamic, context-aware dialogue. The frontier of game AI.',
    games: [
      {
        name: 'NVIDIA ACE',
        year: 2023,
        usage: 'Real-time NPC dialogue powered by LLMs. NPCs remember conversation history and react emotionally to player choices.',
        highlight: 'Kairos demo showed NPCs with personality, memory, and emotional state — all driven by LLMs.',
      },
      {
        name: 'Inworld AI',
        year: 2023,
        usage: 'NPC platform used by studios. Characters have goals, personality traits, knowledge bases. Used in upcoming AAA titles.',
        highlight: 'Characters stay in-character via personality constraints — won\'t break the 4th wall.',
      },
      {
        name: 'Skyrim (Mantella Mod)',
        year: 2024,
        usage: 'Community mod: every NPC gets LLM-powered voice dialogue. Ask guards about lore, bargain with merchants dynamically.',
        highlight: 'Proves LLM NPCs work TODAY — modders replaced 1000+ scripted lines with infinite dynamic conversation.',
      },
    ],
    implementation: `// LLM NPC architecture
const NPC = {
  personality: "You are Aldric, a gruff but kind guard...",
  memory: [],      // conversation history
  emotion: 'neutral', // affects behavior

  async respond(playerMessage) {
    // Build prompt with personality + memory + world state
    const prompt = buildPrompt(this.personality,
      this.memory, getWorldState());

    // LLM generates contextual response
    const response = await llm.complete(prompt + playerMessage);

    // Extract emotion from response
    this.emotion = detectEmotion(response);

    // Emotion drives NPC behavior (idle/wander/flee/chase)
    updateBehavior(this.emotion);
    return response;
  }
};
// Fallback: scripted keyword matching when LLM unavailable`,
    keyIdea: 'LLMs enable infinite dialogue variations. Emotion extraction drives gameplay behavior changes.',
  },
};

export class InfoModal {
  constructor() {
    this._currentId = null;
    this._modal = null;
    this._createModal();
  }

  _createModal() {
    this._modal = document.createElement('div');
    this._modal.className = 'info-modal hidden';
    this._modal.addEventListener('click', (e) => {
      if (e.target === this._modal) this.hide();
    });
    document.body.appendChild(this._modal);
  }

  show(techniqueId) {
    const data = GAME_EXAMPLES[techniqueId];
    if (!data) return;
    this._currentId = techniqueId;

    this._modal.innerHTML = `
      <div class="info-modal-content">
        <div class="info-modal-header">
          <h2>${data.title}</h2>
          <button class="info-modal-close">&times;</button>
        </div>
        <p class="info-modal-desc">${data.description}</p>

        <div class="info-section">
          <h3>Game Examples</h3>
          <div class="game-cards">
            ${data.games.map(g => `
              <div class="game-card">
                <div class="game-card-header">
                  <span class="game-name">${g.name}</span>
                  <span class="game-year">${g.year}</span>
                </div>
                <p class="game-usage">${g.usage}</p>
                <p class="game-highlight">${g.highlight}</p>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="info-section">
          <h3>Implementation Pattern</h3>
          <div class="info-key-idea">${data.keyIdea}</div>
          <pre class="info-code"><code>${this._escapeHtml(data.implementation)}</code></pre>
        </div>
      </div>
    `;

    this._modal.querySelector('.info-modal-close').addEventListener('click', () => this.hide());
    this._modal.classList.remove('hidden');
  }

  hide() {
    this._modal.classList.add('hidden');
  }

  _escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}
