"use strict";

(() => {
  let x = [];
  let y = [];
  let xRange = [];
  let yRange = [];
  let color = [];
  let minDim = [];
  let notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  let noteScale = [];

  function anglePrep(d) {
    return (d / 180) * Math.PI;
  }

  let chartGroup = d3.select("#plot-div");

  let noteDataScale = d3
    .scaleOrdinal()
    .domain(notes)
    .range([0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]);

  console.log(noteDataScale("G#/Ab"));

d3.csv(`/load_songdata/${spotify_id}`,
    d => {
    return d;
    }
)
    .then(d => {
    // transform the data
    var pointData = d3
        .nest()
        .key(function(d) {
        return d["Note"] + "_" + d["MIDI Note"];
        })
        .rollup(function(leaves) {
        return {
            x: d3.sum(leaves, function(d) {
            // x coordinate for note
            return (
                Math.sin(anglePrep(noteDataScale(d["Note"]))) *
                // (d["Octave"] / 10)
                ((d["Octave"] == 0 ? 0.5 : d["Octave"]) / 10)
            );
            }),
            y: d3.sum(leaves, function(d) {
            // y coordinate for note
            return (
                Math.cos(anglePrep(noteDataScale(d["Note"]))) *
                // (d["Octave"] / 10)
                ((d["Octave"] == 0 ? 0.5 : d["Octave"]) / 10)
            );
            }),
            harmonic: d3.sum(leaves, function(d) {
            return d["Harmonic Mean"] * 10;
            }),
            percussive: d3.sum(leaves, function(d) {
            return d["Percussive Mean"];
            })
        };
        })
        .entries(d);
    // Do the work
    handleResize();
    launchD3(pointData, title);
    })
    .catch(err => console.error(err));
}
// TODO: figure out best sizing for window, pass those values through to actual d3 viz.
function handleResize() {
var bodyWidth = Math.floor(window.innerWidth / 3.5);
var bodyHeight = Math.floor(window.innerHeight / 3.5);

minDim = Math.min(bodyWidth, bodyHeight);

var yRange = minDim;
var xRange = minDim;

chartGroup.style("width", xRange + "px").style("height", yRange + "px");

x = d3
    .scaleLinear()
    .domain([-1.1, 1.1])
    .range([0, xRange]);

y = d3
    .scaleLinear()
    .domain([-1.1, 1.1])
    .range([yRange, 0]);

return x, y, minDim;
}

function launchD3(d, title, color) {
color = d3.scaleSequential(d3.interpolateRainbow);

noteScale = d3
    .scaleOrdinal()
    .domain(notes)
    .range([
    0,
    1 / 12,
    2 / 12,
    3 / 12,
    4 / 12,
    5 / 12,
    6 / 12,
    7 / 12,
    8 / 12,
    8 / 12,
    10 / 12,
    11 / 12,
    12 / 12
    ]);

console.log(d);

var songContainer = d3
    .selectAll("#staticBody")
    .append("svg")
    .attr("id", title)
    .attr("height", minDim)
    .attr("width", minDim);

// Note labels
songContainer
    .selectAll(".notePoint")
    .data(notes)
    .enter()
    .append("text")
    .attr("class", "notePoint")
    .text(notes => {
    return notes;
    })
    .attr("x", d => {
    return x(Math.sin(anglePrep(noteDataScale(d))));
    })
    .attr("y", d => {
    return y(Math.cos(anglePrep(noteDataScale(d))));
    })
    .attr("text-anchor", "middle")
    .attr("fill", notes => {
    return color(noteScale(notes));
    });

// percussive notes
songContainer
    .selectAll(".noteCircle_p")
    .data(d)
    .enter()
    .append("circle")
    .attr("class", "noteCircle_p")
    .attr("id", d => {
    return d.key;
    })
    .attr("cx", function(d) {
    return x(d.value["x"]);
    })
    .attr("cy", function(d) {
    return y(d.value["y"]);
    })
    .attr("r", function(d) {
    return `${d.value["percussive"]}vw`;
    })
    .attr("fill", "lightgrey")
    .attr("stroke", "white")
    .attr("fill-opacity", function(d) {
    return d.value["percussive"];
    });

// harmonic notes
songContainer
    .selectAll(".noteCircle_h")
    .data(d)
    .enter()
    .append("circle")
    .attr("class", "noteCircle_h")
    .attr("id", d => {
    return d.key;
    })
    .attr("cx", function(d) {
    return x(d.value["x"]);
    })
    .attr("cy", function(d) {
    return y(d.value["y"]);
    })
    .attr("r", function(d) {
    return `${d.value["harmonic"]}`;
    })
    .attr("fill", function(d) {
    return color(noteScale(d.key.split("_", 1)));
    })
    .attr("stroke", function(d) {
    return color(noteScale(d.key.split("_", 1)));
    })
    .attr("stroke-opacity", function(d) {
    return d.value["harmonic"] / 15;
    })
    .attr("fill-opacity", function(d) {
    return d.value["harmonic"] / 30;
    });

// Song Title
songContainer
    .append("text")
    .text(title)
    .attr("transform", "translate(140,140)")
    .style("font-family", "helvetica")
    .style("font-size", ".75vw")
    .style("fill", "black")
    .style("text-anchor", "middle");

// Circle Collisions!

const forceX = d3
    .forceX(d => {
    return x(d.value["x"]);
    })
    .strength(0.1);

const forceY = d3
    .forceY(d => {
    return y(d.value["y"]);
    })
    .strength(0.1);

const forceR = d3.forceCollide().radius(d => {
    return d.value["harmonic"] - 0.5;
});

var simulation = d3
    .forceSimulation(d)
    .velocityDecay(0.2)
    .force("x", forceX)
    .force("y", forceY)
    .force("center", d3.forceCenter(140, 140))
    .force("collide", forceR)
    .on("tick", updateCircles);

function updateCircles() {
    songContainer
    .selectAll(".noteCircle_h")
    .data(d)
    .transition()
    .attr("cx", d => {
        return d["x"];
    })
    .attr("cy", d => {
        return d["y"];
    });
}
})();
