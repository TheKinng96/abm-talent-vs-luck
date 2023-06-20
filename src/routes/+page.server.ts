// Learning purposes
import type { Actions, PageServerLoad } from './$types';

type Note = {
	title: string;
	content?: string;
};

let notes: Note[] = [
	{
		title: 'Progressive Enhancement',
		content: 'use:enhance is cool 👍'
	}
];

export const load: PageServerLoad = () => {
	return {
		notes
	};
};

export const actions: Actions = {
	create: async ({ request }) => {
		console.log('Hit action');
		const data = Object.fromEntries(await request.formData()) as Note;

		notes.push(data);

		return {
			data: undefined,
			errorMsg: undefined
		};
	},
	delete: async ({ request }) => {
		const data = Object.fromEntries(await request.formData()) as Note;

		notes = notes.filter((note) => note.title !== data.title);

		return {
			data: undefined,
			errorMsg: undefined
		};
	}
};
