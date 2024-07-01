import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import { WWGanttDatapoint } from "./wwGanttDatapoint";

import Card = formattingSettings.SimpleCard;
import Model = formattingSettings.Model;
import Slice = formattingSettings.Slice;
import ColorPicker = formattingSettings.ColorPicker;
import ToggleSwitch = formattingSettings.ToggleSwitch;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;


/**
 * Enable Axis Formatting Card
 */
class EnableAxisCardSettings extends Card {
    show = new ToggleSwitch({
        name: "show",
        displayName: undefined,
        value: true,
    });

    fill = new ColorPicker({
        name: "fill",
        displayName: "Color",
        value: { value: "#000000" }
    });
    topLevelSlice: ToggleSwitch = this.show;
    name: string = "enableAxis";
    displayName: string = "Enable Axis";
    slices: Slice[] = [this.fill];
}

/**
 * Color Selector Formatting Card
 */
class ColorSelectorCardSettings extends Card {
    name: string = "colorSelector";
    displayName: string = "Data Colors";

    // slices will be populated in barChart settings model `populateColorSelector` method
    slices: Slice[] = [];
}

/**
* BarChart formatting settings model class
*/
export class WWGanttChartSettingsModel extends Model {
    // Create formatting settings model formatting cards
    enableAxis = new EnableAxisCardSettings();
    colorSelector = new ColorSelectorCardSettings();
    cards: Card[] = [this.enableAxis, this.colorSelector];

    /**
     * populate colorSelector object categories formatting properties
     * @param dataPoints 
     */
    populateColorSelector(dataPoints: WWGanttDatapoint[], options: VisualUpdateOptions, host: IVisualHost) {
        const slices: Slice[] = this.colorSelector.slices;

        const colorPalette = host.colorPalette;

        const dataViews = options.dataViews;

        if (!dataViews
            || !dataViews[0]
            || !dataViews[0].categorical
            || !dataViews[0].categorical.categories
            || !dataViews[0].categorical.categories[0].source
            || !dataViews[0].categorical.values
        ) {
            return;
        }
    
        const categorical = dataViews[0].categorical;
        const category = categorical.categories[0];

        if (dataPoints) {
            dataPoints.forEach((dataPoint, i) => {
                slices.push(new ColorPicker({
                    name: "fill",
                    displayName: dataPoint.task,
                    value: colorPalette.getColor(`${category.values[0]}`),
                    selector: host.createSelectionIdBuilder()
                        .withCategory(category, i)
                        .createSelectionId().getSelector(),
                }));
            });
        }
    }
}