
// main.js

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
      this.buildForm(this.configOptions);
      this.addEventListeners();
    } catch (error) {
      console.error('Error initializing GameConfig:', error);
      this.form.innerHTML = '<p>Error loading configuration.</p>';
    }
  }

  async fetchConfig() {
    const response = await fetch(this.configUrl);
    if (!response.ok) {
      throw new Error('Failed to load configuration.');
    }
    return response.json();
  }

  buildForm(options) {
    for (const [key, option] of Object.entries(options)) {
      const formGroup = document.createElement('div');
      formGroup.className = 'form-group';
      formGroup.id = `group-${key}`;

      if (option.type === 'select') {
        // Create and append label
        const label = document.createElement('label');
        label.htmlFor = key;
        label.textContent = option.label;
        formGroup.appendChild(label);

        const select = document.createElement('select');
        select.id = key;
        select.name = key;

        // Handle dependencies that affect options, e.g., map based on player count
        if (option.dependency && option.dependency.type === 'mapBasedOnPlayers') {
          const sourceValue = options[option.dependency.source].default;
          const dependentOptions = option.dependency.mapping[sourceValue] || [];
          dependentOptions.forEach(map => {
            const opt = document.createElement('option');
            opt.value = map.value;
            opt.textContent = map.label;
            select.appendChild(opt);
          });
          // Set default value
          if (dependentOptions.length > 0) {
            select.value = dependentOptions[0].value;
          }
        } else {
          option.options.forEach(opt => {
            const optionElement = document.createElement('option');
            optionElement.value = opt.value;
            optionElement.textContent = opt.label;
            if (opt.value === option.default) {
              optionElement.selected = true;
            }
            select.appendChild(optionElement);
          });
        }

        formGroup.appendChild(select);
      }
      else if (option.type === 'checkbox') {
        // Create a container div for checkbox and label
        const checkboxContainer = document.createElement('div');
        checkboxContainer.style.display = 'flex';
        checkboxContainer.style.alignItems = 'center';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = key;
        checkbox.name = key;
        checkbox.checked = option.default;

        const checkboxLabel = document.createElement('label');
        checkboxLabel.htmlFor = key;
        checkboxLabel.textContent = option.label;
        checkboxLabel.style.marginLeft = '10px'; // Add spacing between checkbox and label

        checkboxContainer.appendChild(checkbox);
        checkboxContainer.appendChild(checkboxLabel);

        formGroup.appendChild(checkboxContainer);
      }
      else if (option.type === 'checkboxGroup') {
        // Create and append label
        const label = document.createElement('label');
        label.htmlFor = key;
        label.textContent = option.label;
        formGroup.appendChild(label);

        const checkboxGroupDiv = document.createElement('div');
        checkboxGroupDiv.className = 'checkboxGroup';

        option.options.forEach(opt => {
          const checkboxDiv = document.createElement('div');

          const checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          checkbox.id = `${key}-${opt.value}`;
          checkbox.name = key;
          checkbox.value = opt.value;

          const checkboxLabel = document.createElement('label');
          checkboxLabel.htmlFor = `${key}-${opt.value}`;
          checkboxLabel.textContent = opt.label;

          checkboxDiv.appendChild(checkbox);
          checkboxDiv.appendChild(checkboxLabel);
          checkboxGroupDiv.appendChild(checkboxDiv);
        });

        formGroup.appendChild(checkboxGroupDiv);

        // Initially hide or show based on the dependency
        if (option.visible === false) {
          formGroup.classList.add('hidden');
        }
      }

      this.form.appendChild(formGroup);
    }
  }

  addEventListeners() {
    // Handle player count change to update map options
    const playerCountSelect = document.getElementById('playerCount');
    if (playerCountSelect) {
      playerCountSelect.addEventListener('change', (event) => this.handlePlayerCountChange(event));
    }

    // Handle power-ups toggle to show/hide power-up options
    const powerUpsCheckbox = document.getElementById('powerUps');
    if (powerUpsCheckbox) {
      powerUpsCheckbox.addEventListener('change', (event) => this.handlePowerUpsToggle(event));
      // Initialize visibility based on default state
      this.handlePowerUpsToggle({ target: powerUpsCheckbox });
    }

    // Attach event listener to start button
    this.startButton.addEventListener('click', () => this.startGame());
  }

  handlePlayerCountChange(event) {
    const selectedPlayers = event.target.value;
    const mapOption = this.configOptions['map'];
    const mapSelect = document.getElementById('map');

    if (!mapSelect) return;

    // Clear existing options
    mapSelect.innerHTML = '';

    // Populate based on the selected player count
    const availableMaps = mapOption.dependency.mapping[selectedPlayers] || [];
    availableMaps.forEach(map => {
      const opt = document.createElement('option');
      opt.value = map.value;
      opt.textContent = map.label;
      mapSelect.appendChild(opt);
    });

    // Optionally, set a default value
    if (availableMaps.length > 0) {
      mapSelect.value = availableMaps[0].value;
    }
  }

  handlePowerUpsToggle(event) {
    const isChecked = event.target.checked;
    const powerUpOptionsGroup = document.getElementById('group-powerUpOptions'); // Corrected ID

    if (!powerUpOptionsGroup) {
      console.error('group-powerUpOptions element not found.');
      return;
    }

    if (isChecked) {
      powerUpOptionsGroup.classList.remove('hidden');
    } else {
      powerUpOptionsGroup.classList.add('hidden');
      // Optionally, uncheck all power-up options
      const checkboxes = powerUpOptionsGroup.querySelectorAll('input[type="checkbox"]');
      checkboxes.forEach(cb => cb.checked = false);
    }
  }

  getFormData() {
    const formData = {};

    for (const [key, option] of Object.entries(this.configOptions)) {
      if (option.type === 'select') {
        const select = document.getElementById(key);
        formData[key] = select ? select.value : null;
      }
      else if (option.type === 'checkbox') {
        const checkbox = document.getElementById(key);
        formData[key] = checkbox ? checkbox.checked : false;
      }
      else if (option.type === 'checkboxGroup') {
        const checkboxes = document.querySelectorAll(`input[name="${key}"]:checked`);
        formData[key] = Array.from(checkboxes).map(cb => cb.value);
      }
    }

    return formData;
  }

  startGame() {
    this.selectedConfig = this.getFormData();

    // Validation: Ensure that if power-ups are enabled, at least one is selected
    if (this.selectedConfig.powerUps && (!this.selectedConfig.powerUpOptions || this.selectedConfig.powerUpOptions.length === 0)) {
      alert('Please select at least one power-up or disable power-ups.');
      return;
    }

    console.log('Selected Configuration:', this.selectedConfig);
    // Hide the configuration panel
    document.getElementById('configPanel').style.display = 'none';

    // Initialize the game with the selected configuration
    initializeGame(this.selectedConfig);
  }
}

// Example game initialization function
function initializeGame(config) {
  // Your game initialization logic here
  // For demonstration, we'll just log the config and show an alert
  console.log('Initializing game with configuration:', config);
  alert('Game is initializing with your selected configuration. Check the console for details.');

  // Here you can integrate your Three.js game setup using the config object
  // Example:
  // new Game(config);
}

// Initialize the GameConfig once the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  const gameConfig = new GameConfig('gameConfigForm', 'startButton', '../static/js/gameSettings/configOptions.json');
});

