import * as React from "react";
import "../node_modules/react-vis/dist/style.css";
import {
  XYPlot,
  XAxis,
  YAxis,
  VerticalGridLines,
  HorizontalGridLines,
  VerticalBarSeries,
  makeWidthFlexible,
} from "react-vis";

const Chart = ({ data }) => {
  const Plot = makeWidthFlexible(XYPlot);
  return (
    <Plot xType="ordinal" height={300}>
      <VerticalGridLines />
      <HorizontalGridLines />
      <XAxis
        tickFormat={(value) =>
          value.split("-")[1] === "01"
            ? value.split("-")[0]
            : data.length < 13
            ? value.split("-")[1]
            : ""
        }
      />
      <YAxis />
      <VerticalBarSeries data={data} />
      {/* <LabelSeries data={data} getLabel={d => d.x} /> */}
    </Plot>
  );
};

export default Chart;
