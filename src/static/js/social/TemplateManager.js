export class TemplateManager {
	constructor() {
		this.templateCache = {};
	}

	/**
	 * Clone a template by ID
	 * @param {string} templateId - The ID of the template to clone
	 * @returns {DocumentFragment} The cloned template content
	 */
	clone(templateId) {
		if (!this.templateCache[templateId]) {
			const element = document.getElementById(templateId);

			// If template doesn't exist, log error and return empty fragment
			if (!element) {
				console.error(`Template not found: ${templateId}`);
				return document.createDocumentFragment();
			}

			this.templateCache[templateId] = element;
		}

		return this.templateCache[templateId].content.cloneNode(true);
	}

	/**
	 * Fill a template with data
	 * @param {string} templateId - The ID of the template to use
	 * @param {Object} data - The data to fill the template with
	 * @returns {DocumentFragment} The filled template content
	 */
	fill(templateId, data) {
		const fragment = this.clone(templateId);

		// Find all elements with data-field attribute
		const fields = fragment.querySelectorAll('[data-field]');

		// Fill each field with the corresponding data
		fields.forEach(field => {
			const fieldName = field.getAttribute('data-field');

			if (data[fieldName] !== undefined) {
				if (field.tagName === 'IMG') {
					field.setAttribute('src', data[fieldName]);
					field.setAttribute('alt', `${data[fieldName]}'s avatar`);
				}
				field.textContent = data[fieldName];
			} else {
				field.textContent = 'undefined';
			}
		});

		return fragment;
	}

	/**
	 * Clear the template cache
	 */
	clearCache() {
		this.templateCache = {};
	}
}