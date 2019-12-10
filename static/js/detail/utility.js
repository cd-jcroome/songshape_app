
//------------------------------------------------------------
// return an index such that csvData[0, index - 1] is used for visualization
//------------------------------------------------------------
export function findUpperBoundTimeIndex(currentTimeInSec, csvData)
{
    let index = 0;

    for(; index < csvData.length; ++index)
    {
        let rowTime = parseFloat(csvData[index]["note_time"]) / 1000.0;
        if (currentTimeInSec < rowTime)
        {
            break;
        }
    }

    return index;
}

//------------------------------------------------------------
//------------------------------------------------------------
export function findExtrema(myData)
{
    let minOctave = 100000;
    let maxOctave = 0;
    let minCount  = 100000;
    let maxCount  = 0;

    for(let i = 0; i < myData.length; ++i)
    {
        for(let j = 0; j < myData[i].values.length; ++j)
        {
            let octave = parseFloat(myData[i].values[j].key);
            if(octave < minOctave)
            {
                minOctave = octave;
            }

            if(octave > maxOctave)
            {
                maxOctave = octave;
            }

            let count = myData[i].values[j].value;

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

    return {"minOctave" : minOctave,
            "maxOctave" : maxOctave,
            "minCount"  : minCount ,
            "maxCount"  : maxCount};

}

//------------------------------------------------------------
//------------------------------------------------------------
export function findMaxCountInterval(myData)
{
    let maxCount = -1;

    myData.forEach((d, i, dSelfArray) => {
        d["octaveList"].forEach((dd, j, ddSelfArray) => {
            dd["octaveData"].forEach((ddd) => {
                if(ddd["countInterval"] > maxCount)
                {
                    maxCount = ddd["countInterval"];
                }
            });
        });
    });

    if(maxCount == 0)
    {
        maxCount = 1;
    }

    return maxCount;
}

//------------------------------------------------------------
// predefine color schemes
//------------------------------------------------------------
export function pickColor(index)
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

    const predefinedColors = ["#374785",
                            "#5AB9EA",
                            "#84CEEB",
                            "#EDC787",
                            "#E98074",
                            "#F76C6C",
                            "#C96567"];

    let colorIdx = index % predefinedColors.length;
    return predefinedColors[colorIdx];
}