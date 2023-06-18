import type { IPosition } from './agent';

export interface IEvent extends IEventRequest {
	id?: string;
}

export interface IEventRequest {
	duplicator: number;
	luck_event: 'bad' | 'good';
	positions: IPosition[];
}
