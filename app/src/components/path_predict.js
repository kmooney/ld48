import { Component, Types } from "ecsy"

export class PredictorComponent extends Component {}
PredictorComponent.schema = {
    ticks: { type: Types.Number, default: 120 },
    delta: { type: Types.Number, default: 1/60 },
    geom_buffer: { type: Types.Ref },
}