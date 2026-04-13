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

const GENRE_GUIDE = [
  {
    genre: 'Fighting Games',
    icon: '🥊',
    color: '#f85149',
    games: ['Street Fighter 6', 'Tekken 8', 'Guilty Gear Strive', 'Super Smash Bros.'],
    techniques: [
      { name: 'FSM', tag: 'fsm', role: 'Combo state machine — each move is a state with frame-perfect transitions. Idle → Startup → Active → Recovery → Idle.' },
      { name: 'Behavior Tree', tag: 'bt', role: 'Decision layer: evaluate distance → check frame advantage → select optimal punish or poke. Priority: anti-air > whiff punish > pressure.' },
      { name: 'RL / Neural Network', tag: 'rl', role: 'SF6 V-Rival trains neural nets on millions of ranked matches to mimic real player behavior at any skill level. PSO-based adaptive AI adjusts strategy mid-fight.' },
      { name: 'Utility AI', tag: 'utility', role: 'Score actions by frame data: if opponent whiffed a heavy → score "Punish" high. Low health → score "Defensive" high. Meter full → score "Super" higher.' },
    ],
    keyInsight: 'Fighting game AI operates on 60fps frame data. A 12-frame combo input window is ~200ms. The AI must read opponent patterns (sequence prediction) and react within 1-3 frames. Modern fighting games (SF6) use neural networks trained on real player data rather than hardcoded reaction times.',
    implementation: `// Fighting Game AI: Frame-aware decision making
function decideFighterAction(state) {
  const frameDiff = state.myRecovery - state.oppRecovery;

  if (frameDiff > 0) {
    // We're at frame DISADVANTAGE — defend
    return scoreDefensiveOptions(state);
  }
  // Frame advantage — attack
  const actions = [
    { name: 'jab',     score: 0.3, startup: 4  },
    { name: 'heavy',   score: 0.5, startup: 12 },
    { name: 'special', score: 0.7, startup: 8  },
    { name: 'super',   score: state.meter > 50 ? 0.9 : 0, startup: 5 },
  ];
  // Score by opponent distance + frame window
  actions.forEach(a => {
    a.score *= distanceCurve(state.distance, a.range);
    a.score *= frameDiff >= a.startup ? 1.2 : 0.5;
  });
  return pickHighestScore(actions);
}`,
  },
  {
    genre: 'Racing Games',
    icon: '🏎️',
    color: '#f0883e',
    games: ['Forza Motorsport', 'Gran Turismo 7', 'Mario Kart 8', 'Need for Speed'],
    techniques: [
      { name: 'A* Pathfinding', tag: 'pathfinding', role: 'Racing line calculation — find optimal path through corners using waypoints on track spline. Cost = distance + curvature penalty.' },
      { name: 'Steering Behaviors', tag: 'steering', role: 'Seek racing line + avoid other cars + wall avoidance. Overtaking = temporary target offset from racing line.' },
      { name: 'RL (Drivatar)', tag: 'rl', role: 'Forza\'s Drivatar learns YOUR driving style — braking points, cornering aggression, preferred lines — to create personalized AI opponents.' },
      { name: 'Director AI', tag: 'director', role: 'Rubber-banding / DDA: AI slows down when too far ahead, speeds up when behind. Mario Kart items scale with position (blue shell for last place).' },
    ],
    keyInsight: 'Racing AI has two layers: tactical (racing line, overtaking) and meta (rubber-banding for fun). Forza\'s Drivatar was revolutionary — instead of scripted difficulty, AI clones of real players create unpredictable races. Gran Turismo uses "Sophy" RL agent trained via self-play to achieve superhuman lap times.',
    implementation: `// Racing AI: Line following + overtaking
function updateRacerAI(car, dt) {
  // 1. Find target point on racing line
  const target = racingLine.getPointAhead(car.position, lookahead);

  // 2. Steering toward racing line
  const steerForce = steerToward(car, target);

  // 3. Overtaking logic
  const ahead = getCarAhead(car, 30); // 30m lookahead
  if (ahead && !ahead.isPlayer) {
    // Offset target to inside of next corner
    target = racingLine.getOffset(target, overtakeSide);
  }

  // 4. Speed control — brake for corners
  const cornerSharpness = racingLine.getCurvature(car.position);
  const targetSpeed = maxSpeed * (1.0 - cornerSharpness * 0.8);
  const throttle = car.speed < targetSpeed ? 1.0 : -0.5;

  // 5. Rubber-banding (Director layer)
  if (distToPlayer > 100) throttle *= 0.85; // slow down
  if (distToPlayer < -80) throttle *= 1.10; // catch up
}`,
  },
  {
    genre: 'RTS / Strategy',
    icon: '⚔️',
    color: '#58a6ff',
    games: ['StarCraft II', 'Age of Empires IV', 'Civilization VI', 'Total War'],
    techniques: [
      { name: 'GOAP', tag: 'goap', role: 'Build order planning: Goal(ArmyReady) → BuildBarracks → TrainMarines → Scout → Attack. Plans adapt to scouted enemy composition.' },
      { name: 'HFSM', tag: 'hfsm', role: 'Strategic hierarchy: Economy (Expand/Mine/Trade) → Military (Defend/Attack/Retreat) → Diplomacy. Each layer has sub-state machines.' },
      { name: 'A* Pathfinding', tag: 'pathfinding', role: 'Unit navigation on terrain. Hierarchical A* (HPA*) for large maps — pathfind on region graph first, then refine locally.' },
      { name: 'RL', tag: 'rl', role: 'AlphaStar: transformer + LSTM architecture trained on replays then refined via league self-play. Reached top 0.2% (Grandmaster) in SC2.' },
    ],
    keyInsight: 'RTS AI splits into Macro (economy, build orders, strategy) and Micro (unit control, kiting, focus fire). AlphaStar mastered both but used separate training: supervised learning on replays for macro, RL self-play for micro. Traditional RTS AI uses influence maps — heatmaps of enemy presence guiding strategic decisions.',
    implementation: `// RTS AI: Macro strategy + Micro control
class RTSCommander {
  // MACRO: Strategic decisions (every 5 seconds)
  updateStrategy() {
    const threat = influenceMap.getEnemyStrength(base);
    if (threat > myArmy * 0.8) {
      this.goal = 'DEFEND';
      this.buildOrder = ['Turret', 'Marine', 'Marine'];
    } else if (resources > 400) {
      this.goal = 'EXPAND';
      this.buildOrder = ['Worker', 'Base', 'Worker'];
    } else {
      this.goal = 'HARASS';
      this.buildOrder = ['Marine', 'Medic'];
    }
  }

  // MICRO: Unit-level tactics (every frame)
  controlUnits(units) {
    units.forEach(unit => {
      const target = findWeakestInRange(unit);
      if (unit.health < 20) kiteAway(unit, target);
      else if (target) attackMove(unit, target);
      else regroup(unit, rallyPoint);
    });
  }
}`,
  },
  {
    genre: 'Sports Games',
    icon: '⚽',
    color: '#3fb950',
    games: ['NBA 2K26', 'FIFA / EA FC', 'Madden NFL', 'MLB The Show'],
    techniques: [
      { name: 'FSM', tag: 'fsm', role: 'Player states: HasBall (dribble/shoot/pass) → OffBall (cut/screen/space) → Defense (guard/help/rotate). Clean state transitions per possession.' },
      { name: 'Utility AI', tag: 'utility', role: 'NBA 2K26: 10+ difficulty variables score actions — help defense rotation, steal opportunity, post/perimeter mismatch detection, screen navigation.' },
      { name: 'Steering/Flocking', tag: 'steering', role: 'Team spacing — players maintain formation while avoiding clumping. "Ball gravity" pulls defenders toward ball carrier dynamically.' },
      { name: 'Behavior Tree', tag: 'bt', role: 'Playbook execution: Selector(RunPlay → ReadDefense → Improvise). 80+ plays per team in NBA 2K26 with adaptive reads.' },
    ],
    keyInsight: 'Sports AI is uniquely complex because 10-22 agents must coordinate in real-time while following sport-specific rules. NBA 2K26 added "awareness depth" — defenders recognize pass initiations faster and evaluate screen navigation directionally. The challenge: AI must look natural (not robotic) while also being competitively fair.',
    implementation: `// Sports AI: Team coordination + individual decisions
function updateTeamAI(team, ball) {
  const play = playbook.getCurrentPlay(team);

  team.players.forEach(player => {
    if (player.hasBall) {
      // Decision: shoot vs pass vs drive
      const shotQuality = evaluateShot(player, defenders);
      const passOptions = findOpenTeammates(team);
      const driveScore = evaluateDrive(player, basket);

      if (shotQuality > 0.7) shoot(player);
      else if (passOptions[0]?.score > 0.6) pass(player, passOptions[0]);
      else dribble(player, driveScore);
    } else {
      // Off-ball: follow play + react to defense
      const assignedPos = play.getPosition(player.role);
      const spacing = maintainFloorSpacing(team, player);
      player.moveTo(blend(assignedPos, spacing, 0.7));
    }
  });
}`,
  },
  {
    genre: 'Stealth Games',
    icon: '🥷',
    color: '#d29922',
    games: ['Metal Gear Solid V', 'Hitman: WoA', 'Splinter Cell', 'Dishonored'],
    techniques: [
      { name: 'HFSM', tag: 'hfsm', role: 'Guard states: Unaware (Patrol/Idle/Chat) → Suspicious (Investigate/Search) → Alert (Combat/Call Backup). Each level has sub-behaviors.' },
      { name: 'A* Pathfinding', tag: 'pathfinding', role: 'Guard patrol routes + dynamic search patterns. When suspicious, pathfind to last known player position + expand search radius.' },
      { name: 'Utility AI', tag: 'utility', role: 'Suspicion scoring: saw open door (+0.2) + heard noise (+0.3) + found unconscious body (+0.8) → threshold triggers Alert transition.' },
      { name: 'FSM', tag: 'fsm', role: 'Sensory system: multi-modal detection via sight cones (FOV + distance) + hearing radius (noise level) + environmental awareness (open doors, blood).' },
    ],
    keyInsight: 'Stealth AI must be predictable enough to learn but reactive enough to surprise. MGS pioneered audio/visual dual detection. Hitman emphasizes observation-based gameplay — guards logically deduce from environmental clues (open doors, missing disguises). The best stealth AI gives players a "language" to learn and exploit.',
    implementation: `// Stealth AI: Multi-sensory detection + search behavior
function updateGuard(guard, dt) {
  // Sensory input accumulates suspicion
  let suspicion = guard.suspicion;

  // Visual detection (cone-based)
  if (inSightCone(guard, player) && hasLineOfSight(guard, player)) {
    const dist = distance(guard, player);
    suspicion += (1.0 - dist / maxSight) * dt * 2.0;
  }

  // Audio detection
  const noise = getNoiseAtPosition(guard.position);
  if (noise > 0.3) suspicion += noise * dt;

  // Environmental clues
  if (seesOpenDoor(guard)) suspicion += 0.1;
  if (seesBody(guard))     suspicion += 0.8;

  // State transitions based on suspicion threshold
  if (suspicion > 1.0) guard.state = 'ALERT.Combat';
  else if (suspicion > 0.5) guard.state = 'SUSPICIOUS.Investigate';
  else guard.state = 'UNAWARE.' + guard.currentSubState;

  guard.suspicion = Math.max(0, suspicion - dt * 0.1); // decay
}`,
  },
  {
    genre: 'Open World / RPG',
    icon: '🗺️',
    color: '#bc8cff',
    games: ['Red Dead Redemption 2', 'Skyrim', 'GTA V', 'The Witcher 3'],
    techniques: [
      { name: 'HFSM', tag: 'hfsm', role: 'NPC daily schedules: DayTime (Work→Eat→Socialize) → NightTime (GoHome→Sleep). RDR2 NPCs live independently of player.' },
      { name: 'Behavior Tree', tag: 'bt', role: 'Skyrim Radiant AI: BT + ML for adaptive NPC schedules. Dynamic quest generation based on player history and world state.' },
      { name: 'LLM NPC', tag: 'llm', role: 'Next frontier: Mantella mod gives every Skyrim NPC LLM-powered voice dialogue with persistent memory and personality.' },
      { name: 'Steering', tag: 'steering', role: 'GTA V: 1000+ pedestrians + vehicles using steering behaviors. Pedestrians flock on sidewalks, cars follow traffic rules with avoidance.' },
    ],
    keyInsight: 'Open world AI prioritizes believability over intelligence. RDR2\'s NPCs have the deepest simulation — complex needs-based AI where NPCs make plans, follow routines, and create emergent moments. The challenge is LOD (Level of Detail) — full AI for nearby NPCs, simplified for distant ones. Skyrim\'s Radiant Story generates quests parametrically.',
    implementation: `// Open World NPC: Daily schedule + emergent behavior
class OpenWorldNPC {
  constructor(personality, home, workplace) {
    this.schedule = new DailySchedule([
      { time: '06:00', action: 'WakeUp', location: home },
      { time: '07:00', action: 'Eat', location: home },
      { time: '08:00', action: 'GoToWork', location: workplace },
      { time: '17:00', action: 'Socialize', location: tavern },
      { time: '21:00', action: 'GoHome', location: home },
    ]);
  }

  update(dt, worldEvents) {
    const scheduled = this.schedule.getCurrentAction(gameTime);

    // React to world events (emergent behavior)
    if (worldEvents.nearbyDanger) return this.flee();
    if (worldEvents.playerTalking) return this.engageDialogue();
    if (worldEvents.weatherBad) return this.seekShelter();

    // Follow daily routine
    this.executeAction(scheduled);
  }
}`,
  },
  {
    genre: 'MOBA',
    icon: '🏰',
    color: '#58a6ff',
    games: ['Dota 2', 'League of Legends', 'Smite', 'Heroes of the Storm'],
    techniques: [
      { name: 'HFSM', tag: 'hfsm', role: 'Role-based hierarchy: Laner (Farm→Poke→AllIn→Retreat) | Jungler (FarmCamps→Gank→Objective→Counter). Top-level: TeamFight mode overrides all.' },
      { name: 'Utility AI', tag: 'utility', role: 'Score lane actions: last-hit creep (gold value) vs harass enemy (HP trade) vs ward (vision) vs roam (gank opportunity). Dynamic per game phase.' },
      { name: 'RL', tag: 'rl', role: 'OpenAI Five: multi-agent RL with 45K years of self-play. Excellent teamfight micro but weak at macro strategy (map control, timing).' },
      { name: 'GOAP', tag: 'goap', role: 'Objective planning: Goal(DestroyBase) → TakeBaronBuff → SiegeInhibitor → GroupMid. Plans adapt to team composition and gold lead.' },
    ],
    keyInsight: 'MOBA AI requires both individual mastery and team coordination. OpenAI Five proved RL can learn amazing teamfight execution but struggles with long-term strategy. The solution: hierarchical models separating Macro (where to be, what objective) from Micro (how to fight, when to use abilities). Collective team intelligence outperforms individual skill.',
    implementation: `// MOBA AI: Hierarchical Macro + Micro
class MOBAAgent {
  // MACRO: Strategic layer (every 10 seconds)
  evaluateMacro(gameState) {
    const phase = getGamePhase(gameState.timer);
    const scores = {
      farm:      phase === 'early' ? 0.8 : 0.3,
      gank:      enemyOverextended() ? 0.9 : 0.2,
      objective: objectiveUp() && teamAlive(4) ? 0.85 : 0.1,
      teamfight: teamAdvantage() > 0.6 ? 0.9 : 0.4,
      defend:    towerUnderAttack() ? 1.0 : 0.0,
    };
    return pickHighestScore(scores);
  }

  // MICRO: Combat layer (every frame)
  executeCombat(hero, enemies, allies) {
    const target = selectTarget(enemies); // lowest HP + highest threat
    const abilities = hero.getReadyAbilities();
    const combo = findBestCombo(abilities, target, allies);

    if (hero.health / hero.maxHealth < 0.2) return kiteRetreat(hero);
    if (combo.damage > target.health) return executeCombo(combo);
    return autoAttack(hero, target);
  }
}`,
  },
];

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
          <h2>Game AI Reference</h2>
          <button class="info-modal-close">&times;</button>
        </div>
        <div class="info-tabs">
          <button class="info-tab active" data-tab="technique">This Technique</button>
          <button class="info-tab" data-tab="genres">AI by Genre</button>
        </div>

        <div class="info-tab-content" id="tab-technique">
          <h2 class="info-technique-title">${data.title}</h2>
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

        <div class="info-tab-content hidden" id="tab-genres">
          ${GENRE_GUIDE.map(g => `
            <div class="genre-block">
              <div class="genre-header" style="border-left-color: ${g.color}">
                <span class="genre-icon">${g.icon}</span>
                <div>
                  <div class="genre-title">${g.genre}</div>
                  <div class="genre-games">${g.games.join(' · ')}</div>
                </div>
              </div>
              <div class="genre-body hidden">
                <div class="genre-techniques">
                  ${g.techniques.map(t => `
                    <div class="genre-tech">
                      <span class="genre-tech-tag" style="color: ${g.color}">${t.name}</span>
                      <span class="genre-tech-role">${t.role}</span>
                    </div>
                  `).join('')}
                </div>
                <div class="info-key-idea">${g.keyInsight}</div>
                <pre class="info-code"><code>${this._escapeHtml(g.implementation)}</code></pre>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Tab switching
    this._modal.querySelectorAll('.info-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this._modal.querySelectorAll('.info-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this._modal.querySelectorAll('.info-tab-content').forEach(c => c.classList.add('hidden'));
        this._modal.querySelector(`#tab-${tab.dataset.tab}`).classList.remove('hidden');
      });
    });

    // Genre accordion
    this._modal.querySelectorAll('.genre-header').forEach(header => {
      header.addEventListener('click', () => {
        const body = header.nextElementSibling;
        const wasHidden = body.classList.contains('hidden');
        // Close all others
        this._modal.querySelectorAll('.genre-body').forEach(b => b.classList.add('hidden'));
        this._modal.querySelectorAll('.genre-header').forEach(h => h.classList.remove('genre-header-open'));
        if (wasHidden) {
          body.classList.remove('hidden');
          header.classList.add('genre-header-open');
        }
      });
    });

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
