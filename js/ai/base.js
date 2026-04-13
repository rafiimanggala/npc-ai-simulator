export class AIBrain {
  constructor(world) {
    this.world = world;
    this.name = 'Base';
    this.description = '';
  }

  update(dt) {
    throw new Error('AIBrain.update() must be implemented');
  }

  getState() {
    return { label: 'NONE', details: {} };
  }

  getGraphData() {
    return { nodes: [], edges: [], activeNodeId: null };
  }

  reset() {
    throw new Error('AIBrain.reset() must be implemented');
  }

  getConfig() {
    return [];
  }

  setConfig(key, value) {}
}
