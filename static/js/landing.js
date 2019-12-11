"use strict";
(() => {
  const scroller = scrollama();
  const chartSpace = d3.select("#scroll");
  const step = chartSpace.selectAll(".step");
  const headerDuration = 200;
  const textDuration = 1000;

  let allSongs = [];
  let response = [];
  let header = d3.select(".header").select("h1");
  let windowHeight = [];
  let windowWidth = [];
  let stepHeight = [];
  let stepWidth = [];

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
    // welcome-----------------------------------------------------
    chartSpace
      .append("a")
      .attr("name", "welcome")
      .append("div")
      .attr("id", "welcomeGroup")
      .attr("class", "step")
      .attr("data-step", "a")
      .style("height", `${stepHeight}px`)
      .style("width", `${stepWidth}px`);

    let welcomeText = d3.selectAll("#welcomeGroup").append("g");

    welcomeText
      .append("h2")
      .attr("class", "welcomeText")
      .text("What is the Shape of a Song?")
      .style("transform", `translate(0px,${stepHeight / 2}px)`)
      .style("opacity", "0");
    welcomeText
      .append("p")
      .text(
        "That's the riddle we set out to answer with this project. This site is our attempt to share what we found with you."
      );
    welcomeText.append("p").text("Scroll down to begin.");

    welcomeText
      .selectAll("p")
      .attr("class", "welcomeText")
      .style("transform", `translate(0px,${stepHeight / 2}px)`)
      .style("opacity", "0");

    // Methodology-----------------------------------------------------
    chartSpace
      .append("a")
      .attr("name", "methodology")
      .append("div")
      .attr("id", "mthdGroup")
      .attr("class", "step")
      .attr("data-step", "b")
      .style("height", `${stepHeight}px`)
      .style("width", `${stepWidth}px`);

    let mthdText = d3.selectAll("#mthdGroup").append("g");

    mthdText
      .append("h2")
      .text("Methodology")
      .style("transform", `translate(0px,${stepHeight / 8}px)`)
      .attr("class", "mthdText");
    mthdText
      .append("p")
      .text(
        "We start off by connecting with Spotify to query a user's library. After making a few API calls, we render the initial song metadata results using d3js. These results answer the question posed above at a high level, but surely there's more insight to be found. In addition to the metadata, Spotify provides access to 30s samples of many of their songs. We process these samples using the python 'Librosa' library, and present the final output to you, the viewer."
      );
    mthdText
      .append("p")
      .text(
        "Keep scrolling for a legend explaining how to read the visualizations."
      );
    mthdText
      .selectAll("p")
      .attr("class", "mthdText")
      .style("opacity", "0")
      .style("transform", `translate(0px,${stepHeight / 8}px)`);

    // Legend-----------------------------------------------------
    chartSpace
      .append("a")
      .attr("name", "legend")
      .append("div")
      .attr("id", "legendGroup")
      .attr("class", "step")
      .attr("data-step", "c")
      .style("height", `${stepHeight}px`)
      .style("width", `${stepWidth}px`);

    let legendText = d3.selectAll("#legendGroup").append("g");

    legendText
      .append("h2")
      .text("Legend")
      .style("transform", `translate(0px,${stepHeight / 8}px)`)
      .style("opacity", "0")
      .attr("class", "legendText");

    legendText
      .append("p")
      .text("Here's where we'll explain how to understand the viz.")
      .style("transform", `translate(0px,${stepHeight / 8}px)`)
      .style("opacity", "0")
      .attr("class", "legendText");

    // Bubbles---------------------------------------------------
    chartSpace
      .append("a")
      .attr("name", "bubbles")
      .append("div")
      .attr("id", "bubblesGroup")
      .attr("class", "step")
      .attr("data-step", "d")
      .attr("height", `${stepHeight}`)
      .attr("width", `${stepWidth}`)
      // add browse-by selctor
      .append("form")
      .attr("class", "form-inline")
      .append("div")
      .attr("class", "form-group")
      .append("label")
      .attr("for", "browseType")
      .text("Browse By")
      .append("select")
      .attr("class", "form-control")
      .attr("id", "browse-type")
      .style("transform", "translate(0,50px)");
    // add options to browse-by
    var browseSelector = d3.select("#browse-type");
    browseSelector
      .append("option")
      .attr("value", "song")
      .text("Song");
    browseSelector
      .append("option")
      .attr("value", "artist")
      .text("Artist");
    browseSelector
      .append("option")
      .attr("value", "genre")
      .text("Genre");

    // add sort-by selector
    chartSpace
      .append("form")
      .attr("class", "form-inline")
      .append("div")
      .attr("class", "form-group")
      .append("label")
      .attr("for", "sortType")
      .text("Sort By")
      .append("select")
      .attr("class", "form-control")
      .attr("id", "sort-type")
      .style("transform", "translate(0,50px)");
    // add options to sort-by
    var sortSelector = d3.select("#sort-type");
    sortSelector
      .append("option")
      .attr("value", "default")
      .text("Default");
    sortSelector
      .append("option")
      .attr("value", "acousticness")
      .text("Acousticness");
    sortSelector
      .append("option")
      .attr("value", "danceability")
      .text("Danceability");
    sortSelector
      .append("option")
      .attr("value", "liveness")
      .text("Liveness");
    sortSelector
      .append("option")
      .attr("value", "energy")
      .text("Energy");
    // About---------------------------------------------------
    chartSpace
      .append("a")
      .attr("name", "about")
      .append("div")
      .attr("id", "aboutGroup")
      .attr("class", "step")
      .attr("data-step", "d")
      .style("height", `${stepHeight}px`)
      .style("width", `${stepWidth}px`);

    let aboutText = d3.selectAll("#aboutGroup").append("g");

    aboutText
      .append("h2")
      .text("About")
      .style("transform", `translate(0px,${stepHeight / 8}px)`)
      .style("opacity", "0")
      .attr("class", "aboutText");

    aboutText
      .append("p")
      .text("we are three individuals.")
      .style("transform", `translate(0px,${stepHeight / 8}px)`)
      .style("opacity", "0")
      .attr("class", "aboutText");
  }

  function activelink(linkName) {
    d3.selectAll(".active").classed("active", false);
    var linkName = d3.selectAll(`#${linkName}`);
    linkName.classed("active", !linkName.classed("active"));
  }

  function welcome() {
    chartSpace
      .selectAll(".welcomeText")
      .transition()
      .style("opacity", "1");
    chartSpace
      .selectAll(".mthdText")
      .transition()
      .style("opacity", "0");
    chartSpace
      .selectAll(".legendText")
      .transition()
      .style("opacity", "0");
    chartSpace
      .selectAll(".aboutText")
      .transition()
      .style("opacity", "0");
  }

  function methodology() {
    chartSpace
      .selectAll(".welcomeText")
      .transition()
      .style("opacity", "0");
    chartSpace
      .selectAll(".mthdText")
      .transition()
      .style("opacity", "1");
    chartSpace
      .selectAll(".legendText")
      .transition()
      .style("opacity", "0");
    chartSpace
      .selectAll(".aboutText")
      .transition()
      .style("opacity", "0");
  }

  function legend() {
    chartSpace
      .selectAll(".welcomeText")
      .transition()
      .style("opacity", "0");
    chartSpace
      .selectAll(".mthdText")
      .transition()
      .style("opacity", "0");
    chartSpace
      .selectAll(".legendText")
      .transition()
      .style("opacity", "1");
    chartSpace
      .selectAll(".aboutText")
      .transition()
      .style("opacity", "0");
  }

  function about() {
    chartSpace
      .selectAll(".welcomeText")
      .transition()
      .style("opacity", "0");
    chartSpace
      .selectAll(".mthdText")
      .transition()
      .style("opacity", "0");
    chartSpace
      .selectAll(".legendText")
      .transition()
      .style("opacity", "0");
    chartSpace
      .selectAll(".aboutText")
      .transition()
      .style("opacity", "1");
  }

  function handleStepEnter(response) {
    // response = { element, direction, index }
    switch (response.index) {
      case 0: // welcome
        activelink("homelnk");
        welcome();
        break;
      case 1: // methodology
        activelink("mthdlnk");
        methodology();
        break;
      case 2: // legend
        activelink("lgndlnk");
        legend();
        break;
      case 3: // bubbles viz
        activelink("xplrlnk");
        break;
      case 4:
        activelink("abtlnk");
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
    // 1. force a resize on  to ensure proper dimensions are sent to scrollama
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
  init();
})();
