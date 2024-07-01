"use strict";

import {
    BaseType,
    select as d3Select,
    Selection as d3Selection
} from "d3-selection";
import {
    ScaleBand,
    ScaleLinear,
    scaleBand,
    scaleLinear
} from "d3-scale";
import "./../style/visual.less";

import { Axis, axisBottom } from "d3-axis";

import powerbi from "powerbi-visuals-api";

type Selection<T extends BaseType> = d3Selection<T, any, any, any>;

import IVisual = powerbi.extensibility.IVisual;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import ISandboxExtendedColorPalette = powerbi.extensibility.ISandboxExtendedColorPalette;

import { textMeasurementService } from "powerbi-visuals-utils-formattingutils";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";

import { WWGanttChartSettingsModel } from "./wwGanttChartSettingsModel";
import { WWGanttDatapoint, createSelectorDataPoints } from "./wwGanttDatapoint";

export class WWGanttChart implements IVisual {
    private svg: Selection<SVGSVGElement>;
    private host: IVisualHost;
    private barContainer: Selection<SVGElement>;
    private xAxis: Selection<SVGGElement>;
    private wwGanttDatapoints: WWGanttDatapoint[];
    private formattingSettings: WWGanttChartSettingsModel;
    private formattingSettingsService: FormattingSettingsService;

    private barSelection: Selection<BaseType>;

    static Config = {
        xScalePadding: 0.1,
        solidOpacity: 1,
        transparentOpacity: 1,
        margins: {
            top: 0,
            right: 0,
            bottom: 25,
            left: 30,
        },
        xAxisFontMultiplier: 0.04,
    };

    constructor(options: VisualConstructorOptions) {
        this.host = options.host;
        //Creating the formatting settings service.
        const localizationManager = this.host.createLocalizationManager();
        this.formattingSettingsService = new FormattingSettingsService(localizationManager);

        this.svg = d3Select(options.element)
            .append('svg')
            .classed('WWGanttChart', true);

        this.barContainer = this.svg
            .append('g')
            .classed('barContainer', true);

        this.xAxis = this.svg
            .append('g')
            .classed('xAxis', true);
    }

    private constructChart(options: VisualUpdateOptions) {
        const width = options.viewport.width;
        const height = this.formattingSettings.enableAxis.show.value ? options.viewport.height : options.viewport.height - WWGanttChart.Config.margins.bottom;

        this.svg
            .attr("width", width)
            .attr("height", height);

        this.xAxis
            .style("font-size", Math.min(height, width) * WWGanttChart.Config.xAxisFontMultiplier)
            .style("fill", this.formattingSettings.enableAxis.fill.value.value);

        const yScale: ScaleLinear<number, number> = scaleLinear()
            .domain([0, <number>options.dataViews[0].categorical.values[0].maxLocal])
            .range([height, 0]);

        const xScale: ScaleBand<string> = scaleBand()
            .domain(this.wwGanttDatapoints.map(d => d.task))
            .rangeRound([0, width])
            .padding(0.2);

        const xAxis: Axis<string> = axisBottom(xScale);

        this.xAxis.attr('transform', 'translate(0, ' + height + ')')
            .call(xAxis)
            .attr("color", this.formattingSettings.enableAxis.fill.value.value);

        const textNodes: Selection<SVGElement> = this.xAxis.selectAll("text");
        WWGanttChart.wordBreak(textNodes, xScale.bandwidth(), height);

        return { width, height, xScale, yScale };
    }

    private getBarGraphicData() {
        const colorPalette: ISandboxExtendedColorPalette = this.host.colorPalette;
        
        const color: string = colorPalette.getColor("0").value;
    
        const strokeWidth: number = colorPalette.isHighContrast ? 2 : 0;
        return {color, strokeWidth};
    }

    private initData(options: VisualUpdateOptions) {
        this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(WWGanttChartSettingsModel, options.dataViews?.[0]);
        this.wwGanttDatapoints = createSelectorDataPoints(options);
        this.formattingSettings.populateColorSelector(this.wwGanttDatapoints, options, this.host);
    }
    
    private setupBars(height: number, xScale: ScaleBand<string>, yScale: ScaleLinear<number, number>) {  
        this.barSelection = this.barContainer
            .selectAll('.bar')
            .data(this.wwGanttDatapoints);

        const barSelectionMerged = this.barSelection
            .enter()
            .append('rect')
            .merge(<any>this.barSelection);

        barSelectionMerged.classed('bar', true);

        const {color, strokeWidth} = this.getBarGraphicData();

        barSelectionMerged
            .attr("width", xScale.bandwidth())
            .attr("height", (dataPoint: WWGanttDatapoint) => height - yScale(<number>dataPoint.duration))
            .attr("y", (dataPoint: WWGanttDatapoint) => yScale(<number>dataPoint.duration))
            .attr("x", (dataPoint: WWGanttDatapoint) => xScale(dataPoint.task))
            .style("fill", color)
            .style("stroke", color)
            .style("stroke-width", `${strokeWidth}px`);

        this.barSelection
            .exit()
            .remove();
    }

    public update(options: VisualUpdateOptions) {
        this.initData(options);
        const { height, xScale, yScale } = this.constructChart(options);   
        this.setupBars(height, xScale, yScale);
    }

    private static wordBreak(
        textNodes: Selection<SVGElement>,
        allowedWidth: number,
        maxHeight: number
    ) {
        textNodes.each(function () {
            textMeasurementService.wordBreak(
                this,
                allowedWidth,
                maxHeight);
        });
    }

    /**
     * Returns properties pane formatting model content hierarchies, properties and latest formatting values, Then populate properties pane.
     * This method is called once every time we open properties pane or when the user edit any format property. 
     */
    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }
}