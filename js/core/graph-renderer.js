export class GraphRenderer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.svg = null;
    this.simulation = null;
    this._currentLayout = 'force';
    this._init();
  }

  _init() {
    const rect = this.container.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    this.svg = d3.select(this.container)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${this.width} ${this.height}`);

    this.edgeGroup = this.svg.append('g').attr('class', 'edges');
    this.nodeGroup = this.svg.append('g').attr('class', 'nodes');
    this.labelGroup = this.svg.append('g').attr('class', 'labels');

    new ResizeObserver(() => {
      const r = this.container.getBoundingClientRect();
      this.width = r.width;
      this.height = r.height;
      this.svg.attr('viewBox', `0 0 ${this.width} ${this.height}`);
    }).observe(this.container);
  }

  update(graphData) {
    if (!graphData) return;

    // HTML mode (e.g. LLM NPC chat panel)
    if (graphData._html && graphData.html) {
      this.renderHTML(graphData.html);
      return;
    }

    if (!graphData.nodes) return;
    const { nodes, edges, activeNodeId, layout } = graphData;

    this.showSVG();

    if (layout && layout !== this._currentLayout) {
      this._currentLayout = layout;
    }

    if (this._currentLayout === 'force') {
      this._renderForce(nodes, edges, activeNodeId);
    } else if (this._currentLayout === 'tree') {
      this._renderTree(nodes, edges, activeNodeId);
    } else if (this._currentLayout === 'custom') {
      this._renderCustom(nodes, edges, activeNodeId);
    }
  }

  _renderForce(nodes, edges, activeNodeId) {
    const w = this.width, h = this.height;

    // Assign fixed positions if provided, otherwise use force
    nodes.forEach(n => {
      if (n.fx == null) {
        n.fx = n.x || w / 2;
        n.fy = n.y || h / 2;
      }
    });

    // Edges
    const edgeSel = this.edgeGroup.selectAll('line').data(edges, d => d.source + '-' + d.target);
    edgeSel.exit().remove();
    const edgeEnter = edgeSel.enter().append('line');
    edgeSel.merge(edgeEnter)
      .attr('x1', d => (nodes.find(n => n.id === d.source) || {}).fx || 0)
      .attr('y1', d => (nodes.find(n => n.id === d.source) || {}).fy || 0)
      .attr('x2', d => (nodes.find(n => n.id === d.target) || {}).fx || 0)
      .attr('y2', d => (nodes.find(n => n.id === d.target) || {}).fy || 0)
      .attr('stroke', d => d.active ? '#58a6ff' : '#30363d')
      .attr('stroke-width', d => d.active ? 2.5 : 1.5)
      .attr('opacity', d => d.active ? 1 : 0.6);

    // Nodes
    const nodeSel = this.nodeGroup.selectAll('circle').data(nodes, d => d.id);
    nodeSel.exit().remove();
    const nodeEnter = nodeSel.enter().append('circle');
    nodeSel.merge(nodeEnter)
      .attr('cx', d => d.fx)
      .attr('cy', d => d.fy)
      .attr('r', d => d.id === activeNodeId ? 26 : 22)
      .attr('fill', d => d.id === activeNodeId ? (d.activeColor || '#0d419d') : '#21262d')
      .attr('stroke', d => d.id === activeNodeId ? (d.color || '#58a6ff') : '#30363d')
      .attr('stroke-width', d => d.id === activeNodeId ? 2.5 : 1.5)
      .style('filter', d => d.id === activeNodeId ? `drop-shadow(0 0 8px ${d.color || '#58a6ff'})` : 'none');

    // Labels
    const labelSel = this.labelGroup.selectAll('text').data(nodes, d => d.id);
    labelSel.exit().remove();
    const labelEnter = labelSel.enter().append('text');
    labelSel.merge(labelEnter)
      .attr('x', d => d.fx)
      .attr('y', d => d.fy + 4)
      .attr('text-anchor', 'middle')
      .attr('fill', d => d.id === activeNodeId ? (d.color || '#58a6ff') : '#8b949e')
      .attr('font-size', 10)
      .attr('font-weight', d => d.id === activeNodeId ? 'bold' : 'normal')
      .attr('font-family', "'SF Mono', monospace")
      .text(d => d.label);
  }

  _renderTree(nodes, edges, activeNodeId) {
    this._renderForce(nodes, edges, activeNodeId);
  }

  _renderCustom(nodes, edges, activeNodeId) {
    this._renderForce(nodes, edges, activeNodeId);
  }

  clear() {
    this.edgeGroup.selectAll('*').remove();
    this.nodeGroup.selectAll('*').remove();
    this.labelGroup.selectAll('*').remove();
  }

  renderHTML(htmlContent) {
    this.svg.style('display', 'none');
    let div = this.container.querySelector('.graph-html');
    if (!div) {
      div = document.createElement('div');
      div.className = 'graph-html';
      div.style.cssText = 'width:100%;height:100%;overflow:auto;padding:12px;';
      this.container.appendChild(div);
      div.innerHTML = htmlContent;
      this._lastHtml = htmlContent;
    } else if (this._lastHtml !== htmlContent) {
      div.innerHTML = htmlContent;
      this._lastHtml = htmlContent;
    }
  }

  showSVG() {
    this.svg.style('display', null);
    const div = this.container.querySelector('.graph-html');
    if (div) div.remove();
  }
}
