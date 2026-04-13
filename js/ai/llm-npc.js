import { AIBrain } from './base.js';

const SCRIPTED_RESPONSES = [
  { keywords: ['hello', 'hi', 'hey'], response: "Greetings, traveler. What brings you to these parts?", emotion: 'neutral' },
  { keywords: ['help', 'quest'], response: "I've heard rumors of bandits in the eastern woods. Could you investigate?", emotion: 'concerned' },
  { keywords: ['fight', 'attack', 'kill'], response: "You dare threaten me?! I'll defend myself!", emotion: 'angry' },
  { keywords: ['friend', 'peace', 'ally'], response: "A friend? In these troubled times, that's welcome indeed.", emotion: 'happy' },
  { keywords: ['bye', 'goodbye', 'leave'], response: "Safe travels, stranger. May the road treat you well.", emotion: 'neutral' },
  { keywords: ['name', 'who'], response: "I am Aldric, guardian of this crossroad. Been here thirty years.", emotion: 'neutral' },
  { keywords: ['danger', 'afraid', 'scared'], response: "I... I've seen things in the shadows lately. Please be careful.", emotion: 'scared' },
];

const EMOTIONS = {
  neutral: { color: '#8b949e', behavior: 'idle' },
  happy: { color: '#3fb950', behavior: 'wander' },
  angry: { color: '#f85149', behavior: 'chase' },
  scared: { color: '#d29922', behavior: 'flee' },
  concerned: { color: '#58a6ff', behavior: 'idle' },
};

export function createLLMNPC(world) {
  let npc = null;
  let emotion = 'neutral';
  let chatLog = [];
  let apiKey = '';
  let inputEl = null;
  let chatEl = null;
  let wanderTarget = null;
  let wanderTimer = 0;

  function getScriptedResponse(input) {
    const lower = input.toLowerCase();
    const match = SCRIPTED_RESPONSES.find(r => r.keywords.some(k => lower.includes(k)));
    return match || { response: "Hmm, I don't quite understand. Tell me more.", emotion: 'neutral' };
  }

  const brain = new AIBrain(world);
  brain.name = 'LLM NPC';
  brain.description = 'Dialog-driven NPC — scripted fallback, optional Claude API';

  brain.setupWorld = () => {
    world.setWaypoints([]);
    world.setObstacles([]);
    npc = world.addNPC(world.width * 0.25, world.height * 0.5, { size: 20, color: '#8b949e' });
    emotion = 'neutral';
    chatLog = [{ role: 'npc', text: "Greetings, traveler. What brings you here?", emotion: 'neutral' }];
  };

  brain.update = (dt) => {
    if (!npc) return;
    npc.color = EMOTIONS[emotion].color;
    const behavior = EMOTIONS[emotion].behavior;

    switch (behavior) {
      case 'idle':
        npc.stop();
        npc.angle += dt * 0.5;
        break;
      case 'wander':
        wanderTimer -= dt;
        if (wanderTimer <= 0 || !wanderTarget) {
          wanderTarget = {
            x: world.width * 0.1 + Math.random() * world.width * 0.4,
            y: world.height * 0.2 + Math.random() * world.height * 0.6,
          };
          wanderTimer = 3;
        }
        npc.moveTo(wanderTarget.x, wanderTarget.y, dt);
        break;
      case 'chase':
        npc.moveTo(world.player.x, world.player.y, dt);
        break;
      case 'flee':
        const dx = npc.x - world.player.x, dy = npc.y - world.player.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        npc.moveTo(npc.x + (dx / d) * 80, npc.y + (dy / d) * 80, dt);
        break;
    }
  };

  brain.getState = () => ({
    label: `${emotion.toUpperCase()}`,
    detail: `Messages: ${chatLog.length} | Mode: ${apiKey ? 'Claude API' : 'Scripted'}`,
  });

  brain.getGraphData = () => {
    // Render chat log as HTML overlay
    const chatHtml = `
      <div style="font-family: -apple-system, sans-serif; color: #e6edf3; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 8px 12px; border-bottom: 1px solid #30363d; font-size: 11px; color: #8b949e;">
          CONVERSATION LOG — Aldric (${emotion})
        </div>
        <div style="flex: 1; overflow-y: auto; padding: 12px;" id="chat-messages">
          ${chatLog.map(msg => `
            <div style="margin-bottom: 8px; padding: 8px 12px; border-radius: 8px;
              background: ${msg.role === 'npc' ? '#161b22' : '#0d419d'};
              border: 1px solid ${msg.role === 'npc' ? '#30363d' : '#58a6ff33'};
              max-width: 85%; ${msg.role === 'user' ? 'margin-left: auto;' : ''}">
              <div style="font-size: 10px; color: #8b949e; margin-bottom: 4px;">
                ${msg.role === 'npc' ? '🛡 Aldric' : '👤 You'}
                ${msg.emotion ? `<span style="color: ${EMOTIONS[msg.emotion]?.color || '#8b949e'}"> (${msg.emotion})</span>` : ''}
              </div>
              <div style="font-size: 13px;">${msg.text}</div>
            </div>
          `).join('')}
        </div>
        <div style="padding: 8px 12px; border-top: 1px solid #30363d; display: flex; gap: 8px;">
          <input type="text" id="npc-chat-input" placeholder="Type a message..."
            style="flex: 1; background: #0d1117; border: 1px solid #30363d; border-radius: 6px;
            color: #e6edf3; padding: 6px 10px; font-size: 13px; outline: none;"
          />
          <button id="npc-chat-send"
            style="background: #238636; color: white; border: none; border-radius: 6px;
            padding: 6px 16px; cursor: pointer; font-size: 13px;">Send</button>
        </div>
      </div>
    `;

    // Use HTML rendering instead of SVG
    return { nodes: [], edges: [], activeNodeId: null, html: chatHtml, layout: 'custom', _html: true };
  };

  brain.onGraphRendered = (container) => {
    const input = container.querySelector('#npc-chat-input');
    const btn = container.querySelector('#npc-chat-send');
    if (!input || !btn) return;

    const send = () => {
      const text = input.value.trim();
      if (!text) return;
      chatLog.push({ role: 'user', text });
      const resp = getScriptedResponse(text);
      chatLog.push({ role: 'npc', text: resp.response, emotion: resp.emotion });
      emotion = resp.emotion;
      input.value = '';
    };

    btn.onclick = send;
    input.onkeydown = (e) => { if (e.key === 'Enter') send(); };
  };

  brain.reset = () => {
    emotion = 'neutral';
    chatLog = [{ role: 'npc', text: "Greetings, traveler. What brings you here?", emotion: 'neutral' }];
  };

  return brain;
}
