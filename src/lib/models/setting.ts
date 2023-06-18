export interface ISetting {
	id?: string;
	created_at?: Date;
	current_round: number;
	has_ended: boolean;
	number_of_agents: number;
	number_of_rounds: number;
	number_of_good_events: number;
	number_of_bad_events: number;
	range_of_skill_levels: number[];
	range_of_assets: number[];
	range_of_positions: number[];
	range_of_duplicators: number[];
}
