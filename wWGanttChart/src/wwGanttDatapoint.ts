import PrimitiveValue = powerbi.PrimitiveValue;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;

export interface WWGanttDatapoint {
    duration: PrimitiveValue;
    task: string;
}

/**
 * Function that converts queried data into a viewmodel that will be used by the visual.
 *
 * @function
 * @param {VisualUpdateOptions} options - Contains references to the size of the container
 *                                        and the dataView which contains all the data
 *                                        the visual had queried.
 */
export function createSelectorDataPoints(options: VisualUpdateOptions): WWGanttDatapoint[] {
    const wwGantDatapoints: WWGanttDatapoint[] = []
    const dataViews = options.dataViews;

    if (!dataViews
        || !dataViews[0]
        || !dataViews[0].categorical
        || !dataViews[0].categorical.categories
        || !dataViews[0].categorical.categories[0].source
        || !dataViews[0].categorical.values
    ) {
        return wwGantDatapoints;
    }

    const categorical = dataViews[0].categorical;
    const category = categorical.categories[0];
    const dataValue = categorical.values[0];

    for (let i = 0, len = Math.max(category.values.length, dataValue.values.length); i < len; i++) {
        wwGantDatapoints.push({
            duration: dataValue.values[i],
            task: `${category.values[i]}`,
        });
    }

    return wwGantDatapoints;
}