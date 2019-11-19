"use strict";
(() => {
  const chartSpace = d3.select("#scroll");
  const scroller = scrollama();
  const step = chartSpace.selectAll(".step");
  const headerDuration = 500;
  const textDuration = 1500;

  let data = [];
  let windowHeight = [];
  let windowWidth = [];
  let stepHeight = [];
  let stepWidth = [];

  // d3.json().then(
  init();
  console.log(step);
  // );

  function handleResize() {
    const windowWidth = +window.innerWidth;
    const windowHeight = +window.innerHeight;
    const containerMargin = {
      top: windowHeight * 0.05,
      right: windowWidth * 0.05,
      bottom: windowHeight * 0.05,
      left: windowWidth * 0.05
    };
    stepHeight = windowHeight * 0.95;
    stepWidth = windowWidth * 0.95;

    chartSpace
      .attr("width", `${windowWidth}px`)
      .attr("height", `${windowHeight}px`);

    scroller.resize();
  }

  function buildSections() {
    chartSpace
      .append("div")
      .attr("id", "welcomeGroup")
      .attr("class", "step")
      .attr("data-step", "a")
      .style("height", `${stepHeight}px`)
      .style("width", `${stepWidth}px`);

    chartSpace
      .append("div")
      .attr("id", "mthdGroup")
      .attr("class", "step")
      .attr("data-step", "b")
      .style("height", `${stepHeight}px`)
      .style("width", `${stepWidth}px`);

    chartSpace
      .append("div")
      .attr("id", "legendGroup")
      .attr("class", "step")
      .attr("data-step", "c")
      .style("height", `${stepHeight}px`)
      .style("width", `${stepWidth}px`);

    chartSpace
      .append("div")
      .attr("id", "universeGroup")
      .attr("class", "step")
      .attr("data-step", "d")
      .style("height", `${stepHeight}px`)
      .style("width", `${stepWidth}px`);

    chartSpace
      .append("div")
      .attr("id", "aboutGroup")
      .attr("class", "step")
      .attr("data-step", "d")
      .style("height", `${stepHeight}px`)
      .style("width", `${stepWidth}px`);
  }

  function welcome() {
    chartSpace.selectAll("#mthdText").remove();
    chartSpace.selectAll("#welcomeText").remove();
    let welcomeText = d3
      .selectAll("#welcomeGroup")
      .append("g")
      .attr("id", "welcomeText")
      .style("transform", `translate(0,${windowHeight / 2}px)`);

    welcomeText
      .append("h1")
      .text("What does a song look like?")
      .attr("text-align", "left")
      .style("opacity", "0")
      .transition()
      .duration(headerDuration)
      .style("opacity", "1");

    welcomeText
      .append("p")
      .text(
        "That's the riddle we set out to answer with this project. Through many different trials and iterations, this site is our attempt to share what we found with you. \n\nScroll down to begin."
      )
      .attr("text-align", "left")
      .style("opacity", "0")
      .transition()
      .duration(textDuration)
      .style("opacity", "1");
  }

  function methodology() {
    chartSpace.selectAll("#welcomeText").remove();
    chartSpace.selectAll("#legendText").remove();
    chartSpace.selectAll("#mthdText").remove();
    let mthdText = d3
      .selectAll("#mthdGroup")
      .append("g")
      .attr("id", "mthdText")
      .style("transform", `translate(0,${windowHeight / 2}px)`);

    mthdText
      .append("h1")
      .text("Methodology")
      .style("opacity", "0")
      .transition()
      .duration(headerDuration)
      .style("opacity", "1");

    mthdText
      .append("p")
      .text("Here's where we'll discuss our methodology and whatnot.")
      .style("opacity", "0")
      .transition()
      .duration(textDuration)
      .style("opacity", "1");
  }

  function legend() {
    chartSpace.selectAll("#mthdText").remove();
    chartSpace.selectAll("#universeText").remove();
    chartSpace.selectAll("#legendText").remove();
    let legendText = d3
      .selectAll("#legendGroup")
      .append("g")
      .attr("id", "legendText")
      .style("transform", `translate(0,${windowHeight / 2}px)`);

    legendText
      .append("h1")
      .text("Legend")
      .style("opacity", "0")
      .transition()
      .duration(headerDuration)
      .style("opacity", "1");

    legendText
      .append("p")
      .text("Here's where we'll explain how to understand the viz.")
      .style("opacity", "0")
      .transition()
      .duration(textDuration)
      .style("opacity", "1");
  }

  function universe() {
    chartSpace.selectAll("#legendText").remove();
    chartSpace.selectAll("#aboutText").remove();
    chartSpace.selectAll("#universeText").remove();

    let universeText = d3
      .selectAll("#universeGroup")
      .append("g")
      .attr("id", "universeText")
      .style("transform", `translate(0,${windowHeight / 2}px)`);

    universeText
      .append("h1")
      .text("AudioForma Universe")
      .style("opacity", "0")
      .transition()
      .duration(headerDuration)
      .style("opacity", "1");

    universeText
      .append("p")
      .text(
        "Here's where we'll let the users navigate the universe of data we've prepared :)."
      )
      .style("opacity", "0")
      .transition()
      .duration(textDuration)
      .style("opacity", "1");
  }

  function about() {
    let aboutText = d3
      .selectAll("#aboutGroup")
      .append("g")
      .attr("id", "aboutText")
      .style("transform", `translate(0,${windowHeight / 2}px)`);

    aboutText
      .append("h1")
      .text("About our Team")
      .style("opacity", "0")
      .transition()
      .duration(headerDuration)
      .style("opacity", "1");

    aboutText
      .append("p")
      .text("Here's where we'll brag on ourselves a little bit (or a lot!).")
      .style("opacity", "0")
      .transition()
      .duration(textDuration)
      .style("opacity", "1");
  }

  function handleStepEnter(response) {
    // response = { element, direction, index }
    switch (response.index) {
      case 0: // welcome
        console.log("welcome");
        welcome();
        break; // methodology
      case 1:
        console.log("methodology");
        methodology();
        break; // legend
      case 2:
        console.log("legend");
        legend();
        break; // universe viz
      case 3:
        console.log("universe");
        universe();
        break;
      case 4:
        console.log("about");
        about();
        break;
    }
  }

  function setupStickyfill() {
    d3.selectAll(".sticky").each(function() {
      Stickyfill.add(this);
    });
  }

  function init() {
    setupStickyfill();

    // 1. force a resize on load to ensure proper dimensions are sent to scrollama
    handleResize();

    buildSections();

    // 2. setup the scroller passing options
    // this will also initialize trigger observations
    scroller
      .setup({
        container: "#scroll",
        graphic: ".scroll__graphic",
        text: ".scroll__text",
        step: ".step",
        debug: true
      })
      // 3. bind scrollama event handlers (this can be chained like below)
      .onStepEnter(handleStepEnter);
    // setup resize event
    window.addEventListener("resize", handleResize);
  }
})();
