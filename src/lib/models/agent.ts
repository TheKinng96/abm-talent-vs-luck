export interface IAgent extends IAgentCreate {
	id?: string;
}

export interface IAgentCreate {
	skill_level: number;
	asset: number;
	positions: IPosition[];
	name?: string;
}

export interface IPosition {
	x: number;
	y: number;
}
