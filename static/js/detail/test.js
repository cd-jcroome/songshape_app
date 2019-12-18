'use strict';

{ // start scope

// localhost:8000
function gaussianize(inData)
{
    let outData = [];

    for(let i = 0; i < inData.length; ++i)
    {
        let myArray = [];

        for(let j = 0; j < inData[i].values.length; ++j)
        {
            let octave = parseFloat(inData[i].values[j].key);
            let count  = inData[i].values[j].value;
            //this value 
            
            for(let k = -20; k <= 20; ++k)
            {
                let currentOctave = octave + k * 0.02;
                let up = currentOctave - octave;
                up = up * up;
                const sigma = 0.1;
                let down = 2.0 * sigma * sigma;
                let temp = - up / down;
                let currentCount = count * Math.exp(temp);

                let obj = {key : currentOctave.toString(), value : currentCount};
                myArray.push(obj);
            }
        }

        let obj = {key: inData[i].key, values: myArray};
        outData.push(obj);
    }

    console.log(outData);

    return outData;
}

window.addEventListener("load", () => {
    let margin = {top: 30, right: 30, bottom: 30, left: 30};

    let totalWidth = 300;
    let totalHeight = 150;

    let fullPlotWidth = 800;
    let fullPlotHeight = 800;

    let width  = totalWidth - margin.left - margin.right;
    let height = totalHeight - margin.top - margin.bottom;


    // asynchronous function, returns immediately
    let temp = d3.csv("data/Hallelujah.csv");

    // once the large csv file is loaded into memory
    temp.then((myData) => {
        // myProcessedData transforms data into the following form:
        // note_name --- octave --- count
        // both note_name and octave are sorted in ascending order
        //rollup: count the number of elements by its category, groups and reduces the specified iterable of values into a Map from key to value.
        let myProcessedData = d3.nest()
            .key((d) => { return d.note_name;}).sortKeys(d3.ascending)
            .key((d) => { return parseFloat(d.octave);}).sortKeys(d3.ascending)
            .rollup((v) => { return v.length;}) //only returns the value
            //d3.rollup(data, v => v.length, d => d.name) return both key(name) and value: Map(3) {"key" => value}
            .entries(myData); //mandated entries() method after nest()

        console.log(myProcessedData);
        myProcessedData = gaussianize(myProcessedData);

        // get an array of all note_names
        let allNoteNames = myProcessedData.map((d) => { return d.key; });

        // get global min and max octave and count values
        let minOctave = 100000;
        let maxOctave = 0;
        let minCount  = 100000;
        let maxCount  = 0;

        for(let i = 0; i < myProcessedData.length; ++i)
        {
            for(let j = 0; j < myProcessedData[i].values.length; ++j)
            {
                let octave = parseFloat(myProcessedData[i].values[j].key);
                if(octave < minOctave)
                {
                    minOctave = octave;
                }

                if(octave > maxOctave)
                {
                    maxOctave = octave;
                }

                let count = myProcessedData[i].values[j].value;

                if(count < minCount)
                {
                    minCount = count;
                }

                if(count > maxCount)
                {
                    maxCount = count;
                }
            }
        }

        console.log("minOctave = ", minOctave );
        console.log("maxOctave = ", maxOctave );
        console.log("minCount  = ", minCount  );
        console.log("maxCount  = ", maxCount  );

        // predefine color schemes
        function pickColor(index)
        {
            // const predefinedColors = ["#e6194b",
                                      // "#f58231",
                                      // "#ffe119",
                                      // "#bfef45",
                                      // "#3cb44b",
                                      // "#42d4f4",
                                      // "#4363d8",
                                      // "#911eb4",
                                      // "#f032e6",
                                      // "#aaffc3",
                                      // "#e6beff",
                                      // "#fabebe"];
            const predefinedColors = ["#1abc9c"];
            let colorIdx = index % predefinedColors.length;
            //this way the colorIdx won't exceed the total length of the predefined array
            return predefinedColors[colorIdx];
        }

        // plot
        let xScale = d3.scaleLinear()
                       .domain([minOctave, maxOctave])
                       .range([0, width]);

        let yScale = d3.scaleLinear()
                       .domain([minCount, maxCount])
                       .range([height, 0]);

        // here the d parameter in (d) refers to the element
        // {key: octave, value: count}
        // let lineGenerator = d3.line()
                        // .x(function(d) {
                            // return xScale(parseFloat(d.key));
                        // })
                        // .y(function(d) {
                            // return yScale(d.value);
                        // });

        let areaGenerator = d3.area()
                        .x(function(d) {
                            return xScale(parseFloat(d.key));
                        })
                        .y1(function(d) {
                            return yScale(d.value);
                        })
                        .y0(yScale(0.0));

        let svgsDrawingArea = d3.select("#plot-div")
                   .append("svg")
                     .attr("width", fullPlotWidth)
                     .attr("height", fullPlotHeight);

        // svgs.selectAll(".XXX") results in
        // _groups (1 element)
        //     NodeList (empty NodeList array)
        // svgs.select(".XXX") results in
        // _groups (1 element)
        //     [] (empty array)
        // _groups (1 element)
        //     [path, ...] (an array of path objects)
        let mySelect = svgsDrawingArea.selectAll(".my-area");

        // axis
        let xAxis = d3.axisBottom(xScale)
                      .ticks(maxOctave - minOctave + 1);
        let yAxis = d3.axisLeft(yScale);


        let mySvgs = mySelect
            .data(myProcessedData)
            .enter()
            .append("g")
              .attr("width", totalWidth)
              .attr("height", totalHeight)
              .attr("transform", (d, i) => {
                    let rotateAngle = 360.0 / myProcessedData.length * i;
                    let xTranslate = fullPlotWidth / 2;
                    let yTranslate = fullPlotHeight / 2 - totalHeight;
                    return "translate(" + xTranslate + ", " + yTranslate + ") rotate(" + rotateAngle +" 0 " + totalHeight + ")";
                    //rotate followed by three parameters: 1.rotate angle 2.x coordinate 3.y coordinate(totalHeight is yAxis 0 coordinate)
              });

        mySvgs.append("text")
              .text((d, i) => {
                  return allNoteNames[i];
              })
              .attr("transform", "translate(" + totalWidth + "," + (margin.top + height) + ")");

        mySvgs.append("g")
              .attr("transform", "translate(" + margin.left + "," + (margin.top + height) + ")")
              .call(xAxis);

        // mySvgs.append("g")
              // .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
              // .call(yAxis);

        let areaPlots = mySvgs.append("g")
                          .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                          .append("path");
                          //"path" is a virtual placeholder for later to generate path

        let domResult = document.querySelector("#plot-div");
        //querySelector needs to be distinguished with selectAll, it return the real thing(first Element within the document that matches the specified selector, or group of selectors).

        // set up areaPlots
        // here the d parameter in (d) refers to the element
        // {key: note_name, values: [obj1, obj2 ...]}
        // where obj is {key: octave, value: count}
        
        areaPlots.attr("d", (d, i) => { // define path details https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths
                        let areaData = areaGenerator(d.values);
                        return areaData;
                    })
              /* .attr("stroke", (d, i) => { // each line is assigned a predefined color
                    let color = pickColor(i); //not []!
                    //console.log(color);
                    return color;
              })
              .attr("stroke-width", 1) */
              .attr("fill", (d, i) => { // each area is assigned a predefined color
                    let color = pickColor(i);
                    return color;
              })
/*               .attr("stroke-linecap", "round")
              .attr("stroke-linejoin", "round"); */

    }); // end then()
}); // end addEventListener()

} // end scope

