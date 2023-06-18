export interface IHistory extends IHistoryCreate {
	id?: string;
}

export interface IHistoryCreate {
	agent_id: string;
	event_id: string;
	round: number;
	agent_asset: number;
	agent_skill_level: number;
}
