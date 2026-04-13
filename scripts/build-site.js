const fs = require("fs");
const path = require("path");

const graph = JSON.parse(fs.readFileSync(path.join("dist", "graph.json"), "utf-8"));

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Wiki Graph</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #1a1a2e; overflow: hidden; font-family: system-ui, sans-serif; }
    svg { width: 100vw; height: 100vh; display: block; }
    .tooltip {
      position: fixed; padding: 6px 10px; background: #16213e; color: #e0e0e0;
      border: 1px solid #0f3460; border-radius: 4px; font-size: 12px;
      pointer-events: none; display: none; z-index: 10;
    }
    .legend {
      position: fixed; top: 12px; left: 12px; background: rgba(22,33,62,0.9);
      padding: 10px 14px; border-radius: 6px; color: #ccc; font-size: 12px;
    }
    .legend div { margin: 3px 0; display: flex; align-items: center; gap: 6px; }
    .legend span { display: inline-block; width: 10px; height: 10px; border-radius: 50%; }
  </style>
</head>
<body>
  <div class="tooltip" id="tooltip"></div>
  <div class="legend">
    <div><span style="background:#4a9eff"></span> Entities</div>
    <div><span style="background:#4caf50"></span> Concepts</div>
    <div><span style="background:#ff9800"></span> Sources</div>
    <div><span style="background:#ab47bc"></span> Synthesis</div>
    <div><span style="background:#888"></span> Other</div>
  </div>
  <svg id="graph"></svg>
  <script type="module">
    import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

    const data = \${JSON.stringify(graph)};

    const DIR_COLORS = {
      entities: "#4a9eff",
      concepts: "#4caf50",
      sources: "#ff9800",
      synthesis: "#ab47bc",
    };

    const width = window.innerWidth;
    const height = window.innerHeight;

    const svg = d3.select("#graph");
    const g = svg.append("g");

    svg.call(d3.zoom().scaleExtent([0.1, 8]).on("zoom", (e) => g.attr("transform", e.transform)));

    const simulation = d3.forceSimulation(data.nodes)
      .force("link", d3.forceLink(data.edges).id((d) => d.id).distance(80))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(30));

    const link = g.append("g")
      .selectAll("line")
      .data(data.edges)
      .join("line")
      .attr("stroke", "#334")
      .attr("stroke-width", 1);

    const node = g.append("g")
      .selectAll("circle")
      .data(data.nodes)
      .join("circle")
      .attr("r", 6)
      .attr("fill", (d) => DIR_COLORS[d.dir] || "#888")
      .attr("stroke", "#fff")
      .attr("stroke-width", 0.5)
      .call(d3.drag()
        .on("start", (e, d) => { if (!e.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on("drag", (e, d) => { d.fx = e.x; d.fy = e.y; })
        .on("end", (e, d) => { if (!e.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }));

    const label = g.append("g")
      .selectAll("text")
      .data(data.nodes)
      .join("text")
      .text((d) => d.title)
      .attr("font-size", 9)
      .attr("fill", "#ccc")
      .attr("dx", 10)
      .attr("dy", 3);

    const tooltip = document.getElementById("tooltip");
    node.on("mouseover", (e, d) => {
      tooltip.style.display = "block";
      tooltip.textContent = d.id;
      tooltip.style.left = e.clientX + 12 + "px";
      tooltip.style.top = e.clientY - 8 + "px";
    }).on("mousemove", (e) => {
      tooltip.style.left = e.clientX + 12 + "px";
      tooltip.style.top = e.clientY - 8 + "px";
    }).on("mouseout", () => {
      tooltip.style.display = "none";
    });

    let selected = null;
    node.on("click", (e, d) => {
      if (selected === d.id) {
        selected = null;
        node.attr("opacity", 1);
        link.attr("opacity", 1);
        label.attr("opacity", 1);
        return;
      }
      selected = d.id;
      const connected = new Set();
      connected.add(d.id);
      data.edges.forEach((e) => {
        const src = typeof e.source === "object" ? e.source.id : e.source;
        const tgt = typeof e.target === "object" ? e.target.id : e.target;
        if (src === d.id) connected.add(tgt);
        if (tgt === d.id) connected.add(src);
      });
      node.attr("opacity", (n) => connected.has(n.id) ? 1 : 0.1);
      link.attr("opacity", (l) => {
        const src = typeof l.source === "object" ? l.source.id : l.source;
        const tgt = typeof l.target === "object" ? l.target.id : l.target;
        return src === d.id || tgt === d.id ? 1 : 0.05;
      });
      label.attr("opacity", (n) => connected.has(n.id) ? 1 : 0.1);
    });

    simulation.on("tick", () => {
      link.attr("x1", (d) => d.source.x).attr("y1", (d) => d.source.y)
          .attr("x2", (d) => d.target.x).attr("y2", (d) => d.target.y);
      node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
      label.attr("x", (d) => d.x).attr("y", (d) => d.y);
    });
  </script>
</body>
</html>`;

fs.writeFileSync(path.join("dist", "index.html"), html);
console.log("Site built → dist/index.html");
