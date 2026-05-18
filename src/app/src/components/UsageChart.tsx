import FusionCharts from "fusioncharts";
import Charts from "fusioncharts/fusioncharts.charts";
import ReactFCModule from "react-fusioncharts";
import FusionTheme from "fusioncharts/themes/fusioncharts.theme.fusion";


const ReactFC = (ReactFCModule as any).default || ReactFCModule;


const fcRoot = ReactFC.fcRoot || (ReactFCModule as any).fcRoot;
if (typeof fcRoot === "function") {
  fcRoot(FusionCharts, Charts, FusionTheme);
} else {
  console.warn("FusionCharts fcRoot not found");
}

interface UsageChartProps {
  data: { label: string; value: number }[];
  title: string;
  subTitle?: string;
  type?: string;
}

const UsageChart: React.FC<UsageChartProps> = ({ 
  data, 
  title, 
  subTitle = "Energy Consumption (kWh)", 
  type = "splinearea" 
}) => {
  const safeData = data
    .filter(d => isFinite(d.value) && !isNaN(d.value))
    .map(d => ({ label: d.label, value: d.value }));

  const chartConfigs = {
    type: type,
    width: "100%",
    height: "400",
    dataFormat: "json",
    dataSource: {
      chart: {
        caption: title,
        subCaption: subTitle,
        xAxisName: "Time",
        yAxisName: "Usage (kWh)",
        theme: "fusion",
        bgColor: "#030014",
        bgAlpha: "0",
        canvasBgAlpha: "0",
        baseFontColor: "#ffffff",
        outCnvBaseFontColor: "#ffffff",
        divLineColor: "#ffffff",
        divLineAlpha: "20",
        showValues: "1",
        valueFontColor: "#ffffff",
        placeValuesInside: "0",
        rotateValues: "0",
        toolTipBgColor: "#030014",
        toolTipColor: "#ffffff",
        toolTipBorderColor: "#A78BFA",
        toolTipPadding: "10",
        toolTipBorderRadius: "8",
        paletteColors: "#A78BFA, #22D3EE",
        labelDisplay: "rotate",
        slantLabels: "1",
        showAlternateHGridColor: "0",
        plotFillAlpha: "40",
        usePlotGradientColor: "1",
        plotGradientColor: "#ffffff",
        plotFillColor: "#A78BFA",
        animation: "1",
        showHoverEffect: "1",
        drawCrossLine: "1",
        crossLineColor: "#A78BFA",
        crossLineAlpha: "30"
      },
      data: safeData
    }
  };

  return (
    <div className="glass-card p-4 premium-shadow">
      {/* @ts-ignore - FusionCharts types compatibility with React 19 */}
      <ReactFC {...chartConfigs} />
    </div>
  );
};

export default UsageChart;
