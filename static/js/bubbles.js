"use strict";

(() => {
  const chartSpace = d3.select("#scroll");
  const width = d3.select("#bubblesGroup").attr("width");
  const height = d3.select("#bubblesGroup").attr("height");

  d3.json("/load_metadata", d => {
    data = d;
    return data;
  })
    .then(data => {
      data = data;
      drawStuff(data);
    })
    .catch(err => console.error(err));

  function drawStuff(data) {
    chartSpace
      .selectAll(".legendText")
      .transition()
      .style("opacity", 0);
    chartSpace
      .selectAll(".aboutText")
      .transition()
      .style("opacity", 0);

    console.log(data.length);
    console.log(data);
  }
})();
