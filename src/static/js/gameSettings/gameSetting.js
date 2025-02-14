import initializeGame from "./startGame.js";

class GameConfig {
  constructor(formId, startButtonId, configUrl) {
    this.form = document.getElementById(formId);
    this.startButton = document.getElementById(startButtonId);
    this.configUrl = configUrl;
    this.configOptions = {};
    this.selectedConfig = {};

    this.init();
  }

  async init() {
    try {
      this.configOptions = await this.fetchConfig();
      this.buildForm();
      this.addEventListeners();
    } catch (error) {
      console.error('Error initializing GameConfig:', error);
      this.form.innerHTML = '<p>Error loading configuration.</p>';
    }
  }

  async fetchConfig() {
    const response = await fetch(this.configUrl);
    if (!response.ok) throw new Error('Failed to load configuration.');
    return response.json();
  }

  buildForm() {
    Object.entries(this.configOptions).forEach(([key, option]) => {
      const formGroup = this.createFormGroup(key, option);
      this.form.appendChild(formGroup);
    });
  }

  createFormGroup(key, option) {
    const formGroup = document.createElement('div');
    formGroup.className = 'form-group';
    formGroup.id = `group-${key}`;

    if (option.type === 'select') {
      formGroup.appendChild(this.createLabel(key, option.label));
      formGroup.appendChild(this.createSelect(key, option));
    } else if (option.type === 'checkbox') {
      formGroup.appendChild(this.createCheckbox(key, option));
    } else if (option.type === 'checkboxGroup') {
      formGroup.appendChild(this.createLabel(key, option.label));
      formGroup.appendChild(this.createCheckboxGroup(key, option));
      if (!option.visible) formGroup.classList.add('hidden');
    }

    return formGroup;
  }

  createLabel(forId, text) {
    const label = document.createElement('label');
    label.htmlFor = forId;
    label.textContent = text;
    return label;
  }

  createSelect(id, option) {
    const select = document.createElement('select');
    select.id = id;
    select.name = id;

    const options = option.dependency?.type === 'mapBasedOnPlayers'
      ? option.dependency.mapping[this.configOptions[option.dependency.source].default] || []
      : option.options;

    options.forEach(opt => {
      const optionElement = document.createElement('option');
      optionElement.value = opt.value;
      optionElement.textContent = opt.label;
      if (opt.value === option.default) optionElement.selected = true;
      select.appendChild(optionElement);
    });
    return select;
  }

  createCheckbox(id, option) {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.alignItems = 'center';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = id;
    checkbox.name = id;
    checkbox.checked = option.default;

    const label = this.createLabel(id, option.label);
    label.style.marginLeft = '10px';

    container.appendChild(checkbox);
    container.appendChild(label);
    return container;
  }

  createCheckboxGroup(id, option) {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'checkboxGroup';

    option.options.forEach(opt => {
      const checkboxDiv = document.createElement('div');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `${id}-${opt.value}`;
      checkbox.name = id;
      checkbox.value = opt.value;

      const label = this.createLabel(`${id}-${opt.value}`, opt.label);

      checkboxDiv.appendChild(checkbox);
      checkboxDiv.appendChild(label);
      groupDiv.appendChild(checkboxDiv);
    });
    return groupDiv;
  }

  addEventListeners() {
    document.getElementById('playerCount')?.addEventListener('change', e => this.handlePlayerCountChange(e));
    const powerUpsCheckbox = document.getElementById('powerUps');
    if (powerUpsCheckbox) {
      powerUpsCheckbox.addEventListener('change', e => this.handlePowerUpsToggle(e));
      this.handlePowerUpsToggle({ target: powerUpsCheckbox });
    }
    this.startButton.addEventListener('click', () => this.startGame());
  }

  handlePlayerCountChange(event) {
    const selectedPlayers = event.target.value;
    const mapSelect = document.getElementById('map');
    if (!mapSelect) return;

    mapSelect.innerHTML = '';
    (this.configOptions['map'].dependency.mapping[selectedPlayers] || []).forEach(map => {
      const opt = document.createElement('option');
      opt.value = map.value;
      opt.textContent = map.label;
      mapSelect.appendChild(opt);
    });
    mapSelect.value = mapSelect.options[0]?.value || '';
  }

  handlePowerUpsToggle(event) {
    const group = document.getElementById('group-powerUpOptions');
    if (!group) return console.error('group-powerUpOptions element not found.');
    group.classList.toggle('hidden', !event.target.checked);
    if (!event.target.checked) group.querySelectorAll('input[type="checkbox"]').forEach(cb => (cb.checked = false));
  }

  getFormData() {
    return Object.entries(this.configOptions).reduce((formData, [key, option]) => {
      if (option.type === 'select') {
        formData[key] = document.getElementById(key)?.value || null;
      } else if (option.type === 'checkbox') {
        formData[key] = document.getElementById(key)?.checked || false;
      } else if (option.type === 'checkboxGroup') {
        formData[key] = Array.from(document.querySelectorAll(`input[name="${key}"]:checked`)).map(cb => cb.value);
      }
      return formData;
    }, {});
  }

  startGame() {
    this.selectedConfig = this.getFormData();
    if (this.selectedConfig.powerUps && (!this.selectedConfig.powerUpOptions || this.selectedConfig.powerUpOptions.length === 0)) {
      alert('Please select at least one power-up or disable power-ups.');
      return;
    }
    console.log('Selected Configuration:', this.selectedConfig);
    document.getElementById('configPanel').style.display = 'none';
    initializeGame(this.selectedConfig);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new GameConfig('gameConfigForm', 'startButton', '../static/js/gameSettings/configOptions.json');
});


