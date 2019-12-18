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
      // .style("transform", `translate(0px,${stepHeight / 2}px)`)
      .style("opacity", "0");
    welcomeText
      .append("p")
      .attr("class", "welcomeText")
      .text(
        "That's the riddle we set out to answer with this project. This site is our attempt to share what we found with you."
      );

    welcomeText
      .append('div')
      .attr("class", "welcomeText")
      .html('<iframe width="560" height="315" src="https://www.youtube.com/embed/-AG25gbI51c" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>')
      // .style("transform", `translate(0px,${stepHeight / 2}px)`)
    
    welcomeText.append("p")
      .attr("class", "welcomeText")
      .text("Scroll down to begin.");

    welcomeText
      .selectAll(".welcomeText")
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
        "We start off by connecting with Spotify to query a user's library. After making a few API calls, we render the initial song metadata results using d3js."
      );
    mthdText
      .append("p")
      .text(
        "Our first visual channel is bubbles. Each song is represented by a bubble colored by its genre. Viewers can browse the songs by genre or artist, where larger bubble diameter indicates larger collection of songs. Viewers can also sort songs by Spotify metadata (i.e. song features), such as danceability and acousticness, in ascending order where songs with greater feature values are placed on the right to those with smaller values."
      );
    mthdText
      .append("p")
      .text(
        "In addition, Spotify provides 30s samples for many songs, represented by bubbles with white outlines. Click the bubbles to access the detail."
      );
    mthdText
      .append("p")
      .text(
        "We process these samples using the python 'Librosa' library, and invented our second visual channel: the Gaussian-shaped curves. As the music plays, the detected notes are plotted as curves, whose height, growing horizontally, shows the note intensity. A certain note (e.g. D) spans up to 9 octaves, having 9 curves placed on top of each other. Each curve is uniquely colored by its octave."
      );

    mthdText
      .selectAll("p")
      .attr("class", "mthdText")
      .style("opacity", "0")
      .style("transform", `translate(0px,${stepHeight / 8}px)`);

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
      .append("div")
      .attr("class", "form-group")
      .style("width", "30vw")
      .style("margin", "0")
      .append("label")
      .attr("for", "browseType")
      .text("Browse By")
      .append("select")
      .attr("class", "form-control")
      .attr("id", "browse-type")
      .style("transform", "translate(10px,0)");

    d3.select(".form-group")
      .append("label")
      .attr("for", "sortType")
      .text("Sort By")
      .style("transform", "translate(50px,0)")
      .append("select")
      .attr("class", "form-control")
      .attr("id", "sort-type")
      .style("transform", "translate(10px,0)");

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
    // add options to sort-by
    var sortSelector = d3.select("#sort-type");
    sortSelector
      .append("option")
      .attr("value", "Popularity")
      .text("Popularity");
    sortSelector
      .append("option")
      .attr("value", "Danceability")
      .text("Danceability");
    sortSelector
      .append("option")
      .attr("value", "Tempo")
      .text("Tempo");
    sortSelector
      .append("option")
      .attr("value", "Acousticness")
      .text("Acousticness");
    sortSelector
      .append("option")
      .attr("value", "Liveness")
      .text("Liveness");
    sortSelector
      .append("option")
      .attr("value", "Happiness")
      .text("Happiness");
    sortSelector
      .append("option")
      .attr("value", "Energy")
      .text("Energy");
    sortSelector
      .append("option")
      .attr("value", "Loudness")
      .text("Loudness");
    sortSelector
      .append("option")
      .attr("value", "Speechiness")
      .text("Speechiness");
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
      .text("About Us")
      .style("transform", `translate(0px,${stepHeight / 8}px)`)
      .style("opacity", "0")
      .attr("class", "aboutText");

    aboutText
      .append("p")
      .text("3 individuals. 1 shared passion for data+design.");
    aboutText
      .append("p")
      .text(
        "Ning Chen is an information designer with a background in architecture and urban planning. Her unique visual style transforms data into art."
      );
    aboutText
      .append("p")
      .text(
        "Jasper Croome is based in Portland, OR, where he works as a data visualization developer at Nike. Jasper's love of music and after-hours d3 dabbling set in motion the AudioForma project."
      );
    aboutText
      .append("p")
      .text(
        "Rebecca Lantner is a quantitative analyst at a startup in Cambridge, MA. A self-professed data nerd, she delights in the layer of creativity that turns a SQL query into an impactful, data-driven experience."
      );
    aboutText
      .append("p")
      .text(
        "Special thanks to Zona Kostic for creative and strategic direction and Tianyu Liu for support with technical implementation."
      );
    aboutText
      .selectAll("p")
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
      case 2: // bubbles viz
        activelink("xplrlnk");
        break;
      case 3:
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
        debug: false
      })
      // 3. bind scrollama event handlers (this can be chained like below)
      .onStepEnter(handleStepEnter);
    // setup resize event
    window.addEventListener("resize", handleResize);
  }
  init();
})();
